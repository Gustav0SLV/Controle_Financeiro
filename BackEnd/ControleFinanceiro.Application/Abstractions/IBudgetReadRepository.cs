using ControleFinanceiro.Application.Budgets;
using System;

namespace ControleFinanceiro.Application.Abstractions;

public interface IBudgetReadRepository
{
    Task<List<BudgetDto>> GetByMonthAsync(int year, int month, CancellationToken ct);
}