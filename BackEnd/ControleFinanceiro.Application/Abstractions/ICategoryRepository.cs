using ControleFinanceiro.Domain.Categories;

namespace ControleFinanceiro.Application.Abstractions;

public interface ICategoryRepository
{
    Task<bool> ExistsAsync(string name, CategoryType type, CancellationToken ct);
    Task<bool> ExistsByIdAsync(Guid id, CancellationToken ct);

    Task<Category?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(Category category, CancellationToken ct);
    Task RemoveAsync(Category category, CancellationToken ct);
}