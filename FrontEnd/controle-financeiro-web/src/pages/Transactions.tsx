import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  getTransactions,
  updateTransaction,
} from "../lib/api";
import type { Category, Transaction } from "../lib/api";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ymdFromParts(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function clampDay(year: number, month: number, day: number) {
  const last = new Date(year, month, 0).getDate(); // month 1..12
  return Math.min(Math.max(day, 1), last);
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

export default function TransactionsPage() {
  const now = useMemo(() => new Date(), []);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialYear = Number(searchParams.get("year")) || now.getFullYear();
  const initialMonth = Number(searchParams.get("month")) || now.getMonth() + 1;

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const [items, setItems] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<1 | 2>(2);
  const [amount, setAmount] = useState<string>("0");
  const [date, setDate] = useState<string>(ymdFromParts(year, month, 1));
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  async function load(y = year, m = month) {
    setError("");
    setLoading(true);
    try {
      const [txs, cats] = await Promise.all([getTransactions(y, m), getCategories()]);
      setItems(txs);
      setCategories(cats);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  // ✅ sempre que year/month mudar: atualiza URL e recarrega
  useEffect(() => {
    setSearchParams({ year: String(year), month: String(month) });
    load(year, month);

    if (!editingId) {
      const d = clampDay(year, month, 1);
      setDate(ymdFromParts(year, month, d));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function resetForm() {
    setEditingId(null);
    setType(2);
    setAmount("0");
    setCategoryId("");
    setDescription("");

    const d = clampDay(year, month, 1);
    setDate(ymdFromParts(year, month, d));
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.amount.toFixed(2));
    setDate(t.date);
    setCategoryId(t.categoryId ?? "");
    setDescription(t.description ?? "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("Excluir lançamento?")) return;
    setError("");
    try {
      await deleteTransaction(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const numericAmount = parseAmount(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Valor inválido. Use um número > 0.");
      return;
    }

    const { year: y, month: m, day: d } = parseYMD(date);

    const chosenCategoryId = categoryId ? categoryId : null;

    // regra MVP
    if (type === 2 && !chosenCategoryId) {
      setError("Selecione uma categoria para despesa.");
      return;
    }

    setError("");

    try {
      if (!editingId) {
        await createTransaction({
          type,
          amount: numericAmount,
          year: y,
          month: m,
          day: d,
          categoryId: chosenCategoryId,
          description: description.trim() ? description.trim() : undefined,
        });
      } else {
        await updateTransaction(editingId, {
          type,
          amount: numericAmount,
          year: y,
          month: m,
          day: d,
          categoryId: chosenCategoryId,
          description: description.trim() ? description.trim() : undefined,
        });
      }

      await load();
      resetForm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Arial" }}>
      <h1>Lançamentos</h1>

      <div style={{ marginBottom: 12 }}>
        <Link to={`/overview?year=${year}&month=${month}`}>← Voltar para Overview</Link>
      </div>

      {/* Filtro mês/ano */}
      <div style={{ display: "flex", gap: 12, alignItems: "end", marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Ano</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ padding: 10, width: 120 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Mês</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{ padding: 10, width: 120 }}
          />
        </div>

        <button onClick={() => load()} style={{ padding: "10px 14px", cursor: "pointer" }}>
          Atualizar
        </button>

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
          {year}-{pad2(month)}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={submit}
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "140px 160px 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(Number(e.target.value) as 1 | 2)}
              style={{ padding: 10, width: "100%" }}
            >
              <option value={1}>Receita</option>
              <option value={2}>Despesa</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Valor</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ padding: 10, width: "100%" }}
              placeholder="Ex: 120,50"
              inputMode="decimal"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: 10, width: "100%" }}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ padding: 10, width: "100%" }}
            >
              <option value="">{type === 1 ? "Sem categoria (opcional)" : "Selecione..."}</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: 10, width: "100%" }}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: "10px 14px", cursor: "pointer" }}>
            {editingId ? "Salvar alterações" : "Salvar lançamento"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Cancelar
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #ffb3b3", background: "#ffecec", borderRadius: 8 }}>
            ❌ {error}
          </div>
        )}
      </form>

      {/* List */}
      {loading && <div>Carregando...</div>}

      {!loading && !error && items.length === 0 && <div>Nenhum lançamento neste mês.</div>}

      {!loading &&
        !error &&
        items.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              borderBottom: "1px solid #eee",
            }}
          >
            <div>
              <strong>{t.categoryName ?? "Sem categoria"}</strong>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {t.date} — {t.type === 2 ? "Despesa" : "Receita"}
                {t.description ? ` — ${t.description}` : ""}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: "bold" }}>{formatBRL(t.amount)}</div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                <button onClick={() => startEdit(t)}>Editar</button>
                <button onClick={() => remove(t.id)}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}