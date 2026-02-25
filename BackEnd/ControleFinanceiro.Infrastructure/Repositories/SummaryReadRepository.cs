using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Application.Summary.Monthly;
using ControleFinanceiro.Domain.Goals;
using ControleFinanceiro.Domain.Transactions;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class SummaryReadRepository : ISummaryReadRepository
{
    private readonly AppDbContext _db;

    public SummaryReadRepository(AppDbContext db) => _db = db;

    public async Task<MonthlySummaryDto> GetMonthlyAsync(int year, int month, CancellationToken ct)
    {
        if (year < 2000 || year > 2100) throw new InvalidOperationException("Ano inválido.");
        if (month < 1 || month > 12) throw new InvalidOperationException("Mês inválido.");

        var start = new DateOnly(year, month, 1);
        var end = start.AddMonths(1);

        //  Renda fixa (monthly_incomes)
        var income = await _db.MonthlyIncomes
            .AsNoTracking()
            .Where(x => x.Year == year && x.Month == month)
            .Select(x => (decimal?)x.Amount)
            .FirstOrDefaultAsync(ct) ?? 0m;

        //  Despesas do mês (transactions)
        var expense = await _db.Transactions
            .AsNoTracking()
            .Where(t => t.Date >= start && t.Date < end)
            .Where(t => t.Type == TransactionType.Expense)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        //  Investido/Guardado do mês = soma monthly_goal_savings.amount por goalId do mês
        var goalId = await _db.MonthlyGoals
            .AsNoTracking()
            .Where(g => g.Year == year && g.Month == month)
            .Select(g => (Guid?)g.Id)
            .FirstOrDefaultAsync(ct);

        var invested = goalId is null
            ? 0m
            : await _db.Set<MonthlyGoalSaving>()
                .AsNoTracking()
                .Where(s => s.MonthlyGoalId == goalId.Value)
                .SumAsync(s => (decimal?)s.Amount, ct) ?? 0m;

        // Gastos por categoria
        var byCategoryRaw = await (
            from t in _db.Transactions.AsNoTracking()
            join c in _db.Categories.AsNoTracking()
                on t.CategoryId equals c.Id
            where t.Date >= start && t.Date < end
            where t.Type == TransactionType.Expense
            select new { c.Name, t.Amount }
        )
        .GroupBy(x => x.Name)
        .Select(g => new
        {
            Category = g.Key,
            Total = g.Sum(x => x.Amount)
        })
        .OrderByDescending(x => x.Total)
        .ToListAsync(ct);

        var byCategory = byCategoryRaw
            .Select(x => new ExpenseByCategoryDto(x.Category, x.Total))
            .ToList();

        var balance = income - expense - invested;

        return new MonthlySummaryDto(
            Year: year,
            Month: month,
            Income: income,
            Expense: expense,
            Balance: balance,
            ExpensesByCategory: byCategory
        );
    }
}