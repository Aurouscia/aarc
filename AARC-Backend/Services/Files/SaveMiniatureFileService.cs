using Microsoft.Extensions.FileProviders;

namespace AARC.Services.Files
{
    public class SaveMiniatureFileService(IWebHostEnvironment env)
    {
        public const string miniFileBaseDir = "Data/Miniatures";
        public const string miniFileAccessPath = "/mini";
        private readonly string miniFileBaseDirAbsolute
            = Path.Combine(env.ContentRootPath, miniFileBaseDir);
        public void Write(Stream input, int cvsId)
        {
            var baseDir = new DirectoryInfo(miniFileBaseDirAbsolute);
            if (!baseDir.Exists)
                baseDir.Create();
            var cvsDirPath = Path.Combine(miniFileBaseDirAbsolute, cvsId.ToString());
            var cvsDir = new DirectoryInfo(cvsDirPath);
            if (!cvsDir.Exists)
                cvsDir.Create();
            CleanUp(cvsDir);
            var fileName = DateTime.Now.ToString("yyyyMMdd-HHmmss-fff");
            fileName = Path.ChangeExtension(fileName, "png");
            var filePath = Path.Combine(cvsDirPath, fileName);
            var dist = File.Open(filePath, FileMode.Create, FileAccess.Write);
            input.CopyTo(dist);
            input.Flush();
            dist.Flush();
            input.Close();
            dist.Close();
        }
        public string? GetUrl(int id)
        {
            string idStr = id.ToString();
            var cvsDirPath = Path.Combine(miniFileBaseDirAbsolute, idStr);
            var cvsDir = new DirectoryInfo(cvsDirPath);
            if (cvsDir.Exists)
            {
                var newestName = cvsDir.EnumerateFiles()
                    .OrderByDescending(x => x.CreationTime)
                    .Select(x => x.Name)
                    .FirstOrDefault();
                if (newestName is { })
                    return string.Join('/', miniFileAccessPath, idStr, newestName);
            }
            return null;
        }
        public void CleanUp(DirectoryInfo cvsDir)
        {
            var oneDayAgo = DateTime.Now.AddDays(-1);
            if (cvsDir.Exists)
            {
                var tooOld = cvsDir.EnumerateFiles()
                    .Where(x => x.CreationTime < oneDayAgo);
                foreach(var f in tooOld)
                    f.Delete();
            }
        }
    }
    public static class SaveMiniatureFileMapping
    {
        public static IApplicationBuilder UseSaveMiniatureFiles(
            this IApplicationBuilder app, IWebHostEnvironment env)
        {
            var root = Path.Combine(
                env.ContentRootPath, SaveMiniatureFileService.miniFileBaseDir);
            var dirInfo = new DirectoryInfo(root);
            if (!dirInfo.Exists)
                dirInfo.Create();
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(root),
                RequestPath = SaveMiniatureFileService.miniFileAccessPath
            });
            return app;
        }
    }
}
