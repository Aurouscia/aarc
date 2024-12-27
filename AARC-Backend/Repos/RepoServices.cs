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
            services.AddScoped<SaveRepo>();
            return services;
        }
    }
}
