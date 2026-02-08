using System.Reflection;

namespace AARC.WebApi.Services.App.Mapping
{
    public static class AutoMapperSetup
    {
        public static IServiceCollection SetupAutoMapper(
            this IServiceCollection services, IConfiguration config)
        {
            services.AddAutoMapper(cfg => {
                var key = config["AutoMapper:LicenseKey"];
                if(!string.IsNullOrWhiteSpace(key))
                    cfg.LicenseKey = key;
            }, Assembly.GetExecutingAssembly());
            return services;
        }
    }
}
