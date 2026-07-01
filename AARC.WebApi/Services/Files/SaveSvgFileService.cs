using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using System.Collections.Concurrent;

namespace AARC.WebApi.Services.Files
{
    public class SaveSvgFileService(IWebHostEnvironment env, ILogger<SaveSvgFileService> logger)
    {
        public const string svgFileBaseDir = "Data/Svgs";
        public const string svgFileAccessPath = "/save-svg";
        private readonly string svgFileBaseDirAbsolute
            = Path.Combine(env.ContentRootPath, svgFileBaseDir);

        // 缓存：存档Id -> 是否存在SVG，用于避免重复的文件系统I/O
        // 完全信任缓存，假设文件只通过本服务管理
        private readonly ConcurrentDictionary<int, bool> _existCache = new();

        public void Write(Stream input, int saveId)
        {
            var baseDir = new DirectoryInfo(svgFileBaseDirAbsolute);
            if (!baseDir.Exists)
                baseDir.Create();
            var filePath = GetFilePath(saveId);
            using var dist = File.Open(filePath, FileMode.Create, FileAccess.Write);
            input.CopyTo(dist);
            dist.Flush();
            input.Close();

            // 更新缓存
            _existCache.AddOrUpdate(saveId, true, (_, _) => true);
            logger.LogInformation("存档{SaveId}的SVG已更新", saveId);
        }

        public bool Exists(int saveId)
        {
            if (_existCache.TryGetValue(saveId, out var cached))
                return cached;

            var exists = File.Exists(GetFilePath(saveId));
            _existCache.TryAdd(saveId, exists);
            return exists;
        }

        public string? GetUrl(int saveId)
        {
            if (!Exists(saveId))
                return null;
            return $"{svgFileAccessPath}/{saveId}.svg";
        }

        /// <summary>
        /// 强制刷新指定存档的缓存（用于外部调用，如手动清理文件后）
        /// </summary>
        public string? RefreshCache(int saveId)
        {
            _existCache.TryRemove(saveId, out _);
            return GetUrl(saveId);
        }

        private string GetFilePath(int saveId)
            => Path.Combine(svgFileBaseDirAbsolute, $"{saveId}.svg");
    }

    public static class SaveSvgFileMapping
    {
        public static IApplicationBuilder UseSaveSvgFiles(
            this IApplicationBuilder app, IWebHostEnvironment env)
        {
            var root = Path.Combine(
                env.ContentRootPath, SaveSvgFileService.svgFileBaseDir);
            var dirInfo = new DirectoryInfo(root);
            if (!dirInfo.Exists)
                dirInfo.Create();
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(root),
                RequestPath = SaveSvgFileService.svgFileAccessPath,
                ContentTypeProvider = new FileExtensionContentTypeProvider
                {
                    Mappings = { [".svg"] = "image/svg+xml" }
                },
                OnPrepareResponse = ctx =>
                {
                    // 每个存档仅保留最新版本，URL固定，必须禁用客户端缓存
                    // 否则浏览器会长期显示旧版本SVG
                    ctx.Context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
                    ctx.Context.Response.Headers.Pragma = "no-cache";
                    ctx.Context.Response.Headers.Expires = "0";
                }
            });
            return app;
        }
    }
}
