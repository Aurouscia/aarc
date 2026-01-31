using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff.Test;

public class DiffGeneratorKeyedObjTests
{
    [Fact]
    public void DiffKeyedObjReplace_SameObjects_ReturnsNull()
    {
        // Arrange
        var oldJson = @"{ ""id"": 1, ""name"": ""A"", ""value"": 10 }";
        var newJson = @"{ ""id"": 1, ""name"": ""A"", ""value"": 10 }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert - 对象完全相同，返回 null
        Assert.Null(result);
    }

    [Fact]
    public void DiffKeyedObjReplace_SinglePropertyChanged_ReturnsReplaceWithId()
    {
        // Arrange
        var oldJson = @"{ ""id"": 1, ""name"": ""A"", ""value"": 10 }";
        var newJson = @"{ ""id"": 1, ""name"": ""A"", ""value"": 20 }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result[DiffConsts.keyPropertyName]?.GetValue<int>());
        
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        Assert.NotNull(oldData);
        Assert.NotNull(newData);
        
        // 只有 value 变化
        Assert.Equal(10L, oldData["value"]?.GetValue<long>());
        Assert.Equal(20L, newData["value"]?.GetValue<long>());
        
        // name 没有变化，不应该出现在 old/new 中
        Assert.Null(oldData["name"]);
        Assert.Null(newData["name"]);
    }

    [Fact]
    public void DiffKeyedObjReplace_MultiplePropertiesChanged_ReturnsAllChanges()
    {
        // Arrange
        var oldJson = @"{ ""id"": 1, ""name"": ""A"", ""value"": 10, ""status"": ""active"" }";
        var newJson = @"{ ""id"": 1, ""name"": ""B"", ""value"": 20, ""status"": ""active"" }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert
        Assert.NotNull(result);
        
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        Assert.NotNull(oldData);
        Assert.NotNull(newData);
        
        // name 和 value 变化
        Assert.Equal("A", oldData["name"]?.GetValue<string>());
        Assert.Equal("B", newData["name"]?.GetValue<string>());
        Assert.Equal(10L, oldData["value"]?.GetValue<long>());
        Assert.Equal(20L, newData["value"]?.GetValue<long>());
        
        // status 没有变化
        Assert.Null(oldData["status"]);
        Assert.Null(newData["status"]);
    }

    [Fact]
    public void DiffKeyedObjReplace_PropertyRemoved_ReturnsOldValueOnly()
    {
        // Arrange
        var oldJson = @"{ ""id"": 1, ""name"": ""A"", ""value"": 10 }";
        var newJson = @"{ ""id"": 1, ""name"": ""A"" }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert
        Assert.NotNull(result);
        
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        Assert.NotNull(oldData);
        
        // value 被删除，只在 old 中记录
        Assert.Equal(10L, oldData["value"]?.GetValue<long>());
        
        // new 可能为 null 或者不包含 value
        if (newData != null)
        {
            Assert.Null(newData["value"]);
        }
    }

    [Fact]
    public void DiffKeyedObjReplace_PropertyAdded_ReturnsNewValueOnly()
    {
        // Arrange
        var oldJson = @"{ ""id"": 1, ""name"": ""A"" }";
        var newJson = @"{ ""id"": 1, ""name"": ""A"", ""value"": 10 }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert
        Assert.NotNull(result);
        
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        Assert.NotNull(newData);
        
        // value 是新增的，只在 new 中记录
        Assert.Equal(10L, newData["value"]?.GetValue<long>());
        
        // old 可能为 null 或者不包含 value
        if (oldData != null)
        {
            Assert.Null(oldData["value"]);
        }
    }

    [Fact]
    public void DiffKeyedObjReplace_MixedChanges_ReturnsCorrectStructure()
    {
        // Arrange - 修改、删除、添加同时发生
        var oldJson = @"{ ""id"": 1, ""keep"": ""same"", ""modify"": ""old"", ""remove"": ""gone"" }";
        var newJson = @"{ ""id"": 1, ""keep"": ""same"", ""modify"": ""new"", ""add"": ""fresh"" }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result[DiffConsts.keyPropertyName]?.GetValue<int>());
        
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        Assert.NotNull(oldData);
        Assert.NotNull(newData);
        
        // modify: 两边都有
        Assert.Equal("old", oldData["modify"]?.GetValue<string>());
        Assert.Equal("new", newData["modify"]?.GetValue<string>());
        
        // remove: 只在 old 中
        Assert.Equal("gone", oldData["remove"]?.GetValue<string>());
        Assert.Null(newData["remove"]);
        
        // add: 只在 new 中
        Assert.Null(oldData["add"]);
        Assert.Equal("fresh", newData["add"]?.GetValue<string>());
        
        // keep: 没有变化，不应该出现
        Assert.Null(oldData["keep"]);
        Assert.Null(newData["keep"]);
    }

    [Fact]
    public void DiffKeyedObjReplace_DifferentKey_UsesProvidedKey()
    {
        // Arrange - 使用不同的 key 值
        var oldJson = @"{ ""id"": 999, ""name"": ""A"" }";
        var newJson = @"{ ""id"": 999, ""name"": ""B"" }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act - 使用 42 作为 key，而不是 JSON 中的 999
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 42);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(42, result[DiffConsts.keyPropertyName]?.GetValue<int>());
    }

    [Fact]
    public void DiffKeyedObjReplace_NestedObjectValues_ChangesDetected()
    {
        // Arrange - 属性值是对象
        var oldJson = @"{ ""id"": 1, ""data"": { ""x"": 1, ""y"": 2 } }";
        var newJson = @"{ ""id"": 1, ""data"": { ""x"": 10, ""y"": 2 } }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert - 嵌套对象整体变化
        Assert.NotNull(result);
        
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        Assert.NotNull(oldData);
        Assert.NotNull(newData);
        
        // data 对象整体被视为不同
        Assert.NotNull(oldData["data"]);
        Assert.NotNull(newData["data"]);
    }

    [Fact]
    public void DiffKeyedObjReplace_ArrayValues_ChangesDetected()
    {
        // Arrange - 属性值是数组
        var oldJson = @"{ ""id"": 1, ""items"": [1, 2, 3] }";
        var newJson = @"{ ""id"": 1, ""items"": [1, 2, 4] }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert - 数组整体变化
        Assert.NotNull(result);
        
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        Assert.NotNull(oldData);
        Assert.NotNull(newData);
        
        // items 数组整体被视为不同
        Assert.NotNull(oldData["items"]);
        Assert.NotNull(newData["items"]);
    }

    [Fact]
    public void DiffKeyedObjReplace_EmptyObjectToEmptyObject_ReturnsNull()
    {
        // Arrange
        var oldJson = @"{ }";
        var newJson = @"{ }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void DiffKeyedObjReplace_AllPropertiesRemoved_ReturnsOldValues()
    {
        // Arrange
        var oldJson = @"{ ""id"": 1, ""a"": 1, ""b"": 2 }";
        var newJson = @"{ ""id"": 1 }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert
        Assert.NotNull(result);
        
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        Assert.NotNull(oldData);
        Assert.Equal(1L, oldData["a"]?.GetValue<long>());
        Assert.Equal(2L, oldData["b"]?.GetValue<long>());
        
        // new 可能为 null 或空对象
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        if (newData != null)
        {
            Assert.Empty(newData);
        }
    }

    [Fact]
    public void DiffKeyedObjReplace_AllPropertiesAdded_ReturnsNewValues()
    {
        // Arrange
        var oldJson = @"{ ""id"": 1 }";
        var newJson = @"{ ""id"": 1, ""a"": 1, ""b"": 2 }";
        var oldObj = JsonDocument.Parse(oldJson).RootElement;
        var newObj = JsonDocument.Parse(newJson).RootElement;

        // Act
        var result = DiffGeneratorObject.DiffKeyedObjReplace(oldObj, newObj, 1);

        // Assert
        Assert.NotNull(result);
        
        var newData = result[DiffConsts.newPropertyName] as JsonObject;
        Assert.NotNull(newData);
        Assert.Equal(1L, newData["a"]?.GetValue<long>());
        Assert.Equal(2L, newData["b"]?.GetValue<long>());
        
        // old 可能为 null 或空对象
        var oldData = result[DiffConsts.oldPropertyName] as JsonObject;
        if (oldData != null)
        {
            Assert.Empty(oldData);
        }
    }
}
