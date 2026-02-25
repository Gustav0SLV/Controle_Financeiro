using ControleFinanceiro.Domain.Transactions;

namespace ControleFinanceiro.Application.Transactions.GetTransactions;

public sealed record TransactionDto(
    Guid Id,
    TransactionType Type,
    decimal Amount,
    DateOnly Date,
    Guid? CategoryId,
    string? CategoryName,
    string? Description
);