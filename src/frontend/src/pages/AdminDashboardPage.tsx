/**
 * AdminDashboardPage — single-file admin control center for OnlySigned.
 * Tabs: Overview | Users | Username NFTs | Offers | Audit Log | Support
 * Access gated by isAdmin === true (never userNumber comparison).
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, RefreshCw, Shield, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { IssuerSubtype } from "../backend-types";
import { useAuth } from "../hooks/useAuth";
import { useIsAdmin } from "../hooks/useProfile";
import {
  useAcceptUsernameOffer,
  useAdminStats,
  useAllSupportSubmissions,
  useAllTransactions,
  useAllUsernameNFTs,
  useAllUsernameOffers,
  useAllUsers,
  useCanisterId,
  useCyclesBalance,
  useMintUsernameNFT,
  useReclaimAdmin,
  useRejectUsernameOffer,
  useSetCertificateIssuerStatus,
  useSetUserAdmin,
  useTransferUsernameNFT,
} from "../hooks/useQueries";
import { copyToClipboard, formatDate, formatPrincipal } from "../lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CopyPill({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy");
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-[28px]"
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-500" /> Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy
        </>
      )}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold font-display text-foreground">
        {value}
      </p>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: cycles, isLoading: cyclesLoading } = useCyclesBalance();
  const {
    data: canisterData,
    isLoading: canisterLoading,
    refetch,
  } = useCanisterId();
  const reclaimAdmin = useReclaimAdmin();

  const handleReclaim = () => {
    reclaimAdmin.mutate(undefined, {
      onSuccess: () => toast.success("Admin role reclaimed successfully"),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Platform Stats
        </h2>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {["s1", "s2", "s3", "s4", "s5"].map((k) => (
              <Skeleton key={k} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              label="Total Users"
              value={stats?.totalUsers?.toString() ?? "0"}
            />
            <StatCard
              label="Active (30d)"
              value={stats?.activeUsersLast30Days?.toString() ?? "0"}
            />
            <StatCard
              label="Total Assets"
              value={stats?.totalAssets?.toString() ?? "0"}
            />
            <StatCard
              label="Signed Copies"
              value={stats?.totalSignedCopies?.toString() ?? "0"}
            />
            <StatCard
              label="Transactions"
              value={stats?.totalTransactions?.toString() ?? "0"}
            />
          </div>
        )}
      </div>

      {/* Cycles Balance */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Cycles Balance
        </p>
        {cyclesLoading ? (
          <Skeleton className="mt-1 h-8 w-40" />
        ) : (
          <p className="mt-1 text-xl font-bold font-mono text-foreground">
            {cycles != null ? `${Number(cycles).toLocaleString()} cycles` : "—"}
          </p>
        )}
      </div>

      {/* Canister ID */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Canister ID
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
        {canisterLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : canisterData ? (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all font-mono text-sm text-foreground">
                {canisterData.canisterId}
              </code>
              <CopyPill text={canisterData.canisterId} />
            </div>
            <p className="text-xs text-muted-foreground">
              Detection: {canisterData.detectionMethod}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Unable to detect canister ID automatically.
          </p>
        )}
      </div>

      {/* Reclaim Admin */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Admin Role Reassignment
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Transfer admin privileges to your currently connected principal.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="mt-3 min-h-[44px] sm:min-h-[36px]"
          onClick={handleReclaim}
          disabled={reclaimAdmin.isPending}
          data-ocid="admin-reclaim-btn"
        >
          {reclaimAdmin.isPending ? "Reclaiming..." : "Reclaim Admin"}
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: users, isLoading } = useAllUsers();
  const setAdmin = useSetUserAdmin();
  const setIssuer = useSetCertificateIssuerStatus();
  const [issuerSubtypes, setIssuerSubtypes] = useState<
    Record<string, IssuerSubtype>
  >({});

  const handleSetAdmin = (principal: string, value: boolean) => {
    setAdmin.mutate(
      { target: principal, adminValue: value },
      {
        onSuccess: () =>
          toast.success(`Admin ${value ? "granted" : "revoked"}`),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleSetIssuer = (principal: string, isIssuer: boolean) => {
    setIssuer.mutate(
      { target: principal, isIssuer, subtype: issuerSubtypes[principal] },
      {
        onSuccess: () =>
          toast.success(
            `Certificate Issuer status ${isIssuer ? "granted" : "revoked"}`,
          ),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (isLoading)
    return (
      <div className="space-y-2">
        {["u1", "u2", "u3", "u4", "u5"].map((k) => (
          <Skeleton key={k} className="h-16 rounded-lg" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3" data-ocid="admin-users-list">
      <p className="text-sm text-muted-foreground">
        {users?.length ?? 0} registered users
      </p>
      {users?.map((user) => {
        const pid = user.id.toString();
        return (
          <div
            key={pid}
            className="rounded-lg border border-border bg-card p-3 sm:p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    {user.displayName || "(no name)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    #{user.userNumber.toString()}
                  </span>
                  {user.isAdmin && (
                    <Badge variant="destructive" className="text-xs">
                      Admin
                    </Badge>
                  )}
                  {user.isVerified && (
                    <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                      Verified
                    </Badge>
                  )}
                  {user.profileType === "CertificateIssuer" && (
                    <Badge variant="outline" className="text-xs">
                      Cert Issuer
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground break-all">
                  {formatPrincipal(pid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.followerCount.toString()} followers
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={user.isAdmin ? "destructive" : "outline"}
                  className="min-h-[44px] sm:min-h-[36px] text-xs"
                  onClick={() => handleSetAdmin(pid, !user.isAdmin)}
                  disabled={setAdmin.isPending}
                  data-ocid="admin-toggle-admin-btn"
                >
                  {user.isAdmin ? "Remove Admin" : "Set Admin"}
                </Button>
                <div className="flex gap-1">
                  <select
                    className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground min-h-[44px] sm:min-h-[36px]"
                    value={issuerSubtypes[pid] ?? ""}
                    onChange={(e) =>
                      setIssuerSubtypes((prev) => ({
                        ...prev,
                        [pid]: e.target.value as IssuerSubtype,
                      }))
                    }
                  >
                    <option value="">Subtype…</option>
                    <option value="Celebrity">Celebrity</option>
                    <option value="Government">Government</option>
                    <option value="Institution">Institution</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] sm:min-h-[36px] text-xs"
                    onClick={() =>
                      handleSetIssuer(
                        pid,
                        user.profileType !== "CertificateIssuer",
                      )
                    }
                    disabled={setIssuer.isPending}
                    data-ocid="admin-toggle-issuer-btn"
                  >
                    {user.profileType === "CertificateIssuer"
                      ? "Revoke Issuer"
                      : "Set Issuer"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {!users?.length && (
        <p className="py-8 text-center text-muted-foreground">
          No users found.
        </p>
      )}
    </div>
  );
}

// ─── Tab: Username NFTs ───────────────────────────────────────────────────────

function UsernameNFTsTab() {
  const { data: nfts, isLoading } = useAllUsernameNFTs();
  const mintNFT = useMintUsernameNFT();
  const transferNFT = useTransferUsernameNFT();
  const [mintForm, setMintForm] = useState({ username: "", principal: "" });
  const [transferForm, setTransferForm] = useState({
    username: "",
    toPrincipal: "",
  });

  const handleMint = () => {
    if (!mintForm.username || !mintForm.principal)
      return toast.error("Fill all fields");
    mintNFT.mutate(mintForm, {
      onSuccess: () => {
        toast.success("Username NFT minted");
        setMintForm({ username: "", principal: "" });
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const handleTransfer = () => {
    if (!transferForm.username || !transferForm.toPrincipal)
      return toast.error("Fill all fields");
    transferNFT.mutate(transferForm, {
      onSuccess: () => {
        toast.success("NFT transferred");
        setTransferForm({ username: "", toPrincipal: "" });
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-6">
      {/* Mint Form */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">
          Mint Username NFT
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Username</Label>
            <Input
              value={mintForm.username}
              onChange={(e) =>
                setMintForm((p) => ({ ...p, username: e.target.value }))
              }
              placeholder="e.g. coolname"
              className="min-h-[44px] sm:min-h-[36px]"
              data-ocid="admin-mint-username-input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recipient Principal</Label>
            <Input
              value={mintForm.principal}
              onChange={(e) =>
                setMintForm((p) => ({ ...p, principal: e.target.value }))
              }
              placeholder="aaaaa-aa..."
              className="min-h-[44px] sm:min-h-[36px]"
              data-ocid="admin-mint-principal-input"
            />
          </div>
        </div>
        <Button
          className="mt-3 min-h-[44px] sm:min-h-[36px]"
          onClick={handleMint}
          disabled={mintNFT.isPending}
          data-ocid="admin-mint-submit"
        >
          {mintNFT.isPending ? "Minting…" : "Mint NFT"}
        </Button>
      </div>

      {/* Transfer Form */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">
          Transfer Username NFT
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Username</Label>
            <Input
              value={transferForm.username}
              onChange={(e) =>
                setTransferForm((p) => ({ ...p, username: e.target.value }))
              }
              placeholder="e.g. coolname"
              className="min-h-[44px] sm:min-h-[36px]"
              data-ocid="admin-transfer-username-input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">New Owner Principal</Label>
            <Input
              value={transferForm.toPrincipal}
              onChange={(e) =>
                setTransferForm((p) => ({ ...p, toPrincipal: e.target.value }))
              }
              placeholder="aaaaa-aa..."
              className="min-h-[44px] sm:min-h-[36px]"
              data-ocid="admin-transfer-principal-input"
            />
          </div>
        </div>
        <Button
          className="mt-3 min-h-[44px] sm:min-h-[36px]"
          variant="outline"
          onClick={handleTransfer}
          disabled={transferNFT.isPending}
          data-ocid="admin-transfer-submit"
        >
          {transferNFT.isPending ? "Transferring…" : "Transfer NFT"}
        </Button>
      </div>

      {/* NFT List */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">
          All Username NFTs
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {["n1", "n2", "n3"].map((k) => (
              <Skeleton key={k} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2" data-ocid="admin-nft-list">
            {nfts?.map((nft) => (
              <div
                key={nft.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      @{nft.username}
                    </span>
                    <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                      Verified
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatPrincipal(nft.ownerPrincipal.toString())}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(nft.mintedAt)}
                  </p>
                </div>
              </div>
            ))}
            {!nfts?.length && (
              <p className="py-6 text-center text-muted-foreground">
                No Username NFTs minted yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Offers ──────────────────────────────────────────────────────────────

function OffersTab() {
  const { data: offers, isLoading } = useAllUsernameOffers();
  const acceptOffer = useAcceptUsernameOffer();
  const rejectOffer = useRejectUsernameOffer();

  const handleAccept = (id: string) => {
    acceptOffer.mutate(id, {
      onSuccess: () => toast.success("Offer accepted"),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleReject = (id: string) => {
    rejectOffer.mutate(id, {
      onSuccess: () => toast.success("Offer rejected"),
      onError: (e) => toast.error(e.message),
    });
  };

  if (isLoading)
    return (
      <div className="space-y-2">
        {["o1", "o2", "o3"].map((k) => (
          <Skeleton key={k} className="h-16 rounded-lg" />
        ))}
      </div>
    );

  return (
    <div className="space-y-2" data-ocid="admin-offers-list">
      <p className="text-sm text-muted-foreground">
        {offers?.length ?? 0} offers
      </p>
      {offers?.map((offer) => (
        <div
          key={offer.id}
          className="rounded-lg border border-border bg-card p-3 sm:p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  @{offer.targetUsername}
                </span>
                {offer.nftExists ? (
                  <Badge variant="outline" className="text-xs">
                    Exists
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    New Mint
                  </Badge>
                )}
                <Badge
                  variant={
                    offer.status === "Pending"
                      ? "outline"
                      : offer.status === "Accepted"
                        ? "default"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {offer.status}
                </Badge>
              </div>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {formatPrincipal(offer.offererPrincipal.toString())}
              </p>
              <p className="text-xs text-muted-foreground">
                {Number(offer.amount) / 1e8} {offer.currency} ·{" "}
                {formatDate(offer.submittedAt)}
              </p>
            </div>
            {offer.status === "Pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="min-h-[44px] sm:min-h-[36px] text-xs"
                  onClick={() => handleAccept(offer.id)}
                  disabled={acceptOffer.isPending}
                  data-ocid="admin-accept-offer-btn"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="min-h-[44px] sm:min-h-[36px] text-xs"
                  onClick={() => handleReject(offer.id)}
                  disabled={rejectOffer.isPending}
                  data-ocid="admin-reject-offer-btn"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
      {!offers?.length && (
        <p className="py-8 text-center text-muted-foreground">
          No offers submitted yet.
        </p>
      )}
    </div>
  );
}

// ─── Tab: Audit Log ───────────────────────────────────────────────────────────

function AuditLogTab() {
  const { data: entries, isLoading } = useAllTransactions();

  if (isLoading)
    return (
      <div className="space-y-2">
        {["a1", "a2", "a3", "a4", "a5"].map((k) => (
          <Skeleton key={k} className="h-12 rounded-lg" />
        ))}
      </div>
    );

  return (
    <div data-ocid="admin-audit-list">
      <p className="mb-3 text-sm text-muted-foreground">
        {entries?.length ?? 0} transactions
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              {["Type", "From", "To", "Amount", "Currency", "Date"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries?.map((entry) => (
              <tr key={entry.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 font-medium text-foreground">
                  {entry.txType}
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {entry.fromPrincipal
                    ? formatPrincipal(entry.fromPrincipal.toString())
                    : "—"}
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {formatPrincipal(entry.toPrincipal.toString())}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-foreground">
                  {(Number(entry.amount) / 1e8).toFixed(4)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {entry.currency}
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {formatDate(entry.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries?.length && (
          <p className="py-8 text-center text-muted-foreground">
            No transactions recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Support ─────────────────────────────────────────────────────────────

function SupportTab() {
  const { data: submissions, isLoading } = useAllSupportSubmissions();

  if (isLoading)
    return (
      <div className="space-y-2">
        {["s1", "s2", "s3"].map((k) => (
          <Skeleton key={k} className="h-16 rounded-lg" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3" data-ocid="admin-support-list">
      <p className="text-sm text-muted-foreground">
        {submissions?.length ?? 0} submissions
      </p>
      {submissions?.map((s) => (
        <div key={s.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{s.subject}</span>
                <Badge
                  variant={s.status === "Reviewed" ? "default" : "outline"}
                  className="text-xs"
                >
                  {s.status}
                </Badge>
              </div>
              {s.email && (
                <p className="text-xs text-muted-foreground">{s.email}</p>
              )}
              <p className="mt-1 text-sm text-foreground line-clamp-2">
                {s.message}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(s.submittedAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
      {!submissions?.length && (
        <p className="py-8 text-center text-muted-foreground">
          No support submissions yet.
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "nfts", label: "Username NFTs" },
  { id: "offers", label: "Offers" },
  { id: "audit", label: "Audit Log" },
  { id: "support", label: "Support" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboardPage() {
  const isAdmin = useIsAdmin();
  const { principal } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="h-10 w-10 text-destructive" />
        </div>
        <div className="max-w-sm">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Access Denied
          </h1>
          <p className="mt-2 text-muted-foreground">
            This section is restricted to platform administrators.
          </p>
          {principal && (
            <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
              Your principal: {formatPrincipal(principal.toText())}
            </p>
          )}
          <Button
            asChild
            variant="outline"
            className="mt-6 min-h-[44px] sm:min-h-[36px]"
          >
            <Link to="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-border bg-card px-3 py-5 sm:px-8 sm:py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Full platform management and oversight
              </p>
            </div>
            <Badge
              variant="outline"
              className="ml-auto border-accent/40 text-accent"
            >
              Administrator
            </Badge>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 sm:px-8">
          <nav
            className="flex gap-0.5 overflow-x-auto py-2 pb-1"
            style={{ scrollbarWidth: "none" }}
            data-ocid="admin-tab-nav"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-ocid={`admin-tab-${tab.id}`}
                className={`whitespace-nowrap flex-shrink-0 rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors duration-150 min-h-[44px] sm:min-h-[36px] ${
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-8 sm:py-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "nfts" && <UsernameNFTsTab />}
        {activeTab === "offers" && <OffersTab />}
        {activeTab === "audit" && <AuditLogTab />}
        {activeTab === "support" && <SupportTab />}
      </div>
    </div>
  );
}
