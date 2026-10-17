using BTN.Data.Context;
using BTN.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.Forms;

public interface IManagedFormRepository
{
    Task<List<ManagedForm>> ListAsync();
    Task<Dictionary<Guid, int>> SubmissionCountsAsync();
    Task<ManagedForm?> GetByIdAsync(Guid id);
    Task<ManagedForm?> GetBySlugAsync(string slug);
    Task<bool> SlugExistsAsync(string slug, Guid? exceptId);
    void Add(ManagedForm form);
    void Remove(ManagedForm form);
    void RemoveFields(IEnumerable<ManagedFormField> fields);
    Task<List<ManagedFormSubmission>> ListSubmissionsAsync(Guid formId, int skip, int take);
    Task<int> CountSubmissionsAsync(Guid formId);
    Task<ManagedFormSubmission?> GetSubmissionAsync(Guid formId, Guid submissionId);
    void AddSubmission(ManagedFormSubmission submission);
}

public class ManagedFormRepository : IManagedFormRepository
{
    private readonly BtnDbContext _context;

    public ManagedFormRepository(BtnDbContext context)
    {
        _context = context;
    }

    public Task<List<ManagedForm>> ListAsync() =>
        _context.ManagedForms
            .Include(f => f.Fields)
            .OrderByDescending(f => f.UpdatedAt)
            .ToListAsync();

    public Task<ManagedForm?> GetByIdAsync(Guid id) =>
        _context.ManagedForms
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == id);

    public Task<ManagedForm?> GetBySlugAsync(string slug) =>
        _context.ManagedForms
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Slug == slug);

    public Task<bool> SlugExistsAsync(string slug, Guid? exceptId) =>
        _context.ManagedForms.AnyAsync(f => f.Slug == slug && (exceptId == null || f.Id != exceptId));

    public async Task<Dictionary<Guid, int>> SubmissionCountsAsync() =>
        await _context.ManagedFormSubmissions
            .GroupBy(s => s.FormId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count);

    public void Add(ManagedForm form) => _context.ManagedForms.Add(form);

    public void Remove(ManagedForm form) => _context.ManagedForms.Remove(form);

    public void RemoveFields(IEnumerable<ManagedFormField> fields) => _context.ManagedFormFields.RemoveRange(fields);

    public Task<List<ManagedFormSubmission>> ListSubmissionsAsync(Guid formId, int skip, int take) =>
        _context.ManagedFormSubmissions
            .Where(s => s.FormId == formId)
            .OrderByDescending(s => s.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

    public Task<int> CountSubmissionsAsync(Guid formId) =>
        _context.ManagedFormSubmissions.CountAsync(s => s.FormId == formId);

    public Task<ManagedFormSubmission?> GetSubmissionAsync(Guid formId, Guid submissionId) =>
        _context.ManagedFormSubmissions.FirstOrDefaultAsync(s => s.FormId == formId && s.Id == submissionId);

    public void AddSubmission(ManagedFormSubmission submission) => _context.ManagedFormSubmissions.Add(submission);
}
