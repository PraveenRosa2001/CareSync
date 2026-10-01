using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace webapplication3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaterialController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MaterialController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Material/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMaterialById(string id)
        {
            var material = await _context.MED_MATERIAL_CATALOGUE
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MMC_MATERIAL_CODE == id);

            return material == null
                ? NotFound(new { message = "Medicine not found." })
                : Ok(material);
        }

        // GET: api/Material
        // Keep both active and inactive catalogue rows so the inventory page can show real status.
        [HttpGet]
        public async Task<IActionResult> GetAllMaterials()
        {
            var materials = await _context.MED_MATERIAL_CATALOGUE
                .AsNoTracking()
                .Where(m => m.MMC_STATUS == "I" || m.MMC_STATUS == "A" || m.MMC_STATUS == null)
                .OrderBy(m => m.MMC_DESCRIPTION)
                .ToListAsync();

            return Ok(materials);
        }

        // GET: api/Material/search?query=aspirin
        [HttpGet("search")]
        public async Task<IActionResult> SearchMaterials([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Search query cannot be empty." });

            var normalized = query.Trim();
            var materials = await _context.MED_MATERIAL_CATALOGUE
                .AsNoTracking()
                .Where(m => m.MMC_STATUS == "A" &&
                            m.MMC_DESCRIPTION != null &&
                            m.MMC_DESCRIPTION.Contains(normalized))
                .OrderBy(m => m.MMC_DESCRIPTION)
                .ToListAsync();

            return materials.Count == 0
                ? NotFound(new { message = "No medicines found matching the search query." })
                : Ok(materials);
        }

        // PUT: api/Material/updatematerialstatus?materialcode=MC0001
        [HttpPut("updatematerialstatus")]
        public async Task<IActionResult> UpdateMaterialStatus([FromQuery] string materialcode)
        {
            if (string.IsNullOrWhiteSpace(materialcode))
                return BadRequest(new { message = "Material code is required." });

            var material = await _context.MED_MATERIAL_CATALOGUE
                .FirstOrDefaultAsync(m => m.MMC_MATERIAL_CODE == materialcode);

            if (material == null)
                return NotFound(new { message = "Medicine not found." });

            material.MMC_STATUS = "I";
            material.MMC_UPDATED_DATE = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(material);
        }

        // POST: api/Material
        [HttpPost]
        public async Task<IActionResult> PostMaterial([FromBody] MED_MATERIAL_CATALOGUE material)
        {
            if (material == null)
                return BadRequest(new { message = "Medicine details are required." });

            var validationError = ValidateMaterial(material, isCreate: true);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            material.MMC_DESCRIPTION = material.MMC_DESCRIPTION!.Trim();
            material.MMC_MATERIAL_SPEC = material.MMC_MATERIAL_SPEC!.Trim();
            material.MMC_UNIT = material.MMC_UNIT!.Trim();
            material.MMC_CATEGORY = string.IsNullOrWhiteSpace(material.MMC_CATEGORY)
                ? null
                : material.MMC_CATEGORY.Trim();
            material.MMC_BATCH_NO = string.IsNullOrWhiteSpace(material.MMC_BATCH_NO)
                ? null
                : material.MMC_BATCH_NO.Trim();
            material.MMC_STATUS = "A";
            material.MMC_CREATED_DATE = DateTime.Now;
            material.MMC_UPDATED_DATE = null;

            // Prevent accidental duplicate SKU registration.
            var duplicateExists = await _context.MED_MATERIAL_CATALOGUE.AnyAsync(m =>
                m.MMC_STATUS != "I" &&
                m.MMC_DESCRIPTION == material.MMC_DESCRIPTION &&
                m.MMC_MATERIAL_SPEC == material.MMC_MATERIAL_SPEC &&
                m.MMC_UNIT == material.MMC_UNIT);

            if (duplicateExists)
            {
                return Conflict(new
                {
                    message = "This medicine, strength and dosage form is already registered in the active formulary."
                });
            }

            material.MMC_MATERIAL_CODE = await GenerateNextMaterialCode();

            try
            {
                _context.MED_MATERIAL_CATALOGUE.Add(material);
                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetMaterialById),
                    new { id = material.MMC_MATERIAL_CODE },
                    material);
            }
            catch (DbUpdateException ex)
            {
                // Do not expose SQL Server stack traces to the browser.
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "The medicine could not be saved. Verify the catalogue database schema and submitted values.",
                    detail = ex.InnerException?.Message
                });
            }
        }

        // PATCH: api/Material/{id}
        [HttpPatch("{id}")]
        public async Task<IActionResult> PatchMaterial(string id, [FromBody] MED_MATERIAL_CATALOGUE updatedMaterial)
        {
            if (updatedMaterial == null)
                return BadRequest(new { message = "Update data cannot be null." });

            var material = await _context.MED_MATERIAL_CATALOGUE.FindAsync(id);
            if (material == null)
                return NotFound(new { message = "Medicine not found." });

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_DESCRIPTION))
                material.MMC_DESCRIPTION = updatedMaterial.MMC_DESCRIPTION.Trim();

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_MATERIAL_SPEC))
                material.MMC_MATERIAL_SPEC = updatedMaterial.MMC_MATERIAL_SPEC.Trim();

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_UNIT))
            {
                if (updatedMaterial.MMC_UNIT.Trim().Length > 50)
                    return BadRequest(new { message = "Dosage form cannot exceed 50 characters." });

                material.MMC_UNIT = updatedMaterial.MMC_UNIT.Trim();
            }

            if (updatedMaterial.MMC_REORDER_LEVEL.HasValue)
            {
                if (updatedMaterial.MMC_REORDER_LEVEL < 0)
                    return BadRequest(new { message = "Current stock cannot be negative." });

                material.MMC_REORDER_LEVEL = updatedMaterial.MMC_REORDER_LEVEL;
            }

            if (updatedMaterial.MMC_MIN_STOCK.HasValue)
            {
                if (updatedMaterial.MMC_MIN_STOCK < 0)
                    return BadRequest(new { message = "Minimum stock level cannot be negative." });

                material.MMC_MIN_STOCK = updatedMaterial.MMC_MIN_STOCK;
            }

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_CATEGORY))
                material.MMC_CATEGORY = updatedMaterial.MMC_CATEGORY.Trim();

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_BATCH_NO))
                material.MMC_BATCH_NO = updatedMaterial.MMC_BATCH_NO.Trim();

            if (updatedMaterial.MMC_EXPIRY_DATE.HasValue)
            {
                if (updatedMaterial.MMC_EXPIRY_DATE.Value.Date < DateTime.Today)
                    return BadRequest(new { message = "Expiry date cannot be in the past." });

                material.MMC_EXPIRY_DATE = updatedMaterial.MMC_EXPIRY_DATE.Value.Date;
            }

            if (updatedMaterial.MMC_RATE.HasValue)
            {
                if (updatedMaterial.MMC_RATE < 0)
                    return BadRequest(new { message = "Unit rate cannot be negative." });

                material.MMC_RATE = updatedMaterial.MMC_RATE;
            }

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_STATUS))
            {
                var status = updatedMaterial.MMC_STATUS.Trim().ToUpperInvariant();
                if (status is not ("A" or "I"))
                    return BadRequest(new { message = "Status must be A (Active) or I (Inactive)." });

                material.MMC_STATUS = status;
            }

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_UPDATED_BY))
                material.MMC_UPDATED_BY = updatedMaterial.MMC_UPDATED_BY.Trim();

            material.MMC_UPDATED_DATE = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(material);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "The medicine could not be updated.",
                    detail = ex.InnerException?.Message
                });
            }
        }

        // DELETE: api/Material/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(string id)
        {
            var material = await _context.MED_MATERIAL_CATALOGUE.FindAsync(id);
            if (material == null)
                return NotFound(new { message = "Medicine not found." });

            _context.MED_MATERIAL_CATALOGUE.Remove(material);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Medicine deleted successfully." });
        }

        private static string? ValidateMaterial(MED_MATERIAL_CATALOGUE material, bool isCreate)
        {
            if (isCreate && string.IsNullOrWhiteSpace(material.MMC_DESCRIPTION))
                return "Medicine name is required.";

            if (isCreate && string.IsNullOrWhiteSpace(material.MMC_MATERIAL_SPEC))
                return "Formulation/strength is required.";

            if (isCreate && string.IsNullOrWhiteSpace(material.MMC_UNIT))
                return "Dosage form is required.";

            if ((material.MMC_UNIT?.Trim().Length ?? 0) > 50)
                return "Dosage form cannot exceed 50 characters.";

            if (material.MMC_REORDER_LEVEL.HasValue && material.MMC_REORDER_LEVEL < 0)
                return "Current stock cannot be negative.";

            if (material.MMC_MIN_STOCK.HasValue && material.MMC_MIN_STOCK < 0)
                return "Minimum stock level cannot be negative.";

            if (material.MMC_RATE.HasValue && material.MMC_RATE < 0)
                return "Unit rate cannot be negative.";

            if (material.MMC_EXPIRY_DATE.HasValue && material.MMC_EXPIRY_DATE.Value.Date < DateTime.Today)
                return "Expiry date cannot be in the past.";

            return null;
        }

        private async Task<string> GenerateNextMaterialCode()
        {
            // Existing codes are MC0001, MC0002, ... . Read them safely instead of
            // assuming the last lexicographic row always contains a numeric suffix.
            var codes = await _context.MED_MATERIAL_CATALOGUE
                .AsNoTracking()
                .Where(m => m.MMC_MATERIAL_CODE.StartsWith("MC"))
                .Select(m => m.MMC_MATERIAL_CODE)
                .ToListAsync();

            var max = 0;
            foreach (var code in codes)
            {
                if (code.Length > 2 && int.TryParse(code[2..], out var number) && number > max)
                    max = number;
            }

            return $"MC{max + 1:D4}";
        }
    }
}
