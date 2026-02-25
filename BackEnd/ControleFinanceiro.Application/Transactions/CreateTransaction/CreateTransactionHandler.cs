using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Transactions;

namespace ControleFinanceiro.Application.Transactions.CreateTransaction;

public sealed class CreateTransactionHandler
{
    private readonly ITransactionRepository _txRepo;
    private readonly ICategoryRepository _catRepo;
    private readonly IUnitOfWork _uow;

    public CreateTransactionHandler(
        ITransactionRepository txRepo,
        ICategoryRepository catRepo,
        IUnitOfWork uow)
    {
        _txRepo = txRepo;
        _catRepo = catRepo;
        _uow = uow;
    }

    public async Task<Guid> Handle(CreateTransactionCommand cmd, CancellationToken ct)
    {
        if (cmd.Type == TransactionType.Expense && cmd.CategoryId is null)
            throw new InvalidOperationException("Despesa exige categoria.");

        if (cmd.CategoryId.HasValue)
        {
            var exists = await _catRepo.ExistsByIdAsync(cmd.CategoryId.Value, ct);
            if (!exists) throw new InvalidOperationException("Categoria inválida.");
        }

        var tx = new Transaction(cmd.Type, cmd.Amount, cmd.Date, cmd.CategoryId, cmd.Description);

        await _txRepo.AddAsync(tx, ct);
        await _uow.SaveChangesAsync(ct);

        return tx.Id;
    }
}