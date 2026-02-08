using AARC.WebApi.Services.App.ActionFilters;
using AARC.WebApi.Services.App.Authentication;
using AARC.WebApi.Services.App.Config;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.App.Logging;
using AARC.WebApi.Services.App.Mapping;
using AARC.WebApi.Services.App.OpenApi;
using AARC.WebApi.Utils;
using AspNetCore.Proxy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using AARC.WebApi.Services.App.Turnstile;
using AARC.WebApi.Services.Identities.AuthGrants;

namespace AARC.WebApi.Services.App
{
    public static class AppServices
    {
        public static IServiceCollection AddAppServices(
            this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
        {
            services.AddCors(config);
            services.AddSerilog(config, env);
            services.AddJwtService(config);
            services.AddProxies();
            services.AddControllers(options =>
            {
                options.Filters.Add<ApiExceptionFilter>();
            }).AddNewtonsoftJson(x =>
            {
                x.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            });
            services.Configure<ApiBehaviorOptions>(opt =>
            {
                opt.SuppressModelStateInvalidFilter = true;
            });
            services.AddResponseCompression();
            services.Configure<BrotliCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Optimal;
            });
            services.Configure<GzipCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Optimal;
            });
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddHttpClient();
            services.AddMemoryCache();
            services.AddScoped<HttpUserIdProvider>();
            services.AddScoped<HttpUserInfoService>();
            services.AddScoped<UserCheckFilter>();

            services.AddSingleton<MasterKeyChecker>();
            services.AddNSwagDocument();
            services.AddSingleton<NSwagTsGenService>();
            services.AddSingleton<TurnstileVerifyService>();

            services.AddScoped<AuthGrantOwnerService>();
            services.AddScoped<AuthGrantCheckService>();

            services.SetupAutoMapper(config);
            return services;
        }
    }
}
