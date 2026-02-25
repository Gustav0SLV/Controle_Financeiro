using ControleFinanceiro.Domain.Categories;

namespace ControleFinanceiro.Application.Categories.CreateCategory;

public sealed record CreateCategoryCommand(
    string Name,
    CategoryType Type
);