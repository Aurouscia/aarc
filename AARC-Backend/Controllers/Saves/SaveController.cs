using AARC.Models.DbModels;
using AARC.Models.Dto;
using AARC.Repos.Identities;
using AARC.Repos.Saves;
using AARC.Services.Files;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.Saves
{
    public class SaveController(
        SaveRepo saveRepo,
        UserRepo userRepo,
        SaveMiniatureFileService saveMiniatureFileService
        ) : Controller
    {
        public IActionResult GetNewestSaves()
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
            return this.ApiResp(list);
        }
        [Authorize]
        public IActionResult GetMySaves(int uid)
        {
            var list = saveRepo.GetMySaves(uid);
            foreach (var c in list)
            {
                var url = saveMiniatureFileService.GetUrl(c.Id);
                c.MiniUrl = url;
            }
            return this.ApiResp(list);
        }
        [Authorize]
        public IActionResult Add(SaveDto saveDto)
        {
            var success = saveRepo.Create(saveDto, out var errmsg);
            return this.ApiResp(success, errmsg);
        }
        [Authorize]
        public IActionResult UpdateInfo(SaveDto saveDto)
        {
            var success = saveRepo.UpdateInfo(saveDto, out var errmsg);
            return this.ApiResp(success, errmsg);
        }
        [Authorize]
        public IActionResult UpdateData(int id, string data, int staCount, int lineCount)
        {
            var success = saveRepo.UpdateData(id, data, staCount, lineCount, out var errmsg);
            return this.ApiResp(success, errmsg);
        }
        [Authorize]
        public IActionResult UpdateMiniature(int id, IFormFile mini)
        {
            saveMiniatureFileService.Write(mini.OpenReadStream(), id);
            return this.ApiResp();
        }
        public IActionResult LoadInfo(int id)
        {
            var data = saveRepo.LoadInfo(id, out var errmsg);
            return this.ApiResp(data, errmsg);
        }
        public IActionResult LoadData(int id)
        {
            var data = saveRepo.LoadData(id, out var errmsg);
            return this.ApiResp(data, errmsg);
        }
        [Authorize]
        public IActionResult Remove(int id)
        {
            var success = saveRepo.Remove(id, out string? errmsg);
            return this.ApiResp(success, errmsg);
        }
    }
}
