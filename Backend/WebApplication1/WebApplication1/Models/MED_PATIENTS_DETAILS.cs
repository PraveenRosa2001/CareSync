//using System;
//using System.ComponentModel.DataAnnotations;

//namespace WebApplication1.Models
//{
//    public class MED_PATIENTS_DETAILS
//    {
//        [Key]
//        public string? MPD_PATIENT_CODE { get; set; }

//        public string? MPD_PATIENT_NAME { get; set; }

//        public string? MPD_PATIENT_TYPE { get; set; }

//        [Required]
//        public string? MPD_MOBILE_NO { get; set; }

//        public string? MPD_NIC_NO { get; set; }

//        public string? MPD_PATIENT_REMARKS { get; set; }

//        public string? MPD_ADDRESS { get; set; }

//        public string? MPD_GENDER { get; set; }

//        public string? MPD_CITY { get; set; }

//        public string? MPD_GUARDIAN { get; set; }

//        public string? MPD_GUARDIAN_CONTACT_NO { get; set; }

//        [StringLength(1)]
//        public string? MPD_STATUS { get; set; }

//        public string? MPD_CREATED_BY { get; set; }

//        public DateTime? MPD_CREATED_DATE { get; set; }  // Nullable DateTime

//        public string? MPD_UPDATED_BY { get; set; }

//        public DateTime? MPD_UPDATED_DATE { get; set; }  // Nullable DateTime


//        public DateTime? MPD_BIRTHDAY { get; set; }

//        public string? MPD_PASSWORD { get; set; }

//        public string? MPD_EMAIL { get; set; }


//        public byte[]? MPD_PHOTO { get; set; }


//        public string? test {  get; set; }
//    }
//}


using System;
using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models
{
    public class MED_PATIENTS_DETAILS
    {
        [Key]
        [StringLength(10)]
        public string? MPD_PATIENT_CODE { get; set; }

        [StringLength(200)]
        public string? MPD_PATIENT_NAME { get; set; }

        // Database migration widens this from NVARCHAR(1) to NVARCHAR(20).
        [StringLength(20)]
        public string? MPD_PATIENT_TYPE { get; set; }

        [Required]
        [StringLength(200)]
        public string? MPD_MOBILE_NO { get; set; }

        [StringLength(20)]
        public string? MPD_NIC_NO { get; set; }

        [StringLength(2000)]
        public string? MPD_PATIENT_REMARKS { get; set; }

        [StringLength(500)]
        public string? MPD_ADDRESS { get; set; }

        [StringLength(20)]
        public string? MPD_GENDER { get; set; }

        // Added by 01_patient_record_schema_update.sql.
        [StringLength(10)]
        public string? MPD_BLOOD_GROUP { get; set; }

        [StringLength(100)]
        public string? MPD_CITY { get; set; }

        [StringLength(200)]
        public string? MPD_GUARDIAN { get; set; }

        [StringLength(20)]
        public string? MPD_GUARDIAN_CONTACT_NO { get; set; }

        [StringLength(1)]
        public string? MPD_STATUS { get; set; }

        [StringLength(50)]
        public string? MPD_CREATED_BY { get; set; }

        public DateTime? MPD_CREATED_DATE { get; set; }

        [StringLength(50)]
        public string? MPD_UPDATED_BY { get; set; }

        public DateTime? MPD_UPDATED_DATE { get; set; }

        public DateTime? MPD_BIRTHDAY { get; set; }

        [StringLength(200)]
        public string? MPD_PASSWORD { get; set; }

        [StringLength(500)]
        public string? MPD_EMAIL { get; set; }

        public byte[]? MPD_PHOTO { get; set; }

        [StringLength(20)]
        public string? test { get; set; }
    }
}
