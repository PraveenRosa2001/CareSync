using Microsoft.AspNetCore.Mvc;
using WebApplication1.Data;
using WebApplication1.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using WebApplication1.Services;


namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TreatmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TreatmentController> _logger;
        private readonly IConfiguration _configuration;

        public TreatmentController(
            ApplicationDbContext context,
            ILogger<TreatmentController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }




        // GET: api/treatment/{patientId}/{serialNo}
        [HttpGet("{patientId}/{serialNo}")]
        public async Task<ActionResult<MED_TREATMENT_DETAILS>> GetById(string patientId, int serialNo)
        {
            var treatment = await _context.MED_TREATMENT_DETAILS
                                          .FirstOrDefaultAsync(t => t.MTD_PATIENT_CODE == patientId && t.MTD_SERIAL_NO == serialNo);

            if (treatment == null)
            {
                return NotFound();
            }

            return Ok(treatment);
        }


        [HttpPut("{patientID}/{serialNO}")]
        public async Task<ActionResult<MED_TREATMENT_DETAILS>> UpdateTreatmentDetails(string patientID, int serialNO, MED_TREATMENT_DETAILS updatedDetails)
        {
            // Fetch the existing treatment details based on patientID and serialNO
            var treatment = await _context.MED_TREATMENT_DETAILS
                                          .FirstOrDefaultAsync(t => t.MTD_PATIENT_CODE == patientID && t.MTD_SERIAL_NO == serialNO);

            if (treatment == null)
            {
                // If no treatment is found, return a NotFound response
                return NotFound(new { message = "Treatment details not found." });
            }

            // Update the fields with the new values from updatedDetails
            treatment.MTD_DATE = updatedDetails.MTD_DATE;
            treatment.MTD_DOCTOR = updatedDetails.MTD_DOCTOR;
            treatment.MTD_TYPE = updatedDetails.MTD_TYPE;
            treatment.MTD_COMPLAIN = updatedDetails.MTD_COMPLAIN;
            treatment.MTD_DIAGNOSTICS = updatedDetails.MTD_DIAGNOSTICS;
            treatment.MTD_REMARKS = updatedDetails.MTD_REMARKS;
            treatment.MTD_AMOUNT = updatedDetails.MTD_AMOUNT;
            treatment.MTD_PAYMENT_STATUS = updatedDetails.MTD_PAYMENT_STATUS;
            treatment.MTD_TREATMENT_STATUS = updatedDetails.MTD_TREATMENT_STATUS;
            treatment.MTD_SMS_STATUS = updatedDetails.MTD_SMS_STATUS;
            treatment.MTD_SMS = updatedDetails.MTD_SMS;
            treatment.MTD_MEDICAL_STATUS = updatedDetails.MTD_MEDICAL_STATUS;
            treatment.MTD_STATUS = updatedDetails.MTD_STATUS;
            treatment.MTD_UPDATED_BY = updatedDetails.MTD_UPDATED_BY;
            treatment.MTD_UPDATED_DATE = DateTime.Now;


            // Save the updated treatment details
            await _context.SaveChangesAsync();

            // Return the updated treatment details
            return Ok(treatment);
        }






        // POST: api/treatment
        [HttpPost]
        public async Task<ActionResult<MED_TREATMENT_DETAILS>> PostTreatment(MED_TREATMENT_DETAILS treatment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.MED_TREATMENT_DETAILS.Add(treatment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { patientId = treatment.MTD_PATIENT_CODE, serialNo = treatment.MTD_SERIAL_NO }, treatment);
        }



        // GET: api/treatment/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MED_TREATMENT_DETAILS>> GetById(int id)
        {
            var treatment = await _context.MED_TREATMENT_DETAILS.FindAsync(id);

            if (treatment == null)
            {
                return NotFound();
            }

            return Ok(treatment);
        }

        // GET: api/treatment/patient/{patientId}
        // Patient portal: schema-safe medical history query.
        // This deliberately reads only the columns required by the portal so newer
        // scheduler/reminder columns cannot break the existing patient history API.
        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetTreatmentsByPatientId(string patientId)
        {
            if (string.IsNullOrWhiteSpace(patientId))
            {
                return BadRequest("Patient code cannot be null or empty.");
            }

            try
            {
                var results = new List<Dictionary<string, object?>>();
                var connection = _context.Database.GetDbConnection();
                var shouldClose = connection.State != ConnectionState.Open;

                if (shouldClose)
                    await connection.OpenAsync();

                try
                {
                    await using var command = connection.CreateCommand();
                    command.CommandText = @"
                        SELECT
                            MTD_PATIENT_CODE,
                            MTD_SERIAL_NO,
                            MTD_DATE,
                            MTD_DOCTOR,
                            MTD_TYPE,
                            MTD_COMPLAIN,
                            MTD_DIAGNOSTICS,
                            MTD_REMARKS,
                            MTD_AMOUNT,
                            MTD_PAYMENT_STATUS,
                            MTD_TREATMENT_STATUS,
                            MTD_SMS_STATUS,
                            MTD_SMS,
                            MTD_MEDICAL_STATUS,
                            MTD_STATUS,
                            MTD_CREATED_BY,
                            MTD_CREATED_DATE,
                            MTD_UPDATED_BY,
                            MTD_UPDATED_DATE,
                            MTD_APPOINMENT_ID,
                            MTD_CHANNEL_NO
                        FROM dbo.MED_TREATMENT_DETAILS
                        WHERE MTD_PATIENT_CODE = @patientId
                        ORDER BY COALESCE(MTD_CREATED_DATE, MTD_DATE) DESC, MTD_SERIAL_NO DESC;";

                    var parameter = command.CreateParameter();
                    parameter.ParameterName = "@patientId";
                    parameter.Value = patientId.Trim();
                    command.Parameters.Add(parameter);

                    await using var reader = await command.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        results.Add(new Dictionary<string, object?>
                        {
                            ["MTD_PATIENT_CODE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_PATIENT_CODE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_PATIENT_CODE"))),
                            ["MTD_SERIAL_NO"] = (reader.IsDBNull(reader.GetOrdinal("MTD_SERIAL_NO")) ? null : reader.GetValue(reader.GetOrdinal("MTD_SERIAL_NO"))),
                            ["MTD_DATE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_DATE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_DATE"))),
                            ["MTD_DOCTOR"] = (reader.IsDBNull(reader.GetOrdinal("MTD_DOCTOR")) ? null : reader.GetValue(reader.GetOrdinal("MTD_DOCTOR"))),
                            ["MTD_TYPE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_TYPE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_TYPE"))),
                            ["MTD_COMPLAIN"] = (reader.IsDBNull(reader.GetOrdinal("MTD_COMPLAIN")) ? null : reader.GetValue(reader.GetOrdinal("MTD_COMPLAIN"))),
                            ["MTD_DIAGNOSTICS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_DIAGNOSTICS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_DIAGNOSTICS"))),
                            ["MTD_REMARKS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_REMARKS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_REMARKS"))),
                            ["MTD_AMOUNT"] = (reader.IsDBNull(reader.GetOrdinal("MTD_AMOUNT")) ? null : reader.GetValue(reader.GetOrdinal("MTD_AMOUNT"))),
                            ["MTD_PAYMENT_STATUS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_PAYMENT_STATUS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_PAYMENT_STATUS"))),
                            ["MTD_TREATMENT_STATUS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_TREATMENT_STATUS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_TREATMENT_STATUS"))),
                            ["MTD_SMS_STATUS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_SMS_STATUS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_SMS_STATUS"))),
                            ["MTD_SMS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_SMS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_SMS"))),
                            ["MTD_MEDICAL_STATUS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_MEDICAL_STATUS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_MEDICAL_STATUS"))),
                            ["MTD_STATUS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_STATUS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_STATUS"))),
                            ["MTD_CREATED_BY"] = (reader.IsDBNull(reader.GetOrdinal("MTD_CREATED_BY")) ? null : reader.GetValue(reader.GetOrdinal("MTD_CREATED_BY"))),
                            ["MTD_CREATED_DATE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_CREATED_DATE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_CREATED_DATE"))),
                            ["MTD_UPDATED_BY"] = (reader.IsDBNull(reader.GetOrdinal("MTD_UPDATED_BY")) ? null : reader.GetValue(reader.GetOrdinal("MTD_UPDATED_BY"))),
                            ["MTD_UPDATED_DATE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_UPDATED_DATE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_UPDATED_DATE"))),
                            ["MTD_APPOINMENT_ID"] = (reader.IsDBNull(reader.GetOrdinal("MTD_APPOINMENT_ID")) ? null : reader.GetValue(reader.GetOrdinal("MTD_APPOINMENT_ID"))),
                            ["MTD_CHANNEL_NO"] = (reader.IsDBNull(reader.GetOrdinal("MTD_CHANNEL_NO")) ? null : reader.GetValue(reader.GetOrdinal("MTD_CHANNEL_NO")))
                        });
                    }
                }
                finally
                {
                    if (shouldClose)
                        await connection.CloseAsync();
                }

                if (results.Count == 0)
                    return NotFound("No treatment records found for the given patient code.");

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load treatment history for patient {PatientId}.", patientId);
                return StatusCode(500, new { message = "Unable to load the patient's medical history." });
            }
        }




        [HttpGet("match/{patientId}/{serialNo}")]
        public async Task<IActionResult> GetMatchedRecords(string patientId, int serialNo)
        {
            var result = await (
                                from d in _context.MED_DRUGS_DETAILS
                                join t in _context.MED_TREATMENT_DETAILS
                                on new { PatientCode = (string)d.MDD_PATIENT_CODE, SerialNo = (int)d.MDD_SERIAL_NO }
                                equals new { PatientCode = (string)t.MTD_PATIENT_CODE, SerialNo = (int)t.MTD_SERIAL_NO }
                                where t.MTD_PATIENT_CODE == patientId && t.MTD_SERIAL_NO == serialNo
                                select new
                                {
                                    t.MTD_PATIENT_CODE,
                                    t.MTD_SERIAL_NO,
                                    t.MTD_DATE,
                                    t.MTD_DOCTOR,
                                    t.MTD_TYPE,
                                    t.MTD_COMPLAIN,
                                    t.MTD_DIAGNOSTICS,
                                    t.MTD_REMARKS,
                                    t.MTD_AMOUNT,
                                    t.MTD_PAYMENT_STATUS,
                                    t.MTD_TREATMENT_STATUS,
                                    d.MDD_MATERIAL_CODE,
                                    d.MDD_QUANTITY,
                                    d.MDD_RATE,
                                    d.MDD_AMOUNT,
                                    d.MDD_DOSAGE,
                                    d.MDD_TAKES,
                                    d.MDD_GIVEN_QUANTITY,
                                    d.MDD_STATUS
                                }).ToListAsync();

            if (!result.Any())
            {
                return NotFound("No matching records found.");
            }

            return Ok(result);
        }


        //[HttpGet("preparationcomplete/")]
        //public async Task<IActionResult> GetPreparationCompleteDetails()
        //{
        //    var result = await (from t in _context.MED_TREATMENT_DETAILS
        //                        join p in _context.MED_PATIENTS_DETAILS
        //                        on t.MTD_PATIENT_CODE equals p.MPD_PATIENT_CODE
        //                        where t.MTD_TREATMENT_STATUS == "P" // Filter for treatment status 'P'
        //                        select new
        //                        {
        //                            // Patient details
        //                            p.MPD_PATIENT_CODE,
        //                            p.MPD_PATIENT_NAME,
        //                            p.MPD_MOBILE_NO,
        //                            p.MPD_NIC_NO,
        //                            p.MPD_ADDRESS
        //                            /* p.MPD_CITY,
        //                             p.MPD_ADDRESS,
        //                             p.MPD_GUARDIAN,
        //                             p.MPD_GUARDIAN_CONTACT_NO,
        //                             p.MPD_birthdate*/,

        //                            // Treatment details
        //                            t.MTD_SERIAL_NO,
        //                            t.MTD_DATE,
        //                            t.MTD_DOCTOR,
        //                            t.MTD_TYPE,
        //                            t.MTD_COMPLAIN,
        //                            t.MTD_DIAGNOSTICS,
        //                            t.MTD_REMARKS,
        //                            t.MTD_AMOUNT,
        //                            t.MTD_PAYMENT_STATUS,
        //                            t.MTD_TREATMENT_STATUS
        //                        }).ToListAsync();

        //    if (!result.Any())
        //    {
        //        return NotFound("No patients found with treatment preparation status 'P'.");
        //    }

        //    return Ok(result);
        //}

        //Update when a soome medicines are not aviavle then that are keeop untill they provided,(The old old is above without this option
        [HttpGet("preparationcomplete/")]
        public async Task<IActionResult> GetPreparationCompleteDetails()
        {
            var result = await (from t in _context.MED_TREATMENT_DETAILS
                                join p in _context.MED_PATIENTS_DETAILS
                                on t.MTD_PATIENT_CODE equals p.MPD_PATIENT_CODE
                                where _context.MED_DRUGS_DETAILS.Any(d =>
                                    d.MDD_PATIENT_CODE == t.MTD_PATIENT_CODE &&
                                    d.MDD_SERIAL_NO == t.MTD_SERIAL_NO &&
                                    (d.MDD_GIVEN_QUANTITY == null || d.MDD_GIVEN_QUANTITY == 0))
                                select new
                                {
                                    p.MPD_PATIENT_CODE,
                                    p.MPD_PATIENT_NAME,
                                    p.MPD_MOBILE_NO,
                                    p.MPD_NIC_NO,
                                    p.MPD_ADDRESS,

                                    t.MTD_SERIAL_NO,
                                    t.MTD_DATE,
                                    t.MTD_DOCTOR,
                                    t.MTD_TYPE,
                                    t.MTD_COMPLAIN,
                                    t.MTD_DIAGNOSTICS,
                                    t.MTD_REMARKS,
                                    t.MTD_AMOUNT,
                                    t.MTD_PAYMENT_STATUS,
                                    t.MTD_TREATMENT_STATUS,
                                    PendingDrugsCount = _context.MED_DRUGS_DETAILS.Count(d =>
                                        d.MDD_PATIENT_CODE == t.MTD_PATIENT_CODE &&
                                        d.MDD_SERIAL_NO == t.MTD_SERIAL_NO &&
                                        (d.MDD_GIVEN_QUANTITY == null || d.MDD_GIVEN_QUANTITY == 0))
                                }).ToListAsync();

            if (!result.Any())
            {
                return NotFound("No patients found with pending medications.");
            }

            return Ok(result);
        }


        //[HttpPatch("update/status/{patientId}/{serialNo}")]
        //public async Task<IActionResult> UpdateTreatmentStatus(string patientId, int serialNo, [FromBody] List<MED_DRUGS_DETAILS> updatedDrugs)
        //{
        //    var treatment = await _context.MED_TREATMENT_DETAILS
        //                                  .FirstOrDefaultAsync(t => t.MTD_PATIENT_CODE == patientId && t.MTD_SERIAL_NO == serialNo);

        //    if (treatment == null)
        //    {
        //        return NotFound();
        //    }

        //    // Update the treatment status to "C"
        //    treatment.MTD_TREATMENT_STATUS = "C";

        //    foreach (var updatedDrug in updatedDrugs)
        //    {
        //        var drug = await _context.MED_DRUGS_DETAILS
        //            .FirstOrDefaultAsync(d => d.MDD_PATIENT_CODE == patientId
        //                                   && d.MDD_SERIAL_NO == serialNo
        //                                   && d.MDD_MATERIAL_CODE == updatedDrug.MDD_MATERIAL_CODE);

        //        if (drug != null)
        //        {
        //            // Update given quantity
        //            drug.MDD_GIVEN_QUANTITY = updatedDrug.MDD_GIVEN_QUANTITY;

        //            // Reduce from the material catalogue reorder level
        //            var material = await _context.MED_MATERIAL_CATALOGUE
        //                .FirstOrDefaultAsync(m => m.MMC_MATERIAL_CODE == updatedDrug.MDD_MATERIAL_CODE);

        //            if (material != null)
        //            {
        //                material.MMC_REORDER_LEVEL -= updatedDrug.MDD_GIVEN_QUANTITY;
        //                // Optional: Make sure reorder level doesn’t go negative
        //                if (material.MMC_REORDER_LEVEL < 0)
        //                    material.MMC_REORDER_LEVEL = 0;
        //            }
        //        }
        //    }

        //    await _context.SaveChangesAsync();
        //    return Ok("Treatment status and drug quantities updated successfully.");
        //}


        //[HttpPatch("update/status/{patientId}/{serialNo}")]
        //public async Task<IActionResult> UpdateTreatmentStatus(string patientId, int serialNo, [FromBody] List<MED_DRUGS_DETAILS> updatedDrugs)
        //{
        //    var treatment = await _context.MED_TREATMENT_DETAILS
        //                                .FirstOrDefaultAsync(t => t.MTD_PATIENT_CODE == patientId && t.MTD_SERIAL_NO == serialNo);

        //    if (treatment == null)
        //    {
        //        return NotFound();
        //    }

        //    // Update the treatment status to "C" (Completed)
        //    treatment.MTD_TREATMENT_STATUS = "C";

        //    // Get all drug details for this treatment first
        //    var allDrugs = await _context.MED_DRUGS_DETAILS
        //        .Where(d => d.MDD_PATIENT_CODE == patientId && d.MDD_SERIAL_NO == serialNo)
        //        .ToListAsync();

        //    foreach (var drug in allDrugs)
        //    {
        //        var updatedDrug = updatedDrugs.FirstOrDefault(u => u.MDD_MATERIAL_CODE == drug.MDD_MATERIAL_CODE);

        //        if (updatedDrug != null)
        //        {
        //            // This drug was given - update stock
        //            var material = await _context.MED_MATERIAL_CATALOGUE
        //                .FirstOrDefaultAsync(m => m.MMC_MATERIAL_CODE == updatedDrug.MDD_MATERIAL_CODE);

        //            if (material != null)
        //            {
        //                decimal quantityToDeduct = (decimal)updatedDrug.MDD_GIVEN_QUANTITY;

        //                if (quantityToDeduct > material.MMC_REORDER_LEVEL)
        //                {
        //                    quantityToDeduct = (decimal)material.MMC_REORDER_LEVEL;
        //                    _logger.LogWarning($"Requested quantity ({updatedDrug.MDD_GIVEN_QUANTITY}) for {material.MMC_MATERIAL_CODE} exceeds available stock ({material.MMC_REORDER_LEVEL}). Dispensing maximum available.");
        //                }

        //                drug.MDD_GIVEN_QUANTITY = quantityToDeduct;
        //                material.MMC_REORDER_LEVEL -= quantityToDeduct;

        //                if (material.MMC_REORDER_LEVEL < 0)
        //                {
        //                    material.MMC_REORDER_LEVEL = 0;
        //                }
        //            }
        //        }
        //        else
        //        {
        //            // This drug was not given - mark it as not given (quantity = 0)
        //            drug.MDD_GIVEN_QUANTITY = 0;

        //            // Optionally, you could add a status field to track this
        //            // drug.MDD_STATUS = "NotGiven";
        //        }
        //    }

        //    await _context.SaveChangesAsync();

        //    // Return the updated drugs including those not given
        //    var resultDrugs = allDrugs.Select(d => new {
        //        MDD_MATERIAL_CODE = d.MDD_MATERIAL_CODE,
        //        MDD_GIVEN_QUANTITY = d.MDD_GIVEN_QUANTITY,
        //        CurrentStock = _context.MED_MATERIAL_CATALOGUE
        //            .Where(m => m.MMC_MATERIAL_CODE == d.MDD_MATERIAL_CODE)
        //            .Select(m => m.MMC_REORDER_LEVEL)
        //            .FirstOrDefault()
        //    }).ToList();

        //    return Ok(new
        //    {
        //        message = "Treatment status and drug quantities updated successfully.",
        //        updatedDrugs = resultDrugs
        //    });
        //}

        //Update when a soome medicines are not aviavle then that are keeop untill they provided,(The old old is above without this option and added condition for check if a drug inactive
        [HttpPatch("update/status/{patientId}/{serialNo}")]
        public async Task<IActionResult> UpdateTreatmentStatus(string patientId, int serialNo, [FromBody] List<MED_DRUGS_DETAILS> updatedDrugs)
        {
            var treatment = await _context.MED_TREATMENT_DETAILS
                .FirstOrDefaultAsync(t => t.MTD_PATIENT_CODE == patientId && t.MTD_SERIAL_NO == serialNo);

            if (treatment == null)
            {
                return NotFound();
            }

            var allDrugs = await _context.MED_DRUGS_DETAILS
                .Where(d => d.MDD_PATIENT_CODE == patientId && d.MDD_SERIAL_NO == serialNo)
                .ToListAsync();

            var stockValidationErrors = new List<string>();
            foreach (var updatedDrug in updatedDrugs.Where(u => u.MDD_GIVEN_QUANTITY > 0))
            {
                var material = await _context.MED_MATERIAL_CATALOGUE
                    .FirstOrDefaultAsync(m => m.MMC_MATERIAL_CODE == updatedDrug.MDD_MATERIAL_CODE);

                if (material == null)
                {
                    stockValidationErrors.Add($"Material {updatedDrug.MDD_MATERIAL_CODE} not found in catalogue");
                    continue;
                }

                if (material.MMC_STATUS == "I")
                {
                    stockValidationErrors.Add($"Material {updatedDrug.MDD_MATERIAL_CODE} is inactive and cannot be provided");
                    continue;
                }

                if (!material.MMC_REORDER_LEVEL.HasValue)
                {
                    stockValidationErrors.Add($"Material {updatedDrug.MDD_MATERIAL_CODE} has no stock level defined");
                    continue;
                }

                if (updatedDrug.MDD_GIVEN_QUANTITY > material.MMC_REORDER_LEVEL.Value)
                {
                    stockValidationErrors.Add(
                        $"Requested quantity ({updatedDrug.MDD_GIVEN_QUANTITY}) for {material.MMC_MATERIAL_CODE} " +
                        $"exceeds available stock ({material.MMC_REORDER_LEVEL.Value})");
                }
            }

            if (stockValidationErrors.Any())
            {
                return BadRequest(new
                {
                    message = "Validation failed",
                    errors = stockValidationErrors
                });
            }

            int providedCount = 0;
            int totalCount = allDrugs.Count;
            List<string> providedDrugCodes = new List<string>();

            foreach (var drug in allDrugs)
            {
                var updatedDrug = updatedDrugs.FirstOrDefault(u => u.MDD_MATERIAL_CODE == drug.MDD_MATERIAL_CODE);

                if (updatedDrug != null && updatedDrug.MDD_GIVEN_QUANTITY > 0)
                {
                    drug.MDD_GIVEN_QUANTITY = updatedDrug.MDD_GIVEN_QUANTITY;
                    providedDrugCodes.Add(drug.MDD_MATERIAL_CODE);
                    providedCount++;

                    var material = await _context.MED_MATERIAL_CATALOGUE
                        .FirstOrDefaultAsync(m => m.MMC_MATERIAL_CODE == updatedDrug.MDD_MATERIAL_CODE);

                    material.MMC_REORDER_LEVEL -= updatedDrug.MDD_GIVEN_QUANTITY;
                }
            }

            treatment.MTD_TREATMENT_STATUS = providedCount == totalCount ? "C" : "P";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Treatment status and drug quantities updated successfully.",
                providedDrugCodes = providedDrugCodes,
                treatmentStatus = treatment.MTD_TREATMENT_STATUS,
                isCompleted = providedCount == totalCount
            });
        }

        [HttpGet("{serialNo}")]
        public async Task<IActionResult> GetTreatmentBySerialNumber(int serialNo)
        {
            var treatment = await _context.MED_TREATMENT_DETAILS
                           .Where(t => t.MTD_SERIAL_NO == serialNo)
                           .ToListAsync();

            if (treatment == null)
            {
                return NotFound();
            }

            return Ok(treatment);
        }



        [HttpGet("patientdetail/treatmentdetail/{patientId}/{serialNo}")]
        public async Task<IActionResult> gettreatmentrecord(string patientId, int serialNo)
        {
            var treatmentquery = from t in _context.MED_TREATMENT_DETAILS
                                 where t.MTD_PATIENT_CODE == patientId && t.MTD_SERIAL_NO == serialNo
                                 select t;

            var drugsquery = from d in _context.MED_DRUGS_DETAILS
                             where d.MDD_PATIENT_CODE == patientId && d.MDD_SERIAL_NO == serialNo
                             join m in _context.MED_MATERIAL_CATALOGUE
                             on d.MDD_MATERIAL_CODE equals m.MMC_MATERIAL_CODE
                             select new
                             {
                                 d.MDD_MATERIAL_CODE,
                                 d.MDD_QUANTITY,
                                 d.MDD_RATE,
                                 d.MDD_AMOUNT,
                                 d.MDD_DOSAGE,
                                 d.MDD_TAKES,
                                 d.MDD_GIVEN_QUANTITY,
                                 d.MDD_STATUS,
                                 MDD_MATERIAL_NAME = m.MMC_DESCRIPTION // Changed property name
                             };

            var treatmentRecord = await (from t in treatmentquery
                                         select new
                                         {
                                             t.MTD_PATIENT_CODE,
                                             t.MTD_SERIAL_NO,
                                             t.MTD_DATE,
                                             t.MTD_DOCTOR,
                                             t.MTD_TYPE,
                                             t.MTD_COMPLAIN,
                                             t.MTD_DIAGNOSTICS,
                                             t.MTD_REMARKS,
                                             t.MTD_AMOUNT,
                                             t.MTD_TREATMENT_STATUS,
                                             Drugs = drugsquery.ToList()
                                         }).FirstOrDefaultAsync();

            if (treatmentRecord == null)
            {
                return NotFound("Treatment record not found.");
            }

            return Ok(treatmentRecord);
        }



        // Patient portal / staff dossier: schema-safe treatment + prescription detail.
        [HttpGet("patient/record/{patientId}/{serialNo}")]
        public async Task<IActionResult> GetTreatmentRecord(string patientId, int serialNo)
        {
            if (string.IsNullOrWhiteSpace(patientId) || serialNo <= 0)
                return BadRequest("A valid patient code and treatment serial number are required.");

            try
            {
                var connection = _context.Database.GetDbConnection();
                var shouldClose = connection.State != ConnectionState.Open;
                if (shouldClose)
                    await connection.OpenAsync();

                try
                {
                    int? firstSerialNo = null;
                    await using (var firstCommand = connection.CreateCommand())
                    {
                        firstCommand.CommandText = @"
                            SELECT MIN(MTD_SERIAL_NO)
                            FROM dbo.MED_TREATMENT_DETAILS
                            WHERE MTD_PATIENT_CODE = @patientId;";
                        var firstPatientParameter = firstCommand.CreateParameter();
                        firstPatientParameter.ParameterName = "@patientId";
                        firstPatientParameter.Value = patientId.Trim();
                        firstCommand.Parameters.Add(firstPatientParameter);
                        var scalar = await firstCommand.ExecuteScalarAsync();
                        if (scalar != null && scalar != DBNull.Value)
                            firstSerialNo = Convert.ToInt32(scalar);
                    }

                    Dictionary<string, object?>? treatment = null;
                    await using (var treatmentCommand = connection.CreateCommand())
                    {
                        treatmentCommand.CommandText = @"
                            SELECT TOP (1)
                                MTD_PATIENT_CODE,
                                MTD_SERIAL_NO,
                                MTD_DATE,
                                MTD_DOCTOR,
                                MTD_TYPE,
                                MTD_COMPLAIN,
                                MTD_DIAGNOSTICS,
                                MTD_REMARKS,
                                MTD_AMOUNT,
                                MTD_PAYMENT_STATUS,
                                MTD_TREATMENT_STATUS,
                                MTD_APPOINMENT_ID,
                                MTD_CHANNEL_NO,
                                MTD_CREATED_DATE
                            FROM dbo.MED_TREATMENT_DETAILS
                            WHERE MTD_PATIENT_CODE = @patientId
                              AND MTD_SERIAL_NO = @serialNo;";
                        var treatmentPatientParameter = treatmentCommand.CreateParameter();
                        treatmentPatientParameter.ParameterName = "@patientId";
                        treatmentPatientParameter.Value = patientId.Trim();
                        treatmentCommand.Parameters.Add(treatmentPatientParameter);
                        var treatmentSerialParameter = treatmentCommand.CreateParameter();
                        treatmentSerialParameter.ParameterName = "@serialNo";
                        treatmentSerialParameter.Value = serialNo;
                        treatmentCommand.Parameters.Add(treatmentSerialParameter);

                        await using var reader = await treatmentCommand.ExecuteReaderAsync();
                        if (await reader.ReadAsync())
                        {
                            var actualSerial = Convert.ToInt32((reader.IsDBNull(reader.GetOrdinal("MTD_SERIAL_NO")) ? null : reader.GetValue(reader.GetOrdinal("MTD_SERIAL_NO"))) ?? serialNo);
                            treatment = new Dictionary<string, object?>
                            {
                                ["MTD_PATIENT_CODE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_PATIENT_CODE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_PATIENT_CODE"))),
                                ["MTD_SERIAL_NO"] = actualSerial,
                                ["MTD_DATE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_DATE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_DATE"))),
                                ["MTD_DOCTOR"] = (reader.IsDBNull(reader.GetOrdinal("MTD_DOCTOR")) ? null : reader.GetValue(reader.GetOrdinal("MTD_DOCTOR"))),
                                ["MTD_TYPE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_TYPE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_TYPE"))),
                                ["MTD_COMPLAIN"] = (reader.IsDBNull(reader.GetOrdinal("MTD_COMPLAIN")) ? null : reader.GetValue(reader.GetOrdinal("MTD_COMPLAIN"))),
                                ["MTD_DIAGNOSTICS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_DIAGNOSTICS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_DIAGNOSTICS"))),
                                ["MTD_REMARKS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_REMARKS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_REMARKS"))),
                                ["MTD_AMOUNT"] = (reader.IsDBNull(reader.GetOrdinal("MTD_AMOUNT")) ? null : reader.GetValue(reader.GetOrdinal("MTD_AMOUNT"))),
                                ["MTD_PAYMENT_STATUS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_PAYMENT_STATUS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_PAYMENT_STATUS"))),
                                ["MTD_TREATMENT_STATUS"] = (reader.IsDBNull(reader.GetOrdinal("MTD_TREATMENT_STATUS")) ? null : reader.GetValue(reader.GetOrdinal("MTD_TREATMENT_STATUS"))),
                                ["MTD_APPOINMENT_ID"] = (reader.IsDBNull(reader.GetOrdinal("MTD_APPOINMENT_ID")) ? null : reader.GetValue(reader.GetOrdinal("MTD_APPOINMENT_ID"))),
                                ["MTD_CHANNEL_NO"] = (reader.IsDBNull(reader.GetOrdinal("MTD_CHANNEL_NO")) ? null : reader.GetValue(reader.GetOrdinal("MTD_CHANNEL_NO"))),
                                ["MTD_CREATED_DATE"] = (reader.IsDBNull(reader.GetOrdinal("MTD_CREATED_DATE")) ? null : reader.GetValue(reader.GetOrdinal("MTD_CREATED_DATE"))),
                                ["Treatmentnumber"] = firstSerialNo.HasValue ? actualSerial - firstSerialNo.Value + 1 : 1
                            };
                        }
                    }

                    if (treatment == null)
                        return NotFound("Treatment record not found.");

                    var drugs = new List<Dictionary<string, object?>>();
                    await using (var drugCommand = connection.CreateCommand())
                    {
                        drugCommand.CommandText = @"
                            SELECT
                                d.MDD_MATERIAL_CODE,
                                d.MDD_QUANTITY,
                                d.MDD_RATE,
                                d.MDD_AMOUNT,
                                d.MDD_DOSAGE,
                                d.MDD_TAKES,
                                d.MDD_GIVEN_QUANTITY,
                                d.MDD_STATUS,
                                m.MMC_DESCRIPTION AS DrugName,
                                m.MMC_REORDER_LEVEL AS Stock
                            FROM dbo.MED_DRUGS_DETAILS AS d
                            LEFT JOIN dbo.MED_MATERIAL_CATALOGUE AS m
                              ON m.MMC_MATERIAL_CODE = d.MDD_MATERIAL_CODE
                            WHERE d.MDD_PATIENT_CODE = @patientId
                              AND d.MDD_SERIAL_NO = @serialNo
                              AND (d.MDD_STATUS IS NULL OR d.MDD_STATUS <> 'I')
                            ORDER BY d.MDD_MATERIAL_CODE;";
                        var drugPatientParameter = drugCommand.CreateParameter();
                        drugPatientParameter.ParameterName = "@patientId";
                        drugPatientParameter.Value = patientId.Trim();
                        drugCommand.Parameters.Add(drugPatientParameter);
                        var drugSerialParameter = drugCommand.CreateParameter();
                        drugSerialParameter.ParameterName = "@serialNo";
                        drugSerialParameter.Value = serialNo;
                        drugCommand.Parameters.Add(drugSerialParameter);

                        await using var reader = await drugCommand.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            drugs.Add(new Dictionary<string, object?>
                            {
                                ["MDD_MATERIAL_CODE"] = (reader.IsDBNull(reader.GetOrdinal("MDD_MATERIAL_CODE")) ? null : reader.GetValue(reader.GetOrdinal("MDD_MATERIAL_CODE"))),
                                ["MDD_QUANTITY"] = (reader.IsDBNull(reader.GetOrdinal("MDD_QUANTITY")) ? null : reader.GetValue(reader.GetOrdinal("MDD_QUANTITY"))),
                                ["MDD_RATE"] = (reader.IsDBNull(reader.GetOrdinal("MDD_RATE")) ? null : reader.GetValue(reader.GetOrdinal("MDD_RATE"))),
                                ["MDD_AMOUNT"] = (reader.IsDBNull(reader.GetOrdinal("MDD_AMOUNT")) ? null : reader.GetValue(reader.GetOrdinal("MDD_AMOUNT"))),
                                ["MDD_DOSAGE"] = (reader.IsDBNull(reader.GetOrdinal("MDD_DOSAGE")) ? null : reader.GetValue(reader.GetOrdinal("MDD_DOSAGE"))),
                                ["MDD_TAKES"] = (reader.IsDBNull(reader.GetOrdinal("MDD_TAKES")) ? null : reader.GetValue(reader.GetOrdinal("MDD_TAKES"))),
                                ["MDD_GIVEN_QUANTITY"] = (reader.IsDBNull(reader.GetOrdinal("MDD_GIVEN_QUANTITY")) ? null : reader.GetValue(reader.GetOrdinal("MDD_GIVEN_QUANTITY"))),
                                ["MDD_STATUS"] = (reader.IsDBNull(reader.GetOrdinal("MDD_STATUS")) ? null : reader.GetValue(reader.GetOrdinal("MDD_STATUS"))),
                                ["DrugName"] = (reader.IsDBNull(reader.GetOrdinal("DrugName")) ? null : reader.GetValue(reader.GetOrdinal("DrugName"))) ?? (reader.IsDBNull(reader.GetOrdinal("MDD_MATERIAL_CODE")) ? null : reader.GetValue(reader.GetOrdinal("MDD_MATERIAL_CODE"))),
                                ["Stock"] = (reader.IsDBNull(reader.GetOrdinal("Stock")) ? null : reader.GetValue(reader.GetOrdinal("Stock")))
                            });
                        }
                    }

                    treatment["Drugs"] = drugs;
                    return Ok(treatment);
                }
                finally
                {
                    if (shouldClose)
                        await connection.CloseAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to load treatment record {PatientId}/{SerialNo}.", patientId, serialNo);
                return StatusCode(500, new { message = "Unable to load the treatment record." });
            }
        }





        [HttpGet("Gettreatments/{patientId}")]
        public async Task<IActionResult> GetTreatmentAmount(string patientId)
        {
            // Validate input
            if (string.IsNullOrEmpty(patientId))
            {
                return BadRequest(new { Message = "Patient code is required" });
            }

            try
            {
                // Use CountAsync for asynchronous operation
                var treatmentCount = await _context.MED_TREATMENT_DETAILS
                    .Where(t => t.MTD_PATIENT_CODE == patientId)
                    .CountAsync();

                // Return the response with a treatment count of zero if no treatments are found
                return Ok(new
                {
                    PatientCode = patientId,
                    TreatmentCount = treatmentCount
                });
            }
            catch (Exception ex)
            {
                // Log the error (optional, recommended)
                return StatusCode(500, new
                {
                    Message = "An error occurred while fetching treatment details.",
                    Error = ex.Message
                });
            }
        }










        [HttpPost("updatingtreatment/{patientid}/{serialno}")]
        public async Task<IActionResult> UpdateTreatmentAndPrescriptions(string patientid, int serialno, [FromBody] TreatmentAndDrugsUpdateModel updateModel)
        {
            // Fetch the Treatment record
            var treatment = await _context.MED_TREATMENT_DETAILS
                .FirstOrDefaultAsync(t => t.MTD_PATIENT_CODE == patientid && t.MTD_SERIAL_NO == serialno);

            if (treatment == null)
            {
                return NotFound("Treatment not found.");
            }

            // Update treatment fields
            treatment.MTD_COMPLAIN = updateModel.Treatment.MTD_COMPLAIN;
            treatment.MTD_DIAGNOSTICS = updateModel.Treatment.MTD_DIAGNOSTICS;
            treatment.MTD_REMARKS = updateModel.Treatment.MTD_REMARKS;
            treatment.MTD_AMOUNT = updateModel.Treatment.MTD_AMOUNT;
            treatment.MTD_UPDATED_BY = updateModel.Treatment.MTD_UPDATED_BY;
            treatment.MTD_TREATMENT_STATUS = updateModel.Treatment.MTD_TREATMENT_STATUS;

            // Save treatment updates
            _context.MED_TREATMENT_DETAILS.Update(treatment);

            // Fetch existing prescriptions for the treatment
            var existingPrescriptions = await _context.MED_DRUGS_DETAILS
                .Where(p => p.MDD_PATIENT_CODE == patientid && p.MDD_SERIAL_NO == serialno)
                .ToListAsync();

            foreach (var drug in updateModel.Drugs)
            {
                // Check if the prescription exists
                var existingPrescription = existingPrescriptions
                    .FirstOrDefault(p => p.MDD_MATERIAL_CODE == drug.MDD_MATERIAL_CODE);

                if (existingPrescription != null)
                {
                    // Update the existing prescription
                    existingPrescription.MDD_QUANTITY = drug.MDD_QUANTITY;
                    existingPrescription.MDD_RATE = drug.MDD_RATE;
                    existingPrescription.MDD_AMOUNT = drug.MDD_AMOUNT;
                    existingPrescription.MDD_DOSAGE = drug.MDD_DOSAGE;
                    existingPrescription.MDD_TAKES = drug.MDD_TAKES;
                    existingPrescription.MDD_GIVEN_QUANTITY = drug.MDD_GIVEN_QUANTITY;
                    existingPrescription.MDD_STATUS = drug.MDD_STATUS;

                }
                else
                {
                    // Add a new prescription if it doesn't exist
                    var newPrescription = new MED_DRUGS_DETAILS
                    {
                        MDD_PATIENT_CODE = patientid,
                        MDD_SERIAL_NO = serialno,
                        MDD_MATERIAL_CODE = drug.MDD_MATERIAL_CODE,
                        MDD_QUANTITY = drug.MDD_QUANTITY,
                        MDD_RATE = drug.MDD_RATE,
                        /* MDD_AMOUNT = drug.MDD_AMOUNT,*/
                        MDD_AMOUNT = drug.MDD_RATE * drug.MDD_QUANTITY,
                        MDD_DOSAGE = drug.MDD_DOSAGE,
                        MDD_TAKES = drug.MDD_TAKES,
                        MDD_GIVEN_QUANTITY = drug.MDD_GIVEN_QUANTITY,
                        MDD_STATUS = drug.MDD_STATUS

                    };
                    await _context.MED_DRUGS_DETAILS.AddAsync(newPrescription);
                }
            }

            // Save all changes to the database
            await _context.SaveChangesAsync();

            return Ok("Treatment and prescriptions updated successfully.");
        }

        //Update the prescription meessage with according to change the medicie list (delete or added the message )
        [HttpPost("send-prescription-message/{patientId}/{serialNo}")]
        public async Task<IActionResult> SendPrescriptionMessage(string patientId, int serialNo)
        {
            var patient = await _context.MED_PATIENTS_DETAILS.FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientId);
            var treatment = await _context.MED_TREATMENT_DETAILS.FirstOrDefaultAsync(t => t.MTD_PATIENT_CODE == patientId && t.MTD_SERIAL_NO == serialNo);

            if (patient == null || treatment == null)
                return NotFound(new { message = "Patient or treatment not found." });

            if (string.IsNullOrWhiteSpace(patient.MPD_EMAIL))
                return BadRequest(new { message = "No email address is on file for this patient. Please update their record before sending a prescription." });

            var user = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u => u.MUD_FULL_NAME.ToLower() == treatment.MTD_DOCTOR.ToLower());

            var drugs = await (from d in _context.MED_DRUGS_DETAILS
                               join m in _context.MED_MATERIAL_CATALOGUE
                               on d.MDD_MATERIAL_CODE equals m.MMC_MATERIAL_CODE
                               where d.MDD_PATIENT_CODE == patientId
                                  && d.MDD_SERIAL_NO == serialNo
                                  && d.MDD_STATUS != "I"
                               select new
                               {
                                   DrugName = m.MMC_DESCRIPTION,
                                   d.MDD_DOSAGE,
                                   d.MDD_TAKES,
                                   d.MDD_QUANTITY
                               }).ToListAsync();

            string messageBody =
                $"Prescription From DR.{treatment.MTD_DOCTOR.ToUpper()}\n\n" +
                $"•Patient Name: {patient.MPD_PATIENT_NAME}\n" +
                $"•Address: {patient.MPD_ADDRESS}\n" +
                $"•Gender: {patient.MPD_GENDER}\n" +
                $"•Diagnosis: {treatment.MTD_DIAGNOSTICS}\n\n" +
                $"•Your Medicines List:\n";

            int medicineNumber = 1;
            foreach (var drug in drugs)
            {
                messageBody += $"{medicineNumber}. {drug.DrugName}\n" +
                              $"   • Frequency: {drug.MDD_TAKES}\n" +
                              $"   • Quantity: {drug.MDD_QUANTITY}\n\n";
                medicineNumber++;
            }

            messageBody += "IMPORTANT: If you experience any side effects or have questions, please contact the hospital.\n\n";

            if (user != null)
            {
                messageBody += $"Dr. {treatment.MTD_DOCTOR}\n";
                messageBody += $"Contact: {user.MUD_CONTACT}\n";
            }

            messageBody += $"Date: {DateTime.Now:yyyy-MM-dd hh:mm:ss tt}";

            // Previously sent via the esystems.cdl.lk SMS gateway - now emailed through
            // Gmail (see EmailService). MTD_SMS / MTD_SMS_STATUS are kept as-is; they now
            // log the emailed message body and its delivery outcome ("S" = sent, "A" =
            // attempted/failed) rather than an SMS-specific status.
            treatment.MTD_SMS = messageBody;

            try
            {
                var emailService = new CareSyncEmailService(_configuration);
                await emailService.SendNotificationEmailAsync(
                    patient.MPD_EMAIL!,
                    patient.MPD_PATIENT_NAME,
                    "Your Medicare prescription",
                    messageBody);

                treatment.MTD_SMS_STATUS = "S";
                treatment.MTD_UPDATED_DATE = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Prescription emailed successfully.", emailContent = messageBody });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception when emailing prescription: {ex.Message}");

                treatment.MTD_SMS_STATUS = "A";
                treatment.MTD_UPDATED_DATE = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Prescription recorded but the email failed to send. It will be delivered when the mail service is available.", error = ex.Message });
            }
        }
    }

    public class TreatmentAndDrugsUpdateModel
    {
        public TreatmentUpdateModel Treatment { get; set; }
        public required List<DrugUpdateModel> Drugs { get; set; }
    }

    public class TreatmentUpdateModel
    {
        public string? MTD_DOCTOR { get; set; }
        public string? MTD_TYPE { get; set; }
        public string? MTD_COMPLAIN { get; set; }
        public string? MTD_DIAGNOSTICS { get; set; }
        public string? MTD_REMARKS { get; set; }
        public decimal MTD_AMOUNT { get; set; }
        public string? MTD_TREATMENT_STATUS { get; set; }


        public string? MTD_UPDATED_BY { get; set; }
    }

    public class DrugUpdateModel
    {

        public string? MDD_MATERIAL_CODE { get; set; }
        public decimal MDD_QUANTITY { get; set; }
        public decimal? MDD_RATE { get; set; }
        public decimal? MDD_AMOUNT { get; set; }
        public string? MDD_DOSAGE { get; set; }
        public string? MDD_TAKES { get; set; }
        public decimal MDD_GIVEN_QUANTITY { get; set; }
        public string? MDD_STATUS { get; set; }
    }
}