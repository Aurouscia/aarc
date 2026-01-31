using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff.Test;

public class DiffGeneratorKeyedArrayTests
{
    [Fact]
    public void Diff_KeyedArray_ElementAdded_RecordsAdd()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
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
        Assert.Equal(2L, addedItem["id"]?.GetValue<long>());
        Assert.Equal("B", addedItem["name"]?.GetValue<string>());
        
        // 不应该有 remove 和 replace
        Assert.Null(itemsDiff["remove"]);
        Assert.Null(itemsDiff["replace"]);
    }

    [Fact]
    public void Diff_KeyedArray_ElementRemoved_RecordsRemove()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
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
        Assert.Equal(2L, removedItem["id"]?.GetValue<long>());
        Assert.Equal("B", removedItem["name"]?.GetValue<string>());
        
        Assert.Null(itemsDiff["add"]);
        Assert.Null(itemsDiff["replace"]);
    }

    [Fact]
    public void Diff_KeyedArray_ElementModified_RecordsReplace()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A"", ""value"": 10}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A"", ""value"": 20}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
        
        var replaceItem = replaceArray[0] as JsonObject;
        Assert.NotNull(replaceItem);
        Assert.Equal(1, replaceItem["id"]?.GetValue<int>());
        
        var oldValues = replaceItem["old"] as JsonObject;
        var newValues = replaceItem["new"] as JsonObject;
        Assert.NotNull(oldValues);
        Assert.NotNull(newValues);
        Assert.Equal(10L, oldValues["value"]?.GetValue<long>());
        Assert.Equal(20L, newValues["value"]?.GetValue<long>());
    }

    [Fact]
    public void Diff_KeyedArray_MultiplePropertyChanges_RecordsAllChanges()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A"", ""value"": 10, ""desc"": ""old""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""B"", ""value"": 20, ""desc"": ""old""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
        
        var replaceItem = replaceArray[0] as JsonObject;
        Assert.NotNull(replaceItem);
        
        var oldValues = replaceItem["old"] as JsonObject;
        var newValues = replaceItem["new"] as JsonObject;
        
        // name 和 value 都变了
        Assert.Equal("A", oldValues?["name"]?.GetValue<string>());
        Assert.Equal("B", newValues?["name"]?.GetValue<string>());
        Assert.Equal(10L, oldValues?["value"]?.GetValue<long>());
        Assert.Equal(20L, newValues?["value"]?.GetValue<long>());
        
        // desc 没变，不应该出现在 replace 中
        Assert.Null(oldValues?["desc"]);
        Assert.Null(newValues?["desc"]);
    }

    [Fact]
    public void Diff_KeyedArray_PropertyAddedInElement_RecordsInReplace()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A"", ""value"": 10}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
        
        var replaceItem = replaceArray[0] as JsonObject;
        var newValues = replaceItem?["new"] as JsonObject;
        Assert.NotNull(newValues);
        Assert.Equal(10L, newValues["value"]?.GetValue<long>());
        
        // old 中不应该有 value
        var oldValues = replaceItem?["old"] as JsonObject;
        Assert.Null(oldValues?["value"]);
    }

    [Fact]
    public void Diff_KeyedArray_PropertyRemovedInElement_RecordsInReplace()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A"", ""value"": 10}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
        
        var replaceItem = replaceArray[0] as JsonObject;
        var oldValues = replaceItem?["old"] as JsonObject;
        Assert.NotNull(oldValues);
        Assert.Equal(10L, oldValues["value"]?.GetValue<long>());
        
        // new 中不应该有 value
        var newValues = replaceItem?["new"] as JsonObject;
        Assert.Null(newValues?["value"]);
    }

    [Fact]
    public void Diff_KeyedArray_NoChange_ReturnsEmpty()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_KeyedArray_CareAboutOrder_SequenceChanged_RecordsSequence()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var newJson = @"{ ""items"": [{""id"": 2, ""name"": ""B""}, {""id"": 1, ""name"": ""A""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], careAboutOrder: true)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        var sequence = itemsDiff["sequence"] as JsonObject;
        Assert.NotNull(sequence);
        
        var oldSeq = sequence["old"] as JsonArray;
        var newSeq = sequence["new"] as JsonArray;
        Assert.NotNull(oldSeq);
        Assert.NotNull(newSeq);
        
        Assert.Equal(2, oldSeq.Count);
        Assert.Equal(2, newSeq.Count);
        Assert.Equal(1, oldSeq[0]?.GetValue<int>());
        Assert.Equal(2, oldSeq[1]?.GetValue<int>());
        Assert.Equal(2, newSeq[0]?.GetValue<int>());
        Assert.Equal(1, newSeq[1]?.GetValue<int>());
    }

    [Fact]
    public void Diff_KeyedArray_CareAboutOrder_SequenceSame_NoSequenceField()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], careAboutOrder: true)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_KeyedArray_CareAboutOrder_LengthChanged_RecordsSequence()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], careAboutOrder: true)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        // 应该有 add 和 sequence
        Assert.NotNull(itemsDiff["add"]);
        Assert.NotNull(itemsDiff["sequence"]);
    }

    [Fact]
    public void Diff_KeyedArray_DoNotCareAboutOrder_NoSequenceField()
    {
        // Arrange
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var newJson = @"{ ""items"": [{""id"": 2, ""name"": ""B""}, {""id"": 1, ""name"": ""A""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], careAboutOrder: false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_KeyedArray_ComplexScenario_AddRemoveModify()
    {
        // Arrange
        // id=1 修改，id=2 删除，id=3 新增
        var oldJson = @"{ ""items"": [{""id"": 1, ""name"": ""A""}, {""id"": 2, ""name"": ""B""}] }";
        var newJson = @"{ ""items"": [{""id"": 1, ""name"": ""A2""}, {""id"": 3, ""name"": ""C""}] }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["items"], false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var itemsDiff = result["items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        
        // 检查 add
        var addArray = itemsDiff["add"] as JsonArray;
        Assert.NotNull(addArray);
        Assert.Single(addArray);
        Assert.Equal(3L, addArray[0]?["id"]?.GetValue<long>());
        
        // 检查 remove
        var removeArray = itemsDiff["remove"] as JsonArray;
        Assert.NotNull(removeArray);
        Assert.Single(removeArray);
        Assert.Equal(2L, removeArray[0]?["id"]?.GetValue<long>());
        
        // 检查 replace
        var replaceArray = itemsDiff["replace"] as JsonArray;
        Assert.NotNull(replaceArray);
        Assert.Single(replaceArray);
        Assert.Equal(1, replaceArray[0]?["id"]?.GetValue<int>());
    }

    [Fact]
    public void Diff_KeyedArray_NestedPath_UsesCorrectPath()
    {
        // Arrange
        var oldJson = @"{ ""data"": { ""items"": [{""id"": 1, ""name"": ""A""}] } }";
        var newJson = @"{ ""data"": { ""items"": [{""id"": 1, ""name"": ""B""}] } }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(["data", "items"], false)]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - 路径是 "data/items"
        var itemsDiff = result["data/items"] as JsonObject;
        Assert.NotNull(itemsDiff);
        Assert.NotNull(itemsDiff["replace"]);
    }

    [Fact]
    public void Diff_KeyedArray_MultipleArrays_DifferentConfigs()
    {
        // Arrange
        var oldJson = @"{ 
            ""users"": [{""id"": 1, ""name"": ""Alice""}],
            ""items"": [{""id"": 1, ""name"": ""Item1""}]
        }";
        var newJson = @"{ 
            ""users"": [{""id"": 1, ""name"": ""Bob""}],
            ""items"": [{""id"": 1, ""name"": ""Item2""}]
        }";
        var options = new DiffOptions
        {
            KeyedArrayConfigs = 
            [
                new KeyedArrayConfig(["users"], false),
                new KeyedArrayConfig(["items"], true)
            ]
        };

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var usersDiff = result["users"] as JsonObject;
        var itemsDiff = result["items"] as JsonObject;
        
        Assert.NotNull(usersDiff);
        Assert.NotNull(itemsDiff);
        Assert.NotNull(usersDiff["replace"]);
        Assert.NotNull(itemsDiff["replace"]);
    }
}
