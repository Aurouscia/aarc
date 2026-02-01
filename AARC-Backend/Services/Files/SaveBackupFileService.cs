using System.IO.Compression;
using System.Text.Json;

namespace AARC.Services.Files
{
    public class SaveBackupFileService(
        IWebHostEnvironment env, ILogger<SaveBackupFileService> logger)
    {
        public const string backupFileBaseDir = "Data/Backups";
        public const int backupFileMaxCountPerId = 8;
        public const int backupFileCreateThresholdMins = 20;
        private readonly string _backupFileBaseDirAbsolute
            = Path.Combine(env.ContentRootPath, backupFileBaseDir);
        public void Write(string data, int cvsId, bool mustBackup)
        {
            var baseDir = new DirectoryInfo(_backupFileBaseDirAbsolute);
            if (!baseDir.Exists)
                baseDir.Create();
            var cvsDirPath = Path.Combine(_backupFileBaseDirAbsolute, cvsId.ToString());
            var cvsDir = new DirectoryInfo(cvsDirPath);
            if (!cvsDir.Exists)
                cvsDir.Create();
            else
                Cleanup(cvsDir);
            DateTime latestSave = DateTime.MinValue;
            foreach(var f in cvsDir.GetFiles())
            {
                if(f.CreationTime > latestSave)
                    latestSave = f.CreationTime;
            }

            bool lastBackupVeryClose = latestSave.AddMinutes(backupFileCreateThresholdMins) > DateTime.Now;
            if (!mustBackup && lastBackupVeryClose)
                return;
            string fileNameBase = DateTime.Now.ToString("yyyy-MMdd-HHmm-ss-fff");
            string fileNameJson = Path.ChangeExtension(fileNameBase, "json");
            string fileNameZip = Path.ChangeExtension(fileNameBase, "zip");
            string filePathZip = Path.Combine(cvsDirPath, fileNameZip);
            using var dist = File.Open(filePathZip, FileMode.Create, FileAccess.Write);
            using ZipArchive zip = new(dist, ZipArchiveMode.Create);
            var zipEntry = zip.CreateEntry(fileNameJson);
            using var zipEntryStream = zipEntry.Open();
            using var distWriter = new StreamWriter(zipEntryStream);
            distWriter.Write(data);
            distWriter.Flush();
            distWriter.Close();
        }
        public int Cleanup(DirectoryInfo cvsDir)
        {
            int deleteCount = 0;
            if (cvsDir.Exists)
            {
                var files = cvsDir
                    .EnumerateFiles()
                    .OrderBy(x => x.CreationTime)
                    .ToList();
                if(files.Count > backupFileMaxCountPerId)
                {
                    deleteCount = files.Count - backupFileMaxCountPerId;
                    var needToDelete = files.Take(deleteCount);
                    foreach (var f in needToDelete)
                        f.Delete();
                }
            }
            return deleteCount;
        }
        public int CleanupForAll()
        {
            int deleteCount = 0;
            var baseDir = new DirectoryInfo(_backupFileBaseDirAbsolute);
            if (!baseDir.Exists)
                return deleteCount;
            foreach(var d in baseDir.EnumerateDirectories())
            {
                deleteCount += Cleanup(d);
            }
            return deleteCount;
        }
        public List<SaveBackupInfo> GetBackupList(int cvsId)
        {
            var backups = new List<SaveBackupInfo>();
            var cvsDirPath = Path.Combine(_backupFileBaseDirAbsolute, cvsId.ToString());
            var cvsDir = new DirectoryInfo(cvsDirPath);
            
            if (!cvsDir.Exists)
                return backups;
            
            var zips = cvsDir.GetFiles("*.zip").OrderByDescending(f => f.CreationTime);
            foreach (var file in zips)
            {
                backups.Add(new SaveBackupInfo
                {
                    FileName = file.Name,
                    FileSize = file.Length,
                    CreateTime = file.CreationTime.ToString("yyyy-MM-dd HH:mm")
                });
            }

            return backups;
        }

        public (Stream? stream, string? fileName, long? fileSize) GetBackupFile(int cvsId, string fileName)
        {
            var cvsDirPath = Path.Combine(_backupFileBaseDirAbsolute, cvsId.ToString());
            var filePath = Path.Combine(cvsDirPath, fileName);
            
            // 安全检查：确保文件路径在备份目录内，防止目录遍历攻击
            var fullPath = Path.GetFullPath(filePath);
            var fullBaseDir = Path.GetFullPath(cvsDirPath);
            if (!fullPath.StartsWith(fullBaseDir, StringComparison.OrdinalIgnoreCase) || !File.Exists(filePath))
            {
                return (null, null, null);
            }

            var fileInfo = new FileInfo(filePath);
            var stream = File.OpenRead(filePath);
            return (stream, fileInfo.Name, fileInfo.Length);
        }

        public string GetBackupFileAndDecompress(int cvsId, string fileName)
        {
            var (stream, _, _) = GetBackupFile(cvsId, fileName);
            if (stream == null)
                throw new RqEx("找不到该备份");
            try
            {
                using ZipArchive zip = new(stream, ZipArchiveMode.Read);
                var zipEntry = zip.Entries.FirstOrDefault();
                using var zipEntryStream = zipEntry!.Open();
                using var reader = new StreamReader(zipEntryStream);
                var json = reader.ReadToEnd();
                _ = JsonDocument.Parse(json); // 验证json格式
                return json;
            }
            catch(Exception e)
            {
                logger.LogError(e, "解压/验证备份文件失败");
                throw new RqEx("备份文件疑似损坏");
            }
        }
    }
    
    public class SaveBackupInfo
    {
        public string? FileName { get; set; }
        public long FileSize { get; set; }
        public string? CreateTime  { get; set; }
    }
}