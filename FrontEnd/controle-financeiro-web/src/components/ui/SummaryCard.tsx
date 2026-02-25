import { formatBRL } from "../../utils/format";

type SummaryCardProps = {
  title: string;
  value: number;
  tone?: "default" | "positive" | "negative";
};

export function SummaryCard({ title, value, tone = "default" }: SummaryCardProps) {
  const toneClass =
    tone === "positive" ? "text-success" : tone === "negative" ? "text-danger" : "text-primary-emphasis";

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body">
        <div className="text-secondary small mb-2">{title}</div>
        <div className={`h4 mb-0 fw-bold ${toneClass}`}>{formatBRL(value)}</div>
      </div>
    </div>
  );
}
