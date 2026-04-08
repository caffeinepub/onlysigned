import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "@tanstack/react-router";
import {
  Check,
  CheckCircle,
  Copy,
  Download,
  Eye,
  EyeOff,
  FolderOpen,
  ShieldCheck,
  Star,
  Tag,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Collection,
  DownloadManifest,
  SignedCopy,
} from "../backend-types";
import { ItemType, SaleMethod } from "../backend-types";
import CertificateDisplay from "../components/CertificateDisplay";
import ConnectWall from "../components/ConnectWall";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGenerateDownloadPackage,
  useInviteCoSigner,
  useListForSale,
  useMyCollections,
  useMySignedCopies,
  useSetSignedCopyPrivacy,
} from "../hooks/useQueries";
import { copyToClipboard, formatAmount, formatDate } from "../lib/utils";

const CURRENCIES = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;
const SALE_METHODS = ["Direct", "Auction"] as const;

type PrivacyFilter = "all" | "public" | "private";

// ─── Pill copy button ─────────────────────────────────────────────────────────

function CopyPill({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Copy failed — please select and copy manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        "transition-all duration-200 select-none shrink-0",
        "min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        copied
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-border bg-muted/40 text-muted-foreground hover:border-accent/40 hover:text-foreground active:scale-95",
      ].join(" ")}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Page entry ───────────────────────────────────────────────────────────────

export default function MyCollectiblesPage() {
  const { identity } = useInternetIdentity();
  if (!identity) {
    return (
      <ConnectWall message="Connect your wallet to view your signed copies." />
    );
  }
  return <CollectiblesContent />;
}

// ─── Main content ─────────────────────────────────────────────────────────────

function CollectiblesContent() {
  const { data: copiesRaw, isLoading: copiesLoading } = useMySignedCopies();
  const { data: collectionsRaw, isLoading: collectionsLoading } =
    useMyCollections();
  const listForSale = useListForSale();
  const inviteCoSigner = useInviteCoSigner();
  const setPrivacy = useSetSignedCopyPrivacy();
  const generateDownload = useGenerateDownloadPackage();

  const copies = (copiesRaw as SignedCopy[] | undefined) ?? [];
  const collections = (collectionsRaw as Collection[] | undefined) ?? [];

  const [filter, setFilter] = useState<PrivacyFilter>("all");
  const [certModal, setCertModal] = useState<SignedCopy | null>(null);
  const [saleModal, setSaleModal] = useState<SignedCopy | null>(null);
  const [inviteModal, setInviteModal] = useState<SignedCopy | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [salePrice, setSalePrice] = useState("");
  const [saleCurrency, setSaleCurrency] = useState<string>("ICP");
  const [saleMethod, setSaleMethod] = useState<SaleMethod>(SaleMethod.Direct);
  const [invitePrincipal, setInvitePrincipal] = useState("");

  const filteredCopies = copies.filter((c) => {
    if (filter === "public") return c.privacyPublic;
    if (filter === "private") return !c.privacyPublic;
    return true;
  });

  const handleListForSale = async () => {
    if (!saleModal) return;
    try {
      await listForSale.mutateAsync({
        itemType: ItemType.SignedCopy,
        itemId: saleModal.id,
        price: BigInt(Math.floor(Number.parseFloat(salePrice || "0") * 1e8)),
        currency: saleCurrency,
        saleMethod,
      });
      toast.success("Listed for sale!");
      setSaleModal(null);
    } catch {
      toast.error("Failed to list for sale.");
    }
  };

  const handleInvite = async () => {
    if (!inviteModal) return;
    if (!invitePrincipal.trim()) {
      toast.error("Please enter a principal address.");
      return;
    }
    try {
      await inviteCoSigner.mutateAsync({
        signedCopyId: inviteModal.id,
        inviteePrincipal: invitePrincipal.trim(),
      });
      toast.success("Co-signer invitation sent!");
      setInviteModal(null);
      setInvitePrincipal("");
    } catch {
      toast.error("Failed to send invitation.");
    }
  };

  const handlePrivacyToggle = async (copy: SignedCopy) => {
    try {
      await setPrivacy.mutateAsync({
        id: copy.id,
        privacyPublic: !copy.privacyPublic,
      });
      toast.success(
        `Copy #${Number(copy.sequenceNumber)} set to ${!copy.privacyPublic ? "public" : "private"}`,
      );
    } catch {
      toast.error("Failed to update privacy.");
    }
  };

  const handleDownload = async (copy: SignedCopy) => {
    setDownloadingId(copy.id);
    try {
      const manifest: DownloadManifest = await generateDownload.mutateAsync(
        copy.id,
      );
      // Trigger client-side JSON download
      const blob = new Blob(
        [
          JSON.stringify(
            manifest,
            (_k, v) => (typeof v === "bigint" ? v.toString() : v),
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `onlysigned-copy-${Number(copy.sequenceNumber)}-${copy.certificateId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(
        `Certificate package for copy #${Number(copy.sequenceNumber)} downloaded.`,
      );
    } catch {
      toast.error("Failed to generate download package.");
    } finally {
      setDownloadingId(null);
    }
  };

  const isLoading = copiesLoading || collectionsLoading;

  return (
    <div className="space-y-6 px-4 sm:px-0" data-ocid="my-collectibles-page">
      {/* Page header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">
          My Collectibles
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All signed copies you own — each an ICRC-7 NFT certificate
        </p>
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center gap-2 flex-wrap"
        data-ocid="collectibles-filter"
      >
        {(["all", "public", "private"] as PrivacyFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={[
              "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all capitalize min-h-[36px]",
              filter === f
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-muted/30 text-muted-foreground border-border hover:border-accent/40 hover:text-foreground",
            ].join(" ")}
          >
            {f === "all"
              ? `All (${copies.length})`
              : f === "public"
                ? `Public (${copies.filter((c) => c.privacyPublic).length})`
                : `Private (${copies.filter((c) => !c.privacyPublic).length})`}
          </button>
        ))}
      </div>

      {/* Signed copies grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <Skeleton key={k} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : filteredCopies.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4"
          data-ocid="collectibles-empty"
        >
          <Star className="h-12 w-12 text-muted-foreground/30" />
          <div className="text-center max-w-sm">
            <p className="font-display font-semibold text-foreground">
              {filter === "all"
                ? "No collectibles yet"
                : `No ${filter} collectibles`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === "all" ? (
                <>
                  You don&apos;t own any signed copies yet.{" "}
                  <Link
                    to="/marketplace"
                    className="text-accent underline hover:text-accent/80"
                  >
                    Browse the Marketplace!
                  </Link>
                </>
              ) : (
                "Toggle the filter to see other copies."
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCopies.map((copy) => (
            <CollectibleCard
              key={copy.id}
              copy={copy}
              isDownloading={downloadingId === copy.id}
              onViewCert={() => setCertModal(copy)}
              onSale={() => setSaleModal(copy)}
              onInvite={() => setInviteModal(copy)}
              onDownload={() => handleDownload(copy)}
              onTogglePrivacy={() => handlePrivacyToggle(copy)}
            />
          ))}
        </div>
      )}

      {/* Purchased collections section */}
      {collections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-accent" />
            <h2 className="font-display font-semibold text-lg text-foreground">
              My Collections
            </h2>
            <Badge
              variant="outline"
              className="text-xs border-border text-muted-foreground"
            >
              {collections.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>
        </div>
      )}

      {/* ── Certificate modal ─────────────────────────────────────── */}
      <Dialog open={!!certModal} onOpenChange={() => setCertModal(null)}>
        <DialogContent className="bg-card border-border max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-display">
              Certificate of Authenticity
            </DialogTitle>
          </DialogHeader>
          {certModal && (
            <CertificateDisplay
              certificate={{
                id: certModal.certificateId,
                sequenceNumber: certModal.sequenceNumber,
                assetTitle: certModal.assetId,
                signers: certModal.signers.map((s) => ({
                  principal: s.principal.toString(),
                  displayName: s.displayName,
                  signedAt: s.signedAt,
                  certIssuerType: s.certIssuerType,
                })),
                shareableUrl: certModal.shareableUrl,
                icrc7TokenId: certModal.tokenId,
                issuedAt: certModal.createdAt,
              }}
              showDownload
              showValidate
              onDownload={() => {
                void handleDownload(certModal);
                setCertModal(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── List for sale modal ───────────────────────────────────── */}
      <Dialog open={!!saleModal} onOpenChange={() => setSaleModal(null)}>
        <DialogContent className="bg-card border-border w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              List Signed Copy for Sale
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="collectible-price">
                Price{" "}
                <span className="text-muted-foreground text-xs">
                  (0 for free)
                </span>
              </Label>
              <Input
                id="collectible-price"
                placeholder="0.00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                data-ocid="collectible-sale-price-input"
                className="min-h-[44px] sm:min-h-[36px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={saleCurrency} onValueChange={setSaleCurrency}>
                  <SelectTrigger
                    data-ocid="collectible-currency-select"
                    className="min-h-[44px] sm:min-h-[36px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sale Method</Label>
                <Select
                  value={saleMethod}
                  onValueChange={(v) => setSaleMethod(v as SaleMethod)}
                >
                  <SelectTrigger
                    data-ocid="collectible-method-select"
                    className="min-h-[44px] sm:min-h-[36px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleListForSale}
                disabled={listForSale.isPending}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
                data-ocid="collectible-list-sale-btn"
              >
                {listForSale.isPending ? "Listing…" : "List for Sale"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaleModal(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Invite co-signer modal ────────────────────────────────── */}
      <Dialog open={!!inviteModal} onOpenChange={() => setInviteModal(null)}>
        <DialogContent className="bg-card border-border w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Invite Co-Signer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invite another user to co-sign this copy. Their signature will be
              added to the ICRC-7 certificate.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="invite-principal">User Principal Address</Label>
              <Input
                id="invite-principal"
                placeholder="aaaaa-aa (principal)"
                value={invitePrincipal}
                onChange={(e) => setInvitePrincipal(e.target.value)}
                data-ocid="invite-cosigner-input"
                className="min-h-[44px] sm:min-h-[36px] font-mono"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleInvite}
                disabled={inviteCoSigner.isPending}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
                data-ocid="invite-cosigner-btn"
              >
                {inviteCoSigner.isPending ? "Sending…" : "Send Invitation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setInviteModal(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Collectible card ─────────────────────────────────────────────────────────

function CollectibleCard({
  copy,
  isDownloading,
  onViewCert,
  onSale,
  onInvite,
  onDownload,
  onTogglePrivacy,
}: {
  copy: SignedCopy;
  isDownloading: boolean;
  onViewCert: () => void;
  onSale: () => void;
  onInvite: () => void;
  onDownload: () => void;
  onTogglePrivacy: () => void;
}) {
  return (
    <Card
      className="bg-card border-border hover:border-accent/30 transition-colors flex flex-col"
      data-ocid="collectible-card"
    >
      <CardContent className="pt-4 px-4 pb-4 flex-1 space-y-3">
        {/* Title & sequence */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to="/assets/$assetId"
              params={{ assetId: copy.assetId }}
              className="font-display font-semibold text-foreground hover:text-accent transition-colors line-clamp-1 block text-sm"
              data-ocid="collectible-asset-link"
            >
              {copy.assetId}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-accent font-mono text-sm font-bold">
                #{Number(copy.sequenceNumber)}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] border-accent/30 text-accent px-1"
              >
                ICRC-7
              </Badge>
              {copy.listedForSale && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-border text-muted-foreground px-1"
                >
                  Listed
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {copy.privacyPublic ? (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Certificate ID */}
        <div className="bg-muted/20 rounded px-2.5 py-1.5 text-xs">
          <span className="text-muted-foreground">Cert: </span>
          <span className="font-mono text-foreground/80">
            {copy.certificateId.slice(0, 14)}…
          </span>
        </div>

        {/* Shareable URL with copy pill */}
        {copy.shareableUrl && (
          <div className="flex items-center gap-2 bg-muted/10 rounded px-2 py-1.5 border border-border/30">
            <span className="text-[11px] text-muted-foreground truncate flex-1 font-mono min-w-0">
              {copy.shareableUrl.replace(/^https?:\/\//, "").slice(0, 32)}…
            </span>
            <CopyPill text={copy.shareableUrl} label="Shareable URL" />
          </div>
        )}

        {/* Signers */}
        {copy.signers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {copy.signers.map((s) => (
              <div
                key={s.principal.toString()}
                className="flex items-center gap-1 bg-accent/10 rounded px-1.5 py-0.5 text-[10px] text-accent"
              >
                <CheckCircle className="h-2.5 w-2.5" />
                {s.displayName || `${s.principal.toString().slice(0, 8)}…`}
              </div>
            ))}
          </div>
        )}

        {/* Privacy toggle */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={copy.privacyPublic}
            onCheckedChange={onTogglePrivacy}
            aria-label="Toggle privacy"
            data-ocid="collectible-privacy-toggle"
          />
          <span>{copy.privacyPublic ? "Public" : "Private"}</span>
          {copy.price > 0n && (
            <span className="ml-auto font-mono text-accent text-[11px]">
              {formatAmount(
                copy.price,
                copy.currency as "ICP" | "ckBTC" | "ckUSDC" | "ckUSDT",
              )}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewCert}
            className="text-xs border-accent/30 text-accent hover:bg-accent/10 min-h-[44px] sm:min-h-[36px]"
            data-ocid="view-cert-btn"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Certificate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={isDownloading}
            className="text-xs min-h-[44px] sm:min-h-[36px]"
            data-ocid="download-signed-copy-btn"
          >
            <Download className="h-3 w-3 mr-1" />
            {isDownloading ? "…" : "Download"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSale}
            className="text-xs min-h-[44px] sm:min-h-[36px]"
            data-ocid="list-sale-btn"
          >
            <Tag className="h-3 w-3 mr-1" />
            List Sale
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onInvite}
            className="text-xs min-h-[44px] sm:min-h-[36px]"
            data-ocid="invite-cosigner-card-btn"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Co-sign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Collection card ──────────────────────────────────────────────────────────

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Card
      className="bg-card border-border hover:border-accent/30 transition-colors"
      data-ocid="collection-card"
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-display font-semibold text-foreground line-clamp-1">
          {collection.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {collection.description}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] ${collection.privacyPublic ? "border-accent/30 text-accent" : "border-border text-muted-foreground"}`}
          >
            {collection.privacyPublic ? "Public" : "Private"}
          </Badge>
          {collection.forSale && (
            <Badge
              variant="outline"
              className="text-[10px] border-amber-400/30 text-amber-400"
            >
              For Sale ·{" "}
              {formatAmount(
                collection.salePrice,
                collection.saleCurrency as
                  | "ICP"
                  | "ckBTC"
                  | "ckUSDC"
                  | "ckUSDT",
              )}
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {formatDate(collection.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
