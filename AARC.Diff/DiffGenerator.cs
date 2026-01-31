using System.Text.Json;
using System.Text.Json.Nodes;

namespace AARC.Diff;

public static class DiffGenerator
{
    public static JsonNode Diff(JsonDocument oldObj, JsonDocument newObj, DiffOptions options)
    {
        JsonNode writeTo = new JsonObject();
        CheckJsonDocument(oldObj);
        CheckJsonDocument(newObj);
        DiffGeneratorObject.Diff(oldObj.RootElement, newObj.RootElement, options, [], writeTo);
        return writeTo;
    }

    public static JsonNode Diff(Stream oldJson, Stream newJson, DiffOptions options)
        => Diff(ParseStream(oldJson), ParseStream(newJson), options);
    public static JsonNode Diff(string oldJson, Stream newJson, DiffOptions options)
        => Diff(ParseString(oldJson), ParseStream(newJson), options);
    public static JsonNode Diff(Stream oldJson, string newJson, DiffOptions options)
        => Diff(ParseStream(oldJson), ParseString(newJson), options);
    public static JsonNode Diff(string oldJson, string newJson, DiffOptions options)
        => Diff(ParseString(oldJson), ParseString(newJson), options);

    private static JsonDocument ParseStream(Stream json)
    {
        JsonDocument doc;
        try { doc = JsonDocument.Parse(json); }
        catch { throw new DiffException("json格式异常", []); }
        CheckJsonDocument(doc);
        return doc;
    }
    private static JsonDocument ParseString(string json)
    {
        JsonDocument doc;
        try { doc = JsonDocument.Parse(json); }
        catch { throw new DiffException("json格式异常", []); }
        CheckJsonDocument(doc);
        return doc;
    }

    private static void CheckJsonDocument(JsonDocument doc)
    {
        if (doc.RootElement.ValueKind != JsonValueKind.Object)
            throw new DiffException("json不是对象", []);
    }
}