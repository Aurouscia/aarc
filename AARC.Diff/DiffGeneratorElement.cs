using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff;

public static class DiffGeneratorElement
{
    public static void Diff(
        JsonElement oldEl, JsonElement newEl, DiffOptions options,
        string[] path, JsonNode writeTo)
    {
        if (oldEl.ValueKind != newEl.ValueKind)
        {
            if(oldEl.ValueKind == JsonValueKind.Array)
                DiffUtils.EnsureValidArray(oldEl, path, options);
            if (newEl.ValueKind == JsonValueKind.Array)
                DiffUtils.EnsureValidArray(newEl, path, options);
            DiffUtils.WriteOldNewNode(oldEl, newEl, path, writeTo);
            return;
        }
        var kind = oldEl.ValueKind;
        if (kind == JsonValueKind.Array)
            DiffGeneratorArray.Diff(oldEl, newEl, options, path, writeTo);
        else if (kind == JsonValueKind.Object)
            DiffGeneratorObject.Diff(oldEl, newEl, options, path, writeTo);
        else
        {
            if (!DiffUtils.DeepEquals(oldEl, newEl))
                DiffUtils.WriteOldNewNode(oldEl, newEl, path, writeTo);
        }
    }
}