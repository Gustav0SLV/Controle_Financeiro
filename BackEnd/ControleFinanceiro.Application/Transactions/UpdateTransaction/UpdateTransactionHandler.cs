using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Transactions;

namespace ControleFinanceiro.Application.Transactions.UpdateTransaction;

public sealed class UpdateTransactionHandler
{
    private readonly ITransactionRepository _txRepo;
    private readonly ICategoryRepository _catRepo;
    private readonly IUnitOfWork _uow;

    public UpdateTransactionHandler(
        ITransactionRepository txRepo,
        ICategoryRepository catRepo,
        IUnitOfWork uow)
    {
        _txRepo = txRepo;
        _catRepo = catRepo;
        _uow = uow;
    }

    public async Task Handle(UpdateTransactionCommand cmd, CancellationToken ct)
    {
        var tx = await _txRepo.GetByIdAsync(cmd.Id, ct);
        if (tx is null)
            throw new KeyNotFoundException("Lançamento não encontrado.");

        // Regras do produto (MVP)
        if (cmd.Type == TransactionType.Expense && cmd.CategoryId is null)
            throw new InvalidOperationException("Despesa exige categoria.");

        if (cmd.CategoryId.HasValue)
        {
            var exists = await _catRepo.ExistsByIdAsync(cmd.CategoryId.Value, ct);
            if (!exists)
                throw new InvalidOperationException("Categoria inválida.");
        }

        // Atualiza TUDO
        tx.Update(cmd.Type, cmd.Amount, cmd.Date, cmd.CategoryId, cmd.Description);

        await _uow.SaveChangesAsync(ct);
    }
}