namespace ControleFinanceiro.Application.Budgets.UpsertBudget;

public sealed record UpsertBudgetCommand(
    int Year,
    int Month,
    Guid CategoryId,
    decimal Amount
);