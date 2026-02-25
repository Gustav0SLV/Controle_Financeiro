using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Goals.Monthly.DeleteMonthlySaving;

public sealed class DeleteMonthlySavingHandler
{
    private readonly IMonthlyGoalRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteMonthlySavingHandler(IMonthlyGoalRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task Handle(Guid id, CancellationToken ct)
    {
        var saving = await _repo.GetSavingByIdAsync(id, ct);
        if (saving is null) return;

        _repo.RemoveSaving(saving);
        await _uow.SaveChangesAsync(ct);
    }
}