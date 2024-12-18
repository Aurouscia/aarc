using AARC.Models.Db.Context;
using AARC.Services.App;
using AARC.Services.App.Logging;
using Serilog;

try
{ 
    var builder = WebApplication.CreateBuilder(args);
    var c = builder.Configuration;

    //������ݿ�
    builder.Services.AddDb(c);
    //���Ӧ�ü�����controller��serilog��jwt�ȣ�
    builder.Services.AddAppServices(c);

    var app = builder.Build();

    app.UseFileServer();
    app.UseRouting();
    app.UseAuthorization();

    app.UseSerilogRequestLogging();

    app.MapControllerRoute(
        name: "api",
        pattern: "api/{controller}/{action}");

    Log.Information("AARC�����ɹ�=============================================");
    app.Run();
}
catch (Exception ex)
{
    if (ex is not HostAbortedException)
        Log.Error(ex, "AARC����ʧ��=============================================");
}
finally
{
    Log.CloseAndFlush();
}
