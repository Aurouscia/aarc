using AARC.Repos.Identities;
using AARC.Services.App.OpenApi;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.System
{
    [ApiController]
    [Route("dev/[action]")]
    public class DevController(
        NSwagTsGenService nSwagTsGenService)
        : ControllerBase
    {
        public async Task<string> GenApiTsClient()
        {
            var codeLength = await nSwagTsGenService.GenApiTsClient();
            return $"生成成功，长度 {codeLength}";
        }
    }
}
