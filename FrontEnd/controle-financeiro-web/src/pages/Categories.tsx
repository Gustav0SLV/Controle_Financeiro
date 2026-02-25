import { useEffect, useMemo, useState } from "react";
import { createCategory, deleteCategory, getCategories } from "../lib/api";
import type { Category } from "../lib/api";

export default function Categories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form
  const [type, setType] = useState<1 | 2>(2);
  const [name, setName] = useState("");

  const grouped = useMemo(() => {
    const income = items.filter((c) => c.type === 1).sort((a, b) => a.name.localeCompare(b.name));
    const expense = items.filter((c) => c.type === 2).sort((a, b) => a.name.localeCompare(b.name));
    return { income, expense };
  }, [items]);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await getCategories();
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError("");
        setLoading(true);
        const data = await getCategories();
        if (!cancelled) setItems(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar categorias");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nome é obrigatório.");
      return;
    }

    setError("");

    await createCategory({ name: trimmed, type });

    setName("");
    await load();
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Excluir categoria "${label}"?`)) return;

    setError("");
    try {
      await deleteCategory(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao excluir categoria");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Categorias</h1>

      <form
        onSubmit={submit}
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 140px", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Tipo</label>
            <select value={type} onChange={(e) => setType(Number(e.target.value) as 1 | 2)} style={{ padding: 10, width: "100%" }}>
              <option value={1}>Receita</option>
              <option value={2}>Despesa</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 10, width: "100%" }} placeholder="Ex: Mercado" />
          </div>

          <button type="submit" style={{ padding: "10px 14px", cursor: "pointer" }}>
            Adicionar
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #ffb3b3", background: "#ffecec", borderRadius: 8 }}>
            ❌ {error}
          </div>
        )}
      </form>

      {loading && <div>Carregando...</div>}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <CategoryList
            title="Receitas"
            items={grouped.income}
            onDelete={remove}
          />
          <CategoryList
            title="Despesas"
            items={grouped.expense}
            onDelete={remove}
          />
        </div>
      )}
    </div>
  );
}

function CategoryList({
  title,
  items,
  onDelete,
}: {
  title: string;
  items: Category[];
  onDelete: (id: string, label: string) => void;
}) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: 12, fontWeight: "bold", borderBottom: "1px solid #eee" }}>{title}</div>

      {items.length === 0 ? (
        <div style={{ padding: 12 }}>Nenhuma categoria.</div>
      ) : (
        items.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              borderTop: "1px solid #eee",
            }}
          >
            <div>{c.name}</div>
            <button onClick={() => onDelete(c.id, c.name)}>Excluir</button>
          </div>
        ))
      )}
    </div>
  );
}