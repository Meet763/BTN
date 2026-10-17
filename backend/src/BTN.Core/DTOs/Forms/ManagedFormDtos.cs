namespace BTN.Core.DTOs.Forms;

public class FormFieldValidationDto
{
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public decimal? Min { get; set; }
    public decimal? Max { get; set; }
    public int? MaxFileMb { get; set; }
    public List<string>? Extensions { get; set; }
}

public class FormFieldSettingsDto
{
    public string? YoutubeUrl { get; set; }
}

public class ManagedFormFieldDto
{
    public Guid Id { get; set; }
    public string FieldKey { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Hint { get; set; }
    public string? Placeholder { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
    public List<string> Options { get; set; } = [];
    public FormFieldValidationDto Validation { get; set; } = new();
    public FormFieldSettingsDto Settings { get; set; } = new();
}

public class ManagedFormDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string IntroTitle { get; set; } = string.Empty;
    public string IntroBody { get; set; } = string.Empty;
    public string SubmitLabel { get; set; } = "Submit";
    public bool IsPublished { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int FieldCount { get; set; }
    public int SubmissionCount { get; set; }
    public List<ManagedFormFieldDto> Fields { get; set; } = [];
}

public class ManagedFormListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public int FieldCount { get; set; }
    public int SubmissionCount { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SaveManagedFormFieldRequest
{
    public string FieldKey { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Hint { get; set; }
    public string? Placeholder { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
    public List<string> Options { get; set; } = [];
    public FormFieldValidationDto? Validation { get; set; }
    public FormFieldSettingsDto? Settings { get; set; }
}

public class SaveManagedFormRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string IntroTitle { get; set; } = string.Empty;
    public string IntroBody { get; set; } = string.Empty;
    public string SubmitLabel { get; set; } = "Submit";
    public bool IsPublished { get; set; }
    public List<SaveManagedFormFieldRequest> Fields { get; set; } = [];
}

public class ManagedFormSubmissionDto
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public Dictionary<string, string> Answers { get; set; } = [];
}

public class PublicManagedFormDto
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string IntroTitle { get; set; } = string.Empty;
    public string IntroBody { get; set; } = string.Empty;
    public string SubmitLabel { get; set; } = "Submit";
    public List<ManagedFormFieldDto> Fields { get; set; } = [];
}

public class IncomingFormFile
{
    public string FieldKey { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long Length { get; set; }
    public Stream Content { get; set; } = Stream.Null;
}
