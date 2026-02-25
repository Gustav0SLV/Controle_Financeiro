type ErrorAlertProps = {
  message: string;
};

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;
  return (
    <div className="alert alert-danger" role="alert">
      {message}
    </div>
  );
}

type SuccessAlertProps = {
  message: string;
};

export function SuccessAlert({ message }: SuccessAlertProps) {
  if (!message) return null;
  return (
    <div className="alert alert-success" role="alert">
      {message}
    </div>
  );
}

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Carregando..." }: LoadingStateProps) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-2">
      <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return <div className="text-secondary py-3">{message}</div>;
}
