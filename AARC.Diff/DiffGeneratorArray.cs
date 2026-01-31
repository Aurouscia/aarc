using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff;

internal static class DiffGeneratorArray
{
    /// <summary>
    /// 对新旧两个数组进行diff<br/>
    /// 数组要么是“有主键的数组”，要么是“长数组”，要么是“短数组”，否则抛出异常
    /// </summary>
    /// <param name="oldArr"></param>
    /// <param name="newArr"></param>
    /// <param name="options"></param>
    /// <param name="path"></param>
    /// <param name="writeTo"></param>
    /// <exception cref="InvalidOperationException"></exception>
    public static void Diff(
        JsonElement oldArr, JsonElement newArr, DiffOptions options,
        string[] path, JsonNode writeTo)
    {
        if (oldArr.ValueKind != JsonValueKind.Array || newArr.ValueKind != JsonValueKind.Array)
            throw new DiffException("参数不是数组", path);
        var keyedArrayCfg = options.IsKeyedArrayConfig(path);
        var longArrayCfg = options.IsLongArrayConfig(path);
        if(keyedArrayCfg is not null)
            DiffKeyedArray(oldArr, newArr, keyedArrayCfg, path, writeTo);
        else if (longArrayCfg is not null)
            DiffLongArray(oldArr, newArr, longArrayCfg, path, writeTo);
        else
        {
            JsonArray oldArrNode = [];
            JsonArray newArrNode = [];
            DiffUtils.EnsureValidShortArray(oldArr, path, oldArrNode);
            DiffUtils.EnsureValidShortArray(newArr, path, newArrNode);
            DiffUtils.WriteOldNewNode(oldArrNode, newArrNode, path, writeTo);
        }
    }

    /// <summary>
    /// KeyedArray指“有主键的数组”，特点是每个元素都是对象且有id属性，属性略多（5～20个）<br/>
    /// 此处需要根据id找到新增和移除的对象，并将id相同但发生变化的对象交给<see cref="DiffGeneratorObject.DiffKeyedObjReplace"/>处理<br/>
    /// config可能传入“关心顺序”，在关心顺序的情况下，数组不会太长（1～50），如果顺序/长度变化则需要记录id数组<br/>
    /// 最终在writeTo写入"path":{add:[], remove:[], replace:[{old:{}, new:{}}]}, sequence:{old:[], new:[]}]
    /// </summary>
    /// <param name="oldArr"></param>
    /// <param name="newArr"></param>
    /// <param name="config"></param>
    /// <param name="path"></param>
    /// <param name="writeTo"></param>
    private static void DiffKeyedArray(
        JsonElement oldArr, JsonElement newArr, KeyedArrayConfig config,
         string[] path, JsonNode writeTo)
    {
        Dictionary<int, JsonElement> newArrDict = [];
        foreach (var newEl in newArr.EnumerateArray())
        {
            // 构造新数组字典
            var id = newEl.GetProperty(DiffConsts.keyPropertyName).GetInt32();
            newArrDict[id] = newEl;
        }

        HashSet<int> oldIds = [];
        var oldSequence = config.CareAboutOrder ? new List<int>(oldArr.GetArrayLength()) : null;

        foreach (var oldEl in oldArr.EnumerateArray())
        {
            var id = oldEl.GetProperty(DiffConsts.keyPropertyName).GetInt32();
            oldSequence?.Add(id);
            oldIds.Add(id);
            if (newArrDict.TryGetValue(id, out var newEl))
            {
                // 新旧都有
                var replaceObj = DiffGeneratorObject.DiffKeyedObjReplace(oldEl, newEl, id);
                if (replaceObj is not null)
                {
                    var pathStr = path.AsPathString();
                    writeTo[pathStr] ??= new JsonObject();
                    writeTo[pathStr]![DiffConsts.replacePropertyName] ??= new JsonArray();
                    writeTo[pathStr]![DiffConsts.replacePropertyName]!.AsArray().Add(replaceObj);
                }
            }
            else
            {
                // 旧有新无
                var pathStr = path.AsPathString();
                writeTo[pathStr] ??= new JsonObject();
                writeTo[pathStr]![DiffConsts.removePropertyName] ??= new JsonArray();
                writeTo[pathStr]![DiffConsts.removePropertyName]!.AsArray().Add(oldEl.ToJsonNode());
            }
        }

        foreach (var (key, newValue) in newArrDict)
        {
            if (!oldIds.Contains(key))
            {
                // 旧无新有
                var pathStr = path.AsPathString();
                writeTo[pathStr] ??= new JsonObject();
                writeTo[pathStr]![DiffConsts.addPropertyName] ??= new JsonArray();
                writeTo[pathStr]![DiffConsts.addPropertyName]!.AsArray().Add(newValue.ToJsonNode());
            }
        }

        if (oldSequence is not null)
        {
            bool sequenceSame = true;
            if (newArrDict.Count != oldArr.GetArrayLength())
                sequenceSame = false;
            else
                sequenceSame = newArrDict.Keys.SequenceEqual(oldSequence);
            if (!sequenceSame)
            {
                var oldSeq = new JsonArray();
                var newSeq = new JsonArray();
                foreach (var id in oldSequence)
                    oldSeq.Add(id);
                foreach (var id in newArrDict.Keys)
                    newSeq.Add(id);
                var pathStr = path.AsPathString();
                writeTo[pathStr] ??= new JsonObject();
                writeTo[pathStr]![DiffConsts.sequencePropertyName] = DiffUtils.CreateOldNewNode(oldSeq, newSeq);
            }
        }
    }
    
    /// <summary>
    /// LongArray指“长数组”，特点是每个元素都是对象且属性较少（2～4个），肯定不关心顺序<br/>
    /// 必须提供一个根据对象计算“唯一标识”字符串的委托<br/>
    /// 最终在writeTo写入"path":{add:[], remove:[], replace:[{old:{}, new:{}}]}，replace记录新旧整个对象
    /// </summary>
    /// <param name="oldArr"></param>
    /// <param name="newArr"></param>
    /// <param name="config"></param>
    /// <param name="path"></param>
    /// <param name="writeTo"></param>
    private static void DiffLongArray(
        JsonElement oldArr, JsonElement newArr, LongArrayConfig config,
         string[] path, JsonNode writeTo)
    {
        Dictionary<string, JsonElement> newArrDict = [];
        foreach (var newEl in newArr.EnumerateArray())
        {
            // 构造新数组字典
            var mark = config.EqualityMarkSelector(newEl);
            newArrDict[mark] = newEl;
        }

        HashSet<string> oldMark = [];
        foreach (var oldEl in oldArr.EnumerateArray())
        {
            var mark = config.EqualityMarkSelector(oldEl);
            oldMark.Add(mark);
            if (newArrDict.TryGetValue(mark, out var newEl))
            {
                // 新旧都有
                var isSame = DiffUtils.DeepEquals(oldEl, newEl);
                if (!isSame)
                {
                    var pathStr = path.AsPathString();
                    writeTo[pathStr] ??= new JsonObject();
                    writeTo[pathStr]![DiffConsts.replacePropertyName] ??= new JsonArray();
                    writeTo[pathStr]![DiffConsts.replacePropertyName]!.AsArray()
                        .Add(DiffUtils.CreateOldNewNode(oldEl.ToJsonNode(), newEl.ToJsonNode()));
                }
            }
            else
            {
                // 旧有新无
                var pathStr = path.AsPathString();
                writeTo[pathStr] ??= new JsonObject();
                writeTo[pathStr]![DiffConsts.removePropertyName] ??= new JsonArray();
                writeTo[pathStr]![DiffConsts.removePropertyName]!.AsArray().Add(oldEl.ToJsonNode());
            }
        }

        foreach (var (key, newValue) in newArrDict)
        {
            if (!oldMark.Contains(key))
            {
                // 旧无新有
                var pathStr = path.AsPathString();
                writeTo[pathStr] ??= new JsonObject();
                writeTo[pathStr]![DiffConsts.addPropertyName] ??= new JsonArray();
                writeTo[pathStr]![DiffConsts.addPropertyName]!.AsArray().Add(newValue.ToJsonNode());
            }
        }
    }
    
}