using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using WebApplication1.Data;

namespace webapplication3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public LoginController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public class LoginModel
        {
            public string? Username { get; set; }
            public string? Password { get; set; }
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        [AllowAnonymous]
        [HttpPost("Login")]
        public IActionResult Login([FromBody] LoginModel login)
        {
            if (login == null ||
                string.IsNullOrWhiteSpace(login.Username) ||
                string.IsNullOrWhiteSpace(login.Password))
            {
                return BadRequest("Invalid login request");
            }

            var username = login.Username.Trim();

            // Keep compatibility with all existing CareSync staff accounts.
            var user = _context.MED_USER_DETAILS
                .FirstOrDefault(u => u.MUD_USER_NAME == username);

            if (user == null)
            {
                return Unauthorized("Invalid username");
            }

            var hashedInputPassword = HashPassword(login.Password);

            // Existing database rows may contain either the old plain-text value
            // or the SHA256 value. Do NOT force a password migration during login.
            if (user.MUD_PASSWORD != login.Password &&
                user.MUD_PASSWORD != hashedInputPassword)
            {
                return Unauthorized("Invalid password");
            }

            var jwtSecretKey = _configuration["Jwt:SecretKey"];
            if (string.IsNullOrWhiteSpace(jwtSecretKey))
            {
                return StatusCode(500, "JWT secret key is not configured.");
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey));

            var claims = new List<Claim>
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.MUD_USER_ID ?? string.Empty),
                new Claim(
                    ClaimTypes.Name,
                    user.MUD_USER_NAME ?? username),
                new Claim(
                    ClaimTypes.Role,
                    user.MUD_USER_TYPE ?? string.Empty)
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: new SigningCredentials(
                    key,
                    SecurityAlgorithms.HmacSha256)
            );

            var tokenString = new JwtSecurityTokenHandler()
                .WriteToken(token);

            return Ok(new
            {
                Message = "Login successful",
                Role = user.MUD_USER_TYPE,
                Token = tokenString,
                Name = user.MUD_USER_NAME,
                id = user.MUD_USER_ID
            });
        }

        [Authorize]
        [HttpGet("validate-token")]
        public IActionResult ValidateToken()
        {
            return Ok(new
            {
                valid = true,
                userId = User.FindFirstValue(ClaimTypes.NameIdentifier),
                username = User.Identity?.Name,
                role = User.FindFirstValue(ClaimTypes.Role)
            });
        }
    }
}
