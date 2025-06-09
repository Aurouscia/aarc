using AARC.Models.Db.Context;
using AARC.Models.Db.Context.Specific;
using AARC.Models.DbModels.Saves;
using AARC.Services.App.HttpAuthInfo;
using AARC.Services.App.Mapping;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using RqEx = AARC.Utils.Exceptions.RequestInvalidException;

namespace AARC.Repos.Saves
{
    public class SaveRepo(
        AarcContext context,
        HttpUserIdProvider httpUserIdProvider,
        HttpUserInfoService httpUserInfoService,
        IMapper mapper
        ) : Repo<Save>(context)
    {
        public List<SaveDto> GetNewestSaves()
        {
            var res = base.Existing
                .OrderByDescending(x => x.LastActive)
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .Take(8)
                .ToList();
            return res;
        }
        public List<SaveDto> GetMySaves(int uid = 0)
        {
            if (uid == 0)
                uid = httpUserIdProvider.UserIdLazy.Value;
            if (uid == 0)
                throw new RqEx(null, System.Net.HttpStatusCode.Unauthorized);
            var res = base.Existing
                .Where(x => x.OwnerUserId == uid)
                .OrderByDescending(x => x.LastActive)
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .ToList();
            return res;
        }
        public List<SaveDto> Search(
            string search, string orderby, int pageIdx)
        {
            var q = base.Existing;
            //sqlite默认大小写敏感，此处强制转为不敏感的（应该不怎么影响性能）
            if (Context is AarcSqliteContext)
                q = q.Where(x => x.Name.ToLower().Contains(search.ToLower()));
            else
                q = q.Where(x => x.Name.Contains(search));
            if (orderby == "sta")
            {
                q = q
                    .OrderByDescending(q => q.StaCount)
                    .ThenByDescending(q => q.LastActive);
            }
            else
                q = q
                    .OrderByDescending(x => x.LastActive);
            int pageSize = 20;
            int skip = pageIdx * pageSize;
            int take = pageSize;
            var res = q
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .Skip(skip)
                .Take(take)
                .ToList();
            return res;
        }
        public bool Create(SaveDto saveDto, out string? errmsg)
        {
            errmsg = ValidateDto(saveDto);
            if (errmsg is { })
                return false;
            var uid = httpUserIdProvider.RequireUserId();
            Save save = mapper.Map<Save>(saveDto);
            save.OwnerUserId = uid;
            base.Add(save);
            return true;
        }
        public bool UpdateInfo(SaveDto saveDto, out string? errmsg)
        {
            errmsg = ValidateDto(saveDto);
            if (errmsg is { }) return false;
            errmsg = ValidateAccess(saveDto.Id);
            if (errmsg is { }) return false;
            Existing
                .Where(x => x.Id == saveDto.Id)
                .ExecuteUpdate(spc => spc
                    .SetProperty(x => x.Name, saveDto.Name)
                    .SetProperty(x => x.Version, saveDto.Version)
                    .SetProperty(x => x.Intro, saveDto.Intro));
            return true;
        }
        public bool UpdateData(
            int id, string data,
            int staCount, int lineCount, out string? errmsg)
        {
            errmsg = ValidateAccess(id);
            if (errmsg is { }) return false;
            var originalLength = Existing
                .Where(x => x.Id == id && x.Data != null)
                .Select(x => x.Data!.Length)
                .FirstOrDefault();
            if (originalLength > 1000)
            {
                if(data.Length < originalLength / 2)
                {
                    errmsg = "内容显著减少，拒绝保存";
                    return false;
                }
            }

            Existing
            .Where(x => x.Id == id)
            .ExecuteUpdate(spc => spc
                .SetProperty(x => x.LastActive, DateTime.Now)
                .SetProperty(x => x.Data, data)
                .SetProperty(x => x.StaCount, staCount)
                .SetProperty(x => x.LineCount, lineCount));
            errmsg = null;
            return true;
        }
        public SaveDto? LoadInfo(int id, out string? errmsg)
        {
            var res = Existing
                .Where(x => x.Id == id)
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .FirstOrDefault();
            errmsg = null;
            return res;
        }
        public string? LoadData(int id, out string? errmsg)
        {
            var res = Existing
                .Where(x => x.Id == id)
                .Select(x => x.Data)
                .FirstOrDefault();
            errmsg = null;
            return res;
        }
        public bool Remove(int id, out string? errmsg)
        {
            errmsg = ValidateAccess(id);
            if (errmsg is { }) return false;
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
        private string? ValidateAccess(int saveId)
        {
            var ownerId = base.WithId(saveId).Select(x => x.OwnerUserId).FirstOrDefault();
            var uinfo = httpUserInfoService.UserInfo.Value;
            if (uinfo is null)
                return "请登录";
            if (uinfo.Id != ownerId && !uinfo.IsAdmin)
                return "无权编辑本存档";
            return null;
        }
    }

    public class SaveDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? MiniUrl { get; set; }
        public string? Version { get; set; }
        public int OwnerUserId { get; set; }
        public string? OwnerName { get; set; }
        public string? Intro { get; set; }
        public int StaCount { get; set; }
        public int LineCount { get; set; }
        public byte Priority { get; set; }
        public string? LastActive { get; set; }
    }

    public class SaveDtoProfile : Profile
    {
        public SaveDtoProfile()
        {
            CreateMap<SaveDto, Save>()
                .IgnoreLastActive();
            CreateMap<Save, SaveDto>()
                .ForMember(
                    destinationMember: x => x.LastActive,
                    memberOptions: mem => mem.MapFrom(source => source.LastActive.ToString("yyyy-MM-dd HH:mm")));
        }
    }
}
