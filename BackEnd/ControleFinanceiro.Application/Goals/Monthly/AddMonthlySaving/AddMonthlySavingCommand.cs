namespace ControleFinanceiro.Application.Goals.Monthly.AddMonthlySaving;

public sealed record AddMonthlySavingCommand(
    int Year,
    int Month,
    decimal Amount,
    string Description
);