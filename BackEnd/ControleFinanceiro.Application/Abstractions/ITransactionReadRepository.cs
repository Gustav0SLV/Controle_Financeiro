using ControleFinanceiro.Application.Transactions.GetTransactions;

namespace ControleFinanceiro.Application.Abstractions;

public interface ITransactionReadRepository
{
    Task<IReadOnlyList<TransactionDto>> ListAsync(int? year, int? month, CancellationToken ct);
}