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
        public bool UploadFile([FromForm]IFormFile userFile)
        {
            userFileRepo.Add(userFile);
            return true;
        }
        [HttpGet]
        public List<UserFileDto> Get()
        {
            return userFileRepo.GetUserFiles(0, 0, null);
        }
    }
}
