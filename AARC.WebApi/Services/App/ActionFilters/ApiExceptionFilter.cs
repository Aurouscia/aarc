using AARC.WebApi.Utils.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Net;
using static System.Net.Mime.MediaTypeNames;

namespace AARC.WebApi.Services.App.ActionFilters
{
    public class ApiExceptionFilter(
        ILogger<ApiExceptionFilter> logger,
        IWebHostEnvironment env
        ): ExceptionFilterAttribute
    {
        public override void OnException(ExceptionContext context)
        {
            // 如果异常没有被处理则进行处理
            if (context.ExceptionHandled == false)
            {
                Exception ex = context.Exception;
                string path = context.HttpContext.Request.Path;
                string method = context.HttpContext.Request.Method;
                if (ex is RequestInvalidException rqex)
                {
                    context.Result = new ContentResult()
                    {
                        Content = rqex.Message,
                        ContentType = Text.Plain,
                        StatusCode = (int)rqex.StatusCode,
                    };
                }
                else
                {
                    logger.LogError(ex, "意料外的异常 {Method} {path}", method, path);
                    string? msg = env.IsDevelopment() ? ex.Message : null;
                    context.Result = new ContentResult()
                    {
                        Content = msg,
                        ContentType = Text.Plain,
                        StatusCode = (int)HttpStatusCode.InternalServerError
                    };
                }
            }
            // 设置为true，表示异常已经被处理了
            context.ExceptionHandled = true;
        }
    }
}
