using AARC.Models.DbModels.Enums;

namespace AARC.Models.DbModels.Identities;

public class UserHistory:IDbModel
{
    public int Id { get; set; }
    public int TargetUserId { get; set; }
    public int OperatorUserId { get; set; }
    public UserHistoryType UserHistoryType { get; set; }
    public UserType UserTypeOld { get; set; }
    public UserType UserTypeNew { get; set; }
    public DateTime LastActive { get; set; }
    public bool Deleted { get; set; }
}

public enum UserHistoryType:byte
{
    Unknown = 0,
    Login = 1,
    Register = 2,
    ChangeUserType = 3
}