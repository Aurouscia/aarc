using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.App.Mapping;
using AARC.WebApi.Services.Saves;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Repos.Saves
{
    public class SaveFolderRepo(
        AarcContext context,
        HttpUserIdProvider httpUserIdProvider,
        IMapper mapper,
        SaveFolderTreeCacheService folderTreeCache
        ) : Repo<SaveFolder>(context)
    {
        public IQueryable<SaveFolder> MyFolders
        {
            get
            {
                var uid = httpUserIdProvider.RequireUserId();
                return Existing.Where(x => x.OwnerUserId == uid);
            }
        }

        public IQueryable<SaveFolder> AccessibleFolders
        {
            get
            {
                var uid = httpUserIdProvider.RequireUserId();
                // 目前只返回自己的目录，未来可扩展为包含他人公开的目录
                return Existing.Where(x => x.OwnerUserId == uid);
            }
        }

        public List<SaveFolderDto> GetMyFolders(int? parentFolderId = null, string orderBy = "custom")
        {
            var q = AccessibleFolders;
            if (parentFolderId.HasValue)
                q = q.Where(x => x.ParentFolderId == parentFolderId.Value);
            else
                q = q.Where(x => x.ParentFolderId == 0);
            q = orderBy switch
            {
                "active" => q.OrderByDescending(x => x.LastActive),
                "name" => q.OrderBy(x => x.Name),
                _ => q.OrderBy(x => x.Priority)
            };
            return q
                .ProjectTo<SaveFolderDto>(mapper.ConfigurationProvider)
                .ToList();
        }

        public List<SaveFolderDto> GetAllMyFolders()
        {
            return MyFolders
                .OrderByDescending(x => x.LastActive)
                .ProjectTo<SaveFolderDto>(mapper.ConfigurationProvider)
                .ToList();
        }

        public void Create(SaveFolderDto dto)
        {
            ValidateDto(dto);
            var uid = httpUserIdProvider.RequireUserId();
            var folder = mapper.Map<SaveFolder>(dto);
            folder.OwnerUserId = uid;
            folder.ParentFolderId = dto.ParentFolderId;
            folderTreeCache.EnsureInitialized(context);
            folderTreeCache.AddOrUpdate(folder.Id, folder.ParentFolderId, folder.Name);
            var siblings = MyFolders
                .Where(x => x.ParentFolderId == folder.ParentFolderId)
                .OrderBy(x => x.Priority)
                .ToList();
            siblings.Add(folder);
            siblings.RearrangePriority();
            base.Add(folder);
        }

        public void Update(SaveFolderDto dto)
        {
            if (dto.Id == 0)
                throw new RqEx("数据异常");
            ValidateDto(dto);
            var folder = GetOwned(dto.Id);
            mapper.Map(dto, folder);
            folderTreeCache.EnsureInitialized(context);
            folderTreeCache.AddOrUpdate(folder.Id, folder.ParentFolderId, folder.Name);
            base.Update(folder, true);
        }

        public void Move(int id, int targetParentFolderId)
        {
            var folder = GetOwned(id);
            if (targetParentFolderId != 0)
            {
                var target = MyFolders.FirstOrDefault(x => x.Id == targetParentFolderId);
                if (target is null)
                    throw new RqEx("目标目录不存在");
                if (IsDescendantOf(targetParentFolderId, id))
                    throw new RqEx("不能将目录移动到其子目录下");
            }
            var oldParentId = folder.ParentFolderId;
            folder.ParentFolderId = targetParentFolderId;
            // 重新排列原父目录下的优先级
            var oldSiblings = MyFolders
                .Where(x => x.ParentFolderId == oldParentId && x.Id != id)
                .OrderBy(x => x.Priority)
                .ToList();
            oldSiblings.RearrangePriority();
            // 重新排列新父目录下的优先级
            var newSiblings = MyFolders
                .Where(x => x.ParentFolderId == targetParentFolderId)
                .OrderBy(x => x.Priority)
                .ToList();
            newSiblings.Add(folder);
            newSiblings.RearrangePriority();
            folderTreeCache.EnsureInitialized(context);
            folderTreeCache.AddOrUpdate(folder.Id, folder.ParentFolderId, folder.Name);
            base.Update(folder, true);
        }

        public void Rearrange(List<int> order)
        {
            if (order.Count == 0)
                return;
            var folders = MyFolders
                .Where(x => order.Contains(x.Id))
                .ToList();
            if (folders.Count != order.Count)
                throw new RqEx("部分目录不存在或无权访问");
            var parentId = folders.First().ParentFolderId;
            if (folders.Any(x => x.ParentFolderId != parentId))
                throw new RqEx("只能对同一目录下的文件夹进行排序");
            folders.RearrangePriority(order);
            foreach (var f in folders)
                Context.Update(f);
            Context.SaveChanges();
        }

        public void Remove(int id)
        {
            var folder = GetOwned(id);
            // 检查是否有子目录
            var hasChildren = MyFolders.Any(x => x.ParentFolderId == id);
            if (hasChildren)
                throw new RqEx("请先删除子目录");
            // 检查是否有存档关联
            var hasSaves = Context.SaveFolderRelations.Any(x => x.FolderId == id);
            if (hasSaves)
                throw new RqEx("请先移出目录内的存档");
            base.FakeRemove(folder);
            folderTreeCache.EnsureInitialized(context);
            folderTreeCache.Remove(folder.Id);
            // 重新排列同级目录优先级
            var siblings = MyFolders
                .Where(x => x.ParentFolderId == folder.ParentFolderId)
                .OrderBy(x => x.Priority)
                .ToList();
            siblings.RearrangePriority();
            Context.SaveChanges();
        }

        private SaveFolder GetOwned(int id)
        {
            var folder = MyFolders.FirstOrDefault(x => x.Id == id);
            if (folder is null)
                throw new RqEx("找不到指定目录或无权访问");
            return folder;
        }

        private bool IsDescendantOf(int potentialAncestorId, int targetId)
        {
            var children = MyFolders
                .Where(x => x.ParentFolderId == potentialAncestorId)
                .Select(x => x.Id)
                .ToList();
            if (children.Contains(targetId))
                return true;
            foreach (var childId in children)
            {
                if (IsDescendantOf(childId, targetId))
                    return true;
            }
            return false;
        }

        public List<SaveFolderPathItem> GetPath(int folderId)
        {
            var path = new List<SaveFolderPathItem>();
            if (folderId == 0)
                return path;
            var currentId = folderId;
            while (currentId != 0)
            {
                var folder = AccessibleFolders
                    .Select(x => new { x.Id, x.Name, x.ParentFolderId })
                    .FirstOrDefault(x => x.Id == currentId);
                if (folder is null)
                    throw new RqEx("路径中包含无权访问或已删除的目录");
                path.Insert(0, new SaveFolderPathItem
                {
                    Id = folder.Id,
                    Name = folder.Name
                });
                currentId = folder.ParentFolderId;
            }
            return path;
        }

        public SaveFolderDto? GetFolderInfo(int folderId)
        {
            if (folderId == 0)
                return null;
            return AccessibleFolders
                .Where(x => x.Id == folderId)
                .ProjectTo<SaveFolderDto>(mapper.ConfigurationProvider)
                .FirstOrDefault();
        }

        private void ValidateDto(SaveFolderDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new RqEx("名称不能为空");
            if (dto.Name.Length > SaveFolder.nameMaxLength)
                throw new RqEx($"名称长度不能超过{SaveFolder.nameMaxLength}字符");
            if (dto.Intro?.Length > SaveFolder.introMaxLength)
                throw new RqEx($"简介长度不能超过{SaveFolder.introMaxLength}字符");
        }
    }

    public class SaveFolderPathItem
    {
        public int Id { get; set; }
        public string? Name { get; set; }
    }

    public class SaveFolderDto
    {
        public int Id { get; set; }
        public int ParentFolderId { get; set; }
        public string? Name { get; set; }
        public string? Intro { get; set; }
        public byte Priority { get; set; }
        public string? LastActive { get; set; }
    }

    public class SaveFolderDtoProfile : Profile
    {
        public SaveFolderDtoProfile()
        {
            CreateMap<SaveFolderDto, SaveFolder>()
                .IgnoreLastActive();
            CreateMap<SaveFolder, SaveFolderDto>()
                .ForMember(
                    destinationMember: x => x.LastActive,
                    memberOptions: mem => mem.MapFrom(source => source.LastActive.ToString("yyyy-MM-dd HH:mm")));
        }
    }
}
