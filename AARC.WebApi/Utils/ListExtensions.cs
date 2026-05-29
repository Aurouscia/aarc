namespace AARC.WebApi.Utils;

public static class ListExtensions
{
    public static List<T> DistinctAndTake<T>(this List<T>? source, int x)
    {
        if (source is null || x <= 0)
            return [];

        var distinctSet = new HashSet<T>(source);
        var distinctList = distinctSet.ToList();

        if (distinctList.Count <= x)
            return distinctList;
        return distinctList.Take(x).ToList();
    }

    /// <summary>
    /// 按 keyList 中 key 的顺序对列表进行排序。不在 keyList 中的元素排在末尾。
    /// </summary>
    public static void OrderByKeyList<T, TKey>(
        this List<T> source, Func<T, TKey> keySelector, List<TKey> keyList)
        where TKey : notnull
    {
        var orderDict = keyList
            .Select((key, idx) => (key, idx))
            .ToDictionary(x => x.key, x => x.idx);
        source.Sort((a, b) =>
        {
            int orderA = orderDict.TryGetValue(keySelector(a), out var idxA) ? idxA : int.MaxValue;
            int orderB = orderDict.TryGetValue(keySelector(b), out var idxB) ? idxB : int.MaxValue;
            return orderA.CompareTo(orderB);
        });
    }
}