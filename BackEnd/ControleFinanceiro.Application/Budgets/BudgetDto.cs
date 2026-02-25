namespace ControleFinanceiro.Application.Budgets;

public sealed record BudgetDto(
    Guid CategoryId,
    string CategoryName,
    decimal Amount
);