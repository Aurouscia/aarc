using AARC.WebApi.Services.App.OpenApi;
using Microsoft.AspNetCore.Mvc;

namespace AARC.WebApi.Controllers.System
{
    [ApiController]
    [Route("dev/[action]")]
    public class DevController(
        NSwagTsGenService nSwagTsGenService,
        IWebHostEnvironment env)
        : ControllerBase
    {
        public async Task<string> GenApiTsClient(int writeHere = 0)
        {
            if (!env.IsDevelopment())
                return "仅在开发环境可用";
            var codeLength = await nSwagTsGenService.GenApiTsClient(writeHere != 0);
            return $"生成成功，长度 {codeLength}";
        }
    }
}
