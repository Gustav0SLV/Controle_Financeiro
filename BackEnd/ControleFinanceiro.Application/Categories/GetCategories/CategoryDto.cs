using ControleFinanceiro.Domain.Categories;

namespace ControleFinanceiro.Application.Categories.GetCategories;

public sealed record CategoryDto(
    Guid Id,
    string Name,
    CategoryType Type
);