using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
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
        public async Task<ActionResult<MED_USER_DETAILS>> PostUser(
            [FromForm] MED_USER_DETAILS userDetails,
            [FromForm] IFormFile? profileImage)
        {
            if (userDetails == null)
            {
                return BadRequest(new { error = "User details cannot be null." });
            }

            // Normalize incoming form values before validation / database lookup.
            userDetails.MUD_USER_NAME = userDetails.MUD_USER_NAME?.Trim();
            userDetails.MUD_FULL_NAME = userDetails.MUD_FULL_NAME?.Trim();
            userDetails.MUD_EMAIL = userDetails.MUD_EMAIL?.Trim();
            userDetails.MUD_NIC_NO = userDetails.MUD_NIC_NO?.Trim();
            userDetails.MUD_CONTACT = userDetails.MUD_CONTACT?.Trim();
            userDetails.MUD_SPECIALIZATION = userDetails.MUD_SPECIALIZATION?.Trim();

            if (string.IsNullOrWhiteSpace(userDetails.MUD_USER_NAME) ||
                string.IsNullOrWhiteSpace(userDetails.MUD_PASSWORD) ||
                string.IsNullOrWhiteSpace(userDetails.MUD_USER_TYPE) ||
                string.IsNullOrWhiteSpace(userDetails.MUD_FULL_NAME) ||
                string.IsNullOrWhiteSpace(userDetails.MUD_EMAIL))
            {
                return BadRequest(new
                {
                    error = "Username, full name, email, password and user type are required."
                });
            }

            // MUD_USER_TYPE is a foreign key to MED_USER_TYPES.MUT_USER_TYPE.
            // Resolve the submitted value against the real database row first.
            var resolvedUserType = await ResolveUserTypeAsync(userDetails.MUD_USER_TYPE);
            if (resolvedUserType == null)
            {
                var availableTypes = await _context.MED_USER_TYPES
                    .AsNoTracking()
                    .OrderBy(t => t.MUT_USER_TYPE)
                    .Select(t => t.MUT_USER_TYPE)
                    .ToListAsync();

                return BadRequest(new
                {
                    error = $"Invalid user type '{userDetails.MUD_USER_TYPE}'. The role must exist in MED_USER_TYPES first.",
                    availableUserTypes = availableTypes
                });
            }

            userDetails.MUD_USER_TYPE = resolvedUserType.MUT_USER_TYPE;

            if (string.Equals(userDetails.MUD_USER_TYPE, "Doc", StringComparison.OrdinalIgnoreCase) &&
                string.IsNullOrWhiteSpace(userDetails.MUD_SPECIALIZATION))
            {
                return BadRequest(new { error = "Specialization is required for doctors." });
            }

            var existingEmail = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.MUD_EMAIL != null &&
                                          u.MUD_EMAIL.ToLower() == userDetails.MUD_EMAIL.ToLower());
            if (existingEmail != null)
            {
                return BadRequest(new { error = "Email already exists." });
            }

            var existingUsername = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.MUD_USER_NAME != null &&
                                          u.MUD_USER_NAME.ToLower() == userDetails.MUD_USER_NAME.ToLower());
            if (existingUsername != null)
            {
                return BadRequest(new { error = "Username already exists." });
            }

            if (!string.IsNullOrWhiteSpace(userDetails.MUD_NIC_NO))
            {
                var existingNic = await _context.MED_USER_DETAILS
                    .AsNoTracking()
                    .AnyAsync(u => u.MUD_NIC_NO == userDetails.MUD_NIC_NO);
                if (existingNic)
                {
                    return BadRequest(new { error = "NIC number already exists." });
                }
            }

            if (!string.IsNullOrWhiteSpace(userDetails.MUD_CONTACT))
            {
                var existingContact = await _context.MED_USER_DETAILS
                    .AsNoTracking()
                    .AnyAsync(u => u.MUD_CONTACT == userDetails.MUD_CONTACT);
                if (existingContact)
                {
                    return BadRequest(new { error = "Contact number already exists." });
                }
            }

            userDetails.MUD_USER_ID = await GenerateUserIdAsync();
            userDetails.MUD_STATUS = string.IsNullOrWhiteSpace(userDetails.MUD_STATUS)
                ? "A"
                : userDetails.MUD_STATUS.Trim().Substring(0, 1).ToUpperInvariant();
            userDetails.MUD_CREATED_DATE = DateTime.UtcNow;
            userDetails.MUD_UPDATED_DATE = null;
            userDetails.MUD_UPDATED_BY = null;

            userDetails.MUD_PASSWORD = Hashpassword(userDetails.MUD_PASSWORD);

            if (profileImage != null && profileImage.Length > 0)
            {
                const long maxProfileImageBytes = 2 * 1024 * 1024;
                if (profileImage.Length > maxProfileImageBytes)
                {
                    return BadRequest(new { error = "Profile image must be 2 MB or smaller." });
                }

                await using var memoryStream = new MemoryStream();
                await profileImage.CopyToAsync(memoryStream);
                userDetails.MUD_PHOTO = memoryStream.ToArray();
            }

            _context.MED_USER_DETAILS.Add(userDetails);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx && sqlEx.Number == 547)
            {
                return BadRequest(new
                {
                    error = "The selected user role is not configured correctly in MED_USER_TYPES. Run the supplied user-type seed SQL script."
                });
            }
            catch (DbUpdateException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    error = "The user could not be saved because of a database error."
                });
            }

            // Do not return the password hash to the browser after creation.
            return CreatedAtAction(nameof(GetUserById), new { id = userDetails.MUD_USER_ID }, new
            {
                userDetails.MUD_USER_ID,
                userDetails.MUD_USER_NAME,
                userDetails.MUD_USER_TYPE,
                userDetails.MUD_STATUS,
                userDetails.MUD_SPECIALIZATION,
                userDetails.MUD_FULL_NAME,
                userDetails.MUD_EMAIL,
                userDetails.MUD_NIC_NO,
                userDetails.MUD_CONTACT,
                userDetails.MUD_CREATED_DATE
            });
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
            // Only UserNNN IDs participate in this sequence. Legacy IDs such
            // as ADM0001 must not be passed to int.Parse().
            var existingIds = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .Where(u => u.MUD_USER_ID != null && u.MUD_USER_ID.StartsWith("User"))
                .Select(u => u.MUD_USER_ID!)
                .ToListAsync();

            var maxNumber = 0;
            foreach (var existingId in existingIds)
            {
                if (existingId.Length > 4 &&
                    int.TryParse(existingId.Substring(4), out var number))
                {
                    maxNumber = Math.Max(maxNumber, number);
                }
            }

            if (maxNumber >= 999)
            {
                throw new InvalidOperationException("User ID sequence has reached User999.");
            }

            return $"User{maxNumber + 1:D3}";
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



        // GET: api/User/doctors
        // Returns only active doctor accounts needed by the scheduler.
        // Password hashes and other sensitive staff fields are deliberately excluded.
        [HttpGet("doctors")]
        public async Task<IActionResult> GetActiveDoctorsForScheduling()
        {
            var doctors = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .Where(u => u.MUD_USER_TYPE == "Doc"
                         && (u.MUD_STATUS == null || u.MUD_STATUS == "A"))
                .OrderBy(u => u.MUD_FULL_NAME ?? u.MUD_USER_NAME)
                .Select(u => new
                {
                    UserId = u.MUD_USER_ID,
                    FullName = u.MUD_FULL_NAME,
                    UserName = u.MUD_USER_NAME,
                    Specialization = u.MUD_SPECIALIZATION,
                    Status = u.MUD_STATUS
                })
                .ToListAsync();

            return Ok(doctors);
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
            var resolvedUserType = await ResolveUserTypeAsync(userDetails.MUD_USER_TYPE);
            if (resolvedUserType == null)
            {
                return BadRequest(new { error = "The selected user type does not exist in MED_USER_TYPES." });
            }

            user.MUD_USER_NAME = userDetails.MUD_USER_NAME?.Trim();
            user.MUD_USER_TYPE = resolvedUserType.MUT_USER_TYPE;
            user.MUD_SPECIALIZATION = userDetails.MUD_SPECIALIZATION?.Trim();
            user.MUD_STATUS = userDetails.MUD_STATUS;
            user.MUD_NIC_NO = userDetails.MUD_NIC_NO;
            user.MUD_EMAIL = userDetails.MUD_EMAIL;
            user.MUD_CONTACT = userDetails.MUD_CONTACT;
            user.MUD_FULL_NAME = userDetails.MUD_FULL_NAME;
            user.MUD_UPDATED_DATE = DateTime.UtcNow;
            user.MUD_UPDATED_BY = "system"; // Replace with actual updating user if available

            if (!string.IsNullOrWhiteSpace(userDetails.MUD_PASSWORD) &&
                !userDetails.MUD_PASSWORD.Contains('•') &&
                !LooksLikeSha256Base64(userDetails.MUD_PASSWORD))
            {
                user.MUD_PASSWORD = Hashpassword(userDetails.MUD_PASSWORD);
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

        private async Task<MED_USER_TYPES?> ResolveUserTypeAsync(string? requestedType)
        {
            if (string.IsNullOrWhiteSpace(requestedType))
            {
                return null;
            }

            var normalized = requestedType.Trim();
            normalized = normalized.ToLowerInvariant() switch
            {
                "doctor" => "Doc",
                "attending doctor" => "Doc",
                "pharmacist" => "Phuser",
                "pharmacy user" => "Phuser",
                "licensed pharmacist" => "Phuser",
                "administrator" => "Admin",
                "system administrator" => "Admin",
                _ => normalized
            };

            var userTypes = await _context.MED_USER_TYPES
                .AsNoTracking()
                .ToListAsync();

            return userTypes.FirstOrDefault(t =>
                string.Equals(t.MUT_USER_TYPE, normalized, StringComparison.OrdinalIgnoreCase) &&
                (string.IsNullOrWhiteSpace(t.MUT_STATUS) ||
                 string.Equals(t.MUT_STATUS, "A", StringComparison.OrdinalIgnoreCase)));
        }

        private static bool LooksLikeSha256Base64(string value)
        {
            try
            {
                return Convert.FromBase64String(value).Length == 32;
            }
            catch (FormatException)
            {
                return false;
            }
        }




    }
}
