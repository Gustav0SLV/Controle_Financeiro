const API_BASE_URL = "http://localhost:5284";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  // Se não tem conteúdo, retorna null como T (seguro pro nosso uso)
  if (res.status === 204) return null as T;

  const text = await res.text();
  if (!text) return null as T;

  return JSON.parse(text) as T;
}

async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
}

export type MonthlySummary = {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  expensesByCategory: { category: string; total: number }[];
};

export async function getMonthlySummary(year: number, month: number) {
  return request<MonthlySummary>(`/api/summary/monthly?year=${year}&month=${month}`);
}

export type Transaction = {
  id: string;
  type: 1 | 2;
  amount: number;
  date: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
};

export async function getTransactions(year: number, month: number) {
  return request<Transaction[]>(`/api/transactions?year=${year}&month=${month}`);
}

export async function createTransaction(data: {
  type: 1 | 2;
  amount: number;
  year: number;
  month: number;
  day: number;
  categoryId: string | null;
  description?: string;
}) {
  return request<{ id: string }>(`/api/transactions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(
  id: string,
  data: {
    type: 1 | 2;
    amount: number;
    year: number;
    month: number;
    day: number;
    categoryId: string | null;
    description?: string;
  }
): Promise<void> {
  return requestVoid(`/api/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  return requestVoid(`/api/transactions/${id}`, { method: "DELETE" });
}

export type Category = {
  id: string;
  name: string;
  type: 1 | 2; // 1=Income, 2=Expense
};

export async function getCategories() {
  return request<Category[]>("/api/categories");
}

export async function createCategory(data: { name: string; type: 1 | 2 }) {
  return request(`/api/categories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string) {
  return requestVoid(`/api/categories/${id}`, { method: "DELETE" });
}

export type MonthlyIncome = {
  year: number;
  month: number;
  amount: number;
};

export async function getMonthlyIncome(year: number, month: number) {
  return request<MonthlyIncome>(`/api/income/monthly?year=${year}&month=${month}`);
}

export async function setMonthlyIncome(data: {
  year: number;
  month: number;
  amount: number;
}): Promise<void> {
  return requestVoid(`/api/income/monthly`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export type Budget = {
  categoryId: string;
  categoryName: string;
  amount: number; // orçamento
};

export async function getBudgets(year: number, month: number) {
  return request<Budget[]>(`/api/budgets?year=${year}&month=${month}`);
}

export async function upsertBudget(data: {
  year: number;
  month: number;
  categoryId: string;
  amount: number;
}): Promise<void> {
  return requestVoid(`/api/budgets`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export type MonthlyGoal = {
  year: number;
  month: number;
  targetAmount: number;
  savedAmount: number;
  savings: MonthlyGoalSaving[];
};

export async function getMonthlyGoal(year: number, month: number) {
  return request<MonthlyGoal>(`/api/goals/monthly?year=${year}&month=${month}`);
}

export async function setMonthlyGoal(data: {
  year: number;
  month: number;
  targetAmount: number;
}): Promise<void> {
  return requestVoid(`/api/goals/monthly`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export type MonthlyGoalSaving = {
  id: string;
  amount: number;
  description: string;
  createdAtUtc: string;
};

export async function addMonthlyGoalSaving(data: {
  year: number;
  month: number;
  amount: number;
  description: string;
}): Promise<void> {
  return requestVoid(`/api/goals/monthly/savings`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMonthlyGoalSaving(
  id: string,
  data: { amount: number; description: string }
): Promise<void> {
  return requestVoid(`/api/goals/monthly/savings/${id}`, {
    method: "PUT",
    body: JSON.stringify({ id, ...data }),
  });
}

export async function deleteMonthlyGoalSaving(id: string): Promise<void> {
  return requestVoid(`/api/goals/monthly/savings/${id}`, {
    method: "DELETE",
  });
}