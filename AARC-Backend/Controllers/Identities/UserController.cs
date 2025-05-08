using AARC.Models.Dto;
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

        [AllowAnonymous]
        [HttpPost]
        public bool Add(string? userName, string? password)
        {
            var success = userRepo.CreateUser(userName, password, out var errmsg);
            if (!success)
                throw new RqEx(errmsg);
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

        [HttpGet]
        public UserDto GetInfo(int id)
        {
            var res = userRepo.GetUserInfo(id) 
                ?? throw new RqEx("找不到指定用户");
            return res;
        }

        [AllowAnonymous]
        [HttpPost]
        public string InitAdmin(string? userName, string? masterKey)
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
