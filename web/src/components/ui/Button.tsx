import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary-container hover:bg-primary text-on-primary-container glow-button",
        outline:
          "bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/60 text-on-surface",
        ghost: "text-on-surface-variant hover:text-primary",
      },
      size: {
        md: "px-5 py-2.5",
        lg: "px-8 py-4 rounded-xl",
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