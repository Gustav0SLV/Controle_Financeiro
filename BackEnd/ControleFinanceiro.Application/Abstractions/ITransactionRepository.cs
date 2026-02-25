using ControleFinanceiro.Domain.Transactions;

namespace ControleFinanceiro.Application.Abstractions;

public interface ITransactionRepository
{
    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(Transaction transaction, CancellationToken ct);
    Task RemoveAsync(Transaction transaction, CancellationToken ct);
}