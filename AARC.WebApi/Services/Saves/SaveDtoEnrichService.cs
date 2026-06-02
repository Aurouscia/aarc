using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Enums.AuthGrantTypes;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.WebApi.Repos.Identities;
using AARC.WebApi.Repos.Saves;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.Files;
using AARC.WebApi.Services.Identities.AuthGrants;

namespace AARC.WebApi.Services.Saves
{
    public class SaveDtoEnrichService(
        SaveMiniatureFileService saveMiniatureFileService,
        UserRepo userRepo,
        AuthGrantCheckService authGrantCheckService,
        HttpUserInfoService httpUserInfoService
        )
    {
        public void EnrichSaveMini(List<SaveDto> saves)
        {
            foreach (var s in saves)
            {
                var url = saveMiniatureFileService.GetUrl(s.Id);
                s.MiniUrl = url;
            }
        }

        public void EnrichUserName(List<SaveDto> saves, bool isForMySaves = false)
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

        public void EnrichPrivilege(List<SaveDto> saves, bool needFork = false)
        {
            var ids = saves.ConvertAll(x => x.Id);
            var allowEdit = authGrantCheckService
                .CalculateFor(AuthGrantOn.Save, ids, (byte)AuthGrantTypeOfSave.Edit, false);
            var allowView = authGrantCheckService
                .CalculateFor(AuthGrantOn.Save, ids, (byte)AuthGrantTypeOfSave.View, true);
            var allowFork = needFork ? authGrantCheckService
                .CalculateFor(AuthGrantOn.Save, ids, (byte)AuthGrantTypeOfSave.Fork, false) : [];
            for (int i = 0; i < saves.Count; i++)
            {
                saves[i].AllowRequesterEdit = allowEdit.ElementAtOrDefault(i);
                saves[i].AllowRequesterView = allowView.ElementAtOrDefault(i);
                saves[i].AllowRequesterFork = allowFork.ElementAtOrDefault(i);
            }
        }
    }
}
