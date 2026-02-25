using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Application.Categories.CreateCategory;
using ControleFinanceiro.Application.Transactions.UpdateTransaction;
using ControleFinanceiro.Infrastructure;
using ControleFinanceiro.Infrastructure.Persistence;
using ControleFinanceiro.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using ControleFinanceiro.Application.Transactions.CreateTransaction;
using ControleFinanceiro.Application.Transactions.DeleteTransaction;
using ControleFinanceiro.Application.Transactions.GetTransactions;
using ControleFinanceiro.Application.Categories.DeleteCategory;
using ControleFinanceiro.Application.Categories.GetCategories;
using ControleFinanceiro.Application.Summary.Monthly;
using ControleFinanceiro.Application.Incomes.GetMonthlyIncome;
using ControleFinanceiro.Application.Incomes.UpsertMonthlyIncome;
using ControleFinanceiro.Application.Budgets.GetBudgets;
using ControleFinanceiro.Application.Budgets.UpsertBudget;
using ControleFinanceiro.Application.Goals.Monthly.GetMonthlyGoal;
using ControleFinanceiro.Application.Goals.Monthly.UpsertMonthlyGoal;
using ControleFinanceiro.Application.Goals.Monthly.AddMonthlySaving;
using ControleFinanceiro.Application.Goals.Monthly.UpdateMonthlySaving;
using ControleFinanceiro.Application.Goals.Monthly.DeleteMonthlySaving;




var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS para o React (dev)
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default"));
});

// DI - Infra
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<ITransactionReadRepository, TransactionReadRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryReadRepository, CategoryReadRepository>();
builder.Services.AddScoped<ISummaryReadRepository, SummaryReadRepository>();
builder.Services.AddScoped<IMonthlyIncomeRepository, MonthlyIncomeRepository>();
builder.Services.AddScoped<IBudgetReadRepository, BudgetReadRepository>();
builder.Services.AddScoped<IBudgetRepository, BudgetRepository>();
builder.Services.AddScoped<IMonthlyGoalRepository, MonthlyGoalRepository>();

// DI - Application
builder.Services.AddScoped<CreateCategoryHandler>();
builder.Services.AddScoped<GetTransactionsHandler>();
builder.Services.AddScoped<CreateTransactionHandler>();
builder.Services.AddScoped<UpdateTransactionHandler>();
builder.Services.AddScoped<DeleteTransactionHandler>();
builder.Services.AddScoped<GetCategoriesHandler>();
builder.Services.AddScoped<CreateCategoryHandler>();
builder.Services.AddScoped<DeleteCategoryHandler>();
builder.Services.AddScoped<GetMonthlySummaryHandler>();
builder.Services.AddScoped<GetMonthlyIncomeHandler>();
builder.Services.AddScoped<UpsertMonthlyIncomeHandler>();
builder.Services.AddScoped<GetBudgetsHandler>();
builder.Services.AddScoped<UpsertBudgetHandler>();
builder.Services.AddScoped<GetMonthlyGoalHandler>();
builder.Services.AddScoped<UpsertMonthlyGoalHandler>();
builder.Services.AddScoped<AddMonthlySavingHandler>();
builder.Services.AddScoped<UpdateMonthlySavingHandler>();
builder.Services.AddScoped<DeleteMonthlySavingHandler>();

var app = builder.Build();

// Developer exception page 
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.UseCors("DevCors");

app.MapControllers();

// Endpoint simples pra testar integração
app.MapGet("/api/health", () => Results.Ok(new
{
    app = "ControleFinanceiro.Api",
    status = "ok",
    utc = DateTime.UtcNow
}))
.WithName("Health")
.WithOpenApi();

app.Run();