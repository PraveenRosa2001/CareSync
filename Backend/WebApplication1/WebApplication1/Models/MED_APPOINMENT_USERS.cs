using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Models
{
    [Table("MED_APPOINTMENT_USERS")]
    public class MED_APPOINTMENT_USERS
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? MAU_USER_ID { get; set; }

        [Required]
        [StringLength(500)]
        public string MAU_EMAIL { get; set; }

        [Required]
        [StringLength(13)]
        public string MAU_NIC { get; set; }

        [Required]
        [StringLength(13)]
        public string MAU_CONTACT { get; set; }

        [Required]
        [StringLength(500)]
        public string MAU_ADDRESS { get; set; }

        [Required]
        [StringLength(20)]
        public string MAU_PASSWORD { get; set; }
    }
}
