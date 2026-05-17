using Microsoft.EntityFrameworkCore.Design;

namespace AARC.WebApi.Models.Db.Context.Specific
{
    public class AarcSqliteContextFactory : IDesignTimeDbContextFactory<AarcSqliteContext>
    {
        public AarcSqliteContext CreateDbContext(string[] args)
        {
            var options = new AarcContextOptions
            {
                Type = "sqlite",
                ConnStr = "Data Source=placeholder.db"
            };
            return new AarcSqliteContext(options);
        }
    }
}
