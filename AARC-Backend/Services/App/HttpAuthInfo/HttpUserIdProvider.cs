using System.IdentityModel.Tokens.Jwt;

namespace AARC.Services.App.HttpAuthInfo
{
    public class HttpUserIdProvider
    {
        public Lazy<int> UserId { get; }
        private readonly IHttpContextAccessor _httpContextAccessor;
        public HttpUserIdProvider(IHttpContextAccessor httpContextAccessor)
        {
            UserId = new(GetUserId);
            _httpContextAccessor = httpContextAccessor;
        }
        private int GetUserId()
        {
            var ctx = _httpContextAccessor.HttpContext;
            if (ctx is null)
                return 0;
            var idClaim = ctx.User.Claims.FirstOrDefault(x
                => x.Type.Contains(JwtRegisteredClaimNames.NameId));
            if (idClaim is null)
                return 0;
            else
            {
                if (int.TryParse(idClaim.Value, out int id))
                    return id;
            }
            return 0;
        }
        public int RequireUserId()
        {
            var uid = UserId.Value;
            if (uid <= 0)
                throw new InvalidOperationException("请登录后重试");
            return uid;
        }
    }
}
