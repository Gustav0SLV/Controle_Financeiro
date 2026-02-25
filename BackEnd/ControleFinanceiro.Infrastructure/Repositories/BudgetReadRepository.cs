using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Application.Budgets;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class BudgetReadRepository : IBudgetReadRepository
{
    private readonly AppDbContext _db;

    public BudgetReadRepository(AppDbContext db) => _db = db;

    public async Task<List<BudgetDto>> GetByMonthAsync(int year, int month, CancellationToken ct)
    {
        return await _db.Budgets
            .AsNoTracking()
            .Include(b => b.Category)
            .Where(b => b.Year == year && b.Month == month)
            .Select(b => new BudgetDto(
                b.CategoryId,
                b.Category.Name,
                b.Amount
            ))
            .ToListAsync(ct);
    }
}