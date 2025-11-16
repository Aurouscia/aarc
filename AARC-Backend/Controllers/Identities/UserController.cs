using AARC.Models.DbModels.Enums;
using AARC.Models.DbModels.Identities;
using AARC.Repos.Identities;
using AARC.Services.App.ActionFilters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.Identities
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class UserController(
        UserRepo userRepo
        ) : Controller
    {
        [AllowAnonymous]
        [HttpGet]
        public List<UserDto> Index(string? search, string? orderby)
        {
            //orderby: active(默认) 或 save
            var list = userRepo.IndexUser(search, orderby);
            return list;
        }

        private const int registerRestrictSecs = 20;
        private static DateTime lastRegisterRequest = DateTime.Now.AddSeconds(-registerRestrictSecs * 2);
        [AllowAnonymous]
        [HttpPost]
        public bool Add(
            [FromForm] string? userName,
            [FromForm] string? password)
        {
            var lastRegisterPassed = 
                (int)(DateTime.Now - lastRegisterRequest).TotalSeconds;
            if (lastRegisterPassed < registerRestrictSecs)
            {
                int wait = registerRestrictSecs - lastRegisterPassed;
                throw new RqEx($"【限流】请等待{wait}秒后重试");
            }
            var success = userRepo.CreateUser(userName, password, out var errmsg);
            if (!success)
                throw new RqEx(errmsg);
            lastRegisterRequest = DateTime.Now;
            return true;
        }

        [HttpPost]
        public bool Update([FromBody] UserDto user)
        {
            var success = userRepo.UpdateUser(user, out var errmsg);
            if (!success)
                throw new RqEx(errmsg);
            return true;
        }

        [AllowAnonymous]
        [HttpGet]
        public UserDto GetInfo(int id)
        {
            var res = userRepo.GetUserInfo(id) 
                ?? throw new RqEx("找不到用户信息");
            return res;
        }

        [HttpDelete]
        [UserCheck(UserType.Admin)]
        public bool Remove(int id)
        {
            var success = userRepo.FakeRemoveUser(id, out var errmsg);
            if (!success)
                throw new RqEx(errmsg);
            return true;
        }
    }
}
