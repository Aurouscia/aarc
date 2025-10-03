using AARC.Utils;
using Microsoft.Extensions.FileProviders;

namespace AARC.Services.Files
{
    /// <summary>
    /// 用户文件保存服务<br/>
    /// 约定：文件以小写md5命名（后缀转小写保留）<br/>
    /// 文件放在一级子目录里，子目录名为md5前两位
    /// </summary>
    public class UserFileService
    {
        public const string userFileBaseDir = "./Data/UserFiles";
        public const string userFileAccessPath = "/userfile";
        /// <summary>
        /// 按约定路径保存文件
        /// </summary>
        /// <param name="s">文件流（不需要可seek）</param>
        /// <param name="originalName">原名称（用来判断后缀名）</param>
        /// <returns>保存后的名称</returns>
        public void Write(
            Stream s, string originalName,
            out string storeName, out int size)
        {
            var ext = Path.GetExtension(originalName)?.ToLower();
            if (string.IsNullOrWhiteSpace(ext))
                throw new RqEx("文件必须有后缀名");
            DirectoryInfo baseDir = GetBaseDir();
            string tempPath = Path.Combine(baseDir.FullName, Path.GetRandomFileName());
            FileStream? tempS = null;
            try
            {
                tempS = File.Open(tempPath, FileMode.Create);
                s.CopyTo(tempS);
                s.Flush();
                s.Close();
                tempS.Seek(0, SeekOrigin.Begin);
                var md5 = tempS.GetMD5();
                tempS.Close();
                string finalName = Path.ChangeExtension(md5, ext);
                string finalDir = GetTargetDir(md5).FullName;
                string finalPath = Path.Combine(finalDir, finalName);
                FileInfo tempInfo = new(tempPath);
                FileInfo finalInfo = new(finalPath);
                if (finalInfo.Exists)
                    tempInfo.Delete();
                else
                    tempInfo.MoveTo(finalPath);
                finalInfo.Refresh();
                storeName = finalName;
                size = (int)finalInfo.Length;
            }
            finally
            {
                s.Close();
                tempS?.Close();
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
        }

        private static DirectoryInfo GetBaseDir()
        {
            var dir = new DirectoryInfo(userFileBaseDir);
            if (!dir.Exists)
                dir.Create();
            return dir;
        }
        private static DirectoryInfo GetTargetDir(string md5)
        {
            if (md5 is null || md5.Length < 2)
                throw new RqEx("文件保存：md5异常");
            var prefix = md5[..2];
            var subdirPath = Path.Combine(userFileBaseDir, prefix);
            var subdir = new DirectoryInfo(subdirPath);
            if (!subdir.Exists)
                subdir.Create();
            return subdir;
        }
    }

    public static class UserFileMapping
    {
        public static IApplicationBuilder UseUserFiles(
            this IApplicationBuilder app, string contentPath)
        {
            var root = Path.Combine(
                contentPath, UserFileService.userFileBaseDir);
            var dirInfo = new DirectoryInfo(root);
            if (!dirInfo.Exists)
                dirInfo.Create();
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(root),
                RequestPath = UserFileService.userFileAccessPath
            });
            return app;
        }
    }
}
