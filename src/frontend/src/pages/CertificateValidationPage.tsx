import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useSearch } from "@tanstack/react-router";
import {
  CheckCircle,
  Copy,
  FileSearch,
  Hash,
  Link2,
  PenLine,
  Search,
  Shield,
  ShieldCheck,
  UserCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CoSignInvitation, SignedCopy } from "../backend-types";
import { Variant_Accepted_Declined_Pending } from "../backend-types";
import CertificateDisplay from "../components/CertificateDisplay";
import {
  useAcceptCoSign,
  useDeclineCoSign,
  useMyCoSignInvitations,
  useSignedCopyByUrl,
  useValidateCertificate,
} from "../hooks/useQueries";
import { cn, copyToClipboard, formatDate } from "../lib/utils";

/** Detect if the input is a URL (starts with http or contains path segments) */
function isUrl(input: string): boolean {
  return input.startsWith("http") || input.includes("/") || input.includes("?");
}

/** Extract cert ID from a shareable URL like /copy/<id> or ?certId=<id> */
function extractCertIdFromUrl(url: string): string | null {
  const paramMatch = url.match(/[?&]certId=([^&]+)/);
  if (paramMatch) return paramMatch[1];
  const pathMatch = url.match(/\/(?:copy|validate|cert)\/([a-zA-Z0-9_-]{8,})/);
  if (pathMatch) return pathMatch[1];
  return null;
}

// ─── Pill Copy Button ─────────────────────────────────────────────────────────

function PillCopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Copy failed — please copy manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors min-h-[28px]",
        copied
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border/60 bg-muted/30 text-muted-foreground hover:border-accent/40 hover:text-foreground",
        className,
      )}
      data-ocid="pill-copy-btn"
    >
      {copied ? (
        <>
          <CheckCircle className="h-3 w-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label}
        </>
      )}
    </button>
  );
}

// ─── Co-sign Invitation Card ──────────────────────────────────────────────────

function CoSignInvitationCard({
  invitation,
}: { invitation: CoSignInvitation }) {
  const acceptMutation = useAcceptCoSign();
  const declineMutation = useDeclineCoSign();

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(invitation.id);
      toast.success("You've co-signed the certificate!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept");
    }
  };

  const handleDecline = async () => {
    try {
      await declineMutation.mutateAsync(invitation.id);
      toast.success("Invitation declined.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to decline");
    }
  };

  const isPending =
    invitation.status === Variant_Accepted_Declined_Pending.Pending;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
        isPending
          ? "bg-card border-border hover:border-accent/30"
          : invitation.status === Variant_Accepted_Declined_Pending.Accepted
            ? "bg-accent/5 border-accent/20"
            : "bg-muted/20 border-border/40 opacity-60",
      )}
      data-ocid="cosign-invitation-card"
    >
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <PenLine className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            Co-sign invitation
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 border",
              isPending
                ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                : invitation.status ===
                    Variant_Accepted_Declined_Pending.Accepted
                  ? "border-accent/40 text-accent bg-accent/10"
                  : "border-border/40 text-muted-foreground",
            )}
          >
            {invitation.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono truncate pl-5">
          Copy: {invitation.signedCopyId.slice(0, 20)}…
        </p>
        <p className="text-xs text-muted-foreground pl-5">
          Invited {formatDate(invitation.createdAt)}
        </p>
      </div>

      {isPending && (
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={declineMutation.isPending || acceptMutation.isPending}
            className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10 min-h-[44px] sm:min-h-[36px]"
            data-ocid="cosign-decline-btn"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={acceptMutation.isPending || declineMutation.isPending}
            className="text-xs bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
            data-ocid="cosign-accept-btn"
          >
            {acceptMutation.isPending ? "Signing…" : "Accept & Sign"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Certificate result detail ────────────────────────────────────────────────

function CertificateResult({ copy }: { copy: SignedCopy }) {
  const shareUrl =
    copy.shareableUrl ||
    `${window.location.origin}/validate?certId=${copy.certificateId}`;

  const certData = {
    id: copy.certificateId,
    sequenceNumber: copy.sequenceNumber,
    assetTitle: copy.assetId, // will be enriched if asset name is available
    assetId: copy.assetId,
    creatorPrincipal: copy.creatorId.toString(),
    signers: copy.signers.map((s) => ({
      principal: s.principal.toString(),
      displayName: s.displayName,
      isVerified: false,
      signedAt: s.signedAt,
      certIssuerType: s.certIssuerType,
    })),
    shareableUrl: shareUrl,
    icrc7TokenId: copy.tokenId,
    issuedAt: copy.createdAt,
  };

  return (
    <div className="space-y-4" data-ocid="certificate-result">
      {/* Authentic badge */}
      <div className="flex items-center justify-center gap-3 py-5 rounded-xl border bg-accent/5 border-accent/30">
        <ShieldCheck className="h-8 w-8 text-accent" />
        <div className="text-center">
          <p
            className="font-display font-bold text-xl text-accent"
            data-ocid="validation-valid-badge"
          >
            AUTHENTIC
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This certificate is authentic and verifiable on-chain
          </p>
        </div>
      </div>

      {/* Full certificate card */}
      <CertificateDisplay
        certificate={certData}
        showDownload={false}
        showValidate={false}
      />

      {/* Extended details */}
      <div className="space-y-2">
        {/* Certificate ID row */}
        <div className="flex items-start justify-between gap-2 rounded-lg bg-muted/20 border border-border/40 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Certificate ID
              </p>
              <p
                className="font-mono text-xs text-foreground/80 break-all"
                data-ocid="cert-id-display"
              >
                {copy.certificateId}
              </p>
            </div>
          </div>
          <PillCopyButton text={copy.certificateId} label="Copy ID" />
        </div>

        {/* Authenticity hash row */}
        {copy.authenticityHash && (
          <div className="rounded-lg bg-muted/20 border border-border/40 px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Authenticity Hash
                </p>
                <p className="font-mono text-xs text-foreground/70 break-all">
                  {copy.authenticityHash}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shareable URL row */}
        <div className="flex items-start justify-between gap-2 rounded-lg bg-muted/20 border border-border/40 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Shareable URL
              </p>
              <p className="font-mono text-xs text-foreground/70 break-all">
                {shareUrl}
              </p>
            </div>
          </div>
          <PillCopyButton text={shareUrl} label="Copy URL" />
        </div>
      </div>

      <Separator className="opacity-30" />

      {/* Links to asset & owner */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex-1 border-border/60 text-xs min-h-[44px] sm:min-h-[36px]"
        >
          <Link to="/assets/$assetId" params={{ assetId: copy.assetId }}>
            <FileSearch className="h-3.5 w-3.5 mr-1.5" />
            View Asset
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex-1 border-border/60 text-xs min-h-[44px] sm:min-h-[36px]"
        >
          <Link
            to="/users/$userId"
            params={{ userId: copy.ownerId.toString() }}
          >
            <UserCircle className="h-3.5 w-3.5 mr-1.5" />
            Owner Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CertificateValidationPage() {
  const search = useSearch({ strict: false }) as { certId?: string };
  const [inputValue, setInputValue] = useState((search.certId as string) ?? "");
  // Track what we're querying and what kind (URL vs cert ID)
  const [activeQuery, setActiveQuery] = useState<{
    kind: "certId" | "url";
    value: string;
  } | null>(search.certId ? { kind: "certId", value: search.certId } : null);

  const { loginStatus } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success";

  // Queries — only one will be enabled at a time
  const { data: certResult, isLoading: certLoading } = useValidateCertificate(
    activeQuery?.kind === "certId" ? activeQuery.value : undefined,
  );

  const { data: urlResult, isLoading: urlLoading } = useSignedCopyByUrl(
    activeQuery?.kind === "url" ? activeQuery.value : undefined,
  );

  // Co-sign invitations (only if logged in)
  const { data: invitations, isLoading: invitationsLoading } =
    useMyCoSignInvitations();

  const isLoading = certLoading || urlLoading;
  const resolvedCopy: SignedCopy | null | undefined =
    activeQuery?.kind === "url" ? urlResult : certResult;

  const hasResult = !!activeQuery && !isLoading;
  const isValid = hasResult && !!resolvedCopy;

  const pendingInvitations =
    invitations?.filter(
      (inv) => inv.status === Variant_Accepted_Declined_Pending.Pending,
    ) ?? [];
  const otherInvitations =
    invitations?.filter(
      (inv) => inv.status !== Variant_Accepted_Declined_Pending.Pending,
    ) ?? [];

  const handleVerify = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.error("Please enter a certificate ID or URL.");
      return;
    }
    if (isUrl(trimmed)) {
      // Try to extract cert ID first
      const extracted = extractCertIdFromUrl(trimmed);
      if (extracted) {
        setActiveQuery({ kind: "certId", value: extracted });
      } else {
        setActiveQuery({ kind: "url", value: trimmed });
      }
    } else {
      setActiveQuery({ kind: "certId", value: trimmed });
    }
  };

  return (
    <div
      className="max-w-2xl mx-auto space-y-6 pb-8"
      data-ocid="certificate-validation-page"
    >
      {/* Page header */}
      <div className="text-center space-y-2 pt-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Shield className="h-6 w-6 text-accent" />
          </div>
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">
          Verify Certificate Authenticity
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Every OnlySigned certificate is verifiable on-chain.{" "}
          <span className="text-foreground/80">Fakes are impossible</span> — the
          blockchain doesn&apos;t lie.
        </p>
      </div>

      {/* Search input */}
      <Card className="bg-card border-border">
        <CardContent className="pt-5 px-5 pb-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9 font-mono text-sm min-h-[44px] sm:min-h-[40px]"
                placeholder="Certificate ID or shareable URL…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                data-ocid="cert-id-input"
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[40px]"
              data-ocid="validate-cert-btn"
            >
              {isLoading ? "Checking…" : "Verify"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a Certificate ID, shareable URL, or ICRC-7 token ID
          </p>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3" data-ocid="validation-loading">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )}

      {/* Result area */}
      {hasResult && !isLoading && (
        <div className="space-y-4" data-ocid="validation-result">
          {isValid ? (
            <CertificateResult copy={resolvedCopy} />
          ) : (
            /* Invalid / not found state */
            <div className="space-y-4" data-ocid="validation-invalid">
              <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border bg-destructive/5 border-destructive/30">
                <XCircle className="h-10 w-10 text-destructive" />
                <div className="text-center space-y-1">
                  <p
                    className="font-display font-bold text-xl text-destructive"
                    data-ocid="validation-invalid-badge"
                  >
                    Certificate Not Found
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Certificate not found or invalid. It may be tampered,
                    expired, or the ID may be incorrect.
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="border-destructive/30 text-destructive text-xs"
                >
                  Not recorded in the blockchain
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state — no query yet */}
      {!activeQuery && !isLoading && (
        <Card
          className="bg-muted/10 border-border/50"
          data-ocid="validation-empty-state"
        >
          <CardContent className="pt-5 px-5 pb-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium text-foreground">
                Enter a certificate ID or URL to verify authenticity
              </p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">1.</span>
                <span>
                  Every signed copy is an ICRC-7 NFT on the Internet Computer
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">2.</span>
                <span>
                  The cryptographic signature ties the asset to its Certificate
                  Issuer
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">3.</span>
                <span>All co-signers are recorded immutably on-chain</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">4.</span>
                <span>
                  Nobody — not even OnlySigned — can forge or alter a
                  certificate
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Co-signing invitations — only shown when logged in */}
      {isLoggedIn && (
        <div className="space-y-3" data-ocid="cosign-invitations-section">
          <Separator className="opacity-30" />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-accent" />
              <h2 className="font-display font-semibold text-base text-foreground">
                Co-Signing Invitations
              </h2>
              {pendingInvitations.length > 0 && (
                <Badge className="bg-accent text-accent-foreground text-xs px-1.5 py-0 min-w-[18px] text-center">
                  {pendingInvitations.length}
                </Badge>
              )}
            </div>
          </div>

          {invitationsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : pendingInvitations.length === 0 &&
            otherInvitations.length === 0 ? (
            <Card className="bg-muted/10 border-border/40">
              <CardContent className="pt-4 pb-4 px-4">
                <p
                  className="text-sm text-muted-foreground text-center"
                  data-ocid="cosign-empty-state"
                >
                  No co-signing invitations
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Pending first */}
              {pendingInvitations.map((inv) => (
                <CoSignInvitationCard key={inv.id} invitation={inv} />
              ))}

              {/* Past invitations (collapsed if many) */}
              {otherInvitations.length > 0 && (
                <Card className="bg-muted/10 border-border/30">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Past invitations ({otherInvitations.length})
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 px-3 space-y-2">
                    {otherInvitations.slice(0, 5).map((inv) => (
                      <CoSignInvitationCard key={inv.id} invitation={inv} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
