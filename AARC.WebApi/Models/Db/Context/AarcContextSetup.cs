using AARC.Models.Db.Context.Specific;

namespace AARC.Models.Db.Context
{
    public static class AarcContextSetup
    {
        public static IServiceCollection AddDb(this IServiceCollection services, IConfiguration config)
        {
            var section = config.GetSection("Db");
            var options = new AarcContextOptions();
            section.Bind(options);
            services.AddSingleton(options);

            string dbType = options.Type?.ToLower() 
                ?? throw new Exception("数据库类型(配置项Db:Type)未填");

            if (dbType == "sqlite")
                services.AddDbContext<AarcContext, AarcSqliteContext>();
            else
                throw new Exception("不支持的数据库类型(配置项Db:Type)");

            return services;
        }
    }
}
