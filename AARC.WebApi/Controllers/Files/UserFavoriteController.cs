using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Repos.Files;
using AARC.WebApi.Repos.Saves;
using AARC.WebApi.Services.App.ActionFilters;
using AARC.WebApi.Services.Saves;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.WebApi.Controllers.Files
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class UserFavoriteController(
        UserFavoriteRepo userFavoriteRepo,
        SaveRepo saveRepo,
        SaveDtoEnrichService saveDtoEnrichService
        ) : Controller
    {
        [HttpPost]
        [UserCheck]
        public bool Add(
            [FromForm] UserFavoriteType type,
            [FromForm] int objectId,
            [FromForm] string? group = null)
        {
            userFavoriteRepo.Add(type, objectId, group);
            return true;
        }

        [HttpDelete]
        [UserCheck]
        public bool Remove([FromForm] int id)
        {
            userFavoriteRepo.Remove(id);
            return true;
        }

        [HttpGet]
        public UserFavoriteStatusDto IsFavorited(UserFavoriteType type, int objectId)
        {
            var model = userFavoriteRepo.GetByTypeAndObjectId(type, objectId);
            return new UserFavoriteStatusDto
            {
                Id = model?.Id ?? 0,
                IsFavorited = model is not null
            };
        }

        [HttpGet]
        public List<GroupWithStatus> Groups(UserFavoriteType type, int objectId)
        {
            return userFavoriteRepo.GetGroups(type, objectId);
        }

        [HttpGet]
        [UserCheck]
        public UserFavoriteSavesDto GetSaves(
            UserFavoriteType type,
            string? group = null,
            int skip = 0,
            int take = 30)
        {
            if (take > 30)
                take = 30;
            var page = userFavoriteRepo.GetSaveIds(type, group, skip, take);
            var list = saveRepo.GetByIds(page.Ids);
            saveDtoEnrichService.EnrichSaveMini(list);
            saveDtoEnrichService.EnrichUserName(list);
            saveDtoEnrichService.EnrichPrivilege(list, true);
            saveDtoEnrichService.EnrichComment(list);
            saveDtoEnrichService.EnrichFavStatus(list);
            return new UserFavoriteSavesDto
            {
                Saves = list,
                HasMore = page.HasMore
            };
        }

        [HttpPost]
        [UserCheck]
        public bool SetGroups(
            [FromForm] UserFavoriteType type,
            [FromForm] int objectId,
            [FromForm] List<string> groups)
        {
            return userFavoriteRepo.SetGroups(type, objectId, groups);
        }

        [HttpPost]
        [UserCheck]
        public bool RenameGroup(
            [FromForm] UserFavoriteType type,
            [FromForm] string oldName,
            [FromForm] string newName)
        {
            userFavoriteRepo.RenameGroup(type, oldName, newName);
            return true;
        }

        [HttpDelete]
        [UserCheck]
        public bool DeleteGroup(
            [FromForm] UserFavoriteType type,
            [FromForm] string groupName)
        {
            userFavoriteRepo.DeleteGroup(type, groupName);
            return true;
        }
    }

    public class UserFavoriteStatusDto
    {
        public int Id { get; set; }
        public bool IsFavorited { get; set; }
    }

    public class UserFavoriteSavesDto
    {
        public List<SaveDto> Saves { get; set; } = [];
        public bool HasMore { get; set; }
    }
}
