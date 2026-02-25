using ControleFinanceiro.Application.Abstractions;

namespace ControleFinanceiro.Application.Categories.DeleteCategory;

public sealed class DeleteCategoryHandler
{
    private readonly ICategoryRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteCategoryHandler(ICategoryRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task Handle(DeleteCategoryCommand cmd, CancellationToken ct)
    {
        var category = await _repo.GetByIdAsync(cmd.Id, ct);
        if (category is null)
            throw new KeyNotFoundException("Categoria não encontrada.");

        await _repo.RemoveAsync(category, ct);
        await _uow.SaveChangesAsync(ct);
    }
}