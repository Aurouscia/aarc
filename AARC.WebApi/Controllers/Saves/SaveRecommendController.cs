using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums.AuthGrantTypes;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Repos;
using AARC.WebApi.Repos.Saves;
using AARC.WebApi.Services.Saves;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Controllers.Saves
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class SaveRecommendController(
        AarcContext context,
        SaveRepo saveRepo,
        SaveDtoEnrichService saveDtoEnrichService
        ) : Controller
    {
        /// <summary>
        /// 随机获取一些公开编辑存档
        /// （在 Edit 类型 AuthGrant 栈中是否含有“允许所有人编辑”）
        /// </summary>
        [AllowAnonymous]
        [HttpGet]
        public List<SaveDto> Get(int count = 5)
        {
            if (count < 1) count = 1;
            if (count > 20) count = 20;

            const int latestPoolSize = 300;

            // 先在最近更新的 300 个存档中筛选（排除已注销所有者）
            var latestSaves = (
                from s in context.Saves.AsNoTracking().Existing()
                join u in context.Users.AsNoTracking().Existing() on s.OwnerUserId equals u.Id
                orderby s.LastActive descending
                select new { s.Id, s.OwnerUserId }
            ).Take(latestPoolSize).ToList();

            if (latestSaves.Count == 0)
                return [];

            var latestIds = latestSaves.Select(x => x.Id).ToList();
            var latestOwnerIds = latestSaves.Select(x => x.OwnerUserId).Distinct().ToList();

            // 一次性取出这些存档相关的所有“To=All”Edit 授权（包含允许/拒绝）
            var allEditGrants = context.AuthGrants.AsNoTracking().Existing()
                .Where(x => x.On == AuthGrantOn.Save
                            && x.Type == (byte)AuthGrantTypeOfSave.Edit
                            && x.To == AuthGrantTo.All
                            && ((x.OnId > 0 && latestIds.Contains(x.OnId))
                                || (x.OnId == 0 && latestOwnerIds.Contains(x.UserId))))
                .Select(x => new { x.OnId, x.UserId, x.Flag, x.Priority })
                .ToList();

            if (allEditGrants.Count == 0)
                return [];

            var userLevelGrants = allEditGrants
                .Where(x => x.OnId == 0 && x.UserId > 0)
                .GroupBy(x => x.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(x => x.Priority).Select(x => x.Flag).ToList());
            var entityLevelGrants = allEditGrants
                .Where(x => x.OnId > 0)
                .GroupBy(x => x.OnId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(x => x.Priority).Select(x => x.Flag).ToList());

            // 对匿名用户，只有 To=All 的授权会命中；
            // 按“用户级（按 Priority 升序）-> 实体级（按 Priority 升序）”的栈顺序，最后一条决定是否可编辑
            var allowedIds = new List<int>(latestSaves.Count);
            foreach (var save in latestSaves)
            {
                var stack = new List<bool>();
                if (userLevelGrants.TryGetValue(save.OwnerUserId, out var userFlags))
                    stack.AddRange(userFlags);
                if (entityLevelGrants.TryGetValue(save.Id, out var entityFlags))
                    stack.AddRange(entityFlags);
                if (stack.Count > 0 && stack[^1])
                    allowedIds.Add(save.Id);
            }

            if (allowedIds.Count == 0)
                return [];

            // 随机打乱并取前 count 个
            Shuffle(allowedIds);
            var selectedIds = allowedIds.Take(count).ToList();

            var saves = saveRepo.GetByIds(selectedIds);
            saveDtoEnrichService.EnrichSaveMini(saves);
            saveDtoEnrichService.EnrichUserName(saves);
            saveDtoEnrichService.EnrichPrivilege(saves);
            saveDtoEnrichService.EnrichComment(saves);
            saveDtoEnrichService.EnrichFavStatus(saves);
            return saves;
        }

        private static void Shuffle(List<int> list)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = Random.Shared.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
    }
}
