using Microsoft.AspNetCore.Authentication.JwtBearer;
using NSwag.Generation.Processors.Security;
using NSwag;

namespace AARC.WebApi.Services.App.OpenApi
{
    public static class NSwagService
    {
        public const string documentName = "v1";
        public static IServiceCollection AddNSwagDocument(
            this IServiceCollection services)
        {
            services.AddOpenApiDocument(document =>
            {
                document.Title = "AARC";
                document.DocumentName = documentName;
                document.AddSecurity(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
                {
                    Type = OpenApiSecuritySchemeType.Http,
                    Scheme = JwtBearerDefaults.AuthenticationScheme,
                    BearerFormat = "JWT",
                    Description = "输入 JWT token"
                });
                document.OperationProcessors.Add(
                    new AspNetCoreOperationSecurityScopeProcessor(JwtBearerDefaults.AuthenticationScheme));
            });
            return services;
        }
    }
}
