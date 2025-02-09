using AARC.Models.Dto;
using AARC.Repos.Saves;
using AARC.Services.Files;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.Saves
{
    [Authorize]
    public class SaveController(
        SaveRepo saveRepo,
        SaveMiniatureFileService saveMiniatureFileService
        ) : Controller
    {
        public IActionResult GetMySaves()
        {
            var list = saveRepo.GetMySaves();
            return this.ApiResp(list);
        }
        public IActionResult Add(SaveDto saveDto)
        {
            var success = saveRepo.Create(saveDto, out var errmsg);
            return this.ApiResp(success, errmsg);
        }
        public IActionResult UpdateInfo(SaveDto saveDto)
        {
            var success = saveRepo.UpdateInfo(saveDto, out var errmsg);
            return this.ApiResp(success, errmsg);
        }
        public IActionResult UpdateData(int id, string data, int staCount, int lineCount)
        {
            var success = saveRepo.UpdateData(id, data, staCount, lineCount, out var errmsg);
            return this.ApiResp(success, errmsg);
        }
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
        public IActionResult Remove(int id)
        {
            var success = saveRepo.Remove(id, out string? errmsg);
            return this.ApiResp(success, errmsg);
        }
    }
}
