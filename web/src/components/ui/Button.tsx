import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary hover:bg-cyan-400 text-slate-950 font-bold glow-button",
        outline:
          "bg-surface hover:bg-surface-bright border border-white/10 hover:border-primary/40 text-on-surface",
        ghost: "text-on-surface-variant hover:text-primary hover:bg-surface/40",
      },
      size: {
        md: "px-5 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = {
  href?: string;
  external?: boolean;
  type?: "submit" | "reset" | "button";
  children?: React.ReactNode;
  className?: string;
} & VariantProps<typeof buttonVariants> &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type">;

export const Button = ({
  href,
  external = false,
  variant,
  size,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) => {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (href) {
    return external ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-disabled={props.disabled}
      >
        {children}
      </a>
    ) : (
      <Link href={href} className={classes} aria-disabled={props.disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
};