using AARC.Services.App.Logging;
using Serilog;
using Serilog.Events;

namespace AARC.Services.App.Logging
{
    public static class SerilogService
    {
        public static IServiceCollection AddSerilog(
            this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
        {
            var logger = new LoggerConfiguration()
                .ReadFrom.Configuration(config)
                .WriteTo.Debug()
                .WriteTo.Console()
                .WriteTo.File(
                    path: Path.Combine(env.ContentRootPath, "Logs", "log-.txt"),
                    rollingInterval: RollingInterval.Day,
                    outputTemplate: "{Timestamp:HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}",
                    shared: true,
                    rollOnFileSizeLimit: true,
                    fileSizeLimitBytes: 500000,
                    retainedFileCountLimit: 60)
                .CreateLogger();
            services.AddSerilog(logger);
            Log.Logger = logger;
            return services;
        }

        public static IApplicationBuilder UseSerilog(this IApplicationBuilder app)
        {
            app.UseSerilogRequestLogging(options =>
            {
                options.MessageTemplate 
                    = "HTTP {RequestMethod} by {UserId} {RequestPath}{QueryString}{RequestLength}" +
                    " => code {StatusCode}{ResponseLength} in {Elapsed:0.000}ms";

                options.GetLevel = (httpContext, elapsed, ex) =>
                {
                    if (ex is not null)
                        return LogEventLevel.Error;
                    if (elapsed > 3000)
                        return LogEventLevel.Warning;
                    return LogEventLevel.Information;
                };

                options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
                {
                    var requestQuery = httpContext.Request.QueryString;
                    diagnosticContext.Set("QueryString", requestQuery);

                    var requestLength = httpContext.Request.ContentLength;
                    var reqLengthText = string.Empty;
                    if (requestLength is long reqLength)
                        reqLengthText = $" with {reqLength} bytes";
                    diagnosticContext.Set("RequestLength", reqLengthText);

                    var responseLength = httpContext.Response.ContentLength;
                    var respLengthText = string.Empty;
                    if (responseLength is long respLength)
                        respLengthText = $" with {respLength} bytes";
                    diagnosticContext.Set("ResponseLength", respLengthText);
                };
            });

            app.UseMiddleware<SerilogUserIdReadingMiddleware>();
            return app;
        }
    }
}
