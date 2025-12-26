using AARC.Models.DbModels.Identities;
using AARC.Repos.Identities;
using AARC.Repos.Saves;
using AARC.Services.App.ActionFilters;
using AARC.Services.Files;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;
using AARC.Models.DbModels.Enums;
using AARC.Models.DbModels.Enums.AuthGrantTypes;
using AARC.Services.App.AuthGrants;
using AARC.Utils;

namespace AARC.Controllers.Saves
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class SaveController(
        SaveRepo saveRepo,
        UserRepo userRepo,
        SaveMiniatureFileService saveMiniatureFileService,
        SaveBackupFileService saveBackupFileService,
        AuthGrantCheckService authGrantCheckService,
        ILogger<SaveController> logger
        ) : Controller
    {
        [AllowAnonymous]
        [HttpGet]
        public List<SaveDto> GetNewestSaves()
        {
            var list = saveRepo.GetNewestSaves(forAuditor: false);
            EnrichSaveMini(list);
            EnrichSaveOwner(list);
            return list;
        }
        [HttpGet]
        [UserCheck(UserType.Admin)]
        public List<SaveDto> GetNewestSavesAudit()
        {
            var list = saveRepo.GetNewestSaves(forAuditor: true);
            EnrichSaveMini(list);
            EnrichSaveOwner(list);
            return list;
        }
        [AllowAnonymous]
        [HttpGet]
        public List<SaveDto> GetMySaves(int uid)
        {
            var list = saveRepo.GetMySaves(uid);
            EnrichSaveMini(list);
            return list;
        }
        [AllowAnonymous]
        [HttpGet]
        public List<SaveDto> Search(string search, string orderBy, int pageIdx)
        {
            if (string.IsNullOrWhiteSpace(search))
                return [];
            var list = saveRepo.Search(search, orderBy, pageIdx);
            EnrichSaveMini(list);
            EnrichSaveOwner(list);
            return list;
        }
        [HttpPost]
        [UserCheck]
        public bool Add([FromBody]SaveDto saveDto)
        {
            saveRepo.Create(saveDto);
            userRepo.UpdateCurrentUserLastActive();
            return true;
        }
        [HttpPost]
        [UserCheck]
        public bool UpdateInfo([FromBody]SaveDto saveDto)
        {
            saveRepo.UpdateInfo(saveDto);
            userRepo.UpdateCurrentUserLastActive();
            return true;
        }
        [HttpPost]
        [UserCheck]
        public bool UpdateData(
            int id,
            [FromForm]string data,
            [FromForm]int staCount,
            [FromForm]int lineCount)
        {
            return SaveDataToDbAndBackup(id, data, staCount, lineCount);
        }
        [HttpPost]
        [UserCheck]
        public bool UpdateDataCompressed(
            int id,
            IFormFile dataCompressed,
            [FromForm]int staCount,
            [FromForm]int lineCount)
        {
            using var dataStream = dataCompressed.OpenReadStream();
            using var gzipStream = new GZipStream(dataStream, CompressionMode.Decompress);
            using var streamReader = new StreamReader(gzipStream);
            var data = streamReader.ReadToEnd();
            return SaveDataToDbAndBackup(id, data, staCount, lineCount);
        }
        [HttpPost]
        [UserCheck]
        public bool UpdateMiniature(int id, IFormFile mini)
        {
            saveMiniatureFileService.Write(mini.OpenReadStream(), id);
            return true;
        }
        [AllowAnonymous]
        [HttpPost]
        [RateLimit(40, 10)]
        public SaveDto? LoadInfo(int id)
        {
            authGrantCheckService.CheckFor(AuthGrantOn.Save, id, (byte)AuthGrantTypeOfSave.View, true);
            var data = saveRepo.LoadInfo(id);
            return data;
        }
        [AllowAnonymous]
        [HttpPost]
        public string? LoadData(int id, bool forEdit)
        {
            authGrantCheckService.CheckFor(AuthGrantOn.Save, id, (byte)AuthGrantTypeOfSave.View, true);
            if(forEdit)
                authGrantCheckService.CheckFor(AuthGrantOn.Save, id, (byte)AuthGrantTypeOfSave.Edit, false);
            var data = saveRepo.LoadData(id, forEdit);
            return data;
        }
        [HttpDelete]
        public bool Remove(int id)
        {
            saveRepo.Remove(id);
            userRepo.UpdateCurrentUserLastActive();
            return true;
        }
        [HttpGet]
        public bool HeartbeatRenewal(int id)
        {
            authGrantCheckService.CheckFor(AuthGrantOn.Save, id, (byte)AuthGrantTypeOfSave.Edit, false);
            saveRepo.Heartbeat(id, HeartbeatType.Renewal);
            return true;
        }
        [HttpGet]
        public bool HeartbeatRelease(int id)
        {
            saveRepo.HeartbeatRelease(id);
            return true;
        }

        [NonAction]
        private void EnrichSaveMini(List<SaveDto> saves)
        {
            foreach (var s in saves)
            {
                var url = saveMiniatureFileService.GetUrl(s.Id);
                s.MiniUrl = url;
            }
        }
        [NonAction]
        private void EnrichSaveOwner(List<SaveDto> saves)
        {
            var userIds = saves.ConvertAll(x => x.OwnerUserId);
            var users = userRepo.Existing
                .Where(x => userIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Name })
                .ToList();
            foreach (var s in saves)
            {
                var uname = users.Find(u => u.Id == s.OwnerUserId)?.Name;
                s.OwnerName = uname;
            }
        }
        [NonAction]
        private bool SaveDataToDbAndBackup(int id, string data, int staCount, int lineCount)
        {
            saveRepo.UpdateData(id, data, staCount, lineCount);
            userRepo.UpdateCurrentUserLastActive();
            try {
                saveBackupFileService.Write(data, id);
            }
            catch(Exception ex)
            { 
                logger.LogError(ex, "{id}号画布备份失败，长度{length}", id, data.Length);
            } 
            return true;
        }
    }
}
