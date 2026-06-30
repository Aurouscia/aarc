using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Files;
using AARC.WebApi.Services.App.HttpAuthInfo;

namespace AARC.WebApi.Repos.Files
{
    public class UserFavoriteRepo(
        AarcContext context,
        HttpUserIdProvider httpUserIdProvider
        ) : Repo<UserFavorite>(context)
    {
        public int Add(UserFavoriteType type, int objectId, string? group)
        {
            if (group is not null && group.Length > UserFavorite.groupMaxLength)
                group = group[..UserFavorite.groupMaxLength];
            var uid = httpUserIdProvider.RequireUserId();
            var existing = All.FirstOrDefault(x =>
                x.OwnerUserId == uid
                && x.Type == type
                && x.ObjectId == objectId
                && x.Group == group);
            if (existing is not null)
            {
                if (existing.Deleted)
                {
                    existing.Deleted = false;
                    existing.Group = group;
                    base.Update(existing, true);
                }
                return existing.Id;
            }
            var now = DateTime.Now;
            var model = new UserFavorite
            {
                OwnerUserId = uid,
                Type = type,
                ObjectId = objectId,
                Group = group,
                LastActive = now
            };
            Context.Add(model);
            if (group is not null)
                EnsureGroupMarker(type, group, uid, now);
            Context.SaveChanges();
            return model.Id;
        }

        public void Remove(int id)
        {
            var uid = httpUserIdProvider.RequireUserId();
            var model = base.Get(id) ?? throw new RqEx("找不到指定数据");
            if (model.OwnerUserId != uid)
                throw new RqEx("无权操作");
            base.FakeRemove(model);
        }

        public UserFavorite? GetByTypeAndObjectId(UserFavoriteType type, int objectId)
        {
            var uid = httpUserIdProvider.RequireUserId();
            return Existing.FirstOrDefault(x =>
                x.OwnerUserId == uid
                && x.Type == type
                && x.ObjectId == objectId);
        }

        public Dictionary<int, int> GetFavoriteIdMap(UserFavoriteType type, List<int> objectIds)
        {
            var uid = httpUserIdProvider.RequireUserId();
            if (objectIds.Count == 0)
                return [];
            var existingMap = Existing
                .Where(x =>
                    x.OwnerUserId == uid
                    && x.Type == type
                    && objectIds.Contains(x.ObjectId))
                .GroupBy(x => x.ObjectId)
                .ToDictionary(x => x.Key, x => x.First().Id);
            return objectIds.ToDictionary(
                id => id,
                id => existingMap.TryGetValue(id, out var favoriteId) ? favoriteId : 0);
        }

        public UserFavoriteIdPage GetSaveIds(UserFavoriteType type, string? group, int skip, int take)
        {
            var uid = httpUserIdProvider.RequireUserId();
            var q = Existing
                .Where(x =>
                    x.OwnerUserId == uid
                    && x.Type == type
                    && x.ObjectId > 0);
            if (!string.IsNullOrEmpty(group))
                q = q.Where(x => x.Group == group);
            var ids = q
                .GroupBy(x => x.ObjectId)
                .Select(g => new { ObjectId = g.Key, LastActive = g.Max(x => x.LastActive) })
                .OrderByDescending(x => x.LastActive)
                .Skip(skip)
                .Take(take + 1)
                .Select(x => x.ObjectId)
                .ToList();
            var hasMore = ids.Count > take;
            if (hasMore)
                ids.RemoveAt(ids.Count - 1);
            return new UserFavoriteIdPage { Ids = ids, HasMore = hasMore };
        }

        public bool SetGroups(UserFavoriteType type, int objectId, List<string> groups)
        {
            var uid = httpUserIdProvider.RequireUserId();
            groups = groups
                .Select(g => g.Length > UserFavorite.groupMaxLength ? g[..UserFavorite.groupMaxLength] : g)
                .Distinct()
                .ToList();
            var targetGroups = groups.ToHashSet();
            var now = DateTime.Now;

            var allExistingWithGroup = All
                .Where(x => x.OwnerUserId == uid && x.Type == type && x.ObjectId == objectId && x.Group != null)
                .ToList();
            var activeFavorites = allExistingWithGroup.Where(x => !x.Deleted).ToList();
            var activeGroups = activeFavorites.Select(x => x.Group!).ToHashSet();

            foreach (var group in groups)
            {
                if (activeGroups.Contains(group))
                    continue;
                var deleted = allExistingWithGroup.FirstOrDefault(x => x.Deleted && x.Group == group);
                if (deleted is not null)
                {
                    deleted.Deleted = false;
                    deleted.LastActive = now;
                    Context.Update(deleted);
                }
                else
                {
                    Context.Add(new UserFavorite
                    {
                        OwnerUserId = uid,
                        Type = type,
                        ObjectId = objectId,
                        Group = group,
                        LastActive = now
                    });
                }
                EnsureGroupMarker(type, group, uid, now);
            }

            foreach (var fav in activeFavorites)
            {
                if (targetGroups.Contains(fav.Group!))
                    continue;
                fav.Deleted = true;
                fav.LastActive = now;
                Context.Update(fav);
            }

            Context.SaveChanges();
            return Existing.Any(x => x.OwnerUserId == uid && x.Type == type && x.ObjectId == objectId);
        }

        public List<GroupWithStatus> GetGroups(UserFavoriteType type, int objectId)
        {
            var uid = httpUserIdProvider.RequireUserId();
            var allGroups = Existing
                .Where(x => x.OwnerUserId == uid && x.Type == type && x.Group != null)
                .Select(x => x.Group!)
                .Distinct()
                .ToList();
            var objectGroups = Existing
                .Where(x => x.OwnerUserId == uid && x.Type == type && x.ObjectId == objectId && x.Group != null)
                .Select(x => x.Group!)
                .Distinct()
                .ToHashSet();
            return allGroups.Select(g => new GroupWithStatus
            {
                Name = g,
                Checked = objectGroups.Contains(g)
            }).ToList();
        }

        public void RenameGroup(UserFavoriteType type, string oldName, string newName)
        {
            if (oldName.Length > UserFavorite.groupMaxLength)
                oldName = oldName[..UserFavorite.groupMaxLength];
            if (newName.Length > UserFavorite.groupMaxLength)
                newName = newName[..UserFavorite.groupMaxLength];
            var uid = httpUserIdProvider.RequireUserId();
            var oldGroupFavorites = All.Where(x =>
                x.OwnerUserId == uid
                && x.Type == type
                && x.Group == oldName).ToList();
            if (oldGroupFavorites.Count == 0)
                return;

            var targetHasMarker = All.Any(x =>
                x.OwnerUserId == uid
                && x.Type == type
                && x.Group == newName
                && x.ObjectId == 0
                && !x.Deleted);

            var now = DateTime.Now;
            foreach (var fav in oldGroupFavorites)
            {
                if (fav.ObjectId == 0 && targetHasMarker)
                {
                    fav.Deleted = true;
                }
                else
                {
                    fav.Group = newName;
                }
                fav.LastActive = now;
                Context.Update(fav);
            }
            Context.SaveChanges();
        }

        public void DeleteGroup(UserFavoriteType type, string groupName)
        {
            if (groupName.Length > UserFavorite.groupMaxLength)
                groupName = groupName[..UserFavorite.groupMaxLength];
            var uid = httpUserIdProvider.RequireUserId();
            var favorites = All.Where(x =>
                x.OwnerUserId == uid
                && x.Type == type
                && x.Group == groupName).ToList();
            var now = DateTime.Now;
            foreach (var fav in favorites)
            {
                fav.Deleted = true;
                fav.LastActive = now;
                Context.Update(fav);
            }
            Context.SaveChanges();
        }

        private void EnsureGroupMarker(UserFavoriteType type, string group, int uid, DateTime now)
        {
            var marker = All.FirstOrDefault(x =>
                x.OwnerUserId == uid
                && x.Type == type
                && x.ObjectId == 0
                && x.Group == group);
            if (marker is null)
            {
                Context.Add(new UserFavorite
                {
                    OwnerUserId = uid,
                    Type = type,
                    ObjectId = 0,
                    Group = group,
                    LastActive = now
                });
            }
            else if (marker.Deleted)
            {
                marker.Deleted = false;
                marker.LastActive = now;
                Context.Update(marker);
            }
        }
    }

    public class GroupWithStatus
    {
        public string Name { get; set; } = string.Empty;
        public bool Checked { get; set; }
    }

    public class UserFavoriteIdPage
    {
        public List<int> Ids { get; set; } = [];
        public bool HasMore { get; set; }
    }
}
