using AARC.WebApi.Models.DbModels.Files;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Models.DbModels.Saves;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Models.Db.Context
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
