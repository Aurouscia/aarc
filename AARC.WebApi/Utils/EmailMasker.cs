namespace AARC.WebApi.Utils
{
    public static class EmailMasker
    {
        public static string Mask(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return string.Empty;

            var atIndex = email.IndexOf('@');
            if (atIndex <= 0)
                return email;

            var local = email[..atIndex];
            var domain = email[atIndex..];

            string maskedLocal;
            if (local.Length == 1)
            {
                maskedLocal = "*";
            }
            else if (local.Length == 2)
            {
                maskedLocal = local[..1] + "*";
            }
            else if (local.Length < 5)
            {
                maskedLocal = local[..1] + new string('*', local.Length - 2) + local[^1..];
            }
            else
            {
                maskedLocal = local[..2] + new string('*', local.Length - 4) + local[^2..];
            }

            return maskedLocal + domain;
        }
    }
}
