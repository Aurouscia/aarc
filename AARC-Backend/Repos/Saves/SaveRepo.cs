using AARC.Models.Db.Context;
using AARC.Models.Db.Context.Specific;
using AARC.Models.DbModels.Enums;
using AARC.Models.DbModels.Identities;
using AARC.Models.DbModels.Saves;
using AARC.Services.App.HttpAuthInfo;
using AARC.Services.App.Mapping;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AARC.Repos.Saves
{
    public class SaveRepo(
        AarcContext context,
        HttpUserIdProvider httpUserIdProvider,
        HttpUserInfoService httpUserInfoService,
        IMapper mapper
        ) : Repo<Save>(context)
    {
        private IQueryable<Save> GetOwnerTypedSaves(bool isTourist = false)
        {
            var userQ = base.Context.Users.Existing();
            if (isTourist)
                userQ = userQ.Where(x => x.Type == UserType.Tourist);
            else
                userQ = userQ.Where(x => x.Type > UserType.Tourist);
            var filteredByUserType =
                from u in userQ
                join s in base.Existing
                on u.Id equals s.OwnerUserId
                select s;
            return filteredByUserType;
        }
        private IQueryable<Save> Viewable
        {
            get
            {
                if (httpUserInfoService.IsAdmin)
                    return Existing; //管理员：可查看所有的
                var res = GetOwnerTypedSaves(isTourist: false);
                if (!httpUserInfoService.IsTourist)
                    return res; //非游客：可查看非游客的
                int uid = httpUserIdProvider.UserIdLazy.Value;
                if(uid > 0)
                {
                    var mine = Existing.Where(x => x.OwnerUserId == uid);
                    res = res.Union(mine); //游客：可查看非游客+自己的
                }
                return res;
            }
        }

        public List<SaveDto> GetNewestSaves(bool forAuditor)
        {
            var res = GetOwnerTypedSaves(isTourist: forAuditor)
                .OrderByDescending(x => x.LastActive)
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .Take(10)
                .ToList();
            return res;
        }
        public List<SaveDto> GetMySaves(int uid = 0)
        {
            bool isSelf = false;
            if (uid == 0) //如果未提供目标uid，则理解为查看自己的
            { 
                uid = httpUserIdProvider.UserIdLazy.Value;
                isSelf = true;
            }
            if (uid == 0) //如果自己的uid依然为0，则要求登录
                throw new RqEx(null, System.Net.HttpStatusCode.Unauthorized);
            
            if(!httpUserInfoService.IsAdmin && !isSelf)
            {
                //如果请求者不是管理员也不是目标本身，则目标必须不能是游客
                UserType ownerType = Context.Users
                    .Where(x => x.Id == uid)
                    .Select(x => x.Type)
                    .FirstOrDefault();
                if (ownerType == UserType.Tourist)
                    throw new RqEx("无权查看");
            }

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
            var q = Viewable;

            //sqlite默认大小写敏感，此处强制转为不敏感的（应该不怎么影响性能）
            if (string.IsNullOrWhiteSpace(search))
                return [];
            if (search != "所有作品")
            {
                if (Context is AarcSqliteContext)
                    q = q.Where(x => x.Name.ToLower().Contains(search.ToLower()));
                else
                    q = q.Where(x => x.Name.Contains(search));
            }
            if (orderby == "sta")
            {
                q = q
                    .OrderByDescending(q => q.StaCount)
                    .ThenByDescending(q => q.LastActive);
            }
            else if (orderby == "line")
            {
                q = q
                    .OrderByDescending(x => x.LineCount)
                    .ThenByDescending(x => x.LastActive);
            }
            else
                q = q
                    .OrderByDescending(x => x.LastActive);
            //分页：并未使用（前端没有做翻页按钮，pageIdx始终为0）
            int pageSize = 50;
            int skip = pageIdx * pageSize;
            int take = pageSize;
            var res = q
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .Skip(skip)
                .Take(take)
                .ToList();
            return res;
        }
        public void Create(SaveDto saveDto)
        {
            ValidateDto(saveDto);
            var uid = httpUserIdProvider.RequireUserId();
            Save save = mapper.Map<Save>(saveDto);
            save.OwnerUserId = uid;
            base.Add(save);
        }
        public void UpdateInfo(SaveDto saveDto)
        {
            ValidateDto(saveDto);
            ValidateAccess(saveDto.Id);
            var updated = Existing
                .Where(x => x.Id == saveDto.Id)
                .ExecuteUpdate(spc => spc
                    .SetProperty(x => x.Name, saveDto.Name)
                    .SetProperty(x => x.Version, saveDto.Version)
                    .SetProperty(x => x.Intro, saveDto.Intro));
            if (updated == 0)
                throw new RqEx("找不到该存档");
        }
        public void UpdateData(
            int id, string data, int staCount, int lineCount)
        {
            ValidateAccess(id);
            var originalLength = Existing
                .Where(x => x.Id == id && x.Data != null)
                .Select(x => x.Data!.Length)
                .FirstOrDefault();
            if (originalLength > 1000)
            {
                if(data.Length < originalLength / 4)
                {
                    throw new RqEx("内容显著减少，拒绝保存");
                }
            }

            var updated = Existing
                .Where(x => x.Id == id)
                .ExecuteUpdate(spc => spc
                    .SetProperty(x => x.LastActive, DateTime.Now)
                    .SetProperty(x => x.Data, data)
                    .SetProperty(x => x.StaCount, staCount)
                    .SetProperty(x => x.LineCount, lineCount));
            if (updated == 0)
                throw new RqEx("找不到该存档");
        }
        public SaveDto? LoadInfo(int id, out string? errmsg)
        {
            var res = Viewable
                .Where(x => x.Id == id)
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .FirstOrDefault();
            if (res is null)
            {
                errmsg = "无法加载存档信息";
                return null;
            }
            errmsg = null;
            return res;
        }
        public string? LoadData(int id, out string? errmsg)
        {
            var res = Viewable
                .Where(x => x.Id == id)
                .Select(x => new { x.Id, x.Data })
                .FirstOrDefault();
            if (res is null)
            {
                errmsg = "无法加载存档数据";
                return null;
            }
            errmsg = null;
            return res.Data;
        }
        public void Remove(int id)
        {
            ValidateAccess(id);
            base.FakeRemove(id);
        }

        private static void ValidateDto(SaveDto saveDto)
        {
            if (string.IsNullOrWhiteSpace(saveDto.Name))
                throw new RqEx("名称不能为空");
            if (saveDto.Name is null || saveDto.Name.Length <= 1 || saveDto.Name.Length > Save.nameMaxLength)
                throw new RqEx($"名称长度必须在2-{Save.nameMaxLength}字符");
            if (saveDto.Version?.Length > Save.versionMaxLength)
                throw new RqEx($"版本长度必须小于{Save.versionMaxLength}字符");
            if (saveDto.Intro?.Length > Save.introMaxLength)
                throw new RqEx($"简介长度必须小于{Save.introMaxLength}字符");
        }
        private void ValidateAccess(int saveId)
        {
            var ownerId = base.WithId(saveId).Select(x => x.OwnerUserId).FirstOrDefault();
            var uinfo = httpUserInfoService.UserInfo.Value;
            if (uinfo.Id == 0)
                throw new RqEx("请登录");
            if (uinfo.Id != ownerId && !uinfo.IsAdmin)
                throw new RqEx("无权编辑本存档");
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
