using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using AARC.Models.Dto;
using AARC.Services.App.HttpAuthInfo;
using AARC.Services.App.Mapping;
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
        public User? MatchUser(string username, string password)
        {
            var pwdEncrypted = UserPwdEncryption.Encrypt(password);
            return Existing
                .Where(x => x.Name == username && x.Password == pwdEncrypted)
                .FirstOrDefault();
        }

        public List<UserDto> IndexUser(string? search, string? orderby)
        {
            int takeCount = 50;
            var myId = httpUserInfoService.UserInfo.Value.Id;
            var userQ = string.IsNullOrWhiteSpace(search)
                ? Existing
                : Existing.Where(x => x.Name.Contains(search));
            var orderbySave = orderby == "save";
            var validSavesOwnerIds =
                orderbySave ? 
                    base.Context.Saves
                    .Existing()
                    .Where(x => x.StaCount > 0)
                    .GroupBy(x => x.OwnerUserId)
                    .Select(x => new {
                        UserId = x.Key,
                        Count = x.Count()
                    })
                    .ToList()
                : [];
            int getCountOfUser(int uid)
            {
                return validSavesOwnerIds
                    .Where(x => x.UserId == uid)
                    .Select(x => x.Count)
                    .FirstOrDefault();
            }

            List<UserDto> finalList;
            if (orderbySave)
            {
                var uids = validSavesOwnerIds
                    .OrderByDescending(x => x.Count)
                    .Take(takeCount)
                    .Select(x => x.UserId)
                    .ToList();
                finalList = userQ
                    .Where(x => uids.Contains(x.Id))
                    .ProjectTo<UserDto>(mapper.ConfigurationProvider)
                    .ToList();
                finalList.ForEach(u =>
                {
                    u.SaveCount = getCountOfUser(u.Id);
                });
                finalList = finalList
                    .OrderByDescending(x => x.SaveCount)
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

            if (myId > 0)
            {
                var meIdx = finalList.FindIndex(x => x.Id == myId);
                if (meIdx == -1)
                {
                    var me = Existing
                        .Where(x => x.Id == myId)
                        .ProjectTo<UserDto>(mapper.ConfigurationProvider)
                        .FirstOrDefault();
                    var mySaveCount = getCountOfUser(myId);
                    if (me is { })
                    {
                        me.SaveCount = mySaveCount;
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
                Type = createAdmin ? UserType.Admin : UserType.Member
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
            if (current.Id != u.Id && current.Type < UserType.Admin)
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
            if (wantChangeType && current.Type < UserType.Admin)
            {
                //除管理员之外的用户不能编辑Type
                errmsg = "无权操作";
                return false;
            }
            mapper.Map(u, user);
            base.Update(user, true);
            return true;
        }

        public UserDto? GetUserInfo(int id)
        {
            return Existing
                .Where(x => x.Id == id)
                .ProjectTo<UserDto>(mapper.ConfigurationProvider)
                .FirstOrDefault();
        }

        public void UpdateCurrentUserLastActive()
        {
            var id = httpUserIdProvider.UserId.Value;
            Existing.Where(x => x.Id == id)
                .ExecuteUpdate(spc => 
                    spc.SetProperty(u=>u.LastActive, DateTime.Now));
        }

        public bool DeleteUser(int id, out string? errmsg)
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
                .IgnoreLastActive()
                .ForMember(x => x.Password,
                    mem => mem.MapFrom(source => UserPwdEncryption.Encrypt(source.Password ?? "")));
        }
    }
}
