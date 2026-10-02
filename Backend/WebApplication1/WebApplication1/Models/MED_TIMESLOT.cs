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
        public string? MT_USER_ID { get; set; }
        public string? MT_TIMESLOT_STATUS { get; set; }
        public string? MT_DELETE_STATUS { get; set; }

        public string? MT_CLINIC_ROOM { get; set; }
        public string? MT_DELIVERY_CHANNEL { get; set; }

        // Set only after a successful one-day-before reminder email is sent to the doctor.
        public bool MT_REMINDER_EMAIL_SENT { get; set; } = false;
        public DateTime? MT_REMINDER_EMAIL_SENT_DATE { get; set; }
    }
}
