using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Budgets.GetBudgets;

public sealed class GetBudgetsHandler
{
    private readonly IBudgetReadRepository _read;

    public GetBudgetsHandler(IBudgetReadRepository read) => _read = read;

    public Task<List<BudgetDto>> Handle(GetBudgetsQuery q, CancellationToken ct)
        => _read.GetByMonthAsync(q.Year, q.Month, ct);
}