using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class DoctorDirectoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DoctorDirectoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Read-only endpoint used by the admin scheduler and patient booking UI.
        // Passwords and other sensitive staff fields are never returned.
        [HttpGet]
        public async Task<IActionResult> GetDoctors(
            [FromQuery] string? q,
            [FromQuery] string? specialization)
        {
            var query = _context.MED_USER_DETAILS
                .AsNoTracking()
                .Where(user =>
                    user.MUD_USER_TYPE == "Doc" &&
                    (user.MUD_STATUS == null || user.MUD_STATUS == "A"));

            if (!string.IsNullOrWhiteSpace(q))
            {
                var text = q.Trim();
                query = query.Where(user =>
                    (user.MUD_FULL_NAME != null && user.MUD_FULL_NAME.Contains(text)) ||
                    (user.MUD_USER_NAME != null && user.MUD_USER_NAME.Contains(text)) ||
                    (user.MUD_SPECIALIZATION != null && user.MUD_SPECIALIZATION.Contains(text)));
            }

            if (!string.IsNullOrWhiteSpace(specialization) &&
                !string.Equals(specialization, "All", StringComparison.OrdinalIgnoreCase))
            {
                var specialty = specialization.Trim();
                query = query.Where(user => user.MUD_SPECIALIZATION == specialty);
            }

            var doctors = await query
                .OrderBy(user => user.MUD_FULL_NAME ?? user.MUD_USER_NAME)
                .Select(user => new
                {
                    UserId = user.MUD_USER_ID,
                    UserName = user.MUD_USER_NAME,
                    FullName = user.MUD_FULL_NAME,
                    Specialization = user.MUD_SPECIALIZATION,
                    Status = user.MUD_STATUS
                })
                .ToListAsync();

            return Ok(doctors);
        }

        [HttpGet("specializations")]
        public async Task<IActionResult> GetSpecializations()
        {
            var specializations = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .Where(user =>
                    user.MUD_USER_TYPE == "Doc" &&
                    (user.MUD_STATUS == null || user.MUD_STATUS == "A") &&
                    user.MUD_SPECIALIZATION != null &&
                    user.MUD_SPECIALIZATION != "")
                .Select(user => user.MUD_SPECIALIZATION!)
                .Distinct()
                .OrderBy(value => value)
                .ToListAsync();

            return Ok(specializations);
        }
    }
}
