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
        public T? Get(int id) => Existing.FirstOrDefault(x => x.Id == id);
        public IQueryable<T> WithId(int id) => Existing.Where(x => x.Id == id);
        public virtual bool AllowUpdate => true;
        public virtual bool AllowRealRemove => false;
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
            if (!AllowUpdate)
                throw new InvalidOperationException("该Repo不允许更新");
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
        protected void RealRemove(T item, bool saveChanges = true)
        {
            if (!AllowRealRemove)
                throw new InvalidOperationException("该Repo不允许真删除");
            context.Remove(item);
            if(saveChanges)
                context.SaveChanges();
        }
    }

    public static class DbModelQueryableExtension
    {
        public static IQueryable<T> Existing<T>(
            this IQueryable<T> q) where T : IDbModel
            => q.Where(x => !x.Deleted);
    }
    
    public static class PrioritizableExtension
    {
        public static void RearrangePriority<T>(
            this List<T> list, List<int> order) where T : class, IPrioritizable
        {
            var orderDict = order
                .Select((value, index) => (value, index))
                .ToDictionary(x => x.value, x => x.index);
            list.Sort((x, y) =>
            {
                int ox = orderDict.TryGetValue(x.Id, out var ix) ? ix : int.MaxValue;
                int oy = orderDict.TryGetValue(y.Id, out var iy) ? iy : int.MaxValue;
                return ox.CompareTo(oy);
            });
            RearrangePriority(list);
        }
        public static void RearrangePriority<T>(
            this List<T> list) where T : class, IPrioritizable
        {
            byte p = 1;
            foreach (var x in list)
            {
                x.Priority = p;
                p++;
            }
        }
    }
}
