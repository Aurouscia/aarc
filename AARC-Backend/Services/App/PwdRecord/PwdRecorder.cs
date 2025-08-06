namespace AARC.Services.App.PwdRecord
{
    public class PwdRecorder(IConfiguration config)
    {
        private const string pwdRecorderDir = "Data/PwdRecord";
        private static readonly Lock pwdRecordLock = new();
        /// <summary>
        /// 按需记录密码明文（配置项PwdRecord为true时）
        /// </summary>
        /// <param name="userName"></param>
        /// <param name="pwdOriginal"></param>
        public void Record(string? userName, string? pwdOriginal)
        {
            lock (pwdRecordLock)
            {
                if (config["PwdRecord"]?.ToLower() != "true" || userName is null)
                    return;
                DirectoryInfo di = new(pwdRecorderDir);
                if (!di.Exists)
                    di.Create();
                var fileName = Path.ChangeExtension(userName, "txt");
                var path = Path.Combine(pwdRecorderDir, fileName);
                using var fs = File.Open(path, FileMode.Create);
                using var sw = new StreamWriter(fs);
                sw.Write(pwdOriginal);
                sw.Flush();
            }
        }
    }
}
