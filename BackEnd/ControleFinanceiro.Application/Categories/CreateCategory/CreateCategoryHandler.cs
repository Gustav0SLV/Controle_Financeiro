using ControleFinanceiro.Application.Abstractions;
using ControleFinanceiro.Domain.Categories;

namespace ControleFinanceiro.Application.Categories.CreateCategory;

public sealed class CreateCategoryHandler
{
    private readonly ICategoryRepository _repo;
    private readonly IUnitOfWork _uow;

    public CreateCategoryHandler(ICategoryRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<Guid> Handle(CreateCategoryCommand cmd, CancellationToken ct)
    {
        var name = (cmd.Name ?? "").Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Nome é obrigatório.");

        if (name.Length > 80)
            throw new InvalidOperationException("Nome muito longo (máx 80).");

        // Evita duplicidade por Tipo (mesma categoria 'Mercado' em despesa)
        var exists = await _repo.ExistsAsync(name, cmd.Type, ct);
        if (exists)
            throw new InvalidOperationException("Já existe uma categoria com esse nome e tipo.");

        var category = new Category(name, cmd.Type);

        await _repo.AddAsync(category, ct);
        await _uow.SaveChangesAsync(ct);

        return category.Id;
    }
}