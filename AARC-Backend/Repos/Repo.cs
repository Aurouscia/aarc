﻿using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using Microsoft.EntityFrameworkCore;

namespace AARC.Repos
{
    public abstract class Repo<T>(
        AarcContext context
        ) where T : class, IDbModel
    {
        protected DbSet<T> Set => context.Set<T>();
        public IQueryable<T> All => Set;
        public IQueryable<T> Existing => All.Where(x => !x.Deleted);
        public T? Get(int id) => Existing.Where(x=>x.Id == id).FirstOrDefault();
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
    }
}