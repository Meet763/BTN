using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BTN.Core.DTOs.Leads
{
    public class BulkImportLeadsRequest
    {
        [Required]
        public List<CreateLeadRequest> Leads { get; set; } = new List<CreateLeadRequest>();
    }
}
