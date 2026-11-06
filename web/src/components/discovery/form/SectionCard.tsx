import { cn } from "@/lib/utils";

type SectionCardProps = {
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
};

export const SectionCard = ({ step, title, subtitle, children, required = false, className }: SectionCardProps) => (
  <section
    className={cn(
      "relative bg-surface/80 backdrop-blur-md border border-white/10 hover:border-primary/40 transition-colors duration-200 p-6 md:p-10 rounded-xl space-y-6",
      className,
    )}
  >
    <header className="flex items-center justify-between pb-4 border-b border-white/10">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-dim text-primary font-bold text-sm border border-white/10">
          {step}
        </span>
        <div>
          <h2 className="text-title-md text-on-surface">{title}</h2>
          {subtitle && <p className="text-body-sm text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {required && (
        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md">Required</span>
      )}
    </header>
    {children}
  </section>
);