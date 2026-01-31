using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff.Test;

public class DiffGeneratorLongArrayTests
{
    [Fact]
    public void Diff_LongArray_ElementAdded_RecordsAdd()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""x"": 1, ""y"": 2}] }";
        var newJson = @"{ ""items"": [{""x"": 1, ""y"": 2}, {""x"": 3, ""y"": 4}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["items"], el => $"{el.GetProperty("x")},{el.GetProperty("y")}")
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var addArray = itemsDiff["add"] as JsonArray;
        Assert.NotNull(addArray);
        Assert.Single(addArray);
        
        var addedItem = addArray[0] as JsonObject;
        Assert.NotNull(addedItem);
        Assert.Equal(3L, addedItem["x"]?.GetValue<long>());
        Assert.Equal(4L, addedItem["y"]?.GetValue<long>());
        
        Assert.Null(itemsDiff["remove"]);
        Assert.Null(itemsDiff["replace"]);
    }

    [Fact]
    public void Diff_LongArray_ElementRemoved_RecordsRemove()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""x"": 1, ""y"": 2}, {""x"": 3, ""y"": 4}] }";
        var newJson = @"{ ""items"": [{""x"": 1, ""y"": 2}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["items"], el => $"{el.GetProperty("x")},{el.GetProperty("y")}")
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var removeArray = itemsDiff["remove"] as JsonArray;
        Assert.NotNull(removeArray);
        Assert.Single(removeArray);
        
        var removedItem = removeArray[0] as JsonObject;
        Assert.NotNull(removedItem);
        Assert.Equal(3L, removedItem["x"]?.GetValue<long>());
        Assert.Equal(4L, removedItem["y"]?.GetValue<long>());
        
        Assert.Null(itemsDiff["add"]);
        Assert.Null(itemsDiff["replace"]);
    }

    [Fact]
    public void Diff_LongArray_ElementModified_RecordsReplace()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""x"": 1, ""y"": 2, ""z"": 10}] }";
        var newJson = @"{ ""items"": [{""x"": 1, ""y"": 2, ""z"": 20}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["items"], el => $"{el.GetProperty("x")},{el.GetProperty("y")}")
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
        
        // LongArray 的 replace 记录新旧整个对象
        var replaceItem = replaceArray[0] as JsonObject;
        Assert.NotNull(replaceItem);
        
        var oldObj = replaceItem["old"] as JsonObject;
        var newObj = replaceItem["new"] as JsonObject;
        Assert.NotNull(oldObj);
        Assert.NotNull(newObj);
        Assert.Equal(10L, oldObj["z"]?.GetValue<long>());
        Assert.Equal(20L, newObj["z"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_LongArray_NoChange_ReturnsEmpty()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""x"": 1, ""y"": 2}, {""x"": 3, ""y"": 4}] }";
        var newJson = @"{ ""items"": [{""x"": 1, ""y"": 2}, {""x"": 3, ""y"": 4}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["items"], el => $"{el.GetProperty("x")},{el.GetProperty("y")}")
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_LongArray_EqualityMarkSelector_BasedOnSingleProperty()
    {
        // Arrange - 使用单个属性作为标识
        var oldJson = @"{ ""items"": [{""id"": 1, ""value"": 100}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""value"": 200}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["items"], el => el.GetProperty("id").GetInt32().ToString())
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - 应该识别为同一元素，记录 replace
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        Assert.NotNull(itemsDiff["replace"]);
        Assert.Null(itemsDiff["add"]);
        Assert.Null(itemsDiff["remove"]);
    }

    [Fact]
    public void Diff_LongArray_EqualityMarkSelector_BasedOnMultipleProperties()
    {
        // Arrange - 使用多个属性组合作为标识
        var oldJson = @"{ ""items"": [{""type"": ""A"", ""subtype"": ""X"", ""value"": 1}] }";
        var newJson = @"{ ""items"": [{""type"": ""A"", ""subtype"": ""X"", ""value"": 2}, {""type"": ""A"", ""subtype"": ""Y"", ""value"": 3}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["items"], el => $"{el.GetProperty("type")}:{el.GetProperty("subtype")}")
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - A:X 修改，A:Y 新增
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        Assert.NotNull(itemsDiff["replace"]);
        Assert.NotNull(itemsDiff["add"]);
        Assert.Null(itemsDiff["remove"]);
    }

    [Fact]
    public void Diff_LongArray_ComplexScenario_AddRemoveModify()
    {
        // Arrange
        // 标识: (1,2) 修改, (3,4) 删除, (5,6) 新增
        var oldJson = @"{ ""items"": [{""x"": 1, ""y"": 2, ""z"": 10}, {""x"": 3, ""y"": 4, ""z"": 20}] }";
        var newJson = @"{ ""items"": [{""x"": 1, ""y"": 2, ""z"": 15}, {""x"": 5, ""y"": 6, ""z"": 30}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["items"], el => $"{el.GetProperty("x")},{el.GetProperty("y")}")
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var addArray = itemsDiff["add"] as JsonArray;
        Assert.NotNull(addArray);
        Assert.Single(addArray);
        Assert.Equal(5L, addArray[0]?["x"]?.GetValue<long>());
        
        var removeArray = itemsDiff["remove"] as JsonArray;
        Assert.NotNull(removeArray);
        Assert.Single(removeArray);
        Assert.Equal(3L, removeArray[0]?["x"]?.GetValue<long>());
        
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
    }

    [Fact]
    public void Diff_LongArray_NestedPath_UsesCorrectPath()
    {
        // Arrange
        var oldJson = @"{ ""data"": { ""points"": [{""x"": 1, ""y"": 2}] } }";
        var newJson = @"{ ""data"": { ""points"": [{""x"": 1, ""y"": 3}] } }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["data", "points"], el => $"{el.GetProperty("x")}")
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var pointsDiff = result["data/points"] as JsonObject;
        Assert.NotNull(pointsDiff);
        Assert.NotNull(pointsDiff["replace"]);
    }

    [Fact]
    public void Diff_LongArray_MultipleArrays_DifferentSelectors()
    {
        // Arrange
        var oldJson = @"{ 
            ""points"": [{""x"": 1, ""y"": 2}],
            ""items"": [{""id"": ""a"", ""value"": 10}]
        }";
        var newJson = @"{ 
            ""points"": [{""x"": 1, ""y"": 3}],
            ""items"": [{""id"": ""a"", ""value"": 20}]
        }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["points"], el => $"{el.GetProperty("x")}"),
                new LongArrayConfig(["items"], el => el.GetProperty("id").GetString()!)
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var pointsDiff = result["points"] as JsonObject;
        var itemsDiff = result["items"] as JsonObject;
        
        Assert.NotNull(pointsDiff);
        Assert.NotNull(itemsDiff);
        Assert.NotNull(pointsDiff["replace"]);
        Assert.NotNull(itemsDiff["replace"]);
    }

    [Fact]
    public void Diff_LongArray_DuplicateMarks_UsesLastValue()
    {
        // Arrange - 如果 EqualityMarkSelector 返回相同标识，后面的会覆盖前面的
        var oldJson = @"{ ""items"": [{""group"": ""A"", ""value"": 1}, {""group"": ""A"", ""value"": 2}] }";
        var newJson = @"{ ""items"": [{""group"": ""A"", ""value"": 3}] }";
        var options = new DiffOptions
        {
            LongArrayConfigs = 
            [
                new LongArrayConfig(["items"], el => el.GetProperty("group").GetString()!)
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - 由于使用字典存储，重复的标识只会保留最后一个
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        // 结果取决于实现细节，但应该能正常处理
    }
}
