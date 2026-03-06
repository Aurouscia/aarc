using Microsoft.Extensions.FileProviders;
using System.Collections.Concurrent;

namespace AARC.WebApi.Services.Files
{
    public class SaveMiniatureFileService(IWebHostEnvironment env, ILogger<SaveMiniatureFileService> logger)
    {
        public const string miniFileBaseDir = "Data/Miniatures";
        public const string miniFileAccessPath = "/mini";
        private readonly string miniFileBaseDirAbsolute
            = Path.Combine(env.ContentRootPath, miniFileBaseDir);

        // 缓存：存档Id -> 缩略图URL，用于避免重复的文件系统I/O
        // 完全信任缓存，假设文件只通过本服务管理
        private readonly ConcurrentDictionary<int, string?> _urlCache = new();

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

            // 更新缓存：写入新缩略图后更新缓存
            var url = MiniAccessUrl(cvsId.ToString(), fileName);
            _urlCache.AddOrUpdate(cvsId, url, (_, _) => url);
        }

        public string? GetUrl(int id)
        {
            // 完全信任缓存，零 I/O
            if (_urlCache.TryGetValue(id, out var cachedUrl))
                return cachedUrl;

            // 缓存未命中，从文件系统查找
            var url = GetUrlFromFileSystem(id);
            _urlCache.TryAdd(id, url);
            return url;
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

            // 清理完成后更新缓存（保留最新的文件）
            if (int.TryParse(cvsDir.Name, out int cvsId) && allFiles.Count > 0)
            {
                var newestFile = allFiles.First();
                var url = MiniAccessUrl(cvsId.ToString(), newestFile.Name);
                _urlCache.AddOrUpdate(cvsId, url, (_, _) => url);
            }
        }

        /// <summary>
        /// 强制刷新指定存档的缓存（用于外部调用，如手动清理文件后）
        /// </summary>
        public string? RefreshCache(int id)
        {
            _urlCache.TryRemove(id, out _);
            return GetUrl(id);
        }

        /// <summary>
        /// 从文件系统获取缩略图URL（原始实现）
        /// </summary>
        private string? GetUrlFromFileSystem(int id)
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
                    return MiniAccessUrl(idStr, newestName);
            }
            return null;
        }


        private static string MiniAccessUrl(string idStr, string fileName)
            => $"{miniFileAccessPath}/{idStr}/{fileName}";
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
