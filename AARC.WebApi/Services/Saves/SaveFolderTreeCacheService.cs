using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Saves;

namespace AARC.WebApi.Services.Saves;

public record SaveFolderCacheNode(int ParentFolderId, string Name);

/// <summary>
/// 缓存所有 SaveFolder 的 Id、ParentFolderId、Name 结构数据。
/// 与数据库保持同步，首次查询时懒加载初始化。
/// </summary>
public class SaveFolderTreeCacheService
{
    private readonly Dictionary<int, SaveFolderCacheNode> _tree = [];
    private readonly Lock _lock = new();
    private bool _initialized;

    /// <summary>
    /// 首次调用时从数据库加载所有未删除的 SaveFolder 到缓存。
    /// </summary>
    public void EnsureInitialized(AarcContext context)
    {
        if (_initialized)
            return;
        lock (_lock)
        {
            if (_initialized)
                return;
            var folders = context.SaveFolders
                .Where(x => !x.Deleted)
                .Select(x => new { x.Id, x.ParentFolderId, x.Name })
                .ToList();
            foreach (var f in folders)
                _tree[f.Id] = new SaveFolderCacheNode(f.ParentFolderId, f.Name);
            _initialized = true;
        }
    }

    /// <summary>
    /// 获取指定目录的缓存节点。
    /// </summary>
    public SaveFolderCacheNode? GetNode(int folderId)
    {
        lock (_lock)
        {
            _tree.TryGetValue(folderId, out var node);
            return node;
        }
    }

    /// <summary>
    /// 获取指定目录的父目录ID。
    /// </summary>
    public int? GetParentFolderId(int folderId)
    {
        return GetNode(folderId)?.ParentFolderId;
    }

    /// <summary>
    /// 获取指定目录的名称。
    /// </summary>
    public string? GetName(int folderId)
    {
        return GetNode(folderId)?.Name;
    }

    /// <summary>
    /// 添加或更新缓存中的目录节点（新建、修改、移动时调用）。
    /// </summary>
    public void AddOrUpdate(int folderId, int parentFolderId, string name)
    {
        lock (_lock)
        {
            _tree[folderId] = new SaveFolderCacheNode(parentFolderId, name);
        }
    }

    /// <summary>
    /// 从缓存中移除目录节点（删除时调用）。
    /// </summary>
    public void Remove(int folderId)
    {
        lock (_lock)
        {
            _tree.Remove(folderId);
        }
    }

    /// <summary>
    /// 获取完整缓存树的只读副本。
    /// </summary>
    public IReadOnlyDictionary<int, SaveFolderCacheNode> GetAll()
    {
        lock (_lock)
        {
            return _tree.ToDictionary(
                x => x.Key,
                x => x.Value);
        }
    }
}
