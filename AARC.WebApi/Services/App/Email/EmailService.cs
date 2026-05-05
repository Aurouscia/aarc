using MailKit.Net.Smtp;
using MimeKit;

namespace AARC.WebApi.Services.App.Email
{
    public class EmailService
    {
        private readonly EmailConfig _config;
        private readonly ILogger<EmailService> _logger;
        private int _currentAccountIndex;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _config = configuration.GetSection("Email").Get<EmailConfig>() ?? new EmailConfig();
            _logger = logger;

            var removedIndexes = _config.RemoveInvalidAccounts();
            if (removedIndexes.Count > 0)
            {
                _logger.LogWarning(
                    "Email 配置中发现并移除了 {Count} 个无效 SMTP 账号，索引: {Indexes}",
                    removedIndexes.Count,
                    string.Join(", ", removedIndexes));
            }
        }

        public async Task SendEmailAsync(
            string to,
            string subject,
            string body,
            bool isHtml = false)
        {
            if (_config.SmtpAccounts.Count == 0)
                throw new InvalidOperationException("没有配置任何 SMTP 账号");

            var startIndex = Interlocked.Increment(ref _currentAccountIndex) % _config.SmtpAccounts.Count;
            var exceptions = new List<Exception>();

            for (int i = 0; i < _config.SmtpAccounts.Count; i++)
            {
                var accountIndex = (startIndex + i) % _config.SmtpAccounts.Count;
                var account = _config.SmtpAccounts[accountIndex];

                try
                {
                    await SendWithAccountAsync(account, to, subject, body, isHtml);
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "SMTP 账号 {Account} ({Server}) 发送邮件失败，尝试下一个账号",
                        account.Account, account.Server);
                    exceptions.Add(ex);
                }
            }

            throw new AggregateException("所有 SMTP 账号均发送失败", exceptions);
        }

        public async Task SendEmailVerificationCodeAsync(
            string to,
            string code)
        {
            var subject = "邮箱确认验证码";
            var body = $"您的邮箱确认验证码是：<b>{code}</b>，请在有效期内使用。";
            await SendEmailAsync(to, subject, body, isHtml: true);
        }

        private static async Task SendWithAccountAsync(
            SmtpAccount account,
            string to,
            string subject,
            string body,
            bool isHtml)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                string.IsNullOrEmpty(account.SenderName) ? account.Account : account.SenderName,
                string.IsNullOrEmpty(account.SenderAddress) ? account.Account : account.SenderAddress));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var textPart = isHtml
                ? new TextPart("html") { Text = body }
                : new TextPart("plain") { Text = body };
            message.Body = textPart;

            using var client = new SmtpClient();
            await client.ConnectAsync(account.Server, account.Port,
                account.EnableSsl ? MailKit.Security.SecureSocketOptions.StartTls : MailKit.Security.SecureSocketOptions.Auto);
            await client.AuthenticateAsync(account.Account, account.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
