using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Incomes.GetMonthlyIncome;

public sealed class GetMonthlyIncomeHandler
{
    private readonly IMonthlyIncomeRepository _repo;

    public GetMonthlyIncomeHandler(IMonthlyIncomeRepository repo) => _repo = repo;

    public async Task<MonthlyIncomeDto> Handle(GetMonthlyIncomeQuery q, CancellationToken ct)
    {
        var item = await _repo.GetAsync(q.Year, q.Month, ct);
        return new MonthlyIncomeDto(q.Year, q.Month, item?.Amount ?? 0m);
    }
}