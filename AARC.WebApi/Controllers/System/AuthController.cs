using AARC.WebApi.Repos.Identities;
using AARC.WebApi.Services.App.Authentication;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.Identities;
using Microsoft.AspNetCore.Mvc;

namespace AARC.WebApi.Controllers.System
{
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class AuthController(
        UserRepo userRepo,
        UserHistoryService userHistoryService,
        HttpUserInfoService userInfo,
        JwtTokenService jwtTokenService,
        ILogger<AuthController> logger)
        : Controller
    {
        [HttpPost]
        public LoginResponse Login(
            [FromForm] string? username,
            [FromForm] string? password,
            [FromForm] int expireHrs)
        {
            logger.LogInformation("登录请求：{userName}", username);

            if (username is null || password is null)
                throw new RqEx("请填写用户名和密码");
            var u = userRepo.MatchUser(username, password) 
                ?? throw new RqEx("用户名或密码错误");

            string tokenStr = jwtTokenService.GenerateToken(u.Id, expireHrs);
            logger.LogInformation("[{userId}]{username}登录成功", u.Id, username);
            userHistoryService.RecordLogin(u.Id);
            return new LoginResponse(tokenStr);
        }
        [HttpGet]
        public HttpUserInfo Info()
        {
            return userInfo.UserInfo.Value;
        }

        public class LoginResponse(string token)
        {
            public string Token { get; } = token;
        }
    }
}
