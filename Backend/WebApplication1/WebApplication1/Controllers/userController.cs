using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;
using System.Security.Cryptography;

using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace webapplication3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]


    //for registration of doctors and the other users
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<MED_USER_DETAILS>> PostUser([FromForm] MED_USER_DETAILS userDetails, [FromForm] IFormFile? profileImage)
        {
            if (userDetails == null)
            {
                return BadRequest("User details cannot be null.");
            }

            // Check if the email already exists
            var existingEmail = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u => u.MUD_EMAIL == userDetails.MUD_EMAIL);
            if (existingEmail != null)
            {
                return BadRequest(new { error = "Email already exists." });
            }

            // Check if the username already exists
            var existingUsername = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u => u.MUD_USER_NAME == userDetails.MUD_USER_NAME);
            if (existingUsername != null)
            {
                return BadRequest(new { error = "Username already exists." });
            }
            // Generate the new ID
            userDetails.MUD_USER_ID = await GenerateUserIdAsync();

            // Set created date
            userDetails.MUD_CREATED_DATE = DateTime.UtcNow;



            // Encrypt the password (hashing)
            userDetails.MUD_PASSWORD = Hashpassword(userDetails.MUD_PASSWORD);




            // Handle the profile image if provided
            if (profileImage != null && profileImage.Length > 0)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var filePath = Path.Combine(uploadsFolder, profileImage.FileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await profileImage.CopyToAsync(stream);
                }
                // Save the path to the database or set it in the model if required
                // userDetails.MUD_PHOTO = filePath;
            }

            // Add the user details to the database
            _context.MED_USER_DETAILS.Add(userDetails);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUserById), new { id = userDetails.MUD_USER_ID }, userDetails);
        }


        [HttpGet("doctorname/specialization")]
        public async Task<ActionResult<MED_USER_DETAILS>> GetDoctors(string? name, string? specialization)
        {
            // Correct LINQ query with logical OR
            var users = await _context.MED_USER_DETAILS
                .Where(d => d.MUD_USER_NAME == name || d.MUD_SPECIALIZATION == specialization)
                .ToListAsync();

            if (!users.Any())
            {
                return NotFound("No doctors found with the provided name or specialization.");
            }

            return Ok(users);
        }


        [HttpGet("doctorid/specialization")]
        public async Task<ActionResult<IEnumerable<MED_USER_DETAILS>>> GetDoctors1(string? userId, string? specialization)
        {
            // Ensure valid input parameters
            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(specialization))
            {
                return BadRequest("Please provide at least a User ID or specialization for the search.");
            }

            // Filter based on userId and/or specialization
            var users = await _context.MED_USER_DETAILS
                .Where(d => d.MUD_USER_ID == userId || d.MUD_SPECIALIZATION == specialization)
                .ToListAsync();

            if (!users.Any())
            {
                return NotFound("No doctors found with the provided criteria.");
            }

            return Ok(users);
        }




        [HttpDelete("{id}")]
        public async Task<ActionResult> Deleteuser(string id)
        {
            // Find the user by id
            var user = await _context.MED_USER_DETAILS.FindAsync(id);

            // Check if the user exists
            if (user == null)
            {
                return NotFound();
            }

            // Remove the user
            _context.MED_USER_DETAILS.Remove(user);

            // Save changes to the database
            await _context.SaveChangesAsync();

            return NoContent();
        }














        // GET: api/User/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MED_USER_DETAILS>> GetUserById(string id)
        {
            var userDetails = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(ud => ud.MUD_USER_ID == id);

            if (userDetails == null)
            {
                return NotFound("User not found.");
            }

            return userDetails;
        }

        // Helper method to generate user ID
        // Helper method to generate user ID
        private async Task<string> GenerateUserIdAsync()
        {
            var lastUser = await _context.MED_USER_DETAILS
                .OrderByDescending(u => u.MUD_USER_ID)
                .FirstOrDefaultAsync();

            if (lastUser == null)
            {
                return "User001";
            }

            string lastId = lastUser.MUD_USER_ID;
            int lastNumber = int.Parse(lastId.Substring(4)); // Extract the number part after "User"


            return $"User{(lastNumber + 1).ToString("D3")}";
        }


        [HttpGet("suggest")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsernameSuggestions(string query)
        {
            if (string.IsNullOrEmpty(query))
            {
                return BadRequest("Query parameter is required.");
            }

            var users = await _context.MED_USER_DETAILS
                .Where(u => u.MUD_USER_NAME.Contains(query))
                .Select(u => new
                {
                    UserId = u.MUD_USER_ID, // Assuming this is your user ID column
                    UserName = u.MUD_USER_NAME,

                })
                .Take(10)
                .ToListAsync();

            if (users == null || users.Count == 0)
            {
                return NotFound("No matching users found.");
            }

            return Ok(users);
        }

        [HttpGet("suggest/doctor")]
        public async Task<ActionResult<IEnumerable<object>>> GetUnameSuggestions(string query)
        {
            if (string.IsNullOrEmpty(query))
            {
                return BadRequest("Query parameter is required.");
            }

            var users = await _context.MED_USER_DETAILS
                .Where(u => u.MUD_FULL_NAME.Contains(query))
                .Select(u => new
                {
                    UserId = u.MUD_USER_ID, // Assuming this is your user ID column
                    UserName = u.MUD_FULL_NAME
                })
                .Take(10)
                .ToListAsync();

            if (users == null || users.Count == 0)
            {
                return NotFound("No matching users found.");
            }

            return Ok(users);
        }



        // GET: api/User
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MED_USER_DETAILS>>> GetAllUsers()
        {
            var users = await _context.MED_USER_DETAILS.ToListAsync();

            if (users == null || users.Count == 0)
            {
                return NotFound("No users found.");
            }

            return Ok(users);
        }



        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUserDetails(string id, [FromForm] MED_USER_DETAILS userDetails)
        {
            if (id != userDetails.MUD_USER_ID)
            {
                return BadRequest("User ID mismatch.");
            }

            var user = await _context.MED_USER_DETAILS.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Check if email is already used by another user
            var existingEmailUser = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u => u.MUD_EMAIL == userDetails.MUD_EMAIL && u.MUD_USER_ID != id);
            if (existingEmailUser != null)
            {
                return Conflict("The email address is already in use.");
            }

            // Check if NIC is already used by another user
            var existingNicUser = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u => u.MUD_NIC_NO == userDetails.MUD_NIC_NO && u.MUD_USER_ID != id);
            if (existingNicUser != null)
            {
                return Conflict("The NIC number is already in use.");
            }

            // Check if contact number is already used by another user
            var existingContact = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u => u.MUD_CONTACT == userDetails.MUD_CONTACT && u.MUD_USER_ID != id);

            if (existingContact != null)
            {
                return Conflict("The contact number is already in use.");
            }

            // **Only update the password if it's in plain text (not hashed)**
           

            // Update user properties
            user.MUD_USER_NAME = userDetails.MUD_USER_NAME;
            user.MUD_USER_TYPE = userDetails.MUD_USER_TYPE;
            user.MUD_SPECIALIZATION = userDetails.MUD_SPECIALIZATION;
            user.MUD_STATUS = userDetails.MUD_STATUS;
            user.MUD_NIC_NO = userDetails.MUD_NIC_NO;
            user.MUD_EMAIL = userDetails.MUD_EMAIL;
            user.MUD_CONTACT = userDetails.MUD_CONTACT;
            user.MUD_FULL_NAME = userDetails.MUD_FULL_NAME;
            user.MUD_UPDATED_DATE = DateTime.UtcNow;
            user.MUD_UPDATED_BY = "system"; // Replace with actual updating user if available

            if (!string.IsNullOrEmpty(userDetails.MUD_PASSWORD) && userDetails.MUD_PASSWORD.Length != 44)
            {
                user.MUD_PASSWORD = Hashpassword(userDetails.MUD_PASSWORD);
            }
            else
            {
                user.MUD_PASSWORD = userDetails.MUD_PASSWORD;


            }
           

            if (Request.Form.Files.Count > 0)
            {
                var file = Request.Form.Files[0];
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    user.MUD_PHOTO = memoryStream.ToArray();
                }
            }

            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                return Ok("User profile updated successfully.");
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred while updating the user profile.");
            }
        }






        [HttpPost("checkuserexists")]
        public async Task<IActionResult> CheckUserExists(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("Email is required.");
            }

            // Query the database for the user with the given email
            var user = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u => u.MUD_EMAIL == email);

            if (user == null)
            {
                return BadRequest("User is not registered with the given email.");
            }

            return Ok("User exists.");
        }














        [HttpPut("update-password")]
        public async Task<IActionResult> UpdatePasswordByEmail([FromBody] UpdatePasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest("Email and new password are required.");
            }

            var user = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u => u.MUD_EMAIL == request.Email);

            if (user == null)
            {
                return NotFound("User with the provided email not found.");
            }

            string passwordhash = Hashpassword(request.NewPassword);

            // Update the password
            user.MUD_PASSWORD = passwordhash;
            user.MUD_UPDATED_DATE = DateTime.UtcNow;
            user.MUD_UPDATED_BY = "system"; // Replace with the actual updater if applicable

            try
            {
                await _context.SaveChangesAsync();
                return Ok("Password updated successfully.");
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred while updating the password.");
            }
        }

        // DTO for the password update request
        public class UpdatePasswordRequest
        {
            public string Email { get; set; }
            public string NewPassword { get; set; }
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

        private bool IsHashed(string password)
        {
            // SHA256 hashed passwords are always 44 characters long in Base64
            return password.Length == 44 && password.All(c => char.IsLetterOrDigit(c) || c == '/' || c == '+');
        }




    }
}
