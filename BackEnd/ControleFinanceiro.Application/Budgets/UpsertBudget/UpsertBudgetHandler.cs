using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Budgets;

namespace ControleFinanceiro.Application.Budgets.UpsertBudget;

public sealed class UpsertBudgetHandler
{
    private readonly IBudgetRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpsertBudgetHandler(IBudgetRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task Handle(UpsertBudgetCommand c, CancellationToken ct)
    {
        var budget = await _repo.GetAsync(c.Year, c.Month, c.CategoryId, ct);

        if (budget is null)
        {
            budget = new Budget(c.Year, c.Month, c.CategoryId, c.Amount);
            await _repo.AddAsync(budget, ct);
        }
        else
        {
            budget.UpdateAmount(c.Amount);
        }

        await _uow.SaveChangesAsync(ct);
    }
}