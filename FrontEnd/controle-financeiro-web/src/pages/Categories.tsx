import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createCategory, deleteCategory, getCategories } from "../lib/api";
import type { Category } from "../lib/api";
import { EmptyState, ErrorAlert, LoadingState, SuccessAlert } from "../components/ui/Feedback";
import { PageHeader } from "../components/ui/PageHeader";

const API_BASE = "http://localhost:5284";
const COLOR_PALETTE = ["#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", "#ea580c", "#0f766e", "#d946ef"];
const CATEGORY_COLORS_STORAGE_KEY = "cfx.categoryColors";

async function updateCategoryById(id: string, data: { name: string; type: 1 | 2 }) {
  const response = await fetch(`${API_BASE}/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Erro ao editar categoria.");
  }
}

function fallbackColor(name: string) {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

function readStoredCategoryColors(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CATEGORY_COLORS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredCategoryColors(colors: Record<string, string>) {
  localStorage.setItem(CATEGORY_COLORS_STORAGE_KEY, JSON.stringify(colors));
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<1 | 2>(2);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [search, setSearch] = useState("");
  const [colorByCategoryId, setColorByCategoryId] = useState<Record<string, string>>(() => readStoredCategoryColors());

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCategories();
      setItems(data);
      setColorByCategoryId((current) => {
        const next = { ...readStoredCategoryColors(), ...current };
        for (const item of data) {
          next[item.id] = next[item.id] ?? fallbackColor(item.name);
        }
        saveStoredCategoryColors(next);
        return next;
      });
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => (query ? item.name.toLowerCase().includes(query) : true))
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [items, search]);

  const startCreate = useCallback(() => {
    setEditingId(null);
    setType(2);
    setName("");
    setColor("#2563eb");
    clearMessages();
  }, [clearMessages]);

  const startEdit = useCallback(
    (item: Category) => {
      setEditingId(item.id);
      setType(item.type);
      setName(item.name);
      setColor(colorByCategoryId[item.id] ?? fallbackColor(item.name));
      clearMessages();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [clearMessages, colorByCategoryId]
  );

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      clearMessages();

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Nome e obrigatorio.");
        return;
      }

      try {
        if (editingId) {
          await updateCategoryById(editingId, { name: trimmedName, type });
          saveStoredCategoryColors({ ...readStoredCategoryColors(), [editingId]: color });
          setColorByCategoryId((current) => {
            const next = { ...current, [editingId]: color };
            saveStoredCategoryColors(next);
            return next;
          });
          setSuccess("Categoria atualizada com sucesso.");
        } else {
          await createCategory({ name: trimmedName, type });
          setSuccess("Categoria criada com sucesso.");
        }

        await loadCategories();

        setName("");
        setEditingId(null);
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Erro ao salvar categoria.");
      }
    },
    [clearMessages, name, type, editingId, loadCategories]
  );

  const remove = useCallback(
    async (id: string, label: string) => {
      if (!window.confirm(`Excluir categoria "${label}"?`)) return;
      clearMessages();
      try {
        await deleteCategory(id);
        setSuccess("Categoria excluida com sucesso.");
        await loadCategories();
        if (editingId === id) startCreate();
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Erro ao excluir categoria.");
      }
    },
    [clearMessages, loadCategories, editingId, startCreate]
  );

  const typeLabel = type === 1 ? "Receita" : "Despesa";

  return (
    <div className="cf-page cfx-cat">
      <style>{`
        .cfx-cat {
          --cat-bg: linear-gradient(155deg, #f8fbff 0%, #f4f6fa 45%, #eef3f8 100%);
          --cat-card: #ffffff;
          --cat-border: #e8edf4;
          --cat-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          min-height: 100%;
          background: var(--cat-bg);
          border-radius: 1rem;
          padding: 1.2rem;
        }
        .cfx-cat .cfx-block {
          background: var(--cat-card);
          border: 1px solid var(--cat-border);
          box-shadow: var(--cat-shadow);
          border-radius: 16px;
        }
        .cfx-cat .cfx-preview {
          border-radius: 12px;
          border: 1px dashed #d6deeb;
          background: #f8fbff;
          padding: 0.9rem;
        }
        .cfx-cat .cfx-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 0.35rem;
          vertical-align: middle;
        }
        .cfx-cat .cfx-table-wrap {
          max-height: 560px;
          overflow: auto;
        }
        .cfx-cat .cfx-footer {
          margin-top: 1.1rem;
          text-align: center;
          color: #64748b;
          font-size: 0.84rem;
        }
        .cfx-cat .cfx-footer a {
          color: #2563eb;
          text-decoration: none;
        }
        .cfx-cat .cfx-footer a:hover {
          text-decoration: underline;
        }
        @media (max-width: 991.98px) {
          .cfx-cat {
            padding: 0.6rem;
            border-radius: 0.75rem;
          }
        }
      `}</style>

      <PageHeader title="Categorias" subtitle="Gestao organizada de categorias de receita e despesa." />

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          <div className="cfx-block p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 m-0">{editingId ? "Editar categoria" : "Nova categoria"}</h2>
              {editingId ? (
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={startCreate}>
                  Novo
                </button>
              ) : null}
            </div>

            <form onSubmit={(event) => void submit(event)}>
              <div className="mb-3">
                <label htmlFor="categoryType" className="form-label">
                  Tipo
                </label>
                <select
                  id="categoryType"
                  className="form-select"
                  value={type}
                  onChange={(event) => setType(Number(event.target.value) as 1 | 2)}
                >
                  <option value={1}>Receita</option>
                  <option value={2}>Despesa</option>
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="categoryName" className="form-label">
                  Nome
                </label>
                <input
                  id="categoryName"
                  className="form-control"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Mercado"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="categoryColor" className="form-label">
                  Cor
                </label>
                <input
                  id="categoryColor"
                  className="form-control form-control-color w-100"
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                />
              </div>

              <div className="cfx-preview mb-3">
                <p className="small text-secondary mb-1">Pre-visualizacao</p>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="cfx-dot" style={{ backgroundColor: color }} />
                    <span className="fw-semibold">{name.trim() || "Nome da categoria"}</span>
                  </div>
                  <span className={`badge ${type === 1 ? "text-bg-success" : "text-bg-danger"}`}>{typeLabel}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100">
                {editingId ? "Salvar alteracoes" : "Adicionar categoria"}
              </button>
            </form>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="cfx-block p-3 h-100">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="h6 m-0">Lista de categorias</h2>
              <span className="badge text-bg-light">{filteredItems.length} itens</span>
            </div>

            <div className="mb-3">
              <input
                className="form-control"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome da categoria"
              />
            </div>

            {loading ? <LoadingState /> : null}

            {!loading && !filteredItems.length ? (
              <EmptyState message="Nenhuma categoria encontrada. Crie sua primeira categoria no painel ao lado." />
            ) : (
              <div className="table-responsive cfx-table-wrap">
                <table className="table align-middle cf-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Cor</th>
                      <th className="text-end">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const itemColor = colorByCategoryId[item.id] ?? fallbackColor(item.name);
                      return (
                        <tr key={item.id}>
                          <td className="fw-semibold">{item.name}</td>
                          <td>
                            <span className={`badge ${item.type === 1 ? "text-bg-success" : "text-bg-danger"}`}>
                              {item.type === 1 ? "Receita" : "Despesa"}
                            </span>
                          </td>
                          <td>
                            <span className="d-inline-flex align-items-center">
                              <span className="cfx-dot" style={{ backgroundColor: itemColor }} />
                              <span className="small text-secondary">{itemColor}</span>
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                title="Editar"
                                aria-label="Editar"
                                onClick={() => startEdit(item)}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                title="Excluir"
                                aria-label="Excluir"
                                onClick={() => void remove(item.id, item.name)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cfx-footer">
        Criado por: Gustavo Soares | LinkedIn:{" "}
        <a href="https://www.linkedin.com/in/gustavoslv/" target="_blank" rel="noreferrer">
          https://www.linkedin.com/in/gustavoslv/
        </a>
      </div>
    </div>
  );
}
