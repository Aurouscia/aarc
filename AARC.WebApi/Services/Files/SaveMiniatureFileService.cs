using Microsoft.Extensions.FileProviders;

namespace AARC.WebApi.Services.Files
{
    public class SaveMiniatureFileService(IWebHostEnvironment env, ILogger<SaveMiniatureFileService> logger)
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
        /// <summary>
        /// 把指定存档的略缩图目录清理得只剩最新的那个
        /// </summary>
        public void CleanUp(DirectoryInfo cvsDir)
        {
            if (!cvsDir.Exists)
                return;
            var allFiles = cvsDir.EnumerateFiles()
                .OrderByDescending(f => f.CreationTimeUtc)
                .ToList();
            if (allFiles.Count <= 1)        // 没有或只有一个文件，无需清理
                return;
            foreach (var file in allFiles.Skip(1))
            {
                try
                {
                    // 去掉只读标记，避免 UnauthorizedAccessException
                    if (file.IsReadOnly)
                        file.IsReadOnly = false;
                    file.Delete();
                    logger.LogTrace("略缩图：已清理 {File}", file.FullName);
                }
                catch (IOException ex) // 占用、网络中断等
                {
                    logger.LogWarning(ex, "略缩图：文件可能正在使用无法清理 {File}", file.FullName);
                }
                catch (Exception ex) // 其他意外
                {
                    logger.LogError(ex, "略缩图：清理文件时发生异常 {File}", file.FullName);
                }
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
