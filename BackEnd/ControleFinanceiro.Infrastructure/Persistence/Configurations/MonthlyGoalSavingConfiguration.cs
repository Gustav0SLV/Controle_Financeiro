using ControleFinanceiro.Domain.Goals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleFinanceiro.Infrastructure.Persistence.Configurations;

public sealed class MonthlyGoalSavingConfiguration : IEntityTypeConfiguration<MonthlyGoalSaving>
{
    public void Configure(EntityTypeBuilder<MonthlyGoalSaving> b)
    {
        b.ToTable("monthly_goal_savings");
        b.HasKey(x => x.Id);

        b.Property(x => x.Id)
           .HasColumnName("id")
           .ValueGeneratedNever();

        b.Property(x => x.MonthlyGoalId)
            .HasColumnName("monthly_goal_id")
            .IsRequired();

        b.Property(x => x.Amount)
            .HasColumnName("amount")
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        b.Property(x => x.Description)
            .HasColumnName("description")
            .HasColumnType("varchar(200)")
            .IsRequired();

        b.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        b.HasIndex(x => x.MonthlyGoalId);


    }
}

