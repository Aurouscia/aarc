using AARC.Services;
using Serilog;

namespace AARC.Services
{
    public static class Logger
    {
        public static IServiceCollection AddSerilog(this IServiceCollection services, IConfiguration config)
        {
            var logger = new LoggerConfiguration()
                .ReadFrom.Configuration(config)
                .CreateLogger();
            services.AddSerilog(logger);
            Log.Logger = logger;
            return services;
        }
    }
}
