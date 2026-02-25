namespace ControleFinanceiro.Domain.Categories;

public sealed class Category
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public string Name { get; private set; } = string.Empty;
    public CategoryType Type { get; private set; }

    private Category() { } // EF

    public Category(string name, CategoryType type)
    {
        Rename(name);
        Type = type;
    }

    public void Rename(string name)
    {
        name = (name ?? "").Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome da categoria é obrigatório.", nameof(name));

        if (name.Length > 60)
            throw new ArgumentException("Nome da categoria deve ter no máximo 60 caracteres.", nameof(name));

        Name = name;
    }
}