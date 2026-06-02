namespace AARC.WebApi.Services.Saves;

public static class SavesServices
{
    public static IServiceCollection AddSavesServices(this IServiceCollection services)
    {
        services.AddScoped<SaveDiffService>();
        services.AddScoped<SaveDtoEnrichService>();
        services.AddSingleton<NewestSavesCacheService>();
        services.AddSingleton<SaveFolderTreeCacheService>();
        return services;
    }
}
