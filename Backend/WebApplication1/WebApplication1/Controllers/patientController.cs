//using System.Linq;
//using System.Threading.Tasks;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Logging;  // Add logging
//using WebApplication1.Data;
//using WebApplication1.Models;
//using System.IO;
//using Microsoft.AspNetCore.Authorization;

//namespace WebApplication1.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class PatientController : ControllerBase
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly ILogger<PatientController> _logger;  // Inject logger

//        public PatientController(ApplicationDbContext context, ILogger<PatientController> logger)
//        {
//            _context = context;
//            _logger = logger;  // Initialize logger
//        }

//        // GET: api/Patient
//        [HttpGet]
//        public async Task<ActionResult<IEnumerable<MED_PATIENTS_DETAILS>>> GetPatients()
//        {
//            try
//            {
//                var patients = await _context.MED_PATIENTS_DETAILS.ToListAsync();
//                return Ok(patients);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error occurred while retrieving patients.");
//                return StatusCode(500, new { error = "Internal server error while retrieving patients." });
//            }
//        }



//        // GET: api/Patient/{id}
//        [HttpGet("{id}")]
//        public async Task<ActionResult<MED_PATIENTS_DETAILS>> GetPatientById(string id)
//        {
//            try
//            {
//                var patient = await _context.MED_PATIENTS_DETAILS.FindAsync(id);

//                if (patient == null)
//                {
//                    return NotFound(new { error = "Patient not found." });
//                }

//                return Ok(patient);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, $"Error occurred while retrieving patient with id {id}.");
//                return StatusCode(500, new { error = "Internal server error." });
//            }
//        }

//        [HttpPost("patient-registration")]
//        public async Task<IActionResult> AddingPatients([FromBody] MED_PATIENTS_DETAILS patient)
//        {
//            try
//            {
//                // Check if the email already exists in the database
//                var existingPatientWithEmail = !string.IsNullOrEmpty(patient.MPD_EMAIL)
//              ? await _context.MED_PATIENTS_DETAILS.FirstOrDefaultAsync(p => p.MPD_EMAIL == patient.MPD_EMAIL)
//               : null;


//                var existingPatientWithNic = !string.IsNullOrEmpty(patient.MPD_NIC_NO)
//             ? await _context.MED_PATIENTS_DETAILS.FirstOrDefaultAsync(p => p.MPD_NIC_NO == patient.MPD_NIC_NO)
//              : null;



//                if (existingPatientWithEmail != null)
//                {
//                    return Conflict(new { error = "Patient with this email already exists." });
//                }

//                if (existingPatientWithNic != null)
//                {
//                    return Conflict(new { error = "Patient with this NIC already exists." });
//                }

//                // Generate a new patient code if it's null
//                if (string.IsNullOrEmpty(patient.MPD_PATIENT_CODE))
//                {
//                    var lastPatient = await _context.MED_PATIENTS_DETAILS
//                        .OrderByDescending(p => p.MPD_PATIENT_CODE)
//                        .FirstOrDefaultAsync();

//                    var newPatientCodeNumber = lastPatient != null
//                        ? int.Parse(lastPatient.MPD_PATIENT_CODE.Substring(2)) + 1
//                        : 1;

//                    patient.MPD_PATIENT_CODE = $"PA{newPatientCodeNumber:D4}";
//                }

//                _context.MED_PATIENTS_DETAILS.Add(patient);
//                await _context.SaveChangesAsync();

//                return CreatedAtAction(nameof(GetPatientById), new { id = patient.MPD_PATIENT_CODE }, patient);
//            }
//            catch (DbUpdateException ex)
//            {
//                _logger.LogError(ex, "Database update error during patient registration.");
//                return StatusCode(500, new { error = "Error updating the database. Please try again later." });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error occurred during patient registration.");
//                return StatusCode(500, new { error = "Internal server error during registration." });
//            }
//        }

//        [HttpPut("{id}")]
//        public async Task<IActionResult> PutPatient(string id, [FromForm] MED_PATIENTS_DETAILS patient, IFormFile? profileImage)
//        {
//            if (id != patient.MPD_PATIENT_CODE)
//            {
//                return BadRequest(new { error = "Patient code mismatch." });
//            }

//            try
//            {
//                if (profileImage != null)
//                {
//                    using (var memoryStream = new MemoryStream())
//                    {
//                        await profileImage.CopyToAsync(memoryStream);
//                        patient.MPD_PHOTO = memoryStream.ToArray(); // Store the image as a byte array
//                    }
//                }

//                _context.Entry(patient).State = EntityState.Modified;
//                await _context.SaveChangesAsync();

//                return NoContent();
//            }
//            catch (DbUpdateConcurrencyException ex)
//            {
//                _logger.LogError(ex, "Concurrency error while updating patient.");
//                return Conflict(new { error = "Concurrency error. The patient may have been updated by another user." });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error occurred while updating patient.");
//                return StatusCode(500, new { error = "Internal server error while updating patient." });
//            }
//        }

//        [Authorize]

//        // DELETE: api/Patient/{id}\

//        [HttpDelete("{id}")]
//        public async Task<IActionResult> DeletePatient(string id)
//        {
//            try
//            {
//                var patient = await _context.MED_PATIENTS_DETAILS.FindAsync(id);
//                if (patient == null)
//                {
//                    return NotFound(new { error = "Patient not found." });
//                }

//                _context.MED_PATIENTS_DETAILS.Remove(patient);
//                await _context.SaveChangesAsync();

//                return Ok("patient deleted successfully");
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error occurred while deleting patient.");
//                return StatusCode(500, new { error = "Internal server error while deleting patient." });
//            }
//        }


//        //update patient


//        [HttpPatch("update/{patientCode}")]
//        public async Task<IActionResult> UpdatePatient(string patientCode, [FromBody] MED_PATIENTS_DETAILS updatedPatient)
//        {
//            try
//            {
//                var patient = await _context.MED_PATIENTS_DETAILS
//                    .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientCode);

//                if (patient == null)
//                {
//                    return NotFound(new { error = $"Patient with code {patientCode} not found." });
//                }

//                // Update specific fields (you can add more fields as necessary)
//                patient.MPD_PATIENT_NAME = updatedPatient.MPD_PATIENT_NAME ?? patient.MPD_PATIENT_NAME;
//                patient.MPD_MOBILE_NO = updatedPatient.MPD_MOBILE_NO ?? patient.MPD_MOBILE_NO;
//                patient.MPD_EMAIL = updatedPatient.MPD_EMAIL ?? patient.MPD_EMAIL;
//                patient.MPD_ADDRESS = updatedPatient.MPD_ADDRESS ?? patient.MPD_ADDRESS;
//                patient.MPD_PATIENT_REMARKS=updatedPatient.MPD_PATIENT_REMARKS ?? patient.MPD_PATIENT_REMARKS;
//                patient.MPD_UPDATED_BY = updatedPatient.MPD_UPDATED_BY ?? patient.MPD_UPDATED_BY;
//                patient.MPD_CITY=updatedPatient.MPD_CITY ?? patient.MPD_CITY;
//                patient.MPD_BIRTHDAY=updatedPatient.MPD_BIRTHDAY ?? patient.MPD_BIRTHDAY;
//                patient.MPD_GENDER = updatedPatient.MPD_GENDER ?? patient.MPD_GENDER;
//                patient.MPD_GUARDIAN=updatedPatient.MPD_GUARDIAN ?? patient.MPD_GUARDIAN;
//                patient.MPD_GUARDIAN_CONTACT_NO = updatedPatient.MPD_GUARDIAN_CONTACT_NO ?? patient.MPD_GUARDIAN_CONTACT_NO;
//                patient.MPD_NIC_NO=updatedPatient.MPD_NIC_NO ?? patient.MPD_NIC_NO;
//                patient.MPD_UPDATED_DATE = DateTime.UtcNow;

//                // Save changes to the database
//                _context.Entry(patient).State = EntityState.Modified;
//                await _context.SaveChangesAsync();

//                return Ok(new { message = "Patient updated successfully.", patient });
//            }
//            catch (DbUpdateException ex)
//            {
//                _logger.LogError(ex, "Database update error while updating patient.");
//                return StatusCode(500, new { error = "Error updating the database. Please try again later." });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error occurred while updating patient.");
//                return StatusCode(500, new { error = "Internal server error while updating patient." });
//            }
//        }


//        [HttpGet("patient/findbyemail")]
//        public async Task<IActionResult> FindPatientByEmail(string email)
//        {
//            try
//            {
//                var patient = await _context.MED_PATIENTS_DETAILS
//                    .FirstOrDefaultAsync(p => p.MPD_EMAIL == email);

//                if (patient == null)
//                {
//                    return NotFound(new { error = "Patient not found with this email." });
//                }

//                return Ok(patient);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error occurred while searching for patient by email.");
//                return StatusCode(500, new { error = "Internal server error while searching for patient by email." });
//            }
//        }

//        [HttpGet("patient/findbyid")]

//        public async Task<IActionResult> FindPatientByid(string patientcode)
//        {



//            var patient = await _context.MED_PATIENTS_DETAILS.FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientcode);


//            if (patient == null) {


//                return NotFound(new { error = "Patient not found this patietcode" });

//            }

//            return Ok(patient);





//        }


//        // GET: api/Patient/SearchByContact/{contact}
//        /*[HttpGet("SearchByContact/{contact}")]
//        public async Task<ActionResult<IEnumerable<MED_PATIENTS_DETAILS>>> SearchByContact(string contact)
//        {
//            try
//            {
//                var patients = await _context.MED_PATIENTS_DETAILS
//                    .Where(p => p.MPD_MOBILE_NO == contact)
//                    .ToListAsync();

//                if (patients == null || !patients.Any())
//                {
//                    return NotFound(new { error = "No patients found with this contact." });
//                }

//                return Ok(patients);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error occurred while searching for patients by contact.");
//                return StatusCode(500, new { error = "Internal server error while searching for patients by contact." });
//            }
//        }*/







//        [HttpGet("SearchBy/{searchTerm}")]
//        public async Task<ActionResult<IEnumerable<MED_PATIENTS_DETAILS>>> SearchBy(string searchTerm)
//        {
//            try
//            {
//                var patients = await _context.MED_PATIENTS_DETAILS
//                    .Where(p => p.MPD_MOBILE_NO.Contains(searchTerm) ||
//                                p.MPD_PATIENT_NAME.Contains(searchTerm))
//                    .ToListAsync();

//                if (patients == null || !patients.Any())
//                {
//                    return NotFound(new { error = "No patients found with the provided search term." });
//                }

//                return Ok(patients);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error occurred while searching for patients.");
//                return StatusCode(500, new { error = "Internal server error while searching for patients." });
//            }
//        }


//        private bool PatientExists(string id)
//        {
//            return _context.MED_PATIENTS_DETAILS.Any(e => e.MPD_PATIENT_CODE == id);
//        }
//    }
//}


using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebApplication1.Data;
using WebApplication1.DTOs;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientController : ControllerBase
    {
        private static readonly HashSet<string> AllowedPatientTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Inpatient", "Outpatient", "Emergency"
        };

        private static readonly HashSet<string> AllowedGenders = new(StringComparer.OrdinalIgnoreCase)
        {
            "Male", "Female", "Other", "Unknown"
        };

        private static readonly HashSet<string> AllowedBloodGroups = new(StringComparer.OrdinalIgnoreCase)
        {
            "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"
        };

        private readonly ApplicationDbContext _context;
        private readonly ILogger<PatientController> _logger;

        public PatientController(ApplicationDbContext context, ILogger<PatientController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Patient
        // Kept for existing screens, but credentials are no longer returned.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPatients()
        {
            try
            {
                var patients = await _context.MED_PATIENTS_DETAILS
                    .AsNoTracking()
                    .OrderBy(p => p.MPD_PATIENT_CODE)
                    .ToListAsync();

                return Ok(patients.Select(ToSafePatientResponse));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving patients.");
                return StatusCode(500, new { error = "Internal server error while retrieving patients." });
            }
        }

        // GET: api/Patient/records
        // Purpose-built response for the Patient Records table. Values are either real database
        // values or derived from related appointment/treatment/prescription records; no fake
        // placeholder clinical values are generated.
        [HttpGet("records")]
        public async Task<ActionResult<IEnumerable<PatientRecordDto>>> GetPatientRecords()
        {
            try
            {
                var patients = await _context.MED_PATIENTS_DETAILS
                    .AsNoTracking()
                    .OrderBy(p => p.MPD_PATIENT_CODE)
                    .ToListAsync();

                if (patients.Count == 0)
                {
                    return Ok(Array.Empty<PatientRecordDto>());
                }

                var patientCodes = patients
                    .Where(p => !string.IsNullOrWhiteSpace(p.MPD_PATIENT_CODE))
                    .Select(p => p.MPD_PATIENT_CODE!)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var appointments = await _context.MED_APPOINMENT_DETAILS
                    .AsNoTracking()
                    .Where(a => a.MAD_PATIENT_CODE != null && patientCodes.Contains(a.MAD_PATIENT_CODE))
                    .ToListAsync();

                var treatments = await _context.MED_TREATMENT_DETAILS
                    .AsNoTracking()
                    .Where(t => t.MTD_PATIENT_CODE != null && patientCodes.Contains(t.MTD_PATIENT_CODE))
                    .ToListAsync();

                var prescriptions = await _context.MED_DRUGS_DETAILS
                    .AsNoTracking()
                    .Where(d => patientCodes.Contains(d.MDD_PATIENT_CODE))
                    .ToListAsync();

                var users = await _context.MED_USER_DETAILS
                    .AsNoTracking()
                    .ToListAsync();

                var usersById = users
                    .Where(u => !string.IsNullOrWhiteSpace(u.MUD_USER_ID))
                    .GroupBy(u => u.MUD_USER_ID!, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

                var today = DateTime.Today;
                var result = new List<PatientRecordDto>(patients.Count);

                foreach (var patient in patients)
                {
                    var code = patient.MPD_PATIENT_CODE ?? string.Empty;

                    var patientAppointments = appointments
                        .Where(a => string.Equals(a.MAD_PATIENT_CODE, code, StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    var activeAppointments = patientAppointments
                        .Where(a => string.IsNullOrWhiteSpace(a.MAD_STATUS) ||
                                    string.Equals(a.MAD_STATUS, "A", StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    var nextAppointment = activeAppointments
                        .Where(a => a.MAD_APPOINMENT_DATE.Date >= today)
                        .OrderBy(a => a.MAD_APPOINMENT_DATE.Date)
                        .ThenBy(a => a.MAD_ALLOCATED_TIME ?? a.MAD_START_TIME ?? TimeSpan.Zero)
                        .FirstOrDefault();

                    var latestAppointment = patientAppointments
                        .OrderByDescending(a => a.MAD_APPOINMENT_DATE.Date)
                        .ThenByDescending(a => a.MAD_ALLOCATED_TIME ?? a.MAD_START_TIME ?? TimeSpan.Zero)
                        .FirstOrDefault();

                    var latestPastAppointment = patientAppointments
                        .Where(a => a.MAD_APPOINMENT_DATE.Date <= today)
                        .OrderByDescending(a => a.MAD_APPOINMENT_DATE.Date)
                        .ThenByDescending(a => a.MAD_ALLOCATED_TIME ?? a.MAD_START_TIME ?? TimeSpan.Zero)
                        .FirstOrDefault();

                    var patientTreatments = treatments
                        .Where(t => string.Equals(t.MTD_PATIENT_CODE, code, StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    var latestTreatment = patientTreatments
                        .OrderByDescending(GetTreatmentDate)
                        .ThenByDescending(t => t.MTD_SERIAL_NO ?? 0)
                        .FirstOrDefault();

                    var hasPendingPrescription = latestTreatment?.MTD_SERIAL_NO != null &&
                        prescriptions.Any(d =>
                            string.Equals(d.MDD_PATIENT_CODE, code, StringComparison.OrdinalIgnoreCase) &&
                            d.MDD_SERIAL_NO == latestTreatment.MTD_SERIAL_NO.Value &&
                            !string.Equals(d.MDD_STATUS, "I", StringComparison.OrdinalIgnoreCase) &&
                            (d.MDD_QUANTITY ?? 0m) > (d.MDD_GIVEN_QUANTITY ?? 0m));

                    var physicianSourceTreatment = latestTreatment != null &&
                                                   !string.Equals(latestTreatment.MTD_TREATMENT_STATUS, "C", StringComparison.OrdinalIgnoreCase)
                        ? latestTreatment
                        : null;

                    string? physicianId = null;
                    string? physicianName = null;

                    if (physicianSourceTreatment != null && !string.IsNullOrWhiteSpace(physicianSourceTreatment.MTD_DOCTOR))
                    {
                        physicianName = physicianSourceTreatment.MTD_DOCTOR;
                    }
                    else if (nextAppointment != null)
                    {
                        physicianId = NormalizeOptional(nextAppointment.MAD_USER_ID);
                        physicianName = NormalizeOptional(nextAppointment.MAD_DOCTOR);
                    }
                    else if (latestTreatment != null && !string.IsNullOrWhiteSpace(latestTreatment.MTD_DOCTOR))
                    {
                        physicianName = latestTreatment.MTD_DOCTOR;
                    }
                    else if (latestAppointment != null)
                    {
                        physicianId = NormalizeOptional(latestAppointment.MAD_USER_ID);
                        physicianName = NormalizeOptional(latestAppointment.MAD_DOCTOR);
                    }

                    MED_USER_DETAILS? physician = null;
                    if (!string.IsNullOrWhiteSpace(physicianId) && usersById.TryGetValue(physicianId, out var userById))
                    {
                        physician = userById;
                    }
                    else if (!string.IsNullOrWhiteSpace(physicianName))
                    {
                        var normalizedPhysicianName = NormalizeDoctorNameForCompare(physicianName);
                        physician = users.FirstOrDefault(u =>
                            NormalizeDoctorNameForCompare(u.MUD_FULL_NAME) == normalizedPhysicianName ||
                            NormalizeDoctorNameForCompare(u.MUD_USER_NAME) == normalizedPhysicianName);
                    }

                    if (physician != null)
                    {
                        physicianId ??= NormalizeOptional(physician.MUD_USER_ID);
                        physicianName = FirstNonEmpty(
                            physician.MUD_FULL_NAME,
                            physician.MUD_USER_NAME,
                            physicianName);
                    }

                    var (statusCode, statusLabel) = GetClinicalStatus(
                        patient,
                        latestTreatment,
                        nextAppointment,
                        hasPendingPrescription);

                    DateTime? latestTreatmentDate = latestTreatment == null
                        ? null
                        : GetTreatmentDate(latestTreatment);
                    DateTime? lastAppointmentDate = latestPastAppointment?.MAD_APPOINMENT_DATE;
                    var lastEncounterDate = MaxDate(latestTreatmentDate, lastAppointmentDate);

                    result.Add(new PatientRecordDto
                    {
                        PatientCode = code,
                        PatientName = NormalizeOptional(patient.MPD_PATIENT_NAME) ?? "Name not recorded",
                        PatientType = NormalizeOptional(patient.MPD_PATIENT_TYPE),
                        MobileNo = NormalizeOptional(patient.MPD_MOBILE_NO),
                        Email = NormalizeOptional(patient.MPD_EMAIL),
                        NicNo = NormalizeOptional(patient.MPD_NIC_NO),
                        DateOfBirth = patient.MPD_BIRTHDAY,
                        Age = CalculateAge(patient.MPD_BIRTHDAY),
                        Gender = NormalizeGender(patient.MPD_GENDER),
                        BloodGroup = NormalizeOptional(patient.MPD_BLOOD_GROUP),
                        Address = NormalizeOptional(patient.MPD_ADDRESS),
                        City = NormalizeOptional(patient.MPD_CITY),
                        GuardianName = NormalizeOptional(patient.MPD_GUARDIAN),
                        GuardianContactNo = NormalizeOptional(patient.MPD_GUARDIAN_CONTACT_NO),
                        Remarks = NormalizeOptional(patient.MPD_PATIENT_REMARKS),
                        PatientStatus = string.Equals(patient.MPD_STATUS, "I", StringComparison.OrdinalIgnoreCase)
                            ? "Inactive"
                            : string.Equals(patient.MPD_STATUS, "A", StringComparison.OrdinalIgnoreCase)
                                ? "Active"
                                : "Not recorded",
                        ClinicalStatusCode = statusCode,
                        ClinicalStatus = statusLabel,
                        AssignedPhysicianId = physicianId,
                        AssignedPhysicianName = NormalizeOptional(physicianName),
                        Specialization = NormalizeOptional(physician?.MUD_SPECIALIZATION),
                        LastEncounterDate = lastEncounterDate,
                        NextAppointmentDate = nextAppointment?.MAD_APPOINMENT_DATE
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while building patient record list.");
                return StatusCode(500, new { error = "Internal server error while retrieving patient records." });
            }
        }

        // GET: api/Patient/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetPatientById(string id)
        {
            try
            {
                var patient = await _context.MED_PATIENTS_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == id);

                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found." });
                }

                return Ok(ToSafePatientResponse(patient));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving patient with id {PatientId}.", id);
                return StatusCode(500, new { error = "Internal server error." });
            }
        }

        [HttpPost("patient-registration")]
        public async Task<IActionResult> AddingPatients([FromBody] MED_PATIENTS_DETAILS patient)
        {
            try
            {
                var validationError = ValidatePatient(patient);
                if (validationError != null)
                {
                    return BadRequest(new { error = validationError });
                }

                NormalizePatient(patient);

                var existingPatientWithEmail = !string.IsNullOrWhiteSpace(patient.MPD_EMAIL)
                    ? await _context.MED_PATIENTS_DETAILS
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.MPD_EMAIL == patient.MPD_EMAIL)
                    : null;

                var existingPatientWithNic = !string.IsNullOrWhiteSpace(patient.MPD_NIC_NO)
                    ? await _context.MED_PATIENTS_DETAILS
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.MPD_NIC_NO == patient.MPD_NIC_NO)
                    : null;

                if (existingPatientWithEmail != null)
                {
                    return Conflict(new { error = "Patient with this email already exists." });
                }

                if (existingPatientWithNic != null)
                {
                    return Conflict(new { error = "Patient with this NIC already exists." });
                }

                if (string.IsNullOrWhiteSpace(patient.MPD_PATIENT_CODE))
                {
                    patient.MPD_PATIENT_CODE = await GenerateNextPatientCodeAsync();
                }

                patient.MPD_STATUS = string.IsNullOrWhiteSpace(patient.MPD_STATUS) ? "A" : patient.MPD_STATUS.Trim();
                patient.MPD_CREATED_DATE = DateTime.UtcNow;
                patient.MPD_UPDATED_DATE = null;

                _context.MED_PATIENTS_DETAILS.Add(patient);
                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetPatientById),
                    new { id = patient.MPD_PATIENT_CODE },
                    new
                    {
                        message = "Patient registered successfully.",
                        patientCode = patient.MPD_PATIENT_CODE
                    });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update error during patient registration.");
                return StatusCode(500, new { error = "Error updating the database. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during patient registration.");
                return StatusCode(500, new { error = "Internal server error during registration." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPatient(string id, [FromForm] MED_PATIENTS_DETAILS patient, IFormFile? profileImage)
        {
            if (!string.IsNullOrWhiteSpace(patient.MPD_PATIENT_CODE) && id != patient.MPD_PATIENT_CODE)
            {
                return BadRequest(new { error = "Patient code mismatch." });
            }

            try
            {
                var existing = await _context.MED_PATIENTS_DETAILS
                    .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == id);

                if (existing == null)
                {
                    return NotFound(new { error = "Patient not found." });
                }

                if (patient.MPD_BIRTHDAY.HasValue && patient.MPD_BIRTHDAY.Value.Date > DateTime.Today)
                {
                    return BadRequest(new { error = "Date of birth cannot be in the future." });
                }

                existing.MPD_PATIENT_NAME = CoalesceNormalized(patient.MPD_PATIENT_NAME, existing.MPD_PATIENT_NAME);
                existing.MPD_MOBILE_NO = CoalesceNormalized(patient.MPD_MOBILE_NO, existing.MPD_MOBILE_NO);
                existing.MPD_EMAIL = CoalesceNormalized(patient.MPD_EMAIL, existing.MPD_EMAIL);
                existing.MPD_NIC_NO = CoalesceNormalized(patient.MPD_NIC_NO, existing.MPD_NIC_NO);
                existing.MPD_ADDRESS = CoalesceNormalized(patient.MPD_ADDRESS, existing.MPD_ADDRESS);
                existing.MPD_CITY = CoalesceNormalized(patient.MPD_CITY, existing.MPD_CITY);
                existing.MPD_BIRTHDAY = patient.MPD_BIRTHDAY ?? existing.MPD_BIRTHDAY;
                existing.MPD_GENDER = CoalesceNormalized(patient.MPD_GENDER, existing.MPD_GENDER);
                existing.MPD_BLOOD_GROUP = CoalesceNormalized(patient.MPD_BLOOD_GROUP, existing.MPD_BLOOD_GROUP);
                existing.MPD_PATIENT_TYPE = CoalesceNormalized(patient.MPD_PATIENT_TYPE, existing.MPD_PATIENT_TYPE);
                existing.MPD_GUARDIAN = CoalesceNormalized(patient.MPD_GUARDIAN, existing.MPD_GUARDIAN);
                existing.MPD_GUARDIAN_CONTACT_NO = CoalesceNormalized(patient.MPD_GUARDIAN_CONTACT_NO, existing.MPD_GUARDIAN_CONTACT_NO);
                existing.MPD_PATIENT_REMARKS = CoalesceNormalized(patient.MPD_PATIENT_REMARKS, existing.MPD_PATIENT_REMARKS);
                existing.MPD_UPDATED_BY = CoalesceNormalized(patient.MPD_UPDATED_BY, existing.MPD_UPDATED_BY);
                existing.MPD_UPDATED_DATE = DateTime.UtcNow;

                if (profileImage != null)
                {
                    await using var memoryStream = new MemoryStream();
                    await profileImage.CopyToAsync(memoryStream);
                    existing.MPD_PHOTO = memoryStream.ToArray();
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating patient.");
                return Conflict(new { error = "Concurrency error. The patient may have been updated by another user." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating patient.");
                return StatusCode(500, new { error = "Internal server error while updating patient." });
            }
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(string id)
        {
            try
            {
                var patient = await _context.MED_PATIENTS_DETAILS.FindAsync(id);
                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found." });
                }

                _context.MED_PATIENTS_DETAILS.Remove(patient);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Patient deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting patient.");
                return StatusCode(500, new { error = "Internal server error while deleting patient." });
            }
        }

        [HttpPatch("update/{patientCode}")]
        public async Task<IActionResult> UpdatePatient(string patientCode, [FromBody] MED_PATIENTS_DETAILS updatedPatient)
        {
            try
            {
                if (updatedPatient.MPD_BIRTHDAY.HasValue && updatedPatient.MPD_BIRTHDAY.Value.Date > DateTime.Today)
                {
                    return BadRequest(new { error = "Date of birth cannot be in the future." });
                }

                if (!string.IsNullOrWhiteSpace(updatedPatient.MPD_GENDER) &&
                    !AllowedGenders.Contains(updatedPatient.MPD_GENDER.Trim()))
                {
                    return BadRequest(new { error = "Invalid gender value." });
                }

                if (!string.IsNullOrWhiteSpace(updatedPatient.MPD_BLOOD_GROUP) &&
                    !AllowedBloodGroups.Contains(updatedPatient.MPD_BLOOD_GROUP.Trim()))
                {
                    return BadRequest(new { error = "Invalid blood group value." });
                }

                if (!string.IsNullOrWhiteSpace(updatedPatient.MPD_PATIENT_TYPE) &&
                    !AllowedPatientTypes.Contains(updatedPatient.MPD_PATIENT_TYPE.Trim()))
                {
                    return BadRequest(new { error = "Invalid patient category." });
                }

                var patient = await _context.MED_PATIENTS_DETAILS
                    .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientCode);

                if (patient == null)
                {
                    return NotFound(new { error = $"Patient with code {patientCode} not found." });
                }

                var normalizedEmail = NormalizeOptional(updatedPatient.MPD_EMAIL);
                if (normalizedEmail != null)
                {
                    var duplicateEmail = await _context.MED_PATIENTS_DETAILS.AnyAsync(p =>
                        p.MPD_PATIENT_CODE != patientCode && p.MPD_EMAIL == normalizedEmail);
                    if (duplicateEmail)
                    {
                        return Conflict(new { error = "Another patient already uses this email." });
                    }
                }

                var normalizedNic = NormalizeOptional(updatedPatient.MPD_NIC_NO);
                if (normalizedNic != null)
                {
                    var duplicateNic = await _context.MED_PATIENTS_DETAILS.AnyAsync(p =>
                        p.MPD_PATIENT_CODE != patientCode && p.MPD_NIC_NO == normalizedNic);
                    if (duplicateNic)
                    {
                        return Conflict(new { error = "Another patient already uses this NIC." });
                    }
                }

                patient.MPD_PATIENT_NAME = CoalesceNormalized(updatedPatient.MPD_PATIENT_NAME, patient.MPD_PATIENT_NAME);
                patient.MPD_MOBILE_NO = CoalesceNormalized(updatedPatient.MPD_MOBILE_NO, patient.MPD_MOBILE_NO);
                patient.MPD_EMAIL = normalizedEmail ?? patient.MPD_EMAIL;
                patient.MPD_NIC_NO = normalizedNic ?? patient.MPD_NIC_NO;
                patient.MPD_ADDRESS = CoalesceNormalized(updatedPatient.MPD_ADDRESS, patient.MPD_ADDRESS);
                patient.MPD_CITY = CoalesceNormalized(updatedPatient.MPD_CITY, patient.MPD_CITY);
                patient.MPD_PATIENT_REMARKS = CoalesceNormalized(updatedPatient.MPD_PATIENT_REMARKS, patient.MPD_PATIENT_REMARKS);
                patient.MPD_PATIENT_TYPE = CoalesceNormalized(updatedPatient.MPD_PATIENT_TYPE, patient.MPD_PATIENT_TYPE);
                patient.MPD_BIRTHDAY = updatedPatient.MPD_BIRTHDAY ?? patient.MPD_BIRTHDAY;
                patient.MPD_GENDER = CoalesceNormalized(updatedPatient.MPD_GENDER, patient.MPD_GENDER);
                patient.MPD_BLOOD_GROUP = CoalesceNormalized(updatedPatient.MPD_BLOOD_GROUP, patient.MPD_BLOOD_GROUP);
                patient.MPD_GUARDIAN = CoalesceNormalized(updatedPatient.MPD_GUARDIAN, patient.MPD_GUARDIAN);
                patient.MPD_GUARDIAN_CONTACT_NO = CoalesceNormalized(updatedPatient.MPD_GUARDIAN_CONTACT_NO, patient.MPD_GUARDIAN_CONTACT_NO);
                patient.MPD_UPDATED_BY = CoalesceNormalized(updatedPatient.MPD_UPDATED_BY, patient.MPD_UPDATED_BY);
                patient.MPD_UPDATED_DATE = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Patient updated successfully.",
                    patient = ToSafePatientResponse(patient)
                });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update error while updating patient.");
                return StatusCode(500, new { error = "Error updating the database. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating patient.");
                return StatusCode(500, new { error = "Internal server error while updating patient." });
            }
        }

        [HttpGet("patient/findbyemail")]
        public async Task<IActionResult> FindPatientByEmail(string email)
        {
            try
            {
                var normalizedEmail = NormalizeOptional(email);
                if (normalizedEmail == null)
                {
                    return BadRequest(new { error = "Email is required." });
                }

                var patient = await _context.MED_PATIENTS_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.MPD_EMAIL == normalizedEmail);

                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found with this email." });
                }

                return Ok(ToSafePatientResponse(patient));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching for patient by email.");
                return StatusCode(500, new { error = "Internal server error while searching for patient by email." });
            }
        }

        [HttpGet("patient/findbyid")]
        public async Task<IActionResult> FindPatientById(string patientcode)
        {
            var patient = await _context.MED_PATIENTS_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientcode);

            if (patient == null)
            {
                return NotFound(new { error = "Patient not found with this patient code." });
            }

            return Ok(ToSafePatientResponse(patient));
        }

        [HttpGet("SearchBy/{searchTerm}")]
        public async Task<ActionResult<IEnumerable<object>>> SearchBy(string searchTerm)
        {
            try
            {
                var term = searchTerm.Trim();
                var patients = await _context.MED_PATIENTS_DETAILS
                    .AsNoTracking()
                    .Where(p =>
                        (p.MPD_MOBILE_NO != null && p.MPD_MOBILE_NO.Contains(term)) ||
                        (p.MPD_PATIENT_NAME != null && p.MPD_PATIENT_NAME.Contains(term)) ||
                        (p.MPD_NIC_NO != null && p.MPD_NIC_NO.Contains(term)) ||
                        (p.MPD_PATIENT_CODE != null && p.MPD_PATIENT_CODE.Contains(term)))
                    .ToListAsync();

                if (patients.Count == 0)
                {
                    return NotFound(new { error = "No patients found with the provided search term." });
                }

                return Ok(patients.Select(ToSafePatientResponse));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching for patients.");
                return StatusCode(500, new { error = "Internal server error while searching for patients." });
            }
        }

        private async Task<string> GenerateNextPatientCodeAsync()
        {
            var codes = await _context.MED_PATIENTS_DETAILS
                .AsNoTracking()
                .Where(p => p.MPD_PATIENT_CODE != null && p.MPD_PATIENT_CODE.StartsWith("PA"))
                .Select(p => p.MPD_PATIENT_CODE!)
                .ToListAsync();

            var maxNumber = 0;
            foreach (var code in codes)
            {
                if (code.Length > 2 && int.TryParse(code[2..], out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"PA{maxNumber + 1:D4}";
        }

        private static string? ValidatePatient(MED_PATIENTS_DETAILS patient)
        {
            if (string.IsNullOrWhiteSpace(patient.MPD_PATIENT_NAME))
            {
                return "Patient name is required.";
            }

            if (string.IsNullOrWhiteSpace(patient.MPD_MOBILE_NO))
            {
                return "Patient mobile number is required.";
            }

            if (patient.MPD_BIRTHDAY.HasValue && patient.MPD_BIRTHDAY.Value.Date > DateTime.Today)
            {
                return "Date of birth cannot be in the future.";
            }

            if (!string.IsNullOrWhiteSpace(patient.MPD_PATIENT_TYPE) &&
                !AllowedPatientTypes.Contains(patient.MPD_PATIENT_TYPE.Trim()))
            {
                return "Invalid patient category.";
            }

            if (!string.IsNullOrWhiteSpace(patient.MPD_GENDER) &&
                !AllowedGenders.Contains(patient.MPD_GENDER.Trim()))
            {
                return "Invalid gender value.";
            }

            if (!string.IsNullOrWhiteSpace(patient.MPD_BLOOD_GROUP) &&
                !AllowedBloodGroups.Contains(patient.MPD_BLOOD_GROUP.Trim()))
            {
                return "Invalid blood group value.";
            }

            return null;
        }

        private static void NormalizePatient(MED_PATIENTS_DETAILS patient)
        {
            patient.MPD_PATIENT_CODE = NormalizeOptional(patient.MPD_PATIENT_CODE);
            patient.MPD_PATIENT_NAME = NormalizeOptional(patient.MPD_PATIENT_NAME);
            patient.MPD_PATIENT_TYPE = NormalizeOptional(patient.MPD_PATIENT_TYPE);
            patient.MPD_MOBILE_NO = NormalizeOptional(patient.MPD_MOBILE_NO);
            patient.MPD_NIC_NO = NormalizeOptional(patient.MPD_NIC_NO);
            patient.MPD_PATIENT_REMARKS = NormalizeOptional(patient.MPD_PATIENT_REMARKS);
            patient.MPD_ADDRESS = NormalizeOptional(patient.MPD_ADDRESS);
            patient.MPD_GENDER = NormalizeOptional(patient.MPD_GENDER);
            patient.MPD_BLOOD_GROUP = NormalizeOptional(patient.MPD_BLOOD_GROUP);
            patient.MPD_CITY = NormalizeOptional(patient.MPD_CITY);
            patient.MPD_GUARDIAN = NormalizeOptional(patient.MPD_GUARDIAN);
            patient.MPD_GUARDIAN_CONTACT_NO = NormalizeOptional(patient.MPD_GUARDIAN_CONTACT_NO);
            patient.MPD_STATUS = NormalizeOptional(patient.MPD_STATUS);
            patient.MPD_CREATED_BY = NormalizeOptional(patient.MPD_CREATED_BY);
            patient.MPD_UPDATED_BY = NormalizeOptional(patient.MPD_UPDATED_BY);
            patient.MPD_EMAIL = NormalizeOptional(patient.MPD_EMAIL);
        }

        private static object ToSafePatientResponse(MED_PATIENTS_DETAILS patient)
        {
            return new
            {
                patient.MPD_PATIENT_CODE,
                patient.MPD_PATIENT_NAME,
                patient.MPD_PATIENT_TYPE,
                patient.MPD_MOBILE_NO,
                patient.MPD_NIC_NO,
                patient.MPD_PATIENT_REMARKS,
                patient.MPD_ADDRESS,
                patient.MPD_GENDER,
                patient.MPD_BLOOD_GROUP,
                patient.MPD_CITY,
                patient.MPD_GUARDIAN,
                patient.MPD_GUARDIAN_CONTACT_NO,
                patient.MPD_STATUS,
                patient.MPD_CREATED_BY,
                patient.MPD_CREATED_DATE,
                patient.MPD_UPDATED_BY,
                patient.MPD_UPDATED_DATE,
                patient.MPD_BIRTHDAY,
                patient.MPD_EMAIL,
                patient.MPD_PHOTO
            };
        }

        private static (string Code, string Label) GetClinicalStatus(
            MED_PATIENTS_DETAILS patient,
            MED_TREATMENT_DETAILS? latestTreatment,
            MED_APPOINMENT_DETAILS? nextAppointment,
            bool hasPendingPrescription)
        {
            if (string.Equals(patient.MPD_STATUS, "I", StringComparison.OrdinalIgnoreCase))
            {
                return ("DISCHARGED", "Discharged / Inactive");
            }

            if (hasPendingPrescription)
            {
                return ("PENDING_PHARMACY", "Pending Pharmacy");
            }

            if (latestTreatment != null &&
                !string.IsNullOrWhiteSpace(latestTreatment.MTD_TREATMENT_STATUS) &&
                !string.Equals(latestTreatment.MTD_TREATMENT_STATUS, "C", StringComparison.OrdinalIgnoreCase))
            {
                return ("IN_TREATMENT", "In Treatment");
            }

            if (string.Equals(patient.MPD_PATIENT_TYPE, "Inpatient", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(patient.MPD_PATIENT_TYPE, "Emergency", StringComparison.OrdinalIgnoreCase))
            {
                return ("IN_TREATMENT", "Active Inpatient");
            }

            if (nextAppointment != null)
            {
                return ("FOLLOW_UP", "Follow-up Scheduled");
            }

            if (latestTreatment != null &&
                string.Equals(latestTreatment.MTD_TREATMENT_STATUS, "C", StringComparison.OrdinalIgnoreCase))
            {
                return ("COMPLETED", "Encounter Completed");
            }

            return ("REGISTERED", "Registered");
        }

        private static DateTime GetTreatmentDate(MED_TREATMENT_DETAILS treatment)
        {
            if (treatment.MTD_DATE != default)
            {
                return treatment.MTD_DATE;
            }

            return treatment.MTD_CREATED_DATE ?? DateTime.MinValue;
        }

        private static DateTime? MaxDate(DateTime? first, DateTime? second)
        {
            if (!first.HasValue) return second;
            if (!second.HasValue) return first;
            return first.Value >= second.Value ? first : second;
        }

        private static int? CalculateAge(DateTime? dateOfBirth)
        {
            if (!dateOfBirth.HasValue || dateOfBirth.Value.Date > DateTime.Today)
            {
                return null;
            }

            var today = DateTime.Today;
            var birthday = dateOfBirth.Value.Date;
            var age = today.Year - birthday.Year;
            if (birthday > today.AddYears(-age))
            {
                age--;
            }

            return age;
        }

        private static string? NormalizeGender(string? gender)
        {
            var value = NormalizeOptional(gender);
            if (value == null) return null;

            if (string.Equals(value, "M", StringComparison.OrdinalIgnoreCase)) return "Male";
            if (string.Equals(value, "F", StringComparison.OrdinalIgnoreCase)) return "Female";
            return value;
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static string? CoalesceNormalized(string? incoming, string? existing)
        {
            return NormalizeOptional(incoming) ?? existing;
        }

        private static string? FirstNonEmpty(params string?[] values)
        {
            foreach (var value in values)
            {
                var normalized = NormalizeOptional(value);
                if (normalized != null)
                {
                    return normalized;
                }
            }

            return null;
        }

        private static string NormalizeDoctorNameForCompare(string? value)
        {
            var normalized = NormalizeOptional(value)?.ToLowerInvariant() ?? string.Empty;
            if (normalized.StartsWith("dr. ")) normalized = normalized[4..];
            else if (normalized.StartsWith("dr ")) normalized = normalized[3..];
            return normalized.Trim();
        }
    }
}
