using AspNetCore.Proxy;
using AspNetCore.Proxy.Options;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace AARC.Controllers.System
{
    public class ProxyController : Controller
    {
        [Route("/proxy/icon/{url}")]
        public async Task Icon(string url)
        {
            url = WebUtility.UrlDecode(url);
            if (!IsUrlAllowed(url))            
                await Response.WriteAsync("不允许代理该url");
            else
                await this.HttpProxyAsync(url, _httpOptions);
        }

        #region httpProxy配置
        private static readonly HttpProxyOptions _httpOptions = HttpProxyOptionsBuilder.Instance
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
                hrm.Headers.Add("Access-Control-Allow-Origin", "http://localhost:5173");
                return Task.CompletedTask;
            })
            .WithHandleFailure((c, e) =>
            {
                c.Response.StatusCode = 403;
                return Task.CompletedTask;
            }).Build();
        #endregion

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
            var addresses = Dns.GetHostAddresses(host);
            return addresses.Any(IsPrivateIP);
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
