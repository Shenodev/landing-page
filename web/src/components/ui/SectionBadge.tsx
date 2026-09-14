import { cn } from "@/lib/utils";

type SectionBadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionBadge = ({ children, className }: SectionBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-primary text-label-sm uppercase tracking-wider",
      className,
    )}
  >
    {children}
  </span>
);