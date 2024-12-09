using AARC.Models.Db.Context;

var builder = WebApplication.CreateBuilder(args);
var c = builder.Configuration;

builder.Services.AddControllers();
builder.Services.AddDb(c);

var app = builder.Build();

app.UseFileServer();
app.UseRouting();
app.UseAuthorization();

app.MapControllerRoute(
    name: "api",
    pattern: "api/{controller}/{action}");

app.Run();
