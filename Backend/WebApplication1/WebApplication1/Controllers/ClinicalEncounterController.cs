using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.DTOs;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClinicalEncounterController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ClinicalEncounterController> _logger;

        public ClinicalEncounterController(
            ApplicationDbContext context,
            ILogger<ClinicalEncounterController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/ClinicalEncounter/context/PA0001?staffUserId=User001
        // Returns only real database data required by the treatment-entry screen.
        [HttpGet("context/{patientId}")]
        public async Task<IActionResult> GetEncounterContext(
            string patientId,
            [FromQuery] string? staffUserId = null)
        {
            var patient = await _context.MED_PATIENTS_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientId);

            if (patient == null)
                return NotFound(new { message = "Patient not found." });

            var doctors = await _context.MED_USER_DETAILS
                .AsNoTracking()
                .Where(u =>
                    u.MUD_USER_TYPE == "Doc" &&
                    (u.MUD_STATUS == null || u.MUD_STATUS == "A"))
                .OrderBy(u => u.MUD_FULL_NAME ?? u.MUD_USER_NAME)
                .Select(u => new
                {
                    UserId = u.MUD_USER_ID,
                    FullName = u.MUD_FULL_NAME,
                    UserName = u.MUD_USER_NAME,
                    Specialization = u.MUD_SPECIALIZATION
                })
                .ToListAsync();

            var materialEntities = await _context.MED_MATERIAL_CATALOGUE
                .AsNoTracking()
                .Where(m => m.MMC_STATUS == null || m.MMC_STATUS == "A")
                .OrderBy(m => m.MMC_DESCRIPTION)
                .ToListAsync();

            var medicines = materialEntities.Select(m => new
            {
                MaterialCode = m.MMC_MATERIAL_CODE,
                Description = m.MMC_DESCRIPTION,
                Specification = m.MMC_MATERIAL_SPEC,
                Unit = m.MMC_UNIT,
                CurrentStock = m.MMC_REORDER_LEVEL ?? 0,
                Rate = m.MMC_RATE ?? 0,
                Status = m.MMC_STATUS,
                Category = ReadOptionalString(m, "MMC_CATEGORY"),
                BatchNo = ReadOptionalString(m, "MMC_BATCH_NO"),
                ExpiryDate = ReadOptionalDateTime(m, "MMC_EXPIRY_DATE")
            }).ToList();

            var appointment = await FindBestUnlinkedAppointment(patientId);
            MED_USER_DETAILS? appointmentDoctor = null;
            MED_TIMESLOT? timeslot = null;

            if (appointment != null)
            {
                appointmentDoctor = await ResolveDoctorForAppointment(appointment);

                if (appointment.MAD_SLOT_ID.HasValue)
                {
                    timeslot = await _context.MED_TIMESLOT
                        .AsNoTracking()
                        .FirstOrDefaultAsync(t => t.MT_SLOT_ID == appointment.MAD_SLOT_ID.Value);
                }
            }

            MED_USER_DETAILS? currentStaffDoctor = null;
            if (!string.IsNullOrWhiteSpace(staffUserId))
            {
                currentStaffDoctor = await _context.MED_USER_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u =>
                        u.MUD_USER_ID == staffUserId &&
                        u.MUD_USER_TYPE == "Doc" &&
                        (u.MUD_STATUS == null || u.MUD_STATUS == "A"));
            }

            var suggestedDoctor = appointmentDoctor ?? currentStaffDoctor;
            var suggestedEncounterType = GetSuggestedEncounterType(patient.MPD_PATIENT_TYPE);

            return Ok(new
            {
                Patient = MapPatient(patient),
                Doctors = doctors,
                Medicines = medicines,
                Appointment = appointment == null ? null : MapAppointment(appointment),
                Timeslot = timeslot == null ? null : MapTimeslot(timeslot),
                SuggestedDoctorUserId = suggestedDoctor?.MUD_USER_ID,
                SuggestedEncounterType = suggestedEncounterType
            });
        }

        // GET: api/ClinicalEncounter/PA0001/1
        [HttpGet("{patientId}/{serialNo:int}")]
        public async Task<IActionResult> GetEncounter(string patientId, int serialNo)
        {
            var record = await BuildEncounterRecord(patientId, serialNo);
            return record == null
                ? NotFound(new { message = "Clinical encounter not found." })
                : Ok(record);
        }

        // POST: api/ClinicalEncounter
        // Saves the treatment header and all prescribed medicines as one transaction.
        [HttpPost]
        public async Task<IActionResult> CreateEncounter([FromBody] ClinicalEncounterRequest request)
        {
            var validation = await ValidateEncounterRequest(request, null);
            if (validation.ErrorResult != null)
                return validation.ErrorResult;

            var patient = validation.Patient!;
            var doctor = validation.Doctor!;
            var appointment = validation.Appointment;
            var materials = validation.Materials!;

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.Now;
                var creator = NormalizeAuditUser(request.MTD_CREATED_BY, doctor.MUD_USER_ID);

                var treatment = new MED_TREATMENT_DETAILS
                {
                    MTD_PATIENT_CODE = patient.MPD_PATIENT_CODE,
                    MTD_DATE = appointment?.MAD_APPOINMENT_DATE.Date
                               ?? (request.MTD_DATE == default ? DateTime.Today : request.MTD_DATE.Date),
                    // MTD_DOCTOR historically stores the physician display name.
                    // Database migration 06 widens the column so real names are not truncated.
                    MTD_DOCTOR = GetDoctorDisplayName(doctor),
                    MTD_TYPE = NormalizeEncounterType(request.MTD_TYPE, patient.MPD_PATIENT_TYPE),
                    MTD_COMPLAIN = NormalizeText(request.MTD_COMPLAIN),
                    MTD_DIAGNOSTICS = NormalizeText(request.MTD_DIAGNOSTICS),
                    MTD_REMARKS = NormalizeText(request.MTD_REMARKS),
                    MTD_AMOUNT = request.MTD_AMOUNT ?? 0,
                    MTD_PAYMENT_STATUS = "P",
                    MTD_TREATMENT_STATUS = NormalizeTreatmentStatus(request.MTD_TREATMENT_STATUS),
                    MTD_SMS_STATUS = "N",
                    MTD_SMS = null,
                    MTD_MEDICAL_STATUS = "A",
                    MTD_STATUS = "A",
                    MTD_CREATED_BY = creator,
                    MTD_CREATED_DATE = now,
                    MTD_APPOINMENT_ID = appointment?.MAD_APPOINMENT_ID,
                    MTD_CHANNEL_NO = appointment?.MAD_PATIENT_NO ?? request.MTD_CHANNEL_NO
                };

                _context.MED_TREATMENT_DETAILS.Add(treatment);
                await _context.SaveChangesAsync();

                foreach (var prescription in request.Prescriptions)
                {
                    var material = materials[prescription.MDD_MATERIAL_CODE];
                    var rate = material.MMC_RATE ?? 0;

                    _context.MED_DRUGS_DETAILS.Add(new MED_DRUGS_DETAILS
                    {
                        MDD_PATIENT_CODE = treatment.MTD_PATIENT_CODE!,
                        MDD_SERIAL_NO = treatment.MTD_SERIAL_NO!.Value,
                        MDD_MATERIAL_CODE = material.MMC_MATERIAL_CODE,
                        MDD_QUANTITY = prescription.MDD_QUANTITY,
                        MDD_RATE = rate,
                        MDD_AMOUNT = rate * prescription.MDD_QUANTITY,
                        MDD_DOSAGE = TrimToLength(material.MMC_MATERIAL_SPEC, 50),
                        MDD_TAKES = TrimToLength(prescription.MDD_TAKES, 50),
                        MDD_GIVEN_QUANTITY = 0,
                        MDD_STATUS = "A",
                        MDD_CREATED_BY = creator,
                        MDD_CREATED_DATE = now
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var saved = await BuildEncounterRecord(
                    treatment.MTD_PATIENT_CODE!,
                    treatment.MTD_SERIAL_NO!.Value);

                return CreatedAtAction(
                    nameof(GetEncounter),
                    new
                    {
                        patientId = treatment.MTD_PATIENT_CODE,
                        serialNo = treatment.MTD_SERIAL_NO
                    },
                    saved);
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Database error while saving clinical encounter for {PatientId}", request.MTD_PATIENT_CODE);

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "The clinical encounter could not be stored in the database.",
                    detail = ex.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Unexpected error while saving clinical encounter for {PatientId}", request.MTD_PATIENT_CODE);

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An unexpected error occurred while saving the clinical encounter."
                });
            }
        }

        // PUT: api/ClinicalEncounter/PA0001/1
        // Updates the treatment and synchronizes prescriptions without deleting audit history.
        [HttpPut("{patientId}/{serialNo:int}")]
        public async Task<IActionResult> UpdateEncounter(
            string patientId,
            int serialNo,
            [FromBody] ClinicalEncounterRequest request)
        {
            if (!string.Equals(patientId, request.MTD_PATIENT_CODE, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Patient code mismatch." });

            var treatment = await _context.MED_TREATMENT_DETAILS
                .FirstOrDefaultAsync(t =>
                    t.MTD_PATIENT_CODE == patientId &&
                    t.MTD_SERIAL_NO == serialNo);

            if (treatment == null)
                return NotFound(new { message = "Clinical encounter not found." });

            var validation = await ValidateEncounterRequest(request, serialNo);
            if (validation.ErrorResult != null)
                return validation.ErrorResult;

            var patient = validation.Patient!;
            var doctor = validation.Doctor!;
            var appointment = validation.Appointment;
            var materials = validation.Materials!;

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = DateTime.Now;
                var updater = NormalizeAuditUser(request.MTD_CREATED_BY, doctor.MUD_USER_ID);

                treatment.MTD_DATE = appointment?.MAD_APPOINMENT_DATE.Date
                                     ?? (request.MTD_DATE == default ? treatment.MTD_DATE : request.MTD_DATE.Date);
                treatment.MTD_DOCTOR = GetDoctorDisplayName(doctor);
                treatment.MTD_TYPE = NormalizeEncounterType(request.MTD_TYPE, patient.MPD_PATIENT_TYPE);
                treatment.MTD_COMPLAIN = NormalizeText(request.MTD_COMPLAIN);
                treatment.MTD_DIAGNOSTICS = NormalizeText(request.MTD_DIAGNOSTICS);
                treatment.MTD_REMARKS = NormalizeText(request.MTD_REMARKS);
                treatment.MTD_AMOUNT = request.MTD_AMOUNT ?? 0;
                treatment.MTD_TREATMENT_STATUS = NormalizeTreatmentStatus(request.MTD_TREATMENT_STATUS);
                treatment.MTD_APPOINMENT_ID = appointment?.MAD_APPOINMENT_ID;
                treatment.MTD_CHANNEL_NO = appointment?.MAD_PATIENT_NO ?? request.MTD_CHANNEL_NO;
                treatment.MTD_UPDATED_BY = updater;
                treatment.MTD_UPDATED_DATE = now;

                var existingDrugs = await _context.MED_DRUGS_DETAILS
                    .Where(d =>
                        d.MDD_PATIENT_CODE == patientId &&
                        d.MDD_SERIAL_NO == serialNo)
                    .ToListAsync();

                var requestedCodes = request.Prescriptions
                    .Select(p => p.MDD_MATERIAL_CODE)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                foreach (var existing in existingDrugs)
                {
                    if (requestedCodes.Contains(existing.MDD_MATERIAL_CODE))
                        continue;

                    if ((existing.MDD_GIVEN_QUANTITY ?? 0) > 0)
                    {
                        return Conflict(new
                        {
                            message = $"{existing.MDD_MATERIAL_CODE} has already been dispensed and cannot be removed from the prescription."
                        });
                    }

                    existing.MDD_STATUS = "I";
                    existing.MDD_UPDATED_BY = updater;
                    existing.MDD_UPDATED_DATE = now;
                }

                foreach (var prescription in request.Prescriptions)
                {
                    var material = materials[prescription.MDD_MATERIAL_CODE];
                    var rate = material.MMC_RATE ?? 0;

                    var existing = existingDrugs.FirstOrDefault(d =>
                        string.Equals(
                            d.MDD_MATERIAL_CODE,
                            prescription.MDD_MATERIAL_CODE,
                            StringComparison.OrdinalIgnoreCase));

                    if (existing != null)
                    {
                        if ((existing.MDD_GIVEN_QUANTITY ?? 0) > prescription.MDD_QUANTITY)
                        {
                            return Conflict(new
                            {
                                message = $"Quantity for {material.MMC_DESCRIPTION ?? material.MMC_MATERIAL_CODE} cannot be lower than the quantity already dispensed."
                            });
                        }

                        existing.MDD_QUANTITY = prescription.MDD_QUANTITY;
                        existing.MDD_RATE = rate;
                        existing.MDD_AMOUNT = rate * prescription.MDD_QUANTITY;
                        existing.MDD_DOSAGE = TrimToLength(material.MMC_MATERIAL_SPEC, 50);
                        existing.MDD_TAKES = TrimToLength(prescription.MDD_TAKES, 50);
                        existing.MDD_STATUS = "A";
                        existing.MDD_UPDATED_BY = updater;
                        existing.MDD_UPDATED_DATE = now;
                    }
                    else
                    {
                        _context.MED_DRUGS_DETAILS.Add(new MED_DRUGS_DETAILS
                        {
                            MDD_PATIENT_CODE = patientId,
                            MDD_SERIAL_NO = serialNo,
                            MDD_MATERIAL_CODE = material.MMC_MATERIAL_CODE,
                            MDD_QUANTITY = prescription.MDD_QUANTITY,
                            MDD_RATE = rate,
                            MDD_AMOUNT = rate * prescription.MDD_QUANTITY,
                            MDD_DOSAGE = TrimToLength(material.MMC_MATERIAL_SPEC, 50),
                            MDD_TAKES = TrimToLength(prescription.MDD_TAKES, 50),
                            MDD_GIVEN_QUANTITY = 0,
                            MDD_STATUS = "A",
                            MDD_CREATED_BY = updater,
                            MDD_CREATED_DATE = now
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(await BuildEncounterRecord(patientId, serialNo));
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Database error while updating encounter {PatientId}/{SerialNo}", patientId, serialNo);

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "The clinical encounter could not be updated in the database.",
                    detail = ex.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Unexpected error while updating encounter {PatientId}/{SerialNo}", patientId, serialNo);

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An unexpected error occurred while updating the clinical encounter."
                });
            }
        }

        private async Task<(IActionResult? ErrorResult,
                            MED_PATIENTS_DETAILS? Patient,
                            MED_USER_DETAILS? Doctor,
                            MED_APPOINMENT_DETAILS? Appointment,
                            Dictionary<string, MED_MATERIAL_CATALOGUE>? Materials)>
            ValidateEncounterRequest(ClinicalEncounterRequest request, int? editingSerialNo)
        {
            request.Prescriptions ??= new List<ClinicalPrescriptionRequest>();

            if (!ModelState.IsValid)
                return (BadRequest(ModelState), null, null, null, null);

            if (string.IsNullOrWhiteSpace(request.MTD_PATIENT_CODE))
                return (BadRequest(new { message = "Patient code is required." }), null, null, null, null);

            if (string.IsNullOrWhiteSpace(request.MTD_COMPLAIN))
                return (BadRequest(new { message = "Patient presenting complaint is required." }), null, null, null, null);

            if (string.IsNullOrWhiteSpace(request.MTD_DIAGNOSTICS))
                return (BadRequest(new { message = "Diagnostic assessment is required." }), null, null, null, null);

            var patient = await _context.MED_PATIENTS_DETAILS
                .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == request.MTD_PATIENT_CODE);

            if (patient == null)
                return (NotFound(new { message = "Patient not found." }), null, null, null, null);

            var doctor = await _context.MED_USER_DETAILS
                .FirstOrDefaultAsync(u =>
                    u.MUD_USER_ID == request.DoctorUserId &&
                    u.MUD_USER_TYPE == "Doc" &&
                    (u.MUD_STATUS == null || u.MUD_STATUS == "A"));

            if (doctor == null)
                return (BadRequest(new { message = "Please select an active doctor from the hospital staff directory." }), null, null, null, null);

            MED_APPOINMENT_DETAILS? appointment = null;
            if (request.MTD_APPOINMENT_ID.HasValue)
            {
                appointment = await _context.MED_APPOINMENT_DETAILS
                    .FirstOrDefaultAsync(a => a.MAD_APPOINMENT_ID == request.MTD_APPOINMENT_ID.Value);

                if (appointment == null || appointment.MAD_PATIENT_CODE != request.MTD_PATIENT_CODE)
                    return (BadRequest(new { message = "The linked appointment does not belong to this patient." }), null, null, null, null);

                if (appointment.MAD_STATUS == "I")
                    return (BadRequest(new { message = "The linked appointment is inactive." }), null, null, null, null);

                if (!string.IsNullOrWhiteSpace(appointment.MAD_USER_ID) &&
                    !string.Equals(appointment.MAD_USER_ID, doctor.MUD_USER_ID, StringComparison.OrdinalIgnoreCase))
                {
                    return (BadRequest(new { message = "The selected doctor does not match the doctor assigned to this appointment." }), null, null, null, null);
                }
            }

            if (request.Prescriptions.Any(p => string.IsNullOrWhiteSpace(p.MDD_MATERIAL_CODE)))
                return (BadRequest(new { message = "Every prescription row must contain a valid inventory medicine." }), null, null, null, null);

            var duplicateMaterial = request.Prescriptions
                .GroupBy(p => p.MDD_MATERIAL_CODE, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(g => g.Count() > 1);

            if (duplicateMaterial != null)
            {
                return (BadRequest(new
                {
                    message = $"Medicine {duplicateMaterial.Key} is listed more than once. Combine it into one prescription row."
                }), null, null, null, null);
            }

            if (request.Prescriptions.Any(p => p.MDD_QUANTITY <= 0))
                return (BadRequest(new { message = "Prescription quantities must be greater than zero." }), null, null, null, null);

            var materialCodes = request.Prescriptions
                .Select(p => p.MDD_MATERIAL_CODE)
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var materialRows = await _context.MED_MATERIAL_CATALOGUE
                .Where(m => materialCodes.Contains(m.MMC_MATERIAL_CODE))
                .ToListAsync();

            var materials = materialRows.ToDictionary(
                m => m.MMC_MATERIAL_CODE,
                StringComparer.OrdinalIgnoreCase);

            foreach (var code in materialCodes)
            {
                if (!materials.TryGetValue(code, out var material))
                    return (BadRequest(new { message = $"Medicine {code} was not found in the inventory catalogue." }), null, null, null, null);

                // Existing prescriptions can still be displayed/edited if the item later became inactive,
                // but a new prescription must use an active formulary item.
                var alreadyExistsInEdit = editingSerialNo.HasValue && await _context.MED_DRUGS_DETAILS.AnyAsync(d =>
                    d.MDD_PATIENT_CODE == request.MTD_PATIENT_CODE &&
                    d.MDD_SERIAL_NO == editingSerialNo.Value &&
                    d.MDD_MATERIAL_CODE == code);

                if (material.MMC_STATUS == "I" && !alreadyExistsInEdit)
                    return (BadRequest(new { message = $"Medicine {code} is inactive and cannot be newly prescribed." }), null, null, null, null);
            }

            return (null, patient, doctor, appointment, materials);
        }

        private async Task<object?> BuildEncounterRecord(string patientId, int serialNo)
        {
            var treatment = await _context.MED_TREATMENT_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(t =>
                    t.MTD_PATIENT_CODE == patientId &&
                    t.MTD_SERIAL_NO == serialNo);

            if (treatment == null)
                return null;

            var patient = await _context.MED_PATIENTS_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.MPD_PATIENT_CODE == patientId);

            MED_APPOINMENT_DETAILS? appointment = null;
            MED_TIMESLOT? timeslot = null;

            if (treatment.MTD_APPOINMENT_ID.HasValue)
            {
                appointment = await _context.MED_APPOINMENT_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.MAD_APPOINMENT_ID == treatment.MTD_APPOINMENT_ID.Value);

                if (appointment?.MAD_SLOT_ID != null)
                {
                    timeslot = await _context.MED_TIMESLOT
                        .AsNoTracking()
                        .FirstOrDefaultAsync(t => t.MT_SLOT_ID == appointment.MAD_SLOT_ID.Value);
                }
            }

            MED_USER_DETAILS? doctor = null;
            if (appointment != null)
                doctor = await ResolveDoctorForAppointment(appointment);

            if (doctor == null && !string.IsNullOrWhiteSpace(treatment.MTD_DOCTOR))
            {
                var storedDoctor = treatment.MTD_DOCTOR;
                doctor = await _context.MED_USER_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u =>
                        u.MUD_USER_TYPE == "Doc" &&
                        (u.MUD_USER_ID == storedDoctor ||
                         u.MUD_FULL_NAME == storedDoctor ||
                         u.MUD_USER_NAME == storedDoctor));
            }

            var drugs = await (
                from d in _context.MED_DRUGS_DETAILS.AsNoTracking()
                join m in _context.MED_MATERIAL_CATALOGUE.AsNoTracking()
                    on d.MDD_MATERIAL_CODE equals m.MMC_MATERIAL_CODE
                where d.MDD_PATIENT_CODE == patientId &&
                      d.MDD_SERIAL_NO == serialNo &&
                      d.MDD_STATUS != "I"
                orderby m.MMC_DESCRIPTION
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
                    MaterialName = m.MMC_DESCRIPTION,
                    MaterialSpecification = m.MMC_MATERIAL_SPEC,
                    Unit = m.MMC_UNIT,
                    CurrentStock = m.MMC_REORDER_LEVEL,
                    MaterialStatus = m.MMC_STATUS
                }).ToListAsync();

            return new
            {
                Treatment = new
                {
                    treatment.MTD_PATIENT_CODE,
                    treatment.MTD_SERIAL_NO,
                    treatment.MTD_DATE,
                    treatment.MTD_DOCTOR,
                    treatment.MTD_TYPE,
                    treatment.MTD_COMPLAIN,
                    treatment.MTD_DIAGNOSTICS,
                    treatment.MTD_REMARKS,
                    treatment.MTD_AMOUNT,
                    treatment.MTD_PAYMENT_STATUS,
                    treatment.MTD_TREATMENT_STATUS,
                    treatment.MTD_MEDICAL_STATUS,
                    treatment.MTD_STATUS,
                    treatment.MTD_CREATED_BY,
                    treatment.MTD_CREATED_DATE,
                    treatment.MTD_UPDATED_BY,
                    treatment.MTD_UPDATED_DATE,
                    treatment.MTD_APPOINMENT_ID,
                    treatment.MTD_CHANNEL_NO
                },
                Patient = patient == null ? null : MapPatient(patient),
                Doctor = doctor == null ? null : new
                {
                    UserId = doctor.MUD_USER_ID,
                    FullName = doctor.MUD_FULL_NAME,
                    UserName = doctor.MUD_USER_NAME,
                    Specialization = doctor.MUD_SPECIALIZATION
                },
                Appointment = appointment == null ? null : MapAppointment(appointment),
                Timeslot = timeslot == null ? null : MapTimeslot(timeslot),
                Drugs = drugs
            };
        }

        private async Task<MED_APPOINMENT_DETAILS?> FindBestUnlinkedAppointment(string patientId)
        {
            var baseQuery = _context.MED_APPOINMENT_DETAILS
                .AsNoTracking()
                .Where(a =>
                    a.MAD_PATIENT_CODE == patientId &&
                    (a.MAD_STATUS == null || a.MAD_STATUS != "I") &&
                    !_context.MED_TREATMENT_DETAILS.Any(t =>
                        t.MTD_APPOINMENT_ID == a.MAD_APPOINMENT_ID));

            var today = DateTime.Today;

            var todaysAppointment = await baseQuery
                .Where(a => a.MAD_APPOINMENT_DATE == today)
                .OrderBy(a => a.MAD_ALLOCATED_TIME ?? a.MAD_START_TIME)
                .FirstOrDefaultAsync();

            if (todaysAppointment != null)
                return todaysAppointment;

            var recentAppointment = await baseQuery
                .Where(a => a.MAD_APPOINMENT_DATE < today)
                .OrderByDescending(a => a.MAD_APPOINMENT_DATE)
                .ThenByDescending(a => a.MAD_ALLOCATED_TIME ?? a.MAD_START_TIME)
                .FirstOrDefaultAsync();

            if (recentAppointment != null)
                return recentAppointment;

            return await baseQuery
                .Where(a => a.MAD_APPOINMENT_DATE > today)
                .OrderBy(a => a.MAD_APPOINMENT_DATE)
                .ThenBy(a => a.MAD_ALLOCATED_TIME ?? a.MAD_START_TIME)
                .FirstOrDefaultAsync();
        }

        private async Task<MED_USER_DETAILS?> ResolveDoctorForAppointment(MED_APPOINMENT_DETAILS appointment)
        {
            if (!string.IsNullOrWhiteSpace(appointment.MAD_USER_ID))
            {
                var byId = await _context.MED_USER_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u =>
                        u.MUD_USER_ID == appointment.MAD_USER_ID &&
                        u.MUD_USER_TYPE == "Doc");

                if (byId != null)
                    return byId;
            }

            if (string.IsNullOrWhiteSpace(appointment.MAD_DOCTOR))
                return null;

            var doctorName = appointment.MAD_DOCTOR;
            return await _context.MED_USER_DETAILS
                .AsNoTracking()
                .FirstOrDefaultAsync(u =>
                    u.MUD_USER_TYPE == "Doc" &&
                    (u.MUD_FULL_NAME == doctorName || u.MUD_USER_NAME == doctorName));
        }

        private static object MapPatient(MED_PATIENTS_DETAILS patient)
        {
            return new
            {
                patient.MPD_PATIENT_CODE,
                patient.MPD_PATIENT_NAME,
                patient.MPD_PATIENT_TYPE,
                patient.MPD_MOBILE_NO,
                patient.MPD_NIC_NO,
                patient.MPD_PATIENT_REMARKS,
                patient.MPD_ADDRESS,
                patient.MPD_GENDER,
                patient.MPD_CITY,
                patient.MPD_STATUS,
                patient.MPD_BIRTHDAY,
                patient.MPD_EMAIL,
                MPD_BLOOD_GROUP = ReadOptionalString(patient, "MPD_BLOOD_GROUP")
            };
        }

        private static object MapAppointment(MED_APPOINMENT_DETAILS appointment)
        {
            return new
            {
                AppointmentId = appointment.MAD_APPOINMENT_ID,
                PatientNo = appointment.MAD_PATIENT_NO,
                AppointmentDate = appointment.MAD_APPOINMENT_DATE,
                StartTime = appointment.MAD_START_TIME,
                EndTime = appointment.MAD_END_TIME,
                AllocatedTime = appointment.MAD_ALLOCATED_TIME,
                Doctor = appointment.MAD_DOCTOR,
                DoctorUserId = appointment.MAD_USER_ID,
                SlotId = appointment.MAD_SLOT_ID,
                Status = appointment.MAD_STATUS
            };
        }

        private static object MapTimeslot(MED_TIMESLOT timeslot)
        {
            return new
            {
                SlotId = timeslot.MT_SLOT_ID,
                SlotDate = timeslot.MT_SLOT_DATE,
                StartTime = timeslot.MT_START_TIME,
                EndTime = timeslot.MT_END_TIME,
                Doctor = timeslot.MT_DOCTOR,
                DoctorUserId = timeslot.MT_USER_ID,
                ClinicRoom = ReadOptionalString(timeslot, "MT_CLINIC_ROOM"),
                DeliveryChannel = ReadOptionalString(timeslot, "MT_DELIVERY_CHANNEL")
            };
        }

        private static string GetDoctorDisplayName(MED_USER_DETAILS doctor)
        {
            return !string.IsNullOrWhiteSpace(doctor.MUD_FULL_NAME)
                ? doctor.MUD_FULL_NAME.Trim()
                : doctor.MUD_USER_NAME?.Trim() ?? doctor.MUD_USER_ID ?? "Doctor";
        }

        private static string NormalizeEncounterType(string? type, string? patientType)
        {
            var value = string.IsNullOrWhiteSpace(type)
                ? GetSuggestedEncounterType(patientType)
                : type.Trim();

            return value.Length <= 50 ? value : value[..50];
        }

        private static string GetSuggestedEncounterType(string? patientType)
        {
            var value = (patientType ?? string.Empty).Trim().ToLowerInvariant();

            if (value.Contains("emerg")) return "Emergency Clinical Care";
            if (value.Contains("inpatient") || value == "i") return "Inpatient Clinical Review";
            if (value.Contains("tele")) return "Telehealth Follow-up";
            return "OPD Specialist Consultation";
        }

        private static string NormalizeTreatmentStatus(string? status)
        {
            var value = (status ?? "C").Trim().ToUpperInvariant();
            return value == "P" ? "P" : "C";
        }

        private static string? NormalizeText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static string? TrimToLength(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var trimmed = value.Trim();
            return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
        }

        private static string? NormalizeAuditUser(string? supplied, string? doctorId)
        {
            var value = !string.IsNullOrWhiteSpace(supplied) ? supplied.Trim() : doctorId?.Trim();
            if (string.IsNullOrWhiteSpace(value))
                return null;

            return value.Length <= 10 ? value : value[..10];
        }

        private static string? ReadOptionalString(object source, string propertyName)
        {
            var property = source.GetType().GetProperty(propertyName);
            return property?.GetValue(source)?.ToString();
        }

        private static DateTime? ReadOptionalDateTime(object source, string propertyName)
        {
            var property = source.GetType().GetProperty(propertyName);
            var value = property?.GetValue(source);

            if (value is DateTime date)
                return date;

            return DateTime.TryParse(value?.ToString(), out var parsed)
                ? parsed
                : null;
        }
    }
}
