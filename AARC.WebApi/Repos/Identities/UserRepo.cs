using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.Db.Context.Specific;
using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.Identities;
using AARC.WebApi.Utils;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace AARC.WebApi.Repos.Identities
{
    public class UserRepo(
        AarcContext context,
        HttpUserInfoService httpUserInfoService,
        HttpUserIdProvider httpUserIdProvider,
        UserHistoryService userHistoryService,
        IMapper mapper
        ) : Repo<User>(context)
    {
        public IQueryable<User> Viewable
        {
            get
            {
                if (httpUserInfoService.IsAdmin)
                    return Existing;
                if (httpUserInfoService.IsTourist)
                {
                    var myId = httpUserIdProvider.UserIdLazy.Value;
                    return Existing.Where(x => x.Type > UserType.Tourist || x.Id == myId);
                }
                return Existing.Where(x => x.Type > UserType.Tourist);
            }
        }

        public User? MatchUser(string username, string password)
        {
            var pwdEncrypted = UserPwdEncryption.Encrypt(password);
            return Existing
                .FirstOrDefault(x => x.Name == username && x.Password == pwdEncrypted);
        }

        /// <summary>
        /// 根据外部身份标识查找或创建本地用户
        /// </summary>
        public User GetOrCreateExternalUser(
            string externalSubjectId,
            string externalIssuer,
            string? displayName,
            string? email)
        {
            var user = Existing.FirstOrDefault(x =>
                x.ExternalSubjectId == externalSubjectId
                && x.ExternalIssuer == externalIssuer);
            if (user is not null)
                return user;

            var name = GenerateUniqueExternalUserName(displayName, email);
            var randomPassword = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
            user = new User
            {
                Name = name,
                Password = UserPwdEncryption.Encrypt(randomPassword),
                Email = email,
                Type = UserType.Tourist,
                ExternalSubjectId = externalSubjectId,
                ExternalIssuer = externalIssuer
            };
            using var t = Context.Database.BeginTransaction();
            try
            {
                int uid = base.Add(user);
                userHistoryService.RecordRegister(uid);
                t.Commit();
                return user;
            }
            catch
            {
                t.Rollback();
                throw;
            }
        }

        private string GenerateUniqueExternalUserName(string? displayName, string? email)
        {
            var candidate = GetSafeUserName(displayName)
                ?? GetSafeUserName(email?.Split('@').FirstOrDefault())
                ?? $"u{Guid.NewGuid().ToString("N")[..8]}";
            if (!Existing.Any(x => x.Name == candidate))
                return candidate;
            var suffix = Guid.NewGuid().ToString("N")[..6];
            var maxBaseLen = User.nameMaxLength - suffix.Length - 1;
            var baseName = candidate.Length > maxBaseLen ? candidate[..maxBaseLen] : candidate;
            return $"{baseName}_{suffix}";
        }

        private static string? GetSafeUserName(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return null;
            var safe = new string(input
                .Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_')
                .ToArray());
            if (string.IsNullOrEmpty(safe))
                return null;
            return safe.Length > User.nameMaxLength ? safe[..User.nameMaxLength] : safe;
        }

        public List<UserDto> IndexUser(string? search, string? orderby)
        {
            int takeCount = 50;
            var myId = httpUserInfoService.UserInfo.Value.Id;
            var userQ = FilterByName(Viewable, search);
            var saveQ = base.Context.Saves.Existing().Where(x => x.StaCount > 0);
            var orderbySave = orderby == "save";

            List<UserDto> finalList;
            if (orderbySave)
            {
                var userIdCountQ = saveQ
                    .GroupBy(x => x.OwnerUserId)
                    .Select(x => new
                    {
                        UserId = x.Key,
                        Count = x.Count()
                    });
                var topUserIds = (
                    from u in userQ
                    join uc in userIdCountQ on u.Id equals uc.UserId
                    select new
                    {
                        u.Id,
                        uc.Count
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(takeCount)
                    .ToList();
                var topUserIdList = topUserIds.Select(x => x.Id).ToList();
                var users = userQ
                    .Where(x => topUserIdList.Contains(x.Id))
                    .ProjectTo<UserDto>(mapper.ConfigurationProvider)
                    .ToList();
                var userCountDict = topUserIds.ToDictionary(x => x.Id, x => x.Count);
                finalList = topUserIdList
                    .Select(id =>
                    {
                        var user = users.First(x => x.Id == id);
                        user.SaveCount = userCountDict[id];
                        return user;
                    })
                    .ToList();
            }
            else
            {
                finalList = userQ
                    .OrderByDescending(x => x.LastActive)
                    .ProjectTo<UserDto>(mapper.ConfigurationProvider)
                    .Take(takeCount)
                    .ToList();
            }

            if (myId > 0 && string.IsNullOrWhiteSpace(search))
            {
                var meIdx = finalList.FindIndex(x => x.Id == myId);
                if (meIdx == -1)
                {
                    var me = Existing
                        .Where(x => x.Id == myId)
                        .ProjectTo<UserDto>(mapper.ConfigurationProvider)
                        .FirstOrDefault();
                    if (me is not null)
                    {
                        if (orderbySave)
                            me.SaveCount = saveQ.Count(x => x.OwnerUserId == myId);
                        finalList.Insert(0, me);
                    }
                }
                else
                {
                    var me = finalList.ElementAt(meIdx);
                    finalList.RemoveAt(meIdx);
                    finalList.Insert(0, me);
                }
            }
            return finalList;
        }

        public List<UserDtoSimple> QuickSearchUser(string search)
        {
            var userQ = FilterByName(Existing, search);
            var res = userQ
                .OrderBy(x => x.Name.Length)
                .ThenByDescending(x => x.LastActive)
                .Take(10)
                .ProjectTo<UserDtoSimple>(mapper.ConfigurationProvider)
                .ToList();
            return res;
        }

        public List<UserDtoSimple> QuickDisplayUser(List<int> userIds)
        {
            userIds = userIds.DistinctAndTake(50);
            var userQ = Viewable
                .Where(x => userIds.Contains(x.Id))
                .ProjectTo<UserDtoSimple>(mapper.ConfigurationProvider)
                .ToList();
            return userQ;
        }
        
        public bool CreateUser(
            string? username, string? password, out string? errmsg, bool createAdmin = false)
        {
            username ??= "";
            password ??= "";
            errmsg = CheckModel(username, password, null);
            if (errmsg is { })
                return false;
            User u = new()
            {
                Name = username,
                Password = UserPwdEncryption.Encrypt(password),
                Type = createAdmin ? UserType.Admin : UserType.Tourist
            };
            using var t = Context.Database.BeginTransaction();
            try
            {
                int uid = base.Add(u);
                userHistoryService.RecordRegister(uid);
                t.Commit();
                return true;
            }
            catch
            {
                t.Rollback();
                throw;
            }
        }

        public void UpdateUser(UserDto u, string? comment)
        {
            if (u.Id == 0)
                throw new RqEx("数据异常");
            var current = httpUserInfoService.UserInfo.Value;
            if (current.Id != u.Id && !current.IsAdmin)
            {
                //除管理员之外的用户只能update自己的信息
                throw new RqEx("无权操作");
            }
            var errmsg = CheckModel(u.Name, u.Password, u.Intro, u.Id);
            if(errmsg is not null)
                throw new RqEx(errmsg);
            var user = base.Get(u.Id);
            if (user is null)
                throw new RqEx("找不到指定用户");
            
            bool changedName = user.Name != u.Name;
            bool wantChangeType = user.Type != u.Type;
            if (wantChangeType && !current.IsAdmin)
            {
                //除管理员之外的用户不能编辑Type
                throw new RqEx("无权操作");
            }

            using var t = Context.Database.BeginTransaction();
            try
            {
                if (wantChangeType)
                {
                    userHistoryService.RecordChangeType(u.Id, u.Type, comment);
                }
                    
                mapper.Map(u, user);
                
                //不在mapper处理Password，需另外手动处理
                bool changedPassword = false;
                if (!string.IsNullOrWhiteSpace(u.Password))
                {
                    //若密码不为空，设置新密码
                    var pwdEncrypted = UserPwdEncryption.Encrypt(u.Password);
                    user.Password = pwdEncrypted;
                    changedPassword = true;
                }
                if(changedPassword || changedName)
                    userHistoryService.RecordChangeNameOrPassword(user.Id, comment);
                base.Update(user, true);
                t.Commit();
            }
            catch
            {
                t.Rollback();
                throw;
            }
        }

        public UserDto? GetUserInfo(int id)
        {
            return Viewable
                .Where(x => x.Id == id)
                .ProjectTo<UserDto>(mapper.ConfigurationProvider)
                .FirstOrDefault();
        }

        public void UpdateCurrentUserLastActive()
        {
            var id = httpUserIdProvider.UserIdLazy.Value;
            Existing.Where(x => x.Id == id)
                .ExecuteUpdate(spc => 
                    spc.SetProperty(u=>u.LastActive, DateTime.Now));
        }

        public bool FakeRemoveUser(int id, out string? errmsg)
        {
            var user = base.Get(id);
            if (user is null)
            {
                errmsg = "找不到指定用户";
                return false;
            }
            base.FakeRemove(user, true);
            errmsg = null;
            return true;
        }

        public string GenerateEmailVerificationCode(int userId, string email)
        {
            var user = base.Get(userId);
            if (user is null)
                throw new RqEx("找不到指定用户");
            if (user.EmailBinded)
                throw new RqEx("请联系管理员解绑已有邮箱");
            email = email.ToLowerInvariant();
            if (Existing.Any(x => x.Id != userId && x.Email == email))
                throw new RqEx("该邮箱已被占用");
            var code = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
            user.Email = $"{email}:{code}".GetMD5();
            base.Update(user, true);
            return code;
        }

        public void BindEmailWithCode(int userId, string code, string email)
        {
            var user = base.Get(userId);
            if (user is null)
                throw new RqEx("找不到指定用户");
            email = email.ToLowerInvariant();
            var expectedHash = $"{email}:{code}".GetMD5();
            if (user.Email != expectedHash)
                throw new RqEx("验证码不正确");
            user.Email = email;
            base.Update(user, true);
        }

        /// <summary>
        /// 检查用户属性是否合法
        /// </summary>
        /// <param name="name">用户名</param>
        /// <param name="password">密码原文</param>
        /// <param name="intro">个人简介</param>
        /// <param name="id">用户id（省略代表正在新建用户）</param>
        /// <returns></returns>
        private string? CheckModel(
            string? name, string? password, string? intro, int id = 0)
        {
            if (name is null || name.Length < 1 || name.Length > User.nameMaxLength)
                return "用户名必须在1-16个字符";
            if (id == 0 || !string.IsNullOrWhiteSpace(password))
            {
                //仅在新建用户或要修改密码时检查
                if (password is null || password.Length < 6 || password.Length > 20)
                    return "密码必须在6-20个字符";
            }
            if (Existing.Any(x => x.Name == name && x.Id != id))
                return "该用户名已经被占用";
            if(intro is { } && intro.Length > User.introMaxLength)
                return $"个人简介不能超过{User.introMaxLength}个字符";
            return null;
        }

        private IQueryable<User> FilterByName(IQueryable<User> userQ, string? search)
        {
            if (!string.IsNullOrWhiteSpace(search))
            {
                //sqlite默认大小写敏感，此处强制转为不敏感的（应该不怎么影响性能）
                userQ = Context is AarcSqliteContext
                    ? userQ.Where(x => x.Name.ToLower().Contains(search.ToLower()))
                    : userQ.Where(x => x.Name.Contains(search));
            }
            return userQ;
        }

        public IQueryable<User> FilterByEmailBinded(IQueryable<User> userQ)
        {
            return userQ.Where(x => x.EmailBinded);
        }

        public string? GetMyMaskedEmail()
        {
            var id = httpUserIdProvider.UserIdLazy.Value;
            var user = base.Get(id);
            if (user?.EmailBinded != true)
                return null;
            return EmailMasker.Mask(user.Email);
        }

        public void UpgradeToMember(int userId)
        {
            var user = base.Get(userId);
            if (user is null)
                throw new RqEx("找不到指定用户");
            if (user.Type != UserType.Tourist)
                throw new RqEx("当前用户不是游客身份");
            if (!user.EmailBinded)
                throw new RqEx("请先验证邮箱");
            var hasChangeTypeHistory = Context.UserHistories
                .Any(x => x.TargetUserId == userId && x.UserHistoryType == UserHistoryType.ChangeType);
            if (hasChangeTypeHistory)
                throw new RqEx("请联系管理员");
            user.Type = UserType.Member;
            userHistoryService.RecordChangeType(userId, UserType.Member, $"自助转正：{user.Email}");
            base.Update(user, true);
        }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Password { get; set; }
        public bool EmailValidated { get; set; }
        public UserType Type { get; set; }
        public int AvatarFileId { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Intro { get; set; }
        public string? LastActive { get; set; }
        public int SaveCount { get; set; }
    }
    
    public class UserDtoSimple
    {
        public int Id { get; set; }
        public string? Name { get; set; }
    }

    public class UserDtoProfile : Profile
    {
        public UserDtoProfile()
        {
            CreateMap<User, UserDto>()
                .ForMember(x => x.Password, mem => mem.Ignore())
                .ForMember(x => x.EmailValidated,
                    mem => mem.MapFrom(source => source.Email != null && source.Email.Contains("@")))
                .ForMember(x => x.LastActive,
                    mem => mem.MapFrom(source => source.LastActive.ToString("yyyy-MM-dd HH:mm")));
            CreateMap<UserDto, User>()
                .ForMember(x => x.Password, mem => mem.Ignore());
            CreateMap<User, UserDtoSimple>();
        }
    }
}
