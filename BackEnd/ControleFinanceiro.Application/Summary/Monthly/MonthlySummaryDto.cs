namespace ControleFinanceiro.Application.Summary.Monthly;

public sealed record MonthlySummaryDto(
    int Year,
    int Month,
    decimal Income,
    decimal Expense,
    decimal Balance,
    IReadOnlyList<ExpenseByCategoryDto> ExpensesByCategory
);

public sealed record ExpenseByCategoryDto(
    string Category,
    decimal Total
);