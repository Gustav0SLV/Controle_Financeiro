using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Transactions;
using ControleFinanceiro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Infrastructure.Repositories;

public sealed class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _db;

    public TransactionRepository(AppDbContext db) => _db = db;

    public Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.Transactions.FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task AddAsync(Transaction transaction, CancellationToken ct)
        => _db.Transactions.AddAsync(transaction, ct).AsTask();

    public Task RemoveAsync(Transaction transaction, CancellationToken ct)
    {
        _db.Transactions.Remove(transaction);
        return Task.CompletedTask;
    }
}