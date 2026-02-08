using System.ComponentModel.DataAnnotations;
using AARC.WebApi.Models.DbModels.Enums;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Models.DbModels.Identities;

[Index(nameof(TargetUserId), nameof(OperatorUserId))]
public class UserHistory
{
    public int Id { get; set; }
    public int TargetUserId { get; set; }
    public int OperatorUserId { get; set; }
    public UserHistoryType UserHistoryType { get; set; }
    public UserType UserTypeNew { get; set; }
    public int UserCreditDelta { get; set; }
    [MaxLength(commentMaxLength)]
    public string? Comment { get; set; }
    public DateTime Time { get; set; }
    
    public const int commentMaxLength = 128;
}

public enum UserHistoryType:byte
{
    Unknown = 0,
    Register = 1,
    Login = 2,
    ChangeType = 3,
    ChangeNameOrPassword = 4,
    ChangeCredit = 5
}