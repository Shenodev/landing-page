import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-xl transition-colors duration-200", {
  variants: {
    intent: {
      default: "bg-surface/80 border border-white/10 backdrop-blur-md",
      highlighted:
        "relative bg-surface/90 border border-primary/40 backdrop-blur-lg glow-cyan-card",
      elevated: "bg-surface/90 border border-white/10 shadow-xl backdrop-blur-xl",
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