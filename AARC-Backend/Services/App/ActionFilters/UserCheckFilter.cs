using AARC.Models.DbModels.Identities;
using AARC.Services.App.HttpAuthInfo;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Net;
using static System.Net.Mime.MediaTypeNames;

namespace AARC.Services.App.ActionFilters
{
    public class UserCheckFilter(
        HttpUserIdProvider httpUserIdProvider,
        HttpUserInfoService httpUserInfoService
        ) : IAsyncResourceFilter
    {
        public UserType Level { get; set; }

        public async Task OnResourceExecutionAsync(
            ResourceExecutingContext context,
            ResourceExecutionDelegate next)
        {
            string? errmsg = null;
            var uid = httpUserIdProvider.UserIdLazy.Value;
            if (uid <= 0)
            {
                // 先检查是否登录
                errmsg = "请登录";
            }
            else
            {
                // 若已登录，按等级要求判断怎么检查
                if (Level == UserType.Tourist)
                {
                    // 无等级要求：确保账号存在即可
                    if (!httpUserInfoService.GetUserExist())
                        errmsg = "账号已停用";
                }
                else
                {
                    // 有等级要求：获取用户的等级（如果用户不存在会得到默认值Tourist，必不会通过）
                    UserType level = httpUserInfoService.UserInfo.Value.Type;
                    if (level < Level)
                        errmsg = "权限等级不足";
                }
            }
            if (errmsg is { })
            {
                // 如果有errmsg，则设置context.Result（造成短路，直接返回响应）
                context.Result = new ContentResult()
                {
                    Content = errmsg,
                    ContentType = Text.Plain,
                    StatusCode = (int)HttpStatusCode.Forbidden,
                };
            }
            else
                await next();
        }
    }

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class UserCheckAttribute(
        UserType level = UserType.Tourist)
        : Attribute, IFilterFactory
    {
        public bool IsReusable => false;
        public UserType Level { get; set; } = level;

        public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
        {
            var f = serviceProvider.GetRequiredService<UserCheckFilter>();
            f.Level = Level;
            return f;
        }
    }
}
