import { cn } from "@/lib/utils";

type MaterialIconProps = {
  name: string;
  filled?: boolean;
  className?: string;
};

export const MaterialIcon = ({ name, filled = false, className }: MaterialIconProps) => (
  <span
    className={cn("material-symbols-outlined shrink-0", className)}
    style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}` }}
    aria-hidden="true"
  >
    {name}
  </span>
);