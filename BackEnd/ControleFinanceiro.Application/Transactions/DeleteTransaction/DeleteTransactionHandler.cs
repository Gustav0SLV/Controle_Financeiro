using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Transactions.DeleteTransaction;

public sealed class DeleteTransactionHandler
{
    private readonly ITransactionRepository _txRepo;
    private readonly IUnitOfWork _uow;

    public DeleteTransactionHandler(ITransactionRepository txRepo, IUnitOfWork uow)
    {
        _txRepo = txRepo;
        _uow = uow;
    }

    public async Task Handle(DeleteTransactionCommand cmd, CancellationToken ct)
    {
        var tx = await _txRepo.GetByIdAsync(cmd.Id, ct);
        if (tx is null)
            throw new KeyNotFoundException("Lançamento não encontrado.");

        await _txRepo.RemoveAsync(tx, ct);
        await _uow.SaveChangesAsync(ct);
    }
}