namespace ControleFinanceiro.Domain.Incomes;

public sealed class MonthlyIncome
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public int Year { get; private set; }
    public int Month { get; private set; }
    public decimal Amount { get; private set; }

    private MonthlyIncome() { } // EF

    public MonthlyIncome(int year, int month, decimal amount)
    {
        Set(year, month, amount);
    }

    public void Set(int year, int month, decimal amount)
    {
        if (year < 2000 || year > 2100) throw new ArgumentException("Ano inválido.");
        if (month < 1 || month > 12) throw new ArgumentException("Mês inválido.");
        if (amount < 0) throw new ArgumentException("Valor não pode ser negativo.");

        Year = year;
        Month = month;
        Amount = decimal.Round(amount, 2);
    }
}