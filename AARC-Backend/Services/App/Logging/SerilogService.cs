using AARC.Services.App.Logging;
using Serilog;

namespace AARC.Services.App.Logging
{
    public static class SerilogService
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
