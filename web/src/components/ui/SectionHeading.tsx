import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export const SectionHeading = ({ badge, title, subtitle, children, className }: SectionHeadingProps) => (
  <div className={cn("text-center max-w-2xl mx-auto mb-12", className)}>
    {badge && <div className="mb-4">{badge}</div>}
    <h2 className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight mb-4">
      {title}
    </h2>
    {subtitle && <p className="text-body-md text-on-surface-variant">{subtitle}</p>}
    {children}
  </div>
);