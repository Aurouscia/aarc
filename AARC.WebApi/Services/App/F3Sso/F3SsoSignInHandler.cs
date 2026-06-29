using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Repos.Identities;
using AARC.WebApi.Services.App.Authentication;
using FCloud3.Sso;
using FCloud3.Sso.Audience;

namespace AARC.WebApi.Services.App.F3Sso
{
    public class F3SsoSignInHandler(
        UserRepo userRepo,
        JwtTokenService jwtTokenService
        ) : IF3SsoSignInHandler
    {
        public Task HandleAsync(HttpContext context, string issuer, F3SsoValidatedUser user)
        {
            var userId = userRepo.GetOrCreateSsoUser(issuer, user.Id.ToString(), user.Name, UserType.Member);
            var token = jwtTokenService.GenerateToken(userId);
            context.Response.Cookies.Append("token", token);
            return Task.CompletedTask;
        }
    }
}
