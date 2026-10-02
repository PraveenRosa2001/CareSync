using System.ComponentModel.DataAnnotations;

namespace WebApplication1.DTOs
{
    public class PharmacyDispenseRequest
    {
        public string? DispenserUserId { get; set; }

        [Required]
        public List<PharmacyDispenseLineRequest> Lines { get; set; } = new();
    }

    public class PharmacyDispenseLineRequest
    {
        [Required]
        public string MaterialCode { get; set; } = string.Empty;

        [Range(typeof(decimal), "0.01", "999999999")]
        public decimal Quantity { get; set; }
    }
}
