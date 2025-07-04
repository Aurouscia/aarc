using AARC.Repos.Identities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RqEx = AARC.Utils.Exceptions.RequestInvalidException;

namespace AARC.Controllers.Identities
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class UserController(
        UserRepo userRepo,
        IConfiguration config
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
                ?? throw new RqEx("找不到指定用户");
            return res;
        }

        [AllowAnonymous]
        [HttpPost]
        public string InitAdmin(
            [FromForm] string? userName,
            [FromForm] string? masterKey)
        {
            var mKey = config["MasterKey"] ?? Path.GetRandomFileName();
            if (mKey != masterKey)
                return "MasterKey错误";
            var initialPwd = "987333";
            var success = userRepo.CreateUser(userName, initialPwd, out var errmsg, true);
            if (success)
                return $"创建成功，密码为{initialPwd}，立即登录并更改";
            else
                return errmsg ?? "未知错误";
        }
    }
}
