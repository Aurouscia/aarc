using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using AARC.Models.DbModels.Files;
using AARC.Models.DbModels.Identities;
using AARC.Models.DbModels.Saves;
using AARC.Services.App.HttpAuthInfo;

namespace AARC.Repos.Identities;

public class AuthGrantRepo(
    AarcContext context,
    HttpUserIdProvider httpUserIdProvider
    ):Repo<AuthGrant>(context)
{
    public override bool AllowUpdate => false;
    public override bool AllowRealRemove => true;

    public List<AuthGrant> LoadAuthGrants(AuthGrantOn on, int onId, byte type)
    {
        EnsureIsOwnerOf(on, onId);
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
                throw new RqEx("无权操作AuthGrant");
            return;
        }
        // 如果UserId没值
        // 那么OnId必须有值
        if (item.OnId == 0)
            throw new RqEx("AuthGrant异常（UserId与OnId不能同时无值）");
        // 且OnId对应的实体的所有者是当前用户
        var onId = item.OnId;
        var on = item.On;
        EnsureIsOwnerOf(on, onId);
    }

    public void EnsureIsOwnerOf(AuthGrantOn on, int onId)
    {
        if (onId == 0)
            return;
        switch (on)
        {
            case AuthGrantOn.Save:
                EnsureIsOwnerOf<Save>(onId);
                break;
            case AuthGrantOn.SaveFolder:
                EnsureIsOwnerOf<SaveFolder>(onId);
                break;
            case AuthGrantOn.UserFile:
                EnsureIsOwnerOf<UserFile>(onId);
                break;
            case AuthGrantOn.Unknown:
            default:
                throw new InvalidOperationException("未知的AuthGrantOn类型");
        }
    }
    
    public void EnsureIsOwnerOf<T>(int id) where T : class, IDbModel, IOwnable
    {
        var ownerId = Context.Set<T>()
            .Where(x => x.Id == id)
            .Select(x => x.OwnerUserId)
            .FirstOrDefault();
        var uid = httpUserIdProvider.RequireUserId();
        if (uid != ownerId)
            throw new RqEx("无权操作AuthGrant");
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