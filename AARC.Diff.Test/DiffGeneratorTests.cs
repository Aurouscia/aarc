using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff.Test;

public class DiffGeneratorTests
{
    #region Diff(string, string) 基础测试

    [Fact]
    public void Diff_StringString_SameObjects_ReturnsEmpty()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""A"" }";
        var newJson = @"{ ""name"": ""A"" }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_StringString_PropertyChanged_ReturnsDiff()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""A"" }";
        var newJson = @"{ ""name"": ""B"" }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var nameDiff = result["name"] as JsonObject;
        Assert.NotNull(nameDiff);
        Assert.Equal("A", nameDiff["old"]?.GetValue<string>());
        Assert.Equal("B", nameDiff["new"]?.GetValue<string>());
    }

    [Fact]
    public void Diff_StringString_InvalidOldJson_ThrowsDiffException()
    {
        // Arrange
        var oldJson = @"invalid json";
        var newJson = @"{ }";
        var options = new DiffOptions();

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() => DiffGenerator.Diff(oldJson, newJson, options));
        Assert.Equal("json格式异常", ex.Message);
    }

    [Fact]
    public void Diff_StringString_InvalidNewJson_ThrowsDiffException()
    {
        // Arrange
        var oldJson = @"{ }";
        var newJson = @"{ invalid }";
        var options = new DiffOptions();

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() => DiffGenerator.Diff(oldJson, newJson, options));
        Assert.Equal("json格式异常", ex.Message);
    }

    [Fact]
    public void Diff_StringString_OldJsonNotObject_ThrowsDiffException()
    {
        // Arrange
        var oldJson = @"[1, 2, 3]";
        var newJson = @"{ }";
        var options = new DiffOptions();

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() => DiffGenerator.Diff(oldJson, newJson, options));
        Assert.Equal("json不是对象", ex.Message);
    }

    [Fact]
    public void Diff_StringString_NewJsonNotObject_ThrowsDiffException()
    {
        // Arrange
        var oldJson = @"{ }";
        var newJson = @"123";
        var options = new DiffOptions();

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() => DiffGenerator.Diff(oldJson, newJson, options));
        Assert.Equal("json不是对象", ex.Message);
    }

    #endregion

    #region Diff(JsonDocument, JsonDocument) 测试

    [Fact]
    public void Diff_JsonDocument_SameObjects_ReturnsEmpty()
    {
        // Arrange
        var oldJson = @"{ ""value"": 1 }";
        var newJson = @"{ ""value"": 1 }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldDoc, newDoc, options);

        // Assert
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_JsonDocument_PropertyChanged_ReturnsDiff()
    {
        // Arrange
        var oldJson = @"{ ""value"": 1 }";
        var newJson = @"{ ""value"": 2 }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldDoc, newDoc, options);

        // Assert
        var valueDiff = result["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(1L, valueDiff["old"]?.GetValue<long>());
        Assert.Equal(2L, valueDiff["new"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_JsonDocument_NotObject_ThrowsDiffException()
    {
        // Arrange
        var oldJson = @"[]";
        var newJson = @"{ }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var options = new DiffOptions();

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() => DiffGenerator.Diff(oldDoc, newDoc, options));
        Assert.Equal("json不是对象", ex.Message);
    }

    #endregion

    #region Diff(Stream, Stream) 测试

    [Fact]
    public void Diff_StreamStream_SameObjects_ReturnsEmpty()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""A"" }";
        var newJson = @"{ ""name"": ""A"" }";
        using var oldStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(oldJson));
        using var newStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(newJson));
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldStream, newStream, options);

        // Assert
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_StreamStream_PropertyChanged_ReturnsDiff()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""A"" }";
        var newJson = @"{ ""name"": ""B"" }";
        using var oldStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(oldJson));
        using var newStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(newJson));
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldStream, newStream, options);

        // Assert
        var nameDiff = result["name"] as JsonObject;
        Assert.NotNull(nameDiff);
        Assert.Equal("A", nameDiff["old"]?.GetValue<string>());
        Assert.Equal("B", nameDiff["new"]?.GetValue<string>());
    }

    [Fact]
    public void Diff_StreamStream_InvalidJson_ThrowsDiffException()
    {
        // Arrange
        var oldJson = @"{ }";
        var newJson = @"not json";
        using var oldStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(oldJson));
        using var newStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(newJson));
        var options = new DiffOptions();

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() => DiffGenerator.Diff(oldStream, newStream, options));
        Assert.Equal("json格式异常", ex.Message);
    }

    #endregion

    #region 混合重载测试 (string, Stream) 和 (Stream, string)

    [Fact]
    public void Diff_StringStream_PropertyChanged_ReturnsDiff()
    {
        // Arrange
        var oldJson = @"{ ""x"": 1 }";
        var newJson = @"{ ""x"": 2 }";
        using var newStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(newJson));
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newStream, options);

        // Assert
        var xDiff = result["x"] as JsonObject;
        Assert.NotNull(xDiff);
        Assert.Equal(1L, xDiff["old"]?.GetValue<long>());
        Assert.Equal(2L, xDiff["new"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_StreamString_PropertyChanged_ReturnsDiff()
    {
        // Arrange
        var oldJson = @"{ ""x"": 1 }";
        var newJson = @"{ ""x"": 2 }";
        using var oldStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(oldJson));
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldStream, newJson, options);

        // Assert
        var xDiff = result["x"] as JsonObject;
        Assert.NotNull(xDiff);
        Assert.Equal(1L, xDiff["old"]?.GetValue<long>());
        Assert.Equal(2L, xDiff["new"]?.GetValue<long>());
    }

    #endregion

    #region 复杂场景测试

    [Fact]
    public void Diff_ComplexNestedStructure_ReturnsCorrectDiff()
    {
        // Arrange - 使用 ShortArray 代替字符串数组
        var oldJson = @"{
            ""user"": {
                ""id"": 1,
                ""profile"": {
                    ""name"": ""Alice"",
                    ""age"": 30
                },
                ""coords"": [10, 20]
            }
        }";
        var newJson = @"{
            ""user"": {
                ""id"": 1,
                ""profile"": {
                    ""name"": ""Alice"",
                    ""age"": 31
                },
                ""coords"": [15, 25]
            }
        }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - age 变化，coords ShortArray 变化
        var ageDiff = result["user/profile/age"] as JsonObject;
        Assert.NotNull(ageDiff);
        Assert.Equal(30L, ageDiff["old"]?.GetValue<long>());
        Assert.Equal(31L, ageDiff["new"]?.GetValue<long>());

        // coords ShortArray 变化
        var coordsDiff = result["user/coords"] as JsonObject;
        Assert.NotNull(coordsDiff);
        var oldCoords = coordsDiff["old"] as JsonArray;
        var newCoords = coordsDiff["new"] as JsonArray;
        Assert.NotNull(oldCoords);
        Assert.NotNull(newCoords);
        Assert.Equal(10m, oldCoords[0]?.GetValue<decimal>());
        Assert.Equal(20m, oldCoords[1]?.GetValue<decimal>());
        Assert.Equal(15m, newCoords[0]?.GetValue<decimal>());
        Assert.Equal(25m, newCoords[1]?.GetValue<decimal>());
    }

    [Fact]
    public void Diff_WithKeyedArrayConfig_UsesConfig()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""B""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - 使用 KeyedArray 处理
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
    }

    [Fact]
    public void Diff_WithLongArrayConfig_UsesConfig()
    {
        // Arrange
        var oldJson = @"{ ""points"": [{""x"": 1, ""y"": 2}] }";
        var newJson = @"{ ""points"": [{""x"": 1, ""y"": 3}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = [
                new LongArrayConfig(["points"], el => $"{el.GetProperty("x")}")
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - 使用 LongArray 处理
        var pointsDiff = result["points"] as JsonObject;
        Assert.NotNull(pointsDiff);
        var replaceArray = pointsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
    }

    [Fact]
    public void Diff_EmptyOldToEmptyNew_ReturnsEmpty()
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
    public void Diff_AddPropertiesToEmpty_ReturnsNewValues()
    {
        // Arrange
        var oldJson = @"{ }";
        var newJson = @"{ ""a"": 1, ""b"": 2 }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        Assert.Equal(2, result.AsObject().Count);
        
        var aDiff = result["a"] as JsonObject;
        Assert.NotNull(aDiff);
        Assert.Null(aDiff["old"]);
        Assert.Equal(1L, aDiff["new"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_RemoveAllProperties_ReturnsOldValues()
    {
        // Arrange
        var oldJson = @"{ ""a"": 1, ""b"": 2 }";
        var newJson = @"{ }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        Assert.Equal(2, result.AsObject().Count);
        
        var aDiff = result["a"] as JsonObject;
        Assert.NotNull(aDiff);
        Assert.Equal(1L, aDiff["old"]?.GetValue<long>());
        Assert.Null(aDiff["new"]);
    }

    #endregion
}
