using Microsoft.EntityFrameworkCore.Design;

namespace AARC.WebApi.Models.Db.Context.Specific
{
    public class AarcPgsqlContextFactory : IDesignTimeDbContextFactory<AarcPgsqlContext>
    {
        public AarcPgsqlContext CreateDbContext(string[] args)
        {
            var options = new AarcContextOptions
            {
                Type = "pgsql",
                ConnStr = "Host=placeholder"
            };
            return new AarcPgsqlContext(options);
        }
    }
}
