using AARC.Models.Db.Context;
using AARC.Models.DbModels.Enums.AuthGrantTypes;
using AARC.Models.DbModels.Identities;
using AARC.Repos;
using AARC.Services.App.HttpAuthInfo;

namespace AARC.Services.App.AuthGrants;

public class AuthGrantCheckService(
    AarcContext context,
    HttpUserInfoService userInfoService,
    AuthGrantOwnerService authGrantOwnerService)
{
    public void CheckFor(AuthGrantOn on, int onId, byte type, bool defaultAllow)
    {
        var res = CalculateFor(on, [onId], type).FirstOrDefault();
        if (res == AuthGrantCheckResult.Reject
            || (!defaultAllow && res == AuthGrantCheckResult.Default))
            throw new RqEx("拒绝访问");
    }
    public List<bool> CalculateFor(AuthGrantOn on, List<int> onIds, byte type, bool defaultAllow)
    {
        return CalculateFor(on, onIds, type)
            .ConvertAll(x =>
            {
                if (x == AuthGrantCheckResult.Allow)
                    return true;
                if (x == AuthGrantCheckResult.Reject)
                    return false;
                return defaultAllow;
            });
    }
    public List<AuthGrantCheckResult> CalculateFor(AuthGrantOn on, List<int> onIds, byte type)
    {
        var isSaveEditing = 
            on == AuthGrantOn.Save 
            && type == (byte)AuthGrantTypeOfSave.Edit;
        // 如果是管理员，且不是“存档编辑”，直接allow所有
        bool isAdmin = userInfoService.IsAdmin;
        if (isAdmin && !isSaveEditing)
        { 
            return Enumerable.Repeat(AuthGrantCheckResult.Allow, onIds.Count).ToList();
        }

        // 加载每个onId的所有者，以及所有相关的authGrant对象
        var owners = authGrantOwnerService.GetOwnerOf(on, onIds);
        var allGrants = Existing
            .Where(x => x.On == on && x.Type == type)
            .Where(x => owners.Contains(x.UserId) || onIds.Contains(x.OnId))
            .ToList();
        
        // 准备结果数组，遍历每一个onId
        var res = new List<AuthGrantCheckResult>(onIds.Count);
        bool isMember = userInfoService.IsMember;
        int uid = userInfoService.UserInfo.Value.Id;
        for (int i = 0; i < onIds.Count; i++)
        {
            AuthGrantCheckResult result = AuthGrantCheckResult.Default;
            var owner = owners[i];
            var onId =  onIds[i];
            if(owner == uid)
                result = AuthGrantCheckResult.Allow;
            else
            {
                var grants = allGrants.FindAll(x => x.UserId == owner || x.OnId == onId);
                grants = OrderByCascadingRule(grants);
                foreach (var ag in grants)
                {
                    if (isSaveEditing && ag is { Flag: true, To: AuthGrantTo.All or AuthGrantTo.AllMembers })
                    {
                        continue; //如果是允许所有人/所有会员编辑存档，则无视
                    }
                    bool match =
                        ag.To == AuthGrantTo.All
                        || ag.To == AuthGrantTo.AllMembers && isMember
                        || ag.To == AuthGrantTo.User && uid == ag.ToId;
                    if (match)
                        result = ag.Flag ? AuthGrantCheckResult.Allow : AuthGrantCheckResult.Reject;
                }
            }
            res.Add(result);
        }
        return res;
    }

    private static List<AuthGrant> OrderByCascadingRule(List<AuthGrant> authGrants)
    {
        List<AuthGrant> onUser = [];
        List<AuthGrant> onEntity = [];
        foreach (var ag in authGrants)
        {
            if(ag.UserId > 0)
                onUser.Add(ag);
            else
                onEntity.Add(ag);
        }
        // priority大的排后面，升序排序
        onUser.Sort((x, y) => x.Priority - y.Priority);
        onEntity.Sort((x, y) => x.Priority - y.Priority);
        return [..onUser, ..onEntity]; // 用户默认的排前面，本体的排后面
    }

    private IQueryable<AuthGrant> Existing => context.AuthGrants.Existing();
}

public enum AuthGrantCheckResult
{
    Default = 0,
    Reject = 1,
    Allow = 2
}