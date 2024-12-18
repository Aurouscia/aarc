using AARC.Services.App.ActionFilters;
using AARC.Services.App.Authentication;
using AARC.Services.App.HttpAuthInfo;
using AARC.Services.App.Logging;

namespace AARC.Services.App
{
    public static class AppServices
    {
        public static IServiceCollection AddAppServices(
            this IServiceCollection services, IConfiguration config)
        {
            services.AddSerilog(config);
            services.AddJwtService(config);
            services.AddControllers(options =>
            {
                options.Filters.Add<ApiExceptionFilter>();
            });
            services.AddScoped<HttpUserIdProvider>();
            services.AddScoped<HttpUserInfoService>();
            return services;
        }
    }
}
