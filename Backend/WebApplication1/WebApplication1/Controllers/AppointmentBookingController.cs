using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class AppointmentBookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AppointmentBookingController(ApplicationDbContext context)
        {
            _context = context;
        }

        public sealed class BookAppointmentRequest
        {
            public string PatientCode { get; set; } = string.Empty;
            public int SlotId { get; set; }
        }

        // Intentionally uses the project's existing non-JWT patient flow.
        // Booking + seat allocation are committed in one transaction so the slot count
        // cannot increase unless the appointment record is also stored successfully.
        [HttpPost("book")]
        public async Task<IActionResult> Book(
            [FromBody] BookAppointmentRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.PatientCode))
            {
                return BadRequest(new { error = "Patient code is required." });
            }

            if (request.SlotId <= 0)
            {
                return BadRequest(new { error = "A valid timeslot is required." });
            }

            var patient = await _context.MED_PATIENTS_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item => item.MPD_PATIENT_CODE == request.PatientCode,
                    cancellationToken);

            if (patient == null)
            {
                return NotFound(new { error = "Patient record was not found." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var slot = await _context.MED_TIMESLOT
                    .FirstOrDefaultAsync(
                        item => item.MT_SLOT_ID == request.SlotId,
                        cancellationToken);

                if (slot == null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return NotFound(new { error = "Timeslot was not found." });
                }

                if (slot.MT_TIMESLOT_STATUS == "I" ||
                    slot.MT_DELETE_STATUS == "Y" ||
                    slot.MT_DELETE_STATUS == "y")
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(new { error = "This timeslot is no longer available." });
                }

                var today = DateTime.Today;
                if (slot.MT_SLOT_DATE.Date < today)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(new { error = "This timeslot has already expired." });
                }

                if (slot.MT_SLOT_DATE.Date == today && DateTime.Now.TimeOfDay >= slot.MT_END_TIME)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(new { error = "Booking for this timeslot is closed." });
                }

                var maxPatients = slot.MT_MAXIMUM_PATIENTS ?? 0;
                if (maxPatients <= 0)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(new { error = "This timeslot does not have a valid capacity." });
                }

                if (slot.MT_PATIENT_NO >= maxPatients)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(new { error = "This timeslot is fully booked." });
                }

                var alreadyBooked = await _context.MED_APPOINMENT_DETAILS
                    .AnyAsync(appointment =>
                        appointment.MAD_SLOT_ID == slot.MT_SLOT_ID &&
                        appointment.MAD_PATIENT_CODE == patient.MPD_PATIENT_CODE &&
                        (appointment.MAD_STATUS == null || appointment.MAD_STATUS == "A"),
                        cancellationToken);

                if (alreadyBooked)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(new { error = "You already have an active booking for this timeslot." });
                }

                var nextPatientNumber = slot.MT_PATIENT_NO + 1;
                var allocatedTime = slot.MT_ALLOCATED_TIME ?? slot.MT_START_TIME;

                if (allocatedTime >= slot.MT_END_TIME)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(new { error = "No appointment time remains in this timeslot." });
                }

                var totalMinutes = Math.Max(
                    1,
                    (slot.MT_END_TIME - slot.MT_START_TIME).TotalMinutes);
                var intervalMinutes = Math.Max(
                    1,
                    (int)Math.Floor(totalMinutes / maxPatients));
                var nextAllocation = allocatedTime.Add(TimeSpan.FromMinutes(intervalMinutes));

                if (nextAllocation > slot.MT_END_TIME)
                {
                    nextAllocation = slot.MT_END_TIME;
                }

                var appointment = new MED_APPOINMENT_DETAILS
                {
                    MAD_FULL_NAME = patient.MPD_PATIENT_NAME ?? "Patient",
                    MAD_CONTACT = patient.MPD_MOBILE_NO ?? string.Empty,
                    MAD_PATIENT_NO = nextPatientNumber,
                    MAD_START_TIME = slot.MT_START_TIME,
                    MAD_END_TIME = slot.MT_END_TIME,
                    MAD_APPOINMENT_DATE = slot.MT_SLOT_DATE.Date,
                    MAD_DOCTOR = slot.MT_DOCTOR,
                    MAD_EMAIL = patient.MPD_EMAIL,
                    MAD_ALLOCATED_TIME = allocatedTime,
                    MAD_STATUS = "A",
                    MAD_PATIENT_CODE = patient.MPD_PATIENT_CODE,
                    MAD_SLOT_ID = slot.MT_SLOT_ID,
                    MAD_USER_ID = slot.MT_USER_ID,
                    MAD_CONFIRMATION_SENT = false,
                    MAD_CONFIRMATION_SENT_DATE = null,
                    MAD_REMINDER_EMAIL_SENT = false,
                    MAD_REMINDER_EMAIL_SENT_DATE = null
                };

                slot.MT_PATIENT_NO = nextPatientNumber;
                slot.MT_ALLOCATED_TIME = nextAllocation;

                _context.MED_APPOINMENT_DETAILS.Add(appointment);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return CreatedAtAction(
                    nameof(GetBooking),
                    new { id = appointment.MAD_APPOINMENT_ID },
                    new
                    {
                        appointment.MAD_APPOINMENT_ID,
                        appointment.MAD_PATIENT_CODE,
                        appointment.MAD_APPOINMENT_DATE,
                        appointment.MAD_ALLOCATED_TIME,
                        appointment.MAD_DOCTOR,
                        appointment.MAD_EMAIL,
                        RemainingSlots = maxPatients - nextPatientNumber,
                        Message = "Appointment booked successfully."
                    });
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetBooking(int id)
        {
            var appointment = await _context.MED_APPOINMENT_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.MAD_APPOINMENT_ID == id);

            return appointment == null
                ? NotFound(new { error = "Appointment not found." })
                : Ok(appointment);
        }
    }
}
