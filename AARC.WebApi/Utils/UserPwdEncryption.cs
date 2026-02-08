namespace AARC.Utils
{
    public static class UserPwdEncryption
    {
        public static string Encrypt(string pwd)
        {
            return MD5Helper.GetMD5($"aarc-{pwd}");
        }
    }
}
