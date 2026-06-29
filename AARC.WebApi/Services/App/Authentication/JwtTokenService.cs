using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace AARC.WebApi.Services.App.Authentication
{
    public class JwtTokenService(IConfiguration config)
    {
        public string GenerateToken(int userId, int expireHrs = 24)
        {
            string domain = config["Jwt:Domain"] ?? throw new Exception("未找到配置项Jwt:Domain");
            string secret = config["Jwt:SecretKey"] ?? throw new Exception("未找到配置项Jwt:SecretKey");

            expireHrs = Math.Clamp(expireHrs, 3, 8760);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Nbf, $"{new DateTimeOffset(DateTime.Now).ToUnixTimeSeconds()}"),
                new Claim(JwtRegisteredClaimNames.Exp, $"{new DateTimeOffset(DateTime.Now.AddHours(expireHrs)).ToUnixTimeSeconds()}"),
                new Claim(JwtRegisteredClaimNames.NameId, userId.ToString())
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: domain,
                audience: domain,
                claims: claims,
                expires: DateTime.Now.AddHours(expireHrs),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
