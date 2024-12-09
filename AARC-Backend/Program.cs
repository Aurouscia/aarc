using AARC.Models.Db.Context;
using AARC.Services;
using Serilog;

try
{ 
    var builder = WebApplication.CreateBuilder(args);
    var c = builder.Configuration;

    builder.Services.AddSerilog(c);
    builder.Services.AddDb(c);
    builder.Services.AddControllers();

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
