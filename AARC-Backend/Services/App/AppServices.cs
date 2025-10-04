using AARC.Services.App.ActionFilters;
using AARC.Services.App.Authentication;
using AARC.Services.App.Config;
using AARC.Services.App.HttpAuthInfo;
using AARC.Services.App.Logging;
using AARC.Services.App.Mapping;
using AARC.Services.App.OpenApi;
using AARC.Utils;
using AspNetCore.Proxy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;

namespace AARC.Services.App
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
            services.AddScoped<HttpUserIdProvider>();
            services.AddScoped<HttpUserInfoService>();
            services.AddScoped<UserCheckFilter>();

            services.AddSingleton<MasterKeyChecker>();
            services.AddNSwagDocument();
            services.AddSingleton<NSwagTsGenService>();

            services.SetupAutoMapper(config);
            return services;
        }
    }
}
