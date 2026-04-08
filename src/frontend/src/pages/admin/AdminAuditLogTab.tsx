import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
/**
 * Admin Audit Log Tab — marketplace transactions with filtering, sorting, and pagination.
 */
import { useMemo, useState } from "react";
import { useActor } from "../../hooks/useActor";
import { formatDate, formatPrincipal } from "../../lib/utils";

function actorCall<T>(
  actor: unknown,
  method: string,
  ...args: unknown[]
): Promise<T> {
  const a = actor as Record<string, (...x: unknown[]) => Promise<T>>;
  if (!a[method]) throw new Error(`Actor method ${method} not available`);
  return a[method](...args);
}

interface Transaction {
  id: string;
  txType: string;
  from: string;
  to: string;
  amount: bigint | number;
  currency: string;
  itemId?: string;
  timestamp: bigint | number;
}

const TX_TYPES = [
  "All",
  "Sale",
  "Purchase",
  "Bid",
  "Royalty",
  "Withdrawal",
  "Deposit",
] as const;
type TxTypeFilter = (typeof TX_TYPES)[number];

const PAGE_SIZE = 50;

const TX_TYPE_COLORS: Record<string, string> = {
  Sale: "border-accent/40 text-accent",
  Purchase: "border-primary/40 text-primary",
  Bid: "border-chart-3/40 text-chart-3",
  Royalty: "border-chart-2/40 text-chart-2",
  Withdrawal: "border-destructive/40 text-destructive",
  Deposit: "border-chart-5/40 text-chart-5",
};

export default function AdminAuditLogTab() {
  const { actor, isFetching } = useActor();
  const [txFilter, setTxFilter] = useState<TxTypeFilter>("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(0);

  const { data: rawTxs, isLoading } = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: () => actorCall(actor, "getAllTransactions"),
    enabled: !!actor && !isFetching,
  });

  const allTxs = (rawTxs ?? []) as Transaction[];

  const filtered = useMemo(() => {
    let list =
      txFilter === "All" ? allTxs : allTxs.filter((t) => t.txType === txFilter);
    list = [...list].sort((a, b) => {
      const aT =
        typeof a.timestamp === "bigint" ? Number(a.timestamp) : a.timestamp;
      const bT =
        typeof b.timestamp === "bigint" ? Number(b.timestamp) : b.timestamp;
      return sortOrder === "newest" ? bT - aT : aT - bT;
    });
    return list;
  }, [allTxs, txFilter, sortOrder]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toNum(v: bigint | number): number {
    return typeof v === "bigint" ? Number(v) : v;
  }

  // Volume per currency
  const volumeByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of filtered) {
      const amt = typeof tx.amount === "bigint" ? Number(tx.amount) : tx.amount;
      if (!map[tx.currency]) map[tx.currency] = 0;
      map[tx.currency] += amt / 1e8;
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={txFilter}
          onValueChange={(v) => {
            setTxFilter(v as TxTypeFilter);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-44" data-ocid="admin-tx-filter">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {TX_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))
          }
          className="gap-2"
          data-ocid="admin-tx-sort"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Volume Summary */}
      {Object.keys(volumeByCurrency).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(volumeByCurrency).map(([currency, volume]) => (
            <div
              key={currency}
              className="rounded-md bg-muted/40 px-3 py-1.5 text-sm"
            >
              <span className="text-muted-foreground">Total {currency}: </span>
              <span className="font-mono font-medium text-foreground">
                {volume.toFixed(currency === "ckBTC" ? 6 : 2)} {currency}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"].map((k) => (
            <Skeleton key={k} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                {["Type", "From", "To", "Amount", "Item ID", "Timestamp"].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                paged.map((tx) => (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-muted/20"
                    data-ocid="admin-tx-row"
                  >
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${TX_TYPE_COLORS[tx.txType] ?? "border-border text-muted-foreground"}`}
                      >
                        {tx.txType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {formatPrincipal(tx.from)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {formatPrincipal(tx.to)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {(toNum(tx.amount) / 1e8).toFixed(4)} {tx.currency}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {tx.itemId ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                      {formatDate(tx.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
