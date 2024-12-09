using AARC.Models.DbModels;
using Microsoft.EntityFrameworkCore;

namespace AARC.Models.Db.Context
{
    public abstract class AarcContext: DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<UserFile> UserFiles { get; set; }
        public DbSet<Save> Saves { get; set; }
    }
}
