using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AARC.WebApi.Utils
{
    public static class SqliteConnStrParser
    {
        public static string GetDataSource(string? connString)
        {
            if (connString is null)
                throw new Exception("sqlite连接字符串为空");
            var ss = StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries;
            string[] parts = connString.Split(';', ss);
            foreach (string part in parts)
            {
                string[] kv = part.Split('=', ss);
                if (kv.Length == 2 && kv[0].StartsWith("data source", StringComparison.OrdinalIgnoreCase))
                    return kv[1];
            }
            throw new Exception("sqlite连接字符串中未能找到<Data Source=xxx>");
        }
    }
}
