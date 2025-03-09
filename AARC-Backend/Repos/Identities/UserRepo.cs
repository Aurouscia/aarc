﻿using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using AARC.Models.Dto;
using AARC.Services.App.HttpAuthInfo;
using AARC.Utils;

namespace AARC.Repos.Identities
{
    public class UserRepo(
        AarcContext context,
        HttpUserInfoService httpUserInfoService
        ) : Repo<User>(context)
    {
        public User? MatchUser(string username, string password)
        {
            var pwdEncrypted = UserPwdEncryption.Encrypt(password);
            return Existing
                .Where(x => x.Name == username && x.Password == pwdEncrypted)
                .FirstOrDefault();
        }

        public List<UserDto> IndexUser()
        {
            var myId = httpUserInfoService.UserInfo.Value.Id;
            var list = Existing
                .OrderByDescending(x => x.LastActive)
                .Take(50)
                .SelectToDto()
                .ToList();
            var meIdx = list.FindIndex(x => x.Id == myId);
            if (meIdx == -1)
            {
                var me = Existing
                    .Where(x => x.Id == myId)
                    .SelectToDto()
                    .FirstOrDefault();
                if (me is { })
                    list.Insert(0, me);
            }
            else
            {
                var me = list.ElementAt(meIdx);
                list.RemoveAt(meIdx);
                list.Insert(0, me);
            }
            return list;
        }

        public bool CreateUser(
            string? username, string? password, out string? errmsg, bool createAdmin = false)
        {
            username ??= "";
            password ??= "";
            errmsg = CheckModel(username, password);
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
            errmsg = CheckModel(u.Name, u.Password, u.Id);
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
            user.Name = u.Name ?? "";
            user.Intro = u.Intro;
            user.Type = u.Type;
            user.AvatarFileId = u.AvatarFileId;
            if (u.Password is { })
                user.Password = UserPwdEncryption.Encrypt(u.Password);
            base.Update(user, true);
            return true;
        }

        public UserDto? GetUserInfo(int id)
        {
            return Existing.Where(x => x.Id == id).SelectToDto().FirstOrDefault();
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
        /// <param name="id">用户id（省略代表正在新建用户）</param>
        /// <returns></returns>
        private string? CheckModel(
            string? name, string? password, int id = 0)
        {
            if (name is null || name.Length < 1 || name.Length > 16)
                return "用户名必须在1-16个字符";
            if (id == 0 || password is { })
            {
                //仅在新建用户或要修改密码时检查
                if (password is null || password.Length < 6 || password.Length > 20)
                    return "密码必须在6-20个字符";
            }
            if (Existing.Any(x => x.Name == name && x.Id != id))
                return "该用户名已经被占用";
            return null;
        }
    }

    public static class UserQueryableSelectToDtoExtension
    {
        public static IQueryable<UserDto> SelectToDto(this IQueryable<User> users)
        {
            return users.Select(x => new UserDto
            {
                Id = x.Id,
                Name = x.Name,
                AvatarFileId = x.AvatarFileId,
                Type = x.Type,
                Intro = x.Intro,
            });
        }
    }
}
