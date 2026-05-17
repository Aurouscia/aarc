using AARC.WebApi.Utils;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Models.Db.Context.Specific
{
    public class AarcSqliteContext : AarcContext
    {
        protected override string AcceptDbType => "sqlite";
        public AarcSqliteContext(AarcContextOptions options) : base(options) { }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var path = SqliteConnStrParser.GetDataSource(Options.ConnStr);
            FileInfo f = new(path);
            if (f.Directory is { } && !f.Directory.Exists)
                f.Directory.Create();
            optionsBuilder.UseSqlite(Options.ConnStr);
        }
    }
}
