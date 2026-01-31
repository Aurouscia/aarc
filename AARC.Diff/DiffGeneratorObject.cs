using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff;

internal static class DiffGeneratorObject
{
    public static void Diff(
        JsonElement oldObj, JsonElement newObj, DiffOptions options,
        string[] path, JsonNode writeTo)
    {
        if (oldObj.ValueKind != JsonValueKind.Object || newObj.ValueKind != JsonValueKind.Object)
            throw new DiffException("参数不是对象", path);
        foreach (var oldProp in oldObj.EnumerateObject())
        {
            var propName = oldProp.Name;
            if (newObj.TryGetProperty(propName, out var newValue))
            {
                //新旧对象都有这个属性：递归
                string[] newPath = [..path, propName];
                DiffGeneratorElement.Diff(oldProp.Value, newValue, options, newPath, writeTo);
            }
            else
            {
                // 没有对应新值
                string[] newPath = [..path, propName];
                DiffUtils.WriteOldNewNode(oldProp.Value.ToJsonNode(), null, newPath, writeTo);
            }
        }
        foreach (var newProp in newObj.EnumerateObject())
        {
            var propName = newProp.Name;
            if (!oldObj.TryGetProperty(propName, out _))
            {
                // 没有对应旧值
                string[] newPath = [..path, propName];
                DiffUtils.WriteOldNewNode(null, newProp.Value.ToJsonNode(), newPath, writeTo);
            }
        }
    }

    /// <summary>
    /// 生成有主键对象的差异，逐个深对比属性，如果不同则写入replace对象中返回
    /// </summary>
    /// <param name="oldObj"></param>
    /// <param name="newObj"></param>
    /// <param name="key">id</param>
    /// <returns>replace数组对象</returns>
    public static JsonObject? DiffKeyedObjReplace(JsonElement oldObj, JsonElement newObj, int key)
    {
        JsonObject? res = null;
        foreach (var oldProp in oldObj.EnumerateObject())
        {
            var propName = oldProp.Name;
            if (newObj.TryGetProperty(propName, out var newValue))
            {
                // 如果新旧对象都有这个属性，但值不同，则新旧都记录
                if (!DiffUtils.DeepEquals(oldProp.Value, newValue))
                {
                    res ??= new JsonObject{ [DiffConsts.keyPropertyName] = key };
                    res[DiffConsts.oldPropertyName] ??= new JsonObject();
                    res[DiffConsts.oldPropertyName]![propName] = oldProp.Value.ToJsonNode();
                    res[DiffConsts.newPropertyName] ??= new JsonObject();
                    res[DiffConsts.newPropertyName]![propName] = newValue.ToJsonNode();
                }
            }
            else
            {
                // 如果没有对应新值，则记录旧的
                res ??= new JsonObject{ [DiffConsts.keyPropertyName] = key };
                res[DiffConsts.oldPropertyName] ??= new JsonObject();
                res[DiffConsts.oldPropertyName]![propName] = oldProp.Value.ToJsonNode();
            }
        }
        foreach (var newProp in newObj.EnumerateObject())
        {
            var propName = newProp.Name;
            if (!oldObj.TryGetProperty(propName, out _))
            {
                // 如果没有对应旧值，则记录新的
                res ??= new JsonObject{ [DiffConsts.keyPropertyName] = key };
                res[DiffConsts.newPropertyName] ??= new JsonObject();
                res[DiffConsts.newPropertyName]![propName] = newProp.Value.ToJsonNode();
            }
        }
        return res;
    }
}