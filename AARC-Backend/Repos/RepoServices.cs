using AARC.Repos.Files;
using AARC.Repos.Identities;
using AARC.Repos.Saves;

namespace AARC.Repos
{
    public static class RepoServices
    {
        public static IServiceCollection AddRepoServices(
            this IServiceCollection services)
        {
            services.AddScoped<UserRepo>();
            services.AddScoped<AuthGrantRepo>();
            services.AddScoped<SaveRepo>();
            services.AddScoped<UserFileRepo>();
            return services;
        }
    }
}
