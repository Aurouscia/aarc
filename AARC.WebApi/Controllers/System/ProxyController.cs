using AspNetCore.Proxy;
using AspNetCore.Proxy.Options;
using Microsoft.AspNetCore.Mvc;
using NSwag.Annotations;
using System.Net;

namespace AARC.WebApi.Controllers.System
{
    [OpenApiIgnore]
    public class ProxyController : Controller
    {
        [Route("/proxy/icon/{url}")]
        public async Task Icon(string url)
        {
            url = WebUtility.UrlDecode(url);
            if (!IsUrlAllowed(url))
            {
                await Response.WriteAsync("不允许代理该url");
                return;
            }
            var options = HttpProxyOptionsBuilder.Instance
                .WithShouldAddForwardedHeaders(false)
                .WithBeforeSend((c, hrm) =>
                {
                    hrm.Headers.Remove("Authorization");
                    hrm.Headers.Remove("Cookie");
                    hrm.Headers.Remove("Proxy-Authorization");
                    return Task.CompletedTask;
                })
                .WithAfterReceive((c, hrm) =>
                {
                    var contentType = hrm.Content?.Headers?.ContentType?.MediaType;
                    if (contentType == null || !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    {
                        c.Response.StatusCode = 403;
                        return Task.CompletedTask;
                    }
                    return Task.CompletedTask;
                })
                .WithHandleFailure((c, e) =>
                {
                    c.Response.StatusCode = 403;
                    return Task.CompletedTask;
                }).Build();
            await this.HttpProxyAsync(url, options);
        }

        [Route("/proxy/json/{url}")]
        public async Task Json(string url)
        {
            url = WebUtility.UrlDecode(url);
            if (!IsUrlAllowed(url))
            {
                await Response.WriteAsync("不允许代理该url");
                return;
            }
            var options = HttpProxyOptionsBuilder.Instance
                .WithShouldAddForwardedHeaders(false)
                .WithBeforeSend((c, hrm) =>
                {
                    hrm.Headers.Remove("Authorization");
                    hrm.Headers.Remove("Cookie");
                    hrm.Headers.Remove("Proxy-Authorization");
                    return Task.CompletedTask;
                })
                .WithAfterReceive((c, hrm) =>
                {
                    var contentType = hrm.Content?.Headers?.ContentType?.MediaType;
                    if (contentType != "application/json")
                    {
                        c.Response.StatusCode = 403;
                        return Task.CompletedTask;
                    }
                    return Task.CompletedTask;
                })
                .WithHandleFailure((c, e) =>
                {
                    c.Response.StatusCode = 403;
                    return Task.CompletedTask;
                }).Build();
            await this.HttpProxyAsync(url, options);
        }

        #region 确保url为http(s)且指向公网
        private static bool IsUrlAllowed(string url)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
                return false;
            return
                IsProtocolAllowed(uri.Scheme) &&
                IsPortAllowed(uri.Port) &&
                !IsHostPrivateOrLoopbackIP(uri.Host);
        }
        private static bool IsProtocolAllowed(string scheme)
        {
            return scheme.Equals("http", StringComparison.OrdinalIgnoreCase) ||
                   scheme.Equals("https", StringComparison.OrdinalIgnoreCase);
        }
        private static bool IsPortAllowed(int port)
        {
            return port == 80 || port == 443;
        }
        private static bool IsHostPrivateOrLoopbackIP(string host)
        {
            if (IPAddress.TryParse(host, out var ip))
                return IsPrivateIP(ip);
            try
            {
                var addresses = Dns.GetHostAddresses(host);
                return addresses.Any(IsPrivateIP);
            }
            catch
            {
                return true; //悲观
            }
        }
        private static bool IsPrivateIP(IPAddress ip)
            => IPAddress.IsLoopback(ip) || IsPrivateIPv4(ip) || IsPrivateIPv6(ip);
        private static bool IsPrivateIPv4(IPAddress ip)
        {
            var bytes = ip.GetAddressBytes();
            return bytes[0] == 10 ||
                   (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
                   (bytes[0] == 192 && bytes[1] == 168);
        }
        private static bool IsPrivateIPv6(IPAddress ip)
            => ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal;
        #endregion
    }
}
