using AARC.Utils;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.Saves
{
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class SaveUtilsController : Controller
    {
        [HttpPost]
        public string? PinyinConvert([FromBody]PinyinConvertRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Text))
                return string.Empty;
            if (req.Text.Length > 50)
                return "<拼音转换目标过长>";
            try
            {
                return PinyinConverter.Convert(req.Text, req.Options ?? new());
            }
            catch
            {
                return "<拼音转换发生错误>";
            }
        }
        public class PinyinConvertRequest
        {
            public string? Text { get; set; }
            public PinyinConvertOptions? Options { get; set; }
        }
    }
}
