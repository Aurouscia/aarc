namespace AARC.Services.Files
{
    public class SaveBackupFileService
    {
        public const string backupFileBaseDir = "./Data/Backups";
        public const int backupFileMaxCountPerId = 15;
        public const int backupFileCreateThrsMins = 10;
        public void Write(string data, int cvsId)
        {
            var baseDir = new DirectoryInfo(backupFileBaseDir);
            if (!baseDir.Exists)
                baseDir.Create();
            var cvsDirPath = Path.Combine(backupFileBaseDir, cvsId.ToString());
            var cvsDir = new DirectoryInfo(cvsDirPath);
            if (!cvsDir.Exists)
                cvsDir.Create();
            DateTime latestSave = DateTime.MinValue;
            foreach(var f in cvsDir.GetFiles())
            {
                if(f.CreationTime > latestSave)
                    latestSave = f.CreationTime;
            }
            if (latestSave.AddMinutes(backupFileCreateThrsMins) > DateTime.Now)
                return;
            var fileName = DateTime.Now.ToString("yyyyMMdd");
            fileName = Path.ChangeExtension(fileName, "json");
            var filePath = Path.Combine(cvsDirPath, fileName);
            using var dist = File.Open(filePath, FileMode.Create, FileAccess.Write);
            using var distWriter = new StreamWriter(dist);
            distWriter.Write(data);
            distWriter.Flush();
            distWriter.Close();
        }
        public void CleanUp(DirectoryInfo cvsDir)
        {
            if (cvsDir.Exists)
            {
                var files = cvsDir
                    .EnumerateFiles()
                    .OrderBy(x => x.CreationTime)
                    .ToList();
                if(files.Count > backupFileMaxCountPerId)
                {
                    var exceeded = files.Count - backupFileMaxCountPerId;
                    var needToDelete = files.Take(exceeded);
                    foreach (var f in needToDelete)
                        f.Delete();
                }
            }
        }
    }
}