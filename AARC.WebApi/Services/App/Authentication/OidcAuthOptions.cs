namespace AARC.WebApi.Services.App.Authentication
{
    /// <summary>
    /// OIDC 客户端配置（本应用作为 RP，主应用作为 IdP）
    /// </summary>
    public class OidcAuthOptions
    {
        public bool Enabled { get; set; }

        /// <summary>
        /// IdP 的 Authority，例如 https://master.app
        /// </summary>
        public string? Authority { get; set; }

        /// <summary>
        /// 本应用在 IdP 中注册的 ClientId
        /// </summary>
        public string? ClientId { get; set; }

        /// <summary>
        /// 本应用在 IdP 中注册的 ClientSecret（Authorization Code 流程需要）
        /// </summary>
        public string? ClientSecret { get; set; }

        /// <summary>
        /// OIDC 回调地址，例如 https://aarc.example.com/auth/oidc/callback
        /// </summary>
        public string? RedirectUri { get; set; }

        /// <summary>
        /// 向 IdP 请求的 scope，默认 openid profile
        /// </summary>
        public string Scope { get; set; } = "openid profile";

        /// <summary>
        /// 响应类型，默认 code（推荐 Authorization Code + PKCE）
        /// </summary>
        public string ResponseType { get; set; } = "code";

        /// <summary>
        /// 是否要求 discovery endpoint 必须使用 HTTPS。生产环境务必保持 true。
        /// </summary>
        public bool RequireHttps { get; set; } = true;
    }
}
