using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Models
{
    [Table("MED_DRUGS_DETAILS")]
    public class MED_DRUGS_DETAILS
    {
        [Key, Column(Order = 0)]

        public string MDD_PATIENT_CODE { get; set; }

        [Key, Column(Order = 1)]

        public int MDD_SERIAL_NO { get; set; }

        [Key, Column(Order = 2)]

        public string MDD_MATERIAL_CODE { get; set; }


        public decimal? MDD_QUANTITY { get; set; }


        public decimal? MDD_RATE { get; set; }


        public decimal? MDD_AMOUNT { get; set; }


        public string? MDD_DOSAGE { get; set; }


        public string? MDD_TAKES { get; set; }


        public decimal? MDD_GIVEN_QUANTITY { get; set; }


        public string? MDD_STATUS { get; set; }


        public string? MDD_CREATED_BY { get; set; }


        public DateTime? MDD_CREATED_DATE { get; set; }


        public string? MDD_UPDATED_BY { get; set; }


        public DateTime? MDD_UPDATED_DATE { get; set; }


    }
}
