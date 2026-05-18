namespace AARC.WebApi.Utils;

public class RequestCounterMiddleware
{
    private readonly RequestDelegate _next;
    private static int _currentRequests;
    public static int CurrentRequests => _currentRequests;

    public RequestCounterMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 排除 DevController 的计数请求本身
        var endpoint = context.GetEndpoint();
        if (endpoint is not null)
        {
            var routePattern = endpoint.DisplayName;
            if (routePattern?.Contains(nameof(Controllers.System.DevController)) is true
                && routePattern.Contains(nameof(Controllers.System.DevController.CurrentRequestCount)))
            {
                await _next(context);
                return;
            }
        }

        Interlocked.Increment(ref _currentRequests);
        try
        {
            await _next(context);
        }
        finally
        {
            Interlocked.Decrement(ref _currentRequests);
        }
    }
}

public static class RequestCounterExtensions
{
    public static IApplicationBuilder UseRequestCounter(this IApplicationBuilder builder)
        => builder.UseMiddleware<RequestCounterMiddleware>();
}
