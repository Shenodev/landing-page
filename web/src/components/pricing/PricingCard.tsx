import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { cn } from "@/lib/utils";

export type PricingCardData = {
  title: string;
  desc: string;
  price: string;
  features: readonly string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
};

export const PricingCard = ({ card }: { card: PricingCardData }) => (
  <Card
    intent={card.highlighted ? "highlighted" : "default"}
    className={cn(
      "relative p-8 flex flex-col justify-between",
      card.highlighted ? "md:-translate-y-2" : "hover:border-primary/40 transition-colors duration-200",
    )}
  >
    {card.badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-slate-950 text-xs font-bold px-3 py-1 rounded-full shadow-md">
        {card.badge}
      </div>
    )}
    <div>
      <h3 className="text-headline-sm font-semibold font-display text-on-surface mb-2 mt-1">{card.title}</h3>
      <p className="text-body-sm text-on-surface-variant mb-6">{card.desc}</p>
      <div className="mb-8">
        <span className="text-body-sm text-on-surface-variant block mb-1">Starting at</span>
        <div className="text-headline-md font-display text-primary font-bold">{card.price}</div>
      </div>
      <ul className="space-y-3 mb-8">
        {card.features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-body-sm text-on-surface">
            <MaterialIcon name="check_circle" filled={card.highlighted} className="text-primary text-base" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
    <Button href="/discovery" variant={card.highlighted ? "primary" : "outline"} className="w-full">
      {card.cta}
    </Button>
  </Card>
);