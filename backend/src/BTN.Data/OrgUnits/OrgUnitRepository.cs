using BTN.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace BTN.Data.OrgUnits;

public class OrgUnitRepository : IOrgUnitRepository
{
    private readonly BtnDbContext _context;

    public OrgUnitRepository(BtnDbContext context)
    {
        _context = context;
    }

    public IQueryable<Entities.OrgUnit> Query() =>
        _context.OrgUnits
            .Include(o => o.ParentOrgUnit)
            .Include(o => o.HeadEmployee)!.ThenInclude(e => e!.User)
            .Include(o => o.Members);

    public Task<Entities.OrgUnit?> GetByIdAsync(Guid id) =>
        Query().FirstOrDefaultAsync(o => o.Id == id);

    public Task<Entities.OrgUnit?> GetByCodeAsync(string code) =>
        Query().FirstOrDefaultAsync(o => o.Code.ToLower() == code.ToLower());

    public Task<bool> CodeExistsAsync(string code, Guid? excludeId = null)
    {
        var query = _context.OrgUnits.Where(o => o.Code.ToLower() == code.ToLower());
        if (excludeId.HasValue)
        {
            query = query.Where(o => o.Id != excludeId.Value);
        }

        return query.AnyAsync();
    }

    public void Add(Entities.OrgUnit orgUnit) => _context.OrgUnits.Add(orgUnit);

    public void Remove(Entities.OrgUnit orgUnit) => _context.OrgUnits.Remove(orgUnit);
}
