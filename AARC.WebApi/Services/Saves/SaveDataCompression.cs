using LZStringCSharp;

namespace AARC.WebApi.Services.Saves;

/// <summary>
/// Save 数据压缩/解压工具类
/// </summary>
public static class SaveDataCompression
{
    /// <summary>
    /// 将 JSON 字符串压缩为 byte[]
    /// </summary>
    public static byte[] Compress(string jsonData)
    {
        if (string.IsNullOrEmpty(jsonData))
            return [];
        return LZString.CompressToUint8Array(jsonData);
    }

    /// <summary>
    /// 将 byte[] 解压为 JSON 字符串
    /// </summary>
    public static string? Decompress(byte[]? compressedData)
    {
        if (compressedData is null || compressedData.Length == 0)
            return null;
        return LZString.DecompressFromUint8Array(compressedData);
    }

    /// <summary>
    /// 尝试解压，如果解压失败则返回 null
    /// </summary>
    public static string? TryDecompress(byte[]? compressedData)
    {
        try
        {
            return Decompress(compressedData);
        }
        catch
        {
            return null;
        }
    }
}
