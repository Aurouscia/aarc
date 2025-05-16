using System.Reflection;

namespace AARC.Services.App.Mapping
{
    public static class AutoMapperSetup
    {
        public static IServiceCollection SetupAutoMapper(this IServiceCollection services)
        {
            services.AddAutoMapper(Assembly.GetExecutingAssembly());
            return services;
        }
    }
}
