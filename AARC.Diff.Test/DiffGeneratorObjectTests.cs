using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff.Test;

public class DiffGeneratorObjectTests
{
    [Fact]
    public void Diff_Object_SameProperties_NoDiff()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""A"", ""value"": 1 }";
        var newJson = @"{ ""name"": ""A"", ""value"": 1 }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - 属性值相同，不产生差异
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_Object_PropertyModified_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""A"", ""value"": 1 }";
        var newJson = @"{ ""name"": ""A"", ""value"": 2 }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var valueDiff = result["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(1, valueDiff["old"]?.GetValue<long>());
        Assert.Equal(2, valueDiff["new"]?.GetValue<long>());
        
        // name 没有变化
        Assert.Null(result["name"]);
    }

    [Fact]
    public void Diff_Object_MultiplePropertiesModified_RecordsAllChanges()
    {
        // Arrange
        var oldJson = @"{ ""a"": 1, ""b"": 2, ""c"": 3 }";
        var newJson = @"{ ""a"": 10, ""b"": 2, ""c"": 30 }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - a 和 c 变化，b 不变
        Assert.NotNull(result["a"]);
        Assert.Null(result["b"]);
        Assert.NotNull(result["c"]);
        
        var aDiff = result["a"] as JsonObject;
        Assert.Equal(1, aDiff?["old"]?.GetValue<long>());
        Assert.Equal(10, aDiff?["new"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_Object_PropertyRemoved_RecordsOldValue()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""A"", ""value"": 1 }";
        var newJson = @"{ ""name"": ""A"" }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var valueDiff = result["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(1, valueDiff["old"]?.GetValue<long>());
        Assert.Null(valueDiff["new"]);
    }

    [Fact]
    public void Diff_Object_PropertyAdded_RecordsNewValue()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""A"" }";
        var newJson = @"{ ""name"": ""A"", ""value"": 1 }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var valueDiff = result["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Null(valueDiff["old"]);
        Assert.Equal(1, valueDiff["new"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_Object_NestedObject_RecordsNestedChanges()
    {
        // Arrange
        var oldJson = @"{ ""data"": { ""x"": 1, ""y"": 2 } }";
        var newJson = @"{ ""data"": { ""x"": 10, ""y"": 2 } }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var xDiff = result["data/x"] as JsonObject;
        Assert.NotNull(xDiff);
        Assert.Equal(1, xDiff["old"]?.GetValue<long>());
        Assert.Equal(10, xDiff["new"]?.GetValue<long>());
        
        // y 没有变化
        Assert.Null(result["data/y"]);
    }

    [Fact]
    public void Diff_Object_DeeplyNestedObject_RecordsAllLevelChanges()
    {
        // Arrange
        var oldJson = @"{ ""level1"": { ""level2"": { ""value"": 1 } } }";
        var newJson = @"{ ""level1"": { ""level2"": { ""value"": 2 } } }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var valueDiff = result["level1/level2/value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(1, valueDiff["old"]?.GetValue<long>());
        Assert.Equal(2, valueDiff["new"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_Object_NestedObjectRemoved_RecordsOldValue()
    {
        // Arrange
        var oldJson = @"{ ""data"": { ""x"": 1 } }";
        var newJson = @"{ }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var dataDiff = result["data"] as JsonObject;
        Assert.NotNull(dataDiff);
        Assert.NotNull(dataDiff["old"]);
        Assert.Null(dataDiff["new"]);
        
        var oldData = dataDiff["old"] as JsonObject;
        Assert.NotNull(oldData);
        Assert.Equal(1, oldData["x"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_Object_NestedObjectAdded_RecordsNewValue()
    {
        // Arrange
        var oldJson = @"{ }";
        var newJson = @"{ ""data"": { ""x"": 1 } }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var dataDiff = result["data"] as JsonObject;
        Assert.NotNull(dataDiff);
        Assert.Null(dataDiff["old"]);
        Assert.NotNull(dataDiff["new"]);
        
        var newData = dataDiff["new"] as JsonObject;
        Assert.NotNull(newData);
        Assert.Equal(1, newData["x"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_Object_NonObjectInput_ThrowsException()
    {
        // Arrange
        var oldJson = @"[1, 2, 3]";
        var newJson = @"{ ""name"": ""A"" }";
        var options = new DiffOptions();

        // Act & Assert
        Assert.Throws<DiffException>(() => DiffGenerator.Diff(oldJson, newJson, options));
    }

    [Fact]
    public void Diff_Object_MixedTypesInProperties_RecordsChanges()
    {
        // Arrange - 属性类型发生变化
        var oldJson = @"{ ""value"": 123 }";
        var newJson = @"{ ""value"": ""string"" }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var valueDiff = result["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(123, valueDiff["old"]?.GetValue<long>());
        Assert.Equal("string", valueDiff["new"]?.GetValue<string>());
    }

    [Fact]
    public void Diff_Object_EmptyObjectToEmptyObject_NoDiff()
    {
        // Arrange
        var oldJson = @"{ }";
        var newJson = @"{ }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_Object_ComplexNestedStructure_RecordsAllChanges()
    {
        // Arrange
        var oldJson = @"{
            ""user"": {
                ""name"": ""Alice"",
                ""settings"": {
                    ""theme"": ""dark"",
                    ""notifications"": true
                }
            }
        }";
        var newJson = @"{
            ""user"": {
                ""name"": ""Bob"",
                ""settings"": {
                    ""theme"": ""light"",
                    ""notifications"": true
                }
            }
        }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var nameDiff = result["user/name"] as JsonObject;
        Assert.NotNull(nameDiff);
        Assert.Equal("Alice", nameDiff["old"]?.GetValue<string>());
        Assert.Equal("Bob", nameDiff["new"]?.GetValue<string>());
        
        var themeDiff = result["user/settings/theme"] as JsonObject;
        Assert.NotNull(themeDiff);
        Assert.Equal("dark", themeDiff["old"]?.GetValue<string>());
        Assert.Equal("light", themeDiff["new"]?.GetValue<string>());
        
        // notifications 没有变化
        Assert.Null(result["user/settings/notifications"]);
    }
}
