namespace ControleFinanceiro.Application.Incomes.UpsertMonthlyIncome;

public sealed record UpsertMonthlyIncomeCommand(int Year, int Month, decimal Amount);