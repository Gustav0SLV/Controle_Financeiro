using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Incomes;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class MonthlyIncomeRepository : IMonthlyIncomeRepository
{
    private readonly AppDbContext _db;
    public MonthlyIncomeRepository(AppDbContext db) => _db = db;

    public Task<MonthlyIncome?> GetAsync(int year, int month, CancellationToken ct)
        => _db.MonthlyIncomes.FirstOrDefaultAsync(x => x.Year == year && x.Month == month, ct);

    public Task AddAsync(MonthlyIncome income, CancellationToken ct)
        => _db.MonthlyIncomes.AddAsync(income, ct).AsTask();
}