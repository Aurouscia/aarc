using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff.Test;

public class DiffUtilsTests
{
    #region AsPathString 测试

    [Fact]
    public void AsPathString_SingleElement_ReturnsElement()
    {
        // Arrange
        var path = new[] { "name" };

        // Act
        var result = path.AsPathString();

        // Assert
        Assert.Equal("name", result);
    }

    [Fact]
    public void AsPathString_MultipleElements_JoinsWithSlash()
    {
        // Arrange
        var path = new[] { "user", "profile", "name" };

        // Act
        var result = path.AsPathString();

        // Assert
        Assert.Equal("user/profile/name", result);
    }

    [Fact]
    public void AsPathString_EmptyArray_ReturnsEmptyString()
    {
        // Arrange
        var path = Array.Empty<string>();

        // Act
        var result = path.AsPathString();

        // Assert
        Assert.Equal("", result);
    }

    #endregion

    #region CreateOldNewNode 测试

    [Fact]
    public void CreateOldNewNode_BothValues_CreatesNodeWithOldAndNew()
    {
        // Arrange
        var oldNode = JsonValue.Create(1);
        var newNode = JsonValue.Create(2);

        // Act
        var result = DiffUtils.CreateOldNewNode(oldNode, newNode);

        // Assert
        Assert.NotNull(result["old"]);
        Assert.NotNull(result["new"]);
        Assert.Equal(1, result["old"]?.GetValue<int>());
        Assert.Equal(2, result["new"]?.GetValue<int>());
    }

    [Fact]
    public void CreateOldNewNode_OnlyOld_CreatesNodeWithOnlyOld()
    {
        // Arrange
        var oldNode = JsonValue.Create("deleted");

        // Act
        var result = DiffUtils.CreateOldNewNode(oldNode, null);

        // Assert
        Assert.NotNull(result["old"]);
        Assert.Null(result["new"]);
        Assert.Equal("deleted", result["old"]?.GetValue<string>());
    }

    [Fact]
    public void CreateOldNewNode_OnlyNew_CreatesNodeWithOnlyNew()
    {
        // Arrange
        var newNode = JsonValue.Create("added");

        // Act
        var result = DiffUtils.CreateOldNewNode(null, newNode);

        // Assert
        Assert.Null(result["old"]);
        Assert.NotNull(result["new"]);
        Assert.Equal("added", result["new"]?.GetValue<string>());
    }

    [Fact]
    public void CreateOldNewNode_BothNull_CreatesEmptyNode()
    {
        // Act
        var result = DiffUtils.CreateOldNewNode(null, null);

        // Assert
        Assert.Null(result["old"]);
        Assert.Null(result["new"]);
    }

    #endregion

    #region WriteOldNewNode 测试

    [Fact]
    public void WriteOldNewNode_WritesToCorrectPath()
    {
        // Arrange
        var writeTo = new JsonObject();
        var oldNode = JsonValue.Create(1);
        var newNode = JsonValue.Create(2);

        // Act
        DiffUtils.WriteOldNewNode(oldNode, newNode, new[] { "user", "age" }, writeTo);

        // Assert
        var userAgeDiff = writeTo["user/age"] as JsonObject;
        Assert.NotNull(userAgeDiff);
        Assert.Equal(1, userAgeDiff["old"]?.GetValue<int>());
        Assert.Equal(2, userAgeDiff["new"]?.GetValue<int>());
    }

    [Fact]
    public void WriteOldNewNode_WithJsonElement_ConvertsAndWrites()
    {
        // Arrange
        var oldJson = @"{ ""value"": 1 }";
        var newJson = @"{ ""value"": 2 }";
        using var oldDoc = JsonDocument.Parse(oldJson);
        using var newDoc = JsonDocument.Parse(newJson);
        var writeTo = new JsonObject();

        // Act
        DiffUtils.WriteOldNewNode(
            oldDoc.RootElement.GetProperty("value"),
            newDoc.RootElement.GetProperty("value"),
            new[] { "value" }, writeTo);

        // Assert
        var valueDiff = writeTo["value"] as JsonObject;
        Assert.NotNull(valueDiff);
        Assert.Equal(1L, valueDiff["old"]?.GetValue<long>());
        Assert.Equal(2L, valueDiff["new"]?.GetValue<long>());
    }

    #endregion

    #region EnsureValidShortArray 测试

    [Fact]
    public void EnsureValidShortArray_ValidShortArray_WritesToOutput()
    {
        // Arrange
        var json = @"[1.5, 2.5]";
        using var doc = JsonDocument.Parse(json);
        var writeTo = new JsonArray();

        // Act
        DiffUtils.EnsureValidShortArray(doc.RootElement, new[] { "point" }, writeTo);

        // Assert
        Assert.Equal(2, writeTo.Count);
        Assert.Equal(1.5m, writeTo[0]?.GetValue<decimal>());
        Assert.Equal(2.5m, writeTo[1]?.GetValue<decimal>());
    }

    [Fact]
    public void EnsureValidShortArray_ValidShortArray_NoOutput_DoesNotThrow()
    {
        // Arrange
        var json = @"[1, 2]";
        using var doc = JsonDocument.Parse(json);

        // Act & Assert - 不抛出异常
        DiffUtils.EnsureValidShortArray(doc.RootElement, new[] { "point" }, null);
    }

    [Fact]
    public void EnsureValidShortArray_LengthNot2_ThrowsDiffException()
    {
        // Arrange
        var json = @"[1, 2, 3]";
        using var doc = JsonDocument.Parse(json);

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() =>
            DiffUtils.EnsureValidShortArray(doc.RootElement, new[] { "arr" }, null));
        Assert.Equal("短数组长度必须为2", ex.Message);
    }

    [Fact]
    public void EnsureValidShortArray_EmptyArray_ThrowsDiffException()
    {
        // Arrange
        var json = @"[]";
        using var doc = JsonDocument.Parse(json);

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() =>
            DiffUtils.EnsureValidShortArray(doc.RootElement, new[] { "arr" }, null));
        Assert.Equal("短数组长度必须为2", ex.Message);
    }

    [Fact]
    public void EnsureValidShortArray_NonNumericElements_ThrowsDiffException()
    {
        // Arrange
        var json = @"[1, ""string""]";
        using var doc = JsonDocument.Parse(json);

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() =>
            DiffUtils.EnsureValidShortArray(doc.RootElement, new[] { "arr" }, null));
        Assert.Equal("短数组元素必须为数字", ex.Message);
    }

    [Fact]
    public void EnsureValidShortArray_NotArray_ThrowsDiffException()
    {
        // Arrange
        var json = @"123";
        using var doc = JsonDocument.Parse(json);

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() =>
            DiffUtils.EnsureValidShortArray(doc.RootElement, new[] { "val" }, null));
        Assert.Equal("必须是数组", ex.Message);
    }

    [Fact]
    public void EnsureValidShortArray_NegativeNumbers_Works()
    {
        // Arrange
        var json = @"[-10, -20]";
        using var doc = JsonDocument.Parse(json);
        var writeTo = new JsonArray();

        // Act
        DiffUtils.EnsureValidShortArray(doc.RootElement, new[] { "point" }, writeTo);

        // Assert
        Assert.Equal(-10m, writeTo[0]?.GetValue<decimal>());
        Assert.Equal(-20m, writeTo[1]?.GetValue<decimal>());
    }

    #endregion

    #region EnsureValidArray 测试

    [Fact]
    public void EnsureValidArray_ShortArrayWithoutConfig_DoesNotThrow()
    {
        // Arrange
        var json = @"[1, 2]";
        using var doc = JsonDocument.Parse(json);
        var options = new DiffOptions();

        // Act & Assert
        DiffUtils.EnsureValidArray(doc.RootElement, new[] { "point" }, options);
    }

    [Fact]
    public void EnsureValidArray_LongArrayWithoutConfig_ThrowsDiffException()
    {
        // Arrange
        var json = @"[1, 2, 3]";
        using var doc = JsonDocument.Parse(json);
        var options = new DiffOptions();

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() =>
            DiffUtils.EnsureValidArray(doc.RootElement, new[] { "arr" }, options));
        Assert.Equal("不在配置中的非短数组", ex.Message);
    }

    [Fact]
    public void EnsureValidArray_WithKeyedArrayConfig_DoesNotThrow()
    {
        // Arrange
        var json = @"[{ ""id"": 1 }]";
        using var doc = JsonDocument.Parse(json);
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act & Assert - 有配置，不验证 ShortArray
        DiffUtils.EnsureValidArray(doc.RootElement, new[] { "items" }, options);
    }

    [Fact]
    public void EnsureValidArray_WithLongArrayConfig_DoesNotThrow()
    {
        // Arrange
        var json = @"[1, 2, 3, 4, 5]";
        using var doc = JsonDocument.Parse(json);
        var options = new DiffOptions
        {
            LongArrayConfigs = [
                new LongArrayConfig(["values"], el => el.GetRawText())
            ]
        };

        // Act & Assert - 有配置，不验证 ShortArray
        DiffUtils.EnsureValidArray(doc.RootElement, new[] { "values" }, options);
    }

    [Fact]
    public void EnsureValidArray_NotArray_ThrowsDiffException()
    {
        // Arrange
        var json = @"123";
        using var doc = JsonDocument.Parse(json);
        var options = new DiffOptions();

        // Act & Assert
        var ex = Assert.Throws<DiffException>(() =>
            DiffUtils.EnsureValidArray(doc.RootElement, new[] { "val" }, options));
        Assert.Equal("必须是数组", ex.Message);
    }

    #endregion

    #region ToJsonNode 测试

    [Fact]
    public void ToJsonNode_Object_ConvertsCorrectly()
    {
        // Arrange
        var json = @"{ ""a"": 1, ""b"": ""test"" }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode() as JsonObject;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1L, result["a"]?.GetValue<long>());
        Assert.Equal("test", result["b"]?.GetValue<string>());
    }

    [Fact]
    public void ToJsonNode_Array_ConvertsCorrectly()
    {
        // Arrange
        var json = @"[1, 2, 3]";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode() as JsonArray;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal(1L, result[0]?.GetValue<long>());
        Assert.Equal(2L, result[1]?.GetValue<long>());
        Assert.Equal(3L, result[2]?.GetValue<long>());
    }

    [Fact]
    public void ToJsonNode_String_ConvertsCorrectly()
    {
        // Arrange
        var json = @"""hello""";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode();

        // Assert
        Assert.Equal("hello", result?.GetValue<string>());
    }

    [Fact]
    public void ToJsonNode_NumberInteger_ConvertsToLong()
    {
        // Arrange
        var json = @"42";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode();

        // Assert
        Assert.IsType<long>(result?.GetValue<long>());
        Assert.Equal(42L, result?.GetValue<long>());
    }

    [Fact]
    public void ToJsonNode_NumberDecimal_ConvertsToDouble()
    {
        // Arrange
        var json = @"3.14";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode();

        // Assert
        Assert.Equal(3.14, result?.GetValue<double>());
    }

    [Fact]
    public void ToJsonNode_True_ConvertsCorrectly()
    {
        // Arrange
        var json = @"true";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode();

        // Assert
        Assert.True(result?.GetValue<bool>());
    }

    [Fact]
    public void ToJsonNode_False_ConvertsCorrectly()
    {
        // Arrange
        var json = @"false";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode();

        // Assert
        Assert.False(result?.GetValue<bool>());
    }

    [Fact]
    public void ToJsonNode_Null_ReturnsNull()
    {
        // Arrange
        var json = @"null";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode();

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void ToJsonNode_NestedStructure_ConvertsCorrectly()
    {
        // Arrange
        var json = @"{ ""arr"": [{ ""x"": 1 }], ""obj"": { ""y"": 2 } }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = doc.RootElement.ToJsonNode() as JsonObject;

        // Assert
        Assert.NotNull(result);
        var arr = result["arr"] as JsonArray;
        var obj = result["obj"] as JsonObject;
        Assert.NotNull(arr);
        Assert.NotNull(obj);
        Assert.Equal(1L, (arr[0] as JsonObject)?["x"]?.GetValue<long>());
        Assert.Equal(2L, obj["y"]?.GetValue<long>());
    }

    #endregion

    #region DeepEquals 测试

    [Fact]
    public void DeepEquals_SamePrimitives_ReturnsTrue()
    {
        // Arrange
        var json = @"{ ""a"": 1, ""b"": 2 }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = DiffUtils.DeepEquals(
            doc.RootElement.GetProperty("a"),
            doc.RootElement.GetProperty("b"));

        // Assert - 1 != 2
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_EqualPrimitives_ReturnsTrue()
    {
        // Arrange
        var json = @"{ ""a"": 1, ""b"": 1 }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = DiffUtils.DeepEquals(
            doc.RootElement.GetProperty("a"),
            doc.RootElement.GetProperty("b"));

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_DifferentTypes_ReturnsFalse()
    {
        // Arrange
        var json = @"{ ""num"": 1, ""str"": ""1"" }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = DiffUtils.DeepEquals(
            doc.RootElement.GetProperty("num"),
            doc.RootElement.GetProperty("str"));

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_EqualObjects_ReturnsTrue()
    {
        // Arrange
        var jsonA = @"{ ""x"": 1, ""y"": 2 }";
        var jsonB = @"{ ""x"": 1, ""y"": 2 }";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_ObjectsDifferentPropertyOrder_ReturnsTrue()
    {
        // Arrange
        var jsonA = @"{ ""a"": 1, ""b"": 2 }";
        var jsonB = @"{ ""b"": 2, ""a"": 1 }";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 属性顺序不影响相等性
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_DifferentObjects_ReturnsFalse()
    {
        // Arrange
        var jsonA = @"{ ""x"": 1 }";
        var jsonB = @"{ ""x"": 2 }";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_DifferentPropertyCount_ReturnsFalse()
    {
        // Arrange
        var jsonA = @"{ ""x"": 1 }";
        var jsonB = @"{ ""x"": 1, ""y"": 2 }";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_EqualArrays_ReturnsTrue()
    {
        // Arrange
        var jsonA = @"[1, 2, 3]";
        var jsonB = @"[1, 2, 3]";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_DifferentArrays_ReturnsFalse()
    {
        // Arrange
        var jsonA = @"[1, 2, 3]";
        var jsonB = @"[1, 2, 4]";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_DifferentArrayLength_ReturnsFalse()
    {
        // Arrange
        var jsonA = @"[1, 2]";
        var jsonB = @"[1, 2, 3]";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_ArrayOrderMatters_ReturnsFalse()
    {
        // Arrange
        var jsonA = @"[1, 2]";
        var jsonB = @"[2, 1]";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 数组顺序影响相等性
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_NestedEqualObjects_ReturnsTrue()
    {
        // Arrange
        var jsonA = @"{ ""data"": { ""x"": [1, 2] } }";
        var jsonB = @"{ ""data"": { ""x"": [1, 2] } }";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_NestedDifferentObjects_ReturnsFalse()
    {
        // Arrange
        var jsonA = @"{ ""data"": { ""x"": [1, 2] } }";
        var jsonB = @"{ ""data"": { ""x"": [1, 3] } }";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_EqualStrings_ReturnsTrue()
    {
        // Arrange
        var jsonA = @"""hello""";
        var jsonB = @"""hello""";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_DifferentStrings_ReturnsFalse()
    {
        // Arrange
        var jsonA = @"""hello""";
        var jsonB = @"""world""";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_BothNull_ReturnsTrue()
    {
        // Arrange
        var json = @"{ ""a"": null, ""b"": null }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = DiffUtils.DeepEquals(
            doc.RootElement.GetProperty("a"),
            doc.RootElement.GetProperty("b"));

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_BothTrue_ReturnsTrue()
    {
        // Arrange
        var json = @"{ ""a"": true, ""b"": true }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = DiffUtils.DeepEquals(
            doc.RootElement.GetProperty("a"),
            doc.RootElement.GetProperty("b"));

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_BothFalse_ReturnsTrue()
    {
        // Arrange
        var json = @"{ ""a"": false, ""b"": false }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = DiffUtils.DeepEquals(
            doc.RootElement.GetProperty("a"),
            doc.RootElement.GetProperty("b"));

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_TrueAndFalse_ReturnsFalse()
    {
        // Arrange
        var json = @"{ ""a"": true, ""b"": false }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = DiffUtils.DeepEquals(
            doc.RootElement.GetProperty("a"),
            doc.RootElement.GetProperty("b"));

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_NumericTypesWithSameValue_ReturnsTrue()
    {
        // Arrange - 整数和浮点数，数值相同
        var json = @"{ ""int"": 1, ""float"": 1.0 }";
        using var doc = JsonDocument.Parse(json);

        // Act
        var result = DiffUtils.DeepEquals(
            doc.RootElement.GetProperty("int"),
            doc.RootElement.GetProperty("float"));

        // Assert - 数值相等（都转为 decimal 比较）
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_LargeNumber_BeyondDecimalRange_UsesDoubleComparison()
    {
        // Arrange - 超出 decimal 范围的大数，但 double 可以表示
        // decimal.MaxValue ≈ 7.9e28，这里使用 1e30
        var jsonA = @"1e30";
        var jsonB = @"1e30";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 应该通过 double 比较相等，不抛出 FormatException
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_LargeNumbers_DifferentValues_ReturnsFalse()
    {
        // Arrange - 两个不同的大数
        var jsonA = @"1e30";
        var jsonB = @"2e30";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_ScientificNotation_SameValue_ReturnsTrue()
    {
        // Arrange - 科学计数法表示的相同数值
        var jsonA = @"1.5e10";
        var jsonB = @"15000000000";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 1.5e10 == 15000000000
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_VeryLargeInteger_BeyondDecimalRange_UsesDoubleComparison()
    {
        // Arrange - 非常大的整数，超出 decimal 范围
        var jsonA = @"1234567890123456789012345678901234567890";
        var jsonB = @"1234567890123456789012345678901234567890";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 应该通过原始文本比较相等，不抛出 FormatException
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_VerySmallNumber_BeyondDecimalRange_UsesDoubleComparison()
    {
        // Arrange - 非常小的数（接近 0，但超出 decimal 精度）
        var jsonA = @"1e-50";
        var jsonB = @"1e-50";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 应该通过 double 比较相等
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_NegativeLargeNumber_BeyondDecimalRange_UsesDoubleComparison()
    {
        // Arrange - 负的大数，超出 decimal 范围
        var jsonA = @"-1e30";
        var jsonB = @"-1e30";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_HighPrecisionDecimal_ReturnsTrue()
    {
        // Arrange - 高精度小数，在 decimal 范围内
        var jsonA = @"1.1234567890123456789012345678";
        var jsonB = @"1.1234567890123456789012345678";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 应该通过 decimal 比较相等
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_HighPrecisionDecimal_DifferentValues_ReturnsFalse()
    {
        // Arrange - 高精度小数，微小差异
        var jsonA = @"1.1234567890123456789012345678";
        var jsonB = @"1.1234567890123456789012345679";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void DeepEquals_NumberInObject_BeyondDecimalRange_NoException()
    {
        // Arrange - 对象中包含超大数值
        var jsonA = @"{ ""value"": 1e30, ""name"": ""test"" }";
        var jsonB = @"{ ""value"": 1e30, ""name"": ""test"" }";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 应该正常比较，不抛出异常
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_NumberInArray_BeyondDecimalRange_NoException()
    {
        // Arrange - 数组中包含超大数值
        var jsonA = @"[1e30, 2e30, 3e30]";
        var jsonB = @"[1e30, 2e30, 3e30]";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert - 应该正常比较，不抛出异常
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_EmptyObjects_ReturnsTrue()
    {
        // Arrange
        var jsonA = @"{}";
        var jsonB = @"{}";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void DeepEquals_EmptyArrays_ReturnsTrue()
    {
        // Arrange
        var jsonA = @"[]";
        var jsonB = @"[]";
        using var docA = JsonDocument.Parse(jsonA);
        using var docB = JsonDocument.Parse(jsonB);

        // Act
        var result = DiffUtils.DeepEquals(docA.RootElement, docB.RootElement);

        // Assert
        Assert.True(result);
    }

    #endregion
}
