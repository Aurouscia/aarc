﻿using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using AARC.Models.Dto;
using AARC.Services.App.HttpAuthInfo;
using Microsoft.EntityFrameworkCore;

namespace AARC.Repos.Saves
{
    public class SaveRepo(
        AarcContext context,
        HttpUserIdProvider httpUserIdProvider)
        : Repo<Save>(context)
    {
        public List<SaveDto> GetMySaves()
        {
            var uid = httpUserIdProvider.RequireUserId();
            var res = base.Existing
                .Where(x => x.OwnerUserId == uid)
                .OrderBy(x => x.LastActive)
                .Select(x => new SaveDto(x.Id, x.Name, x.Version, x.OwnerUserId, x.Intro))
                .ToList();
            return res;
        }
        public bool Create(SaveDto saveDto, out string? errmsg)
        {
            errmsg = ValidateDto(saveDto);
            if (errmsg is { })
                return false;
            var uid = httpUserIdProvider.RequireUserId();
            Save save = new()
            {
                Name = saveDto.Name ?? "",
                Version = saveDto.Version,
                OwnerUserId = uid,
                Intro = saveDto.Intro,
            };
            base.Add(save);
            return true;
        }
        public bool UpdateInfo(SaveDto saveDto, out string? errmsg)
        {
            errmsg = ValidateDto(saveDto);
            if (errmsg is { })
                return false;
            Existing
                .Where(x => x.Id == saveDto.Id)
                .ExecuteUpdate(spc => spc
                    .SetProperty(x => x.Name, saveDto.Name)
                    .SetProperty(x => x.Version, saveDto.Version)
                    .SetProperty(x => x.Intro, saveDto.Intro));
            return true;
        }
        public bool UpdateData(int id, string data, out string? errmsg)
        {
            Existing
                .Where(x => x.Id == id)
                .ExecuteUpdate(spc => spc
                    .SetProperty(x=>x.LastActive, DateTime.Now)
                    .SetProperty(x => x.Data, data));
            errmsg = null;
            return true;
        }
        public bool Remove(int id, out string? errmsg)
        {
            base.FakeRemove(id);
            errmsg = null;
            return true;
        }

        private static string? ValidateDto(SaveDto saveDto)
        {
            if (string.IsNullOrWhiteSpace(saveDto.Name))
                return "名称不能为空";
            if (saveDto.Name.Length < 1 || saveDto.Name.Length > Save.nameMaxLength)
                return $"名称长度必须在2-{Save.nameMaxLength}字符";
            if (saveDto.Version?.Length > Save.versionMaxLength)
                return $"版本长度必须小于{Save.versionMaxLength}字符";
            if (saveDto.Intro?.Length > Save.introMaxLength)
                return $"简介长度必须小于{Save.introMaxLength}字符";
            return null;
        }
    }
}
