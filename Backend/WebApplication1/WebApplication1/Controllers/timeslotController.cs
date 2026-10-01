using Microsoft.AspNetCore.Authorization;
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
            public string? ClinicRoom { get; set; }
            public string? DeliveryChannel { get; set; }
        }

        // GET: api/Timeslot/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<MED_TIMESLOT>> GetTimeslot(int id)
        {
            var timeslot = await _context.MED_TIMESLOT
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.MT_SLOT_ID == id);

            if (timeslot == null)
                return NotFound(new { error = "Timeslot not found." });

            return Ok(timeslot);
        }

        // GET: api/Timeslot
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetAllTimeslots()
        {
            var timeslots = await _context.MED_TIMESLOT
                .AsNoTracking()
                .OrderByDescending(t => t.MT_SLOT_DATE)
                .ThenBy(t => t.MT_START_TIME)
                .ToListAsync();

            return Ok(timeslots);
        }

        [HttpGet("Doctor/{doctorName}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDoctor(string doctorName)
        {
            var timeslots = await _context.MED_TIMESLOT
                .AsNoTracking()
                .Where(t => t.MT_DOCTOR == doctorName && t.MT_TIMESLOT_STATUS != "I")
                .OrderBy(t => t.MT_SLOT_DATE)
                .ThenBy(t => t.MT_START_TIME)
                .ToListAsync();

            if (timeslots.Count == 0)
                return NotFound(new { error = $"No active timeslots found for doctor '{doctorName}'." });

            return Ok(timeslots);
        }

        [HttpGet("Doctorid/{userid}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDoctorid(string userid)
        {
            var today = DateTime.Today;
            var timeslots = await _context.MED_TIMESLOT
                .AsNoTracking()
                .Where(t => t.MT_USER_ID == userid
                         && t.MT_TIMESLOT_STATUS != "I"
                         && t.MT_SLOT_DATE >= today)
                .OrderBy(t => t.MT_SLOT_DATE)
                .ThenBy(t => t.MT_START_TIME)
                .ToListAsync();

            if (timeslots.Count == 0)
                return NotFound(new { error = "No upcoming timeslots found for the selected doctor." });

            return Ok(timeslots);
        }

        [HttpGet("active-timeslots")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetActiveTimeslots()
        {
            var today = DateTime.Today;
            var timeslots = await _context.MED_TIMESLOT
                .AsNoTracking()
                .Where(t => t.MT_TIMESLOT_STATUS != "I" && t.MT_SLOT_DATE >= today)
                .OrderBy(t => t.MT_SLOT_DATE)
                .ThenBy(t => t.MT_START_TIME)
                .ToListAsync();

            return Ok(timeslots);
        }

        // Admin sees all doctors for the date. Doctors see only their own schedule.
        [HttpGet("timeslotcard/{date}/{name}/{role}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDate(string date, string name, string role)
        {
            if (!DateTime.TryParse(date, out var parsedDate))
                return BadRequest(new { error = "Invalid date format." });

            var query = _context.MED_TIMESLOT
                .AsNoTracking()
                .Where(t => t.MT_SLOT_DATE == parsedDate.Date && t.MT_TIMESLOT_STATUS != "I");

            var isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
                       || string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
                query = query.Where(t => t.MT_DOCTOR == name);

            var timeslots = await query
                .OrderBy(t => t.MT_START_TIME)
                .ToListAsync();

            return Ok(timeslots);
        }

        // POST: api/Timeslot
        [HttpPost]
        public async Task<ActionResult<MED_TIMESLOT>> PostTimeslot([FromBody] CreateTimeslotRequest request)
        {
            if (request == null)
                return BadRequest(new { error = "Timeslot details are required." });

            if (string.IsNullOrWhiteSpace(request.DoctorUserId))
                return BadRequest(new { error = "Please select an attending doctor." });

            if (request.SlotDate.Date < DateTime.Today)
                return BadRequest(new { error = "A timeslot cannot be created for a past date." });

            if (request.EndTime <= request.StartTime)
                return BadRequest(new { error = "End time must be later than start time." });

            if ((request.EndTime - request.StartTime).TotalMinutes < 10)
                return BadRequest(new { error = "A clinical timeslot must be at least 10 minutes long." });

            if (request.MaximumPatients < 1 || request.MaximumPatients > 100)
                return BadRequest(new { error = "Maximum patients must be between 1 and 100." });

            var channel = (request.DeliveryChannel ?? string.Empty).Trim();
            if (!string.Equals(channel, "Physical", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(channel, "Telehealth", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { error = "Delivery channel must be Physical or Telehealth." });
            }

            var doctor = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.MUD_USER_ID == request.DoctorUserId
                                       && u.MUD_USER_TYPE == "Doc"
                                       && (u.MUD_STATUS == null || u.MUD_STATUS == "A"));

            if (doctor == null)
                return BadRequest(new { error = "The selected doctor does not exist or is not active." });

            // A logged-in doctor may create/manage only their own schedule.
            if (User.IsInRole("Doc"))
            {
                var currentUsername = User.Identity?.Name;
                if (!string.Equals(currentUsername, doctor.MUD_USER_NAME, StringComparison.OrdinalIgnoreCase))
                    return Forbid();
            }

            var overlaps = await _context.MED_TIMESLOT
                .AsNoTracking()
                .AnyAsync(t => t.MT_USER_ID == doctor.MUD_USER_ID
                            && t.MT_SLOT_DATE == request.SlotDate.Date
                            && t.MT_TIMESLOT_STATUS != "I"
                            && request.StartTime < t.MT_END_TIME
                            && request.EndTime > t.MT_START_TIME);

            if (overlaps)
            {
                return Conflict(new
                {
                    error = "This doctor already has an overlapping active timeslot on the selected date."
                });
            }

            var doctorName = !string.IsNullOrWhiteSpace(doctor.MUD_FULL_NAME)
                ? doctor.MUD_FULL_NAME.Trim()
                : doctor.MUD_USER_NAME?.Trim();

            var timeslot = new MED_TIMESLOT
            {
                MT_SLOT_DATE = request.SlotDate.Date,
                MT_START_TIME = request.StartTime,
                MT_END_TIME = request.EndTime,
                MT_PATIENT_NO = 0,
                MT_MAXIMUM_PATIENTS = request.MaximumPatients,
                MT_DOCTOR = doctorName,
                MT_USER_ID = doctor.MUD_USER_ID,
                MT_ALLOCATED_TIME = request.StartTime,
                MT_TIMESLOT_STATUS = "A",
                MT_DELETE_STATUS = "N",
                MT_CLINIC_ROOM = string.IsNullOrWhiteSpace(request.ClinicRoom) ? null : request.ClinicRoom.Trim(),
                MT_DELIVERY_CHANNEL = string.Equals(channel, "Telehealth", StringComparison.OrdinalIgnoreCase)
                    ? "Telehealth"
                    : "Physical"
            };

            _context.MED_TIMESLOT.Add(timeslot);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTimeslot), new { id = timeslot.MT_SLOT_ID }, timeslot);
        }

        // Hard delete is restricted to Admin. The scheduler UI uses soft deactivation instead.
        [Authorize(Roles = "ADMIN")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteTimeslot(int id)
        {
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);
            if (timeslot == null)
                return NotFound(new { error = "Timeslot not found." });

            _context.MED_TIMESLOT.Remove(timeslot);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("update-status/{id:int}")]
        public async Task<ActionResult> UpdateTime(int id)
        {
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);
            if (timeslot == null)
                return NotFound(new { error = "Timeslot not found." });

            if (timeslot.MT_PATIENT_NO > 0)
            {
                return Conflict(new
                {
                    error = "This timeslot already has patient bookings. Reassign/cancel those appointments before deactivating the slot."
                });
            }

            if (User.IsInRole("Doc"))
            {
                var currentUsername = User.Identity?.Name;
                var currentDoctor = await _context.MED_USER_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.MUD_USER_NAME == currentUsername && u.MUD_USER_TYPE == "Doc");

                if (currentDoctor == null || currentDoctor.MUD_USER_ID != timeslot.MT_USER_ID)
                    return Forbid();
            }

            timeslot.MT_TIMESLOT_STATUS = "I";
            timeslot.MT_DELETE_STATUS = "Y";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Timeslot deactivated successfully." });
        }

        [HttpPatch("{id:int}/incrementSeat")]
        public async Task<IActionResult> Patchseatnum(int id)
        {
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);

            if (timeslot == null)
                return NotFound(new { error = "Timeslot not found." });

            if (timeslot.MT_TIMESLOT_STATUS == "I")
                return BadRequest(new { error = "This timeslot is inactive." });

            if (DateTime.Today > timeslot.MT_SLOT_DATE.Date)
                return BadRequest(new { error = "The timeslot date has passed." });

            var maxPatients = timeslot.MT_MAXIMUM_PATIENTS ?? 0;
            if (maxPatients <= 0)
                return BadRequest(new { error = "This timeslot does not have a valid patient capacity." });

            if (timeslot.MT_PATIENT_NO >= maxPatients)
                return BadRequest(new { error = "No more seats are available in this timeslot." });

            timeslot.MT_PATIENT_NO += 1;

            // Keep the legacy 10-minute allocation behavior, but never move past the slot end.
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
