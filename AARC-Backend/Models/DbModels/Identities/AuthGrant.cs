namespace AARC.Models.DbModels.Identities;

/// <summary>
/// 授权
/// </summary>
public class AuthGrant : IDbModel, IPrioritizable
{
    public int Id { get; set; }
    /// <summary>
    /// 授权客体类型
    /// </summary>
    public AuthGrantOn On { get; set; }
    /// <summary>
    /// 授权客体Id（当表示“创建者的全局设置”时为0）
    /// </summary>
    public int OnId { get; set; }
    /// <summary>
    /// 授权主体
    /// </summary>
    public AuthGrantTo To { get; set; }
    /// <summary>
    /// 授权主体Id（当授权主体是泛指时为0）
    /// </summary>
    public int ToId { get; set; }
    /// <summary>
    /// 授权客体操作类型
    /// </summary>
    public byte Type { get; set; }
    /// <summary>
    /// 允许/拒绝
    /// </summary>
    public bool Flag { get; set; }
    /// <summary>
    /// 用户id（仅在表示“创建者的全局设置”时有值，与OnId必须有且仅有一个有值）
    /// </summary>
    public int UserId { get; set; }
    public byte Priority { get; set; }
    public DateTime LastActive { get; set; }
    public bool Deleted { get; set; }
}

public enum AuthGrantOn : byte
{
    Unknown = 0,
    Save = 1,
    SaveFolder = 2,
    UserFile = 3
}

public enum AuthGrantTo : byte
{
    Unknown = 0,
    
    /// <summary>
    /// 某个用户
    /// </summary>
    User = 1,
    
    /// <summary>
    /// 某个用户组
    /// </summary>
    UserGroup = 2,
    
    /// <summary>
    /// 所有人（包括未登录的）
    /// </summary>
    All = 10,
    
    /// <summary>
    /// 所有正式用户
    /// </summary>
    AllMembers = 11,
    
    /// <summary>
    /// 所有我关注的（有该设置时，不允许转让客体）
    /// </summary>
    AllOwnerFollowing = 12,
    
    /// <summary>
    /// 所有关注我的（有该设置时，不允许转让客体）
    /// </summary>
    AllOwnerFollowers = 13,
    
    /// <summary>
    /// 画廊
    /// </summary>
    Gallery = 20
}