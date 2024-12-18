using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using static System.Net.Mime.MediaTypeNames;

namespace AARC.Models.Common
{
    public class ApiResponse
    {
        public bool Success { get; set; } = true;
        public int Code { get; set; }
        public object? Data { get; set; }
        public string? Errmsg { get; set; }
        public ApiResponse(object? obj, bool success = true, string? errmsg = null, int code = 0)
        {
            Data = obj;
            this.Success = success;
            this.Errmsg = errmsg;
            if (!success && errmsg is null)
                this.Errmsg = "服务器内部错误";
            this.Code = code;
        }
        public ContentResult BuildResult(int statusCode = 200)
        {
            return new ContentResult()
            {
                StatusCode = statusCode,
                Content = JsonConvert.SerializeObject(this),
                ContentType = Application.Json
            };
        }
    }
}
