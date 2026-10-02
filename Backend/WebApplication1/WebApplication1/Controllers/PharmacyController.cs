using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.DTOs;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PharmacyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PharmacyController> _logger;

        public PharmacyController(
            ApplicationDbContext context,
            ILogger<PharmacyController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Pharmacy/queue
        // Returns real clinical encounters that contain prescription lines.
        // Pharmacy state is derived from prescribed vs. actually dispensed quantities;
        // no hardcoded patient or medicine data is returned.
        [HttpGet("queue")]
        public async Task<IActionResult> GetQueue()
        {
            var encounters = await (
                from t in _context.MED_TREATMENT_DETAILS.AsNoTracking()
                join p in _context.MED_PATIENTS_DETAILS.AsNoTracking()
                    on t.MTD_PATIENT_CODE equals p.MPD_PATIENT_CODE
                where (t.MTD_STATUS == null || t.MTD_STATUS != "I") &&
                      _context.MED_DRUGS_DETAILS.Any(d =>
                          d.MDD_PATIENT_CODE == t.MTD_PATIENT_CODE &&
                          d.MDD_SERIAL_NO == t.MTD_SERIAL_NO &&
                          d.MDD_STATUS != "I")
                orderby t.MTD_DATE descending, t.MTD_SERIAL_NO descending
                select new
                {
                    Treatment = t,
                    Patient = p
                })
                .Take(100)
                .ToListAsync();

            if (encounters.Count == 0)
                return Ok(Array.Empty<object>());

            var serialNumbers = encounters
                .Where(x => x.Treatment.MTD_SERIAL_NO.HasValue)
                .Select(x => x.Treatment.MTD_SERIAL_NO!.Value)
                .Distinct()
                .ToList();

            var drugLines = await _context.MED_DRUGS_DETAILS
                .AsNoTracking()
                .Where(d =>
                    serialNumbers.Contains(d.MDD_SERIAL_NO) &&
                    d.MDD_STATUS != "I")
                .ToListAsync();

            var doctors = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .Where(u => u.MUD_USER_TYPE == "Doc")
                .ToListAsync();

            var queue = encounters
                .Select(row =>
                {
                    var serialNo = row.Treatment.MTD_SERIAL_NO ?? 0;
                    var lines = drugLines
                        .Where(d =>
                            d.MDD_SERIAL_NO == serialNo &&
                            string.Equals(
                                d.MDD_PATIENT_CODE,
                                row.Treatment.MTD_PATIENT_CODE,
                                StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    var pendingCount = lines.Count(IsDrugPending);
                    var fulfilledCount = lines.Count - pendingCount;
                    var doctor = FindDoctor(doctors, row.Treatment.MTD_DOCTOR);

                    return new
                    {
                        PatientCode = row.Patient.MPD_PATIENT_CODE,
                        PatientName = row.Patient.MPD_PATIENT_NAME,
                        MobileNo = row.Patient.MPD_MOBILE_NO,
                        SerialNo = serialNo,
                        EncounterDate = row.Treatment.MTD_DATE,
                        DoctorName = GetDoctorDisplayName(doctor, row.Treatment.MTD_DOCTOR),
                        Specialization = doctor?.MUD_SPECIALIZATION,
                        PrescriptionCount = lines.Count,
                        PendingDrugCount = pendingCount,
                        FulfilledDrugCount = fulfilledCount,
                        Status = pendingCount > 0 ? "Pending" : "Fulfilled"
                    };
                })
                .ToList();

            return Ok(queue);
        }

        // GET: api/Pharmacy/encounter/PA0001/314
        // Returns the exact prescription written for this treatment, joined to the
        // real material catalogue for description, specification, stock and rate.
        [HttpGet("encounter/{patientCode}/{serialNo:int}")]
        public async Task<IActionResult> GetEncounter(string patientCode, int serialNo)
        {
            var encounter = await BuildEncounter(patientCode, serialNo);
            return encounter == null
                ? NotFound(new { message = "The requested pharmacy encounter was not found." })
                : Ok(encounter);
        }

        // POST: api/Pharmacy/dispense/PA0001/314
        // Dispenses only the requested quantity, updates MDD_GIVEN_QUANTITY cumulatively,
        // and deducts the same quantity from inventory in one serializable transaction.
        [HttpPost("dispense/{patientCode}/{serialNo:int}")]
        public async Task<IActionResult> Dispense(
            string patientCode,
            int serialNo,
            [FromBody] PharmacyDispenseRequest request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            request.Lines ??= new List<PharmacyDispenseLineRequest>();

            var requestedLines = request.Lines
                .Where(l => !string.IsNullOrWhiteSpace(l.MaterialCode) && l.Quantity > 0)
                .ToList();

            if (requestedLines.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Select at least one prescribed medicine and enter a dispense quantity greater than zero."
                });
            }

            var duplicateCode = requestedLines
                .GroupBy(l => l.MaterialCode.Trim(), StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(g => g.Count() > 1);

            if (duplicateCode != null)
            {
                return BadRequest(new
                {
                    message = $"Medicine {duplicateCode.Key} appears more than once in the dispense request."
                });
            }

            await using var transaction = await _context.Database
                .BeginTransactionAsync(IsolationLevel.Serializable);

            try
            {
                var treatment = await _context.MED_TREATMENT_DETAILS
                    .FirstOrDefaultAsync(t =>
                        t.MTD_PATIENT_CODE == patientCode &&
                        t.MTD_SERIAL_NO == serialNo);

                if (treatment == null)
                    return NotFound(new { message = "Treatment record not found." });

                var prescriptionLines = await _context.MED_DRUGS_DETAILS
                    .Where(d =>
                        d.MDD_PATIENT_CODE == patientCode &&
                        d.MDD_SERIAL_NO == serialNo &&
                        d.MDD_STATUS != "I")
                    .ToListAsync();

                if (prescriptionLines.Count == 0)
                {
                    return BadRequest(new
                    {
                        message = "This treatment does not contain an active prescription."
                    });
                }

                var requestedCodes = requestedLines
                    .Select(l => l.MaterialCode.Trim())
                    .ToList();

                var materials = await _context.MED_MATERIAL_CATALOGUE
                    .Where(m => requestedCodes.Contains(m.MMC_MATERIAL_CODE))
                    .ToListAsync();

                var errors = new List<string>();
                var resolved = new List<(PharmacyDispenseLineRequest Request, MED_DRUGS_DETAILS Drug, MED_MATERIAL_CATALOGUE Material)>();

                foreach (var line in requestedLines)
                {
                    var code = line.MaterialCode.Trim();
                    var drug = prescriptionLines.FirstOrDefault(d =>
                        string.Equals(d.MDD_MATERIAL_CODE, code, StringComparison.OrdinalIgnoreCase));

                    if (drug == null)
                    {
                        errors.Add($"{code} is not part of this doctor's prescription.");
                        continue;
                    }

                    var material = materials.FirstOrDefault(m =>
                        string.Equals(m.MMC_MATERIAL_CODE, code, StringComparison.OrdinalIgnoreCase));

                    if (material == null)
                    {
                        errors.Add($"{code} was not found in the material catalogue.");
                        continue;
                    }

                    if (material.MMC_STATUS == "I")
                    {
                        errors.Add($"{GetMaterialName(material)} is inactive and cannot be dispensed.");
                        continue;
                    }

                    var prescribed = drug.MDD_QUANTITY ?? 0;
                    var alreadyDispensed = drug.MDD_GIVEN_QUANTITY ?? 0;
                    var remaining = Math.Max(0, prescribed - alreadyDispensed);
                    var availableStock = material.MMC_REORDER_LEVEL ?? 0;

                    if (remaining <= 0)
                    {
                        errors.Add($"{GetMaterialName(material)} has already been fully dispensed.");
                        continue;
                    }

                    if (line.Quantity > remaining)
                    {
                        errors.Add(
                            $"{GetMaterialName(material)}: requested dispense quantity {line.Quantity:0.##} exceeds the remaining prescription quantity {remaining:0.##}.");
                        continue;
                    }

                    if (line.Quantity > availableStock)
                    {
                        errors.Add(
                            $"{GetMaterialName(material)}: requested dispense quantity {line.Quantity:0.##} exceeds current stock {availableStock:0.##}.");
                        continue;
                    }

                    resolved.Add((line, drug, material));
                }

                if (errors.Count > 0)
                {
                    await transaction.RollbackAsync();
                    return Conflict(new
                    {
                        message = "Dispensing validation failed.",
                        errors
                    });
                }

                var now = DateTime.Now;
                var auditUser = NormalizeAuditUser(request.DispenserUserId);
                var dispensedLines = new List<object>();

                foreach (var item in resolved)
                {
                    var before = item.Drug.MDD_GIVEN_QUANTITY ?? 0;
                    var after = before + item.Request.Quantity;
                    var prescribed = item.Drug.MDD_QUANTITY ?? 0;

                    item.Drug.MDD_GIVEN_QUANTITY = after;
                    item.Drug.MDD_UPDATED_BY = auditUser;
                    item.Drug.MDD_UPDATED_DATE = now;

                    item.Material.MMC_REORDER_LEVEL =
                        (item.Material.MMC_REORDER_LEVEL ?? 0) - item.Request.Quantity;
                    item.Material.MMC_UPDATED_BY = auditUser;
                    item.Material.MMC_UPDATED_DATE = now;

                    var rate = item.Drug.MDD_RATE ?? item.Material.MMC_RATE ?? 0;
                    dispensedLines.Add(new
                    {
                        MaterialCode = item.Material.MMC_MATERIAL_CODE,
                        MedicineName = item.Material.MMC_DESCRIPTION,
                        Specification = item.Material.MMC_MATERIAL_SPEC,
                        Unit = item.Material.MMC_UNIT,
                        DispensedNow = item.Request.Quantity,
                        TotalDispensed = after,
                        PrescribedQty = prescribed,
                        Rate = rate,
                        Amount = rate * item.Request.Quantity,
                        RemainingPrescriptionQty = Math.Max(0, prescribed - after),
                        RemainingStock = item.Material.MMC_REORDER_LEVEL ?? 0
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var updatedEncounter = await BuildEncounter(patientCode, serialNo);

                return Ok(new
                {
                    message = "Selected medicines were dispensed and inventory was updated successfully.",
                    DispensedAt = now,
                    DispensedBy = auditUser,
                    DispensedLines = dispensedLines,
                    Encounter = updatedEncounter
                });
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex,
                    "Database error while dispensing pharmacy encounter {PatientCode}/{SerialNo}",
                    patientCode,
                    serialNo);

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "The medicines could not be dispensed because the database update failed.",
                    detail = ex.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex,
                    "Unexpected pharmacy dispensing error for {PatientCode}/{SerialNo}",
                    patientCode,
                    serialNo);

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An unexpected error occurred while dispensing the medicines."
                });
            }
        }

        private async Task<object?> BuildEncounter(string patientCode, int serialNo)
        {
            var treatment = await _context.MED_TREATMENT_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(t =>
                    t.MTD_PATIENT_CODE == patientCode &&
                    t.MTD_SERIAL_NO == serialNo);

            if (treatment == null)
                return null;

            var patient = await _context.MED_PATIENTS_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientCode);

            if (patient == null)
                return null;

            var drugs = await (
                from d in _context.MED_DRUGS_DETAILS.AsNoTracking()
                join m in _context.MED_MATERIAL_CATALOGUE.AsNoTracking()
                    on d.MDD_MATERIAL_CODE equals m.MMC_MATERIAL_CODE
                where d.MDD_PATIENT_CODE == patientCode &&
                      d.MDD_SERIAL_NO == serialNo &&
                      d.MDD_STATUS != "I"
                orderby m.MMC_DESCRIPTION
                select new
                {
                    Drug = d,
                    Material = m
                })
                .ToListAsync();

            MED_USER_DETAILS? doctor = null;
            if (!string.IsNullOrWhiteSpace(treatment.MTD_DOCTOR))
            {
                var storedDoctor = treatment.MTD_DOCTOR.Trim();
                doctor = await _context.MED_USER_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u =>
                        u.MUD_USER_TYPE == "Doc" &&
                        (u.MUD_USER_ID == storedDoctor ||
                         u.MUD_FULL_NAME == storedDoctor ||
                         u.MUD_USER_NAME == storedDoctor));
            }

            MED_APPOINMENT_DETAILS? appointment = null;
            MED_TIMESLOT? timeslot = null;

            if (treatment.MTD_APPOINMENT_ID.HasValue)
            {
                appointment = await _context.MED_APPOINMENT_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a =>
                        a.MAD_APPOINMENT_ID == treatment.MTD_APPOINMENT_ID.Value);

                if (appointment?.MAD_SLOT_ID != null)
                {
                    timeslot = await _context.MED_TIMESLOT
                        .AsNoTracking()
                        .FirstOrDefaultAsync(t => t.MT_SLOT_ID == appointment.MAD_SLOT_ID.Value);
                }
            }

            var drugResults = drugs.Select(row =>
            {
                var prescribed = row.Drug.MDD_QUANTITY ?? 0;
                var dispensed = row.Drug.MDD_GIVEN_QUANTITY ?? 0;
                var remaining = Math.Max(0, prescribed - dispensed);
                var rate = row.Drug.MDD_RATE ?? row.Material.MMC_RATE ?? 0;
                var stock = row.Material.MMC_REORDER_LEVEL ?? 0;

                return new
                {
                    MaterialCode = row.Drug.MDD_MATERIAL_CODE,
                    MedicineName = row.Material.MMC_DESCRIPTION,
                    Specification = row.Material.MMC_MATERIAL_SPEC,
                    Unit = row.Material.MMC_UNIT,
                    Dosage = row.Drug.MDD_DOSAGE,
                    Schedule = row.Drug.MDD_TAKES,
                    PrescribedQty = prescribed,
                    DispensedQty = dispensed,
                    RemainingQty = remaining,
                    Stock = stock,
                    Rate = rate,
                    PrescribedAmount = rate * prescribed,
                    DispensedAmount = rate * dispensed,
                    RemainingAmount = rate * remaining,
                    Status = remaining <= 0
                        ? "Fulfilled"
                        : dispensed > 0
                            ? "Partially dispensed"
                            : "Pending"
                };
            }).ToList();

            var prescriptionTotal = drugResults.Sum(d => d.PrescribedAmount);
            var dispensedValue = drugResults.Sum(d => d.DispensedAmount);
            var pendingValue = drugResults.Sum(d => d.RemainingAmount);
            var pendingCount = drugResults.Count(d => d.RemainingQty > 0);

            var appointmentTime = appointment?.MAD_ALLOCATED_TIME ?? appointment?.MAD_START_TIME;

            return new
            {
                Patient = new
                {
                    Code = patient.MPD_PATIENT_CODE,
                    Name = patient.MPD_PATIENT_NAME,
                    Mobile = patient.MPD_MOBILE_NO,
                    Nic = patient.MPD_NIC_NO,
                    Address = patient.MPD_ADDRESS,
                    City = patient.MPD_CITY,
                    Gender = patient.MPD_GENDER,
                    Birthday = patient.MPD_BIRTHDAY,
                    Age = CalculateAge(patient.MPD_BIRTHDAY),
                    BloodGroup = ReadOptionalString(patient, "MPD_BLOOD_GROUP"),
                    PatientType = patient.MPD_PATIENT_TYPE,
                    AllergyInfo = (string?)null
                },
                Treatment = new
                {
                    PatientCode = treatment.MTD_PATIENT_CODE,
                    SerialNo = treatment.MTD_SERIAL_NO,
                    EncounterDate = treatment.MTD_DATE,
                    EncounterType = treatment.MTD_TYPE,
                    ConsultationFee = treatment.MTD_AMOUNT ?? 0,
                    PaymentStatus = treatment.MTD_PAYMENT_STATUS,
                    ClinicalStatus = treatment.MTD_TREATMENT_STATUS,
                    AppointmentId = treatment.MTD_APPOINMENT_ID,
                    ChannelNo = treatment.MTD_CHANNEL_NO
                },
                Doctor = new
                {
                    Name = GetDoctorDisplayName(doctor, treatment.MTD_DOCTOR),
                    UserId = doctor?.MUD_USER_ID,
                    Specialization = doctor?.MUD_SPECIALIZATION
                },
                Appointment = appointment == null ? null : new
                {
                    Id = appointment.MAD_APPOINMENT_ID,
                    Date = appointment.MAD_APPOINMENT_DATE,
                    Time = appointmentTime,
                    SlotId = appointment.MAD_SLOT_ID,
                    Status = appointment.MAD_STATUS
                },
                Timeslot = timeslot == null ? null : new
                {
                    SlotId = timeslot.MT_SLOT_ID,
                    Room = ReadOptionalString(timeslot, "MT_CLINIC_ROOM"),
                    DeliveryChannel = ReadOptionalString(timeslot, "MT_DELIVERY_CHANNEL")
                },
                PharmacyStatus = pendingCount == 0 ? "Fulfilled" : "Pending",
                Summary = new
                {
                    PrescriptionCount = drugResults.Count,
                    PendingDrugCount = pendingCount,
                    PrescriptionTotal = prescriptionTotal,
                    DispensedValue = dispensedValue,
                    PendingValue = pendingValue
                },
                Drugs = drugResults
            };
        }

        private static bool IsDrugPending(MED_DRUGS_DETAILS drug)
        {
            var prescribed = drug.MDD_QUANTITY ?? 0;
            var dispensed = drug.MDD_GIVEN_QUANTITY ?? 0;
            return prescribed > dispensed;
        }

        private static MED_USER_DETAILS? FindDoctor(
            IEnumerable<MED_USER_DETAILS> doctors,
            string? storedDoctor)
        {
            if (string.IsNullOrWhiteSpace(storedDoctor))
                return null;

            var value = storedDoctor.Trim();
            return doctors.FirstOrDefault(u =>
                string.Equals(u.MUD_USER_ID, value, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(u.MUD_FULL_NAME, value, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(u.MUD_USER_NAME, value, StringComparison.OrdinalIgnoreCase));
        }

        private static string GetDoctorDisplayName(
            MED_USER_DETAILS? doctor,
            string? storedDoctor)
        {
            if (doctor != null)
            {
                if (!string.IsNullOrWhiteSpace(doctor.MUD_FULL_NAME))
                    return doctor.MUD_FULL_NAME.Trim();

                if (!string.IsNullOrWhiteSpace(doctor.MUD_USER_NAME))
                    return doctor.MUD_USER_NAME.Trim();
            }

            return string.IsNullOrWhiteSpace(storedDoctor)
                ? "Not recorded"
                : storedDoctor.Trim();
        }

        private static string GetMaterialName(MED_MATERIAL_CATALOGUE material)
        {
            return string.IsNullOrWhiteSpace(material.MMC_DESCRIPTION)
                ? material.MMC_MATERIAL_CODE
                : material.MMC_DESCRIPTION.Trim();
        }

        private static int? CalculateAge(DateTime? birthday)
        {
            if (!birthday.HasValue)
                return null;

            var today = DateTime.Today;
            if (birthday.Value.Date > today)
                return null;

            var age = today.Year - birthday.Value.Year;
            if (birthday.Value.Date > today.AddYears(-age))
                age--;

            return age;
        }

        private static string? NormalizeAuditUser(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var trimmed = value.Trim();
            return trimmed.Length <= 7 ? trimmed : trimmed[..7];
        }

        private static string? ReadOptionalString(object source, string propertyName)
        {
            var property = source.GetType().GetProperty(propertyName);
            return property?.GetValue(source)?.ToString();
        }
    }
}
