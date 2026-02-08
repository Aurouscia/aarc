namespace AARC.Utils;

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
}