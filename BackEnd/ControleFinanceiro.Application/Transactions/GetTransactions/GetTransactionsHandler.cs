using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Transactions.GetTransactions;

public sealed class GetTransactionsHandler
{
    private readonly ITransactionReadRepository _readRepo;

    public GetTransactionsHandler(ITransactionReadRepository readRepo)
        => _readRepo = readRepo;

    public Task<IReadOnlyList<TransactionDto>> Handle(GetTransactionsQuery query, CancellationToken ct)
        => _readRepo.ListAsync(query.Year, query.Month, ct);
}