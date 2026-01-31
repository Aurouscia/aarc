using System.Text.Json;

namespace AARC.Diff.Test;

public class DiffOptionsTests
{
    #region IsKeyedArrayConfig 测试

    [Fact]
    public void IsKeyedArrayConfig_NoConfigs_ReturnsNull()
    {
        // Arrange
        var options = new DiffOptions();

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "items" });

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void IsKeyedArrayConfig_MatchingPath_ReturnsConfig()
    {
        // Arrange
        var config = new KeyedArrayConfig(new[] { "items" }, false);
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [config]
        };

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "items" });

        // Assert
        Assert.NotNull(result);
        Assert.Equal(config, result);
        Assert.False(result.CareAboutOrder);
    }

    [Fact]
    public void IsKeyedArrayConfig_NonMatchingPath_ReturnsNull()
    {
        // Arrange
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(new[] { "items" }, false)]
        };

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "other" });

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void IsKeyedArrayConfig_NestedPath_Matches()
    {
        // Arrange
        var config = new KeyedArrayConfig(new[] { "data", "items" }, false);
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [config]
        };

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "data", "items" });

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public void IsKeyedArrayConfig_NestedPath_DifferentDepth_ReturnsNull()
    {
        // Arrange
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(new[] { "data", "items" }, false)]
        };

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "items" });

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void IsKeyedArrayConfig_MultipleConfigs_FirstMatchReturned()
    {
        // Arrange
        var config1 = new KeyedArrayConfig(new[] { "items" }, false);
        var config2 = new KeyedArrayConfig(new[] { "items" }, true);
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [config1, config2]
        };

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "items" });

        // Assert - 返回第一个匹配的
        Assert.NotNull(result);
        Assert.False(result.CareAboutOrder); // 第一个配置
    }

    [Fact]
    public void IsKeyedArrayConfig_DifferentCase_ReturnsNull()
    {
        // Arrange - 路径匹配区分大小写
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(new[] { "Items" }, false)]
        };

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "items" });

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void IsKeyedArrayConfig_CareAboutOrder_True()
    {
        // Arrange
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(new[] { "items" }, careAboutOrder: true)]
        };

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "items" });

        // Assert
        Assert.NotNull(result);
        Assert.True(result.CareAboutOrder);
    }

    #endregion

    #region IsLongArrayConfig 测试

    [Fact]
    public void IsLongArrayConfig_NoConfigs_ReturnsNull()
    {
        // Arrange
        var options = new DiffOptions();

        // Act
        var result = options.IsLongArrayConfig(new[] { "points" });

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void IsLongArrayConfig_MatchingPath_ReturnsConfig()
    {
        // Arrange
        var config = new LongArrayConfig(new[] { "points" }, el => el.GetProperty("id").GetRawText());
        var options = new DiffOptions
        {
            LongArrayConfigs = [config]
        };

        // Act
        var result = options.IsLongArrayConfig(new[] { "points" });

        // Assert
        Assert.NotNull(result);
        Assert.Equal(config, result);
    }

    [Fact]
    public void IsLongArrayConfig_NonMatchingPath_ReturnsNull()
    {
        // Arrange
        var options = new DiffOptions
        {
            LongArrayConfigs = [new LongArrayConfig(new[] { "points" }, el => "")]
        };

        // Act
        var result = options.IsLongArrayConfig(new[] { "other" });

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void IsLongArrayConfig_NestedPath_Matches()
    {
        // Arrange
        var options = new DiffOptions
        {
            LongArrayConfigs = [new LongArrayConfig(new[] { "data", "points" }, el => "")]
        };

        // Act
        var result = options.IsLongArrayConfig(new[] { "data", "points" });

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public void IsLongArrayConfig_EqualityMarkSelector_Works()
    {
        // Arrange
        var selector = (JsonElement el) => $"{el.GetProperty("x")},{el.GetProperty("y")}";
        var options = new DiffOptions
        {
            LongArrayConfigs = [new LongArrayConfig(new[] { "points" }, selector)]
        };

        // Act
        var result = options.IsLongArrayConfig(new[] { "points" });

        // Assert
        Assert.NotNull(result);
        
        // 测试 selector 工作正常
        var testJson = @"{ ""x"": 1, ""y"": 2 }";
        using var doc = JsonDocument.Parse(testJson);
        var key = result.EqualityMarkSelector(doc.RootElement);
        Assert.Equal("1,2", key);
    }

    #endregion

    #region 混合配置测试

    [Fact]
    public void BothConfigs_KeyedArrayTakesPrecedence()
    {
        // Arrange - 同时配置 KeyedArray 和 LongArray
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(new[] { "items" }, false)],
            LongArrayConfigs = [new LongArrayConfig(new[] { "items" }, el => "")]
        };

        // Act
        var keyedResult = options.IsKeyedArrayConfig(new[] { "items" });
        var longResult = options.IsLongArrayConfig(new[] { "items" });

        // Assert - 两者都能匹配到各自的配置
        Assert.NotNull(keyedResult);
        Assert.NotNull(longResult);
    }

    [Fact]
    public void BothConfigs_DifferentPaths_EachMatchesOwnPath()
    {
        // Arrange
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(new[] { "users" }, false)],
            LongArrayConfigs = [new LongArrayConfig(new[] { "points" }, el => "")]
        };

        // Act
        var usersKeyed = options.IsKeyedArrayConfig(new[] { "users" });
        var usersLong = options.IsLongArrayConfig(new[] { "users" });
        var pointsKeyed = options.IsKeyedArrayConfig(new[] { "points" });
        var pointsLong = options.IsLongArrayConfig(new[] { "points" });

        // Assert
        Assert.NotNull(usersKeyed);
        Assert.Null(usersLong);
        Assert.Null(pointsKeyed);
        Assert.NotNull(pointsLong);
    }

    #endregion

    #region 配置类属性测试

    [Fact]
    public void KeyedArrayConfig_Properties_CanBeModified()
    {
        // Arrange
        var config = new KeyedArrayConfig(new[] { "items" }, false);

        // Act
        config.TargetPath = new[] { "other" };
        config.CareAboutOrder = true;

        // Assert
        Assert.Equal(new[] { "other" }, config.TargetPath);
        Assert.True(config.CareAboutOrder);
    }

    [Fact]
    public void LongArrayConfig_Properties_CanBeModified()
    {
        // Arrange
        var originalSelector = (JsonElement el) => "original";
        var newSelector = (JsonElement el) => "new";
        var config = new LongArrayConfig(new[] { "points" }, originalSelector);

        // Act
        config.TargetPath = new[] { "other" };
        config.EqualityMarkSelector = newSelector;

        // Assert
        Assert.Equal(new[] { "other" }, config.TargetPath);
        Assert.Equal(newSelector, config.EqualityMarkSelector);
    }

    [Fact]
    public void ArrayConfig_Inheritance_KeyedArrayIsArrayConfig()
    {
        // Arrange & Act
        var config = new KeyedArrayConfig(new[] { "items" }, false);

        // Assert
        Assert.IsAssignableFrom<ArrayConfig>(config);
    }

    [Fact]
    public void ArrayConfig_Inheritance_LongArrayIsArrayConfig()
    {
        // Arrange & Act
        var config = new LongArrayConfig(new[] { "points" }, el => "");

        // Assert
        Assert.IsAssignableFrom<ArrayConfig>(config);
    }

    #endregion

    #region 边界情况测试

    [Fact]
    public void IsKeyedArrayConfig_EmptyPath_MatchesEmptyPathConfig()
    {
        // Arrange
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(Array.Empty<string>(), false)]
        };

        // Act
        var result = options.IsKeyedArrayConfig(Array.Empty<string>());

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public void IsKeyedArrayConfig_EmptyPath_DoesNotMatchNonEmptyPath()
    {
        // Arrange
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [new KeyedArrayConfig(Array.Empty<string>(), false)]
        };

        // Act
        var result = options.IsKeyedArrayConfig(new[] { "items" });

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void EmptyOptions_AllMethodsReturnNull()
    {
        // Arrange
        var options = new DiffOptions();

        // Act
        var keyedResult = options.IsKeyedArrayConfig(new[] { "any" });
        var longResult = options.IsLongArrayConfig(new[] { "any" });

        // Assert
        Assert.Null(keyedResult);
        Assert.Null(longResult);
        Assert.Null(options.KeyedArrayConfigs);
        Assert.Null(options.LongArrayConfigs);
    }

    [Fact]
    public void MultipleConfigs_DifferentPaths_AllMatchCorrectly()
    {
        // Arrange
        var options = new DiffOptions
        {
            KeyedArrayConfigs = [
                new KeyedArrayConfig(new[] { "users" }, false),
                new KeyedArrayConfig(new[] { "data", "items" }, true)
            ],
            LongArrayConfigs = [
                new LongArrayConfig(new[] { "points" }, el => ""),
                new LongArrayConfig(new[] { "coords", "list" }, el => "")
            ]
        };

        // Act & Assert
        Assert.NotNull(options.IsKeyedArrayConfig(new[] { "users" }));
        Assert.NotNull(options.IsKeyedArrayConfig(new[] { "data", "items" }));
        Assert.Null(options.IsKeyedArrayConfig(new[] { "points" }));
        
        Assert.NotNull(options.IsLongArrayConfig(new[] { "points" }));
        Assert.NotNull(options.IsLongArrayConfig(new[] { "coords", "list" }));
        Assert.Null(options.IsLongArrayConfig(new[] { "users" }));
    }

    #endregion
}
