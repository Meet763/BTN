using System.Text.Json;
using System.Text.RegularExpressions;
using BTN.Core.DTOs.Forms;
using BTN.Core.Forms;
using BTN.Data;
using BTN.Data.Entities;
using BTN.Data.Forms;

namespace BTN.Business.Forms;

public interface IManagedFormManager
{
    Task<List<ManagedFormListItemDto>> ListAsync();
    Task<ManagedFormDto?> GetAsync(Guid id);
    Task<ManagedFormDto> CreateAsync(SaveManagedFormRequest request);
    Task<ManagedFormDto> UpdateAsync(Guid id, SaveManagedFormRequest request);
    Task DeleteAsync(Guid id);
    Task<(List<ManagedFormSubmissionDto> Items, int Total)> ListSubmissionsAsync(Guid id, int page, int pageSize);
    Task<PublicManagedFormDto?> GetPublishedAsync(string slug);
    Task<Guid> SubmitAsync(string slug, IDictionary<string, string?> answers, IReadOnlyList<IncomingFormFile> files, string uploadRoot, string? honeypot);
    Task<(ManagedFormSubmission Submission, string StoredName, string DownloadName)?> OpenFileAsync(Guid formId, Guid submissionId, string fieldKey);
}

public class ManagedFormManager : IManagedFormManager
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static readonly Regex SlugPattern = new("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);
    private static readonly Regex KeyPattern = new("^[a-zA-Z][a-zA-Z0-9_]{0,40}$", RegexOptions.Compiled);
    private static readonly Regex EmailPattern = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);
    private static readonly Regex YoutubePattern = new(@"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/))([A-Za-z0-9_-]{6,})", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly IManagedFormRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public ManagedFormManager(IManagedFormRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ManagedFormListItemDto>> ListAsync()
    {
        var forms = await _repository.ListAsync();
        var counts = await _repository.SubmissionCountsAsync();
        return forms.Select(form => new ManagedFormListItemDto
        {
            Id = form.Id,
            Name = form.Name,
            Slug = form.Slug,
            IsPublished = form.IsPublished,
            FieldCount = form.Fields.Count,
            SubmissionCount = counts.GetValueOrDefault(form.Id),
            UpdatedAt = form.UpdatedAt
        }).ToList();
    }

    public async Task<ManagedFormDto?> GetAsync(Guid id)
    {
        var form = await _repository.GetByIdAsync(id);
        if (form == null) return null;
        var count = await _repository.CountSubmissionsAsync(id);
        return Map(form, count);
    }

    public async Task<ManagedFormDto> CreateAsync(SaveManagedFormRequest request)
    {
        var form = new ManagedForm { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
        Apply(form, request);
        if (await _repository.SlugExistsAsync(form.Slug, null))
        {
            throw new InvalidOperationException("That form link is already used. Choose another.");
        }

        _repository.Add(form);
        await _unitOfWork.SaveChangesAsync();
        return Map(form, 0);
    }

    public async Task<ManagedFormDto> UpdateAsync(Guid id, SaveManagedFormRequest request)
    {
        var form = await _repository.GetByIdAsync(id) ?? throw new InvalidOperationException("Form not found.");
        Apply(form, request);
        if (await _repository.SlugExistsAsync(form.Slug, form.Id))
        {
            throw new InvalidOperationException("That form link is already used. Choose another.");
        }

        var incomingKeys = request.Fields.Select(f => f.FieldKey.Trim()).ToHashSet(StringComparer.Ordinal);
        var removed = form.Fields.Where(f => !incomingKeys.Contains(f.FieldKey)).ToList();
        if (removed.Count > 0) _repository.RemoveFields(removed);
        var removedKeys = removed.Select(f => f.FieldKey).ToHashSet(StringComparer.Ordinal);

        var byKey = form.Fields
            .Where(f => !removedKeys.Contains(f.FieldKey))
            .ToDictionary(f => f.FieldKey, StringComparer.Ordinal);
        foreach (var field in NormalizeFields(request.Fields))
        {
            if (!byKey.TryGetValue(field.FieldKey, out var row))
            {
                row = new ManagedFormField { Id = Guid.NewGuid(), FormId = form.Id, FieldKey = field.FieldKey };
                form.Fields.Add(row);
            }

            row.FieldType = field.FieldType;
            row.Label = field.Label;
            row.Hint = field.Hint;
            row.Placeholder = field.Placeholder;
            row.IsRequired = field.IsRequired;
            row.SortOrder = field.SortOrder;
            row.OptionsJson = field.OptionsJson;
            row.ValidationJson = field.ValidationJson;
            row.SettingsJson = field.SettingsJson;
        }

        form.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();
        var count = await _repository.CountSubmissionsAsync(form.Id);
        return Map(form, count);
    }

    public async Task DeleteAsync(Guid id)
    {
        var form = await _repository.GetByIdAsync(id) ?? throw new InvalidOperationException("Form not found.");
        _repository.Remove(form);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<(List<ManagedFormSubmissionDto> Items, int Total)> ListSubmissionsAsync(Guid id, int page, int pageSize)
    {
        if (await _repository.GetByIdAsync(id) == null) throw new InvalidOperationException("Form not found.");
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var total = await _repository.CountSubmissionsAsync(id);
        var rows = await _repository.ListSubmissionsAsync(id, (page - 1) * pageSize, pageSize);
        var items = rows.Select(row => new ManagedFormSubmissionDto
        {
            Id = row.Id,
            CreatedAt = row.CreatedAt,
            Answers = ReadAnswers(row.AnswersJson)
        }).ToList();
        return (items, total);
    }

    public async Task<PublicManagedFormDto?> GetPublishedAsync(string slug)
    {
        var form = await _repository.GetBySlugAsync(NormalizeSlug(slug));
        if (form == null || !form.IsPublished) return null;
        var mapped = Map(form, 0);
        return new PublicManagedFormDto
        {
            Name = mapped.Name,
            Slug = mapped.Slug,
            IntroTitle = mapped.IntroTitle,
            IntroBody = mapped.IntroBody,
            SubmitLabel = mapped.SubmitLabel,
            Fields = mapped.Fields
        };
    }

    public async Task<Guid> SubmitAsync(
        string slug,
        IDictionary<string, string?> answers,
        IReadOnlyList<IncomingFormFile> files,
        string uploadRoot,
        string? honeypot)
    {
        if (!string.IsNullOrWhiteSpace(honeypot)) return Guid.Empty;

        var form = await _repository.GetBySlugAsync(NormalizeSlug(slug));
        if (form == null || !form.IsPublished) throw new InvalidOperationException("This form is not available.");

        var fields = form.Fields.OrderBy(f => f.SortOrder).ToList();
        var stored = new Dictionary<string, string>(StringComparer.Ordinal);
        var filesByKey = files
            .Where(f => !string.IsNullOrWhiteSpace(f.FieldKey))
            .GroupBy(f => f.FieldKey.Trim(), StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.Last(), StringComparer.Ordinal);

        foreach (var field in fields)
        {
            if (!FormFieldTypes.CollectsAnswer(field.FieldType)) continue;
            answers.TryGetValue(field.FieldKey, out var raw);
            var value = raw?.Trim() ?? string.Empty;
            filesByKey.TryGetValue(field.FieldKey, out var upload);
            stored[field.FieldKey] = ValidateField(field, value, upload);
        }

        var submissionId = Guid.NewGuid();
        var folder = Path.Combine(uploadRoot, "form-uploads", submissionId.ToString("N"));
        foreach (var field in fields.Where(f => f.FieldType == FormFieldTypes.Document))
        {
            if (!filesByKey.TryGetValue(field.FieldKey, out var upload) || upload.Length <= 0) continue;
            Directory.CreateDirectory(folder);
            var original = Path.GetFileName(upload.FileName);
            var storedName = field.FieldKey + "-" + Guid.NewGuid().ToString("N")[..8] + Path.GetExtension(original).ToLowerInvariant();
            var path = Path.Combine(folder, storedName);
            await using var target = File.Create(path);
            if (upload.Content.CanSeek) upload.Content.Position = 0;
            await upload.Content.CopyToAsync(target);
            stored[field.FieldKey] = original + "\n" + storedName;
        }

        _repository.AddSubmission(new ManagedFormSubmission
        {
            Id = submissionId,
            FormId = form.Id,
            AnswersJson = JsonSerializer.Serialize(stored),
            CreatedAt = DateTime.UtcNow
        });
        await _unitOfWork.SaveChangesAsync();
        return submissionId;
    }

    public async Task<(ManagedFormSubmission Submission, string StoredName, string DownloadName)?> OpenFileAsync(Guid formId, Guid submissionId, string fieldKey)
    {
        var row = await _repository.GetSubmissionAsync(formId, submissionId);
        if (row == null) return null;
        var answers = ReadAnswers(row.AnswersJson);
        if (!answers.TryGetValue(fieldKey, out var value) || string.IsNullOrWhiteSpace(value)) return null;
        var parts = value.Split('\n', 2);
        if (parts.Length != 2) return null;
        var storedName = Path.GetFileName(parts[1]);
        if (string.IsNullOrWhiteSpace(storedName)) return null;
        return (row, storedName, Path.GetFileName(parts[0]));
    }

    private void Apply(ManagedForm form, SaveManagedFormRequest request)
    {
        var name = (request.Name ?? string.Empty).Trim();
        if (name.Length < 2) throw new InvalidOperationException("Give the form a name.");
        var slug = NormalizeSlug(string.IsNullOrWhiteSpace(request.Slug) ? name : request.Slug);
        if (!SlugPattern.IsMatch(slug)) throw new InvalidOperationException("The form link can use lowercase letters, numbers, and hyphens.");

        form.Name = name.Length > 120 ? name[..120] : name;
        form.Slug = slug;
        form.Description = TrimOrNull(request.Description, 500);
        form.IntroTitle = string.IsNullOrWhiteSpace(request.IntroTitle) ? "Tell us a little about you" : request.IntroTitle.Trim();
        form.IntroBody = string.IsNullOrWhiteSpace(request.IntroBody)
            ? "One question at a time. You can go back and change an answer."
            : request.IntroBody.Trim();
        form.SubmitLabel = string.IsNullOrWhiteSpace(request.SubmitLabel) ? "Submit" : request.SubmitLabel.Trim();
        form.IsPublished = request.IsPublished;
        form.UpdatedAt = DateTime.UtcNow;

        if (form.Fields.Count == 0)
        {
            foreach (var field in NormalizeFields(request.Fields))
            {
                form.Fields.Add(new ManagedFormField
                {
                    Id = Guid.NewGuid(),
                    FormId = form.Id,
                    FieldKey = field.FieldKey,
                    FieldType = field.FieldType,
                    Label = field.Label,
                    Hint = field.Hint,
                    Placeholder = field.Placeholder,
                    IsRequired = field.IsRequired,
                    SortOrder = field.SortOrder,
                    OptionsJson = field.OptionsJson,
                    ValidationJson = field.ValidationJson,
                    SettingsJson = field.SettingsJson
                });
            }
        }
    }

    private static List<ManagedFormField> NormalizeFields(IEnumerable<SaveManagedFormFieldRequest> fields)
    {
        var list = fields?.ToList() ?? [];
        if (list.Count > 40) throw new InvalidOperationException("A form can have up to 40 fields.");
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var normalized = new List<ManagedFormField>();
        for (var i = 0; i < list.Count; i++)
        {
            var field = list[i];
            var type = (field.FieldType ?? string.Empty).Trim();
            if (!FormFieldTypes.IsKnown(type)) throw new InvalidOperationException("One of the fields uses a type this form cannot save.");
            var key = (field.FieldKey ?? string.Empty).Trim();
            if (!KeyPattern.IsMatch(key)) throw new InvalidOperationException("Each field needs a short key made of letters, numbers, and underscores.");
            if (!seen.Add(key)) throw new InvalidOperationException($"The field key “{key}” is used more than once.");
            var label = (field.Label ?? string.Empty).Trim();
            if (label.Length < 2) throw new InvalidOperationException("Every field needs a question or label.");

            var options = (field.Options ?? [])
                .Select(o => o.Trim())
                .Where(o => o.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(40)
                .ToList();
            if (type == FormFieldTypes.Dropdown && options.Count < 2)
            {
                throw new InvalidOperationException($"Add at least two choices for “{label}”.");
            }

            var settings = field.Settings ?? new FormFieldSettingsDto();
            if (type == FormFieldTypes.Youtube)
            {
                var url = (settings.YoutubeUrl ?? string.Empty).Trim();
                if (!YoutubePattern.IsMatch(url)) throw new InvalidOperationException($"“{label}” needs a YouTube link.");
                settings.YoutubeUrl = url;
            }

            normalized.Add(new ManagedFormField
            {
                FieldKey = key,
                FieldType = type,
                Label = label.Length > 180 ? label[..180] : label,
                Hint = TrimOrNull(field.Hint, 500),
                Placeholder = TrimOrNull(field.Placeholder, 160),
                IsRequired = type == FormFieldTypes.Youtube ? false : field.IsRequired,
                SortOrder = i,
                OptionsJson = options.Count == 0 ? null : JsonSerializer.Serialize(options),
                ValidationJson = JsonSerializer.Serialize(field.Validation ?? new FormFieldValidationDto(), Json),
                SettingsJson = JsonSerializer.Serialize(settings, Json)
            });
        }

        return normalized;
    }

    private static string ValidateField(ManagedFormField field, string value, IncomingFormFile? upload)
    {
        var validation = ReadValidation(field.ValidationJson);
        var required = field.IsRequired;
        if (field.FieldType == FormFieldTypes.Document)
        {
            if (upload == null || upload.Length <= 0)
            {
                if (required) throw new InvalidOperationException($"Upload a file for “{field.Label}”.");
                return string.Empty;
            }

            var maxMb = validation.MaxFileMb is > 0 and <= 15 ? validation.MaxFileMb.Value : 8;
            if (upload.Length > maxMb * 1024L * 1024L)
            {
                throw new InvalidOperationException($"“{field.Label}” must be {maxMb} MB or smaller.");
            }

            var ext = Path.GetExtension(upload.FileName).TrimStart('.').ToLowerInvariant();
            var allowed = (validation.Extensions is { Count: > 0 } ? validation.Extensions : ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"])
                .Select(e => e.Trim().TrimStart('.').ToLowerInvariant())
                .Where(e => e.Length > 0)
                .ToHashSet();
            if (!allowed.Contains(ext))
            {
                throw new InvalidOperationException($"“{field.Label}” accepts {string.Join(", ", allowed)} files.");
            }

            return Path.GetFileName(upload.FileName);
        }

        if (string.IsNullOrWhiteSpace(value))
        {
            if (required) throw new InvalidOperationException($"Please answer “{field.Label}”.");
            return string.Empty;
        }

        switch (field.FieldType)
        {
            case FormFieldTypes.Email:
                if (!EmailPattern.IsMatch(value) || value.Length > 150) throw new InvalidOperationException("Enter a valid email address.");
                break;
            case FormFieldTypes.Phone:
                var digits = new string(value.Where(char.IsDigit).ToArray());
                if (digits.Length is < 7 or > 15) throw new InvalidOperationException("Enter a phone number with 7 to 15 digits.");
                value = digits;
                break;
            case FormFieldTypes.Number:
                if (!decimal.TryParse(value, out var number)) throw new InvalidOperationException($"“{field.Label}” needs a number.");
                if (validation.Min.HasValue && number < validation.Min.Value) throw new InvalidOperationException($"“{field.Label}” must be at least {validation.Min}.");
                if (validation.Max.HasValue && number > validation.Max.Value) throw new InvalidOperationException($"“{field.Label}” must be at most {validation.Max}.");
                break;
            case FormFieldTypes.Date:
                if (!DateOnly.TryParse(value, out _)) throw new InvalidOperationException($"Choose a date for “{field.Label}”.");
                break;
            case FormFieldTypes.Dropdown:
                var options = ReadOptions(field.OptionsJson);
                if (!options.Contains(value, StringComparer.Ordinal)) throw new InvalidOperationException($"Choose one of the options for “{field.Label}”.");
                break;
            case FormFieldTypes.YesNo:
                if (value is not ("yes" or "no")) throw new InvalidOperationException($"Choose yes or no for “{field.Label}”.");
                break;
            case FormFieldTypes.Checkbox:
                if (required && value is not ("yes" or "true")) throw new InvalidOperationException($"Please confirm “{field.Label}”.");
                break;
            case FormFieldTypes.VideoLink:
                if (!YoutubePattern.IsMatch(value)) throw new InvalidOperationException("Paste a YouTube video link.");
                break;
            case FormFieldTypes.Website:
                if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                {
                    throw new InvalidOperationException("Enter a website starting with https://.");
                }
                break;
            case FormFieldTypes.PostalCode:
                if (value.Length is < 3 or > 12) throw new InvalidOperationException("Enter a postal code.");
                break;
            default:
                var min = validation.MinLength ?? (required ? 2 : 0);
                var max = validation.MaxLength ?? (field.FieldType == FormFieldTypes.Note || field.FieldType == FormFieldTypes.Address ? 500 : 160);
                if (value.Length < min) throw new InvalidOperationException($"“{field.Label}” needs at least {min} characters.");
                if (value.Length > max) throw new InvalidOperationException($"“{field.Label}” must be {max} characters or fewer.");
                break;
        }

        return value;
    }

    private static ManagedFormDto Map(ManagedForm form, int submissionCount) => new()
    {
        Id = form.Id,
        Name = form.Name,
        Slug = form.Slug,
        Description = form.Description,
        IntroTitle = form.IntroTitle,
        IntroBody = form.IntroBody,
        SubmitLabel = form.SubmitLabel,
        IsPublished = form.IsPublished,
        UpdatedAt = form.UpdatedAt,
        FieldCount = form.Fields.Count,
        SubmissionCount = submissionCount,
        Fields = form.Fields.OrderBy(f => f.SortOrder).Select(MapField).ToList()
    };

    private static ManagedFormFieldDto MapField(ManagedFormField field) => new()
    {
        Id = field.Id,
        FieldKey = field.FieldKey,
        FieldType = field.FieldType,
        Label = field.Label,
        Hint = field.Hint,
        Placeholder = field.Placeholder,
        IsRequired = field.IsRequired,
        SortOrder = field.SortOrder,
        Options = ReadOptions(field.OptionsJson),
        Validation = ReadValidation(field.ValidationJson),
        Settings = ReadSettings(field.SettingsJson)
    };

    private static List<string> ReadOptions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? []; }
        catch { return []; }
    }

    private static FormFieldValidationDto ReadValidation(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new FormFieldValidationDto();
        try { return JsonSerializer.Deserialize<FormFieldValidationDto>(json, Json) ?? new FormFieldValidationDto(); }
        catch { return new FormFieldValidationDto(); }
    }

    private static FormFieldSettingsDto ReadSettings(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new FormFieldSettingsDto();
        try { return JsonSerializer.Deserialize<FormFieldSettingsDto>(json, Json) ?? new FormFieldSettingsDto(); }
        catch { return new FormFieldSettingsDto(); }
    }

    private static Dictionary<string, string> ReadAnswers(string json)
    {
        try { return JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? []; }
        catch { return []; }
    }

    private static string NormalizeSlug(string value) =>
        value.Trim().ToLowerInvariant().Replace(' ', '-');

    private static string? TrimOrNull(string? value, int max)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;
        return trimmed.Length > max ? trimmed[..max] : trimmed;
    }
}
