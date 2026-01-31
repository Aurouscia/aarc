using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff.Test;

public class DiffGeneratorElementTests
{
    #region 基础类型测试 (Primitive Types)

    [Fact]
    public void DiffElement_SamePrimitiveValues_NoDiff()
    {
        // Arrange
        var oldJson = @"{ ""value"": 42 }";
        var newJson = @"{ ""value"": 42 }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("value"),
            newDoc.RootElement.GetProperty("value"),
            options, ["value"], writeTo);

        // Assert
        Assert.Empty(writeTo.AsObject());
    }

    [Fact]
    public void DiffElement_DifferentPrimitiveValues_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""value"": 42 }";
        var newJson = @"{ ""value"": 100 }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("value"),
            newDoc.RootElement.GetProperty("value"),
            options, ["value"], writeTo);

        // Assert
        var valueDiff = writeTo["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(42L, valueDiff["old"]?.GetValue<long>());
        Assert.Equal(100L, valueDiff["new"]?.GetValue<long>());
    }

    [Fact]
    public void DiffElement_DifferentStringValues_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""name"": ""Alice"" }";
        var newJson = @"{ ""name"": ""Bob"" }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("name"),
            newDoc.RootElement.GetProperty("name"),
            options, ["name"], writeTo);

        // Assert
        var nameDiff = writeTo["name"] as JsonObject;
        Assert.NotNull(nameDiff);
        Assert.Equal("Alice", nameDiff["old"]?.GetValue<string>());
        Assert.Equal("Bob", nameDiff["new"]?.GetValue<string>());
    }

    [Fact]
    public void DiffElement_DifferentBooleanValues_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""active"": false }";
        var newJson = @"{ ""active"": true }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("active"),
            newDoc.RootElement.GetProperty("active"),
            options, ["active"], writeTo);

        // Assert
        var activeDiff = writeTo["active"] as JsonObject;
        Assert.NotNull(activeDiff);
        Assert.False(activeDiff["old"]?.GetValue<bool>());
        Assert.True(activeDiff["new"]?.GetValue<bool>());
    }

    [Fact]
    public void DiffElement_NullToValue_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""value"": null }";
        var newJson = @"{ ""value"": 123 }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("value"),
            newDoc.RootElement.GetProperty("value"),
            options, ["value"], writeTo);

        // Assert
        var valueDiff = writeTo["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Null(valueDiff["old"]);
        Assert.Equal(123L, valueDiff["new"]?.GetValue<long>());
    }

    [Fact]
    public void DiffElement_ValueToNull_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""value"": 123 }";
        var newJson = @"{ ""value"": null }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("value"),
            newDoc.RootElement.GetProperty("value"),
            options, ["value"], writeTo);

        // Assert
        var valueDiff = writeTo["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(123L, valueDiff["old"]?.GetValue<long>());
        Assert.Null(valueDiff["new"]);
    }

    #endregion

    #region 类型变化测试 (Type Changes)

    [Fact]
    public void DiffElement_NumberToString_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""value"": 123 }";
        var newJson = @"{ ""value"": ""123"" }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("value"),
            newDoc.RootElement.GetProperty("value"),
            options, ["value"], writeTo);

        // Assert
        var valueDiff = writeTo["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(123L, valueDiff["old"]?.GetValue<long>());
        Assert.Equal("123", valueDiff["new"]?.GetValue<string>());
    }

    [Fact]
    public void DiffElement_ObjectToArray_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""data"": { ""x"": 1 } }";
        var newJson = @"{ ""data"": [1, 2] }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("data"),
            newDoc.RootElement.GetProperty("data"),
            options, ["data"], writeTo);

        // Assert
        var dataDiff = writeTo["data"] as JsonObject;
        Assert.NotNull(dataDiff);
        Assert.NotNull(dataDiff["old"]);
        Assert.NotNull(dataDiff["new"]);
    }

    [Fact]
    public void DiffElement_ArrayToPrimitive_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""value"": [1, 2] }";
        var newJson = @"{ ""value"": 42 }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("value"),
            newDoc.RootElement.GetProperty("value"),
            options, ["value"], writeTo);

        // Assert
        var valueDiff = writeTo["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.NotNull(valueDiff["old"]);
        Assert.Equal(42L, valueDiff["new"]?.GetValue<long>());
    }

    #endregion

    #region 对象类型测试 (Object Types)

    [Fact]
    public void DiffElement_SameObjects_NoDiff()
    {
        // Arrange
        var oldJson = @"{ ""obj"": { ""a"": 1 } }";
        var newJson = @"{ ""obj"": { ""a"": 1 } }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("obj"),
            newDoc.RootElement.GetProperty("obj"),
            options, ["obj"], writeTo);

        // Assert
        Assert.Empty(writeTo.AsObject());
    }

    [Fact]
    public void DiffElement_DifferentObjects_RecursivelyDiffs()
    {
        // Arrange
        var oldJson = @"{ ""obj"": { ""a"": 1, ""b"": 2 } }";
        var newJson = @"{ ""obj"": { ""a"": 1, ""b"": 3 } }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("obj"),
            newDoc.RootElement.GetProperty("obj"),
            options, ["obj"], writeTo);

        // Assert
        var bDiff = writeTo["obj/b"] as JsonObject;
        Assert.NotNull(bDiff);
        Assert.Equal(2L, bDiff["old"]?.GetValue<long>());
        Assert.Equal(3L, bDiff["new"]?.GetValue<long>());
        
        // a 没有变化
        Assert.Null(writeTo["obj/a"]);
    }

    [Fact]
    public void DiffElement_NestedPath_PreservesPathStructure()
    {
        // Arrange
        var oldJson = @"{ ""level1"": { ""level2"": { ""value"": 1 } } }";
        var newJson = @"{ ""level1"": { ""level2"": { ""value"": 2 } } }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("level1"),
            newDoc.RootElement.GetProperty("level1"),
            options, ["level1"], writeTo);

        // Assert
        var valueDiff = writeTo["level1/level2/value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(1L, valueDiff["old"]?.GetValue<long>());
        Assert.Equal(2L, valueDiff["new"]?.GetValue<long>());
    }

    #endregion

    #region 数组类型测试 (Array Types)

    [Fact]
    public void DiffElement_SameShortArrays_NoDiff()
    {
        // Arrange - ShortArray 是长度为2的数字数组
        var oldJson = @"{ ""point"": [1, 2] }";
        var newJson = @"{ ""point"": [1, 2] }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("point"),
            newDoc.RootElement.GetProperty("point"),
            options, ["point"], writeTo);

        // Assert - 值相同，不记录
        Assert.Empty(writeTo.AsObject());
    }

    [Fact]
    public void DiffElement_DifferentShortArrays_RecordsOldNew()
    {
        // Arrange - ShortArray 长度为2的数字数组
        var oldJson = @"{ ""point"": [1, 2] }";
        var newJson = @"{ ""point"": [3, 4] }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("point"),
            newDoc.RootElement.GetProperty("point"),
            options, ["point"], writeTo);

        // Assert
        var pointDiff = writeTo["point"] as JsonObject;
        Assert.NotNull(pointDiff);
        var oldValue = pointDiff["old"] as JsonArray;
        var newValue = pointDiff["new"] as JsonArray;
        Assert.NotNull(oldValue);
        Assert.NotNull(newValue);
        Assert.Equal(1m, oldValue[0]?.GetValue<decimal>());
        Assert.Equal(2m, oldValue[1]?.GetValue<decimal>());
        Assert.Equal(3m, newValue[0]?.GetValue<decimal>());
        Assert.Equal(4m, newValue[1]?.GetValue<decimal>());
    }

    [Fact]
    public void DiffElement_KeyedArrayWithConfig_UsesKeyedArrayDiff()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""B""}] }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("items"),
            newDoc.RootElement.GetProperty("items"),
            options, ["items"], writeTo);

        // Assert
        var itemsDiff = writeTo["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
    }

    [Fact]
    public void DiffElement_LongArrayWithConfig_UsesLongArrayDiff()
    {
        // Arrange
        var oldJson = @"{ ""points"": [{""x"": 1, ""y"": 2}] }";
        var newJson = @"{ ""points"": [{""x"": 1, ""y"": 3}] }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions
        {
            LongArrayConfigs = [
                new LongArrayConfig(["points"], el => $"{el.GetProperty("x")}")
            ]
        };

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("points"),
            newDoc.RootElement.GetProperty("points"),
            options, ["points"], writeTo);

        // Assert
        var pointsDiff = writeTo["points"] as JsonObject;
        Assert.NotNull(pointsDiff);
        var replaceArray = pointsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
    }

    [Fact]
    public void DiffElement_ShortArray_RecordsOldNew()
    {
        // Arrange - ShortArray 是长度为2的数字数组
        var oldJson = @"{ ""point"": [1, 2] }";
        var newJson = @"{ ""point"": [3, 4] }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("point"),
            newDoc.RootElement.GetProperty("point"),
            options, ["point"], writeTo);

        // Assert
        var pointDiff = writeTo["point"] as JsonObject;
        Assert.NotNull(pointDiff);
        var oldValue = pointDiff["old"] as JsonArray;
        var newValue = pointDiff["new"] as JsonArray;
        Assert.NotNull(oldValue);
        Assert.NotNull(newValue);
        Assert.Equal(1m, oldValue[0]?.GetValue<decimal>());
        Assert.Equal(2m, oldValue[1]?.GetValue<decimal>());
        Assert.Equal(3m, newValue[0]?.GetValue<decimal>());
        Assert.Equal(4m, newValue[1]?.GetValue<decimal>());
    }

    #endregion

    #region 复杂场景测试

    [Fact]
    public void DiffElement_DeeplyNestedMixedTypes_RecordsAllChanges()
    {
        // Arrange
        var oldJson = @"{
            ""root"": {
                ""primitive"": 1,
                ""nested"": {
                    ""arr"": [1, 2]
                }
            }
        }";
        var newJson = @"{
            ""root"": {
                ""primitive"": 2,
                ""nested"": {
                    ""arr"": [1, 3]
                }
            }
        }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("root"),
            newDoc.RootElement.GetProperty("root"),
            options, ["root"], writeTo);

        // Assert
        var primitiveDiff = writeTo["root/primitive"] as JsonObject;
        Assert.NotNull(primitiveDiff);
        Assert.Equal(1L, primitiveDiff["old"]?.GetValue<long>());
        Assert.Equal(2L, primitiveDiff["new"]?.GetValue<long>());

        // nested/arr 数组变化
        var arrDiff = writeTo["root/nested/arr"] as JsonObject;
        Assert.NotNull(arrDiff);
    }

    [Fact]
    public void DiffElement_EmptyObjectToEmptyObject_NoDiff()
    {
        // Arrange
        var oldJson = @"{ ""obj"": {} }";
        var newJson = @"{ ""obj"": {} }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act
        DiffGeneratorElement.Diff(
            oldDoc.RootElement.GetProperty("obj"),
            newDoc.RootElement.GetProperty("obj"),
            options, ["obj"], writeTo);

        // Assert
        Assert.Empty(writeTo.AsObject());
    }

    [Fact]
    public void DiffElement_EmptyShortArrayToEmptyShortArray_ThrowsException()
    {
        // Arrange - ShortArray 要求长度为2，空数组不满足
        var oldJson = @"{ ""arr"": [] }";
        var newJson = @"{ ""arr"": [] }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();
        var options = new DiffOptions();

        // Act & Assert - 空数组不符合 ShortArray 要求，抛出异常
        Assert.Throws<DiffException>(() =>
            DiffGeneratorElement.Diff(
                oldDoc.RootElement.GetProperty("arr"),
                newDoc.RootElement.GetProperty("arr"),
                options, ["arr"], writeTo));
    }

    #endregion
}
