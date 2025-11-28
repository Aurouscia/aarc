using AARC.Models.DbModels.Enums;
using AARC.Models.DbModels.Identities;
using AARC.Repos.Identities;
using AARC.Services.App.ActionFilters;
using AARC.Services.App.Turnstile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.Identities
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class UserController(
        UserRepo userRepo,
        TurnstileVerifyService turnstileVerifyService
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
        [HttpGet]
        public List<UserDtoSimple> QuickSearch(string? search)
        {
            if (string.IsNullOrWhiteSpace(search))
                return [];
            return userRepo.QuickSearchUser(search);
        }

        [AllowAnonymous]
        [HttpPost]
        public List<UserDtoSimple> QuickDisplay([FromBody]List<int> ids)
        {
            return userRepo.QuickDisplayUser(ids);
        }
        
        [AllowAnonymous]
        [HttpPost]
        public async Task<bool> Add(
            [FromForm] string? userName,
            [FromForm] string? password,
            [FromForm] string? turnstileToken)
        {
            await turnstileVerifyService.Verify(turnstileToken);
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
