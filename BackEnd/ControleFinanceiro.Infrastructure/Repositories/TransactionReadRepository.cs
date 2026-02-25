using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Application.Transactions.GetTransactions;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class TransactionReadRepository : ITransactionReadRepository
{
    private readonly AppDbContext _db;

    public TransactionReadRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<TransactionDto>> ListAsync(int? year, int? month, CancellationToken ct)
    {
        var q = _db.Transactions
            .AsNoTracking()
            .Include(t => t.Category)
            .AsQueryable();

        if (year.HasValue && month.HasValue)
        {
            var start = new DateOnly(year.Value, month.Value, 1);
            var end = start.AddMonths(1);

            q = q.Where(t => t.Date >= start && t.Date < end);
        }

        var items = await q
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Type)
            .Select(t => new TransactionDto(
                t.Id,
                t.Type,
                t.Amount,
                t.Date,
                t.CategoryId,
                t.Category != null ? t.Category.Name : null,
                t.Description
            ))
            .ToListAsync(ct);

        return items;
    }
}