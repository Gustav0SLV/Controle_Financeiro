namespace ControleFinanceiro.Application.Goals.Monthly.UpdateMonthlySaving;

public sealed record UpdateMonthlySavingCommand(
    Guid Id,
    decimal Amount,
    string Description
);