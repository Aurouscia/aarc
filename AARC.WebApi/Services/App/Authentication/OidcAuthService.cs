using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AARC.WebApi.Services.App.Authentication
{
    /// <summary>
    /// OIDC 登录校验服务：负责拉取 IdP 元数据、校验 id_token、以及用 code 换 token。
    /// 本应用作为 RP，主应用作为 IdP。
    /// </summary>
    public class OidcAuthService
    {
        private readonly OidcAuthOptions _options;
        private readonly IHttpClientFactory _httpFactory;
        private readonly ConfigurationManager<OpenIdConnectConfiguration>? _configManager;

        public OidcAuthService(IOptions<OidcAuthOptions> options, IHttpClientFactory httpFactory)
        {
            _options = options.Value;
            _httpFactory = httpFactory;

            if (!_options.Enabled)
                return;

            var authority = _options.Authority?.TrimEnd('/');
            if (string.IsNullOrWhiteSpace(authority))
                throw new InvalidOperationException("OIDC 登录已启用，但未配置 OidcAuth:Authority");
            if (string.IsNullOrWhiteSpace(_options.ClientId))
                throw new InvalidOperationException("OIDC 登录已启用，但未配置 OidcAuth:ClientId");
            if (string.IsNullOrWhiteSpace(_options.RedirectUri))
                throw new InvalidOperationException("OIDC 登录已启用，但未配置 OidcAuth:RedirectUri");

            var httpClient = _httpFactory.CreateClient();
            var retriever = new HttpDocumentRetriever(httpClient) { RequireHttps = _options.RequireHttps };
            _configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                $"{authority}/.well-known/openid-configuration",
                new OpenIdConnectConfigurationRetriever(),
                retriever);
        }

        /// <summary>
        /// 是否启用 OIDC 登录
        /// </summary>
        public bool Enabled => _options.Enabled;

        /// <summary>
        /// 构造跳转到 IdP 的授权 URL（Authorization Code + PKCE）
        /// </summary>
        public async Task<string> BuildChallengeUrlAsync(
            string state,
            string codeChallenge,
            string nonce,
            CancellationToken ct = default)
        {
            EnsureEnabled();
            var config = await _configManager!.GetConfigurationAsync(ct);
            var query = new Dictionary<string, string>
            {
                ["client_id"] = _options.ClientId!,
                ["response_type"] = _options.ResponseType,
                ["scope"] = _options.Scope,
                ["redirect_uri"] = _options.RedirectUri!,
                ["state"] = state,
                ["code_challenge"] = codeChallenge,
                ["code_challenge_method"] = "S256",
                ["nonce"] = nonce
            };
            var qb = new QueryBuilder(query);
            return config.AuthorizationEndpoint + qb.ToString();
        }

        /// <summary>
        /// 用 Authorization Code 向 IdP 换取 token，并校验返回的 id_token。
        /// </summary>
        public async Task<OidcLoginResult> ExchangeCodeAsync(
            string code,
            string redirectUri,
            string codeVerifier,
            string? nonce = null,
            CancellationToken ct = default)
        {
            EnsureEnabled();
            var config = await _configManager!.GetConfigurationAsync(ct);

            using var http = _httpFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, config.TokenEndpoint)
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string?>
                {
                    ["grant_type"] = "authorization_code",
                    ["client_id"] = _options.ClientId,
                    ["client_secret"] = _options.ClientSecret,
                    ["code"] = code,
                    ["redirect_uri"] = redirectUri,
                    ["code_verifier"] = codeVerifier
                })
            };

            var response = await http.SendAsync(request, ct);
            var json = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
                throw new RqEx($"OIDC token 交换失败: {response.StatusCode}, {json}");

            var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(json)
                ?? throw new RqEx("OIDC token 响应解析失败");

            if (string.IsNullOrWhiteSpace(tokenResponse.IdToken))
                throw new RqEx("OIDC 响应缺少 id_token");

            var principal = await ValidateIdTokenAsync(tokenResponse.IdToken, nonce, ct);
            return new OidcLoginResult(principal, tokenResponse.IdToken, tokenResponse.AccessToken, tokenResponse.RefreshToken);
        }

        /// <summary>
        /// 直接校验一个 IdP 签发的 id_token。
        /// 通常在 ExchangeCodeAsync 内部调用；如果你从主应用直接拿到 id_token，也可以单独使用。
        /// </summary>
        public async Task<ClaimsPrincipal> ValidateIdTokenAsync(
            string idToken,
            string? nonce = null,
            CancellationToken ct = default)
        {
            EnsureEnabled();
            var config = await _configManager!.GetConfigurationAsync(ct);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = config.Issuer,
                ValidateAudience = true,
                ValidAudience = _options.ClientId,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = config.SigningKeys,
                NameClaimType = "name",
                RoleClaimType = "role"
            };

            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(idToken, validationParameters, out _);

            if (!string.IsNullOrWhiteSpace(nonce))
            {
                var nonceClaim = principal.FindFirst("nonce");
                if (nonceClaim is null || !FixedTimeEquals(nonceClaim.Value, nonce))
                    throw new SecurityTokenException("OIDC nonce 校验失败");
            }

            return principal;
        }

        private void EnsureEnabled()
        {
            if (!_options.Enabled)
                throw new InvalidOperationException("OIDC 登录未启用");
        }

        private static bool FixedTimeEquals(string a, string b)
        {
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(a),
                Encoding.UTF8.GetBytes(b));
        }

        private sealed class TokenResponse
        {
            [JsonPropertyName("id_token")]
            public string? IdToken { get; set; }

            [JsonPropertyName("access_token")]
            public string? AccessToken { get; set; }

            [JsonPropertyName("refresh_token")]
            public string? RefreshToken { get; set; }
        }
    }

    /// <summary>
    /// OIDC code 换 token 后的结果
    /// </summary>
    public sealed class OidcLoginResult
    {
        public ClaimsPrincipal Principal { get; }
        public string IdToken { get; }
        public string? AccessToken { get; }
        public string? RefreshToken { get; }

        public OidcLoginResult(
            ClaimsPrincipal principal,
            string idToken,
            string? accessToken,
            string? refreshToken)
        {
            Principal = principal;
            IdToken = idToken;
            AccessToken = accessToken;
            RefreshToken = refreshToken;
        }

        /// <summary>
        /// 外部用户唯一标识（对应 OIDC 的 sub claim）
        /// </summary>
        public string SubjectId => Principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? throw new RqEx("OIDC token 缺少 sub claim");

        /// <summary>
        /// IdP 的 Issuer
        /// </summary>
        public string Issuer => Principal.FindFirstValue(JwtRegisteredClaimNames.Iss)
            ?? throw new RqEx("OIDC token 缺少 iss claim");

        public string? Name => Principal.FindFirstValue("name");
        public string? Email => Principal.FindFirstValue("email");
    }
}
