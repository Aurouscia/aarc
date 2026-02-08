using System.Security.Cryptography;
using System.Text;

namespace AARC.WebApi.Utils
{
    public static class MD5Helper
    {
        public static string GetMD5(this string input)
        {
            input ??= "";
            byte[] data = MD5.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexStringLower(data);
        }
        public static string GetMD5(this Stream s)
        {
            using var md5 = MD5.Create();
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = s.Read(buffer, 0, buffer.Length)) > 0)
            {
                md5.TransformBlock(buffer, 0, bytesRead, null, 0);
            }
            md5.TransformFinalBlock(buffer, 0, 0);
            return Convert.ToHexStringLower(md5.Hash ?? [0x0]);
        }
    }
}

