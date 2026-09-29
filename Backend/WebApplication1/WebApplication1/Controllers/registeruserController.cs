using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;
using System.Threading.Tasks;
using WebApplication1.Data;
using Microsoft.EntityFrameworkCore;


namespace webapplication3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisterUserController : Controller
    {
        private readonly ApplicationDbContext _context;

        public RegisterUserController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/registeruser
        [HttpPost]
        public async Task<IActionResult> RegisterUser([FromBody] MED_APPOINTMENT_USERS newUser)
        {
            if (ModelState.IsValid)
            {
                // Check if the email or NIC already exists (optional)
                var existingUser = await _context.MED_APPOINMENT_USERS
                    .FirstOrDefaultAsync(u => u.MAU_EMAIL == newUser.MAU_EMAIL || u.MAU_NIC == newUser.MAU_NIC);

                if (existingUser != null)
                {
                    return BadRequest("User with the same email or NIC already exists.");
                }

                // Add the new user to the database
                _context.MED_APPOINMENT_USERS.Add(newUser);
                await _context.SaveChangesAsync();

                return Ok("User registered successfully");
            }

            return BadRequest(ModelState);
        }
    }
}
