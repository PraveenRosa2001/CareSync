using System.ComponentModel.DataAnnotations;


namespace WebApplication1.Models;

public class MED_MATERIAL_CATALOGUE
{



    [Key]
    public string MMC_MATERIAL_CODE { get; set; }
    public string? MMC_DESCRIPTION { get; set; }
    public string? MMC_MATERIAL_SPEC { get; set; }
    public string? MMC_UNIT { get; set; }
    public decimal? MMC_REORDER_LEVEL { get; set; }

    [StringLength(1)]
    public string? MMC_STATUS { get; set; }

    public string? MMC_CREATED_BY { get; set; }

    public string? MMC_UPDATED_BY { get; set; }


    public decimal? MMC_RATE { get; set; }
}
