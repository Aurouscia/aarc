using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums.AuthGrantTypes;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Repos;
using AARC.WebApi.Repos.Saves;
using AARC.WebApi.Services.Identities.AuthGrants;
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
        SaveDtoEnrichService saveDtoEnrichService,
        AuthGrantCheckService authGrantCheckService
        ) : Controller
    {
        /// <summary>
        /// 随机获取一些当前用户可编辑的公开存档
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
            var accessible = authGrantCheckService
                .CalculateFor(AuthGrantOn.Save, latestIds, (byte)AuthGrantTypeOfSave.Edit, defaultAllow: false);

            var allowedIds = latestSaves
                .Where((x, i) => accessible.ElementAtOrDefault(i))
                .Select(x => x.Id)
                .ToList();

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
