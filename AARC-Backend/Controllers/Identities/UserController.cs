using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using AARC.Models.Dto;
using AARC.Repos.Identities;
using AARC.Services.App.HttpAuthInfo;
using AARC.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace AARC.Controllers.Identities
{
    [Authorize]
    public class UserController(
        UserRepo userRepo,
        IConfiguration config
        ) : Controller
    {
        public IActionResult Index(string? search)
        {
            var list = userRepo.IndexUser(search);
            return this.ApiResp(list);
        }

        [AllowAnonymous]
        public IActionResult Add(string? userName, string? password)
        {
            var success = userRepo.CreateUser(userName, password, out var errmsg);
            return this.ApiResp(success, errmsg);
        }

        public IActionResult Update([FromBody] UserDto user)
        {
            var success = userRepo.UpdateUser(user, out var errmsg);
            return this.ApiResp(success, errmsg);
        }

        public IActionResult GetInfo(int id)
        {
            var res = userRepo.GetUserInfo(id);
            var errmsg = res is null ? "找不到指定用户" : null;
            if(errmsg is null)
                return this.ApiResp(res);
            return this.ApiRespFailed(errmsg);
        }

        [AllowAnonymous]
        public IActionResult InitAdmin(string? userName, string? masterKey)
        {
            var mKey = config["MasterKey"] ?? Path.GetRandomFileName();
            if (mKey != masterKey)
                return this.ApiRespFailed("MasterKey错误");
            var initialPwd = "987333";
            var success = userRepo.CreateUser(userName, initialPwd, out var errmsg, true);
            if (success)
                return this.ApiResp(new { Info = $"创建成功，密码为{initialPwd}，立即登录并更改" });
            else
                return this.ApiRespFailed(errmsg);
        }
    }
}
