/**
 * Admin Overview Tab — platform stats, cycles balance, canister ID, Reclaim Admin shortcut.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  Check,
  Copy,
  FolderOpen,
  Image,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import {
  useAdminStats,
  useCanisterId,
  useCyclesBalance,
  useReclaimAdmin,
} from "../../hooks/useQueries";
import { copyToClipboard, formatPrincipal } from "../../lib/utils";

interface StatsData {
  totalUsers?: bigint | number;
  totalAssets?: bigint | number;
  totalSignedCopies?: bigint | number;
  totalCollections?: bigint | number;
  cyclesBalance?: bigint | number;
}

const STAT_CARDS = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    color: "text-accent",
  },
  {
    key: "totalAssets",
    label: "Total Assets",
    icon: Image,
    color: "text-primary",
  },
  {
    key: "totalSignedCopies",
    label: "Signed Copies",
    icon: Award,
    color: "text-chart-2",
  },
  {
    key: "totalCollections",
    label: "Collections",
    icon: FolderOpen,
    color: "text-chart-5",
  },
] as const;

function toNum(v: bigint | number | undefined): number {
  if (v === undefined) return 0;
  return typeof v === "bigint" ? Number(v) : v;
}

function formatCycles(cycles: bigint | number | undefined): string {
  const n = toNum(cycles);
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  return n.toLocaleString();
}

function detectEnvCanisterId(): { id: string | null; method: string } {
  const v1 = import.meta.env.VITE_BACKEND_CANISTER_ID as string | undefined;
  if (v1) return { id: v1, method: "VITE_BACKEND_CANISTER_ID" };
  const v2 = import.meta.env.VITE_CANISTER_ID_BACKEND as string | undefined;
  if (v2) return { id: v2, method: "VITE_CANISTER_ID_BACKEND" };
  return { id: null, method: "not detected" };
}

export default function AdminOverviewTab() {
  const {
    data: stats,
    isLoading: statsLoading,
    refetch,
    isFetching: statsFetching,
  } = useAdminStats();
  const { data: cyclesRaw } = useCyclesBalance();
  const { data: canisterIdRaw } = useCanisterId();
  const reclaimAdmin = useReclaimAdmin();
  const { principal } = useAuth();
  const [copied, setCopied] = useState(false);

  const statsData = (stats ?? {}) as StatsData;
  const cycles = cyclesRaw ?? statsData.cyclesBalance;

  // Prefer backend-reported canister ID, fallback to env vars
  const backendId = typeof canisterIdRaw === "string" ? canisterIdRaw : null;
  const { id: envId, method: envMethod } = detectEnvCanisterId();
  const canisterId = backendId ?? envId;
  const detectionMethod = backendId
    ? "backend canister"
    : envId
      ? `env var (${envMethod})`
      : "not detected";

  const handleCopy = async () => {
    if (!canisterId) return;
    const ok = await copyToClipboard(canisterId);
    if (ok) {
      setCopied(true);
      toast.success("Canister ID copied");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy — please copy manually");
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Platform Statistics
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={statsFetching}
            data-ocid="admin-refresh-stats"
            className="gap-2 text-muted-foreground"
          >
            <RefreshCw
              className={`h-4 w-4 ${statsFetching ? "animate-spin" : ""}`}
            />
            {statsFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, color }) =>
            statsLoading ? (
              <Skeleton key={key} className="h-28 rounded-lg" />
            ) : (
              <Card key={key} className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="mt-1 font-display text-3xl font-bold text-foreground">
                        {toNum(
                          statsData[key as keyof StatsData],
                        ).toLocaleString()}
                      </p>
                    </div>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>

      {/* Cycles + Canister ID */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cycles Balance */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Cycles Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <p className="font-display text-3xl font-bold text-accent">
                {formatCycles(cycles)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Canister compute credits
            </p>
          </CardContent>
        </Card>

        {/* Canister ID */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Canister ID</CardTitle>
          </CardHeader>
          <CardContent>
            {canisterId ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <code className="flex-1 min-w-0 rounded bg-muted px-2 py-1.5 font-mono text-xs text-foreground break-all leading-relaxed">
                    {canisterId}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    aria-label="Copy canister ID"
                    data-ocid="admin-copy-canister-id"
                    className="h-8 w-8 shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-accent" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Detected via: {detectionMethod}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Canister ID not detected
                </p>
                <p className="text-xs text-muted-foreground">
                  Set{" "}
                  <code className="rounded bg-muted px-1">
                    VITE_BACKEND_CANISTER_ID
                  </code>{" "}
                  in your environment or check the Caffeine dashboard.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Admin Action */}
      <Card className="border-accent/20 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Reclaim admin role for your currently connected principal. See the{" "}
            <span className="font-medium text-foreground">Settings</span> tab
            for full admin role management.
          </p>
          {principal && (
            <div className="rounded-md bg-muted/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Your principal:{" "}
              </span>
              <code className="font-mono text-xs text-foreground break-all">
                {principal.toText()}
              </code>
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-accent/40 text-accent hover:bg-accent/10"
                data-ocid="admin-claim-role-btn"
                disabled={reclaimAdmin.isPending}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {reclaimAdmin.isPending ? "Claiming…" : "Reclaim Admin Role"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Reclaim Admin Role</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reassign the admin role to your current principal
                  {principal ? ` (${formatPrincipal(principal.toText())})` : ""}
                  . Any existing admin will lose their privileges. Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    reclaimAdmin.mutate(undefined, {
                      onSuccess: () =>
                        toast.success("Admin role claimed successfully"),
                      onError: () => toast.error("Failed to claim admin role"),
                    });
                  }}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Confirm Claim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
