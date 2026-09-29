using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;  // Add logging
using WebApplication1.Data;
using WebApplication1.Models;
using System.IO;
using Microsoft.AspNetCore.Authorization;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PatientController> _logger;  // Inject logger

        public PatientController(ApplicationDbContext context, ILogger<PatientController> logger)
        {
            _context = context;
            _logger = logger;  // Initialize logger
        }

        // GET: api/Patient
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MED_PATIENTS_DETAILS>>> GetPatients()
        {
            try
            {
                var patients = await _context.MED_PATIENTS_DETAILS.ToListAsync();
                return Ok(patients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving patients.");
                return StatusCode(500, new { error = "Internal server error while retrieving patients." });
            }
        }

        
        
        // GET: api/Patient/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MED_PATIENTS_DETAILS>> GetPatientById(string id)
        {
            try
            {
                var patient = await _context.MED_PATIENTS_DETAILS.FindAsync(id);

                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found." });
                }

                return Ok(patient);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while retrieving patient with id {id}.");
                return StatusCode(500, new { error = "Internal server error." });
            }
        }

        [HttpPost("patient-registration")]
        public async Task<IActionResult> AddingPatients([FromBody] MED_PATIENTS_DETAILS patient)
        {
            try
            {
                // Check if the email already exists in the database
                var existingPatientWithEmail = !string.IsNullOrEmpty(patient.MPD_EMAIL)
              ? await _context.MED_PATIENTS_DETAILS.FirstOrDefaultAsync(p => p.MPD_EMAIL == patient.MPD_EMAIL)
               : null;


                var existingPatientWithNic = !string.IsNullOrEmpty(patient.MPD_NIC_NO)
             ? await _context.MED_PATIENTS_DETAILS.FirstOrDefaultAsync(p => p.MPD_NIC_NO == patient.MPD_NIC_NO)
              : null;


              
                if (existingPatientWithEmail != null)
                {
                    return Conflict(new { error = "Patient with this email already exists." });
                }

                if (existingPatientWithNic != null)
                {
                    return Conflict(new { error = "Patient with this NIC already exists." });
                }

                // Generate a new patient code if it's null
                if (string.IsNullOrEmpty(patient.MPD_PATIENT_CODE))
                {
                    var lastPatient = await _context.MED_PATIENTS_DETAILS
                        .OrderByDescending(p => p.MPD_PATIENT_CODE)
                        .FirstOrDefaultAsync();

                    var newPatientCodeNumber = lastPatient != null
                        ? int.Parse(lastPatient.MPD_PATIENT_CODE.Substring(2)) + 1
                        : 1;

                    patient.MPD_PATIENT_CODE = $"PA{newPatientCodeNumber:D4}";
                }

                _context.MED_PATIENTS_DETAILS.Add(patient);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPatientById), new { id = patient.MPD_PATIENT_CODE }, patient);
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
            if (id != patient.MPD_PATIENT_CODE)
            {
                return BadRequest(new { error = "Patient code mismatch." });
            }

            try
            {
                if (profileImage != null)
                {
                    using (var memoryStream = new MemoryStream())
                    {
                        await profileImage.CopyToAsync(memoryStream);
                        patient.MPD_PHOTO = memoryStream.ToArray(); // Store the image as a byte array
                    }
                }

                _context.Entry(patient).State = EntityState.Modified;
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

        // DELETE: api/Patient/{id}\

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

                return Ok("patient deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting patient.");
                return StatusCode(500, new { error = "Internal server error while deleting patient." });
            }
        }


        //update patient


        [HttpPatch("update/{patientCode}")]
        public async Task<IActionResult> UpdatePatient(string patientCode, [FromBody] MED_PATIENTS_DETAILS updatedPatient)
        {
            try
            {
                var patient = await _context.MED_PATIENTS_DETAILS
                    .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientCode);

                if (patient == null)
                {
                    return NotFound(new { error = $"Patient with code {patientCode} not found." });
                }

                // Update specific fields (you can add more fields as necessary)
                patient.MPD_PATIENT_NAME = updatedPatient.MPD_PATIENT_NAME ?? patient.MPD_PATIENT_NAME;
                patient.MPD_MOBILE_NO = updatedPatient.MPD_MOBILE_NO ?? patient.MPD_MOBILE_NO;
                patient.MPD_EMAIL = updatedPatient.MPD_EMAIL ?? patient.MPD_EMAIL;
                patient.MPD_ADDRESS = updatedPatient.MPD_ADDRESS ?? patient.MPD_ADDRESS;
                patient.MPD_PATIENT_REMARKS=updatedPatient.MPD_PATIENT_REMARKS ?? patient.MPD_PATIENT_REMARKS;
                patient.MPD_UPDATED_BY = updatedPatient.MPD_UPDATED_BY ?? patient.MPD_UPDATED_BY;
                patient.MPD_CITY=updatedPatient.MPD_CITY ?? patient.MPD_CITY;
                patient.MPD_BIRTHDAY=updatedPatient.MPD_BIRTHDAY ?? patient.MPD_BIRTHDAY;
                patient.MPD_GENDER = updatedPatient.MPD_GENDER ?? patient.MPD_GENDER;
                patient.MPD_GUARDIAN=updatedPatient.MPD_GUARDIAN ?? patient.MPD_GUARDIAN;
                patient.MPD_GUARDIAN_CONTACT_NO = updatedPatient.MPD_GUARDIAN_CONTACT_NO ?? patient.MPD_GUARDIAN_CONTACT_NO;
                patient.MPD_NIC_NO=updatedPatient.MPD_NIC_NO ?? patient.MPD_NIC_NO;
                patient.MPD_UPDATED_DATE = DateTime.UtcNow;

                // Save changes to the database
                _context.Entry(patient).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Patient updated successfully.", patient });
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
                var patient = await _context.MED_PATIENTS_DETAILS
                    .FirstOrDefaultAsync(p => p.MPD_EMAIL == email);

                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found with this email." });
                }

                return Ok(patient);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching for patient by email.");
                return StatusCode(500, new { error = "Internal server error while searching for patient by email." });
            }
        }

        [HttpGet("patient/findbyid")]

        public async Task<IActionResult> FindPatientByid(string patientcode)
        {



            var patient = await _context.MED_PATIENTS_DETAILS.FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientcode);


            if (patient == null) {


                return NotFound(new { error = "Patient not found this patietcode" });
            
            }

            return Ok(patient);
            




        }


        // GET: api/Patient/SearchByContact/{contact}
        /*[HttpGet("SearchByContact/{contact}")]
        public async Task<ActionResult<IEnumerable<MED_PATIENTS_DETAILS>>> SearchByContact(string contact)
        {
            try
            {
                var patients = await _context.MED_PATIENTS_DETAILS
                    .Where(p => p.MPD_MOBILE_NO == contact)
                    .ToListAsync();

                if (patients == null || !patients.Any())
                {
                    return NotFound(new { error = "No patients found with this contact." });
                }

                return Ok(patients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching for patients by contact.");
                return StatusCode(500, new { error = "Internal server error while searching for patients by contact." });
            }
        }*/







        [HttpGet("SearchBy/{searchTerm}")]
        public async Task<ActionResult<IEnumerable<MED_PATIENTS_DETAILS>>> SearchBy(string searchTerm)
        {
            try
            {
                var patients = await _context.MED_PATIENTS_DETAILS
                    .Where(p => p.MPD_MOBILE_NO.Contains(searchTerm) ||
                                p.MPD_PATIENT_NAME.Contains(searchTerm))
                    .ToListAsync();

                if (patients == null || !patients.Any())
                {
                    return NotFound(new { error = "No patients found with the provided search term." });
                }

                return Ok(patients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching for patients.");
                return StatusCode(500, new { error = "Internal server error while searching for patients." });
            }
        }


        private bool PatientExists(string id)
        {
            return _context.MED_PATIENTS_DETAILS.Any(e => e.MPD_PATIENT_CODE == id);
        }
    }
}
