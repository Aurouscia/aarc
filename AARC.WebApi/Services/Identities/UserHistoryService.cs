using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Services.App.HttpAuthInfo;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Services.Identities;

public class UserHistoryService(
    AarcContext context,
    HttpUserIdProvider userIdProvider)
{
    private DbSet<UserHistory> UserHistories => context.UserHistories;

    public void RecordLogin(int userId)
    {
        var uh = CreateSelfHelpedInstance(UserHistoryType.Login, userId);
        UserHistories.Add(uh);
        context.SaveChanges();
    }

    public void RecordRegister(int userId)
    {
        var uh = CreateSelfHelpedInstance(UserHistoryType.Register, userId);
        UserHistories.Add(uh);
        context.SaveChanges();
    }

    public void RecordChangePassword(int targetUserId, string? comment)
    {
        var uh = CreateInstance(UserHistoryType.ChangePassword, targetUserId, comment);
        UserHistories.Add(uh);
        context.SaveChanges();
    }

    public void RecordChangeType(int targetUserId, UserType newType, string? comment)
    {
        var uh = CreateInstance(UserHistoryType.ChangeType, targetUserId, comment: comment);
        uh.UserTypeNew = newType;
        UserHistories.Add(uh);
        context.SaveChanges();
    }

    public void RecordChangeCredit(int targetUserId, int creditDelta, string? comment)
    {
        var uh = CreateInstance(UserHistoryType.ChangeCredit, targetUserId, comment: comment);
        uh.UserCreditDelta = creditDelta;
        UserHistories.Add(uh);
        context.SaveChanges();
    }

    private UserHistory CreateInstance(
        UserHistoryType type,
        int? targetUserId,
        string? comment = null)
    {
        var uh = CreateInstance(type);
        uh.OperatorUserId = userIdProvider.RequireUserId();
        uh.TargetUserId = targetUserId ?? userIdProvider.RequireUserId();
        uh.Comment = comment;
        return uh;
    }
    private static UserHistory CreateSelfHelpedInstance(
        UserHistoryType type,
        int userId)
    {
        var uh = CreateInstance(type);
        uh.OperatorUserId = userId;
        uh.TargetUserId = userId;
        return uh;
    }

    private static UserHistory CreateInstance(UserHistoryType type)
    {
        return new UserHistory()
        {
            Time = DateTime.Now,
            UserHistoryType = type
        };
    }
}