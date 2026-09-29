using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
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

        // GET: api/material/{id}
        [HttpGet("{id}")]
        public IActionResult GetMaterialById(string id)
        {
            var material = _context.MED_MATERIAL_CATALOGUE.Find(id);
            if (material == null)
            {
                return NotFound();
            }
            return Ok(material);
        }


        // GET: api/material - in this API showes the only active drugs in the stock
        //[HttpGet]
        //public async Task<IActionResult> GetAllMaterials()
        //{
        //    var materials = await _context.MED_MATERIAL_CATALOGUE
        //                      .Where(m => m.MMC_STATUS != "I")
        //                      .ToListAsync();
        //    return Ok(materials);
        //}

        // GET: api/material
        //Enable to display both active inactive drugs
        [HttpGet]
        public async Task<IActionResult> GetAllMaterials()
        {
            var materials = await _context.MED_MATERIAL_CATALOGUE
                              .Where(m => m.MMC_STATUS == "I" || m.MMC_STATUS == "A")
                              .ToListAsync();
            return Ok(materials);
        }





        // GET: api/material
        /*[HttpGet]
        public async Task<IActionResult> GetAllMaterials()
        {
            var materials = await _context.MED_MATERIAL_CATALOGUE
                                          .Where(m => m.MMC_STATUS == "A")
                                          .ToListAsync();
            return Ok(materials);
        }
*/

        // GET: api/material/search?query=aspirin
        [HttpGet("search")]
        public async Task<IActionResult> SearchMaterials([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Search query cannot be empty.");
            }

            var materials = await _context.MED_MATERIAL_CATALOGUE
                .Where(m => m.MMC_DESCRIPTION.Contains(query)  && m.MMC_STATUS == "A")
                .ToListAsync();

            if (!materials.Any())
            {
                return NotFound("No materials found matching the search query.");
            }

            return Ok(materials);
        }


        [HttpPut("updatematerialstatus")]
        public async Task<IActionResult>updatematerialstatus(string materialcode)
        {

            var material=await _context.MED_MATERIAL_CATALOGUE
                .Where(m => m.MMC_MATERIAL_CODE== materialcode)
                .FirstOrDefaultAsync();

            material.MMC_STATUS = "I";

            await _context.SaveChangesAsync();

            return Ok(material);

        }


        [HttpPost]
        public async Task<IActionResult> PostMaterial([FromBody] MED_MATERIAL_CATALOGUE material)
        {
            var latestMaterial = await _context.MED_MATERIAL_CATALOGUE
                .OrderByDescending(p => p.MMC_MATERIAL_CODE)
                .FirstOrDefaultAsync();

            string newMaterialCode;

            if (latestMaterial != null && !string.IsNullOrEmpty(latestMaterial.MMC_MATERIAL_CODE))
            {
                var latestCode = latestMaterial.MMC_MATERIAL_CODE.Substring(2);
                if (int.TryParse(latestCode, out int latestNumber))
                {
                    newMaterialCode = "MC" + (latestNumber + 1).ToString("D4");
                }
                else
                {
                    newMaterialCode = "MC0001";
                }
            }
            else
            {
                newMaterialCode = "MC0001";
            }

            material.MMC_MATERIAL_CODE = newMaterialCode;

            if (ModelState.IsValid)
            {
                _context.MED_MATERIAL_CATALOGUE.Add(material);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetMaterialById), new { id = material.MMC_MATERIAL_CODE }, material);
            }
            return BadRequest(ModelState);
        }


        //[HttpPatch("{id}")]
        //public async Task<IActionResult> PatchMaterial(string id, [FromBody] MED_MATERIAL_CATALOGUE updatedMaterial)
        //{
        //    var material = await _context.MED_MATERIAL_CATALOGUE.FindAsync(id);

        //    if (material == null)
        //    {
        //        return NotFound("Material not found.");
        //    }


        //    if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_DESCRIPTION))
        //    {
        //        material.MMC_DESCRIPTION = updatedMaterial.MMC_DESCRIPTION;
        //    }

        //    if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_MATERIAL_SPEC))
        //    {
        //        material.MMC_MATERIAL_SPEC = updatedMaterial.MMC_MATERIAL_SPEC;
        //    }

        //    if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_UNIT))
        //    {
        //        material.MMC_UNIT = updatedMaterial.MMC_UNIT;
        //    }

        //    if (updatedMaterial.MMC_REORDER_LEVEL != 0)
        //    {
        //        material.MMC_REORDER_LEVEL = updatedMaterial.MMC_REORDER_LEVEL;
        //    }

        //    if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_STATUS))
        //    {
        //        material.MMC_STATUS = updatedMaterial.MMC_STATUS;
        //    }

        //    if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_UPDATED_BY))
        //    {
        //        material.MMC_UPDATED_BY = updatedMaterial.MMC_UPDATED_BY;
        //    }

        //    // Add this block to update MMC_RATE if it's provided
        //    if (updatedMaterial.MMC_RATE.HasValue)
        //    {
        //        material.MMC_RATE = updatedMaterial.MMC_RATE;
        //    }

        //    // Save the changes
        //    await _context.SaveChangesAsync();

        //    return Ok(material);
        //}

        [HttpPatch("{id}")]
        public async Task<IActionResult> PatchMaterial(string id, [FromBody] MED_MATERIAL_CATALOGUE updatedMaterial)
        {
            if (updatedMaterial == null)
            {
                return BadRequest("Update data cannot be null.");
            }

            var material = await _context.MED_MATERIAL_CATALOGUE.FindAsync(id);
            if (material == null)
            {
                return NotFound("Material not found.");
            }

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_DESCRIPTION))
            {
                material.MMC_DESCRIPTION = updatedMaterial.MMC_DESCRIPTION;
            }

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_MATERIAL_SPEC))
            {
                material.MMC_MATERIAL_SPEC = updatedMaterial.MMC_MATERIAL_SPEC;
            }

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_UNIT))
            {
                material.MMC_UNIT = updatedMaterial.MMC_UNIT;
            }

            if (updatedMaterial.MMC_REORDER_LEVEL.HasValue) 
            {
                material.MMC_REORDER_LEVEL = updatedMaterial.MMC_REORDER_LEVEL;
            }

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_STATUS))
            {
                material.MMC_STATUS = updatedMaterial.MMC_STATUS;
            }

            if (!string.IsNullOrWhiteSpace(updatedMaterial.MMC_UPDATED_BY))
            {
                material.MMC_UPDATED_BY = updatedMaterial.MMC_UPDATED_BY;
            }

            if (updatedMaterial.MMC_RATE.HasValue)
            {
                material.MMC_RATE = updatedMaterial.MMC_RATE;
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(material);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MaterialExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
        }

        private bool MaterialExists(string id)
        {
            return _context.MED_MATERIAL_CATALOGUE.Any(e => e.MMC_MATERIAL_CODE == id);
        }



        // DELETE: api/material/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(string id)
        {
            var material = await _context.MED_MATERIAL_CATALOGUE.FindAsync(id);

            if (material == null)
            {
                return NotFound("Material not found.");
            }

            _context.MED_MATERIAL_CATALOGUE.Remove(material);
            await _context.SaveChangesAsync();

            return Ok("Material deleted successfully.");
        }




    }
}
