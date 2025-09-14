using AARC.Services.App.OpenApi;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.System
{
    [ApiController]
    [Route("dev/[action]")]
    public class DevController(
        NSwagTsGenService nSwagTsGenService,
        IWebHostEnvironment env)
        : ControllerBase
    {
        public async Task<string> GenApiTsClient()
        {
            if (!env.IsDevelopment())
                return "仅在开发环境可用";
            var codeLength = await nSwagTsGenService.GenApiTsClient();
            return $"生成成功，长度 {codeLength}";
        }
    }
}
