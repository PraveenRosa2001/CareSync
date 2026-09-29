using System;
using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models
{
    public class MED_USER_TYPES
    {
        [Key]

        public string MUT_USER_TYPE { get; set; }

        public string? MUT_DESCRIPTION { get; set; }

        [StringLength(1)]
        public string? MUT_STATUS { get; set; }

        public DateTime MUT_CREATED_DATE { get; set; }

        [StringLength(7)]
        public string? MUT_CREATED_BY { get; set; }

        public DateTime? MUT_UPDATED_DATE { get; set; }

        [StringLength(7)]
        public string MUT_UPDATED_BY { get; set; }
    }
}
