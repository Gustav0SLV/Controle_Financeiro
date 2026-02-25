import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3">
      <div>
        <h1 className="h3 mb-1">{title}</h1>
        {subtitle ? <p className="text-secondary mb-0">{subtitle}</p> : null}
      </div>

      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
