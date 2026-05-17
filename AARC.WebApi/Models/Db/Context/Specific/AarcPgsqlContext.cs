using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Models.Db.Context.Specific
{
    public class AarcPgsqlContext : AarcContext
    {
        protected override string AcceptDbType => "pgsql";
        public AarcPgsqlContext(AarcContextOptions options) : base(options) { }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseNpgsql(Options.ConnStr);
        }
    }
}
