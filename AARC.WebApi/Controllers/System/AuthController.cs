using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AARC.WebApi.Repos.Identities;
using AARC.WebApi.Services.App.Authentication;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.Identities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace AARC.WebApi.Controllers.System
{
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class AuthController(
        UserRepo userRepo,
        UserHistoryService userHistoryService,
        HttpUserInfoService userInfo,
        OidcAuthService oidcAuth,
        IMemoryCache cache,
        IConfiguration config,
        ILogger<AuthController> logger)
        : Controller
    {
        private const int oidcStateCacheMinutes = 10;

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

            expireHrs = Math.Clamp(expireHrs, 3, 8760);
            var tokenStr = IssueJwt(u.Id, expireHrs);
            logger.LogInformation("[{userId}]{username}登录成功", u.Id, username);
            userHistoryService.RecordLogin(u.Id);
            return new LoginResponse(tokenStr);
        }

        [HttpGet]
        public HttpUserInfo Info()
        {
            return userInfo.UserInfo.Value;
        }

        #region OIDC

        /// <summary>
        /// 发起 OIDC 登录：生成 state/nonce/PKCE，重定向到主应用 IdP。
        /// 前端应在弹窗中打开此地址。
        /// </summary>
        [HttpGet("oidc/challenge")]
        [AllowAnonymous]
        public async Task<IActionResult> OidcChallenge()
        {
            if (!oidcAuth.Enabled)
                return NotFound("OIDC 登录未启用");

            var state = GenerateNonce();
            var nonce = GenerateNonce();
            var codeVerifier = GenerateCodeVerifier();
            var codeChallenge = GenerateCodeChallenge(codeVerifier);

            cache.Set(
                CacheKeyForState(state),
                new OidcState(nonce, codeVerifier),
                TimeSpan.FromMinutes(oidcStateCacheMinutes));

            var url = await oidcAuth.BuildChallengeUrlAsync(state, codeChallenge, nonce);
            return Redirect(url);
        }

        /// <summary>
        /// OIDC 回调：用 code 换 token，校验 id_token，映射/创建本地用户，签发本应用 JWT。
        /// 返回一段 HTML，通过 postMessage 把 token 交给打开此弹窗的前端页面。
        /// </summary>
        [HttpGet("oidc/callback")]
        [AllowAnonymous]
        public async Task<IActionResult> OidcCallback(string code, string state)
        {
            if (!oidcAuth.Enabled)
                return NotFound("OIDC 登录未启用");

            if (!cache.TryGetValue(CacheKeyForState(state), out OidcState? oidcState)
                || oidcState is null)
            {
                throw new RqEx("OIDC 登录状态已过期或无效");
            }
            cache.Remove(CacheKeyForState(state));

            var result = await oidcAuth.ExchangeCodeAsync(
                code,
                config["OidcAuth:RedirectUri"] ?? throw new Exception("未找到配置项 OidcAuth:RedirectUri"),
                oidcState.CodeVerifier,
                oidcState.Nonce);

            var user = userRepo.GetOrCreateExternalUser(
                result.SubjectId,
                result.Issuer,
                result.Name,
                result.Email);

            var tokenStr = IssueJwt(user.Id, 720);
            logger.LogInformation("[{userId}]{username}通过 OIDC 登录成功", user.Id, user.Name);
            userHistoryService.RecordLogin(user.Id);

            var html = CallbackHtml(tokenStr);
            return Content(html, "text/html");
        }

        #endregion

        private string IssueJwt(int userId, int expireHrs)
        {
            string domain = config["Jwt:Domain"] ?? throw new Exception("未找到配置项Jwt:Domain");
            string secret = config["Jwt:SecretKey"] ?? throw new Exception("未找到配置项Jwt:SecretKey");

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Nbf, $"{new DateTimeOffset(DateTime.Now).ToUnixTimeSeconds()}"),
                new Claim(JwtRegisteredClaimNames.Exp, $"{new DateTimeOffset(DateTime.Now.AddHours(expireHrs)).ToUnixTimeSeconds()}"),
                new Claim(JwtRegisteredClaimNames.NameId, userId.ToString())
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
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string CacheKeyForState(string state) => $"oidc:state:{state}";

        private static string CallbackHtml(string token)
        {
            return "<!DOCTYPE html>\n" +
                   "<html>\n" +
                   "<head><title>登录成功</title></head>\n" +
                   "<body>\n" +
                   "<script>\n" +
                   "if (window.opener) {\n" +
                   "    window.opener.postMessage({ type: 'AARC_OIDC_LOGIN', token: '" + token + "' }, '*');\n" +
                   "    window.close();\n" +
                   "} else {\n" +
                   "    document.body.innerText = '登录成功，请关闭本页面。';\n" +
                   "}\n" +
                   "</script>\n" +
                   "</body>\n" +
                   "</html>";
        }

        private static string GenerateNonce() => Guid.NewGuid().ToString("N");

        private static string GenerateCodeVerifier()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Base64UrlEncode(bytes);
        }

        private static string GenerateCodeChallenge(string verifier)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(verifier));
            return Base64UrlEncode(hash);
        }

        private static string Base64UrlEncode(byte[] input)
        {
            return Convert.ToBase64String(input)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private sealed record OidcState(string Nonce, string CodeVerifier);

        public class LoginResponse(string token)
        {
            public string Token { get; } = token;
        }
    }
}
