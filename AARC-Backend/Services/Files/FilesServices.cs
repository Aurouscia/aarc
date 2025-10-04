namespace AARC.Services.Files
{
    public static class FilesServices
    {
        public static IServiceCollection AddFilesServices(
            this IServiceCollection services)
        {
            services.AddSingleton<SaveMiniatureFileService>();
            services.AddSingleton<SaveBackupFileService>();
            services.AddSingleton<UserFileService>();
            return services;
        }
    }
    public static class FilesMapping
    {
        public static IApplicationBuilder UseAppendedStaticFiles(
            this IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseSaveMiniatureFiles(env);
            app.UseUserFiles();
            return app;
        }
    }
}
