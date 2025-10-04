using AARC.Models.Db.Context;
using AARC.Models.DbModels.Files;
using AARC.Services.App.HttpAuthInfo;
using AARC.Services.Files;

namespace AARC.Repos.Files
{
    public class UserFileRepo(
        AarcContext context,
        UserFileService userFileService,
        HttpUserIdProvider httpUserIdProvider
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
    }
}
