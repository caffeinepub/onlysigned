import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
/**
 * Admin Support Log Tab — view all support form submissions, expand, mark as reviewed.
 */
import { useState } from "react";
import { useActor } from "../../hooks/useActor";
import { formatDate, formatPrincipal, truncateText } from "../../lib/utils";

function actorCall<T>(
  actor: unknown,
  method: string,
  ...args: unknown[]
): Promise<T> {
  const a = actor as Record<string, (...x: unknown[]) => Promise<T>>;
  if (!a[method]) throw new Error(`Actor method ${method} not available`);
  return a[method](...args);
}

interface SupportSubmission {
  id: string;
  subject: string;
  message: string;
  contactEmail?: string[];
  submittedBy: string;
  timestamp: bigint | number;
}

export default function AdminSupportLogTab() {
  const { actor, isFetching } = useActor();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const { data: rawSubmissions, isLoading } = useQuery({
    queryKey: ["admin", "supportSubmissions"],
    queryFn: () => actorCall(actor, "getAllSupportSubmissions"),
    enabled: !!actor && !isFetching,
  });

  const submissions = (
    Array.isArray(rawSubmissions)
      ? ([...rawSubmissions] as SupportSubmission[])
      : []
  ).sort((a, b) => {
    const aT =
      typeof a.timestamp === "bigint" ? Number(a.timestamp) : a.timestamp;
    const bT =
      typeof b.timestamp === "bigint" ? Number(b.timestamp) : b.timestamp;
    return bT - aT;
  });

  const unreviewedCount = submissions.filter((s) => !reviewed.has(s.id)).length;

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function markReviewed(id: string) {
    setReviewed((prev) => new Set([...prev, id]));
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="rounded-md bg-muted/40 px-4 py-2">
          <span className="text-sm text-muted-foreground">Total: </span>
          <span className="font-semibold text-foreground">
            {submissions.length}
          </span>
        </div>
        {unreviewedCount > 0 && (
          <div className="rounded-md bg-accent/10 px-4 py-2">
            <span className="text-sm text-accent">Unreviewed: </span>
            <span className="font-semibold text-accent">{unreviewedCount}</span>
          </div>
        )}
      </div>

      {/* Submission list */}
      {isLoading ? (
        <div className="space-y-3">
          {["s1", "s2", "s3", "s4", "s5"].map((k) => (
            <Skeleton key={k} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">No support submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const isExpanded = expanded.has(sub.id);
            const isReviewed = reviewed.has(sub.id);
            const email = Array.isArray(sub.contactEmail)
              ? sub.contactEmail[0]
              : sub.contactEmail;

            return (
              <div
                key={sub.id}
                className={`rounded-lg border bg-card transition-colors ${
                  isReviewed
                    ? "border-border opacity-60"
                    : "border-border hover:border-accent/30"
                }`}
                data-ocid="admin-support-row"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => toggleExpand(sub.id)}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {sub.subject}
                      </span>
                      {isReviewed && (
                        <Badge
                          variant="outline"
                          className="border-accent/30 text-accent text-xs"
                        >
                          Reviewed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {truncateText(sub.message, 80)}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>By {formatPrincipal(sub.submittedBy)}</span>
                      {email && <span>• {email}</span>}
                      <span>• {formatDate(sub.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!isReviewed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 text-xs text-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          markReviewed(sub.id);
                        }}
                        data-ocid="admin-mark-reviewed-btn"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Mark reviewed
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                      {sub.message}
                    </p>
                    {email && (
                      <p className="mt-3 text-sm">
                        <span className="text-muted-foreground">
                          Reply to:{" "}
                        </span>
                        <a
                          href={`mailto:${email}`}
                          className="text-accent hover:underline"
                        >
                          {email}
                        </a>
                      </p>
                    )}
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      Principal: {sub.submittedBy}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
