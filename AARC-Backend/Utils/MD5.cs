using System.Security.Cryptography;
using System.Text;

namespace AARC.Utils
{
    public static class MD5Helper
    {
        public static string GetMD5(this string input)
        {
            input ??= "";
            byte[] data = MD5.HashData(Encoding.UTF8.GetBytes(input));
            return BytesToStr(data);
        }
        public static string GetMD5(this Stream s)
        {
            byte[] data = MD5.HashData(s);
            return BytesToStr(data);
        }

        private static string BytesToStr(byte[] data)
        {
            StringBuilder sBuilder = new();
            for (int i = 0; i < data.Length; i++)
            {
                sBuilder.Append(data[i].ToString("x2"));
            }
            return sBuilder.ToString();
        }
    }
}

