using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff;

internal static class DiffUtils
{
    public static string AsPathString(this string[] path)
    {
        return string.Join('/', path);
    }

    public static void WriteOldNewNode(JsonElement oldEl, JsonElement newEl, string[] path, JsonNode writeTo)
        => WriteOldNewNode(oldEl.ToJsonNode(), newEl.ToJsonNode(), path, writeTo);
    
    public static void WriteOldNewNode(JsonNode? oldNode, JsonNode? newNode, string[] path, JsonNode writeTo)
    {
        var node = CreateOldNewNode(oldNode, newNode);
        writeTo[path.AsPathString()] = node;
    }

    public static JsonObject CreateOldNewNode(JsonNode? oldNode, JsonNode? newNode)
    {
        var node = new JsonObject();
        if (oldNode is not null)
            node[DiffConsts.oldPropertyName] = oldNode;
        if (newNode is not null)
            node[DiffConsts.newPropertyName] = newNode;
        return node;
    }

    public static void EnsureValidArray(JsonElement array, string[] path, DiffOptions options)
    {
        if (array.ValueKind != JsonValueKind.Array)
            throw new DiffException("必须是数组", path);
        var keyedArrayCfg = options.IsKeyedArrayConfig(path);
        var longArrayCfg = options.IsLongArrayConfig(path);
        if (keyedArrayCfg is null && longArrayCfg is null)
        {
            try { EnsureValidShortArray(array, path, null); }
            catch { throw new DiffException("不在配置中的非短数组", path); }
        }
    }

    public static void EnsureValidShortArray(JsonElement array, string[] path, JsonArray? writeTo)
    {
        if (array.ValueKind != JsonValueKind.Array)
            throw new DiffException("必须是数组", path);
        var length = array.GetArrayLength();
        if(length != 2)
            throw new DiffException("短数组长度必须为2", path);
        decimal num0, num1;
        try
        {
            num0 = array[0].GetDecimal();
            num1 = array[1].GetDecimal();
        }
        catch { throw new DiffException("短数组元素必须为数字", path); }
        if (writeTo is not null)
        {
            writeTo.Add(num0);
            writeTo.Add(num1);
        }
    }
    
    public static JsonNode? ToJsonNode(this JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                var obj = new JsonObject();
                foreach (var property in element.EnumerateObject())
                {
                    obj[property.Name] = property.Value.ToJsonNode();
                }
                return obj;

            case JsonValueKind.Array:
                var arr = new JsonArray();
                foreach (var item in element.EnumerateArray())
                {
                    arr.Add(item.ToJsonNode());
                }
                return arr;

            case JsonValueKind.String:
                return JsonValue.Create(element.GetString());

            case JsonValueKind.Number:
                // 尝试保持原始数字类型
                if (element.TryGetInt64(out long l))
                    return JsonValue.Create(l);
                if (element.TryGetDouble(out double d))
                    return JsonValue.Create(d);
                return JsonValue.Create(element.GetRawText());

            case JsonValueKind.True:
                return JsonValue.Create(true);

            case JsonValueKind.False:
                return JsonValue.Create(false);

            case JsonValueKind.Undefined:
            case JsonValueKind.Null:
                return null;

            default:
                throw new NotSupportedException($"不支持的JsonValueKind: {element.ValueKind}");
        }
    }
    
    /// <summary>
    /// 递归深度比较两个 JsonElement 是否相等
    /// </summary>
    public static bool DeepEquals(JsonElement a, JsonElement b)
    {
        // 1. 类型必须相同
        if (a.ValueKind != b.ValueKind)
            return false;

        return a.ValueKind switch
        {
            JsonValueKind.Object => CompareObject(a, b),
            JsonValueKind.Array => CompareArray(a, b),
            JsonValueKind.String => a.GetString() == b.GetString(),
            JsonValueKind.Number => CompareNumber(a, b),
            JsonValueKind.True => true,   // 都是 true
            JsonValueKind.False => true,  // 都是 false
            JsonValueKind.Null => true,   // 都是 null
            _ => false
        };
    }

    private static bool CompareObject(JsonElement a, JsonElement b)
    {
        // 属性数量相同
        var propsA = a.EnumerateObject().ToArray();
        var propsB = b.EnumerateObject().ToArray();
        
        if (propsA.Length != propsB.Length)
            return false;

        // 属性名排序后比较（忽略顺序）
        var dictA = propsA.ToDictionary(p => p.Name, p => p.Value);
        var dictB = propsB.ToDictionary(p => p.Name, p => p.Value);

        foreach (var (name, valueA) in dictA)
        {
            if (!dictB.TryGetValue(name, out var valueB))
                return false;  // b 缺少属性
            
            if (!DeepEquals(valueA, valueB))
                return false;  // 属性值不等
        }

        return true;
    }

    private static bool CompareArray(JsonElement a, JsonElement b)
    {
        var arrA = a.EnumerateArray().ToArray();
        var arrB = b.EnumerateArray().ToArray();

        if (arrA.Length != arrB.Length)
            return false;

        // 数组按顺序比较
        for (int i = 0; i < arrA.Length; i++)
        {
            if (!DeepEquals(arrA[i], arrB[i]))
                return false;
        }

        return true;
    }

    private static bool CompareNumber(JsonElement a, JsonElement b)
    {
        return a.GetDecimal() == b.GetDecimal();
    }
}