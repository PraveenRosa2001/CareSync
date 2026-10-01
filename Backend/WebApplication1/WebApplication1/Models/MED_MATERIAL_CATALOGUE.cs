using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Models;

public class MED_MATERIAL_CATALOGUE
{
    [Key]
    [StringLength(10)]
    public string MMC_MATERIAL_CODE { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? MMC_DESCRIPTION { get; set; }

    [StringLength(1000)]
    public string? MMC_MATERIAL_SPEC { get; set; }

    [StringLength(50)]
    public string? MMC_UNIT { get; set; }

    // NOTE: The existing CareSync dispensing logic treats this legacy column
    // as the CURRENT AVAILABLE STOCK. It is intentionally preserved to avoid
    // breaking treatment/pharmacy logic.
    [Column(TypeName = "numeric(18,2)")]
    public decimal? MMC_REORDER_LEVEL { get; set; }

    // Dedicated minimum/safety stock threshold used by the inventory screen.
    [Column(TypeName = "numeric(18,2)")]
    public decimal? MMC_MIN_STOCK { get; set; }

    [StringLength(50)]
    public string? MMC_CATEGORY { get; set; }

    [StringLength(50)]
    public string? MMC_BATCH_NO { get; set; }

    [Column(TypeName = "date")]
    public DateTime? MMC_EXPIRY_DATE { get; set; }

    [StringLength(1)]
    public string? MMC_STATUS { get; set; }

    public DateTime? MMC_CREATED_DATE { get; set; }

    [StringLength(7)]
    public string? MMC_CREATED_BY { get; set; }

    public DateTime? MMC_UPDATED_DATE { get; set; }

    [StringLength(7)]
    public string? MMC_UPDATED_BY { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? MMC_RATE { get; set; }
}
