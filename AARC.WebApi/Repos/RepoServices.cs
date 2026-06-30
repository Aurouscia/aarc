using AARC.WebApi.Repos.Files;
using AARC.WebApi.Repos.Identities;
using AARC.WebApi.Repos.Saves;

namespace AARC.WebApi.Repos
{
    public static class RepoServices
    {
        public static IServiceCollection AddRepoServices(
            this IServiceCollection services)
        {
            services.AddScoped<UserRepo>();
            services.AddScoped<AuthGrantRepo>();
            services.AddScoped<UserFileRepo>();
            services.AddScoped<UserFavoriteRepo>();
            services.AddScoped<SaveRepo>();
            services.AddScoped<SaveFolderRepo>();
            services.AddScoped<SaveFolderRelationRepo>();
            services.AddScoped<SaveCommentRepo>();
            return services;
        }
    }
}
