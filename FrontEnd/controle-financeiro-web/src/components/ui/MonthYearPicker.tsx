type MonthYearPickerProps = {
  year: number;
  month: number;
  periodLabel: string;
  onYearChange: (nextYear: number) => void;
  onMonthChange: (nextMonth: number) => void;
  onRefresh?: () => void;
};

export function MonthYearPicker({
  year,
  month,
  periodLabel,
  onYearChange,
  onMonthChange,
  onRefresh,
}: MonthYearPickerProps) {
  return (
    <div className="card shadow-sm border-0 mb-3">
      <div className="card-body py-3">
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">
          <div className="d-flex flex-wrap align-items-end gap-3">
            <div style={{ minWidth: 140 }}>
              <label htmlFor="month" className="form-label">
                Mes
              </label>
              <input
                id="month"
                className="form-control"
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => onMonthChange(Number(event.target.value))}
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <label htmlFor="year" className="form-label">
                Ano
              </label>
              <input
                id="year"
                className="form-control"
                type="number"
                value={year}
                onChange={(event) => onYearChange(Number(event.target.value))}
              />
            </div>

            {onRefresh ? (
              <button type="button" className="btn btn-outline-secondary px-3" onClick={onRefresh}>
                Atualizar
              </button>
            ) : null}
          </div>
          <div
            className="text-muted fw-semibold px-3 py-2 rounded-3"
            style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)", border: "1px solid #e2e8f0" }}
          >
            {periodLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
