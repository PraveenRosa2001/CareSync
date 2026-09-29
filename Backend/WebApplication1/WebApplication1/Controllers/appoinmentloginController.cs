using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebApplication1.Data;
using WebApplication1.Services;

namespace webapplication3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    // This controller is for patients to log in to the system.
    // Patients authenticate with OTP only (no password) - the OTP is now emailed
    // through Gmail (see EmailService) instead of being sent via the old SMS gateway.
    //
    // Flow used by the frontend (see frontend/pages/patientlogin.jsx):
    //   1. POST CheckUserExists   { contact }            -> confirms the mobile number is registered
    //   2. POST RequestOtp        { contact }             -> generates an OTP, emails it, starts cooldown
    //   3. POST VerifyOtp         { contact, otp }         -> verifies server-side, stamps a short "verified" ticket
    //   4. POST userlists         { contact }              -> (requires ticket) lists patient profiles under that contact
    //   5. POST patient-login-api { contact, patientcode } -> (spends ticket) issues the session JWT
    public class AppoinmentLoginController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly OtpService _otpService;
        private readonly IEmailService _emailService;

        private const string OtpPurpose = "patient-login";

        public AppoinmentLoginController(
            ApplicationDbContext context,
            IConfiguration configuration,
            OtpService otpService,
            IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _otpService = otpService;
            _emailService = emailService;
        }

        [HttpPost("CheckUserExists")]
        public IActionResult CheckUserExists([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrEmpty(login.contact))
            {
                return BadRequest("contact is required");
            }

            var userExists = _context.MED_PATIENTS_DETAILS.Any(u => u.MPD_MOBILE_NO == login.contact);

            if (!userExists)
            {
                return NotFound("User not registered");
            }

            return Ok("User found");
        }

        // Generates a fresh OTP for this contact number and emails it to the
        // registered patient's email address on file. Replaces the old
        // "patient-login-contact" endpoint that sent the code over SMS and,
        // worse, returned the code itself in the API response.
        [HttpPost("RequestOtp")]
        public async Task<IActionResult> RequestOtp([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrEmpty(login.contact))
            {
                return BadRequest(new { message = "Contact number is required." });
            }

            var patients = await _context.MED_PATIENTS_DETAILS
                .Where(u => u.MPD_MOBILE_NO == login.contact)
                .ToListAsync();

            if (patients.Count == 0)
            {
                return Unauthorized(new { message = "Invalid contact number." });
            }

            // Multiple patient profiles (e.g. family members) can share one mobile number.
            // We send the OTP to the first profile on file that actually has an email saved.
            var patientWithEmail = patients.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p.MPD_EMAIL));
            if (patientWithEmail == null)
            {
                return BadRequest(new
                {
                    message = "No email address is on file for this contact number. Please update your patient record at the clinic before logging in with OTP."
                });
            }

            if (!_otpService.CanRequestOtp(OtpPurpose, login.contact, out var retryAfter))
            {
                return StatusCode(429, new
                {
                    message = $"Please wait {Math.Ceiling(retryAfter.TotalSeconds)} seconds before requesting another code."
                });
            }

            var otp = _otpService.GenerateOtp(OtpPurpose, login.contact);

            try
            {
                await _emailService.SendOtpEmailAsync(
                    patientWithEmail.MPD_EMAIL!,
                    patientWithEmail.MPD_PATIENT_NAME,
                    otp,
                    "Use the code below to log in to your Medicare patient account.");
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Failed to send the OTP email. Please try again shortly." });
            }

            return Ok(new
            {
                message = $"OTP sent to {MaskEmail(patientWithEmail.MPD_EMAIL!)}."
            });
        }

        // Verifies the code the patient typed in against the one we emailed them.
        // This now happens on the server - the frontend used to just compare the OTP
        // against a copy of it kept in browser state, which anyone could bypass via
        // devtools without ever seeing the real code.
        [HttpPost("VerifyOtp")]
        public IActionResult VerifyOtp([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrEmpty(login.contact))
            {
                return BadRequest(new { message = "Contact number is required." });
            }

            var (success, error) = _otpService.VerifyOtp(OtpPurpose, login.contact, login.otp);
            if (!success)
            {
                return BadRequest(new { message = error });
            }

            return Ok(new { verified = true });
        }

        [HttpPost("userlists")]
        public IActionResult UserLists([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrEmpty(login.contact))
            {
                return BadRequest("Invalid credentials.");
            }

            // Require a valid OTP "verified" ticket before handing back any patient
            // records for this contact number. This check does not spend the ticket -
            // patient-login-api spends it once the patient actually picks a profile.
            if (!_otpService.IsVerified(OtpPurpose, login.contact))
            {
                return Unauthorized(new { message = "Please verify the OTP sent to your email first." });
            }

            var users = _context.MED_PATIENTS_DETAILS
                .Where(u => u.MPD_MOBILE_NO == login.contact)
                .ToList();

            if (users == null || users.Count == 0)
            {
                return NotFound("No users found with the given contact.");
            }

            return Ok(users);
        }

        // Final step: issues the session JWT for the profile the patient selected.
        // Requires a still-valid OTP "verified" ticket for the SAME contact number,
        // and spends it (single use) so this endpoint can no longer be called by
        // itself/replayed. Previously this endpoint issued a full session token to
        // anyone who supplied a valid patientcode, with no OTP check at all.
        [HttpPost("patient-login-api")]
        public async Task<IActionResult> loginpatient([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrEmpty(login.patientcode) || string.IsNullOrEmpty(login.contact))
            {
                return BadRequest("Invalid credentials");
            }

            if (!_otpService.ConsumeVerification(OtpPurpose, login.contact))
            {
                return Unauthorized(new { message = "OTP verification required or has expired. Please request a new code." });
            }

            var user = await _context.MED_PATIENTS_DETAILS
                .FirstOrDefaultAsync(u => u.MPD_PATIENT_CODE == login.patientcode);

            // Make sure the selected profile actually belongs to the verified contact
            // number, so a verified ticket for one contact can't be used to select a
            // different, unrelated patient code.
            if (user == null || user.MPD_MOBILE_NO != login.contact)
            {
                return Unauthorized("Invalid credentials");
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:SecretKey"]!);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.MPD_MOBILE_NO ?? string.Empty),
                new Claim(ClaimTypes.Role, "patient")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new
            {
                Message = "Login successful",
                Role = "patient",
                Token = tokenString,
                Email = user.MPD_EMAIL,
                PatientCode = user.MPD_PATIENT_CODE,
                Name = user.MPD_PATIENT_NAME,
                Contact = user.MPD_MOBILE_NO
            });
        }

        // Legacy email+password patient login. Kept because
        // frontend/components/patientappoinment.jsx still calls it, but this
        // contradicts "patients log in with OTP only" - flag for removal once that
        // component is updated to rely solely on the OTP flow above.
        [HttpPost("Login")]
        public IActionResult Login([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrEmpty(login.email) || string.IsNullOrEmpty(login.password))
            {
                return BadRequest("Invalid login request");
            }

            var user = _context.MED_PATIENTS_DETAILS
                        .FirstOrDefault(u => u.MPD_EMAIL == login.email && u.MPD_PASSWORD == login.password);

            if (user == null)
            {
                return Unauthorized("Invalid credentials");
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:SecretKey"]!);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.MPD_EMAIL ?? string.Empty),
                new Claim(ClaimTypes.Role, "patient")
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
                Role = "patient",
                Token = tokenString,
                Email = login.email,
                PatientCode = user.MPD_PATIENT_CODE
            });
        }

        private static string MaskEmail(string email)
        {
            var atIndex = email.IndexOf('@');
            if (atIndex <= 1)
            {
                return email;
            }

            var visible = email.Substring(0, 1);
            var domain = email.Substring(atIndex);
            return $"{visible}***{domain}";
        }
    }

    // Model class definition
    public class AppoinmentLoginModel
    {
        public string? email { get; set; }
        public string? password { get; set; }
        public string? contact { get; set; }
        public string? patientcode { get; set; }
        public string? otp { get; set; }
    }
}