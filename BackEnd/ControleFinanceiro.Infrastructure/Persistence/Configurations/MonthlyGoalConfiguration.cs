using ControleFinanceiro.Domain.Goals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleFinanceiro.Infrastructure.Persistence.Configurations;

public sealed class MonthlyGoalConfiguration : IEntityTypeConfiguration<MonthlyGoal>
{
    public void Configure(EntityTypeBuilder<MonthlyGoal> b)
    {
        b.ToTable("monthly_goals");
        b.HasKey(x => x.Id);

        b.Property(x => x.Year).HasColumnName("year").IsRequired();
        b.Property(x => x.Month).HasColumnName("month").IsRequired();

        b.Property(x => x.TargetAmount)
            .HasColumnName("target_amount")
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        b.HasIndex(x => new { x.Year, x.Month }).IsUnique();

        // relacionamento
        b.HasMany(x => x.Savings)
            .WithOne()
            .HasForeignKey(x => x.MonthlyGoalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}