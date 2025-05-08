using AARC.Models.Dto;
using AARC.Repos.Identities;
using AARC.Repos.Saves;
using AARC.Services.Files;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RqEx = AARC.Utils.Exceptions.RequestInvalidException;

namespace AARC.Controllers.Saves
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class SaveController(
        SaveRepo saveRepo,
        UserRepo userRepo,
        SaveMiniatureFileService saveMiniatureFileService
        ) : Controller
    {
        [AllowAnonymous]
        [HttpGet]
        public List<SaveDto> GetNewestSaves()
        {
            var list = saveRepo.GetNewestSaves();
            var userIds = list.ConvertAll(x => x.OwnerUserId);
            var users = userRepo.Existing
                .Where(x => userIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Name })
                .ToList();
            foreach(var c in list)
            {
                var uname = users.Find(u => u.Id == c.OwnerUserId)?.Name;
                c.OwnerName = uname;
                var url = saveMiniatureFileService.GetUrl(c.Id);
                c.MiniUrl = url;
            }
            return list;
        }
        [HttpGet]
        public List<SaveDto> GetMySaves(int uid)
        {
            var list = saveRepo.GetMySaves(uid);
            foreach (var c in list)
            {
                var url = saveMiniatureFileService.GetUrl(c.Id);
                c.MiniUrl = url;
            }
            return list;
        }
        [HttpPost]
        public bool Add([FromBody]SaveDto saveDto)
        {
            var success = saveRepo.Create(saveDto, out var errmsg);
            userRepo.UpdateCurrentUserLastActive();
            if(success)
                return true;
            throw new RqEx(errmsg);
        }
        [HttpPost]
        public bool UpdateInfo([FromBody]SaveDto saveDto)
        {
            var success = saveRepo.UpdateInfo(saveDto, out var errmsg);
            userRepo.UpdateCurrentUserLastActive();
            if (success)
                return true;
            throw new RqEx(errmsg);
        }
        [HttpPost]
        public bool UpdateData(int id, string data, int staCount, int lineCount)
        {
            var success = saveRepo.UpdateData(id, data, staCount, lineCount, out var errmsg);
            userRepo.UpdateCurrentUserLastActive();
            if (success)
                return true;
            throw new RqEx(errmsg);
        }
        [HttpPost]
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
    }
}
