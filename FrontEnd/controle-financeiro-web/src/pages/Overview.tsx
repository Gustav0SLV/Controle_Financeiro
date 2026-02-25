
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addMonthlyGoalSaving,
  deleteMonthlyGoalSaving,
  getBudgets,
  getCategories,
  getMonthlyGoal,
  getMonthlyIncome,
  getMonthlySummary,
  getTransactions,
  setMonthlyGoal,
  setMonthlyIncome,
  updateMonthlyGoalSaving,
  upsertBudget,
} from "../lib/api";
import type { Budget, Category, MonthlyGoal, MonthlySummary, Transaction } from "../lib/api";
import { EmptyState, ErrorAlert, LoadingState, SuccessAlert } from "../components/ui/Feedback";
import { MoneyInput } from "../components/ui/MoneyInput";
import { MonthYearPicker } from "../components/ui/MonthYearPicker";
import { PageHeader } from "../components/ui/PageHeader";
import { useMonthYearQuery } from "../hooks/useMonthYearQuery";
import { clampPct, formatBRL, formatDateTimeBR, formatMoneyInput, parseAmount } from "../utils/format";

type BudgetRow = {
  categoryId: string;
  categoryName: string;
  spent: number;
  budget: number;
  pct: number;
};

type DailyFlowPoint = {
  day: number;
  incomeAcc: number;
  expenseAcc: number;
  balanceAcc: number;
  x: number;
  y: number;
};

const CHART_COLORS = ["#2563eb", "#0891b2", "#16a34a", "#ea580c", "#dc2626", "#7c3aed", "#0f766e", "#64748b"];

function parseTransactionDay(dateValue: string) {
  const value = Number(dateValue.split("-")[2]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export default function OverviewPage() {
  const { year, month, setYear, setMonth, periodLabel, syncQueryParams } = useMonthYearQuery();

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeDraft, setIncomeDraft] = useState("0.00");

  const [goal, setGoal] = useState<MonthlyGoal | null>(null);
  const [goalTargetDraft, setGoalTargetDraft] = useState("0.00");
  const [goalSavedDraft, setGoalSavedDraft] = useState("0.00");
  const [goalSavedDescDraft, setGoalSavedDescDraft] = useState("");

  const [editingSavingId, setEditingSavingId] = useState<string | null>(null);
  const [editSavingAmountDraft, setEditSavingAmountDraft] = useState("0.00");
  const [editSavingDescDraft, setEditSavingDescDraft] = useState("");

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [savingIncome, setSavingIncome] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingEditedGoalItem, setSavingEditedGoalItem] = useState(false);
  const [deletingGoalItemId, setDeletingGoalItemId] = useState<string | null>(null);
  const [savingBudgetId, setSavingBudgetId] = useState<string | null>(null);
  const [activeFlowDay, setActiveFlowDay] = useState<number | null>(null);

  const cancelEditSaving = useCallback(() => {
    setEditingSavingId(null);
    setEditSavingAmountDraft("0.00");
    setEditSavingDescDraft("");
  }, []);

  const loadOverview = useCallback(
    async (selectedYear: number, selectedMonth: number) => {
      setLoading(true);
      setError("");

      try {
        const [summaryData, incomeData, budgetData, categoriesData, goalData, transactionsData] = await Promise.all([
          getMonthlySummary(selectedYear, selectedMonth),
          getMonthlyIncome(selectedYear, selectedMonth),
          getBudgets(selectedYear, selectedMonth),
          getCategories(),
          getMonthlyGoal(selectedYear, selectedMonth),
          getTransactions(selectedYear, selectedMonth),
        ]);

        const expenseOnlyCategories = categoriesData.filter((category) => category.type === 2);
        const nextBudgetDrafts: Record<string, string> = {};
        for (const category of expenseOnlyCategories) {
          const budget = budgetData.find((item) => item.categoryId === category.id);
          nextBudgetDrafts[category.id] = (budget?.amount ?? 0).toFixed(2);
        }

        setSummary(summaryData);
        setTransactions(transactionsData);
        setIncomeDraft((incomeData.amount ?? 0).toFixed(2));
        setBudgets(budgetData);
        setExpenseCategories(expenseOnlyCategories);
        setBudgetDrafts(nextBudgetDrafts);
        setGoal(goalData);
        setGoalTargetDraft((goalData.targetAmount ?? 0).toFixed(2));
        setGoalSavedDraft("0.00");
        setGoalSavedDescDraft("");

        if (editingSavingId && !(goalData.savings ?? []).some((item) => item.id === editingSavingId)) {
          cancelEditSaving();
        }
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Erro ao carregar overview.");
      } finally {
        setLoading(false);
      }
    },
    [cancelEditSaving, editingSavingId]
  );

  useEffect(() => {
    syncQueryParams(year, month);
    void loadOverview(year, month);
  }, [year, month, syncQueryParams, loadOverview]);

  useEffect(() => {
    setActiveFlowDay(null);
  }, [month, transactions, year]);

  const expensesMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!summary) return map;

    for (const item of summary.expensesByCategory) {
      map.set(item.category, item.total);
    }
    return map;
  }, [summary]);

  const budgetRows = useMemo<BudgetRow[]>(() => {
    const budgetByCategoryId = new Map(budgets.map((budget) => [budget.categoryId, budget.amount]));

    return expenseCategories
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((category) => {
        const spent = expensesMap.get(category.name) ?? 0;
        const limit = budgetByCategoryId.get(category.id) ?? 0;
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        return {
          categoryId: category.id,
          categoryName: category.name,
          spent,
          budget: limit,
          pct,
        };
      });
  }, [budgets, expenseCategories, expensesMap]);

  const goalStats = useMemo(() => {
    const targetAmount = goal?.targetAmount ?? 0;
    const savedAmount = goal?.savedAmount ?? 0;
    const pct = targetAmount > 0 ? (savedAmount / targetAmount) * 100 : 0;

    return {
      targetAmount,
      savedAmount,
      pct: clampPct(pct),
      remaining: targetAmount - savedAmount,
      reached: targetAmount > 0 && savedAmount >= targetAmount,
    };
  }, [goal]);

  const latestTransactions = useMemo(() => {
    return transactions
      .slice()
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 8);
  }, [transactions]);

  const dailyFlow = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const incomeByDay = new Array<number>(daysInMonth + 1).fill(0);
    const expenseByDay = new Array<number>(daysInMonth + 1).fill(0);

    for (const item of transactions) {
      const day = Math.min(daysInMonth, Math.max(1, parseTransactionDay(item.date)));
      if (item.type === 1) {
        incomeByDay[day] += item.amount;
      } else {
        expenseByDay[day] += item.amount;
      }
    }

    let incomeAcc = 0;
    let expenseAcc = 0;
    const basePoints: Array<Omit<DailyFlowPoint, "x" | "y">> = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      incomeAcc += incomeByDay[day];
      expenseAcc += expenseByDay[day];
      basePoints.push({
        day,
        incomeAcc,
        expenseAcc,
        balanceAcc: incomeAcc - expenseAcc,
      });
    }

    const balances = basePoints.map((point) => point.balanceAcc);
    const minBalance = Math.min(0, ...balances);
    const maxBalance = Math.max(0, ...balances, 1);
    const range = Math.max(1, maxBalance - minBalance);
    const svgHeight = 210;
    const svgWidth = 720;

    const xForDay = (day: number) => {
      if (daysInMonth <= 1) return 0;
      return ((day - 1) / (daysInMonth - 1)) * svgWidth;
    };
    const yForBalance = (balance: number) => svgHeight - ((balance - minBalance) / range) * svgHeight;

    const points: DailyFlowPoint[] = basePoints.map((point) => ({
      ...point,
      x: xForDay(point.day),
      y: yForBalance(point.balanceAcc),
    }));

    const balancePolyline = points.map((point) => `${xForDay(point.day).toFixed(2)},${yForBalance(point.balanceAcc).toFixed(2)}`).join(" ");
    const zeroLineY = yForBalance(0);

    return {
      points,
      daysInMonth,
      svgWidth,
      svgHeight,
      balancePolyline,
      zeroLineY,
    };
  }, [month, transactions, year]);

  const activeFlowPoint = useMemo(() => {
    if (!dailyFlow.points.length) return null;
    if (activeFlowDay === null) return dailyFlow.points[dailyFlow.points.length - 1];
    return dailyFlow.points.find((point) => point.day === activeFlowDay) ?? dailyFlow.points[dailyFlow.points.length - 1];
  }, [activeFlowDay, dailyFlow.points]);

  const expenseByCategoryFromIncome = useMemo(() => {
    const totalIncome = summary?.income ?? 0;
    const totalExpense = summary?.expense ?? 0;
    const remaining = totalIncome - totalExpense;
    const expensePctOfIncome = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    const rows = (summary?.expensesByCategory ?? [])
      .slice()
      .sort((left, right) => right.total - left.total)
      .slice(0, 8)
      .map((item, index) => {
        const pctOfIncome = totalIncome > 0 ? (item.total / totalIncome) * 100 : 0;
        return {
          ...item,
          color: CHART_COLORS[index % CHART_COLORS.length],
          pctOfIncome,
        };
      });

    return {
      totalIncome,
      totalExpense,
      remaining,
      expensePctOfIncome,
      rows,
    };
  }, [summary]);

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const saveIncome = useCallback(async () => {
    clearMessages();
    const normalized = formatMoneyInput(incomeDraft);
    setIncomeDraft(normalized);
    const amount = parseAmount(normalized);

    if (!Number.isFinite(amount) || amount < 0) {
      setError("Renda invalida (use um numero >= 0).");
      return;
    }

    setSavingIncome(true);
    try {
      await setMonthlyIncome({ year, month, amount });
      setSuccess("Renda mensal salva com sucesso.");
      await loadOverview(year, month);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao salvar renda.");
    } finally {
      setSavingIncome(false);
    }
  }, [clearMessages, incomeDraft, year, month, loadOverview]);

  const saveGoalTarget = useCallback(async () => {
    clearMessages();
    const normalized = formatMoneyInput(goalTargetDraft);
    setGoalTargetDraft(normalized);
    const targetAmount = parseAmount(normalized);

    if (!Number.isFinite(targetAmount) || targetAmount < 0) {
      setError("Meta invalida (use um numero >= 0).");
      return;
    }

    setSavingGoal(true);
    try {
      await setMonthlyGoal({ year, month, targetAmount });
      setSuccess("Meta mensal salva com sucesso.");
      await loadOverview(year, month);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao salvar meta.");
    } finally {
      setSavingGoal(false);
    }
  }, [clearMessages, goalTargetDraft, year, month, loadOverview]);

  const addSavingEntry = useCallback(async () => {
    clearMessages();
    const normalized = formatMoneyInput(goalSavedDraft);
    setGoalSavedDraft(normalized);
    const amount = parseAmount(normalized);
    const description = goalSavedDescDraft.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Valor guardado invalido (use um numero > 0).");
      return;
    }
    if (!description) {
      setError("Descricao e obrigatoria.");
      return;
    }
    if (description.length > 200) {
      setError("Descricao muito longa (maximo 200 caracteres).");
      return;
    }

    setSavingGoal(true);
    try {
      await addMonthlyGoalSaving({ year, month, amount, description });
      setGoalSavedDraft("0.00");
      setGoalSavedDescDraft("");
      setSuccess("Entrada de guardado adicionada.");
      await loadOverview(year, month);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao salvar guardado.");
    } finally {
      setSavingGoal(false);
    }
  }, [clearMessages, goalSavedDraft, goalSavedDescDraft, year, month, loadOverview]);
  const startEditSaving = useCallback((id: string, amount: number, description: string) => {
    setEditingSavingId(id);
    setEditSavingAmountDraft((amount ?? 0).toFixed(2));
    setEditSavingDescDraft(description ?? "");
  }, []);

  const saveEditingSaving = useCallback(async () => {
    if (!editingSavingId) return;

    clearMessages();
    const normalized = formatMoneyInput(editSavingAmountDraft);
    setEditSavingAmountDraft(normalized);
    const amount = parseAmount(normalized);
    const description = editSavingDescDraft.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Valor invalido (use um numero > 0).");
      return;
    }
    if (!description) {
      setError("Descricao e obrigatoria.");
      return;
    }
    if (description.length > 200) {
      setError("Descricao muito longa (maximo 200 caracteres).");
      return;
    }

    setSavingEditedGoalItem(true);
    try {
      await updateMonthlyGoalSaving(editingSavingId, { amount, description });
      cancelEditSaving();
      setSuccess("Entrada de guardado atualizada.");
      await loadOverview(year, month);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao editar guardado.");
    } finally {
      setSavingEditedGoalItem(false);
    }
  }, [editingSavingId, clearMessages, editSavingAmountDraft, editSavingDescDraft, cancelEditSaving, loadOverview, month, year]);

  const removeSaving = useCallback(
    async (id: string) => {
      clearMessages();
      setDeletingGoalItemId(id);
      try {
        await deleteMonthlyGoalSaving(id);
        if (editingSavingId === id) cancelEditSaving();
        setSuccess("Entrada de guardado excluida.");
        await loadOverview(year, month);
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Erro ao excluir guardado.");
      } finally {
        setDeletingGoalItemId(null);
      }
    },
    [clearMessages, editingSavingId, cancelEditSaving, loadOverview, month, year]
  );

  const saveBudget = useCallback(
    async (categoryId: string) => {
      clearMessages();
      const raw = budgetDrafts[categoryId] ?? "0.00";
      const amount = parseAmount(raw);

      if (!Number.isFinite(amount) || amount < 0) {
        setError("Orcamento invalido (use um numero >= 0).");
        return;
      }

      setSavingBudgetId(categoryId);
      try {
        await upsertBudget({ year, month, categoryId, amount });
        setSuccess("Orcamento atualizado.");
        await loadOverview(year, month);
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Erro ao salvar orcamento.");
      } finally {
        setSavingBudgetId(null);
      }
    },
    [clearMessages, budgetDrafts, year, month, loadOverview]
  );

  const setBudgetDraft = useCallback((categoryId: string, value: string) => {
    setBudgetDrafts((current) => ({
      ...current,
      [categoryId]: value,
    }));
  }, []);

  return (
    <div className="cf-page cfx-overview">
      <style>{`
        .cfx-overview {
          --ov-bg: linear-gradient(155deg, #f8fbff 0%, #f4f6fa 45%, #eef3f8 100%);
          --ov-card: #ffffff;
          --ov-border: #e8edf4;
          --ov-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          min-height: 100%;
          background: var(--ov-bg);
          border-radius: 1rem;
          padding: 1.2rem;
        }
        .cfx-overview .cfx-block {
          background: var(--ov-card);
          border: 1px solid var(--ov-border);
          box-shadow: var(--ov-shadow);
          border-radius: 16px;
        }
        .cfx-overview .cfx-kpi {
          border-radius: 14px;
          border: 1px solid var(--ov-border);
          padding: 0.9rem;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          height: 100%;
        }
        .cfx-overview .cfx-kpi-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 0.1rem;
        }
        .cfx-overview .cfx-kpi-value {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
        }
        .cfx-overview .cfx-flow-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.65rem;
          background: #ffffff;
        }
        .cfx-overview .cfx-flow-svg {
          width: 100%;
          height: 220px;
          display: block;
        }
        .cfx-overview .cfx-flow-label {
          font-size: 0.78rem;
          color: #64748b;
        }
        .cfx-overview .cfx-flow-summary {
          border: 1px solid #dbeafe;
          background: linear-gradient(180deg, #eff6ff 0%, #e0f2fe 100%);
          color: #0f172a;
          border-radius: 10px;
          padding: 0.4rem 0.65rem;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .cfx-overview .cfx-income-consume {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fbff;
          padding: 0.8rem;
        }
        .cfx-overview .cfx-category-progress {
          height: 8px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }
        .cfx-overview .cfx-category-progress-fill {
          height: 100%;
          border-radius: 999px;
        }
        .cfx-overview .cfx-top-period .card {
          margin-bottom: 0;
          height: 100%;
        }
        .cfx-overview .cfx-income-card {
          border: 1px solid var(--ov-border);
          box-shadow: var(--ov-shadow);
          border-radius: 16px;
          background: #ffffff;
          height: 100%;
        }
        .cfx-overview .cfx-income-inline {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          column-gap: 0.7rem;
          align-items: end;
        }
        .cfx-overview .cfx-income-inline .cfx-income-field {
          min-width: 0;
        }
        .cfx-overview .cfx-income-inline .cfx-income-action {
          min-width: 0;
          white-space: nowrap;
          padding-left: 1rem;
          padding-right: 1rem;
        }
        .cfx-overview .cfx-table-wrap {
          max-height: 360px;
          overflow: auto;
        }
        .cfx-overview .cfx-footer {
          margin-top: 1.1rem;
          text-align: center;
          color: #64748b;
          font-size: 0.84rem;
        }
        .cfx-overview .cfx-footer a {
          color: #2563eb;
          text-decoration: none;
        }
        .cfx-overview .cfx-footer a:hover {
          text-decoration: underline;
        }
        @media (max-width: 991.98px) {
          .cfx-overview {
            padding: 0.6rem;
            border-radius: 0.75rem;
          }
          .cfx-overview .cfx-income-inline {
            grid-template-columns: 1fr;
            row-gap: 0.7rem;
          }
          .cfx-overview .cfx-income-inline .cfx-income-action {
            width: 100%;
          }
        }
      `}</style>

      <PageHeader
        title="Visao Geral"
        subtitle="Dashboard mensal de performance financeira, categorias e metas."
        actions={
          <Link className="btn btn-outline-primary" to={`/transactions?year=${year}&month=${month}`}>
            Ver lancamentos do mes
          </Link>
        }
      />

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-8 cfx-top-period">
          <MonthYearPicker
            year={year}
            month={month}
            periodLabel={periodLabel}
            onYearChange={setYear}
            onMonthChange={setMonth}
          />
        </div>
        <div className="col-12 col-xl-4">
          <div className="cfx-income-card p-3">
            <h2 className="h6 mb-3">Renda mensal fixa</h2>
            <div className="cfx-income-inline">
              <div className="cfx-income-field">
                <label htmlFor="income" className="form-label">
                  Valor
                </label>
                <MoneyInput id="income" value={incomeDraft} onChange={setIncomeDraft} />
              </div>
              <button
                type="button"
                className="btn btn-primary cfx-income-action"
                disabled={savingIncome}
                onClick={saveIncome}
              >
                {savingIncome ? "Salvando..." : "Salvar renda"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      {loading ? <LoadingState /> : null}

      {summary ? (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-xl-3">
              <div className="cfx-kpi">
                <p className="cfx-kpi-label">Receitas</p>
                <p className="cfx-kpi-value text-success">{formatBRL(summary.income)}</p>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="cfx-kpi">
                <p className="cfx-kpi-label">Despesas</p>
                <p className="cfx-kpi-value text-danger">{formatBRL(summary.expense)}</p>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="cfx-kpi">
                <p className="cfx-kpi-label">Investimentos</p>
                <p className="cfx-kpi-value text-info">{formatBRL(goalStats.savedAmount)}</p>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="cfx-kpi">
                <p className="cfx-kpi-label">Saldo</p>
                <p className={`cfx-kpi-value ${summary.balance >= 0 ? "text-success" : "text-danger"}`}>{formatBRL(summary.balance)}</p>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-xl-7">
              <div className="cfx-block p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h2 className="h6 m-0">Fluxo diario do saldo acumulado</h2>
                  {activeFlowPoint ? (
                    <div className="cfx-flow-summary">
                      Dia {activeFlowPoint.day} | Saldo {formatBRL(activeFlowPoint.balanceAcc)} | Receita {formatBRL(activeFlowPoint.incomeAcc)} | Despesa {formatBRL(activeFlowPoint.expenseAcc)}
                    </div>
                  ) : null}
                </div>

                {!transactions.length ? (
                  <div className="py-5">
                    <EmptyState message="Sem dados de transacao no periodo para montar o grafico." />
                  </div>
                ) : (
                  <div className="cfx-flow-wrap">
                    <svg className="cfx-flow-svg" viewBox={`0 0 ${dailyFlow.svgWidth} ${dailyFlow.svgHeight}`} preserveAspectRatio="none">
                      <line
                        x1="0"
                        y1={dailyFlow.zeroLineY}
                        x2={dailyFlow.svgWidth}
                        y2={dailyFlow.zeroLineY}
                        stroke="#cbd5e1"
                        strokeDasharray="4 4"
                      />
                      <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={dailyFlow.balancePolyline}
                      />
                      {activeFlowPoint ? (
                        <>
                          <line
                            x1={activeFlowPoint.x}
                            y1={0}
                            x2={activeFlowPoint.x}
                            y2={dailyFlow.svgHeight}
                            stroke="#93c5fd"
                            strokeDasharray="4 4"
                          />
                          <circle cx={activeFlowPoint.x} cy={activeFlowPoint.y} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
                        </>
                      ) : null}
                      {dailyFlow.points.map((point, index) => {
                        const prevX = index === 0 ? 0 : (point.x + dailyFlow.points[index - 1].x) / 2;
                        const nextX = index === dailyFlow.points.length - 1 ? dailyFlow.svgWidth : (point.x + dailyFlow.points[index + 1].x) / 2;
                        return (
                          <rect
                            key={point.day}
                            x={prevX}
                            y={0}
                            width={Math.max(1, nextX - prevX)}
                            height={dailyFlow.svgHeight}
                            fill="transparent"
                            onMouseEnter={() => setActiveFlowDay(point.day)}
                            onTouchStart={() => setActiveFlowDay(point.day)}
                          />
                        );
                      })}
                    </svg>
                    <div className="d-flex justify-content-between mt-2 cfx-flow-label">
                      <span>Dia 1</span>
                      <span>Dia {Math.ceil(dailyFlow.daysInMonth / 2)}</span>
                      <span>Dia {dailyFlow.daysInMonth}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-xl-5">
              <div className="cfx-block p-3 h-100">
                <h2 className="h6 mb-3">Despesas por categoria consumindo receita</h2>
                {!expenseByCategoryFromIncome.rows.length ? (
                  <div className="py-5">
                    <EmptyState message="Sem despesas por categoria neste periodo." />
                  </div>
                ) : (
                  <>
                    <div className="cfx-income-consume mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-secondary">Receita total</span>
                        <strong>{formatBRL(expenseByCategoryFromIncome.totalIncome)}</strong>
                      </div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-secondary">Despesas totais</span>
                        <strong className="text-danger">{formatBRL(expenseByCategoryFromIncome.totalExpense)}</strong>
                      </div>
                      <div className="d-flex justify-content-between small">
                        <span className="text-secondary">Saldo restante da receita</span>
                        <strong className={expenseByCategoryFromIncome.remaining >= 0 ? "text-success" : "text-danger"}>
                          {formatBRL(expenseByCategoryFromIncome.remaining)}
                        </strong>
                      </div>

                      <div className="progress mt-2" style={{ height: 8 }}>
                        <div
                          className={`progress-bar ${expenseByCategoryFromIncome.expensePctOfIncome > 100 ? "bg-danger" : "bg-primary"}`}
                          style={{ width: `${Math.min(expenseByCategoryFromIncome.expensePctOfIncome, 100)}%` }}
                          role="progressbar"
                          aria-valuenow={Math.min(expenseByCategoryFromIncome.expensePctOfIncome, 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <div className="small text-secondary mt-1">
                        Consumo da receita: {expenseByCategoryFromIncome.expensePctOfIncome.toFixed(1)}%
                      </div>
                    </div>

                    <ul className="list-group list-group-flush">
                      {expenseByCategoryFromIncome.rows.map((item) => {
                        const pct = clampPct(item.pctOfIncome);
                        return (
                          <li key={item.category} className="list-group-item px-0">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="d-inline-flex align-items-center gap-2">
                                <span style={{ width: 10, height: 10, borderRadius: 999, background: item.color }} />
                                <span>{item.category}</span>
                              </span>
                              <span className="fw-semibold">{formatBRL(item.total)}</span>
                            </div>
                            <div className="cfx-category-progress">
                              <div
                                className="cfx-category-progress-fill"
                                style={{ width: `${pct}%`, background: item.color }}
                              />
                            </div>
                            <div className="small text-secondary mt-1">{item.pctOfIncome.toFixed(1)}% da receita</div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <div className="cfx-block p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h2 className="h6 m-0">Ultimos lancamentos</h2>
                  <Link className="btn btn-sm btn-outline-secondary" to={`/transactions?year=${year}&month=${month}`}>
                    Abrir tela completa
                  </Link>
                </div>

                {!latestTransactions.length ? (
                  <div className="py-4">
                    <EmptyState message="Nenhuma transacao no periodo. O layout permanece pronto para novos dados." />
                  </div>
                ) : (
                  <div className="table-responsive cfx-table-wrap">
                    <table className="table align-middle cf-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Descricao</th>
                          <th>Categoria</th>
                          <th>Tipo</th>
                          <th className="text-end">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestTransactions.map((item) => (
                          <tr key={item.id}>
                            <td>{item.date}</td>
                            <td>{item.description ?? "-"}</td>
                            <td>{item.categoryName ?? "Sem categoria"}</td>
                            <td>
                              <span className={`badge ${item.type === 1 ? "text-bg-success" : "text-bg-danger"}`}>
                                {item.type === 1 ? "Receita" : "Despesa"}
                              </span>
                            </td>
                            <td className={`text-end fw-semibold ${item.type === 1 ? "text-success" : "text-danger"}`}>
                              {formatBRL(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12">
              <div className="cfx-block p-3 h-100">
                <h2 className="h6 mb-3">Meta de economia</h2>

                <div className="row g-2 align-items-end mb-3">
                  <div className="col-12 col-md-5">
                    <label htmlFor="targetAmount" className="form-label">
                      Meta (R$)
                    </label>
                    <MoneyInput id="targetAmount" value={goalTargetDraft} onChange={setGoalTargetDraft} />
                  </div>
                  <div className="col-12 col-md-3">
                    <button type="button" className="btn btn-outline-primary w-100" onClick={saveGoalTarget} disabled={savingGoal}>
                      {savingGoal ? "Salvando..." : "Salvar meta"}
                    </button>
                  </div>
                  <div className="col-12 col-md-4 text-md-end">
                    <span className="badge text-bg-light">Total guardado: {formatBRL(goalStats.savedAmount)}</span>
                  </div>
                </div>

                <div className="row g-2 align-items-end mb-3">
                  <div className="col-12 col-md-3">
                    <label htmlFor="savedAmount" className="form-label">
                      Guardado
                    </label>
                    <MoneyInput id="savedAmount" value={goalSavedDraft} onChange={setGoalSavedDraft} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="savedDescription" className="form-label">
                      Descricao
                    </label>
                    <input
                      id="savedDescription"
                      className="form-control"
                      value={goalSavedDescDraft}
                      maxLength={200}
                      onChange={(event) => setGoalSavedDescDraft(event.target.value)}
                      placeholder="Ex: aporte mensal"
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <button type="button" className="btn btn-primary w-100" onClick={addSavingEntry} disabled={savingGoal}>
                      {savingGoal ? "Salvando..." : "Adicionar"}
                    </button>
                  </div>
                </div>

                <div className="progress mb-2" style={{ height: 8 }}>
                  <div
                    className={`progress-bar ${goalStats.reached ? "bg-success" : "bg-info"}`}
                    style={{ width: `${goalStats.pct}%` }}
                    role="progressbar"
                    aria-valuenow={goalStats.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>

                <div className="small text-secondary mb-3">
                  Meta: <strong>{formatBRL(goalStats.targetAmount)}</strong>{" "}
                  {goalStats.targetAmount === 0
                    ? "defina uma meta para ver o progresso."
                    : goalStats.reached
                      ? "meta atingida."
                      : `faltam ${formatBRL(goalStats.remaining)}.`}
                </div>

                <h3 className="h6">Entradas guardadas</h3>
                {!goal?.savings?.length ? (
                  <EmptyState message="Nenhuma entrada de guardado ainda." />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle cf-table">
                      <thead>
                        <tr>
                          <th>Valor</th>
                          <th>Descricao</th>
                          <th>Data</th>
                          <th className="text-end">Acoes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {goal.savings.map((item) => {
                          const editing = editingSavingId === item.id;
                          return (
                            <tr key={item.id}>
                              <td style={{ minWidth: 160 }}>
                                {editing ? (
                                  <MoneyInput value={editSavingAmountDraft} onChange={setEditSavingAmountDraft} />
                                ) : (
                                  <span className="fw-semibold">{formatBRL(item.amount)}</span>
                                )}
                              </td>
                              <td style={{ minWidth: 240 }}>
                                {editing ? (
                                  <>
                                    <input
                                      className="form-control"
                                      value={editSavingDescDraft}
                                      maxLength={200}
                                      onChange={(event) => setEditSavingDescDraft(event.target.value)}
                                    />
                                  </>
                                ) : (
                                  item.description
                                )}
                              </td>
                              <td className="small text-secondary">{formatDateTimeBR(item.createdAtUtc)}</td>
                              <td className="text-end">
                                {!editing ? (
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary"
                                      title="Editar"
                                      aria-label="Editar"
                                      onClick={() => startEditSaving(item.id, item.amount, item.description)}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger"
                                      title="Excluir"
                                      aria-label="Excluir"
                                      onClick={() => void removeSaving(item.id)}
                                      disabled={deletingGoalItemId === item.id}
                                    >
                                      {deletingGoalItemId === item.id ? "..." : "🗑️"}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      type="button"
                                      className="btn btn-success"
                                      onClick={() => void saveEditingSaving()}
                                      disabled={savingEditedGoalItem}
                                    >
                                      {savingEditedGoalItem ? "Salvando..." : "Salvar"}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={cancelEditSaving}>
                                      Cancelar
                                    </button>
                                  </div>
                                )}
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

          <div className="row g-3 mt-1">
            <div className="col-12">
              <div className="cfx-block p-3">
                <h2 className="h6 mb-3">Orcamento por categoria (despesas)</h2>
                {!expenseCategories.length ? (
                  <EmptyState message="Voce ainda nao tem categorias de despesa. Crie em Categorias." />
                ) : (
                  <div className="table-responsive">
                    <table className="table cf-table">
                      <thead>
                        <tr>
                          <th>Categoria</th>
                          <th>Gasto</th>
                          <th>Orcamento</th>
                          <th>Uso</th>
                          <th className="text-end">Editar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetRows.map((row) => {
                          const pct = clampPct(row.pct);
                          const exceeded = row.budget > 0 && row.spent > row.budget;
                          return (
                            <tr key={row.categoryId}>
                              <td className="fw-semibold">{row.categoryName}</td>
                              <td>{formatBRL(row.spent)}</td>
                              <td>{formatBRL(row.budget)}</td>
                              <td style={{ minWidth: 200 }}>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="progress flex-grow-1" style={{ height: 8 }}>
                                    <div
                                      className={`progress-bar ${exceeded ? "bg-danger" : "bg-primary"}`}
                                      style={{ width: `${pct}%` }}
                                      role="progressbar"
                                      aria-valuenow={pct}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    />
                                  </div>
                                  <span className={`small fw-semibold ${exceeded ? "text-danger" : "text-secondary"}`}>{pct.toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="text-end" style={{ minWidth: 200 }}>
                                <div className="d-flex gap-2 justify-content-end">
                                  <MoneyInput
                                    value={budgetDrafts[row.categoryId] ?? "0.00"}
                                    className="form-control form-control-sm"
                                    onChange={(value) => setBudgetDraft(row.categoryId, value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={savingBudgetId === row.categoryId}
                                    onClick={() => void saveBudget(row.categoryId)}
                                  >
                                    {savingBudgetId === row.categoryId ? "..." : "Salvar"}
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
        </>
      ) : null}

      <div className="cfx-footer">
        Criado por: Gustavo Soares | LinkedIn:{" "}
        <a href="https://www.linkedin.com/in/gustavoslv/" target="_blank" rel="noreferrer">
          https://www.linkedin.com/in/gustavoslv/
        </a>
      </div>
    </div>
  );
}
