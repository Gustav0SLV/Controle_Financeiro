using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Goals;

namespace ControleFinanceiro.Application.Goals.Monthly.UpsertMonthlyGoal;

public sealed class UpsertMonthlyGoalHandler
{
    private readonly IMonthlyGoalRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpsertMonthlyGoalHandler(IMonthlyGoalRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task Handle(UpsertMonthlyGoalCommand c, CancellationToken ct)
    {
        var goal = await _repo.GetAsync(c.Year, c.Month, ct);

        if (goal is null)
        {
            goal = new MonthlyGoal(c.Year, c.Month, c.TargetAmount);
            await _repo.AddAsync(goal, ct);
        }
        else
        {
            goal.UpdateTarget(c.TargetAmount);
        }

        await _uow.SaveChangesAsync(ct);
    }
}