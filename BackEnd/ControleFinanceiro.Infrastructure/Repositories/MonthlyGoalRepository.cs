using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Goals;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class MonthlyGoalRepository : IMonthlyGoalRepository
{
    private readonly AppDbContext _db;
    public MonthlyGoalRepository(AppDbContext db) => _db = db;

    public Task<MonthlyGoal?> GetAsync(int year, int month, CancellationToken ct)
        => _db.MonthlyGoals.FirstOrDefaultAsync(x => x.Year == year && x.Month == month, ct);

    public Task AddAsync(MonthlyGoal goal, CancellationToken ct)
        => _db.MonthlyGoals.AddAsync(goal, ct).AsTask();

    public async Task<MonthlyGoal?> GetWithSavingsAsync(int year, int month, CancellationToken ct)
    {
        return await _db.MonthlyGoals
            .Include(x => x.Savings)
            .FirstOrDefaultAsync(x => x.Year == year && x.Month == month, ct);
    }

    public Task AddSavingAsync(MonthlyGoalSaving saving, CancellationToken ct)
    {
        _db.Entry(saving).State = EntityState.Added; // força INSERT
        return Task.CompletedTask;
    }

    public async Task<Guid?> GetIdAsync(int year, int month, CancellationToken ct)
    {
        return await _db.MonthlyGoals
            .Where(x => x.Year == year && x.Month == month)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<MonthlyGoalSaving?> GetSavingByIdAsync(Guid id, CancellationToken ct)
    {
        return await _db.Set<MonthlyGoalSaving>()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public void RemoveSaving(MonthlyGoalSaving saving)
    {
        _db.Set<MonthlyGoalSaving>().Remove(saving);
    }
}