import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-xl", {
  variants: {
    intent: {
      default: "bg-surface-container/70 border border-outline-variant/40 backdrop-blur-md",
      highlighted:
        "relative bg-surface-container/90 border border-primary-container/60 backdrop-blur-lg glow-cyan-card",
      elevated: "bg-surface-container/80 border border-primary-container/20 backdrop-blur-xl",
    },
  },
  defaultVariants: {
    intent: "default",
  },
});

export type CardProps = {
  className?: string;
  children?: React.ReactNode;
} & VariantProps<typeof cardVariants>;

export const Card = ({ intent = "default", className, children }: CardProps) => (
  <div className={cn(cardVariants({ intent }), className)}>{children}</div>
);