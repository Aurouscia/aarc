using AARC.Utils;
using Microsoft.EntityFrameworkCore;

namespace AARC.Models.Db.Context.Specific
{
    public class AarcSqliteContext : AarcContext
    {
        private readonly AarcContextOptions _options;
        private const string acceptDbType = "sqlite";
        public AarcSqliteContext(AarcContextOptions options)
        {
            if (options.Type?.ToLower() != acceptDbType)
                throw new Exception($"数据库类型配置异常，应为:{acceptDbType}");
            _options = options;
        }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var path = SqliteConnStrParser.GetDataSource(_options.ConnStr);
            FileInfo f = new(path);
            if (f.Directory is { } && !f.Directory.Exists)
                f.Directory.Create();
            optionsBuilder.UseSqlite(_options.ConnStr);
        }
    }
}
