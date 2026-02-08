namespace AARC.Utils
{
    public static class CorsConfigure
    {
        public const string corsPolicyName = "aarcCors";
        public static IServiceCollection AddCors(this IServiceCollection services, IConfiguration config)
        {
            var originsConfig = config.GetSection("Cors:Origins");
            var origins = new List<string>();
            originsConfig.Bind(origins);
            services.AddCors(options =>
            {
                options.AddPolicy(corsPolicyName, b =>
                {
                    b.WithOrigins([.. origins])
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });
            return services;
        }
        public static WebApplication UseConfiguredCors(this WebApplication app)
        {
            app.UseCors(corsPolicyName);
            return app;
        }
    }
}
