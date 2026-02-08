global using RqEx = AARC.WebApi.Utils.Exceptions.RequestInvalidException;
using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Repos;
using AARC.WebApi.Services.App;
using AARC.WebApi.Services.App.Logging;
using AARC.WebApi.Services.Files;
using AARC.WebApi.Services.Identities;
using AARC.WebApi.Services.Saves;
using AARC.WebApi.Utils;
using Serilog;

try
{ 
    var builder = WebApplication.CreateBuilder(args);
    builder.Configuration.AddJsonFile("appsettingsLocal.json", optional: true);
    var c = builder.Configuration;
    var e = builder.Environment;

    //添加数据库
    builder.Services.AddDb(c);
    //添加应用级服务（controller、serilog、jwt等）
    builder.Services.AddAppServices(c, e);
    //添加数据库操作服务
    builder.Services.AddRepoServices();
    //添加文件存储服务
    builder.Services.AddFilesServices();
    //添加存档处理服务
    builder.Services.AddSavesServices();
    //添加身份有关服务
    builder.Services.AddIdentitiesServices();
    
    var app = builder.Build();
    if (app.Environment.IsDevelopment())
    {
        app.UseOpenApi();
        app.UseSwaggerUi();
    }
    app.UseConfiguredCors();
    app.UseFileServer();
    app.UseAppendedStaticFiles(e);
    app.UseRouting();
    app.UseIpRateLimit();
    app.UseAuthorization();
    app.UseSerilog();
    app.UseResponseCompression();
    app.MapControllers();

    Log.Information("AARC启动成功=============================================");
    app.Run();
}
catch (Exception ex)
{
    if (ex is not HostAbortedException)
        Log.Error(ex, "AARC启动失败=============================================");
}
finally
{
    Log.CloseAndFlush();
}
