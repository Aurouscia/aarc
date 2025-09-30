using AARC.Models.DbModels.Identities;
using AARC.Repos.Identities;
using AARC.Repos.Saves;
using AARC.Services.App.ActionFilters;
using AARC.Services.Files;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;

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
        ILogger<SaveController> logger
        ) : Controller
    {
        [AllowAnonymous]
        [HttpGet]
        public List<SaveDto> GetNewestSaves()
        {
            var list = saveRepo.GetNewestSaves();
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
            var success = saveRepo.Create(saveDto, out var errmsg);
            userRepo.UpdateCurrentUserLastActive();
            if(success)
                return true;
            throw new RqEx(errmsg);
        }
        [HttpPost]
        [UserCheck]
        public bool UpdateInfo([FromBody]SaveDto saveDto)
        {
            var success = saveRepo.UpdateInfo(saveDto, out var errmsg);
            userRepo.UpdateCurrentUserLastActive();
            if (success)
                return true;
            throw new RqEx(errmsg);
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
        [HttpGet]
        public SaveDto? LoadInfo(int id)
        {
            var data = saveRepo.LoadInfo(id, out var errmsg);
            if (errmsg is not null)
                throw new RqEx(errmsg);
            return data;
        }
        [AllowAnonymous]
        [HttpGet]
        public string? LoadData(int id)
        {
            var data = saveRepo.LoadData(id, out var errmsg);
            if (errmsg is not null)
                throw new RqEx(errmsg);
            return data;
        }
        [HttpDelete]
        public bool Remove(int id)
        {
            var success = saveRepo.Remove(id, out string? errmsg);
            userRepo.UpdateCurrentUserLastActive();
            if (success)
                return true;
            throw new RqEx(errmsg);
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
            var success = saveRepo.UpdateData(id, data, staCount, lineCount, out var errmsg);
            userRepo.UpdateCurrentUserLastActive();
            if (success)
            {
                try
                {
                    saveBackupFileService.Write(data, id);
                }
                catch(Exception ex)
                {
                    logger.LogError(ex, "{id}号画布备份失败，长度{length}", id, data.Length);
                }
                return true;
            }
            throw new RqEx(errmsg);
        }
    }
}
