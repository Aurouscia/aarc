using AARC.Models.DbModels.Enums;
using AARC.Models.DbModels.Identities;
using AARC.Repos.Files;
using AARC.Services.App.ActionFilters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.Files
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class UserFileController(
        UserFileRepo userFileRepo
        ) : Controller
    {
        [HttpPost]
        [UserCheck(UserType.Member)]
        public bool Upload(
            IFormFile? userFile,
            [FromForm]string? displayName,
            [FromForm]string? intro)
        {
            userFileRepo.Add(userFile, displayName, intro);
            return true;
        }

        [HttpPost]
        [UserCheck(UserType.Member)]
        public bool Edit(
            [FromForm] int id,
            [FromForm] string? displayName,
            [FromForm] string? intro)
        {
            userFileRepo.Edit(id, displayName, intro);
            return true;
        }

        [HttpDelete]
        [UserCheck(UserType.Member)]
        public bool Delete([FromForm] int id)
        {
            userFileRepo.Delete(id);
            return true;
        }
        
        [HttpGet]
        public List<UserFileDto> Get()
        {
            return userFileRepo.GetUserFiles(0, 0, null);
        }
    }
}
