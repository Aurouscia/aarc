using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.Extensions.Options;

namespace AARC.WebApi.Utils;

public static class HttpsRedirectionByConfigExtensions
{
    /// <summary>
    /// 根据 appsettings.json 中的 HttpsRedirection 配置，条件性地启用 HTTPS 重定向。
    /// 默认不启用；启用后可指定跳转状态码（307/308）和目标 HTTPS 端口。
    /// </summary>
    public static WebApplication UseHttpsRedirectionByConfig(this WebApplication app)
    {
        var section = app.Configuration.GetSection("HttpsRedirection");
        var enabled = section.GetValue<bool?>("Enabled") ?? false;
        if (!enabled)
        {
            return app;
        }

        var permanent = section.GetValue<bool?>("Permanent") ?? false;
        var port = section.GetValue<int?>("Port") ?? 443;

        var options = new HttpsRedirectionOptions
        {
            RedirectStatusCode = permanent
                ? StatusCodes.Status308PermanentRedirect
                : StatusCodes.Status307TemporaryRedirect,
            HttpsPort = port
        };

        app.UseMiddleware<HttpsRedirectionMiddleware>(Options.Create(options));
        return app;
    }
}
