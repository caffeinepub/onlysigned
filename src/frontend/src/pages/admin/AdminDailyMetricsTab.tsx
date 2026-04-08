/**
 * Admin Daily Metrics Tab — today's metrics and full historical table.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  BarChart2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAllDailyMetrics, useDailyMetrics } from "../../hooks/useQueries";

interface DailyMetric {
  date?: string;
  newUsers?: bigint | number;
  assetsUploaded?: bigint | number;
  signedCopiesCreated?: bigint | number;
  salesCompleted?: bigint | number;
  totalVolume?: bigint | number;
}

function toNum(v: bigint | number | undefined): number {
  if (v === undefined) return 0;
  return typeof v === "bigint" ? Number(v) : v;
}

const TODAY_STAT_CARDS = [
  { key: "newUsers", label: "New Users", icon: Users, color: "text-accent" },
  {
    key: "assetsUploaded",
    label: "Assets Uploaded",
    icon: BarChart2,
    color: "text-primary",
  },
  {
    key: "signedCopiesCreated",
    label: "Signed Copies",
    icon: Award,
    color: "text-chart-2",
  },
  {
    key: "salesCompleted",
    label: "Sales Completed",
    icon: ShoppingCart,
    color: "text-chart-5",
  },
  {
    key: "totalVolume",
    label: "Transaction Volume",
    icon: DollarSign,
    color: "text-chart-3",
  },
] as const;

export default function AdminDailyMetricsTab() {
  const { data: todayRaw, isLoading: todayLoading } = useDailyMetrics();
  const { data: allRaw, isLoading: allLoading } = useAllDailyMetrics();

  const today = (todayRaw ?? {}) as DailyMetric;
  const allMetrics = ((allRaw ?? []) as DailyMetric[]).slice().sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return a.date < b.date ? 1 : -1;
  });

  return (
    <div className="space-y-8">
      {/* Today */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Today's Metrics
          </h2>
          {today.date && (
            <span className="text-sm text-muted-foreground">{today.date}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {TODAY_STAT_CARDS.map(({ key, label, icon: Icon, color }) =>
            todayLoading ? (
              <Skeleton key={key} className="h-24 rounded-lg" />
            ) : (
              <Card key={key} className="border-border bg-card">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {label}
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold text-foreground">
                        {key === "totalVolume"
                          ? toNum(
                              today[key as keyof DailyMetric] as
                                | bigint
                                | number
                                | undefined,
                            ).toFixed(2)
                          : toNum(
                              today[key as keyof DailyMetric] as
                                | bigint
                                | number
                                | undefined,
                            ).toLocaleString()}
                      </p>
                    </div>
                    <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>

      {/* Historical table */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Historical Metrics
        </h2>
        {allLoading ? (
          <div className="space-y-2">
            {["m1", "m2", "m3", "m4", "m5", "m6", "m7"].map((k) => (
              <Skeleton key={k} className="h-10 w-full" />
            ))}
          </div>
        ) : allMetrics.length === 0 ? (
          <div
            className="rounded-lg border border-border bg-card px-6 py-12 text-center"
            data-ocid="admin-metrics-empty"
          >
            <p className="text-muted-foreground">
              No historical metrics data available yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  {[
                    "Date",
                    "New Users",
                    "Assets Uploaded",
                    "Signed Copies",
                    "Sales",
                    "Volume",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allMetrics.map((m, i) => (
                  <tr
                    key={m.date ?? String(i)}
                    className="transition-colors hover:bg-muted/20"
                    data-ocid="admin-metrics-row"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {m.date ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {toNum(m.newUsers).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {toNum(m.assetsUploaded).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {toNum(m.signedCopiesCreated).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {toNum(m.salesCompleted).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {toNum(m.totalVolume).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
