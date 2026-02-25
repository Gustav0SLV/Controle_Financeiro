using ControleFinanceiro.Domain.Incomes;

namespace ControleFinanceiro.Application.Abstractions;

public interface IMonthlyIncomeRepository
{
    Task<MonthlyIncome?> GetAsync(int year, int month, CancellationToken ct);
    Task AddAsync(MonthlyIncome income, CancellationToken ct);
}