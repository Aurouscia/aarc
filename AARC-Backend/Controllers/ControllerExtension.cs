using AARC.Models.Common;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace AARC.Controllers
{
    public static class ControllerExtension
    {
        public static ContentResult ApiResp(
            this Controller _, object? obj = null, bool success = true)
        {
            var resp = new ApiResponse(obj, success);
            return resp.BuildResult();
        }
        public static ContentResult ApiRespFailed(
            this Controller _, string? errmsg)
        {
            var resp = new ApiResponse(null, false, errmsg);
            return resp.BuildResult();
        }
        public static ContentResult ApiResp(
            this Controller _, bool success, string? errmsg = null)
        {
            var resp = new ApiResponse(null, success, errmsg);
            return resp.BuildResult();
        }
    }
}
