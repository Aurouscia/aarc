using AARC.Models.Db.Context;
using AARC.Repos;
using AARC.Services.App;
using AARC.Services.App.Logging;
using AARC.Utils;
using Serilog;

try
{ 
    var builder = WebApplication.CreateBuilder(args);
    var c = builder.Configuration;

    //添加数据库
    builder.Services.AddDb(c);
    //添加应用级服务（controller、serilog、jwt等）
    builder.Services.AddAppServices(c);
    //添加数据库操作服务
    builder.Services.AddRepoServices();

    var app = builder.Build();

    app.UseConfiguredCors();
    app.UseFileServer();
    app.UseRouting();
    app.UseAuthorization();
    app.UseSerilogRequestLogging();
    app.MapControllerRoute(
        name: "api",
        pattern: "api/{controller}/{action}");

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
