using AARC.Services.App.ActionFilters;
using AARC.Services.App.Authentication;
using AARC.Services.App.HttpAuthInfo;

namespace AARC.Services.Files
{
    public static class FilesServices
    {
        public static IServiceCollection AddFilesServices(
            this IServiceCollection services)
        {
            services.AddSingleton<SaveMiniatureFileService>();
            return services;
        }
    }
    public static class FilesMapping
    {
        public static IApplicationBuilder UseAppendedStaticFiles(
            this IApplicationBuilder app, IWebHostEnvironment env)
        {
            var contentPath = env.ContentRootPath;
            app.UseSaveMiniatureFiles(contentPath);
            return app;
        }
    }
}
