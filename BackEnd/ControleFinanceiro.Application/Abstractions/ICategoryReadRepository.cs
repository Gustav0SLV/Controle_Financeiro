using ControleFinanceiro.Application.Categories.GetCategories;

namespace ControleFinanceiro.Application.Abstractions;

public interface ICategoryReadRepository
{
    Task<IReadOnlyList<CategoryDto>> ListAsync(CancellationToken ct);
}