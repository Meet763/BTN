namespace BTN.Core.DTOs.Leads
{
    public class BulkImportResponse
    {
        public int TotalReceived { get; set; }
        public int Created { get; set; }
        public int Duplicates { get; set; }
        public int Errors { get; set; }
    }
}
