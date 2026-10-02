using System.ComponentModel.DataAnnotations;

namespace WebApplication1.DTOs
{
    public class ClinicalPrescriptionRequest
    {
        [Required]
        public string MDD_MATERIAL_CODE { get; set; } = string.Empty;

        [Range(typeof(decimal), "0.01", "99999999")]
        public decimal MDD_QUANTITY { get; set; }

        [StringLength(50)]
        public string? MDD_TAKES { get; set; }
    }

    public class ClinicalEncounterRequest
    {
        [Required]
        public string MTD_PATIENT_CODE { get; set; } = string.Empty;

        public DateTime MTD_DATE { get; set; }

        [Required]
        public string DoctorUserId { get; set; } = string.Empty;

        [StringLength(50)]
        public string? MTD_TYPE { get; set; }

        public int? MTD_CHANNEL_NO { get; set; }

        [StringLength(2000)]
        public string? MTD_COMPLAIN { get; set; }

        [StringLength(2000)]
        public string? MTD_DIAGNOSTICS { get; set; }

        [StringLength(4000)]
        public string? MTD_REMARKS { get; set; }

        [Range(typeof(decimal), "0", "9999999999999999")]
        public decimal? MTD_AMOUNT { get; set; }

        [StringLength(1)]
        public string? MTD_TREATMENT_STATUS { get; set; }

        public int? MTD_APPOINMENT_ID { get; set; }

        [StringLength(10)]
        public string? MTD_CREATED_BY { get; set; }

        public List<ClinicalPrescriptionRequest> Prescriptions { get; set; } = new();
    }
}
