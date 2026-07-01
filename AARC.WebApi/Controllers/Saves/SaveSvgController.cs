using AARC.WebApi.Models.DbModels.Enums.AuthGrantTypes;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Repos.Saves;
using AARC.WebApi.Services.App.ActionFilters;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.Files;
using AARC.WebApi.Services.Identities.AuthGrants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.WebApi.Controllers.Saves
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class SaveSvgController(
        SaveSvgFileService saveSvgFileService,
        SaveRepo saveRepo,
        AuthGrantCheckService authGrantCheckService,
        HttpUserInfoService httpUserInfoService
        ) : Controller
    {
        /// <summary>
        /// 上传/更新指定存档的SVG文件，每个存档仅保留最新的一份
        /// </summary>
        [HttpPost]
        [UserCheck]
        public bool Upload(int saveId, IFormFile? svg)
        {
            if (svg is null || svg.Length == 0)
                throw new RqEx("请上传SVG文件");

            // 仅所有者或拥有该存档编辑权限的用户可上传
            var uid = httpUserInfoService.UserInfo.Value.Id;
            var isOwner = saveRepo.Existing
                .Any(x => x.Id == saveId && x.OwnerUserId == uid);
            if (!isOwner)
                authGrantCheckService.CheckFor(
                    AuthGrantOn.Save, saveId, (byte)AuthGrantTypeOfSave.Edit, false);

            saveSvgFileService.Write(svg.OpenReadStream(), saveId);
            return true;
        }
    }
}
