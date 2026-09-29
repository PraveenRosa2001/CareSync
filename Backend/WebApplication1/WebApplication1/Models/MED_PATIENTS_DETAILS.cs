using System;
using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models
{
    public class MED_PATIENTS_DETAILS
    {
        [Key]
        public string? MPD_PATIENT_CODE { get; set; }

        public string? MPD_PATIENT_NAME { get; set; }

        public string? MPD_PATIENT_TYPE { get; set; }

        [Required]
        public string? MPD_MOBILE_NO { get; set; }

        public string? MPD_NIC_NO { get; set; }

        public string? MPD_PATIENT_REMARKS { get; set; }

        public string? MPD_ADDRESS { get; set; }

        public string? MPD_GENDER { get; set; }

        public string? MPD_CITY { get; set; }

        public string? MPD_GUARDIAN { get; set; }

        public string? MPD_GUARDIAN_CONTACT_NO { get; set; }

        [StringLength(1)]
        public string? MPD_STATUS { get; set; }

        public string? MPD_CREATED_BY { get; set; }

        public DateTime? MPD_CREATED_DATE { get; set; }  // Nullable DateTime

        public string? MPD_UPDATED_BY { get; set; }

        public DateTime? MPD_UPDATED_DATE { get; set; }  // Nullable DateTime


        public DateTime? MPD_BIRTHDAY { get; set; }

        public string? MPD_PASSWORD { get; set; }

        public string? MPD_EMAIL { get; set; }


        public byte[]? MPD_PHOTO { get; set; }


        public string? test {  get; set; }
    }
}
