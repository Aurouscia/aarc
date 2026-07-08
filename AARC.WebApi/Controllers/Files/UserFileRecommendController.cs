using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums.AuthGrantTypes;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Repos;
using AARC.WebApi.Repos.Files;
using AARC.WebApi.Services.Identities.AuthGrants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Controllers.Files
{
    [AllowAnonymous]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class UserFileRecommendController(
        AarcContext context,
        UserFileRepo userFileRepo,
        AuthGrantCheckService authGrantCheckService
        ) : Controller
    {
        /// <summary>
        /// 随机获取一些当前用户可查看的公开资源
        /// </summary>
        [HttpGet]
        public List<UserFileDto> Get(int count = 5)
        {
            if (count < 1) count = 1;
            if (count > 20) count = 20;

            const int latestPoolSize = 300;

            var latestFiles = (
                from f in context.UserFiles.AsNoTracking().Existing()
                join u in context.Users.AsNoTracking().Existing() on f.OwnerUserId equals u.Id
                orderby f.LastActive descending
                select new { f.Id, f.OwnerUserId }
            ).Take(latestPoolSize).ToList();

            if (latestFiles.Count == 0)
                return [];

            var latestIds = latestFiles.Select(x => x.Id).ToList();
            var accessible = authGrantCheckService
                .CalculateFor(AuthGrantOn.UserFile, latestIds, (byte)AuthGrantTypeOfUserFile.View, defaultAllow: false);

            var allowedIds = latestFiles
                .Where((x, i) => accessible.ElementAtOrDefault(i))
                .Select(x => x.Id)
                .ToList();

            if (allowedIds.Count == 0)
                return [];

            Shuffle(allowedIds);
            var selectedIds = allowedIds.Take(count).ToList();
            return userFileRepo.GetUserFileDtosByIds(selectedIds);
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
