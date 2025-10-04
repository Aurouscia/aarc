using AARC.Repos.Identities;
using AARC.Services.App.HttpAuthInfo;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AARC.Controllers.Identities
{
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class AuthController(
        UserRepo userRepo,
        HttpUserInfoService userInfo,
        IConfiguration config,
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

            string domain = config["Jwt:Domain"] ?? throw new Exception("未找到配置项Jwt:Domain");
            string secret = config["Jwt:SecretKey"] ?? throw new Exception("未找到配置项Jwt:SecretKey");

            expireHrs = Math.Clamp(expireHrs, 3, 8760);
            var claims = new[]
            {
                    new Claim (JwtRegisteredClaimNames.Nbf,$"{new DateTimeOffset(DateTime.Now).ToUnixTimeSeconds()}") ,
                    new Claim (JwtRegisteredClaimNames.Exp,$"{new DateTimeOffset(DateTime.Now.AddHours(expireHrs)).ToUnixTimeSeconds()}"),
                    new Claim (type:JwtRegisteredClaimNames.NameId, u.Id.ToString())
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: domain,
                audience: domain,
                claims: claims,
                expires: DateTime.Now.AddHours(expireHrs),
                signingCredentials: creds
            );

            string tokenStr = new JwtSecurityTokenHandler().WriteToken(token);
            logger.LogInformation("[{userId}]{username}登录成功", u.Id, username);
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
