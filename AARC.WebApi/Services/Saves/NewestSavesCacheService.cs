namespace AARC.WebApi.Services.Saves;

/// <summary>
/// 缓存最新存档的 ID 顺序队列（会员和游客各一个固定容量的线程安全队列）。
/// 存档更新时立即将对应 ID 推到队首，挤出最旧的，使 GetNewestSaves 的数据库查询
/// 退化为简单的 "WHERE Id IN (...)" 主键查找。
/// </summary>
public class NewestSavesCacheService
{
    /// <summary>会员存档 ID 集合，用于 O(1) 去重判断。</summary>
    private readonly HashSet<int> _memberSet = [];
    /// <summary>会员存档 ID 有序队列，按最近活跃时间倒序排列。</summary>
    private readonly LinkedList<int> _memberOrder = new();
    /// <summary>游客存档 ID 集合，用于 O(1) 去重判断。</summary>
    private readonly HashSet<int> _touristSet = [];
    /// <summary>游客存档 ID 有序队列，按最近活跃时间倒序排列。</summary>
    private readonly LinkedList<int> _touristOrder = new();

    /// <summary>每个队列的最大容量。</summary>
    private const int Capacity = 16;
    /// <summary>保护会员队列的线程安全锁。</summary>
    private static readonly Lock MemberLock = new();
    /// <summary>保护游客队列的线程安全锁。</summary>
    private static readonly Lock TouristLock = new();
    /// <summary>保护会员缓存初始化过程的线程安全锁，防止并发回退导致重复数据库查询。</summary>
    public static readonly Lock MemberInitLock = new();
    /// <summary>保护游客缓存初始化过程的线程安全锁，防止并发回退导致重复数据库查询。</summary>
    public static readonly Lock TouristInitLock = new();

    /// <summary>
    /// 获取缓存中的最新存档 ID 列表（纯内存读取，按时间倒序）。
    /// 如果缓存未初始化，返回 null，调用方应回退到数据库查询。
    /// </summary>
    public IReadOnlyList<int>? GetNewestSaveIds(bool forAuditor)
    {
        var order = forAuditor ? _touristOrder : _memberOrder;
        var lockObj = forAuditor ? TouristLock : MemberLock;

        lock (lockObj)
        {
            if (order.Count == 0)
                return null;

            return order.ToList();
        }
    }

    /// <summary>
    /// 用数据库查询结果初始化指定队列。仅在缓存为空时调用，避免覆盖已有缓存。
    /// </summary>
    public void Initialize(bool isTourist, List<int> ids)
    {
        var (set, order, lockObj) = isTourist
            ? (_touristSet, _touristOrder, TouristLock)
            : (_memberSet, _memberOrder, MemberLock);

        lock (lockObj)
        {
            if (order.Count > 0)
                return;

            foreach (var id in ids.Take(Capacity))
            {
                set.Add(id);
                order.AddLast(id);
            }
        }
    }

    /// <summary>
    /// 存档发生更新时调用：将对应存档 ID 推到队首。
    /// </summary>
    public void Touch(int saveId, bool isTourist)
    {
        var (set, order, lockObj) = isTourist
            ? (_touristSet, _touristOrder, TouristLock)
            : (_memberSet, _memberOrder, MemberLock);

        lock (lockObj)
        {
            // 如果已存在，移除旧节点
            if (set.Remove(saveId))
            {
                var node = order.First;
                while (node != null)
                {
                    if (node.Value == saveId)
                    {
                        order.Remove(node);
                        break;
                    }
                    node = node.Next;
                }
            }

            // 添加到队首（最新）
            order.AddFirst(saveId);
            set.Add(saveId);

            // 挤出最旧的
            while (order.Count > Capacity)
            {
                var last = order.Last;
                if (last != null)
                {
                    set.Remove(last.Value);
                    order.RemoveLast();
                }
            }
        }
    }

    /// <summary>
    /// 存档被删除时调用：从缓存中移除。
    /// </summary>
    public void Remove(int saveId, bool isTourist)
    {
        var (set, order, lockObj) = isTourist
            ? (_touristSet, _touristOrder, TouristLock)
            : (_memberSet, _memberOrder, MemberLock);

        lock (lockObj)
        {
            if (!set.Contains(saveId))
                return;

            set.Remove(saveId);
            var node = order.First;
            while (node != null)
            {
                if (node.Value == saveId)
                {
                    order.Remove(node);
                    break;
                }
                node = node.Next;
            }
        }
    }

    /// <summary>
    /// 用户类型变更时调用：将存档从原队列迁移到新队列。
    /// 拆分为先移除后添加两个独立操作，避免同时持有双锁导致死锁风险。
    /// 中间可能出现短暂不在任何队列中的状态，对最终一致性的缓存场景可接受。
    /// </summary>
    public void Migrate(int saveId, bool fromTourist)
    {
        Remove(saveId, fromTourist);
        Touch(saveId, !fromTourist);
    }
}
