using AARC.Models.DbModels.Files;
using AARC.Models.DbModels.Identities;
using AARC.Models.DbModels.Saves;
using Microsoft.EntityFrameworkCore;

namespace AARC.Models.Db.Context
{
    public abstract class AarcContext: DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<UserHistory> UserHistories { get; set; }
        public DbSet<AuthGrant> AuthGrants { get; set; }
        
        public DbSet<UserFile> UserFiles { get; set; }
        
        public DbSet<Save> Saves { get; set; }
        public DbSet<SaveFolder> SaveFolders { get; set; }
        public DbSet<SaveFolderRelation> SaveFolderRelations { get; set; }
        public DbSet<SaveDiff> SaveDiffs { get; set; }
    }
}
