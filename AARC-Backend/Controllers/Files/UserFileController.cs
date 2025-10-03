using AARC.Repos.Files;
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
        public bool UploadFile([FromForm]IFormFile userFile)
        {
            userFileRepo.Add(userFile);
            return true;
        }
    }
}
