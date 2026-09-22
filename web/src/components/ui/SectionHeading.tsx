import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Heading level for document outline (one h1 per page). Defaults to h2. */
  level?: 1 | 2;
};

export const SectionHeading = ({ badge, title, subtitle, children, className, level = 2 }: SectionHeadingProps) => {
  const TitleTag = level === 1 ? "h1" : "h2";
  return (
    <div className={cn("text-center max-w-2xl mx-auto mb-12", className)}>
      {badge && <div className="mb-4">{badge}</div>}
      <TitleTag className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight mb-4">
        {title}
      </TitleTag>
      {subtitle && <p className="text-body-md text-on-surface-variant">{subtitle}</p>}
      {children}
    </div>
  );
};