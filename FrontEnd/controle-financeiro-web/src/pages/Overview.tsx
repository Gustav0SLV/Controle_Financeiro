import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getMonthlyIncome,
  getMonthlySummary,
  setMonthlyIncome,
  getBudgets,
  upsertBudget,
  getCategories,
  getMonthlyGoal,
  setMonthlyGoal,
  addMonthlyGoalSaving,
  updateMonthlyGoalSaving,
  deleteMonthlyGoalSaving,
} from "../lib/api";
import type { MonthlySummary, Budget, Category, MonthlyGoal } from "../lib/api";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseAmount(value: string) {
  const v = (value ?? "").trim();
  if (!v) return 0;

  // mantém só dígitos, vírgula e ponto
  const cleaned = v.replace(/[^\d.,-]/g, "");

  // se tiver vírgula, assume pt-BR (vírgula decimal)
  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    return Number(normalized);
  }

  // se não tiver vírgula, assume que é número normal (ex: 500.25 ou 500)
  return Number(cleaned);
}

function formatMoneyInput(value: string) {
  const n = parseAmount(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function clampPct(p: number) {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

function formatDateTimeBR(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
}

export default function Overview() {
  const now = useMemo(() => new Date(), []);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialYear = Number(searchParams.get("year")) || now.getFullYear();
  const initialMonth = Number(searchParams.get("month")) || now.getMonth() + 1;

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const [data, setData] = useState<MonthlySummary | null>(null);

  const [income, setIncome] = useState<string>("0.00");
  const [savingIncome, setSavingIncome] = useState(false);

  // Goal
  const [goal, setGoal] = useState<MonthlyGoal | null>(null);

  // drafts
  const [goalTargetDraft, setGoalTargetDraft] = useState<string>("0.00");
  const [goalSavedDraft, setGoalSavedDraft] = useState<string>("0.00");
  const [goalSavedDescDraft, setGoalSavedDescDraft] = useState<string>("");

  const [savingGoal, setSavingGoal] = useState(false);

  // editar/excluir saving
  const [editingSavingId, setEditingSavingId] = useState<string | null>(null);
  const [editSavingAmountDraft, setEditSavingAmountDraft] = useState<string>("0.00");
  const [editSavingDescDraft, setEditSavingDescDraft] = useState<string>("");
  const [savingEditSaving, setSavingEditSaving] = useState(false);
  const [deletingSavingId, setDeletingSavingId] = useState<string | null>(null);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});
  const [savingBudgetId, setSavingBudgetId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  async function load(y = year, m = month) {
    setError("");
    setLoading(true);

    try {
      const [summary, incomeData, budgetsData, categoriesData, goalData] = await Promise.all([
        getMonthlySummary(y, m),
        getMonthlyIncome(y, m),
        getBudgets(y, m),
        getCategories(),
        getMonthlyGoal(y, m),
      ]);

      setData(summary);
      setIncome((incomeData.amount ?? 0).toFixed(2));

      setBudgets(budgetsData);

      const expenseCats = categoriesData.filter((c) => c.type === 2);
      setExpenseCategories(expenseCats);

      // goal
      setGoal(goalData);

      // drafts:
      // - meta vem do goal
      setGoalTargetDraft((goalData.targetAmount ?? 0).toFixed(2));

      // - guardado e descrição: sempre prontos pra "nova entrada"
      setGoalSavedDraft("0.00");
      setGoalSavedDescDraft("");

      // se estava editando e o item não existe mais, cancela
      if (editingSavingId && !(goalData.savings ?? []).some((s) => s.id === editingSavingId)) {
        cancelEditSaving();
      }

      // drafts para TODAS categorias de despesa
      const drafts: Record<string, string> = {};
      for (const c of expenseCats) {
        const existing = budgetsData.find((b) => b.categoryId === c.id);
        drafts[c.id] = (existing?.amount ?? 0).toFixed(2);
      }
      setBudgetDraft(drafts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar overview");
    } finally {
      setLoading(false);
    }
  }

  async function saveIncome() {
    const value = parseAmount(income);
    if (!Number.isFinite(value) || value < 0) {
      setError("Renda inválida (use um número >= 0).");
      return;
    }

    setSavingIncome(true);
    setError("");

    try {
      await setMonthlyIncome({ year, month, amount: value });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar renda");
    } finally {
      setSavingIncome(false);
    }
  }

  // Salva SOMENTE a meta (targetAmount)
  async function saveGoalTarget() {
    // ✅ normaliza o campo antes de salvar
    const normalized = formatMoneyInput(goalTargetDraft);
    setGoalTargetDraft(normalized);

    const target = parseAmount(normalized);

    if (!Number.isFinite(target) || target < 0) {
      setError("Meta inválida (use um número >= 0).");
      return;
    }

    setSavingGoal(true);
    setError("");

    try {
      await setMonthlyGoal({
        year,
        month,
        targetAmount: target,
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar meta");
    } finally {
      setSavingGoal(false);
    }
  }

  // Adiciona uma ENTRADA de guardado (amount + description)
  // ✅ Depois limpa os campos guardado e descrição
  async function addSavingEntry() {
    // ✅ normaliza o campo antes de salvar
    const normalized = formatMoneyInput(goalSavedDraft);
    setGoalSavedDraft(normalized);

    const amount = parseAmount(normalized);
    const desc = (goalSavedDescDraft ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Valor guardado inválido (use um número > 0).");
      return;
    }

    if (!desc) {
      setError("Descrição é obrigatória (ex: Ação, carteira, investimento).");
      return;
    }

    if (desc.length > 200) {
      setError("Descrição muito longa (máx 200 caracteres).");
      return;
    }

    setSavingGoal(true);
    setError("");

    try {
      await addMonthlyGoalSaving({
        year,
        month,
        amount,
        description: desc,
      });

      // ✅ o que você pediu:
      setGoalSavedDraft("0.00");
      setGoalSavedDescDraft("");

      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar guardado");
    } finally {
      setSavingGoal(false);
    }
  }

  function startEditSaving(id: string, amount: number, description: string) {
    setEditingSavingId(id);
    setEditSavingAmountDraft((amount ?? 0).toFixed(2));
    setEditSavingDescDraft(description ?? "");
  }

  function cancelEditSaving() {
    setEditingSavingId(null);
    setEditSavingAmountDraft("0.00");
    setEditSavingDescDraft("");
  }

  async function saveEditSaving() {
    if (!editingSavingId) return;

    // ✅ normaliza o campo antes de salvar
    const normalized = formatMoneyInput(editSavingAmountDraft);
    setEditSavingAmountDraft(normalized);

    const amount = parseAmount(normalized);
    const desc = (editSavingDescDraft ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Valor inválido (use um número > 0).");
      return;
    }
    if (!desc) {
      setError("Descrição é obrigatória.");
      return;
    }
    if (desc.length > 200) {
      setError("Descrição muito longa (máx 200 caracteres).");
      return;
    }

    setSavingEditSaving(true);
    setError("");

    try {
      await updateMonthlyGoalSaving(editingSavingId, { amount, description: desc });
      cancelEditSaving();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao editar guardado");
    } finally {
      setSavingEditSaving(false);
    }
  }

  async function removeSaving(id: string) {
    setDeletingSavingId(id);
    setError("");

    try {
      await deleteMonthlyGoalSaving(id);
      if (editingSavingId === id) cancelEditSaving();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao excluir guardado");
    } finally {
      setDeletingSavingId(null);
    }
  }

  async function saveBudget(categoryId: string) {
    const raw = budgetDraft[categoryId] ?? "0";
    const value = parseAmount(raw);

    if (!Number.isFinite(value) || value < 0) {
      setError("Orçamento inválido (use um número >= 0).");
      return;
    }

    setSavingBudgetId(categoryId);
    setError("");

    try {
      await upsertBudget({ year, month, categoryId, amount: value });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar orçamento");
    } finally {
      setSavingBudgetId(null);
    }
  }

  useEffect(() => {
    setSearchParams({ year: String(year), month: String(month) });
    load(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // despesas por categoria vindas do summary (map por nome)
  const expensesMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!data) return map;

    for (const x of data.expensesByCategory) {
      map.set(x.category, x.total);
    }
    return map;
  }, [data]);

  const budgetRows = useMemo(() => {
    if (!data) return [];

    const budgetByCategoryId = new Map<string, number>();
    for (const b of budgets) budgetByCategoryId.set(b.categoryId, b.amount);

    return expenseCategories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => {
        const spent = expensesMap.get(c.name) ?? 0;
        const limit = budgetByCategoryId.get(c.id) ?? 0;
        const pct = limit > 0 ? (spent / limit) * 100 : 0;

        return {
          categoryId: c.id,
          categoryName: c.name,
          amount: limit,
          spent,
          pct,
        };
      });
  }, [budgets, expenseCategories, expensesMap, data]);

  // stats do goal: usa savedAmount vindo do backend (soma das entradas)
  const goalStats = useMemo(() => {
    const targetAmount = goal?.targetAmount ?? 0;
    const savedAmount = goal?.savedAmount ?? 0;

    const pct = targetAmount > 0 ? (savedAmount / targetAmount) * 100 : 0;
    const remaining = targetAmount - savedAmount;

    return {
      targetAmount,
      savedAmount,
      pct: clampPct(pct),
      remaining,
      reached: targetAmount > 0 && savedAmount >= targetAmount,
    };
  }, [goal]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Arial" }}>
      <h1>Overview</h1>

      {/* Filtro mês/ano */}
      <div style={{ display: "flex", gap: 12, alignItems: "end", marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.75 }}>Ano</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: 10, width: 120 }} />
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

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
          {year}-{pad2(month)}
        </div>
      </div>

      {/* Link sincronizado */}
      <div style={{ marginBottom: 16 }}>
        <Link to={`/transactions?year=${year}&month=${month}`}>Ver lançamentos do mês →</Link>
      </div>

      {/* Renda mensal + Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Renda mensal (fixa)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              onBlur={() => setIncome(formatMoneyInput(income))}
              style={{ padding: 10, width: 160 }}
              inputMode="decimal"
            />
            <button onClick={saveIncome} disabled={savingIncome} style={{ padding: "10px 14px", cursor: "pointer" }}>
              {savingIncome ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Meta de economia do mês</div>

          {/* META */}
          <div style={{ display: "flex", gap: 8, alignItems: "end", marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, opacity: 0.75 }}>Meta (R$)</label>
              <input
                value={goalTargetDraft}
                onChange={(e) => setGoalTargetDraft(e.target.value)}
                onBlur={() => setGoalTargetDraft(formatMoneyInput(goalTargetDraft))}
                style={{ padding: 10, width: 160 }}
                inputMode="decimal"
                placeholder="Ex: 500,00"
              />
            </div>

            <button onClick={saveGoalTarget} disabled={savingGoal} style={{ padding: "10px 14px", cursor: "pointer", height: 42 }}>
              {savingGoal ? "Salvando..." : "Salvar meta"}
            </button>

            <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
              Guardado total: <b>{formatBRL(goalStats.savedAmount)}</b>
            </div>
          </div>

          {/* GUARDADO + DESCRIÇÃO (entra como item) */}
          <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, opacity: 0.75 }}>Guardado (R$)</label>
              <input
                value={goalSavedDraft}
                onChange={(e) => setGoalSavedDraft(e.target.value)}
                onBlur={() => setGoalSavedDraft(formatMoneyInput(goalSavedDraft))}
                style={{ padding: 10, width: 160 }}
                inputMode="decimal"
                placeholder="Ex: 200,00"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 220 }}>
              <label style={{ fontSize: 12, opacity: 0.75 }}>Descrição</label>
              <input
                value={goalSavedDescDraft}
                onChange={(e) => setGoalSavedDescDraft(e.target.value)}
                style={{ padding: 10, width: "100%" }}
                placeholder="Ex: Ações, carteira, investimento..."
              />
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{(goalSavedDescDraft ?? "").length}/200</div>
            </div>

            <button onClick={addSavingEntry} disabled={savingGoal} style={{ padding: "10px 14px", cursor: "pointer", height: 42 }}>
              {savingGoal ? "Salvando..." : "Adicionar guardado"}
            </button>
          </div>

          {/* barra */}
          <div style={{ height: 10, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${goalStats.pct}%`,
                background: goalStats.reached ? "#2ecc71" : "#2d8fdd",
              }}
            />
          </div>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
            Meta: <b>{formatBRL(goalStats.targetAmount)}</b> —{" "}
            {goalStats.targetAmount === 0 ? (
              <span>defina uma meta para ver o progresso.</span>
            ) : goalStats.reached ? (
              <span style={{ color: "#1e7e34" }}>✅ Meta atingida!</span>
            ) : (
              <span>
                faltam <b>{formatBRL(goalStats.remaining)}</b>
              </span>
            )}
          </div>

          {/* LISTA DE ENTRADAS */}
          <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>Entradas guardadas</div>

            {goal?.savings?.length ? (
              <div>
                {goal.savings.map((s) => {
                  const isEditing = editingSavingId === s.id;

                  return (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 0",
                        borderTop: "1px solid #f2f2f2",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {!isEditing ? (
                          <>
                            <div style={{ fontSize: 13 }}>
                              <b>{formatBRL(s.amount)}</b> — {s.description}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.6 }}>{formatDateTimeBR(s.createdAtUtc)}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <input
                                value={editSavingAmountDraft}
                                onChange={(e) => setEditSavingAmountDraft(e.target.value)}
                                onBlur={() => setEditSavingAmountDraft(formatMoneyInput(editSavingAmountDraft))}
                                style={{ padding: 8, width: 140 }}
                                inputMode="decimal"
                              />
                              <input
                                value={editSavingDescDraft}
                                onChange={(e) => setEditSavingDescDraft(e.target.value)}
                                style={{ padding: 8, minWidth: 220, flex: 1 }}
                                placeholder="Descrição"
                              />
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{editSavingDescDraft.length}/200</div>
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => startEditSaving(s.id, s.amount, s.description)}
                              style={{ padding: "8px 10px", cursor: "pointer" }}
                            >
                              Editar
                            </button>

                            <button
                              onClick={() => removeSaving(s.id)}
                              disabled={deletingSavingId === s.id}
                              style={{ padding: "8px 10px", cursor: "pointer" }}
                            >
                              {deletingSavingId === s.id ? "Excluindo..." : "Excluir"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={saveEditSaving}
                              disabled={savingEditSaving}
                              style={{ padding: "8px 10px", cursor: "pointer" }}
                            >
                              {savingEditSaving ? "Salvando..." : "Salvar"}
                            </button>

                            <button onClick={cancelEditSaving} style={{ padding: "8px 10px", cursor: "pointer" }}>
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.7 }}>Nenhuma entrada de guardado ainda.</div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, border: "1px solid #ffb3b3", background: "#ffecec", borderRadius: 8, marginBottom: 12 }}>
          ❌ {error}
        </div>
      )}

      {!error && loading && <div>Carregando...</div>}

      {data && (
        <>
          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <Card title="Renda" value={data.income} />
            <Card title="Gastos" value={data.expense} />
            <Card title="Saldo" value={data.balance} />
          </div>

          {/* Gastos por categoria */}
          <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: 12, fontWeight: "bold", borderBottom: "1px solid #eee" }}>Gastos por categoria</div>

            {data.expensesByCategory.length === 0 ? (
              <div style={{ padding: 12 }}>Nenhum gasto no mês.</div>
            ) : (
              data.expensesByCategory.map((x) => (
                <div key={x.category} style={{ display: "flex", justifyContent: "space-between", padding: 12, borderTop: "1px solid #eee" }}>
                  <div>{x.category}</div>
                  <div style={{ fontWeight: "bold" }}>{formatBRL(x.total)}</div>
                </div>
              ))
            )}
          </div>

          {/* Orçamentos */}
          <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 12, fontWeight: "bold", borderBottom: "1px solid #eee" }}>Orçamento por categoria (despesas)</div>

            {expenseCategories.length === 0 ? (
              <div style={{ padding: 12 }}>
                Você ainda não tem categorias de despesa. Crie em <Link to="/categories">Categorias</Link>.
              </div>
            ) : (
              budgetRows.map((r) => {
                const pct = clampPct(r.pct);
                const exceeded = r.amount > 0 && r.spent > r.amount;

                return (
                  <div key={r.categoryId} style={{ padding: 12, borderTop: "1px solid #eee" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <div style={{ fontWeight: "bold" }}>{r.categoryName}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Gasto: <b>{formatBRL(r.spent)}</b> / Orçamento: <b>{formatBRL(r.amount)}</b> —{" "}
                        <b style={{ color: exceeded ? "#c0392b" : "inherit" }}>{pct.toFixed(0)}%</b>
                      </div>
                    </div>

                    <div style={{ height: 10, background: "#eee", borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: exceeded ? "#c0392b" : "#2d8fdd" }} />
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                      <input
                        value={budgetDraft[r.categoryId] ?? ""}
                        onChange={(e) => setBudgetDraft((prev) => ({ ...prev, [r.categoryId]: e.target.value }))}
                        onBlur={() => setBudgetDraft((prev) => ({ ...prev, [r.categoryId]: formatMoneyInput(prev[r.categoryId] ?? "0") }))}
                        style={{ padding: 10, width: 160 }}
                        inputMode="decimal"
                        placeholder="Ex: 800,00"
                      />
                      <button
                        onClick={() => saveBudget(r.categoryId)}
                        disabled={savingBudgetId === r.categoryId}
                        style={{ padding: "10px 14px", cursor: "pointer" }}
                      >
                        {savingBudgetId === r.categoryId ? "Salvando..." : "Salvar"}
                      </button>

                      {exceeded && <div style={{ marginLeft: "auto", fontSize: 12, color: "#c0392b" }}>⚠ Estourou o orçamento</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: "bold" }}>{formatBRL(value)}</div>
    </div>
  );
}