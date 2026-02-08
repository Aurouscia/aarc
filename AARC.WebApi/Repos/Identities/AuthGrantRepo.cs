using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels;
using AARC.WebApi.Models.DbModels.Files;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.WebApi.Services.App.AuthGrants;
using AARC.WebApi.Services.App.HttpAuthInfo;

namespace AARC.WebApi.Repos.Identities;

public class AuthGrantRepo(
    AarcContext context,
    HttpUserIdProvider httpUserIdProvider,
    AuthGrantOwnerService  authGrantOwnerService
    ):Repo<AuthGrant>(context)
{
    public override bool AllowUpdate => false;
    public override bool AllowRealRemove => true;

    public List<AuthGrant> LoadAuthGrants(AuthGrantOn on, int onId, byte type)
    {
        authGrantOwnerService.EnsureIsOwnerOf(on, onId);
        return ExistingFiltered(on, onId, type).ToList();
    }
    
    public void CreateAuthGrant(AuthGrant item)
    {
        AccessCheck(item);
        Add(item);
        var list = ExistingFiltered(item.On, item.OnId, item.Type).ToList();
        list.Add(item);
        list.RearrangePriority();
        Context.SaveChanges();
    }

    public void SetAuthGrantPriorities(AuthGrantOn on, int onId, byte type, List<int> ids)
    {
        var list = ExistingFiltered(on, onId, type).ToList();
        list.RearrangePriority(ids);
        Context.SaveChanges();
    }

    public void RemoveAuthGrant(AuthGrant item)
    {
        AccessCheck(item);
        RealRemove(item);
    }

    private void AccessCheck(AuthGrant item)
    {
        var uid = httpUserIdProvider.RequireUserId();
        // 如果UserId有值
        if (item.UserId != 0)
        {
            // 那么OnId必须没值
            if (item.OnId != 0)
                throw new RqEx("AuthGrant异常（UserId与OnId不能同时有值）");
            // 且当前用户为UserId
            if (item.UserId != uid)
                throw new RqEx("非所有者，无权操作");
            return;
        }
        // 如果UserId没值
        // 那么OnId必须有值
        if (item.OnId == 0)
            throw new RqEx("AuthGrant异常（UserId与OnId不能同时无值）");
        // 且OnId对应的实体的所有者是当前用户
        var onId = item.OnId;
        var on = item.On;
        authGrantOwnerService.EnsureIsOwnerOf(on, onId);
    }



    private IQueryable<AuthGrant> ExistingFiltered(AuthGrantOn on, int onId, byte type)
    {
        var q = Existing
            .Where(x => x.On == on && x.Type == type);
        if(onId > 0)
            q = q.Where(x => x.OnId == onId);
        else
        {
            var uid = httpUserIdProvider.RequireUserId();
            q = q.Where(x => x.UserId == uid);
        }
        return q.OrderBy(x => x.Priority);
    }
}