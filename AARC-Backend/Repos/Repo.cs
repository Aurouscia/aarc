using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using Microsoft.EntityFrameworkCore;

namespace AARC.Repos
{
    public abstract class Repo<T>(
        AarcContext context
        ) where T : class, IDbModel
    {
        protected AarcContext Context => context;
        protected DbSet<T> Set => context.Set<T>();
        public IQueryable<T> All => Set;
        public IQueryable<T> Existing => All.Existing();
        public T? Get(int id) => Existing.Where(x=>x.Id == id).FirstOrDefault();
        public IQueryable<T> WithId(int id) => Existing.Where(x => x.Id == id);
        protected int Add(T item, bool saveChanges = true)
        {
            item.LastActive = DateTime.Now;
            context.Add(item);
            if (saveChanges)
                context.SaveChanges();
            return item.Id;
        }
        protected void Update(T item, bool updateLastActive, bool saveChanges = true)
        { 
            if(updateLastActive)
                item.LastActive = DateTime.Now;
            context.Update(item);
            if(saveChanges)
                context.SaveChanges();
        }
        protected void FakeRemove(T item, bool saveChanges = true)
        {
            item.LastActive = DateTime.Now;
            item.Deleted = true;
            context.Update(item);
            if(saveChanges)
                context.SaveChanges();
        }
        protected void FakeRemove(int itemId)
        {
            Existing.Where(x => x.Id == itemId)
                .ExecuteUpdate(spc => spc
                    .SetProperty(x => x.LastActive, DateTime.Now)
                    .SetProperty(x => x.Deleted, true));
        }
    }

    public static class DbModelQuerableExtension
    {
        public static IQueryable<T> Existing<T>(
            this IQueryable<T> q) where T : IDbModel
            => q.Where(x => !x.Deleted);
    }
}
