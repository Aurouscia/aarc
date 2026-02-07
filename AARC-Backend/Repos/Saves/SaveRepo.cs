using AARC.Models.Db.Context;
using AARC.Models.Db.Context.Specific;
using AARC.Models.DbModels.Enums;
using AARC.Models.DbModels.Identities;
using AARC.Models.DbModels.Saves;
using AARC.Services.App.HttpAuthInfo;
using AARC.Services.App.Mapping;
using AARC.Services.Saves;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace AARC.Repos.Saves
{
    public class SaveRepo(
        AarcContext context,
        SaveDiffService saveDiffService,
        HttpUserIdProvider httpUserIdProvider,
        HttpUserInfoService httpUserInfoService,
        IMapper mapper,
        ILogger<SaveRepo> logger
        ) : Repo<Save>(context)
    {
        // 心跳有效期10分钟，超过10分钟允许其他人进来
        private static TimeSpan HeartbeatValidSpan => TimeSpan.FromMinutes(10);
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
            EnrichEditingBy(res);
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
            EnrichEditingBy(res);
            return res;
        }
        public List<SaveDto> Search(string search, string orderby, int pageIdx)
        {
            var q = Viewable;

            //sqlite默认大小写敏感，此处强制转为不敏感的（应该不怎么影响性能）
            if (string.IsNullOrWhiteSpace(search))
                return [];
            // 检查是否为id搜索格式（id:... 或 id：...，不区分大小写，冒号全半角都行）
            var idMatch = System.Text.RegularExpressions.Regex.Match(search, @"^id\s*[:：]\s*(\d+)$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (idMatch.Success)
            {
                int id = int.Parse(idMatch.Groups[1].Value);
                q = base.WithId(id);
            }
            else if (search != "所有作品")
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
            EnrichEditingBy(res);
            return res;
        }
        public void Create(SaveDto saveDto)
        {
            ValidateDto(saveDto);
            var uid = httpUserIdProvider.RequireUserId();
            
            // 检查用户是否有过多的空存档
            var emptySavesCount = Existing
                .Count(x => x.OwnerUserId == uid && (x.Data == null || x.Data.Length == 0));
            if (emptySavesCount >= 5)
                throw new RqEx("空存档不得超过5个");
            
            Save save = mapper.Map<Save>(saveDto);
            save.OwnerUserId = uid;
            base.Add(save);
        }
        public void UpdateInfo(SaveDto saveDto)
        {
            ValidateDto(saveDto);
            var updated = Existing
                .Where(x => x.Id == saveDto.Id)
                .ExecuteUpdate(spc => spc
                    .SetProperty(x => x.Name, saveDto.Name)
                    .SetProperty(x => x.Version, saveDto.Version)
                    .SetProperty(x => x.Intro, saveDto.Intro));
            if (updated == 0)
                throw new RqEx("找不到该存档");
        }
        public void UpdateData(int id, string data, int staCount, int lineCount, bool enforce)
        {
            if(enforce) // 强制：使用初始化心跳，只需要“当前没有人在编辑”即可（用于导入工程文件）
                Heartbeat(id, HeartbeatType.Initialization, true); 
            else // 非强制：使用续约心跳，需要“上次心跳用户是自己”才行（用于编辑器内保存）
                Heartbeat(id, HeartbeatType.Renewal);
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
        public void UpdateDataAndDiff(int id, string data, int staCount, int lineCount)
        {
            var uid = httpUserIdProvider.RequireUserId();
            Heartbeat(id, HeartbeatType.Renewal);
            using var t = Context.Database.BeginTransaction();
            try
            {
                var model = Get(id) ?? throw new RqEx("找不到指定存档");
                var dataOriginal = model.Data ?? "{}";
                saveDiffService.CreateDiff(dataOriginal, data, id, uid, false);
                model.Data = data;
                model.StaCount = staCount;
                model.LineCount = lineCount;
                Update(model, true, false);
                Context.SaveChanges();
                t.Commit();
            }
            catch(Exception ex)
            {
                logger.LogError(ex, "更新存档数据失败");
                t.Rollback();
                throw new RqEx("保存失败");
            }
        }
        public SaveDto LoadInfo(int id)
        {
            var res = Viewable
                .Where(x => x.Id == id)
                .ProjectTo<SaveDto>(mapper.ConfigurationProvider)
                .FirstOrDefault();
            if (res is null)
                throw new RqEx("无法加载存档信息");
            return res;
        }
        public SaveDto LoadStatus(int id)
        {
            var res = Viewable
                .Where(x => x.Id == id)
                .Select(x => new SaveDto()
                {
                    Id = x.Id,
                    HeartbeatAt = x.HeartbeatAt,
                    HeartbeatUserId = x.HeartbeatUserId
                }).FirstOrDefault();
            if (res is null)
                throw new RqEx("无法加载存档信息");
            EnrichEditingBy([res]);
            return res;
        }
        public string? LoadData(int id, bool forEdit)
        {
            if(forEdit)
                Heartbeat(id, HeartbeatType.Initialization);
            var res = Viewable
                .Where(x => x.Id == id)
                .Select(x => new { x.Id, x.Data })
                .FirstOrDefault();
            if (res is null)
                throw new RqEx("无法加载存档数据");
            return res.Data;
        }
        public void Remove(int id)
        {
            base.FakeRemove(id);
        }
        
        /// <summary>
        /// 本应用设计为单实例部署，所以心跳仅使用这里的锁即可，无需数据库锁
        /// （如果要支持多实例部署，需要使用数据库锁，否则会出现并发问题）
        /// </summary>
        private static Lock HeartbeatLock => new();
        public void Heartbeat(int id, HeartbeatType type, bool checkOnly = false)
        {
            lock (HeartbeatLock)
            {
                var lastBeat = Existing
                    .Where(x => x.Id == id)
                    .Select(x => new { x.HeartbeatAt, x.HeartbeatUserId })
                    .FirstOrDefault();
                if (lastBeat is null)
                    throw new RqEx("找不到当前存档");
                var uid = httpUserIdProvider.RequireUserId();
                if (uid != lastBeat.HeartbeatUserId)
                {
                    // 若上次心跳的人与此次不同
                    if (type == HeartbeatType.Initialization)
                    {
                        // 初始心跳：检查前一个人的心跳是否超时（是否已经离开很久了）
                        var passedTime = DateTime.Now - lastBeat.HeartbeatAt;
                        if (passedTime < HeartbeatValidSpan)
                        {
                            // 如果时间未到，还不能进，给出当前编辑用户的用户名
                            var editingUserName = base.Context.Users
                                .Where(x => x.Id == lastBeat.HeartbeatUserId)
                                .Select(x => x.Name)
                                .FirstOrDefault() ?? "???";
                            throw new RqEx($"该画布正在被人编辑：\n{editingUserName}");
                        }
                    }
                    else if (type == HeartbeatType.Renewal)
                    {
                        // 续约心跳：前一次心跳的人不是自己，说明中间离开太久，他人已经进来过
                        // 此时不能再保存，只能丢弃更改，否则会覆盖其他人（错的人是当前用户，上一个用户没有做错什么）
                        throw new RqEx("您离开时，画布已被他人编辑，请重新进入");
                    }
                }
                // 到这里说明没有问题，可以心跳
                if (checkOnly)
                    return;
                Existing.Where(x => x.Id == id)
                    .ExecuteUpdate(spc => spc
                        .SetProperty(x => x.HeartbeatAt, DateTime.Now)
                        .SetProperty(x => x.HeartbeatUserId, uid)
                    );
            }
        }

        public void HeartbeatRelease(int id)
        {
            lock (HeartbeatLock){
                var lastBeatUser = Existing
                    .Where(x => x.Id == id)
                    .Select(x => x.HeartbeatUserId)
                    .FirstOrDefault();
                var uid = httpUserIdProvider.RequireUserId();
                if (uid == lastBeatUser)
                {
                    Existing.Where(x => x.Id == id)
                        .ExecuteUpdate(spc => spc.SetProperty(x => x.HeartbeatAt, DateTime.MinValue));
                }
            }
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
        private static void EnrichEditingBy(List<SaveDto> saveDtoList)
        {
            foreach(var d in saveDtoList)
            {
                var stillValid = (DateTime.Now - d.HeartbeatAt) < HeartbeatValidSpan;
                if (stillValid)
                    d.EditingByUserId = d.HeartbeatUserId;
            }
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
        public bool AllowRequesterView { get; set; }
        public bool AllowRequesterEdit { get; set; }
        public int EditingByUserId { get; set; }
        public string? EditingByUserName { get; set; }
        [JsonIgnore]
        public DateTime HeartbeatAt { get; set; }
        [JsonIgnore]
        public int HeartbeatUserId { get; set; }
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
    
    public enum HeartbeatType : byte
    {
        Initialization = 0,
        Renewal = 1
    }
}
