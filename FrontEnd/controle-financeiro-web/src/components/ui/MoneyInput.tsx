import { formatMoneyInput } from "../../utils/format";

type MoneyInputProps = {
  id?: string;
  value: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function MoneyInput({ id, value, placeholder, className, disabled, onChange }: MoneyInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={className ?? "form-control"}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => onChange(formatMoneyInput(value))}
    />
  );
}
