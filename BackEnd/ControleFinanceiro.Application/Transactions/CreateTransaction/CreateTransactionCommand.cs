using ControleFinanceiro.Domain.Transactions;

namespace ControleFinanceiro.Application.Transactions.CreateTransaction;

public sealed record CreateTransactionCommand(
    TransactionType Type,
    decimal Amount,
    DateOnly Date,
    Guid? CategoryId,
    string? Description
);