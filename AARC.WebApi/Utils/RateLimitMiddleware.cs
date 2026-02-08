using AARC.WebApi.Controllers.System;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Caching.Memory;

namespace AARC.WebApi.Utils;

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private static RateLimitAttribute DefaultRateLimitAttribute 
        => new(20, 10);

    public RateLimitMiddleware(RequestDelegate next, IMemoryCache cache)
    {
        _next = next;
        _cache = cache;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 必须是 Controller 动作才限流
        var endpoint = context.GetEndpoint();
        if (endpoint is null) { await _next(context); return; }

        // 如果是对于 ProxyController 的请求：直接放行
        var desc = endpoint.Metadata.GetMetadata<ControllerActionDescriptor>();
        if(desc is not null && desc.ControllerTypeInfo.Name == nameof(ProxyController)) {
            await _next(context);
            return;
        }

        var rateLimit = GetRateLimit(endpoint);  // 读 Attribute
        if (rateLimit is null) { await _next(context); return; }

        var ip = GetClientIp(context);
        var cacheKey = $"rateLimit:{ip}:{endpoint.DisplayName}"; 
        
        var span = TimeSpan.FromSeconds(rateLimit.Seconds);
        var maxReq = rateLimit.MaxRequests;

        // 原子操作：拿到或创建该 IP 的时间戳队列
        var queue = _cache.GetOrCreate<Queue<DateTime>>(cacheKey, entry =>
        {
            entry.SlidingExpiration = span;   // 无访问就自动回收
            return new Queue<DateTime>(maxReq);
        })!;

        lock (queue)   // 队列实例维度锁，粒度足够小
        {
            // 踢掉过期时间戳
            while (queue.Count > 0 && DateTime.UtcNow - queue.Peek() > span)
                queue.Dequeue();

            // 超过阈值 => 短路
            if (queue.Count >= maxReq)
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                return;
            }

            queue.Enqueue(DateTime.UtcNow);
        }

        await _next(context);
    }
    
    // 读取 Attribute 并缓存
    private RateLimitAttribute? GetRateLimit(Endpoint endpoint)
    {
        // 用 DisplayName 当缓存 key（Controller:Action）
        var key = $"meta:{endpoint.DisplayName}";
        return _cache.GetOrCreate(key, entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromHours(24); // 编译完基本不会变
            // 先读方法，再读控制器，都没有就用全局默认值
            return endpoint.Metadata.GetMetadata<RateLimitAttribute>()
                ?? DefaultRateLimitAttribute;
        });
    }

    private static string GetClientIp(HttpContext ctx)
    {
        var ip = ctx.Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrWhiteSpace(ip))
            return ip.Split(',', StringSplitOptions.RemoveEmptyEntries)[0].Trim();
        return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
public sealed class RateLimitAttribute : Attribute
{
    public int Seconds { get; }
    public int MaxRequests { get; }

    public RateLimitAttribute(int seconds, int maxRequests)
    {
        Seconds = seconds;
        MaxRequests = maxRequests;
    }
}

public static class RateLimitExtensions
{
    public static IApplicationBuilder UseIpRateLimit(this IApplicationBuilder builder)
        => builder.UseMiddleware<RateLimitMiddleware>();
}