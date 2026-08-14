using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Repos.Identities;
using AARC.WebApi.Services.App.ActionFilters;
using AARC.WebApi.Services.App.Email;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.App.Turnstile;
using AARC.WebApi.Services.Identities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AARC.WebApi.Controllers.Identities
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class UserController(
        UserRepo userRepo,
        UserHistoryService userHistoryService,
        TurnstileVerifyService turnstileVerifyService,
        EmailService emailService,
        HttpUserIdProvider httpUserIdProvider,
        HttpUserInfoService httpUserInfoService,
        IConfiguration configuration
        ) : Controller
    {
        [AllowAnonymous]
        [HttpGet]
        public List<UserDto> Index(string? search, string? orderby, bool exact = false)
        {
            //orderby: active(默认) 或 save
            var list = userRepo.IndexUser(search, orderby, exact);
            return list;
        }

        [AllowAnonymous]
        [HttpGet]
        public List<UserHistoryService.UserHistoryDto> LoadHistory(
            int targetUserId, int operatorUserId, UserHistoryType type, string? comment, int skip,
            UserType? targetUserType = null)
        {
            return userHistoryService.Load(targetUserId, operatorUserId, type, comment, skip, targetUserType);
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
            var registerEnabled = configuration.GetValue<bool?>("Register:Enabled") ?? true;
            if (!registerEnabled)
                throw new RqEx("本站点不允许注册");
            var requireUserType = configuration.GetValue<UserType?>("Register:RequireUserType") ?? UserType.Tourist;
            if (requireUserType > UserType.Tourist)
            {
                var currentUserInfo = httpUserInfoService.UserInfo.Value;
                if (currentUserInfo.Id <= 0)
                    throw new RqEx("本站点注册需要登录，请登录后重试");
                if (currentUserInfo.Type < requireUserType)
                    throw new RqEx("当前账号权限不足，无法注册新用户");
            }
            await turnstileVerifyService.Verify(turnstileToken);
            var success = userRepo.CreateUser(userName, password, out var errmsg);
            if (!success)
                throw new RqEx(errmsg);
            return true;
        }

        [HttpPost]
        public bool Update([FromBody] UserUpdateRequest request)
        {
            var user = request.User ?? throw new RqEx("数据异常");
            var comment = request.Comment;
            userRepo.UpdateUser(user, comment);
            return true;
        }

        [HttpPost]
        [UserCheck(UserType.Admin)]
        public bool ChangeCredit([FromForm] int userId, [FromForm] int creditDelta, [FromForm] string? comment)
        {
            userHistoryService.RecordChangeCredit(userId, creditDelta, comment);
            return true;
        }

        [HttpGet]
        public int GetCredit(int userId)
        {
            return userHistoryService.GetUserCredit(userId);
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

        [HttpPost]
        public async Task<bool> RequestBindEmail([FromForm] string email)
        {
            var userId = httpUserIdProvider.UserIdLazy.Value;
            var code = userRepo.GenerateEmailVerificationCode(userId, email);
            await emailService.SendEmailVerificationCodeAsync(email, code);
            return true;
        }

        [HttpPost]
        public bool ConfirmBindEmail([FromForm] string code, [FromForm] string email)
        {
            var userId = httpUserIdProvider.UserIdLazy.Value;
            userRepo.BindEmailWithCode(userId, code.ToUpperInvariant(), email);
            return true;
        }

        [HttpGet]
        public string? MyMaskedEmail()
        {
            return userRepo.GetMyMaskedEmail();
        }

        [HttpPost]
        public bool UpgradeToMember()
        {
            var userId = httpUserIdProvider.UserIdLazy.Value;
            userRepo.UpgradeToMember(userId);
            return true;
        }
    }

    public class UserUpdateRequest
    {
        public UserDto? User { get; set; }
        public string? Comment { get; set; }
    }
}
