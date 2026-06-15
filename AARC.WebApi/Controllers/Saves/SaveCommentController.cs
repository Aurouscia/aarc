using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Repos.Saves;
using AARC.WebApi.Services.App.ActionFilters;
using AARC.WebApi.Services.App.HttpAuthInfo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.WebApi.Controllers.Saves
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class SaveCommentController(
        SaveCommentRepo saveCommentRepo,
        HttpUserInfoService httpUserInfoService,
        SaveRepo saveRepo
        ) : Controller
    {
        [HttpPost]
        [UserCheck]
        public bool Add(
            [FromForm] int saveId,
            [FromForm] string content,
            [FromForm] SaveCommentType type = SaveCommentType.Regular)
        {
            if (type == SaveCommentType.Warn && !httpUserInfoService.IsAdmin)
                throw new RqEx("无权操作");
            if (type == SaveCommentType.Rule)
            {
                var ownerId = saveRepo.WithId(saveId).Select(x => x.OwnerUserId).FirstOrDefault();
                var uid = httpUserInfoService.UserInfo.Value.Id;
                if (ownerId != uid)
                    throw new RqEx("无权操作");
            }
            saveCommentRepo.Add(saveId, content, type);
            return true;
        }

        [HttpDelete]
        [UserCheck]
        public bool Delete([FromForm] int id)
        {
            saveCommentRepo.Delete(id);
            return true;
        }

        [HttpPost]
        [UserCheck]
        public bool SetDeprecated([FromForm] int id)
        {
            saveCommentRepo.SetDeprecated(id);
            return true;
        }

        [AllowAnonymous]
        [HttpGet]
        public List<SaveCommentDto> Get(int saveId, int skip = 0, int take = 50)
        {
            return saveCommentRepo.GetBySaveId(saveId, skip, take);
        }

        [HttpGet]
        [UserCheck]
        public List<SaveWarnDto> GetAllWarns()
        {
            if (!httpUserInfoService.IsAdmin)
                throw new RqEx("无权操作");
            return saveCommentRepo.GetAllWarns();
        }
    }
}
