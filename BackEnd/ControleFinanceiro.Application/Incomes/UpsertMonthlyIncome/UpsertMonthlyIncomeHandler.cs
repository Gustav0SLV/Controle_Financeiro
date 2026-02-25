using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Incomes;

namespace ControleFinanceiro.Application.Incomes.UpsertMonthlyIncome;

public sealed class UpsertMonthlyIncomeHandler
{
    private readonly IMonthlyIncomeRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpsertMonthlyIncomeHandler(IMonthlyIncomeRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task Handle(UpsertMonthlyIncomeCommand cmd, CancellationToken ct)
    {
        var existing = await _repo.GetAsync(cmd.Year, cmd.Month, ct);

        if (existing is null)
        {
            var income = new MonthlyIncome(cmd.Year, cmd.Month, cmd.Amount);
            await _repo.AddAsync(income, ct);
        }
        else
        {
            existing.Set(cmd.Year, cmd.Month, cmd.Amount);
        }

        await _uow.SaveChangesAsync(ct);
    }
}