using AARC.Utils.Exceptions;

namespace AARC.Services.App.Config
{
    public class MasterKeyChecker(IConfiguration config)
    {
        public void Check(string? key)
        {
            if(string.IsNullOrWhiteSpace(key))
                throw new RequestInvalidException("缺少MasterKey");
            var mKey = config["MasterKey"];
            if (string.IsNullOrWhiteSpace(mKey))
                mKey = Path.GetRandomFileName();
            if (key != mKey)
                throw new RequestInvalidException("MasterKey错误");
        }
    }
}
