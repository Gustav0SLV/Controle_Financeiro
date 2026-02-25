using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Categories.GetCategories;

public sealed class GetCategoriesHandler
{
    private readonly ICategoryReadRepository _readRepo;

    public GetCategoriesHandler(ICategoryReadRepository readRepo)
        => _readRepo = readRepo;

    public Task<IReadOnlyList<CategoryDto>> Handle(GetCategoriesQuery query, CancellationToken ct)
        => _readRepo.ListAsync(ct);
}