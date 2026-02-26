using Serilog.Events;

namespace AARC.WebApi.Services.App.Logging;

[AttributeUsage(AttributeTargets.Method)]
public class LogLevelAttribute : Attribute
{
    public LogEventLevel Level { get; }

    public LogLevelAttribute(LogEventLevel level)
    {
        Level = level;
    }
}
