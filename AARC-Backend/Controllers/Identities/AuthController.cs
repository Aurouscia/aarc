using AARC.Models.Db.Context;
using AARC.Services.App.HttpAuthInfo;
using AARC.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AARC.Controllers.Identities
{
    public class AuthController(
        AarcContext context,
        HttpUserInfoService userInfo,
        IConfiguration config,
        ILogger<AuthController> logger)
        : Controller
    {
        public const int loginExpireHours = 24 * 7;
        public IActionResult Login(string? userName, string? password)
        {
            logger.LogInformation("登录请求：{userName}", userName);

            if (userName is null || password is null)
                return this.ApiRespFailed("请填写用户名和密码");
            string pwdMd5 = password.GetMD5();
            var u = context.Users.Where(x => x.Name == userName && x.Password == pwdMd5).FirstOrDefault();
            if (u is null)
                return this.ApiRespFailed("用户名或密码错误");

            string domain = config["Jwt:Domain"] ?? throw new Exception("未找到配置项Jwt:Domain");
            string secret = config["Jwt:SecretKey"] ?? throw new Exception("未找到配置项Jwt:SecretKey");

            int expHours = loginExpireHours; //TODO:改成自己设置的
            var claims = new[]
            {
                    new Claim (JwtRegisteredClaimNames.Nbf,$"{new DateTimeOffset(DateTime.Now).ToUnixTimeSeconds()}") ,
                    new Claim (JwtRegisteredClaimNames.Exp,$"{new DateTimeOffset(DateTime.Now.AddHours(expHours)).ToUnixTimeSeconds()}"),
                    new Claim (type:JwtRegisteredClaimNames.NameId, u.Id.ToString())
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: domain,
                audience: domain,
                claims: claims,
                expires: DateTime.Now.AddHours(expHours),
                signingCredentials: creds
            );

            string tokenStr = new JwtSecurityTokenHandler().WriteToken(token);
            logger.LogInformation("[{userId}]{userName}登录成功", u.Id, userName);
            return this.ApiResp(new LoginResponse(tokenStr));
        }

        public IActionResult Info()
        {
            return this.ApiResp(userInfo.UserInfo.Value);
        }

        public class LoginResponse(string token)
        {
            public string Token { get; } = token;
        }
    }
}
