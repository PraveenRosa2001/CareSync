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

        [StringLength(200)]
        public string? MT_DOCTOR { get; set; }

        public TimeSpan? MT_ALLOCATED_TIME { get; set; }

        [StringLength(7)]
        public string? MT_USER_ID { get; set; }

        [StringLength(1)]
        public string? MT_TIMESLOT_STATUS { get; set; }

        [StringLength(1)]
        public string? MT_DELETE_STATUS { get; set; }

        [StringLength(100)]
        public string? MT_CLINIC_ROOM { get; set; }

        [StringLength(20)]
        public string? MT_DELIVERY_CHANNEL { get; set; }
    }
}
