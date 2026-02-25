using ControleFinanceiro.Domain.Budgets;

namespace ControleFinanceiro.Application.Abstractions;

public interface IBudgetRepository
{
    Task<Budget?> GetAsync(int year, int month, Guid categoryId, CancellationToken ct);
    Task AddAsync(Budget budget, CancellationToken ct);
}