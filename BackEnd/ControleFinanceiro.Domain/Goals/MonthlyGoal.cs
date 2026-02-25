namespace ControleFinanceiro.Domain.Goals;

public sealed class MonthlyGoal
{
    public Guid Id { get; private set; }
    public int Year { get; private set; }
    public int Month { get; private set; }

    public decimal TargetAmount { get; private set; } // meta

    // navegação (EF)
    private readonly List<MonthlyGoalSaving> _savings = new();
    public IReadOnlyCollection<MonthlyGoalSaving> Savings => _savings;

    private MonthlyGoal() { }

    public MonthlyGoal(int year, int month, decimal targetAmount)
    {
        if (year < 2000 || year > 2100) throw new ArgumentException("Ano inválido.");
        if (month < 1 || month > 12) throw new ArgumentException("Mês inválido.");
        if (targetAmount < 0) throw new ArgumentException("Valor inválido.");

        Id = Guid.NewGuid();
        Year = year;
        Month = month;
        TargetAmount = targetAmount;
    }

    public void UpdateTarget(decimal targetAmount)
    {
        if (targetAmount < 0) throw new ArgumentException("Valor inválido.");
        TargetAmount = targetAmount;
    }

    public MonthlyGoalSaving AddSaving(decimal amount, string description)
    {
        var saving = new MonthlyGoalSaving(Id, amount, description);
        _savings.Add(saving);
        return saving;
    }

    public void RemoveSaving(Guid savingId)
    {
        var x = _savings.FirstOrDefault(s => s.Id == savingId);
        if (x is null) return;
        _savings.Remove(x);
    }

    public decimal TotalSavedAmount() => _savings.Sum(x => x.Amount);
}