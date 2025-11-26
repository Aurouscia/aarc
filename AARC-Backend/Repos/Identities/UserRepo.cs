using AARC.Models.Db.Context;
using AARC.Models.Db.Context.Specific;
using AARC.Models.DbModels.Enums;
using AARC.Models.DbModels.Identities;
using AARC.Services.App.HttpAuthInfo;
using AARC.Utils;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AARC.Repos.Identities
{
    public class UserRepo(
        AarcContext context,
        HttpUserInfoService httpUserInfoService,
        HttpUserIdProvider httpUserIdProvider,
        IMapper mapper
        ) : Repo<User>(context)
    {
        public IQueryable<User> Viewable
        {
            get
            {
                if (httpUserInfoService.IsAdmin)
                    return Existing;
                var res = Existing.Where(x => x.Type > UserType.Tourist);
                if (httpUserInfoService.IsTourist)
                {
                    var myId = httpUserIdProvider.UserIdLazy.Value;
                    var me = Existing.Where(x => x.Id == myId);
                    res = res.Union(me);
                }
                return res;
            }
        }

        public User? MatchUser(string username, string password)
        {
            var pwdEncrypted = UserPwdEncryption.Encrypt(password);
            return Existing
                .FirstOrDefault(x => x.Name == username && x.Password == pwdEncrypted);
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
                var userCountList = (
                    from u in userQ
                    from uc in userIdCountQ
                    where uc.UserId == u.Id
                    select new
                    {
                        User = mapper.Map<UserDto>(u),
                        uc.Count
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(takeCount)
                    .ToList();
                userCountList.ForEach(x => x.User.SaveCount = x.Count);
                finalList = userCountList.ConvertAll(x => x.User);
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
                    if (me is { })
                    {
                        if (orderbySave)
                            me.SaveCount = saveQ.Where(x => x.OwnerUserId == myId).Count();
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
            var userQ = FilterByName(Viewable, search);
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
            base.Add(u);
            return true;
        }

        public bool UpdateUser(UserDto u, out string? errmsg)
        {
            if (u.Id == 0)
            {
                errmsg = "数据异常";
                return false;
            }
            var current = httpUserInfoService.UserInfo.Value;
            if (current.Id != u.Id && !current.IsAdmin)
            {
                //除管理员之外的用户只能update自己的信息
                errmsg = "无权操作";
                return false;
            }
            errmsg = CheckModel(u.Name, u.Password, u.Intro, u.Id);
            if (errmsg is { })
                return false;
            var user = base.Get(u.Id);
            if (user is null)
            {
                errmsg = "找不到指定用户";
                return false;
            }
            bool wantChangeType = user.Type != u.Type;
            if (wantChangeType && !current.IsAdmin)
            {
                //除管理员之外的用户不能编辑Type
                errmsg = "无权操作";
                return false;
            }
            mapper.Map(u, user);
            //不在mapper处理Password，需另外手动处理
            if (!string.IsNullOrWhiteSpace(u.Password))
            {
                //若密码不为空，设置新密码
                var pwdEncrypted = UserPwdEncryption.Encrypt(u.Password);
                user.Password = pwdEncrypted;
            }
            base.Update(user, true);
            return true;
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
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Password { get; set; }
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
                .ForMember(x => x.LastActive,
                    mem => mem.MapFrom(source => source.LastActive.ToString("yyyy-MM-dd HH:mm")));
            CreateMap<UserDto, User>()
                .ForMember(x => x.Password, mem => mem.Ignore());
            CreateMap<User, UserDtoSimple>();
        }
    }
}
