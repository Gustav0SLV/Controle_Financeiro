namespace ControleFinanceiro.Application.Goals.Monthly;

public sealed record MonthlyGoalSavingDto(
    Guid Id,
    decimal Amount,
    string Description,
    DateTime CreatedAtUtc
);

public sealed record MonthlyGoalDto(
    int Year,
    int Month,
    decimal TargetAmount,
    decimal SavedAmount,
    IReadOnlyList<MonthlyGoalSavingDto> Savings
);