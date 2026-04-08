import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageScaffoldProps {
  title: string;
  description?: string;
  backHref?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function PageScaffold({
  title,
  description,
  backHref,
  breadcrumbs,
  actions,
  children,
  className,
}: PageScaffoldProps) {
  const router = useRouter();

  return (
    <div className={cn("max-w-5xl mx-auto", className)}>
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3 min-w-0">
          {(backHref || breadcrumbs) && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 mt-0.5 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]"
              onClick={() =>
                backHref
                  ? router.navigate({ to: backHref })
                  : router.history.back()
              }
              aria-label="Go back"
              data-ocid="page-back-btn"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>

      <Separator className="mb-6 opacity-40" />

      {children}
    </div>
  );
}
