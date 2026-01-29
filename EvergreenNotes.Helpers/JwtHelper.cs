using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using EvergreenNotes.Domain.Entities;

namespace EvergreenNotes.Helpers
{
    public static class JwtHelper
    {
        private static string SecretKey = "HKxELuA1ob0B/8Er09QIDaw1WqDs1KFsYtOlI38vejo0+RsukH2MckPZyL9ZXt/R";

        public static string GenerateToken(User user, int expireMinutes = 60)
        {
            var now = DateTime.UtcNow;

            var key = Encoding.UTF8.GetBytes(SecretKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email)
                }),
                Expires = now.AddMinutes(expireMinutes),
                IssuedAt = now,
                NotBefore = now,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}