using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using AARC.Utils;

namespace AARC.Repos.Identities
{
    public class UserRepo(
        AarcContext context
        ) : Repo<User>(context)
    {
        public User? MatchUser(string username, string password)
        {
            var pwdEncrypted = UserPwdEncryption.Encrypt(password);
            return Existing
                .Where(x => x.Name == username && x.Password == pwdEncrypted)
                .FirstOrDefault();
        }
        public bool CreateUser(
            string? username, string? password, out string? errmsg)
        {
            username ??= "";
            password ??= "";
            errmsg = CheckModel(username, password);
            if(errmsg is { })
                return false;
            User u = new() { 
                Name = username,
                Password = UserPwdEncryption.Encrypt(password),
                Type = UserType.Member
            };
            base.Add(u);
            return true;
        }
        private string? CheckModel(
            string name, string password)
        {
            if (name.Length < 1 || name.Length > 15)
                return "用户名必须在1-15个字符";
            if (password.Length < 6 || password.Length > 20)
                return "密码必须在6-20个字符";
            if (Existing.Any(x => x.Name == name))
                return "该用户名已经被占用";
            return null;
        }
    }
}
