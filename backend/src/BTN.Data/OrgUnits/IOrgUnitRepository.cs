using BTN.Data.Entities;

namespace BTN.Data.OrgUnits;

public interface IOrgUnitRepository
{
    IQueryable<Entities.OrgUnit> Query();
    Task<Entities.OrgUnit?> GetByIdAsync(Guid id);
    Task<Entities.OrgUnit?> GetByCodeAsync(string code);
    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null);
    void Add(Entities.OrgUnit orgUnit);
    void Remove(Entities.OrgUnit orgUnit);
}
