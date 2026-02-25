using ControleFinanceiro.Domain.Categories;

namespace ControleFinanceiro.Domain.Transactions;

public sealed class Transaction
{
    public Guid Id { get; private set; }
    public TransactionType Type { get; private set; }
    public decimal Amount { get; private set; }
    public DateOnly Date { get; private set; }
    public Guid? CategoryId { get; private set; }
    public Category? Category { get; private set; }
    public string? Description { get; private set; }

    private Transaction() { } // EF

    public Transaction(
        TransactionType type,
        decimal amount,
        DateOnly date,
        Guid? categoryId,
        string? description)
    {
        Update(type, amount, date, categoryId, description);
    }

 public void Update(
    TransactionType type,
    decimal amount,
    DateOnly date,
    Guid? categoryId,
    string? description)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount deve ser maior que zero.");

        Type = type;
        Amount = decimal.Round(amount, 2);
        Date = date;
        CategoryId = categoryId;
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }
}