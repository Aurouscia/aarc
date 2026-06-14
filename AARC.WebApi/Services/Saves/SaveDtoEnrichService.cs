using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Enums.AuthGrantTypes;
using AARC.WebApi.Models.DbModels.Identities;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.WebApi.Repos;
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
        HttpUserInfoService httpUserInfoService,
        SaveCommentRepo saveCommentRepo
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

        public void EnrichComment(List<SaveDto> saves)
        {
            var ids = saves.ConvertAll(x => x.Id);
            if (ids.Count == 0)
                return;
            var comments = saveCommentRepo.ExistingAndValid
                .Where(x => ids.Contains(x.SaveId))
                .Select(x => new { x.SaveId, x.Type, x.Content, x.Created, x.OwnerUserId })
                .ToList();
            var userIds = comments.Select(x => x.OwnerUserId).Distinct().ToHashSet();
            userIds.Remove(0);
            var users = userIds.Count > 0
                ? userRepo.Existing
                    .Where(x => userIds.Contains(x.Id))
                    .Select(x => new { x.Id, x.Name })
                    .ToDictionary(x => x.Id, x => x.Name)
                : [];
            var grouped = comments.GroupBy(x => x.SaveId).ToDictionary(
                g => g.Key,
                g => new
                {
                    CommentCount = g.Count(x => x.Type == SaveCommentType.Regular),
                    LatestWarn = g.Where(x => x.Type == SaveCommentType.Warn)
                        .OrderByDescending(x => x.Created)
                        .Select(x => new { x.Content, x.Created, x.OwnerUserId })
                        .FirstOrDefault(),
                    LatestRule = g.Where(x => x.Type == SaveCommentType.Rule)
                        .OrderByDescending(x => x.Created)
                        .Select(x => new { x.Content, x.Created })
                        .FirstOrDefault()
                });
            foreach (var s in saves)
            {
                if (grouped.TryGetValue(s.Id, out var stats))
                {
                    s.CommentCount = stats.CommentCount;
                    if (stats.LatestWarn != null)
                    {
                        s.LatestWarnContent = stats.LatestWarn.Content;
                        s.LatestWarnCreated = stats.LatestWarn.Created.ToString("yyyy-MM-dd HH:mm");
                        s.LatestWarnBy = users.TryGetValue(stats.LatestWarn.OwnerUserId, out var warnName)
                            ? warnName : null;
                    }
                    if (stats.LatestRule != null)
                    {
                        s.LatestRuleContent = stats.LatestRule.Content;
                        s.LatestRuleCreated = stats.LatestRule.Created.ToString("yyyy-MM-dd HH:mm");
                    }
                }
            }
        }
    }
}
