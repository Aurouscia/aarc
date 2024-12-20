using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using AARC.Repos.Identities;
using System.IdentityModel.Tokens.Jwt;

namespace AARC.Services.App.HttpAuthInfo
{
    public class HttpUserInfoService
    {
        public Lazy<HttpUserInfo> UserInfo { get; }
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly HttpUserIdProvider _userIdProvider;
        private readonly UserRepo _userRepo;
        public HttpUserInfoService(
            IHttpContextAccessor httpContextAccessor,
            HttpUserIdProvider userId,
            UserRepo userRepo)
        {
            _httpContextAccessor = httpContextAccessor;
            _userIdProvider = userId;
            _userRepo = userRepo;
            UserInfo = new(GetUserInfo);
        }

        private HttpUserInfo GetUserInfo()
        {
            var id = _userIdProvider.UserId.Value;
            string name = string.Empty;
            int leftHours = 0;
            UserType type = UserType.Tourist;
            var ctx = _httpContextAccessor.HttpContext
                ?? throw new Exception("httpContext获取失败");
            if (id > 0)
            {
                var user = _userRepo.Get(id);
                if (user is not null)
                {
                    name = user.Name ?? "??";
                    type = user.Type;
                }
                var expClaim = ctx.User.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Exp);
                if (expClaim is not null && long.TryParse(expClaim.Value, out long exp))
                {
                    long now = DateTimeOffset.Now.ToUnixTimeSeconds();
                    long leftSeconds = exp - now;
                    leftHours = (int)(leftSeconds / 3600);
                }
            }
            return new HttpUserInfo(id, name, leftHours, type);
        }
    }

    public class HttpUserInfo(int id, string name, int leftHours, UserType userType)
    {
        public int Id { get; } = id;
        public string Name { get; set; } = name;
        public int LeftHours { get; set; } = leftHours;
        public UserType Type { get; set; } = userType;
    }
}
