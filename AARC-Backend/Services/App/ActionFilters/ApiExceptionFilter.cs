using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using static System.Net.Mime.MediaTypeNames;
using AARC.Models.Common;

namespace AARC.Services.App.ActionFilters
{
    public class ApiExceptionFilter(ILogger<ApiExceptionFilter> logger)
        : ExceptionFilterAttribute
    {
        private readonly ILogger<ApiExceptionFilter> _logger = logger;

        public override void OnException(ExceptionContext context)
        {
            // 如果异常没有被处理则进行处理
            if (context.ExceptionHandled == false)
            {
                Exception ex = context.Exception;
                string msg = ex.Message ?? "服务器内部错误";
                string path = context.HttpContext.Request.Path;
                string method = context.HttpContext.Request.Method;

                _logger.LogError(ex, "未经处理的异常 {Method} {path}", method, path);

                context.Result = new ContentResult()
                {
                    StatusCode = 200,
                    Content = JsonConvert.SerializeObject(new ApiResponse(null, false, "未知错误：" + msg)),
                    ContentType = Application.Json
                };
            }
            // 设置为true，表示异常已经被处理了
            context.ExceptionHandled = true;
        }
    }
}
