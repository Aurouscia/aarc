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
using AARC.Services.App.HttpAuthInfo;
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
        HttpUserInfoService httpUserInfoService,
        ILogger<SaveController> logger
        ) : Controller
    {
        [AllowAnonymous]
        [HttpGet]
        public List<SaveDto> GetNewestSaves()
        {
            var list = saveRepo.GetNewestSaves(forAuditor: false);
            EnrichSaveMini(list);
            EnrichUserName(list);
            EnrichPrivilege(list);
            return list;
        }
        [HttpGet]
        [UserCheck(UserType.Admin)]
        public List<SaveDto> GetNewestSavesAudit()
        {
            var list = saveRepo.GetNewestSaves(forAuditor: true);
            EnrichSaveMini(list);
            EnrichUserName(list);
            EnrichPrivilege(list);
            return list;
        }
        [AllowAnonymous]
        [HttpGet]
        public List<SaveDto> GetMySaves(int uid)
        {
            var list = saveRepo.GetMySaves(uid);
            EnrichSaveMini(list);
            EnrichUserName(list, isForMySaves: true);
            EnrichPrivilege(list);
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
            EnrichUserName(list);
            EnrichPrivilege(list);
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
            EnsureOwner(saveDto.Id); // 仅所有者能编辑信息
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
            authGrantCheckService.CheckFor(AuthGrantOn.Save, id, (byte)AuthGrantTypeOfSave.Edit, false);
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
            authGrantCheckService.CheckFor(AuthGrantOn.Save, id, (byte)AuthGrantTypeOfSave.Edit, false);
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
        [RateLimit(5, 5)]
        public SaveDto? LoadStatus(int id)
        {
            var data = saveRepo.LoadStatus(id);
            EnrichPrivilege([data]);
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
            EnsureOwner(id);
            saveRepo.Remove(id);
            userRepo.UpdateCurrentUserLastActive();
            return true;
        }
        [HttpGet]
        public bool HeartbeatRenewal(int id)
        {
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
        private void EnsureOwner(int saveId)
        {
            var ownerId = saveRepo.WithId(saveId).Select(x => x.OwnerUserId).FirstOrDefault();
            var userInfo = httpUserInfoService.UserInfo.Value;
            if (userInfo.Id == 0)
                throw new RqEx("请登录");
            if (userInfo.Id != ownerId && !userInfo.IsAdmin)
                throw new RqEx("非本存档所有者");
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
        private void EnrichUserName(List<SaveDto> saves, bool isForMySaves = false)
        {
            var userIds = new HashSet<int>();
            saves.ForEach(s =>
            {
                userIds.Add(s.OwnerUserId);
                userIds.Add(s.EditingByUserId);
            });
            userIds.Remove(0);
            if (isForMySaves)
            {
                var uid = httpUserInfoService.UserInfo.Value.Id;
                userIds.Remove(uid);
            }
            if (userIds.Count == 0)
                return;
            var users = userRepo.Existing
                .Where(x => userIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Name })
                .ToList();
            foreach (var s in saves)
            {
                var ownerName = users.Find(u => u.Id == s.OwnerUserId)?.Name;
                s.OwnerName = ownerName;
                if (s.EditingByUserId > 0)
                {
                    var editingName = users.Find(u => u.Id == s.EditingByUserId)?.Name;
                    s.EditingByUserName = editingName;
                }
            }
        }
        [NonAction]
        private void EnrichPrivilege(List<SaveDto> saves)
        {
            var ids = saves.ConvertAll(x => x.Id);
            var allowEdit = authGrantCheckService
                .CalculateFor(AuthGrantOn.Save, ids, (byte)AuthGrantTypeOfSave.Edit, false);
            var allowView = authGrantCheckService
                .CalculateFor(AuthGrantOn.Save, ids, (byte)AuthGrantTypeOfSave.View, true);
            for (int i = 0; i < saves.Count; i++)
            {
                saves[i].AllowRequesterEdit = allowEdit.ElementAtOrDefault(i);
                saves[i].AllowRequesterView = allowView.ElementAtOrDefault(i);
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
