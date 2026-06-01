using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Repos.Saves
{
    public class SaveFolderRelationRepo(
        AarcContext context,
        HttpUserIdProvider httpUserIdProvider,
        SaveFolderRepo saveFolderRepo,
        IMapper mapper
        )
    {
        protected AarcContext Context => context;
        protected DbSet<SaveFolderRelation> Set => context.Set<SaveFolderRelation>();
        public IQueryable<SaveFolderRelation> All => Set;

        /// <summary>
        /// 将存档加入目录
        /// </summary>
        public void AddToFolder(int saveId, int folderId)
        {
            var uid = httpUserIdProvider.RequireUserId();
            // 验证目录归属
            var folder = saveFolderRepo.Existing.FirstOrDefault(x => x.Id == folderId && x.OwnerUserId == uid);
            if (folder is null)
                throw new RqEx("目录不存在或无权访问");
            // 验证存档归属
            var save = Context.Saves.Existing().FirstOrDefault(x => x.Id == saveId && x.OwnerUserId == uid);
            if (save is null)
                throw new RqEx("存档不存在或无权访问");
            // 检查是否已存在
            var existing = All.FirstOrDefault(x => x.SaveId == saveId && x.FolderId == folderId);
            if (existing is not null)
                throw new RqEx("该存档已在目录中");
            // 计算新优先级
            var maxPriority = All
                .Where(x => x.FolderId == folderId)
                .Select(x => (byte?)x.Priority)
                .Max() ?? 0;
            var relation = new SaveFolderRelation
            {
                SaveId = saveId,
                FolderId = folderId,
                Priority = (byte)(maxPriority + 1)
            };
            Set.Add(relation);
            UpdateFolderLastActive(folder);
            Context.SaveChanges();
        }

        /// <summary>
        /// 将存档移出目录
        /// </summary>
        public void RemoveFromFolder(int saveId, int folderId)
        {
            var uid = httpUserIdProvider.RequireUserId();
            // 验证目录归属
            var folder = saveFolderRepo.Existing.FirstOrDefault(x => x.Id == folderId && x.OwnerUserId == uid);
            if (folder is null)
                throw new RqEx("目录不存在或无权访问");
            var relation = All.FirstOrDefault(x => x.SaveId == saveId && x.FolderId == folderId);
            if (relation is null)
                throw new RqEx("该存档不在此目录中");
            Set.Remove(relation);
            // 重新排列剩余优先级
            RearrangePriorities(folderId);
            UpdateFolderLastActive(folder);
            Context.SaveChanges();
        }

        /// <summary>
        /// 将存档从所有目录中移出
        /// </summary>
        public void RemoveFromAllFolders(int saveId)
        {
            var uid = httpUserIdProvider.RequireUserId();
            var relations = All
                .Where(x => x.SaveId == saveId)
                .ToList();
            if (relations.Count == 0)
                return;
            // 验证存档归属
            var save = Context.Saves.Existing().FirstOrDefault(x => x.Id == saveId && x.OwnerUserId == uid);
            if (save is null)
                throw new RqEx("存档不存在或无权访问");
            var affectedFolderIds = relations.Select(x => x.FolderId).Distinct().ToList();
            Set.RemoveRange(relations);
            Context.SaveChanges();
            // 重新排列受影响目录的优先级
            foreach (var folderId in affectedFolderIds)
                RearrangePriorities(folderId);
        }

        /// <summary>
        /// 移动存档到另一个目录（从原目录移出并加入新目录）
        /// </summary>
        public void MoveToFolder(int saveId, int fromFolderId, int toFolderId)
        {
            if (fromFolderId == toFolderId)
                throw new RqEx("目标目录与原目录相同");
            var uid = httpUserIdProvider.RequireUserId();
            // 验证目标目录归属
            var toFolder = saveFolderRepo.Existing.FirstOrDefault(x => x.Id == toFolderId && x.OwnerUserId == uid);
            if (toFolder is null)
                throw new RqEx("目标目录不存在或无权访问");
            // 验证存档归属
            var save = Context.Saves.Existing().FirstOrDefault(x => x.Id == saveId && x.OwnerUserId == uid);
            if (save is null)
                throw new RqEx("存档不存在或无权访问");
            // 检查是否已在目标目录
            var existingInTarget = All.FirstOrDefault(x => x.SaveId == saveId && x.FolderId == toFolderId);
            if (existingInTarget is not null)
                throw new RqEx("该存档已在目标目录中");
            // 从原目录移除
            var fromRelation = All.FirstOrDefault(x => x.SaveId == saveId && x.FolderId == fromFolderId);
            if (fromRelation is not null)
            {
                Set.Remove(fromRelation);
                RearrangePriorities(fromFolderId);
            }
            // 加入新目录
            var maxPriority = All
                .Where(x => x.FolderId == toFolderId)
                .Select(x => (byte?)x.Priority)
                .Max() ?? 0;
            var newRelation = new SaveFolderRelation
            {
                SaveId = saveId,
                FolderId = toFolderId,
                Priority = (byte)(maxPriority + 1)
            };
            Set.Add(newRelation);
            UpdateFolderLastActive(toFolder);
            Context.SaveChanges();
        }

        /// <summary>
        /// 对目录内的存档进行排序
        /// </summary>
        public void RearrangeInFolder(int folderId, List<int> saveOrder)
        {
            if (saveOrder.Count == 0)
                return;
            var uid = httpUserIdProvider.RequireUserId();
            // 验证目录归属
            var folder = saveFolderRepo.Existing.FirstOrDefault(x => x.Id == folderId && x.OwnerUserId == uid);
            if (folder is null)
                throw new RqEx("目录不存在或无权访问");
            var relations = All
                .Where(x => x.FolderId == folderId && saveOrder.Contains(x.SaveId))
                .ToList();
            if (relations.Count != saveOrder.Count)
                throw new RqEx("部分存档不在该目录中");
            var orderDict = saveOrder
                .Select((value, index) => (value, index))
                .ToDictionary(x => x.value, x => x.index);
            relations.Sort((x, y) =>
            {
                int ox = orderDict.TryGetValue(x.SaveId, out var ix) ? ix : int.MaxValue;
                int oy = orderDict.TryGetValue(y.SaveId, out var iy) ? iy : int.MaxValue;
                return ox.CompareTo(oy);
            });
            byte p = 1;
            foreach (var r in relations)
            {
                r.Priority = p;
                p++;
                Context.Update(r);
            }
            UpdateFolderLastActive(folder);
            Context.SaveChanges();
        }

        /// <summary>
        /// 获取目录内的存档ID列表
        /// </summary>
        public List<int> GetSaveIdsInFolder(int folderId)
        {
            var uid = httpUserIdProvider.RequireUserId();
            // 验证目录归属
            var folder = saveFolderRepo.Existing.FirstOrDefault(x => x.Id == folderId && x.OwnerUserId == uid);
            if (folder is null)
                throw new RqEx("目录不存在或无权访问");
            return All
                .Where(x => x.FolderId == folderId)
                .OrderBy(x => x.Priority)
                .Select(x => x.SaveId)
                .ToList();
        }

        /// <summary>
        /// 获取目录内的存档详情列表
        /// </summary>
        public List<SaveDto> GetSavesInFolder(int folderId, string orderBy = "custom")
        {
            var uid = httpUserIdProvider.RequireUserId();
            // 验证目录归属
            var folder = saveFolderRepo.Existing.FirstOrDefault(x => x.Id == folderId && x.OwnerUserId == uid);
            if (folder is null)
                throw new RqEx("目录不存在或无权访问");
            var saveIds = All
                .Where(x => x.FolderId == folderId)
                .OrderBy(x => x.Priority)
                .Select(x => x.SaveId)
                .ToList();
            if (saveIds.Count == 0)
                return [];
            // 查询存档详情
            var saves = Context.Saves.Existing()
                .Where(x => saveIds.Contains(x.Id))
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .ToList();
            if (orderBy == "active")
            {
                saves.Sort((x, y) =>
                {
                    var dx = DateTime.TryParse(x.LastActive, out var tx) ? tx : DateTime.MinValue;
                    var dy = DateTime.TryParse(y.LastActive, out var ty) ? ty : DateTime.MinValue;
                    return dy.CompareTo(dx);
                });
            }
            else if (orderBy == "name")
            {
                saves.Sort((x, y) => string.Compare(x.Name, y.Name, StringComparison.OrdinalIgnoreCase));
            }
            else
            {
                // 按优先级排序（custom 默认）
                var idOrderDict = saveIds
                    .Select((id, index) => (id, index))
                    .ToDictionary(x => x.id, x => x.index);
                saves.Sort((x, y) =>
                {
                    int ox = idOrderDict.TryGetValue(x.Id, out var ix) ? ix : int.MaxValue;
                    int oy = idOrderDict.TryGetValue(y.Id, out var iy) ? iy : int.MaxValue;
                    return ox.CompareTo(oy);
                });
            }
            return saves;
        }

        /// <summary>
        /// 获取存档所在的所有目录ID
        /// </summary>
        public List<int> GetFolderIdsOfSave(int saveId)
        {
            var uid = httpUserIdProvider.RequireUserId();
            // 验证存档归属
            var save = Context.Saves.Existing().FirstOrDefault(x => x.Id == saveId && x.OwnerUserId == uid);
            if (save is null)
                throw new RqEx("存档不存在或无权访问");
            return All
                .Where(x => x.SaveId == saveId)
                .Select(x => x.FolderId)
                .ToList();
        }

        private void RearrangePriorities(int folderId)
        {
            var relations = All
                .Where(x => x.FolderId == folderId)
                .OrderBy(x => x.Priority)
                .ToList();
            // 排除已被标记为删除的实体
            var activeRelations = relations
                .Where(r => Context.Entry(r).State != EntityState.Deleted)
                .ToList();
            activeRelations.RearrangePriority();
            foreach (var r in activeRelations)
                Context.Update(r);
        }

        private void UpdateFolderLastActive(SaveFolder? folder)
        {
            if (folder is not null)
            {
                folder.LastActive = DateTime.Now;
                Context.Update(folder);
            }
        }
    }
}
