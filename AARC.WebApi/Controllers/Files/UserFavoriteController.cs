using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Repos.Files;
using AARC.WebApi.Services.App.ActionFilters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.WebApi.Controllers.Files
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class UserFavoriteController(
        UserFavoriteRepo userFavoriteRepo
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
}
