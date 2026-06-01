using AARC.WebApi.Repos.Saves;
using AARC.WebApi.Services.App.ActionFilters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.WebApi.Controllers.Saves
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class SaveFolderController(
        SaveFolderRepo saveFolderRepo,
        SaveFolderRelationRepo saveFolderRelationRepo
        ) : Controller
    {
        [HttpGet]
        public List<SaveFolderDto> GetMyFolders(int parentFolderId = 0, string orderBy = "custom")
        {
            return saveFolderRepo.GetMyFolders(parentFolderId == 0 ? null : parentFolderId, orderBy);
        }

        [HttpGet]
        public List<SaveFolderDto> GetAllMyFolders()
        {
            return saveFolderRepo.GetAllMyFolders();
        }

        [HttpPost]
        [UserCheck]
        public bool Create([FromBody] SaveFolderDto dto)
        {
            saveFolderRepo.Create(dto);
            return true;
        }

        [HttpPost]
        [UserCheck]
        public bool Update([FromBody] SaveFolderDto dto)
        {
            saveFolderRepo.Update(dto);
            return true;
        }

        [HttpPost]
        [UserCheck]
        public bool Move(int id, int targetParentFolderId)
        {
            saveFolderRepo.Move(id, targetParentFolderId);
            return true;
        }

        [HttpPost]
        [UserCheck]
        public bool Rearrange([FromBody] List<int> order)
        {
            saveFolderRepo.Rearrange(order);
            return true;
        }

        [HttpDelete]
        [UserCheck]
        public bool Remove(int id)
        {
            saveFolderRepo.Remove(id);
            return true;
        }

        [HttpPost]
        [UserCheck]
        public bool AddSaveToFolder(int saveId, int folderId)
        {
            saveFolderRelationRepo.AddToFolder(saveId, folderId);
            return true;
        }

        [HttpPost]
        [UserCheck]
        public bool RemoveSaveFromFolder(int saveId, int folderId)
        {
            saveFolderRelationRepo.RemoveFromFolder(saveId, folderId);
            return true;
        }

        [HttpPost]
        [UserCheck]
        public bool MoveSaveToFolder(int saveId, int fromFolderId, int toFolderId)
        {
            saveFolderRelationRepo.MoveToFolder(saveId, fromFolderId, toFolderId);
            return true;
        }

        [HttpPost]
        [UserCheck]
        public bool RearrangeSavesInFolder(int folderId, [FromBody] List<int> saveOrder)
        {
            saveFolderRelationRepo.RearrangeInFolder(folderId, saveOrder);
            return true;
        }

        [HttpGet]
        public List<int> GetSaveIdsInFolder(int folderId)
        {
            return saveFolderRelationRepo.GetSaveIdsInFolder(folderId);
        }

        [HttpGet]
        public List<int> GetFolderIdsOfSave(int saveId)
        {
            return saveFolderRelationRepo.GetFolderIdsOfSave(saveId);
        }

        [HttpGet]
        public List<SaveFolderPathItem> GetPath(int folderId)
        {
            return saveFolderRepo.GetPath(folderId);
        }

        [HttpGet]
        public SaveFolderDto? GetFolderInfo(int folderId)
        {
            return saveFolderRepo.GetFolderInfo(folderId);
        }

        [HttpGet]
        public List<SaveDto> GetSavesInFolder(int folderId, string orderBy = "custom")
        {
            return saveFolderRelationRepo.GetSavesInFolder(folderId, orderBy);
        }
    }
}
