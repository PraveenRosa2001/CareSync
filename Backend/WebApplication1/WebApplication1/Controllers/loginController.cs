
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Numerics;
using System.Security.Claims;
using System.Text;
using WebApplication1.Data;
using System.Security.Cryptography;

using WebApplication1.Models;

namespace webapplication3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public LoginController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }


        //This login model used for the login only
        public class LoginModel
        {
            public string? Username { get; set; }
            public string? Password { get; set; }
        }


        private string Hashpassword(string password)
        {


            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(password);
                var hash = sha256.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }

        [HttpPost("Login")]
        public IActionResult Login([FromBody] LoginModel login)
        {
            if (login == null || string.IsNullOrEmpty(login.Username) || string.IsNullOrEmpty(login.Password))
            {
                return BadRequest("Invalid login request");
            }

            // Check if the username exists
            var user = _context.MED_USER_DETAILS
                        .FirstOrDefault(u => u.MUD_USER_NAME == login.Username);

            if (user == null)
            {
                return Unauthorized("Invalid username");
            }
            var hashedInputPassword = Hashpassword(login.Password);
            // Check if the password matches


            // Check if either the plain password or hashed password matches
            if (user.MUD_PASSWORD != login.Password && user.MUD_PASSWORD != hashedInputPassword)
            {
                return Unauthorized("Invalid password");
            }




            /* if (user.MUD_PASSWORD != login.Password )
             {
                 return Unauthorized("Invalid password");
             }*/

            // Generate the JWT token if credentials are correct
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:SecretKey"]);

            var claims = new[]
            {
        new Claim(ClaimTypes.Name, user.MUD_USER_NAME),
        new Claim(ClaimTypes.Role, user.MUD_USER_TYPE)
    };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new
            {
                Message = "Login successful",
                Role = user.MUD_USER_TYPE,
                Token = tokenString,
                Name = login.Username,
                id = user.MUD_USER_ID
            });
        }
    }
}




