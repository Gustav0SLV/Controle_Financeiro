using ControleFinanceiro.Domain.Transactions;

namespace ControleFinanceiro.Application.Transactions.UpdateTransaction;

public sealed record UpdateTransactionCommand(
    Guid Id,
    TransactionType Type,
    decimal Amount,
    DateOnly Date,
    Guid? CategoryId,
    string? Description
);