import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  getTransactions,
  updateTransaction,
} from "../lib/api";
import type { Category, Transaction } from "../lib/api";
import { EmptyState, ErrorAlert, LoadingState, SuccessAlert } from "../components/ui/Feedback";
import { MoneyInput } from "../components/ui/MoneyInput";
import { MonthYearPicker } from "../components/ui/MonthYearPicker";
import { PageHeader } from "../components/ui/PageHeader";
import { useMonthYearQuery } from "../hooks/useMonthYearQuery";
import { clampDay, formatBRL, parseAmount, parseYMD, ymdFromParts } from "../utils/format";

const PAGE_SIZE = 8;

export default function TransactionsPage() {
  const { year, month, setYear, setMonth, periodLabel, syncQueryParams } = useMonthYearQuery();

  const [items, setItems] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<1 | 2>(2);
  const [amount, setAmount] = useState("0.00");
  const [date, setDate] = useState(() => ymdFromParts(year, month, 1));
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const [filterType, setFilterType] = useState<"all" | 1 | 2>("all");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredCategories = useMemo(() => categories.filter((category) => category.type === type), [categories, type]);

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const loadData = useCallback(
    async (selectedYear: number, selectedMonth: number) => {
      setLoading(true);
      setError("");
      try {
        const [transactionsData, categoriesData] = await Promise.all([
          getTransactions(selectedYear, selectedMonth),
          getCategories(),
        ]);
        setItems(transactionsData);
        setCategories(categoriesData);
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Erro ao carregar lancamentos.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    syncQueryParams(year, month);
    void loadData(year, month);

    if (!editingId) {
      const day = clampDay(year, month, 1);
      setDate(ymdFromParts(year, month, day));
    }
  }, [year, month, syncQueryParams, loadData, editingId]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setType(2);
    setAmount("0.00");
    setCategoryId("");
    setDescription("");
    const day = clampDay(year, month, 1);
    setDate(ymdFromParts(year, month, day));
  }, [year, month]);

  const startEdit = useCallback((transaction: Transaction) => {
    setEditingId(transaction.id);
    setType(transaction.type);
    setAmount(transaction.amount.toFixed(2));
    setDate(transaction.date);
    setCategoryId(transaction.categoryId ?? "");
    setDescription(transaction.description ?? "");
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const remove = useCallback(
    async (id: string) => {
      if (!window.confirm("Excluir lancamento?")) return;
      clearMessages();
      try {
        await deleteTransaction(id);
        await loadData(year, month);
        setSuccess("Lancamento excluido com sucesso.");
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Erro ao excluir lancamento.");
      }
    },
    [clearMessages, loadData, year, month]
  );

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      clearMessages();

      const numericAmount = parseAmount(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        setError("Valor invalido. Use um numero maior que 0.");
        return;
      }

      const chosenCategoryId = categoryId || null;
      if (type === 2 && !chosenCategoryId) {
        setError("Selecione uma categoria para despesa.");
        return;
      }

      const { year: txYear, month: txMonth, day: txDay } = parseYMD(date);
      if (!txYear || !txMonth || !txDay) {
        setError("Data invalida.");
        return;
      }

      const payload = {
        type,
        amount: numericAmount,
        year: txYear,
        month: txMonth,
        day: txDay,
        categoryId: chosenCategoryId,
        description: description.trim() ? description.trim() : undefined,
      };

      try {
        if (editingId) {
          await updateTransaction(editingId, payload);
          setSuccess("Lancamento atualizado com sucesso.");
        } else {
          await createTransaction(payload);
          setSuccess("Lancamento criado com sucesso.");
        }

        await loadData(year, month);
        resetForm();
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Erro ao salvar lancamento.");
      }
    },
    [clearMessages, amount, categoryId, type, date, description, editingId, loadData, month, resetForm, year]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => (filterType === "all" ? true : item.type === filterType))
      .filter((item) => (filterCategoryId ? item.categoryId === filterCategoryId : true))
      .filter((item) => {
        if (!query) return true;
        return [item.description, item.categoryName, item.date]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .slice()
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [items, filterType, filterCategoryId, search]);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterCategoryId, search, month, year]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const quickSummary = useMemo(() => {
    const income = items.filter((item) => item.type === 1).reduce((acc, item) => acc + item.amount, 0);
    const expense = items.filter((item) => item.type === 2).reduce((acc, item) => acc + item.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [items]);

  return (
    <div className="cf-page cfx-tx">
      <style>{`
        .cfx-tx {
          --tx-bg: linear-gradient(165deg, #f8fbff 0%, #f4f6fa 48%, #eef3f8 100%);
          --tx-card: #ffffff;
          --tx-border: #e8edf4;
          --tx-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          min-height: 100%;
          background: var(--tx-bg);
          padding: 1.2rem;
          border-radius: 1rem;
        }
        .cfx-tx .cfx-block {
          background: var(--tx-card);
          border: 1px solid var(--tx-border);
          box-shadow: var(--tx-shadow);
          border-radius: 16px;
        }
        .cfx-tx .cfx-kpi {
          border-radius: 14px;
          border: 1px solid var(--tx-border);
          padding: 0.9rem;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
        }
        .cfx-tx .cfx-kpi-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 0.1rem;
        }
        .cfx-tx .cfx-kpi-value {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
        }
        .cfx-tx .cfx-table-wrap {
          max-height: 520px;
          overflow: auto;
        }
        .cfx-tx .cfx-table {
          table-layout: fixed;
          width: 100%;
        }
        .cfx-tx .cfx-table th,
        .cfx-tx .cfx-table td {
          vertical-align: middle;
        }
        .cfx-tx .cfx-col-date {
          width: 104px;
          white-space: nowrap;
        }
        .cfx-tx .cfx-col-description {
          width: auto;
        }
        .cfx-tx .cfx-col-category {
          width: 150px;
          white-space: nowrap;
        }
        .cfx-tx .cfx-col-type {
          width: 86px;
          white-space: nowrap;
        }
        .cfx-tx .cfx-col-value {
          width: 132px;
          white-space: nowrap;
        }
        .cfx-tx .cfx-col-actions {
          width: 92px;
          white-space: nowrap;
        }
        .cfx-tx .cfx-col-actions .btn-group {
          display: inline-flex;
        }
        .cfx-tx .cfx-col-actions .btn {
          width: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .cfx-tx .cfx-sticky {
          position: sticky;
          top: 0.8rem;
        }
        .cfx-tx .cfx-footer {
          margin-top: 1.1rem;
          text-align: center;
          color: #64748b;
          font-size: 0.84rem;
        }
        .cfx-tx .cfx-footer a {
          color: #2563eb;
          text-decoration: none;
        }
        .cfx-tx .cfx-footer a:hover {
          text-decoration: underline;
        }
        @media (max-width: 991.98px) {
          .cfx-tx {
            padding: 0.6rem;
            border-radius: 0.75rem;
          }
          .cfx-tx .cfx-sticky {
            position: static;
          }
        }
      `}</style>

      <PageHeader
        title="Lancamentos"
        subtitle="Controle financeiro completo com filtros, tabela e formulario lateral."
        actions={
          <div className="d-flex gap-2 flex-wrap">
            <Link className="btn btn-outline-secondary" to={`/overview?year=${year}&month=${month}`}>
              Voltar para Visao Geral
            </Link>
          </div>
        }
      />

      <div className="cfx-block p-3 mb-3">
        <MonthYearPicker
          year={year}
          month={month}
          periodLabel={periodLabel}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onRefresh={() => void loadData(year, month)}
        />

        <div className="row g-2 mt-1">
          <div className="col-12 col-md-3">
            <label htmlFor="filterType" className="form-label mb-1 small text-secondary">
              Tipo
            </label>
            <select
              id="filterType"
              className="form-select"
              value={String(filterType)}
              onChange={(event) => {
                const value = event.target.value;
                setFilterType(value === "all" ? "all" : (Number(value) as 1 | 2));
              }}
            >
              <option value="all">Todos</option>
              <option value="1">Receitas</option>
              <option value="2">Despesas</option>
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label htmlFor="filterCategory" className="form-label mb-1 small text-secondary">
              Categoria
            </label>
            <select
              id="filterCategory"
              className="form-select"
              value={filterCategoryId}
              onChange={(event) => setFilterCategoryId(event.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-5">
            <label htmlFor="filterSearch" className="form-label mb-1 small text-secondary">
              Busca
            </label>
            <input
              id="filterSearch"
              className="form-control"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Descricao, categoria ou data"
            />
          </div>
        </div>
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-4">
          <div className="cfx-kpi h-100">
            <p className="cfx-kpi-label">Receitas</p>
            <p className="cfx-kpi-value text-success">{formatBRL(quickSummary.income)}</p>
          </div>
        </div>
        <div className="col-6 col-lg-4">
          <div className="cfx-kpi h-100">
            <p className="cfx-kpi-label">Despesas</p>
            <p className="cfx-kpi-value text-danger">{formatBRL(quickSummary.expense)}</p>
          </div>
        </div>
        <div className="col-6 col-lg-4">
          <div className="cfx-kpi h-100">
            <p className="cfx-kpi-label">Saldo</p>
            <p className={`cfx-kpi-value ${quickSummary.net >= 0 ? "text-success" : "text-danger"}`}>{formatBRL(quickSummary.net)}</p>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="cfx-block">
            <div className="d-flex justify-content-between align-items-center px-3 pt-3 pb-2">
              <h2 className="h6 m-0">Lancamentos</h2>
              <span className="badge text-bg-light">{filteredItems.length} itens</span>
            </div>

            {loading ? <LoadingState /> : null}

            {!loading && !filteredItems.length ? (
              <div className="px-3 pb-3">
                <EmptyState message="Nenhum lancamento encontrado para os filtros aplicados." />
              </div>
            ) : (
              <>
                <div className="cfx-table-wrap">
                  <table className="table table-hover align-middle mb-0 cf-table cfx-table">
                    <colgroup>
                      <col className="cfx-col-date" />
                      <col className="cfx-col-description" />
                      <col className="cfx-col-category" />
                      <col className="cfx-col-type" />
                      <col className="cfx-col-value" />
                      <col className="cfx-col-actions" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="cfx-col-date">Data</th>
                        <th className="cfx-col-description">Descricao</th>
                        <th className="cfx-col-category">Categoria</th>
                        <th className="cfx-col-type">Tipo</th>
                        <th className="text-end cfx-col-value">Valor</th>
                        <th className="text-center cfx-col-actions">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedItems.map((item) => (
                        <tr key={item.id}>
                          <td className="cfx-col-date">{item.date}</td>
                          <td className="cfx-col-description">{item.description ?? "-"}</td>
                          <td className="cfx-col-category">{item.categoryName ?? "Sem categoria"}</td>
                          <td className="cfx-col-type">
                            <span className={`badge ${item.type === 1 ? "text-bg-success" : "text-bg-danger"}`}>
                              {item.type === 1 ? "Receita" : "Despesa"}
                            </span>
                          </td>
                          <td className={`text-end fw-semibold cfx-col-value ${item.type === 1 ? "text-success" : "text-danger"}`}>
                            {formatBRL(item.amount)}
                          </td>
                          <td className="text-center cfx-col-actions">
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                title="Editar"
                                aria-label="Editar"
                                onClick={() => startEdit(item)}
                              >
                                &#9998;
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                title="Excluir"
                                aria-label="Excluir"
                                onClick={() => void remove(item.id)}
                              >
                                &#128465;
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                  <small className="text-secondary">
                    Pagina {currentPage} de {pageCount}
                  </small>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={currentPage <= 1}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                      disabled={currentPage >= pageCount}
                    >
                      Proxima
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="cfx-block cfx-sticky p-3">
            <h2 className="h6 mb-3">{editingId ? "Editar transacao" : "Nova transacao"}</h2>

            <form onSubmit={(event) => void submit(event)}>
              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor="txType" className="form-label">
                    Tipo
                  </label>
                  <select
                    id="txType"
                    className="form-select"
                    value={type}
                    onChange={(event) => setType(Number(event.target.value) as 1 | 2)}
                  >
                    <option value={1}>Receita</option>
                    <option value={2}>Despesa</option>
                  </select>
                </div>

                <div className="col-12">
                  <label htmlFor="txAmount" className="form-label">
                    Valor
                  </label>
                  <MoneyInput id="txAmount" value={amount} onChange={setAmount} />
                </div>

                <div className="col-12">
                  <label htmlFor="txDate" className="form-label">
                    Data
                  </label>
                  <input id="txDate" className="form-control" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </div>

                <div className="col-12">
                  <label htmlFor="txCategory" className="form-label">
                    Categoria
                  </label>
                  <select id="txCategory" className="form-select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                    <option value="">{type === 1 ? "Sem categoria (opcional)" : "Selecione..."}</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label htmlFor="txDescription" className="form-label">
                    Descricao
                  </label>
                  <input
                    id="txDescription"
                    className="form-control"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button type="submit" className="btn btn-primary flex-grow-1">
                  {editingId ? "Salvar alteracoes" : "Salvar lancamento"}
                </button>
                {editingId ? (
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
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


