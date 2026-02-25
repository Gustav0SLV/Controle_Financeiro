using ControleFinanceiro.Domain.Goals;

namespace ControleFinanceiro.Application.Abstractions;

public interface IMonthlyGoalRepository
{
    Task<MonthlyGoal?> GetAsync(int year, int month, CancellationToken ct);
    Task AddAsync(MonthlyGoal goal, CancellationToken ct);
    Task<Guid?> GetIdAsync(int year, int month, CancellationToken ct);
    Task<MonthlyGoal?> GetWithSavingsAsync(int year, int month, CancellationToken ct);
    Task AddSavingAsync(MonthlyGoalSaving saving, CancellationToken ct);
    Task<MonthlyGoalSaving?> GetSavingByIdAsync(Guid id, CancellationToken ct);
    void RemoveSaving(MonthlyGoalSaving saving);
}