using AARC.Utils;
using AARC.Utils.ImageProcessing;
using Microsoft.Extensions.FileProviders;

namespace AARC.Services.Files
{
    /// <summary>
    /// 用户文件保存服务<br/>
    /// 约定：文件以小写md5命名（后缀转小写保留）<br/>
    /// 文件放在一级子目录里，子目录名为md5前两位<br/>
    /// 略缩图文件（如果有）和原文件放在一起，名称加后缀<see cref="userFileThumbNameSuffix"/>
    /// 并统一转为webp格式
    /// </summary>
    public class UserFileService(IWebHostEnvironment env)
    {
        public const string userFileBaseDir = "Data/UserFiles";
        public const string userFileAccessPath = "/userfile";
        public const string userFileThumbAccessPath = "/userfile/thumb";
        public const string userFileThumbNameSuffix = "_tb";
        /// <summary>
        /// 按约定路径保存文件，按需生成thumb
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
            MemoryStream? thumbS = new();
            try
            {
                // 将上传的文件写入临时文件，并计算其md5值
                tempS = File.Open(tempPath, FileMode.Create);
                s.CopyTo(tempS);
                tempS.Flush();
                s.Close();
                tempS.Seek(0, SeekOrigin.Begin);
                var md5 = tempS.GetMD5();

                string finalName = Path.ChangeExtension(md5, ext);
                string finalDir = GetTargetDir(md5).FullName;
                string finalPath = Path.Combine(finalDir, finalName);

                // 按需生成略缩图（thumb）文件
                if (ext != ".svg")
                {
                    string thumbName = md5 + userFileThumbNameSuffix;
                    thumbName = Path.ChangeExtension(thumbName, ImageThumbHelper.thumbFileExt);
                    string thumbPath = Path.Combine(finalDir, thumbName);
                    if (!File.Exists(thumbPath))
                    {
                        tempS.Seek(0, SeekOrigin.Begin);
                        bool needThumb = ImageThumbHelper.Thumb(tempS, thumbS);
                        if (needThumb)
                        {
                            var thumbFs = File.Create(thumbPath);
                            thumbS.Seek(0, SeekOrigin.Begin);
                            thumbS.CopyTo(thumbFs);
                            thumbFs.Flush();
                            thumbFs.Close();
                        }
                        thumbS.Close();
                    }
                }
                tempS.Close();

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
            catch (Exception ex)
            {
                if (ex.InnerException is OutOfMemoryException)
                    throw new RqEx("服务器内存不足，请联系管理员");
                if (ex.InnerException is SixLabors.ImageSharp.Memory.InvalidMemoryOperationException)
                    throw new RqEx("图片过大，请缩小后重试");
                string msg = ex.Message;
                if (!msg.Contains("图片"))
                    msg = "图片：" + msg;
                throw new RqEx(msg);
            }
            finally
            {
                s.Close();
                tempS?.Close();
                thumbS?.Close();
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
        }

        private DirectoryInfo GetBaseDir()
        {
            var dirPath = Path.Combine(env.ContentRootPath, userFileBaseDir);
            var dir = new DirectoryInfo(dirPath);
            if (!dir.Exists)
                dir.Create();
            return dir;
        }
        private DirectoryInfo GetTargetDir(string md5)
        {
            if (md5 is null || md5.Length < 2)
                throw new RqEx("文件保存：md5异常");
            var prefix = md5[..2];
            var subdirPath = Path.Combine(env.ContentRootPath, userFileBaseDir, prefix);
            var subdir = new DirectoryInfo(subdirPath);
            if (!subdir.Exists)
                subdir.Create();
            return subdir;
        }
    }

    public static class UserFileMapping
    {
        public static IApplicationBuilder UseUserFiles(
            this IApplicationBuilder app, IWebHostEnvironment env)
        {
            var root = Path.Combine(
                env.ContentRootPath, UserFileService.userFileBaseDir);
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
