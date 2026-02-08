using System.IdentityModel.Tokens.Jwt;

namespace AARC.WebApi.Services.App.HttpAuthInfo
{
    public class HttpUserIdProvider
    {
        public Lazy<int> UserIdLazy { get; }
        private readonly IHttpContextAccessor _httpContextAccessor;
        public HttpUserIdProvider(IHttpContextAccessor httpContextAccessor)
        {
            UserIdLazy = new(GetUserId);
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

        /// <summary>
        /// 获取用户Id，未获取到则抛出RqEx
        /// </summary>
        /// <returns>用户Id</returns>
        public int RequireUserId()
        {
            var uid = UserIdLazy.Value;
            if (uid <= 0)
                throw new RqEx("请登录后重试");
            return uid;
        }
    }
}
