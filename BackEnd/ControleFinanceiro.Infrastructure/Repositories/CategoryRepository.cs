using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Categories;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _db;

    public CategoryRepository(AppDbContext db) => _db = db;

    public Task<bool> ExistsAsync(string name, CategoryType type, CancellationToken ct)
        => _db.Categories.AnyAsync(c => c.Name == name && c.Type == type, ct);

    public Task<bool> ExistsByIdAsync(Guid id, CancellationToken ct)
        => _db.Categories.AnyAsync(c => c.Id == id, ct);

    public Task<Category?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task AddAsync(Category category, CancellationToken ct)
        => _db.Categories.AddAsync(category, ct).AsTask();

    public Task RemoveAsync(Category category, CancellationToken ct)
    {
        _db.Categories.Remove(category);
        return Task.CompletedTask;
    }
}