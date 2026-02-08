using AARC.WebApi.Services.Identities.AuthGrants;

namespace AARC.WebApi.Services.Identities;

public static class IdentitiesServices
{
    public static IServiceCollection AddIdentitiesServices(this IServiceCollection services)
    {
        services.AddScoped<AuthGrantOwnerService>();
        services.AddScoped<AuthGrantCheckService>();
        services.AddScoped<UserHistoryService>();
        return services;
    }
}