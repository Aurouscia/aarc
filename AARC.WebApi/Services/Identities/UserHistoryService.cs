using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Services.Identities;

public class UserHistoryService(
    AarcContext context,
    HttpUserIdProvider userIdProvider,
    IMapper mapper)
{
    public const int userCreditBase = 10;
    private DbSet<UserHistory> UserHistories => context.UserHistories;

    public List<UserHistoryDto> Load(int targetUserId, int operatorUserId, UserHistoryType type, int skip)
    {
        var q = UserHistories.AsQueryable();
        if (type != UserHistoryType.Unknown)
            q = q.Where(x => x.UserHistoryType == type);
        if(targetUserId > 0)
            q = q.Where(x => x.TargetUserId == targetUserId);
        if(operatorUserId > 0)
            q = q.Where(x => x.OperatorUserId == operatorUserId);
        return q
            .OrderByDescending(x => x.Id)
            .Skip(skip)
            .Take(20)
            .ProjectTo<UserHistoryDto>(mapper.ConfigurationProvider)
            .ToList();
    }

    public int GetUserCredit(int userId)
    {
        var sum = UserHistories
            .Where(x => x.TargetUserId == userId && x.UserHistoryType == UserHistoryType.ChangeCredit)
            .Sum(x => x.UserCreditDelta);
        return userCreditBase + sum;
    }
    
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

    public void RecordChangeNameOrPassword(int targetUserId, string? comment)
    {
        var uh = CreateInstance(UserHistoryType.ChangeNameOrPassword, targetUserId, comment);
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
        if (comment is not null && comment.Length > UserHistory.commentMaxLength)
        {
            throw new RqEx($"备注必须少于{UserHistory.commentMaxLength}字符");
        }
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

    public class UserHistoryDto : UserHistory
    {
        public string? TimeStr { get; set; }
    }
    public class UserHistoryDtoProfile : Profile
    {
        public UserHistoryDtoProfile()
        {
            CreateMap<UserHistory, UserHistoryDto>()
                .ForMember(
                    x => x.TimeStr,
                    memberOptions: y
                        => y.MapFrom(x => x.Time.ToString("yyyy-MM-dd HH:mm")));
        }
    }
}