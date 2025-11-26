using AARC.Models.DbModels.Enums.AuthGrantTypes;
using AARC.Models.DbModels.Identities;
using AARC.Repos.Identities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AARC.Controllers.Identities
{
    [Authorize]
    [ApiController]
    [Route(ApiConsts.routePattern)]
    public class AuthGrantController(
        AuthGrantRepo authGrantRepo
    ) : Controller
    {
        [HttpGet]
        public List<AuthGrant> Load(AuthGrantOn on, int onId, byte type)
        {
            return authGrantRepo.LoadAuthGrants(on, onId, type);
        }

        [HttpPost]
        public bool Create([FromBody]AuthGrant item)
        {
            authGrantRepo.CreateAuthGrant(item);
            return true;
        }

        [HttpPost]
        public bool SetPriorities(AuthGrantOn on, int onId, byte type, [FromBody]List<int> ids)
        {
            authGrantRepo.SetAuthGrantPriorities(on, onId, type, ids);
            return true;
        }

        [HttpDelete]
        public bool Remove(AuthGrant item)
        {
            authGrantRepo.RemoveAuthGrant(item);
            return true;
        }

        /// <summary>
        /// 为了确保前端生成 AuthGrantType 有关enum类型
        /// </summary>
        [HttpGet]
        public bool Types(AuthGrantTypeOfSave t0) => true;
    }
}