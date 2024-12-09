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
            optionsBuilder.UseSqlite(_options.ConnStr);
        }
    }
}
