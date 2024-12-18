using AARC.Models.Db.Context;
using AARC.Services.App;
using AARC.Services.App.Logging;
using Serilog;

try
{ 
    var builder = WebApplication.CreateBuilder(args);
    var c = builder.Configuration;

    //添加数据库
    builder.Services.AddDb(c);
    //添加应用级服务（controller、serilog、jwt等）
    builder.Services.AddAppServices(c);

    var app = builder.Build();

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
