using ControleFinanceiro.Domain.Incomes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleFinanceiro.Infrastructure.Persistence.Configurations;

public sealed class MonthlyIncomeConfiguration : IEntityTypeConfiguration<MonthlyIncome>
{
    public void Configure(EntityTypeBuilder<MonthlyIncome> b)
    {
        b.ToTable("monthly_incomes");
        b.HasKey(x => x.Id);

        b.Property(x => x.Year).IsRequired();
        b.Property(x => x.Month).IsRequired();
        b.Property(x => x.Amount).HasColumnType("decimal(18,2)").IsRequired();

        // Um registro por mês/ano
        b.HasIndex(x => new { x.Year, x.Month }).IsUnique();
    }
}