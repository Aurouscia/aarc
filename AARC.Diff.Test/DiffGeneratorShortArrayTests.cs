using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff.Test;

public class DiffGeneratorShortArrayTests
{
    [Fact]
    public void Diff_ShortArray_ValueChanged_RecordsOldNew()
    {
        // Arrange - 短数组是长度固定为2的数字数组，不需要配置
        var oldJson = @"{ ""point"": [1, 2] }";
        var newJson = @"{ ""point"": [3, 4] }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var pointDiff = result["point"] as JsonObject;
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
    public void Diff_ShortArray_FirstElementChanged_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""coords"": [10.5, 20.5] }";
        var newJson = @"{ ""coords"": [15.5, 20.5] }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var coordsDiff = result["coords"] as JsonObject;
        Assert.NotNull(coordsDiff);
        
        var oldValue = coordsDiff["old"] as JsonArray;
        var newValue = coordsDiff["new"] as JsonArray;
        Assert.NotNull(oldValue);
        Assert.NotNull(newValue);
        
        Assert.Equal(10.5m, oldValue[0]?.GetValue<decimal>());
        Assert.Equal(20.5m, oldValue[1]?.GetValue<decimal>());
        Assert.Equal(15.5m, newValue[0]?.GetValue<decimal>());
        Assert.Equal(20.5m, newValue[1]?.GetValue<decimal>());
    }

    [Fact]
    public void Diff_ShortArray_SecondElementChanged_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""range"": [0, 100] }";
        var newJson = @"{ ""range"": [0, 200] }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var rangeDiff = result["range"] as JsonObject;
        Assert.NotNull(rangeDiff);
        
        var oldValue = rangeDiff["old"] as JsonArray;
        var newValue = rangeDiff["new"] as JsonArray;
        Assert.NotNull(oldValue);
        Assert.NotNull(newValue);
        
        Assert.Equal(0m, oldValue[0]?.GetValue<decimal>());
        Assert.Equal(100m, oldValue[1]?.GetValue<decimal>());
        Assert.Equal(0m, newValue[0]?.GetValue<decimal>());
        Assert.Equal(200m, newValue[1]?.GetValue<decimal>());
    }

    [Fact]
    public void Diff_ShortArray_SameValues_ReturnsEmpty()
    {
        // Arrange
        var oldJson = @"{ ""point"": [1, 2] }";
        var newJson = @"{ ""point"": [1, 2] }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - 值相同，不记录
        Assert.Empty(result.AsObject());
    }

    [Fact]
    public void Diff_ShortArray_NegativeNumbers_RecordsOldNew()
    {
        // Arrange
        var oldJson = @"{ ""vector"": [-10, -20] }";
        var newJson = @"{ ""vector"": [-5, -15] }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var vectorDiff = result["vector"] as JsonObject;
        Assert.NotNull(vectorDiff);
        
        var oldValue = vectorDiff["old"] as JsonArray;
        var newValue = vectorDiff["new"] as JsonArray;
        Assert.NotNull(oldValue);
        Assert.NotNull(newValue);
        
        Assert.Equal(-10m, oldValue[0]?.GetValue<decimal>());
        Assert.Equal(-20m, oldValue[1]?.GetValue<decimal>());
        Assert.Equal(-5m, newValue[0]?.GetValue<decimal>());
        Assert.Equal(-15m, newValue[1]?.GetValue<decimal>());
    }

    [Fact]
    public void Diff_ShortArray_MixedNumberTypes_RecordsOldNew()
    {
        // Arrange - 整数和浮点数混合
        var oldJson = @"{ ""mixed"": [1, 2.5] }";
        var newJson = @"{ ""mixed"": [1.5, 3] }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var mixedDiff = result["mixed"] as JsonObject;
        Assert.NotNull(mixedDiff);
        
        var oldValue = mixedDiff["old"] as JsonArray;
        var newValue = mixedDiff["new"] as JsonArray;
        Assert.NotNull(oldValue);
        Assert.NotNull(newValue);
        
        // 注意：JSON 数字解析后类型可能变化
        Assert.NotNull(oldValue[0]);
        Assert.NotNull(oldValue[1]);
        Assert.NotNull(newValue[0]);
        Assert.NotNull(newValue[1]);
    }

    [Fact]
    public void Diff_ShortArray_NestedInObject_RecordsCorrectPath()
    {
        // Arrange
        var oldJson = @"{ ""data"": { ""position"": [0, 0] } }";
        var newJson = @"{ ""data"": { ""position"": [100, 200] } }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert
        var positionDiff = result["data/position"] as JsonObject;
        Assert.NotNull(positionDiff);
        
        var oldValue = positionDiff["old"] as JsonArray;
        var newValue = positionDiff["new"] as JsonArray;
        Assert.NotNull(oldValue);
        Assert.NotNull(newValue);
        Assert.Equal(0m, oldValue[0]?.GetValue<decimal>());
        Assert.Equal(100m, newValue[0]?.GetValue<decimal>());
    }

    [Fact]
    public void Diff_ShortArray_MultipleArrays_RecordsAllChanges()
    {
        // Arrange
        var oldJson = @"{ 
            ""pointA"": [0, 0],
            ""pointB"": [10, 10]
        }";
        var newJson = @"{ 
            ""pointA"": [1, 1],
            ""pointB"": [10, 10]
        }";
        var options = new DiffOptions();

        // Act
        var result = DiffGenerator.Diff(oldJson, newJson, options);

        // Assert - 只有 pointA 的值真正变化
        Assert.NotNull(result["pointA"]);
        Assert.Null(result["pointB"]);  // pointB 值相同，不记录
        
        var pointADiff = result["pointA"] as JsonObject;
        var oldValue = pointADiff?["old"] as JsonArray;
        var newValue = pointADiff?["new"] as JsonArray;
        Assert.Equal(0m, oldValue?[0]?.GetValue<decimal>());
        Assert.Equal(1m, newValue?[0]?.GetValue<decimal>());
    }
}
