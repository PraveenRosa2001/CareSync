using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TimeslotController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TimeslotController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class CreateTimeslotRequest
        {
            public DateTime SlotDate { get; set; }
            public TimeSpan StartTime { get; set; }
            public TimeSpan EndTime { get; set; }
            public int MaximumPatients { get; set; }
            public string? DoctorUserId { get; set; }
            public string? AdminUserId { get; set; }
            public string? AdminUserName { get; set; }
            public string? ClinicRoom { get; set; }
            public string? DeliveryChannel { get; set; }
        }

        // CareSync's existing staff login stores both the database user ID and the
        // username in browser session storage. Older sessions may contain a stale ID
        // (for example, usr-1), while the username still matches MED_USER_DETAILS.
        // Verify either real database identity so Admin-only scheduling remains intact
        // without adding/changing JWT authorization.
        private static bool IsActiveStaffStatus(string? status)
        {
            // The existing CareSync database uses "1" for the original Admin account,
            // while newer staff rows created by the application use "A".
            // Treat both conventions as active without changing login/JWT behaviour.
            if (string.IsNullOrWhiteSpace(status))
            {
                return true;
            }

            var normalized = status.Trim().ToUpperInvariant();
            return normalized == "1" ||
                   normalized == "A" ||
                   normalized == "Y";
        }

        private async Task<bool> IsActiveAdministratorAsync(
            string? adminUserId,
            string? adminUserName)
        {
            var normalizedId = adminUserId?.Trim();
            var normalizedUserName = adminUserName?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedId) &&
                string.IsNullOrWhiteSpace(normalizedUserName))
            {
                return false;
            }

            // Resolve the actual staff row first, then normalize role/status in C#.
            // This avoids rejecting legacy rows such as:
            // ADM0001 / AdminTest / ADMIN / status=1.
            var candidates = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .Where(user =>
                    (!string.IsNullOrEmpty(normalizedId) && user.MUD_USER_ID == normalizedId) ||
                    (!string.IsNullOrEmpty(normalizedUserName) && user.MUD_USER_NAME == normalizedUserName))
                .ToListAsync();

            return candidates.Any(user =>
                string.Equals(
                    user.MUD_USER_TYPE?.Trim(),
                    "ADMIN",
                    StringComparison.OrdinalIgnoreCase) &&
                IsActiveStaffStatus(user.MUD_STATUS));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<MED_TIMESLOT>> GetTimeslot(int id)
        {
            var timeslot = await _context.MED_TIMESLOT
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.MT_SLOT_ID == id);

            return timeslot == null
                ? NotFound(new { error = "Timeslot not found." })
                : Ok(timeslot);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetAllTimeslots()
        {
            var timeslots = await _context.MED_TIMESLOT
                .AsNoTracking()
                .OrderBy(t => t.MT_SLOT_DATE)
                .ThenBy(t => t.MT_START_TIME)
                .ToListAsync();

            return Ok(timeslots);
        }

        [HttpGet("active-timeslots")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetActiveTimeslots()
        {
            var today = DateTime.Today;

            var timeslots = await _context.MED_TIMESLOT
                .AsNoTracking()
                .Where(t =>
                    t.MT_SLOT_DATE >= today &&
                    t.MT_TIMESLOT_STATUS != "I" &&
                    t.MT_DELETE_STATUS != "Y" &&
                    t.MT_DELETE_STATUS != "y")
                .OrderBy(t => t.MT_SLOT_DATE)
                .ThenBy(t => t.MT_START_TIME)
                .ToListAsync();

            return Ok(timeslots);
        }

        [HttpGet("Doctor/{doctorName}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDoctor(string doctorName)
        {
            var today = DateTime.Today;

            var timeslots = await _context.MED_TIMESLOT
                .AsNoTracking()
                .Where(t =>
                    t.MT_DOCTOR == doctorName &&
                    t.MT_SLOT_DATE >= today &&
                    t.MT_TIMESLOT_STATUS != "I" &&
                    t.MT_DELETE_STATUS != "Y" &&
                    t.MT_DELETE_STATUS != "y")
                .OrderBy(t => t.MT_SLOT_DATE)
                .ThenBy(t => t.MT_START_TIME)
                .ToListAsync();

            return Ok(timeslots);
        }

        [HttpGet("Doctorid/{userid}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDoctorid(string userid)
        {
            var today = DateTime.Today;

            var timeslots = await _context.MED_TIMESLOT
                .AsNoTracking()
                .Where(t =>
                    t.MT_USER_ID == userid &&
                    t.MT_SLOT_DATE >= today &&
                    t.MT_TIMESLOT_STATUS != "I" &&
                    t.MT_DELETE_STATUS != "Y" &&
                    t.MT_DELETE_STATUS != "y")
                .OrderBy(t => t.MT_SLOT_DATE)
                .ThenBy(t => t.MT_START_TIME)
                .ToListAsync();

            return Ok(timeslots);
        }

        [HttpGet("timeslotcard/{date}/{name}/{role}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDate(
            string date,
            string name,
            string role)
        {
            if (!DateTime.TryParse(date, out var parsedDate))
            {
                return BadRequest(new { error = "Invalid date format." });
            }

            var query = _context.MED_TIMESLOT
                .AsNoTracking()
                .Where(t =>
                    t.MT_SLOT_DATE.Date == parsedDate.Date &&
                    t.MT_TIMESLOT_STATUS != "I" &&
                    t.MT_DELETE_STATUS != "Y" &&
                    t.MT_DELETE_STATUS != "y");

            var isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) ||
                          string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                query = query.Where(t => t.MT_DOCTOR == name);
            }

            return Ok(await query
                .OrderBy(t => t.MT_START_TIME)
                .ToListAsync());
        }

        // No JWT/Authorize dependency is introduced here.
        // The current logged-in staff ID sent by the existing frontend session is verified
        // against MED_USER_DETAILS and must be an active ADMIN before a slot is accepted.
        [HttpPost]
        public async Task<ActionResult<MED_TIMESLOT>> PostTimeslot(
            [FromBody] CreateTimeslotRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Timeslot details are required." });
            }

            if (string.IsNullOrWhiteSpace(request.AdminUserId) &&
                string.IsNullOrWhiteSpace(request.AdminUserName))
            {
                return BadRequest(new
                {
                    error = "Administrator identity is required to create a timeslot."
                });
            }

            var adminExists = await IsActiveAdministratorAsync(
                request.AdminUserId,
                request.AdminUserName);

            if (!adminExists)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    error = "The current administrator session could not be matched to an active ADMIN account."
                });
            }

            if (string.IsNullOrWhiteSpace(request.DoctorUserId))
            {
                return BadRequest(new { error = "Please select an attending doctor." });
            }

            if (request.SlotDate.Date < DateTime.Today)
            {
                return BadRequest(new { error = "A timeslot cannot be created for a past date." });
            }

            if (request.EndTime <= request.StartTime)
            {
                return BadRequest(new { error = "End time must be later than start time." });
            }

            if ((request.EndTime - request.StartTime).TotalMinutes < 10)
            {
                return BadRequest(new { error = "A clinical timeslot must be at least 10 minutes long." });
            }

            if (request.MaximumPatients < 1 || request.MaximumPatients > 100)
            {
                return BadRequest(new { error = "Maximum patients must be between 1 and 100." });
            }

            var deliveryChannel = (request.DeliveryChannel ?? "Physical").Trim();
            if (!string.Equals(deliveryChannel, "Physical", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(deliveryChannel, "Telehealth", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { error = "Delivery channel must be Physical or Telehealth." });
            }

            var doctor = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(user =>
                    user.MUD_USER_ID == request.DoctorUserId &&
                    user.MUD_USER_TYPE == "Doc" &&
                    (user.MUD_STATUS == null || user.MUD_STATUS == "A"));

            if (doctor == null)
            {
                return BadRequest(new { error = "The selected doctor does not exist or is not active." });
            }

            var overlappingSlotExists = await _context.MED_TIMESLOT
                .AsNoTracking()
                .AnyAsync(slot =>
                    slot.MT_USER_ID == doctor.MUD_USER_ID &&
                    slot.MT_SLOT_DATE.Date == request.SlotDate.Date &&
                    slot.MT_TIMESLOT_STATUS != "I" &&
                    slot.MT_DELETE_STATUS != "Y" &&
                    slot.MT_DELETE_STATUS != "y" &&
                    request.StartTime < slot.MT_END_TIME &&
                    request.EndTime > slot.MT_START_TIME);

            if (overlappingSlotExists)
            {
                return Conflict(new
                {
                    error = "This doctor already has an overlapping active timeslot on the selected date."
                });
            }

            var doctorName = !string.IsNullOrWhiteSpace(doctor.MUD_FULL_NAME)
                ? doctor.MUD_FULL_NAME.Trim()
                : doctor.MUD_USER_NAME?.Trim() ?? doctor.MUD_USER_ID;

            var timeslot = new MED_TIMESLOT
            {
                MT_SLOT_DATE = request.SlotDate.Date,
                MT_START_TIME = request.StartTime,
                MT_END_TIME = request.EndTime,
                MT_PATIENT_NO = 0,
                MT_MAXIMUM_PATIENTS = request.MaximumPatients,
                MT_DOCTOR = doctorName,
                MT_ALLOCATED_TIME = request.StartTime,
                MT_USER_ID = doctor.MUD_USER_ID,
                MT_TIMESLOT_STATUS = "A",
                MT_DELETE_STATUS = "N",
                MT_CLINIC_ROOM = string.IsNullOrWhiteSpace(request.ClinicRoom)
                    ? null
                    : request.ClinicRoom.Trim(),
                MT_DELIVERY_CHANNEL = string.Equals(
                    deliveryChannel,
                    "Telehealth",
                    StringComparison.OrdinalIgnoreCase)
                    ? "Telehealth"
                    : "Physical",
                MT_REMINDER_EMAIL_SENT = false,
                MT_REMINDER_EMAIL_SENT_DATE = null
            };

            _context.MED_TIMESLOT.Add(timeslot);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetTimeslot),
                new { id = timeslot.MT_SLOT_ID },
                timeslot);
        }

        // Existing soft-deactivation behaviour is preserved. The optional adminUserId
        // simply prevents the updated UI from allowing a non-admin staff member to manage slots.
        [HttpPut("update-status/{id:int}")]
        public async Task<ActionResult> UpdateTime(
            int id,
            [FromQuery] string? adminUserId = null,
            [FromQuery] string? adminUserName = null)
        {
            // The scheduler sends both values. This supports existing sessions where
            // the stored ID is stale but the authenticated username is still correct.
            // No JWT/authorization behaviour is changed here.
            var adminExists = await IsActiveAdministratorAsync(
                adminUserId,
                adminUserName);

            if (!adminExists)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    error = "The current administrator session could not be matched to an active ADMIN account."
                });
            }

            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);
            if (timeslot == null)
            {
                return NotFound(new { error = "Timeslot not found." });
            }

            var existingBookings = Math.Max(0, timeslot.MT_PATIENT_NO);

            // Deactivation closes this slot to NEW bookings. Existing appointment records
            // are intentionally preserved; no patient appointment is deleted or altered here.
            timeslot.MT_TIMESLOT_STATUS = "I";
            timeslot.MT_DELETE_STATUS = "Y";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = existingBookings > 0
                    ? $"Timeslot deactivated for new bookings. {existingBookings} existing appointment(s) were preserved."
                    : "Timeslot deactivated successfully.",
                ExistingBookingsPreserved = existingBookings
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteTimeslot(int id)
        {
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);
            if (timeslot == null)
            {
                return NotFound(new { error = "Timeslot not found." });
            }

            _context.MED_TIMESLOT.Remove(timeslot);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Kept for the existing booking flow. This increments booked seats only when a
        // patient actually books; it does NOT create new future timeslots.
        [HttpPatch("{id:int}/incrementSeat")]
        public async Task<IActionResult> Patchseatnum(int id)
        {
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);

            if (timeslot == null)
            {
                return NotFound(new { error = "Timeslot not found." });
            }

            if (timeslot.MT_TIMESLOT_STATUS == "I" ||
                timeslot.MT_DELETE_STATUS == "Y" ||
                timeslot.MT_DELETE_STATUS == "y")
            {
                return BadRequest(new { error = "This timeslot is inactive." });
            }

            if (DateTime.Today > timeslot.MT_SLOT_DATE.Date)
            {
                return BadRequest(new { error = "The timeslot date has passed." });
            }

            var maxPatients = timeslot.MT_MAXIMUM_PATIENTS ?? 0;
            if (maxPatients <= 0)
            {
                return BadRequest(new { error = "This timeslot does not have a valid patient capacity." });
            }

            if (timeslot.MT_PATIENT_NO >= maxPatients)
            {
                return BadRequest(new { error = "No more seats are available in this timeslot." });
            }

            timeslot.MT_PATIENT_NO += 1;

            var currentAllocated = timeslot.MT_ALLOCATED_TIME ?? timeslot.MT_START_TIME;
            var nextAllocated = currentAllocated.Add(TimeSpan.FromMinutes(10));
            timeslot.MT_ALLOCATED_TIME = nextAllocated <= timeslot.MT_END_TIME
                ? nextAllocated
                : timeslot.MT_END_TIME;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
