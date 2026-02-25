import { useMemo } from "react";
import { formatBRL } from "../../utils/format";

type ChartItem = {
  label: string;
  value: number;
};

type HorizontalBarChartProps = {
  items: ChartItem[];
  barClassName?: string;
};

export function HorizontalBarChart({ items, barClassName = "bg-primary" }: HorizontalBarChartProps) {
  const maxValue = useMemo(() => {
    if (!items.length) return 1;
    return Math.max(...items.map((item) => item.value), 1);
  }, [items]);

  return (
    <div className="d-flex flex-column gap-3">
      {items.map((item) => {
        const width = (item.value / maxValue) * 100;
        return (
          <div key={item.label}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-semibold">{item.label}</span>
              <span className="small text-secondary">{formatBRL(item.value)}</span>
            </div>
            <div className="progress cf-progress-thin">
              <div className={`progress-bar ${barClassName}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
