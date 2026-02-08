using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Files;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.App.Mapping;
using AARC.WebApi.Services.Files;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace AARC.WebApi.Repos.Files
{
    public class UserFileRepo(
        AarcContext context,
        UserFileService userFileService,
        HttpUserIdProvider httpUserIdProvider,
        IMapper mapper
        ) : Repo<UserFile>(context)
    {
        private const int fileSizeLimitMB = 5;
        private const int fileSizeLimitMBOfSvg = 1;
        private readonly static string[] extAllowed 
            = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
        public void Add(IFormFile? f, string? displayName, string? intro)
        {
            if (f is null)
                throw new RqEx("上传失败");
            var fileName = f.FileName;
            CheckModel(displayName, intro);
            var uid = httpUserIdProvider.RequireUserId();
            var extLower = Path.GetExtension(fileName)?.ToLower();
            if (string.IsNullOrWhiteSpace(extLower))
                throw new RqEx("文件必须有后缀名");
            if (!extAllowed.Contains(extLower))
                throw new RqEx("不支持这种后缀名");
            if (f.Length > fileSizeLimitMB * 1024 * 1024)
                throw new RqEx($"文件不能大于 {fileSizeLimitMB}MB");
            if (extLower == ".svg")
            {
                if (f.Length > fileSizeLimitMBOfSvg * 1024 * 1024)
                    throw new RqEx($"svg文件不能大于 {fileSizeLimitMBOfSvg}MB");
            }
            userFileService.Write(f.OpenReadStream(), fileName, out var storeName, out int size);
            UserFile userFile = new()
            {
                DisplayName = displayName ?? Path.GetRandomFileName(),
                StoreName = storeName,
                Intro = intro,
                OwnerUserId = uid,
                Size = size
            };
            Add(userFile);
        }

        public void Edit(int id, string? displayName, string? intro)
        {
            CheckModel(displayName, intro);
            var uid = httpUserIdProvider.RequireUserId();
            var model = base.Get(id) ?? throw new RqEx("找不到指定数据");
            if (model.OwnerUserId != uid) throw new RqEx("无权操作");
            model.DisplayName = displayName ?? Path.GetRandomFileName();
            model.Intro = intro;
            base.Update(model, true);
        }

        public void Delete(int id)
        {
            var uid = httpUserIdProvider.RequireUserId();
            var model = base.Get(id) ?? throw new RqEx("找不到指定数据");
            if (model.OwnerUserId != uid) throw new RqEx("无权操作");
            base.FakeRemove(model);
            // TODO: 清理失去引用的文件
        }

        private const int pageSize = 50;
        public List<UserFileDto> GetUserFiles(
            int pageIdx, int ownerId, string? nameSearch)
        {
            var q = Existing;
            //if (ownerId > 0)
                //q = q.Where(x => x.OwnerUserId == ownerId);
                
            //暂时只能看自己的
            var uid = httpUserIdProvider.RequireUserId();
            q = q.Where(x => x.OwnerUserId == uid);
            
            if (!string.IsNullOrWhiteSpace(nameSearch))
                q = q.Where(x => x.DisplayName.Contains(nameSearch));
            int skip = pageIdx * pageSize;
            int take = pageSize;
            q = q.Skip(skip).Take(take);
            var temp = (
                from f in q 
                join u in Context.Users
                on f.OwnerUserId equals u.Id
                select new
                {
                    UserFile = f,
                    OwnerName = u.Name
                }).ToList();
            List<UserFileDto> res = [];
            foreach (var t in temp)
            {
                var dto = mapper.Map<UserFile, UserFileDto>(t.UserFile);
                dto.OwnerUserName = t.OwnerName;
                dto.UrlThumb = userFileService.GetUrl(dto.StoreName, thumb: true);
                dto.UrlOriginal = userFileService.GetUrl(dto.StoreName, thumb: false);
                res.Add(dto);
            }
            return res;
        }

        private static void CheckModel(string? displayName, string? intro)
        {
            if (displayName is null)
                throw new RqEx("名称不能为空");
            if (displayName.Length >= UserFile.displayNameMaxLength)
                throw new RqEx("名称过长");
            if (intro is not null && intro.Length >= UserFile.introMaxLength)
                throw new RqEx("简介过长");
        }
    }

    public class UserFileDto
    {
        public int Id { get; set; }
        public string? DisplayName { get; set; }
        public string? StoreName { get; set; }
        public string? UrlThumb { get; set; }
        public string? UrlOriginal { get; set; }
        public int OwnerUserId { get; set; }
        public string? OwnerUserName { get; set; }
        public string? Intro { get; set; }
        public int Size { get; set; }
        public string? LastActive { get; set; }
    }

    public class UserFileProfile : Profile
    {
        public UserFileProfile()
        {
            CreateMap<UserFileDto, UserFile>()
                .IgnoreLastActive();
            CreateMap<UserFile, UserFileDto>()
                .ForMember(
                    destinationMember: x => x.LastActive,
                    memberOptions: mem => mem.MapFrom(source => source.LastActive.ToString("yyyy-MM-dd HH:mm")));
        }
    }
}
