using Microsoft.AspNetCore.Mvc;
using WebApplication1.Data;
using WebApplication1.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System;
using System.Data;
using WebApplication1.Services;


namespace webapplication3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppointmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AppointmentController> _logger;
        private readonly IConfiguration _configuration;

        public AppointmentController(
            ApplicationDbContext context,
            ILogger<AppointmentController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<ActionResult<MED_APPOINMENT_DETAILS>> PostAppointment(MED_APPOINMENT_DETAILS appointment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.MED_APPOINMENT_DETAILS.Add(appointment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAppointmentById), new { id = appointment.MAD_APPOINMENT_ID }, appointment);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MED_APPOINMENT_DETAILS>> GetAppointmentById(int id)
        {
            var appointment = await _context.MED_APPOINMENT_DETAILS.FindAsync(id);

            if (appointment == null)
            {
                return NotFound();
            }

            return appointment;
        }


        [HttpGet("getappoinments/doctor")]
        public async Task<ActionResult<IEnumerable<object>>> GetAppointmentsByDoctorAndDate(string doctor, DateTime date)
        {
            var appointments = await (from appointment in _context.MED_APPOINMENT_DETAILS
                                      join timeslot in _context.MED_TIMESLOT
                                      on appointment.MAD_SLOT_ID equals timeslot.MT_SLOT_ID into ts
                                      from timeslot in ts.DefaultIfEmpty() // Left join to include null if no timeslot is found
                                      where appointment.MAD_DOCTOR == doctor && appointment.MAD_APPOINMENT_DATE.Date == date.Date
                                      select new
                                      {
                                          appointment.MAD_APPOINMENT_ID,
                                          appointment.MAD_FULL_NAME,
                                          appointment.MAD_CONTACT,
                                          appointment.MAD_PATIENT_NO,
                                          appointment.MAD_ALLOCATED_TIME,
                                          appointment.MAD_PATIENT_CODE,
                                          appointment.MAD_APPOINMENT_DATE,
                                          appointment.MAD_SLOT_ID, // Include slot ID from appointment
                                          TimeslotStartTime = timeslot != null ? timeslot.MT_START_TIME : (TimeSpan?)null, // Include timeslot details
                                          TimeslotEndTime = timeslot != null ? timeslot.MT_END_TIME : (TimeSpan?)null,
                                          TimeslotDate = timeslot != null ? timeslot.MT_SLOT_DATE : (DateTime?)null,
                                          TreatmentStatus = _context.MED_TREATMENT_DETAILS
                                              .Any(t => t.MTD_APPOINMENT_ID == appointment.MAD_APPOINMENT_ID) // Check if the appointment has treatment
                                      })
                                      .ToListAsync();

            if (appointments == null || !appointments.Any())
            {
                return NotFound("No appointments found for the selected date.");
            }

            return Ok(appointments);
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<MED_APPOINMENT_DETAILS>>> GetAllAppointments()
        {
            var appointments = await _context.MED_APPOINMENT_DETAILS
                .OrderBy(a => a.MAD_APPOINMENT_DATE)
                .ThenBy(a => a.MAD_PATIENT_NO)
                .ToListAsync();

            if (appointments == null || !appointments.Any())
            {
                return NotFound("No appointments found.");
            }

            return Ok(appointments);
        }


        //Get both active and inactive appointments

        //[HttpGet("appointments/{slotId}")]
        //public async Task<IActionResult> GetAppointmentsByTimeslot(int slotId)
        //{
        //    var appointments = await _context.MED_APPOINMENT_DETAILS
        //        .Where(a => a.MAD_SLOT_ID == slotId)
        //        .Select(a => new
        //        {
        //            a.MAD_APPOINMENT_ID,
        //            a.MAD_FULL_NAME,
        //            a.MAD_CONTACT,
        //            a.MAD_PATIENT_NO,
        //            a.MAD_ALLOCATED_TIME,
        //            a.MAD_PATIENT_CODE,
        //            a.MAD_APPOINMENT_DATE,
        //            a.MAD_STATUS,
        //            IsCompleted = _context.MED_TREATMENT_DETAILS
        //                .Any(t => t.MTD_APPOINMENT_ID == a.MAD_APPOINMENT_ID)
        //        })
        //        .ToListAsync();

        //    if (appointments == null || appointments.Count == 0)
        //    {
        //        return NotFound("No appointments found for the selected timeslot.");
        //    }

        //    return Ok(appointments);
        //}
        [HttpGet("appointments/{slotId}")]
        public async Task<IActionResult> GetAppointmentsByTimeslot(int slotId)
        {
            var appointments = await _context.MED_APPOINMENT_DETAILS
                .Where(a => a.MAD_SLOT_ID == slotId)
                .Select(a => new
                {
                    a.MAD_APPOINMENT_ID,
                    a.MAD_FULL_NAME,
                    a.MAD_CONTACT,
                    a.MAD_PATIENT_NO,
                    a.MAD_ALLOCATED_TIME,
                    a.MAD_PATIENT_CODE,
                    a.MAD_APPOINMENT_DATE,
                    a.MAD_STATUS,
                    TreatmentStatus = _context.MED_TREATMENT_DETAILS
                        .Where(t => t.MTD_APPOINMENT_ID == a.MAD_APPOINMENT_ID)
                        .Select(t => t.MTD_TREATMENT_STATUS)
                        .FirstOrDefault()
                })
                .ToListAsync();

            if (appointments == null || appointments.Count == 0)
            {
                return NotFound("No appointments found for the selected timeslot.");
            }

            return Ok(appointments);
        }


        //[HttpGet("tomorrows-appointments")]
        //public async Task<IActionResult> GetTomorrowsAppointments()
        //{
        //    var tomorrow = DateTime.Today.AddDays(1);

        //    var appointments = await _context.MED_APPOINMENT_DETAILS
        //        .Where(a => a.MAD_APPOINMENT_DATE.Date == tomorrow.Date)
        //        .Select(a => new
        //        {
        //            a.MAD_APPOINMENT_ID,
        //            a.MAD_FULL_NAME,
        //            a.MAD_CONTACT,
        //            a.MAD_PATIENT_NO,
        //            a.MAD_ALLOCATED_TIME,
        //            a.MAD_PATIENT_CODE,
        //            a.MAD_APPOINMENT_DATE,
        //            a.MAD_DOCTOR
        //        })
        //        .ToListAsync();

        //    return Ok(appointments);
        //}


        //Only active active will be showed
        [HttpGet("tomorrows-appointments")]
        public async Task<IActionResult> GetTomorrowsAppointments()
        {
            var tomorrow = DateTime.Today.AddDays(1);

            var appointments = await _context.MED_APPOINMENT_DETAILS
                .Where(a => a.MAD_APPOINMENT_DATE.Date == tomorrow.Date
                            && (a.MAD_STATUS == null || a.MAD_STATUS == "A"))
                .Select(a => new
                {
                    a.MAD_APPOINMENT_ID,
                    a.MAD_FULL_NAME,
                    a.MAD_CONTACT,
                    a.MAD_PATIENT_NO,
                    a.MAD_ALLOCATED_TIME,
                    a.MAD_PATIENT_CODE,
                    a.MAD_APPOINMENT_DATE,
                    a.MAD_DOCTOR,
                    a.MAD_STATUS
                })
                .ToListAsync();

            return Ok(appointments);
        }

        [HttpPost("send-appointment-confirmation/{appointmentId}")]
        public async Task<IActionResult> SendAppointmentConfirmation(int appointmentId)
        {
            var appointment = await _context.MED_APPOINMENT_DETAILS
                .FirstOrDefaultAsync(a => a.MAD_APPOINMENT_ID == appointmentId);

            if (appointment == null)
            {
                return NotFound("Appointment not found.");
            }

            if (string.IsNullOrWhiteSpace(appointment.MAD_EMAIL))
            {
                return BadRequest(new { message = "No email address is on file for this appointment. Please update the booking with an email before sending a confirmation." });
            }

            var formattedTime = appointment.MAD_ALLOCATED_TIME?.ToString(@"hh\:mm");
            var formattedDate = appointment.MAD_APPOINMENT_DATE.ToString("yyyy-MM-dd");

            // Previously sent via the esystems.cdl.lk SMS gateway - now emailed through
            // Gmail (see EmailService) using the email captured at booking time.
            string messageBody =
                $"This is a reminder for your appointment with Dr. {appointment.MAD_DOCTOR} " +
                $"on {formattedDate} at {formattedTime}. Please arrive 15 minutes before your " +
                $"scheduled time. If you need to reschedule or cancel, please contact us at 0776970808.";

            try
            {
                var emailService = new CareSyncEmailService(_configuration);
                await emailService.SendNotificationEmailAsync(
                    appointment.MAD_EMAIL,
                    appointment.MAD_FULL_NAME,
                    "Your Medicare appointment confirmation",
                    messageBody);

                return Ok(new { message = "Confirmation email sent successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception when sending confirmation email: {ex.Message}");
                return StatusCode(500, new { message = "Error sending confirmation email.", error = ex.Message });
            }
        }


        //[HttpDelete("cancel-appointment/{id}")]
        //public async Task<IActionResult> CancelAppointment(int id)
        //{
        //    var appointment = await _context.MED_APPOINMENT_DETAILS.FindAsync(id);

        //    if (appointment == null)
        //    {
        //        return NotFound();
        //    }

        //    appointment.MAD_STATUS = "I";

        //    try
        //    {
        //        await _context.SaveChangesAsync();
        //        return NoContent();
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, $"Internal server error: {ex.Message}");
        //    }
        //}


        [HttpDelete("cancel-appointment/{id}")]
        public async Task<IActionResult> CancelAppointment(int id)
        {
            var appointment = await _context.MED_APPOINMENT_DETAILS.FindAsync(id);

            if (appointment == null)
            {
                return NotFound();
            }

            appointment.MAD_STATUS = "I";

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Appointment cancelled successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }




        [HttpGet("Test/{id}")]
        public async Task<IActionResult> Fetchbyid(int id)
        {


            var appoinments = await _context.MED_APPOINMENT_DETAILS
                .Where(a => a.MAD_APPOINMENT_ID == id)
                .FirstOrDefaultAsync();

            if (appoinments == null)
            {
                return NotFound("No appointments found for the selected timeslot.");
            }


            return Ok(appoinments);
        }
        // Patient portal appointment history.
        // This mirrors the original working API and projects only the fields the UI uses.
        [HttpGet("getappointment/patientcode")]
        public async Task<ActionResult<IEnumerable<object>>> DetailsById(string patientcode)
        {
            if (string.IsNullOrWhiteSpace(patientcode))
            {
                return BadRequest("Patient code cannot be null or empty.");
            }

            try
            {
                var appointments = await _context.MED_APPOINMENT_DETAILS
                    .AsNoTracking()
                    .Where(a => a.MAD_PATIENT_CODE == patientcode)
                    .OrderByDescending(a => a.MAD_APPOINMENT_DATE)
                    .ThenByDescending(a => a.MAD_ALLOCATED_TIME)
                    .Select(a => new
                    {
                        a.MAD_APPOINMENT_ID,
                        a.MAD_DOCTOR,
                        a.MAD_APPOINMENT_DATE,
                        a.MAD_START_TIME,
                        a.MAD_END_TIME,
                        a.MAD_ALLOCATED_TIME,
                        TreatmentStatus = _context.MED_TREATMENT_DETAILS
                            .Any(t => t.MTD_APPOINMENT_ID == a.MAD_APPOINMENT_ID)
                            ? "Completed"
                            : "Pending"
                    })
                    .ToListAsync();

                if (appointments.Count == 0)
                {
                    return NotFound("No appointments found for the given patient code.");
                }

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to load appointment history for patient {PatientCode}.", patientcode);
                return StatusCode(500, new
                {
                    message = "Unable to load the patient's appointment history."
                });
            }
        }

        [HttpGet("getappointment/email")]
        public async Task<ActionResult<IEnumerable<object>>> getappointmentemail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Email cannot be null or empty.");
            }

            try
            {
                var appointments = await _context.MED_APPOINMENT_DETAILS
                    .AsNoTracking()
                    .Where(a => a.MAD_EMAIL == email)
                    .OrderByDescending(a => a.MAD_APPOINMENT_DATE)
                    .ThenByDescending(a => a.MAD_ALLOCATED_TIME)
                    .Select(a => new
                    {
                        a.MAD_APPOINMENT_ID,
                        a.MAD_DOCTOR,
                        a.MAD_APPOINMENT_DATE,
                        a.MAD_START_TIME,
                        a.MAD_END_TIME,
                        a.MAD_ALLOCATED_TIME,
                        TreatmentStatus = _context.MED_TREATMENT_DETAILS
                            .Any(t => t.MTD_APPOINMENT_ID == a.MAD_APPOINMENT_ID)
                            ? "Completed"
                            : "Pending"
                    })
                    .ToListAsync();

                if (appointments.Count == 0)
                {
                    return NotFound("No appointments found.");
                }

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to load appointment history for email {Email}.", email);
                return StatusCode(500, new
                {
                    message = "Unable to load appointment history."
                });
            }
        }


    }
}