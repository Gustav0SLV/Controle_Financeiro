export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseAmount(value: string): number {
  const raw = (value ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;

  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    return Number(normalized);
  }

  return Number(cleaned);
}

export function formatMoneyInput(value: string): string {
  const amount = parseAmount(value);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
}

export function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function formatDateTimeBR(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR");
}

export function ymdFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseYMD(ymd: string): { year: number; month: number; day: number } {
  const [year, month, day] = ymd.split("-").map(Number);
  return { year, month, day };
}

export function clampDay(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(Math.max(day, 1), lastDay);
}
