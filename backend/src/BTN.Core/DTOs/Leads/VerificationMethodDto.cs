namespace BTN.Core.DTOs.Leads;

public class VerificationMethodDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}
