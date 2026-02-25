using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Budgets;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class BudgetRepository : IBudgetRepository
{
    private readonly AppDbContext _db;

    public BudgetRepository(AppDbContext db) => _db = db;

    public Task<Budget?> GetAsync(int year, int month, Guid categoryId, CancellationToken ct)
        => _db.Budgets.FirstOrDefaultAsync(b =>
            b.Year == year &&
            b.Month == month &&
            b.CategoryId == categoryId, ct);

    public Task AddAsync(Budget budget, CancellationToken ct)
        => _db.Budgets.AddAsync(budget, ct).AsTask();
}