namespace AARC.Diff;

public class DiffException: Exception
{
    public string Path { get; }
    public DiffException(string message, string[] path) : base(message)
    {
        if (path.Length > 0)
            Path = string.Join('/', path);
        else
            Path = "<root>";
    }

    public override string ToString()
    {
        return $"Diff异常发生于[{Path}]: {base.ToString()}";
    }
}