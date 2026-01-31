using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff;

public class DiffOptions
{
    public List<KeyedArrayConfig>? KeyedArrayConfigs { get; set; }
    public List<LongArrayConfig>? LongArrayConfigs { get; set; }

    public KeyedArrayConfig? IsKeyedArrayConfig(string[] path)
        => KeyedArrayConfigs?.FirstOrDefault(config => IsPathSame(config.TargetPath, path));
    public LongArrayConfig? IsLongArrayConfig(string[] path)
        => LongArrayConfigs?.FirstOrDefault(config => IsPathSame(config.TargetPath, path));

    private static bool IsPathSame(string[] path0, string[] path1)
    {   
        if (path0.Length != path1.Length)  return false;
        return path0.AsSpan().SequenceEqual(path1);
    }
}

public class ArrayConfig(string[] targetPath)
{
    public string[] TargetPath { get; set; } = targetPath;
}

public class KeyedArrayConfig(string[] targetPath, bool careAboutOrder) : ArrayConfig(targetPath)
{
    public bool CareAboutOrder { get; set; } = careAboutOrder;
}

public class LongArrayConfig(string[] targetPath, Func<JsonElement, string> equalityMarkSelector) : ArrayConfig(targetPath)
{
    public Func<JsonElement, string> EqualityMarkSelector { get; set; } = equalityMarkSelector;
}