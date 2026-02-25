using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Goals;

namespace ControleFinanceiro.Application.Goals.Monthly.AddMonthlySaving;

public sealed class AddMonthlySavingHandler
{
    private readonly IMonthlyGoalRepository _repo;
    private readonly IUnitOfWork _uow;

    public AddMonthlySavingHandler(IMonthlyGoalRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task Handle(AddMonthlySavingCommand c, CancellationToken ct)
    {
        // 1) Pega só o ID (sem tracking)
        var goalId = await _repo.GetIdAsync(c.Year, c.Month, ct);

        // 2) Se não existe, cria o goal e salva (pra garantir Id persistido)
        if (goalId is null || goalId.Value == Guid.Empty)
        {
            var goal = new MonthlyGoal(c.Year, c.Month, 0m);
            await _repo.AddAsync(goal, ct);
            await _uow.SaveChangesAsync(ct);
            goalId = goal.Id;
        }

        // 3) Insere saving direto (sem mexer no MonthlyGoal)
        var saving = new MonthlyGoalSaving(goalId.Value, c.Amount, c.Description);
        await _repo.AddSavingAsync(saving, ct);

        await _uow.SaveChangesAsync(ct);
    }
}