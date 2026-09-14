import { cn } from "@/lib/utils";

type FieldProps = {
  id?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export const Field = ({ id, label, hint, error, children, className }: FieldProps) => (
  <div className={cn("space-y-2", className)}>
    {label && (
      <label className="block text-label-md text-on-surface" htmlFor={id}>
        {label}
      </label>
    )}
    {children}
    {error && (
      <p className="text-[12px] text-error" role="alert">
        {error}
      </p>
    )}
    {hint && !error && <p className="text-[12px] text-outline">{hint}</p>}
  </div>
);