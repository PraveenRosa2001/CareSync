using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace webapplication3.Controllers
{
   
    //Update the drugs
    [Route("api/[controller]")]
    [ApiController]
    public class DrugController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DrugController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Drug
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MED_DRUGS_DETAILS>>> GetDrugs()
        {
            return await _context.MED_DRUGS_DETAILS.ToListAsync();
        }

        // GET: api/Drugdetails/{patientcode}
        [HttpGet("Drugdetails/{patientcode}")]
        public async Task<ActionResult<IEnumerable<MED_DRUGS_DETAILS>>> GetDrugDetailsByPatientCode(string patientcode)
        {
            var drugs = await _context.MED_DRUGS_DETAILS
                                      .Where(d => d.MDD_PATIENT_CODE == patientcode)
                                      .ToListAsync();

            if (drugs == null || drugs.Count == 0)
            {
                return NotFound();
            }

            return Ok(drugs);
        }



        [HttpGet("${serialNo}")]

        public async Task<IActionResult> getdrugsbyserialno(int serialNo)
        {
            var drugs = await _context.MED_DRUGS_DETAILS
                       .Where(d => d.MDD_SERIAL_NO == serialNo)
                       .ToListAsync();


            if (drugs == null || drugs.Count == 0)
            {

                return NotFound();
            }

            return Ok(drugs);



        }


        [HttpPut("{serialNo}")]
        public async Task<IActionResult> UpdateDrug(int serialNo, [FromBody] MED_DRUGS_DETAILS updatedDrug)
        {
            if (serialNo != updatedDrug.MDD_SERIAL_NO)
            {
                return BadRequest("Serial number mismatch.");
            }

            var existingDrug = await _context.MED_DRUGS_DETAILS
                .FirstOrDefaultAsync(d => d.MDD_SERIAL_NO == serialNo);

            if (existingDrug == null)
            {
                return NotFound("Drug with the specified serial number not found.");
            }

            // Update fields
            existingDrug.MDD_QUANTITY = updatedDrug.MDD_QUANTITY;
            existingDrug.MDD_RATE = updatedDrug.MDD_RATE;
            existingDrug.MDD_AMOUNT = updatedDrug.MDD_AMOUNT;
            existingDrug.MDD_DOSAGE = updatedDrug.MDD_DOSAGE;
            existingDrug.MDD_TAKES = updatedDrug.MDD_TAKES;
            existingDrug.MDD_GIVEN_QUANTITY = updatedDrug.MDD_GIVEN_QUANTITY;
            existingDrug.MDD_STATUS = updatedDrug.MDD_STATUS;
            existingDrug.MDD_UPDATED_BY = updatedDrug.MDD_UPDATED_BY;
            existingDrug.MDD_UPDATED_DATE = updatedDrug.MDD_UPDATED_DATE;

            // Save changes
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict("A concurrency issue occurred. Please try again.");
            }

            return NoContent();
        }

        /* [HttpGet("{serialNO}")]
         public async Task<IActionResult> gettreatments(int serialNO)
         {



             var drugs = await _context.MED_DRUGS_DETAILS
                       .Where(d => d.MDD_SERIAL_NO == serialNO)
                       .ToListAsync();


             if (drugs == null || drugs.Count == 0)
             {

                 return NotFound();
             }

             return Ok(drugs);




         }*/






        [HttpPut("drugstatusupdate")]
        public async Task<IActionResult> UpdateDrugStatus(string patientCode, int serialNo, string materialCode)
        {
            try
            {
                // Find the medicine record using the composite key
                var drug = await _context.MED_DRUGS_DETAILS
                    .FirstOrDefaultAsync(d => d.MDD_PATIENT_CODE == patientCode
                                           && d.MDD_SERIAL_NO == serialNo
                                           && d.MDD_MATERIAL_CODE == materialCode);

                if (drug == null)
                {
                    return NotFound("Medicine not found.");
                }

                // Update the status to "I" for "Inactive" or removed
                drug.MDD_STATUS = "I";
                drug.MDD_UPDATED_DATE = DateTime.UtcNow;

                // Save changes to the database
                await _context.SaveChangesAsync();

                return Ok("Medicine status updated to 'I'.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }




        [HttpPut("{patientID}/{serialNo}")]
        public async Task<IActionResult> UpdateDrugDetails(string patientID, int serialNo, MED_DRUGS_DETAILS updatedDrug)
        {
            // Validate input
            if (updatedDrug == null)
            {
                return BadRequest(new { message = "Updated drug details cannot be null." });
            }

            // Validate updated metadata
            if (string.IsNullOrWhiteSpace(updatedDrug.MDD_UPDATED_BY) || updatedDrug.MDD_UPDATED_DATE == default)
            {
                return BadRequest(new { message = "UpdatedBy or UpdatedDate is invalid." });
            }

            // Find the drug using both serialNo and patientID (composite key)
            var drug = await _context.MED_DRUGS_DETAILS
                .FirstOrDefaultAsync(d => d.MDD_SERIAL_NO == serialNo && d.MDD_PATIENT_CODE == patientID);

            if (drug == null)
            {
                return NotFound(new { message = "Drug details not found." });
            }

            // Update fields
            drug.MDD_DOSAGE = updatedDrug.MDD_DOSAGE;
            drug.MDD_QUANTITY = updatedDrug.MDD_QUANTITY;
            drug.MDD_TAKES = updatedDrug.MDD_TAKES;
            drug.MDD_UPDATED_BY = updatedDrug.MDD_UPDATED_BY;
            drug.MDD_UPDATED_DATE = updatedDrug.MDD_UPDATED_DATE;

            // Save changes
            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Drug details updated successfully.", updatedDrug = drug });
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new { message = "The drug details were updated by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating drug details.", error = ex.Message });
            }
        }


        [HttpGet("{serialNO}")]
        public async Task<IActionResult> gettreatments(int serialNO)
        {
            var drugs = await (from d in _context.MED_DRUGS_DETAILS
                               join m in _context.MED_MATERIAL_CATALOGUE
                               on d.MDD_MATERIAL_CODE equals m.MMC_MATERIAL_CODE
                               where d.MDD_SERIAL_NO == serialNO && d.MDD_STATUS != "I"
                               select new
                               {
                                   d.MDD_PATIENT_CODE,
                                   d.MDD_SERIAL_NO,
                                   d.MDD_QUANTITY,
                                   d.MDD_TAKES,
                                   d.MDD_MATERIAL_CODE,
                                   d.MDD_STATUS,
                                   d.MDD_AMOUNT,
                                   d.MDD_RATE,
                                   d.MDD_DOSAGE,
                                   d.MDD_GIVEN_QUANTITY,
                                   isFetched=true,
                                   MDD_MATERIAL_NAME = m.MMC_DESCRIPTION
                               }).ToListAsync();

            if (drugs == null || drugs.Count == 0)
            {
                return NotFound();
            }

            return Ok(drugs);
        }







        // GET: api/Drug/{patientCode}/{serialNo}/{materialCode}
        [HttpGet("{patientCode}/{serialNo}/{materialCode}")]
        public async Task<ActionResult<MED_DRUGS_DETAILS>> GetDrug(string patientCode, int serialNo, string materialCode)
        {
            var drug = await _context.MED_DRUGS_DETAILS
                .FindAsync(patientCode, serialNo, materialCode);

            if (drug == null)
            {
                return NotFound();
            }

            return drug;
        }




        // POST: api/Drug
        [HttpPost]
        public async Task<ActionResult<MED_DRUGS_DETAILS>> PostDrug(MED_DRUGS_DETAILS drug)
        {
            _context.MED_DRUGS_DETAILS.Add(drug);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDrug), new
            {
                patientCode = drug.MDD_PATIENT_CODE,
                serialNo = drug.MDD_SERIAL_NO,
                materialCode = drug.MDD_MATERIAL_CODE
            }, drug);
        }

        // PUT: api/Drug/{patientCode}/{serialNo}/{materialCode}
        [HttpPut("{patientCode}/{serialNo}/{materialCode}")]
        public async Task<IActionResult> PutDrug(string patientCode, int serialNo, string materialCode, MED_DRUGS_DETAILS drug)
        {
            if (patientCode != drug.MDD_PATIENT_CODE || serialNo != drug.MDD_SERIAL_NO || materialCode != drug.MDD_MATERIAL_CODE)
            {
                return BadRequest();
            }

            _context.Entry(drug).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DrugExists(patientCode, serialNo, materialCode))
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






        [HttpGet("patient/{patientId}/{serialNumber}")]
        public async Task<IActionResult> fetchingdrugs(string patientId,int serialnumber)
        {

            var drugs = await _context.MED_DRUGS_DETAILS
                .Where(d => d.MDD_PATIENT_CODE == patientId && d.MDD_SERIAL_NO == serialnumber)
                .ToListAsync();


            return Ok(drugs);


        }


        // DELETE: api/Drug/{patientCode}/{serialNo}/{materialCode}
        [HttpDelete("{patientCode}/{serialNo}/{materialCode}")]
        public async Task<IActionResult> DeleteDrug(string patientCode, int serialNo, string materialCode)
        {
            var drug = await _context.MED_DRUGS_DETAILS
                .FindAsync(patientCode, serialNo, materialCode);
            if (drug == null)
            {
                return NotFound();
            }

            _context.MED_DRUGS_DETAILS.Remove(drug);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DrugExists(string patientCode, int serialNo, string materialCode)
        {
            return _context.MED_DRUGS_DETAILS.Any(e => e.MDD_PATIENT_CODE == patientCode && e.MDD_SERIAL_NO == serialNo && e.MDD_MATERIAL_CODE == materialCode);
        }
    }
}
