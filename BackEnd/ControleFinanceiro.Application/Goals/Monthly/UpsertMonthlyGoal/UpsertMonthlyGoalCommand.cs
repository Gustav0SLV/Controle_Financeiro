namespace ControleFinanceiro.Application.Goals.Monthly.UpsertMonthlyGoal;

public sealed record UpsertMonthlyGoalCommand(
    int Year,
    int Month,
    decimal TargetAmount
);