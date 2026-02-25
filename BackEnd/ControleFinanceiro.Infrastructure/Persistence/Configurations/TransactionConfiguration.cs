using ControleFinanceiro.Domain.Transactions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleFinanceiro.Infrastructure.Persistence.Configurations;

public sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> b)
    {
        b.ToTable("transactions");
        b.HasKey(x => x.Id);

        b.Property(x => x.Type).IsRequired();

        b.Property(x => x.Amount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        b.Property(x => x.Date)
            .HasConversion(
                d => d.ToDateTime(TimeOnly.MinValue),
                dt => DateOnly.FromDateTime(dt))
            .HasColumnType("date")
            .IsRequired();

        b.Property(x => x.Description)
            .HasMaxLength(200);

        b.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_transactions_categories_categoryId");

        b.HasIndex(x => x.Date);
        b.HasIndex(x => x.CategoryId);

        // Opcional, mas bom para relatórios/overview
        b.HasIndex(x => new { x.Date, x.Type });
        b.HasIndex(x => new { x.CategoryId, x.Date });
    }
}