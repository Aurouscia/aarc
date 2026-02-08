using AARC.Services.App.HttpAuthInfo;
using Serilog;

namespace AARC.Services.App.Logging
{
    public class SerilogUserIdReadingMiddleware(
        RequestDelegate next,
        IDiagnosticContext diagnosticContext)
    {
        public async Task InvokeAsync(
            HttpContext httpContext,
            HttpUserIdProvider httpUserIdProvider)
        {
            var uid = httpUserIdProvider.UserIdLazy.Value;
            diagnosticContext.Set("UserId", uid);
            await next(httpContext);
        }
    }
}
