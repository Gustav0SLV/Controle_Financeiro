using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Summary.Monthly;

public sealed class GetMonthlySummaryHandler
{
    private readonly ISummaryReadRepository _readRepo;

    public GetMonthlySummaryHandler(ISummaryReadRepository readRepo)
        => _readRepo = readRepo;

    public Task<MonthlySummaryDto> Handle(GetMonthlySummaryQuery query, CancellationToken ct)
        => _readRepo.GetMonthlyAsync(query.Year, query.Month, ct);
}