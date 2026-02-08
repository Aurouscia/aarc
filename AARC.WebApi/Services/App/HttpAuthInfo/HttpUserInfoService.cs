using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Repos;
using System.IdentityModel.Tokens.Jwt;
using AARC.WebApi.Models.DbModels.Enums;

namespace AARC.WebApi.Services.App.HttpAuthInfo
{
    public class HttpUserInfoService
    {
        public Lazy<HttpUserInfo> UserInfo { get; }
        public bool IsAdmin => UserInfo.Value.IsAdmin;
        public bool IsMember => UserInfo.Value.IsMember;
        public bool IsTourist => UserInfo.Value.IsTourist;

        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly HttpUserIdProvider _userIdProvider;
        private readonly AarcContext _context;
        public HttpUserInfoService(
            IHttpContextAccessor httpContextAccessor,
            HttpUserIdProvider userId,
            AarcContext context)
        {
            _httpContextAccessor = httpContextAccessor;
            _userIdProvider = userId;
            _context = context;
            UserInfo = new(GetUserInfo);
        }

        public bool GetUserExist()
        {
            var uid = _userIdProvider.UserIdLazy.Value;
            var uExist = _context.Users.Existing().Any(x => x.Id == uid);
            return uExist;
        }

        private HttpUserInfo GetUserInfo()
        {
            var id = _userIdProvider.UserIdLazy.Value;
            string name = string.Empty;
            int leftHours = 0;
            UserType type = UserType.Tourist;
            var ctx = _httpContextAccessor.HttpContext
                ?? throw new Exception("httpContext获取失败");
            if (id > 0)
            {
                var user = _context.Users.Find(id);
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
        public bool IsAdmin => Type >= UserType.Admin;
        public bool IsMember => Type >= UserType.Member;
        public bool IsTourist => Type <= UserType.Tourist;
    }
}
