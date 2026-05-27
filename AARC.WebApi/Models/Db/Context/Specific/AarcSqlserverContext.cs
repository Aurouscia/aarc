using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Models.Db.Context.Specific
{
    public class AarcSqlserverContext : AarcContext
    {
        private readonly AarcContextOptions _options;
        private const string acceptDbType = "sqlserver";
        public AarcSqlserverContext(AarcContextOptions options)
        {
            if (options.Type?.ToLower() != acceptDbType)
                throw new Exception($"数据库类型配置异常，应为:{acceptDbType}");
            _options = options;
        }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer(_options.ConnStr);
        }
    }
}
