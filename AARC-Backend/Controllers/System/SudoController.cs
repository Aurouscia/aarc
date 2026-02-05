using AARC.Models.Db.Context;
using AARC.Models.DbModels.Enums.AuthGrantTypes;
using AARC.Models.DbModels.Identities;
using AARC.Repos.Identities;
using AARC.Services.App.Config;
using AARC.Services.Files;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AARC.Controllers.System
{
    [ApiController]
    [Route("sudo/[action]")]
    public class SudoController(
        UserRepo userRepo,
        SaveBackupFileService saveBackupFileService,
        MasterKeyChecker masterKeyChecker,
        AarcContext context
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
    }
}
