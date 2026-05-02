namespace AARC.WebApi.Services.App.Email
{
    public class EmailConfig
    {
        public List<SmtpAccount> SmtpAccounts { get; set; } = [];

        public List<int> RemoveInvalidAccounts()
        {
            var removedIndexes = new List<int>();
            for (int i = SmtpAccounts.Count - 1; i >= 0; i--)
            {
                var account = SmtpAccounts[i];
                if (string.IsNullOrWhiteSpace(account.Server)
                    || string.IsNullOrWhiteSpace(account.Account)
                    || string.IsNullOrWhiteSpace(account.Password))
                {
                    removedIndexes.Add(i);
                    SmtpAccounts.RemoveAt(i);
                }
            }
            removedIndexes.Reverse();
            return removedIndexes;
        }
    }

    public class SmtpAccount
    {
        public string Server { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public string Account { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool EnableSsl { get; set; } = true;
        public string SenderName { get; set; } = string.Empty;
        public string SenderAddress { get; set; } = string.Empty;
    }
}
