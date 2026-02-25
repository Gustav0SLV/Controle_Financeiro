using ControleFinanceiro.Application.Summary.Monthly;

namespace ControleFinanceiro.Application.Abstractions;

public interface ISummaryReadRepository
{
    Task<MonthlySummaryDto> GetMonthlyAsync(int year, int month, CancellationToken ct);
}