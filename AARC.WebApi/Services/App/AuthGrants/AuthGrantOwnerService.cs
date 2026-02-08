using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels;
using AARC.WebApi.Models.DbModels.Files;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.WebApi.Services.App.HttpAuthInfo;

namespace AARC.WebApi.Services.App.AuthGrants;

public class AuthGrantOwnerService(
    AarcContext context,
    HttpUserIdProvider userIdProvider)
{
    public void EnsureIsOwnerOf(AuthGrantOn on, int onId)
    {
        if (onId == 0)
            return;
        int owner = GetOwnerOf(on, [onId]).FirstOrDefault();
        int uid = userIdProvider.RequireUserId();
        if (owner != uid)
            throw new RqEx("非所有者，无权操作");
    }
    
    public List<int> GetOwnerOf(AuthGrantOn on, List<int> onIds)
    {
        if (onIds.Any(x => x == 0))
            throw new InvalidOperationException("onId在此处不能为0");
        switch (on)
        {
            case AuthGrantOn.Save:
                return GetOwnersOf<Save>(onIds);
            case AuthGrantOn.SaveFolder:
                return GetOwnersOf<SaveFolder>(onIds);
            case AuthGrantOn.UserFile:
                return GetOwnersOf<UserFile>(onIds);
            case AuthGrantOn.Unknown:
            default:
                throw new InvalidOperationException("未知的AuthGrantOn类型");
        }
    }
    
    public List<int> GetOwnersOf<T>(List<int> ids) where T : class, IDbModel, IOwnable
    {
        var ownerMap = context.Set<T>()
            .Where(x => ids.Contains(x.Id))
            .ToDictionary(x => x.Id, x => x.OwnerUserId);
        var res = new List<int>();
        foreach (var id in ids)
        {
            ownerMap.TryGetValue(id, out var userId);
            res.Add(userId);
        }
        return res;
    }
}