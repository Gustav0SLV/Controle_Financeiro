using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Application.Goals.Monthly;

namespace ControleFinanceiro.Application.Goals.Monthly.GetMonthlyGoal;

public sealed class GetMonthlyGoalHandler
{
    private readonly IMonthlyGoalRepository _repo;

    public GetMonthlyGoalHandler(IMonthlyGoalRepository repo) => _repo = repo;

    public async Task<MonthlyGoalDto> Handle(int year, int month, CancellationToken ct)
    {
        var goal = await _repo.GetWithSavingsAsync(year, month, ct);

        if (goal is null)
        {
            return new MonthlyGoalDto(year, month, 0m, 0m, Array.Empty<MonthlyGoalSavingDto>());
        }

        var savings = goal.Savings
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new MonthlyGoalSavingDto(x.Id, x.Amount, x.Description, x.CreatedAtUtc))
            .ToList();

        return new MonthlyGoalDto(
            year,
            month,
            goal.TargetAmount,
            goal.TotalSavedAmount(),
            savings
        );
    }
}