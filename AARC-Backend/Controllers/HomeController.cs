using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace AARC.Controllers
{
    public class HomeController(ILogger<HomeController> logger) : Controller
    {
        public IActionResult Index()
        {
            logger.LogInformation("��־����");
            return Ok("OK");
        }
    }
}
