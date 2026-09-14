import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-surface-container-lowest/80 border rounded-lg px-4 py-3 text-body-md text-on-surface placeholder-outline focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none resize-none",
        invalid ? "border-error" : "border-outline-variant/40",
        className,
      )}
      {...(invalid ? { "aria-invalid": true } : {})}
      {...props}
    />
  );
});