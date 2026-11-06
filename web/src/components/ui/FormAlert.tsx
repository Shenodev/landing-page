import { cn } from "@/lib/utils";

type FormAlertProps = {
  tone: "success" | "error";
  children: React.ReactNode;
  className?: string;
};

export const FormAlert = ({ tone, children, className }: FormAlertProps) => (
  <div
    role={tone === "error" ? "alert" : "status"}
    className={cn(
      "px-4 py-3 rounded-xl border text-body-sm leading-[20px] font-medium",
      tone === "success" && "bg-primary/10 border-primary/30 text-primary",
      tone === "error" && "bg-error-container/20 border-error/30 text-error",
      className,
    )}
  >
    {children}
  </div>
);