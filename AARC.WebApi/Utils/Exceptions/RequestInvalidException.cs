using System.Net;

namespace AARC.WebApi.Utils.Exceptions
{
    public class RequestInvalidException(
        string? msg = null,
        HttpStatusCode statusCode = HttpStatusCode.Forbidden
        ) : Exception(msg ?? "未知错误")
    {
        public HttpStatusCode StatusCode { get; set; } = statusCode;
    }
}
