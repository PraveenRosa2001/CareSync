using System;

namespace WebApplication1.DTOs
{
    /// <summary>
    /// Read-only projection used by the patient-record table.
    /// It intentionally excludes credentials and large binary data such as MPD_PASSWORD/MPD_PHOTO.
    /// </summary>
    public sealed class PatientRecordDto
    {
        public string PatientCode { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string? PatientType { get; set; }

        public string? MobileNo { get; set; }
        public string? Email { get; set; }
        public string? NicNo { get; set; }

        public DateTime? DateOfBirth { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }
        public string? BloodGroup { get; set; }

        public string? Address { get; set; }
        public string? City { get; set; }
        public string? GuardianName { get; set; }
        public string? GuardianContactNo { get; set; }
        public string? Remarks { get; set; }

        public string PatientStatus { get; set; } = "Active";
        public string ClinicalStatusCode { get; set; } = "REGISTERED";
        public string ClinicalStatus { get; set; } = "Registered";

        public string? AssignedPhysicianId { get; set; }
        public string? AssignedPhysicianName { get; set; }
        public string? Specialization { get; set; }

        public DateTime? LastEncounterDate { get; set; }
        public DateTime? NextAppointmentDate { get; set; }
    }
}
