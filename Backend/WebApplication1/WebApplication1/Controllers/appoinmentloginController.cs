//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.IdentityModel.Tokens;
//using System.IdentityModel.Tokens.Jwt;
//using System.Security.Claims;
//using System.Text;
//using WebApplication1.Data;
//using WebApplication1.Services;

//namespace webapplication3.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]

//    // This controller is for patients to log in to the system.
//    // Patients authenticate with OTP only (no password) - the OTP is now emailed
//    // through Gmail (see EmailService) instead of being sent via the old SMS gateway.
//    //
//    // Flow used by the frontend (see frontend/pages/patientlogin.jsx):
//    //   1. POST CheckUserExists   { contact }            -> confirms the mobile number is registered
//    //   2. POST RequestOtp        { contact }             -> generates an OTP, emails it, starts cooldown
//    //   3. POST VerifyOtp         { contact, otp }         -> verifies server-side, stamps a short "verified" ticket
//    //   4. POST userlists         { contact }              -> (requires ticket) lists patient profiles under that contact
//    //   5. POST patient-login-api { contact, patientcode } -> (spends ticket) issues the session JWT
//    public class AppoinmentLoginController : Controller
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly IConfiguration _configuration;
//        private readonly OtpService _otpService;
//        private readonly IEmailService _emailService;

//        private const string OtpPurpose = "patient-login";

//        public AppoinmentLoginController(
//            ApplicationDbContext context,
//            IConfiguration configuration,
//            OtpService otpService,
//            IEmailService emailService)
//        {
//            _context = context;
//            _configuration = configuration;
//            _otpService = otpService;
//            _emailService = emailService;
//        }

//        [HttpPost("CheckUserExists")]
//        public IActionResult CheckUserExists([FromBody] AppoinmentLoginModel login)
//        {
//            if (login == null || string.IsNullOrEmpty(login.contact))
//            {
//                return BadRequest("contact is required");
//            }

//            var userExists = _context.MED_PATIENTS_DETAILS.Any(u => u.MPD_MOBILE_NO == login.contact);

//            if (!userExists)
//            {
//                return NotFound("User not registered");
//            }

//            return Ok("User found");
//        }

//        // Generates a fresh OTP for this contact number and emails it to the
//        // registered patient's email address on file. Replaces the old
//        // "patient-login-contact" endpoint that sent the code over SMS and,
//        // worse, returned the code itself in the API response.
//        [HttpPost("RequestOtp")]
//        public async Task<IActionResult> RequestOtp([FromBody] AppoinmentLoginModel login)
//        {
//            if (login == null || string.IsNullOrEmpty(login.contact))
//            {
//                return BadRequest(new { message = "Contact number is required." });
//            }

//            var patients = await _context.MED_PATIENTS_DETAILS
//                .Where(u => u.MPD_MOBILE_NO == login.contact)
//                .ToListAsync();

//            if (patients.Count == 0)
//            {
//                return Unauthorized(new { message = "Invalid contact number." });
//            }

//            // Multiple patient profiles (e.g. family members) can share one mobile number.
//            // We send the OTP to the first profile on file that actually has an email saved.
//            var patientWithEmail = patients.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p.MPD_EMAIL));
//            if (patientWithEmail == null)
//            {
//                return BadRequest(new
//                {
//                    message = "No email address is on file for this contact number. Please update your patient record at the clinic before logging in with OTP."
//                });
//            }

//            if (!_otpService.CanRequestOtp(OtpPurpose, login.contact, out var retryAfter))
//            {
//                return StatusCode(429, new
//                {
//                    message = $"Please wait {Math.Ceiling(retryAfter.TotalSeconds)} seconds before requesting another code."
//                });
//            }

//            var otp = _otpService.GenerateOtp(OtpPurpose, login.contact);

//            try
//            {
//                await _emailService.SendOtpEmailAsync(
//                    patientWithEmail.MPD_EMAIL!,
//                    patientWithEmail.MPD_PATIENT_NAME,
//                    otp,
//                    "Use the code below to log in to your Medicare patient account.");
//            }
//            catch (Exception)
//            {
//                return StatusCode(500, new { message = "Failed to send the OTP email. Please try again shortly." });
//            }

//            return Ok(new
//            {
//                message = $"OTP sent to {MaskEmail(patientWithEmail.MPD_EMAIL!)}."
//            });
//        }

//        // Verifies the code the patient typed in against the one we emailed them.
//        // This now happens on the server - the frontend used to just compare the OTP
//        // against a copy of it kept in browser state, which anyone could bypass via
//        // devtools without ever seeing the real code.
//        [HttpPost("VerifyOtp")]
//        public IActionResult VerifyOtp([FromBody] AppoinmentLoginModel login)
//        {
//            if (login == null || string.IsNullOrEmpty(login.contact))
//            {
//                return BadRequest(new { message = "Contact number is required." });
//            }

//            var (success, error) = _otpService.VerifyOtp(OtpPurpose, login.contact, login.otp);
//            if (!success)
//            {
//                return BadRequest(new { message = error });
//            }

//            return Ok(new { verified = true });
//        }

//        [HttpPost("userlists")]
//        public IActionResult UserLists([FromBody] AppoinmentLoginModel login)
//        {
//            if (login == null || string.IsNullOrEmpty(login.contact))
//            {
//                return BadRequest("Invalid credentials.");
//            }

//            // Require a valid OTP "verified" ticket before handing back any patient
//            // records for this contact number. This check does not spend the ticket -
//            // patient-login-api spends it once the patient actually picks a profile.
//            if (!_otpService.IsVerified(OtpPurpose, login.contact))
//            {
//                return Unauthorized(new { message = "Please verify the OTP sent to your email first." });
//            }

//            var users = _context.MED_PATIENTS_DETAILS
//                .Where(u => u.MPD_MOBILE_NO == login.contact)
//                .ToList();

//            if (users == null || users.Count == 0)
//            {
//                return NotFound("No users found with the given contact.");
//            }

//            return Ok(users);
//        }

//        // Final step: issues the session JWT for the profile the patient selected.
//        // Requires a still-valid OTP "verified" ticket for the SAME contact number,
//        // and spends it (single use) so this endpoint can no longer be called by
//        // itself/replayed. Previously this endpoint issued a full session token to
//        // anyone who supplied a valid patientcode, with no OTP check at all.
//        [HttpPost("patient-login-api")]
//        public async Task<IActionResult> loginpatient([FromBody] AppoinmentLoginModel login)
//        {
//            if (login == null || string.IsNullOrEmpty(login.patientcode) || string.IsNullOrEmpty(login.contact))
//            {
//                return BadRequest("Invalid credentials");
//            }

//            if (!_otpService.ConsumeVerification(OtpPurpose, login.contact))
//            {
//                return Unauthorized(new { message = "OTP verification required or has expired. Please request a new code." });
//            }

//            var user = await _context.MED_PATIENTS_DETAILS
//                .FirstOrDefaultAsync(u => u.MPD_PATIENT_CODE == login.patientcode);

//            // Make sure the selected profile actually belongs to the verified contact
//            // number, so a verified ticket for one contact can't be used to select a
//            // different, unrelated patient code.
//            if (user == null || user.MPD_MOBILE_NO != login.contact)
//            {
//                return Unauthorized("Invalid credentials");
//            }

//            var tokenHandler = new JwtSecurityTokenHandler();
//            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:SecretKey"]!);

//            var claims = new[]
//            {
//                new Claim(ClaimTypes.Name, user.MPD_MOBILE_NO ?? string.Empty),
//                new Claim(ClaimTypes.Role, "patient")
//            };

//            var tokenDescriptor = new SecurityTokenDescriptor
//            {
//                Subject = new ClaimsIdentity(claims),
//                Expires = DateTime.UtcNow.AddHours(1),
//                SigningCredentials = new SigningCredentials(
//                    new SymmetricSecurityKey(key),
//                    SecurityAlgorithms.HmacSha256Signature)
//            };

//            var token = tokenHandler.CreateToken(tokenDescriptor);
//            var tokenString = tokenHandler.WriteToken(token);

//            return Ok(new
//            {
//                Message = "Login successful",
//                Role = "patient",
//                Token = tokenString,
//                Email = user.MPD_EMAIL,
//                PatientCode = user.MPD_PATIENT_CODE,
//                Name = user.MPD_PATIENT_NAME,
//                Contact = user.MPD_MOBILE_NO
//            });
//        }

//        // Legacy email+password patient login. Kept because
//        // frontend/components/patientappoinment.jsx still calls it, but this
//        // contradicts "patients log in with OTP only" - flag for removal once that
//        // component is updated to rely solely on the OTP flow above.
//        [HttpPost("Login")]
//        public IActionResult Login([FromBody] AppoinmentLoginModel login)
//        {
//            if (login == null || string.IsNullOrEmpty(login.email) || string.IsNullOrEmpty(login.password))
//            {
//                return BadRequest("Invalid login request");
//            }

//            var user = _context.MED_PATIENTS_DETAILS
//                        .FirstOrDefault(u => u.MPD_EMAIL == login.email && u.MPD_PASSWORD == login.password);

//            if (user == null)
//            {
//                return Unauthorized("Invalid credentials");
//            }

//            var tokenHandler = new JwtSecurityTokenHandler();
//            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:SecretKey"]!);

//            var claims = new[]
//            {
//                new Claim(ClaimTypes.Name, user.MPD_EMAIL ?? string.Empty),
//                new Claim(ClaimTypes.Role, "patient")
//            };

//            var tokenDescriptor = new SecurityTokenDescriptor
//            {
//                Subject = new ClaimsIdentity(claims),
//                Expires = DateTime.UtcNow.AddHours(1),
//                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
//            };

//            var token = tokenHandler.CreateToken(tokenDescriptor);
//            var tokenString = tokenHandler.WriteToken(token);

//            return Ok(new
//            {
//                Message = "Login successful",
//                Role = "patient",
//                Token = tokenString,
//                Email = login.email,
//                PatientCode = user.MPD_PATIENT_CODE
//            });
//        }

//        private static string MaskEmail(string email)
//        {
//            var atIndex = email.IndexOf('@');
//            if (atIndex <= 1)
//            {
//                return email;
//            }

//            var visible = email.Substring(0, 1);
//            var domain = email.Substring(atIndex);
//            return $"{visible}***{domain}";
//        }
//    }

//    // Model class definition
//    public class AppoinmentLoginModel
//    {
//        public string? email { get; set; }
//        public string? password { get; set; }
//        public string? contact { get; set; }
//        public string? patientcode { get; set; }
//        public string? otp { get; set; }
//    }
//}


using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using WebApplication1.Data;
using WebApplication1.Services;

namespace webapplication3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppoinmentLoginController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailSender _emailSender;
        private readonly IMemoryCache _cache;
        private readonly ILogger<AppoinmentLoginController> _logger;

        private static readonly TimeSpan OtpLifetime = TimeSpan.FromMinutes(5);
        private static readonly TimeSpan VerifiedLifetime = TimeSpan.FromMinutes(10);
        private const int MaxOtpAttempts = 5;

        public AppoinmentLoginController(
            ApplicationDbContext context,
            IConfiguration configuration,
            IEmailSender emailSender,
            IMemoryCache cache,
            ILogger<AppoinmentLoginController> logger)
        {
            _context = context;
            _configuration = configuration;
            _emailSender = emailSender;
            _cache = cache;
            _logger = logger;
        }

        // ------------------------------------------------------------
        // Diagnostic endpoint - useful when patient login returns 5xx.
        // GET: api/AppoinmentLogin/health
        // ------------------------------------------------------------
        [HttpGet("health")]
        public async Task<IActionResult> Health()
        {
            try
            {
                var canConnect = await _context.Database.CanConnectAsync();
                return Ok(new
                {
                    Database = canConnect ? "Connected" : "Unavailable",
                    EmailEnabled = _configuration.GetValue<bool>("EmailSettings:Enabled"),
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Patient-login health check failed.");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "CareSync cannot connect to the patient database.",
                    detail = "Check ConnectionStrings:DefaultConnection and confirm SQL Server is running."
                });
            }
        }

        // ------------------------------------------------------------
        // Step 1: verify that a patient record exists for the phone.
        // This endpoint DOES NOT use SMTP, so an SMTP configuration
        // problem cannot cause a successful DB lookup to become 404.
        // ------------------------------------------------------------
        [HttpPost("CheckUserExists")]
        public async Task<IActionResult> CheckUserExists([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrWhiteSpace(login.contact))
            {
                return BadRequest(new { message = "Mobile number is required." });
            }

            var candidates = BuildContactCandidates(login.contact);
            if (candidates.Count == 0)
            {
                return BadRequest(new { message = "Please enter a valid mobile number." });
            }

            try
            {
                var patient = await FindPatientByContactAsync(candidates);

                if (patient == null)
                {
                    return NotFound(new { message = "No registered patient was found for this mobile number." });
                }

                return Ok(new
                {
                    exists = true,
                    contact = patient.MPD_MOBILE_NO,
                    email = MaskEmail(patient.MPD_EMAIL)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CheckUserExists failed for mobile number ending {Suffix}.", LastDigits(login.contact, 4));

                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Patient records are temporarily unavailable.",
                    detail = "The server could not query the medicare database. Check the backend database connection."
                });
            }
        }

        // ------------------------------------------------------------
        // Step 2: send OTP to the EMAIL stored on the patient record.
        // Identity is still located by mobile number.
        // POST: api/AppoinmentLogin/RequestOtp
        // ------------------------------------------------------------
        [HttpPost("RequestOtp")]
        public async Task<IActionResult> RequestOtp([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrWhiteSpace(login.contact))
            {
                return BadRequest(new { message = "Mobile number is required." });
            }

            var candidates = BuildContactCandidates(login.contact);
            if (candidates.Count == 0)
            {
                return BadRequest(new { message = "Please enter a valid mobile number." });
            }

            try
            {
                var patient = await FindPatientByContactAsync(candidates);
                if (patient == null)
                {
                    return NotFound(new { message = "No registered patient was found for this mobile number." });
                }

                if (string.IsNullOrWhiteSpace(patient.MPD_EMAIL))
                {
                    return Conflict(new
                    {
                        message = "No email address is registered for this patient. Please contact hospital staff to update the patient record."
                    });
                }

                var canonicalContact = NormalizeContact(patient.MPD_MOBILE_NO ?? login.contact);
                var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
                var challenge = new OtpChallenge
                {
                    Hash = HashOtp(canonicalContact, otp),
                    ExpiresAtUtc = DateTime.UtcNow.Add(OtpLifetime),
                    Attempts = 0
                };

                var challengeKey = OtpKey(canonicalContact);
                _cache.Set(challengeKey, challenge, OtpLifetime);

                var subject = "CareSync patient portal verification code";
                var html = BuildOtpEmail(patient.MPD_PATIENT_NAME, otp);

                try
                {
                    await _emailSender.SendAsync(patient.MPD_EMAIL, subject, html, HttpContext.RequestAborted);
                }
                catch (Exception ex)
                {
                    _cache.Remove(challengeKey);
                    _logger.LogError(ex, "Failed to send patient OTP email for {PatientCode}.", patient.MPD_PATIENT_CODE);

                    return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                    {
                        message = "We found your patient record, but the verification email could not be sent.",
                        detail = "Check EmailSettings/SMTP configuration on the backend."
                    });
                }

                return Ok(new
                {
                    message = $"A verification code was sent to {MaskEmail(patient.MPD_EMAIL)}.",
                    expiresInMinutes = (int)OtpLifetime.TotalMinutes
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RequestOtp failed for mobile number ending {Suffix}.", LastDigits(login.contact, 4));
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Unable to start patient verification right now.",
                    detail = "Check the database connection and backend logs."
                });
            }
        }

        // ------------------------------------------------------------
        // Step 3: verify the server-side OTP.
        // POST: api/AppoinmentLogin/VerifyOtp
        // ------------------------------------------------------------
        [HttpPost("VerifyOtp")]
        public IActionResult VerifyOtp([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrWhiteSpace(login.contact) || string.IsNullOrWhiteSpace(login.otp))
            {
                return BadRequest(new { message = "Mobile number and OTP are required." });
            }

            var canonicalContact = NormalizeContact(login.contact);
            if (string.IsNullOrWhiteSpace(canonicalContact))
            {
                return BadRequest(new { message = "Invalid mobile number." });
            }

            var challengeKey = OtpKey(canonicalContact);
            if (!_cache.TryGetValue(challengeKey, out OtpChallenge? challenge) || challenge == null)
            {
                return BadRequest(new { message = "The OTP has expired or was not requested. Please request a new code." });
            }

            if (DateTime.UtcNow > challenge.ExpiresAtUtc)
            {
                _cache.Remove(challengeKey);
                return BadRequest(new { message = "The OTP has expired. Please request a new code." });
            }

            if (challenge.Attempts >= MaxOtpAttempts)
            {
                _cache.Remove(challengeKey);
                return StatusCode(StatusCodes.Status429TooManyRequests, new
                {
                    message = "Too many incorrect OTP attempts. Please request a new code."
                });
            }

            var submittedHash = HashOtp(canonicalContact, login.otp.Trim());
            if (!CryptographicOperations.FixedTimeEquals(challenge.Hash, submittedHash))
            {
                challenge.Attempts++;
                _cache.Set(challengeKey, challenge, challenge.ExpiresAtUtc - DateTime.UtcNow);
                return BadRequest(new { message = "The verification code is incorrect." });
            }

            _cache.Remove(challengeKey);
            _cache.Set(VerifiedKey(canonicalContact), true, VerifiedLifetime);

            return Ok(new { message = "Verification successful." });
        }

        // ------------------------------------------------------------
        // Step 4: return safe profile choices for this verified phone.
        // POST: api/AppoinmentLogin/userlists
        // ------------------------------------------------------------
        [HttpPost("userlists")]
        public async Task<IActionResult> UserLists([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrWhiteSpace(login.contact))
            {
                return BadRequest(new { message = "Mobile number is required." });
            }

            var candidates = BuildContactCandidates(login.contact);
            if (candidates.Count == 0)
            {
                return BadRequest(new { message = "Invalid mobile number." });
            }

            var canonicalContact = NormalizeContact(login.contact);
            if (!_cache.TryGetValue(VerifiedKey(canonicalContact), out bool verified) || !verified)
            {
                // Also accept equivalent DB formatting after OTP was sent using the stored contact.
                var verifiedCandidate = candidates.Any(c =>
                    _cache.TryGetValue(VerifiedKey(NormalizeContact(c)), out bool candidateVerified) && candidateVerified);

                if (!verifiedCandidate)
                {
                    return Unauthorized(new { message = "Verify the OTP before selecting a patient profile." });
                }
            }

            try
            {
                var normalizedCandidates = candidates.Select(NormalizeContact).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToList();

                var patients = await _context.MED_PATIENTS_DETAILS
                    .AsNoTracking()
                    .Where(p => p.MPD_MOBILE_NO != null)
                    .Select(p => new
                    {
                        p.MPD_PATIENT_CODE,
                        p.MPD_PATIENT_NAME,
                        p.MPD_MOBILE_NO,
                        p.MPD_EMAIL,
                        p.MPD_NIC_NO,
                        p.MPD_STATUS
                    })
                    .ToListAsync();

                var matches = patients
                    .Where(p => normalizedCandidates.Contains(NormalizeContact(p.MPD_MOBILE_NO ?? string.Empty)))
                    .Where(p => p.MPD_STATUS == null || p.MPD_STATUS == "A")
                    .ToList();

                if (matches.Count == 0)
                {
                    return NotFound(new { message = "No active patient profiles were found for this mobile number." });
                }

                return Ok(matches);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to load patient profiles.");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Patient profiles are temporarily unavailable."
                });
            }
        }

        // ------------------------------------------------------------
        // Final login after OTP verification + profile selection.
        // POST: api/AppoinmentLogin/patient-login-api
        // ------------------------------------------------------------
        [HttpPost("patient-login-api")]
        public async Task<IActionResult> LoginPatient([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrWhiteSpace(login.patientcode) || string.IsNullOrWhiteSpace(login.contact))
            {
                return BadRequest(new { message = "Patient code and mobile number are required." });
            }

            var candidates = BuildContactCandidates(login.contact);
            var normalizedCandidates = candidates.Select(NormalizeContact).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToList();
            var hasVerifiedSession = normalizedCandidates.Any(c =>
                _cache.TryGetValue(VerifiedKey(c), out bool verified) && verified);

            if (!hasVerifiedSession)
            {
                return Unauthorized(new { message = "Your OTP verification session has expired. Please verify again." });
            }

            try
            {
                var user = await _context.MED_PATIENTS_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.MPD_PATIENT_CODE == login.patientcode);

                if (user == null || !normalizedCandidates.Contains(NormalizeContact(user.MPD_MOBILE_NO ?? string.Empty)))
                {
                    return Unauthorized(new { message = "The selected patient profile does not match the verified mobile number." });
                }

                var jwtSecret = _configuration["Jwt:SecretKey"];
                if (string.IsNullOrWhiteSpace(jwtSecret))
                {
                    _logger.LogError("Jwt:SecretKey is missing from configuration.");
                    return StatusCode(StatusCodes.Status500InternalServerError, new
                    {
                        message = "Patient authentication is not configured correctly on the server."
                    });
                }

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.MPD_PATIENT_CODE ?? string.Empty),
                    new Claim(ClaimTypes.Name, user.MPD_MOBILE_NO ?? string.Empty),
                    new Claim(ClaimTypes.Role, "patient")
                };

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddHours(2),
                    SigningCredentials = new SigningCredentials(
                        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                        SecurityAlgorithms.HmacSha256Signature)
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));

                foreach (var c in normalizedCandidates)
                {
                    _cache.Remove(VerifiedKey(c));
                }

                return Ok(new
                {
                    Message = "Login successful",
                    Role = "patient",
                    Token = token,
                    Email = user.MPD_EMAIL,
                    PatientCode = user.MPD_PATIENT_CODE,
                    Name = user.MPD_PATIENT_NAME,
                    Contact = user.MPD_MOBILE_NO
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Patient login failed for patient code {PatientCode}.", login.patientcode);
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Patient login is temporarily unavailable."
                });
            }
        }

        // Legacy endpoint kept for compatibility with older clients.
        // It now only produces a token after a valid patient is found.
        [HttpPost("LoginWithOtp")]
        public async Task<IActionResult> LoginWithOtp([FromBody] AppoinmentLoginModel login)
        {
            if (login == null || string.IsNullOrWhiteSpace(login.contact))
            {
                return BadRequest(new { message = "Mobile number is required." });
            }

            var candidates = BuildContactCandidates(login.contact);
            var patient = await FindPatientByContactAsync(candidates);
            if (patient == null)
            {
                return Unauthorized(new { message = "Invalid patient mobile number." });
            }

            return BadRequest(new
            {
                message = "This legacy endpoint no longer bypasses OTP verification. Use RequestOtp, VerifyOtp, then patient-login-api."
            });
        }

        private async Task<PatientLookup?> FindPatientByContactAsync(List<string> candidates)
        {
            // Pull only the fields required by the login flow. This avoids exposing passwords
            // or unnecessary clinical information in patient-login responses.
            var rows = await _context.MED_PATIENTS_DETAILS
                .AsNoTracking()
                .Where(p => p.MPD_MOBILE_NO != null)
                .Select(p => new PatientLookup
                {
                    MPD_PATIENT_CODE = p.MPD_PATIENT_CODE,
                    MPD_PATIENT_NAME = p.MPD_PATIENT_NAME,
                    MPD_MOBILE_NO = p.MPD_MOBILE_NO,
                    MPD_EMAIL = p.MPD_EMAIL,
                    MPD_STATUS = p.MPD_STATUS
                })
                .ToListAsync();

            var normalizedCandidates = candidates
                .Select(NormalizeContact)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToHashSet(StringComparer.Ordinal);

            return rows.FirstOrDefault(p =>
                (p.MPD_STATUS == null || p.MPD_STATUS == "A") &&
                normalizedCandidates.Contains(NormalizeContact(p.MPD_MOBILE_NO ?? string.Empty)));
        }

        private static List<string> BuildContactCandidates(string raw)
        {
            var digits = new string((raw ?? string.Empty).Where(char.IsDigit).ToArray());
            var result = new HashSet<string>(StringComparer.Ordinal);

            if (string.IsNullOrWhiteSpace(digits))
                return result.ToList();

            result.Add(digits);

            if (digits.Length == 10 && digits.StartsWith('0'))
            {
                var national = digits[1..];
                result.Add("94" + national);
                result.Add("+94" + national);
            }
            else if (digits.Length == 11 && digits.StartsWith("94"))
            {
                var national = digits[2..];
                result.Add("0" + national);
                result.Add("+" + digits);
            }
            else if (digits.Length == 9 && digits.StartsWith('7'))
            {
                result.Add("0" + digits);
                result.Add("94" + digits);
                result.Add("+94" + digits);
            }

            return result.ToList();
        }

        private static string NormalizeContact(string raw)
        {
            var digits = new string((raw ?? string.Empty).Where(char.IsDigit).ToArray());

            if (digits.Length == 11 && digits.StartsWith("94"))
                return "0" + digits[2..];

            if (digits.Length == 9 && digits.StartsWith('7'))
                return "0" + digits;

            return digits;
        }

        private static string OtpKey(string contact) => $"patient-login:otp:{NormalizeContact(contact)}";
        private static string VerifiedKey(string contact) => $"patient-login:verified:{NormalizeContact(contact)}";

        private static byte[] HashOtp(string contact, string otp) =>
            SHA256.HashData(Encoding.UTF8.GetBytes($"{NormalizeContact(contact)}:{otp}"));

        private static string MaskEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                return "registered email";

            var parts = email.Split('@', 2);
            var local = parts[0];
            var visible = local.Length <= 2 ? local[..1] : local[..2];
            return $"{visible}{new string('*', Math.Max(2, local.Length - visible.Length))}@{parts[1]}";
        }

        private static string LastDigits(string value, int count)
        {
            var digits = new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
            return digits.Length <= count ? digits : digits[^count..];
        }

        private static string BuildOtpEmail(string? patientName, string otp)
        {
            var safeName = System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(patientName) ? "Patient" : patientName);
            return $"""
            <!doctype html>
            <html>
              <body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                <div style="max-width:620px;margin:0 auto;padding:32px 16px;">
                  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,.08);">
                    <div style="background:linear-gradient(135deg,#0369a1,#0f766e);padding:24px 28px;color:#fff;">
                      <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.8;">CareSync Patient Portal</div>
                      <h1 style="font-size:22px;margin:7px 0 0;">Verification code</h1>
                    </div>
                    <div style="padding:28px;">
                      <p style="margin:0 0 14px;font-size:16px;font-weight:700;">Hello {safeName},</p>
                      <p style="margin:0;color:#475569;line-height:1.6;">Use this code to continue signing in to your CareSync patient account:</p>
                      <div style="margin:24px 0;background:#f0fdfa;border:1px solid #99f6e4;border-radius:14px;padding:18px;text-align:center;font-size:32px;letter-spacing:.28em;font-weight:800;color:#115e59;">{otp}</div>
                      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
            """;
        }

        private sealed class OtpChallenge
        {
            public required byte[] Hash { get; init; }
            public DateTime ExpiresAtUtc { get; init; }
            public int Attempts { get; set; }
        }

        private sealed class PatientLookup
        {
            public string? MPD_PATIENT_CODE { get; init; }
            public string? MPD_PATIENT_NAME { get; init; }
            public string? MPD_MOBILE_NO { get; init; }
            public string? MPD_EMAIL { get; init; }
            public string? MPD_STATUS { get; init; }
        }
    }

    public class AppoinmentLoginModel
    {
        public string? email { get; set; }
        public string? password { get; set; }
        public string? contact { get; set; }
        public string? patientcode { get; set; }
        public string? otp { get; set; }
    }
}
