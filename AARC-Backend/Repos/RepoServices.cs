using AARC.Repos.Identities;

namespace AARC.Repos
{
    public static class RepoServices
    {
        public static IServiceCollection AddRepoServices(
            this IServiceCollection services)
        {
            services.AddScoped<UserRepo>();
            return services;
        }
    }
}
