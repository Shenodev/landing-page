import Link from "next/link";
import { BreadcrumbJsonLd, type Crumb } from "@/components/seo/JsonLd";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type BreadcrumbsProps = {
  trail: readonly Crumb[];
  className?: string;
};

/** Visible breadcrumb trail (Home / Current) with matching JSON-LD. */
export const Breadcrumbs = ({ trail, className }: BreadcrumbsProps) => (
  <>
    <BreadcrumbJsonLd trail={trail} />
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center justify-center gap-1.5 text-label-sm text-on-surface-variant">
        <li className="flex items-center gap-1.5">
          <Link href="/" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            Home
          </Link>
        </li>
        {trail.map((crumb) => (
          <li key={crumb.label} className="flex items-center gap-1.5">
            <MaterialIcon name="chevron_right" className="text-sm text-outline" />
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-on-surface font-medium">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  </>
);
