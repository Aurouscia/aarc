using AARC.Repos.Identities;
using AARC.Services.App.Config;
using AARC.Services.Files;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.System
{
    [ApiController]
    [Route("sudo/[action]")]
    public class SudoController(
        UserRepo userRepo,
        SaveBackupFileService saveBackupFileService,
        MasterKeyChecker masterKeyChecker
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
    }
}
