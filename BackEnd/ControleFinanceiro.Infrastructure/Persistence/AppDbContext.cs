using Microsoft.EntityFrameworkCore;
using ControleFinanceiro.Domain.Categories;
using ControleFinanceiro.Domain.Transactions;
using ControleFinanceiro.Domain.Incomes;
using ControleFinanceiro.Domain.Budgets;
using ControleFinanceiro.Domain.Goals;

namespace ControleFinanceiro.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<MonthlyIncome> MonthlyIncomes => Set<MonthlyIncome>();
    public DbSet<MonthlyGoal> MonthlyGoals => Set<MonthlyGoal>();
    public DbSet<MonthlyGoalSaving> MonthlyGoalSavings { get; set; }
    public DbSet<Budget> Budgets => Set<Budget>();
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}