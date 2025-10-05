using AARC.Models.Db.Context;
using AARC.Models.DbModels.Files;
using AARC.Models.DbModels.Saves;
using AARC.Services.App.HttpAuthInfo;
using AARC.Services.App.Mapping;
using AARC.Services.Files;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace AARC.Repos.Files
{
    public class UserFileRepo(
        AarcContext context,
        UserFileService userFileService,
        HttpUserIdProvider httpUserIdProvider,
        IMapper mapper
        ) : Repo<UserFile>(context)
    {
        private const int fileSizeLimitMB = 10;
        private readonly static string[] extAllowed 
            = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
        public void Add(IFormFile f)
        {
            if (f.Length > fileSizeLimitMB * 1024 * 1024)
                throw new RqEx($"文件不能大于 {fileSizeLimitMB}MB");
            var uid = httpUserIdProvider.RequireUserId();
            var fileName = f.FileName;
            var ext = Path.GetExtension(fileName);
            if (string.IsNullOrWhiteSpace(ext))
                throw new RqEx("文件必须有后缀名");
            if (!extAllowed.Contains(ext.ToLower()))
                throw new RqEx("不支持这种后缀名");
            userFileService.Write(f.OpenReadStream(), fileName, out var storeName, out int size);
            UserFile userFile = new()
            {
                DisplayName = fileName,
                StoreName = storeName,
                OwnerUserId = uid,
                Size = size
            };
            Add(userFile);
        }

        private const int pageSize = 50;
        public List<UserFileDto> GetUserFiles(
            int pageIdx, int ownerId, string? nameSearch)
        {
            var q = Existing;
            if (ownerId > 0)
                q = q.Where(x => x.OwnerUserId == ownerId);
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
                dto.Url = userFileService.GetUrl(dto.StoreName, thumb: true);
                res.Add(dto);
            }
            return res;
        }
    }

    public class UserFileDto
    {
        public int Id { get; set; }
        public string? DisplayName { get; set; }
        public string? StoreName { get; set; }
        public string? Url { get; set; }
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
