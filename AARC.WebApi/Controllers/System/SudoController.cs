using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Enums.AuthGrantTypes;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Repos;
using AARC.WebApi.Repos.Identities;
using AARC.WebApi.Services.App.Config;
using AARC.WebApi.Services.Files;
using AARC.WebApi.Services.Identities;
using AARC.WebApi.Services.Saves;
using AARC.WebApi.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Controllers.System
{
    [ApiController]
    [Route("sudo/[action]")]
    public class SudoController(
        UserRepo userRepo,
        SaveBackupFileService saveBackupFileService,
        MasterKeyChecker masterKeyChecker,
        AarcContext context,
        NewestSavesCacheService newestSavesCache,
        UserHistoryService userHistoryService
        ) : Controller
    {
        [HttpPost]
        public string InitAdmin(
            [FromForm] string? userName,
            [FromForm] string? masterKey)
        {
            masterKeyChecker.Check(masterKey);
            var initialPwd = new Random().Next(100000, 999999).ToString();
            var success = userRepo.CreateUser(userName, initialPwd, out var errmsg, true);
            if (success)
                return $"创建成功，密码为 {initialPwd} ，立即登录并更改";
            else
                return errmsg ?? "未知错误";
        }

        [HttpPost]
        public string InitUsersFromCsv(
            [FromForm] string? csv,
            [FromForm] string masterKey)
        {
            masterKeyChecker.Check(masterKey);
            if (string.IsNullOrWhiteSpace(csv))
                return "csv 内容为空";

            var rows = new List<(string name, string password, UserType type)>();
            var lines = csv.ReplaceLineEndings().Split(Environment.NewLine);
            foreach (var rawLine in lines)
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line))
                    continue;
                var cols = line.Split(',', StringSplitOptions.TrimEntries);
                if (cols.Length != 3)
                    return $"行格式错误（需要恰好三列）：{line}";
                var name = cols[0];
                var password = cols[1];
                UserType type;
                if (byte.TryParse(cols[2], out var typeValue))
                {
                    if (!Enum.IsDefined(typeof(UserType), typeValue))
                        return $"用户类型数值错误：{cols[2]}";
                    type = (UserType)typeValue;
                }
                else if (!Enum.TryParse<UserType>(cols[2], true, out type))
                {
                    return $"用户类型错误：{cols[2]}";
                }
                if (name.Length < 1 || name.Length > Models.DbModels.Identities.User.nameMaxLength)
                    return $"用户名长度错误：{name}";
                if (password.Length < 6 || password.Length > 20)
                    return $"密码长度错误：{name}";
                rows.Add((name, password, type));
            }

            if (rows.Count == 0)
                return "没有有效数据";

            var duplicatedInCsv = rows
                .GroupBy(x => x.name)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();
            if (duplicatedInCsv.Count > 0)
                return $"csv 内用户名重复：{string.Join(", ", duplicatedInCsv)}";

            var names = rows.Select(x => x.name).ToList();
            var existingNames = context.Users
                .Existing()
                .Where(x => names.Contains(x.Name))
                .Select(x => x.Name)
                .ToList();
            if (existingNames.Count > 0)
                return $"以下用户名已存在：{string.Join(", ", existingNames)}";

            using var t = context.Database.BeginTransaction();
            try
            {
                foreach (var row in rows)
                {
                    var user = new User
                    {
                        Name = row.name,
                        Password = UserPwdEncryption.Encrypt(row.password),
                        Type = row.type
                    };
                    context.Users.Add(user);
                    context.SaveChanges();
                    userHistoryService.RecordRegister(user.Id);
                }
                context.SaveChanges();
                t.Commit();
                return $"成功初始化 {rows.Count} 个用户";
            }
            catch
            {
                t.Rollback();
                throw;
            }
        }
        [HttpPost]
        public string RunBackupCleanup([FromForm]string masterKey)
        {
            masterKeyChecker.Check(masterKey);
            int deleteCount = saveBackupFileService.CleanupForAll();
            return $"已清理 {deleteCount} 个文件";
        }

        [HttpPost]
        public string MigrateDb([FromForm] string masterKey)
        {
            masterKeyChecker.Check(masterKey);
            context.Database.Migrate();
            return "已更新数据库到最新迁移";
        }

        [HttpPost]
        public string RemoveAllPublicSaveEditAuthGrants([FromForm] string masterKey)
        {
            masterKeyChecker.Check(masterKey);
            var deleted = context.AuthGrants
                .Where(x => x.On == AuthGrantOn.Save)
                .Where(x => x.Type == (byte)AuthGrantTypeOfSave.Edit)
                .Where(x => x.Flag == true)
                .Where(x => x.To == AuthGrantTo.All)
                .ExecuteDelete();
            return $"已删除 {deleted} 条“允许所有人编辑”授权";
        }

        [HttpPost]
        public string SetUserAsAdmin([FromForm] int userId, [FromForm] string masterKey)
        {
            masterKeyChecker.Check(masterKey);
            var user = context.Users.Where(x => !x.Deleted).FirstOrDefault(x => x.Id == userId);
            if (user is null)
                return "找不到指定用户";
            var oldType = user.Type;
            user.Type = UserType.Admin;
            user.LastActive = DateTime.Now;
            context.SaveChanges();
            newestSavesCache.MigrateForUser(userId, oldType, UserType.Admin);
            return $"已将用户 {user.Name}（{user.Id}）设置为管理员";
        }
    }
}
