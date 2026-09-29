using Microsoft.AspNetCore.Mvc;

using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
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

        // GET: api/Timeslot/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MED_TIMESLOT>> GetTimeslot(int id)
        {
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);

            if (timeslot == null)
            {
                return NotFound();
            }

            return Ok(timeslot);
        }

        // GET: api/Timeslot
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetAllTimeslots()
        {
            var timeslots = await _context.MED_TIMESLOT.ToListAsync();
            return Ok(timeslots);
        }






        



        [HttpGet("Doctor/{doctorName}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDoctor(string doctorName)
        {
            var timeslots = await _context.MED_TIMESLOT
                                          .Where(t => t.MT_DOCTOR == doctorName)
                                          .OrderByDescending(t => t.MT_SLOT_DATE) // Assuming MT_DATE or similar column exists
                                          .ToListAsync();

            if (timeslots == null || !timeslots.Any())
            {
                return NotFound($"No timeslots found for doctor: {doctorName}");
            }

            return Ok(timeslots);
        }
        [HttpGet("Doctorid/{userid}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDoctorid(string userid)
        {
            var timeslots = await _context.MED_TIMESLOT
                                          .Where(t => t.MT_USER_ID == userid   && t.MT_TIMESLOT_STATUS != "I")
                                          /*.OrderByDescending(t => t.MT_SLOT_DATE)*/ // Assuming MT_DATE or similar column exists
                                          .ToListAsync();

            if (timeslots == null || !timeslots.Any())
            {
                return NotFound($"No timeslots found for doctor: ");
            }

            return Ok(timeslots);
        }


        [HttpGet("active-timeslots")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetActiveTimeslots()
        {
            var timeslots = await _context.MED_TIMESLOT
                .Where(t => t.MT_TIMESLOT_STATUS != "I")
                .ToListAsync();

            return Ok(timeslots);
        }






        //    [HttpGet("timeslotcard/{date}/{name}")]
        //    public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDate(string date, string name)
        //    {
        //        if (!DateTime.TryParse(date, out DateTime parsedDate))
        //        {
        //            return BadRequest("Invalid date format.");
        //        }
        //        //var timeslots = await _context.MED_TIMESLOT
        //        //                               .Where(t => t.MT_SLOT_DATE.Date == parsedDate.Date && t.MT_DOCTOR == "AdminTest")//name
        //        //                               .ToListAsync();

        //        var timeslots = await _context.MED_TIMESLOT
        //.Where(t => t.MT_SLOT_DATE.Date == parsedDate.Date
        //            && t.MT_DOCTOR == name)
        //.ToListAsync();


        //        if (timeslots == null || !timeslots.Any())
        //        {
        //            return NotFound("No timeslots available for the selected date.");
        //        }

        //        return Ok(timeslots);
        //    }


        //ADmin and Other docotor also can see the appointment details based on role
        [HttpGet("timeslotcard/{date}/{name}/{role}")]
        public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDate(string date, string name, string role)
        {
            if (!DateTime.TryParse(date, out DateTime parsedDate))
            {
                return BadRequest("Invalid date format.");
            }

            List<MED_TIMESLOT> timeslots;

            if (role == "Admin")
            {
                timeslots = await _context.MED_TIMESLOT
                    .Where(t => t.MT_SLOT_DATE.Date == parsedDate.Date)
                    .ToListAsync();
            }
            else
            {
                timeslots = await _context.MED_TIMESLOT
                    .Where(t => t.MT_SLOT_DATE.Date == parsedDate.Date
                             && t.MT_DOCTOR == name)
                    .ToListAsync();
            }

            if (timeslots == null || !timeslots.Any())
            {
                return NotFound("No timeslots available for the selected date.");
            }

            return Ok(timeslots);
        }

        //[HttpGet("timeslotcard/{date}/{name?}")]
        //public async Task<ActionResult<IEnumerable<MED_TIMESLOT>>> GetTimeslotsByDate(string date, string name = null)
        //{
        //    if (!DateTime.TryParse(date, out DateTime parsedDate))
        //    {
        //        return BadRequest("Invalid date format.");
        //    }

        //    var query = _context.MED_TIMESLOT
        //                      .Where(t => t.MT_SLOT_DATE.Date == parsedDate.Date);

        //    if (!string.IsNullOrEmpty(name))
        //    {
        //        query = query.Where(t => t.MT_DOCTOR == name);
        //    }

        //    var timeslots = await query.ToListAsync();

        //    if (timeslots == null || !timeslots.Any())
        //    {
        //        return NotFound("No timeslots available for the selected date.");
        //    }

        //    return Ok(timeslots);
        //}




        // POST: api/Timeslot
        [HttpPost]
        public async Task<ActionResult<MED_TIMESLOT>> PostTimeslot(MED_TIMESLOT timeslot)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.MED_TIMESLOT.Add(timeslot);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTimeslot), new { id = timeslot.MT_SLOT_ID }, timeslot);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTimeslot(int id)
        {
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);
            if (timeslot == null)
            {
                return NotFound();
            }
            _context.MED_TIMESLOT.Remove(timeslot);
            await _context.SaveChangesAsync();
            return NoContent();
        }


        [HttpPut("update-status/{id}")]
        public async Task<ActionResult> UpdateTime(int id)
        {
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);

            if (timeslot == null)
            {
                return NotFound("Timeslot not found.");
            }

            timeslot.MT_TIMESLOT_STATUS = "I";
            timeslot.MT_DELETE_STATUS = "y";

            await _context.SaveChangesAsync(); 

            return Ok("Timeslot status updated successfully.");
        }



        [HttpPatch("{id}/incrementSeat")]
        public async Task<IActionResult> Patchseatnum(int id)
        {
            // Find the timeslot by ID
            var timeslot = await _context.MED_TIMESLOT.FindAsync(id);

            if (timeslot == null)
            {
                return NotFound();
            }

            // Check if today's date exceeds the timeslot date
            if (DateTime.Today > timeslot.MT_SLOT_DATE.Date)
            {
                return BadRequest("The timeslot date has passed.");
            }

            // Check if the maximum number of patients is reached
            if (timeslot.MT_MAXIMUM_PATIENTS.HasValue && timeslot.MT_PATIENT_NO >= timeslot.MT_MAXIMUM_PATIENTS)
            {
                return BadRequest("No more seats available.");
            }

            // Increment the seat number
            timeslot.MT_PATIENT_NO += 1;

            // Increment the allocated time by 10 minutes
            timeslot.MT_ALLOCATED_TIME = timeslot.MT_ALLOCATED_TIME + TimeSpan.FromMinutes(10);

            // Mark the timeslot as modified
            _context.Entry(timeslot).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TimeslotExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }



        private bool TimeslotExists(int id)
        {
            return _context.MED_TIMESLOT.Any(e => e.MT_SLOT_ID == id);
        }
    }
}
