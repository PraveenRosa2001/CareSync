using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Models
{
    public class MED_TIMESLOT
    {

        [Key]

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]

        public int MT_SLOT_ID { get; set; }

        public DateTime MT_SLOT_DATE { get; set; }

        public TimeSpan MT_START_TIME { get; set; }

        public TimeSpan MT_END_TIME { get; set; }

        public int MT_PATIENT_NO { get; set; }

        public int? MT_MAXIMUM_PATIENTS { get; set; }


        public string? MT_DOCTOR { get; set; }

        public TimeSpan? MT_ALLOCATED_TIME { get; set; }

        public string? MT_USER_ID { get;set; }


        public string? MT_TIMESLOT_STATUS { get;set; }


        public string? MT_DELETE_STATUS { get; set; }



    }
}
