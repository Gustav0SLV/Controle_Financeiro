using ControleFinanceiro.Domain.Categories;

namespace ControleFinanceiro.Domain.Budgets;

public sealed class Budget
{
    public Guid Id { get; private set; }
    public int Year { get; private set; }
    public int Month { get; private set; }

    public Guid CategoryId { get; private set; }
    public Category Category { get; private set; } = null!;

    public decimal Amount { get; private set; }

    private Budget() { }

    public Budget(int year, int month, Guid categoryId, decimal amount)
    {
        if (year < 2000 || year > 2100) throw new ArgumentException("Ano inválido");
        if (month < 1 || month > 12) throw new ArgumentException("Mês inválido");
        if (amount < 0) throw new ArgumentException("Valor inválido");

        Id = Guid.NewGuid();
        Year = year;
        Month = month;
        CategoryId = categoryId;
        Amount = amount;
    }

    public void UpdateAmount(decimal amount)
    {
        if (amount < 0) throw new ArgumentException("Valor inválido");
        Amount = amount;
    }
}