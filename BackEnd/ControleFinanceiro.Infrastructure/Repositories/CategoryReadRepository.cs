using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Application.Categories.GetCategories;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class CategoryReadRepository : ICategoryReadRepository
{
    private readonly AppDbContext _db;

    public CategoryReadRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<CategoryDto>> ListAsync(CancellationToken ct)
    {
        return await _db.Categories
            .AsNoTracking()
            .OrderBy(c => c.Type)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Type))
            .ToListAsync(ct);
    }
}