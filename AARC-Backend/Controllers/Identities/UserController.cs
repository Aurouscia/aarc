using AARC.Models.Db.Context;
using AARC.Models.DbModels;
using AARC.Repos.Identities;
using AARC.Services.App.HttpAuthInfo;
using AARC.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace AARC.Controllers.Identities
{
    public class UserController(
        UserRepo userRepo
        //HttpUserIdProvider httpUserIdProvider
        ) : Controller
    {
        public IActionResult Add(string? userName, string? password)
        {
            var success = userRepo.CreateUser(userName, password, out var errmsg);
            return this.ApiResp(success, errmsg);
        }
    }
}
