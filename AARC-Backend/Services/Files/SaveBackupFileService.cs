using System.IO.Compression;

namespace AARC.Services.Files
{
    public class SaveBackupFileService
    {
        public const string backupFileBaseDir = "./Data/Backups";
        public const int backupFileMaxCountPerId = 15;
        public const int backupFileCreateThrsMins = 20;
        public void Write(string data, int cvsId)
        {
            var baseDir = new DirectoryInfo(backupFileBaseDir);
            if (!baseDir.Exists)
                baseDir.Create();
            var cvsDirPath = Path.Combine(backupFileBaseDir, cvsId.ToString());
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
            if (latestSave.AddMinutes(backupFileCreateThrsMins) > DateTime.Now)
                return;
            string fileNameBase = DateTime.Now.ToString("yyyy-MMdd-HHmm");
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
            var baseDir = new DirectoryInfo(backupFileBaseDir);
            if (!baseDir.Exists)
                return deleteCount;
            foreach(var d in baseDir.EnumerateDirectories())
            {
                deleteCount += Cleanup(d);
            }
            return deleteCount;
        }
    }
}