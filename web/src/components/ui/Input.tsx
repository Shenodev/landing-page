import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full bg-surface-container-lowest/80 border rounded-lg px-4 py-3 text-body-md text-on-surface placeholder-outline focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none",
        invalid ? "border-error" : "border-outline-variant/40",
        className,
      )}
      {...(invalid ? { "aria-invalid": true } : {})}
      {...props}
    />
  );
});