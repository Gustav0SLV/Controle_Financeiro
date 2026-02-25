namespace ControleFinanceiro.Domain.Goals;

public sealed class MonthlyGoalSaving
{
    public Guid Id { get; private set; }
    public Guid MonthlyGoalId { get; private set; }

    public decimal Amount { get; private set; }
    public string Description { get; private set; } = string.Empty;

    public DateTime CreatedAtUtc { get; private set; }

    private MonthlyGoalSaving() { }

    public MonthlyGoalSaving(Guid monthlyGoalId, decimal amount, string description)
    {
        if (monthlyGoalId == Guid.Empty) throw new ArgumentException("Id inválido.");
        if (amount <= 0) throw new ArgumentException("Valor inválido (use um número > 0).");
        if (description is null) throw new ArgumentException("Descrição inválida.");
        description = description.Trim();
        if (description.Length == 0) throw new ArgumentException("Descrição é obrigatória.");
        if (description.Length > 200) throw new ArgumentException("Descrição muito longa (máx 200).");

        Id = Guid.NewGuid();
        MonthlyGoalId = monthlyGoalId;
        Amount = amount;
        Description = description;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void Update(decimal amount, string description)
    {
        if (amount <= 0) throw new ArgumentException("Valor inválido (use um número > 0).");

        description = (description ?? "").Trim();
        if (description.Length == 0) throw new ArgumentException("Descrição é obrigatória.");
        if (description.Length > 200) throw new ArgumentException("Descrição muito longa (máx 200).");

        Amount = amount;
        Description = description;
    }
}