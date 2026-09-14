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
      "relative bg-surface-container-low/70 backdrop-blur-md border border-outline-variant/30 hover:border-primary/40 transition-colors p-6 md:p-10 rounded-xl space-y-6",
      className,
    )}
  >
    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
    <header className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-high text-primary text-sm border border-outline-variant/40">
          {step}
        </span>
        <div>
          <h2 className="text-title-md text-on-surface">{title}</h2>
          {subtitle && <p className="text-body-sm text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {required && (
        <span className="text-label-sm text-primary bg-primary/10 px-2.5 py-1 rounded">Required</span>
      )}
    </header>
    {children}
  </section>
);