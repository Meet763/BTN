using System.Collections.Generic;

namespace BTN.Core.DTOs.Leads
{
    public class LeadStatsResponse
    {
        public int TotalLeads { get; set; }
        public int PendingVerification { get; set; }
        public int VerifiedToday { get; set; }
        public int RejectedToday { get; set; }
        public int DuplicatesFound { get; set; }
        public double VerificationRate { get; set; }
        public int AvgCallDurationSeconds { get; set; }
        public Dictionary<string, int> SourceBreakdown { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> RejectionReasons { get; set; } = new Dictionary<string, int>();
    }
}
