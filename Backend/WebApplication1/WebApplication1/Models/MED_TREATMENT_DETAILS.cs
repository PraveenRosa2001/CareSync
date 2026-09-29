using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Models
{
    public class MED_TREATMENT_DETAILS
    {
        [Key, Column(Order = 0)]
        public string? MTD_PATIENT_CODE { get; set; }

        [Key, Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? MTD_SERIAL_NO { get; set; }


    
        public DateTime MTD_DATE { get; set; }

        public string? MTD_DOCTOR { get; set; }


        public string? MTD_TYPE { get; set; }

        public string? MTD_COMPLAIN { get; set; }

        public string? MTD_DIAGNOSTICS { get; set; }

        public string? MTD_REMARKS { get; set; }

        public decimal? MTD_AMOUNT { get; set; }

        public string? MTD_PAYMENT_STATUS { get; set; }

        [MaxLength(1)]
        public string MTD_TREATMENT_STATUS { get; set; }

        public string MTD_SMS_STATUS { get; set; }

        public string? MTD_SMS { get; set; }

        [MaxLength(1)]
        public string? MTD_MEDICAL_STATUS { get; set; }

        [MaxLength(1)]
        public string? MTD_STATUS { get; set; }

        public string? MTD_CREATED_BY { get; set; }

        public DateTime? MTD_CREATED_DATE { get; set; }

        public string? MTD_UPDATED_BY { get; set; }

        public DateTime? MTD_UPDATED_DATE { get; set; }



        public int? MTD_APPOINMENT_ID { get; set; }


        public int? MTD_CHANNEL_NO { get; set; }
    }
}
