using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Goals.Monthly.UpdateMonthlySaving;

public sealed class UpdateMonthlySavingHandler
{
    private readonly IMonthlyGoalRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateMonthlySavingHandler(IMonthlyGoalRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task Handle(UpdateMonthlySavingCommand c, CancellationToken ct)
    {
        var saving = await _repo.GetSavingByIdAsync(c.Id, ct);
        if (saving is null) return; // ou lançar NotFound se preferir

        saving.Update(c.Amount, c.Description);

        await _uow.SaveChangesAsync(ct);
    }
}