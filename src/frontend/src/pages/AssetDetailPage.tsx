import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  PenTool,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Asset, SignedCopy } from "../backend-types";
import AssetFileList from "../components/AssetFileList";
import CertificateDisplay from "../components/CertificateDisplay";
import ProfileBadge from "../components/ProfileBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyProfile } from "../hooks/useProfile";
import {
  useAsset,
  useSignAsset,
  useSignedCopiesForAsset,
  useUpdateAsset,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../lib/utils";

const CURRENCIES = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;

export default function AssetDetailPage() {
  const { assetId } = useParams({ from: "/assets/$assetId" });
  const { data: assetRaw, isLoading } = useAsset(assetId);
  const { data: copiesRaw, isLoading: copiesLoading } =
    useSignedCopiesForAsset(assetId);
  const { data: profileData } = useMyProfile();
  const { identity } = useInternetIdentity();

  const signAsset = useSignAsset();
  const updateAsset = useUpdateAsset();

  const asset = assetRaw as Asset | null | undefined;
  const copies = (copiesRaw as SignedCopy[] | undefined) ?? [];
  const profile = profileData as Record<string, unknown> | null | undefined;

  const myPrincipal = identity?.getPrincipal().toString();
  const isOwner = !!myPrincipal && asset?.ownerId?.toString() === myPrincipal;
  const isAdmin = !!profile?.isAdmin;
  const isCertificateIssuer = profile?.profileType === "CertificateIssuer";
  const followerCount = Number(
    (profile?.followerCount as bigint | undefined) ?? 0n,
  );
  const isEligible = isAdmin || (isCertificateIssuer && followerCount >= 500);

  const [signPrice, setSignPrice] = useState("0");
  const [signCurrency, setSignCurrency] = useState<string>("ICP");
  const [newCopyId, setNewCopyId] = useState<string | null>(null);
  const [showSignForm, setShowSignForm] = useState(false);
  const [privacyPublic, setPrivacyPublic] = useState<boolean>(
    asset?.privacyPublic ?? false,
  );

  const handleSign = async () => {
    if (!assetId) return;
    try {
      const resultId = await signAsset.mutateAsync({
        assetId,
        price: BigInt(Math.floor(Number.parseFloat(signPrice || "0") * 1e8)),
        currency: signCurrency,
      });
      setNewCopyId(resultId);
      toast.success("Certificate minted! ICRC-7 NFT created.");
      setShowSignForm(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to sign asset.");
    }
  };

  const handlePrivacyToggle = async (val: boolean) => {
    if (!asset || !assetId) return;
    setPrivacyPublic(val);
    try {
      await updateAsset.mutateAsync({
        id: assetId,
        name: asset.name,
        description: asset.description,
        basePrice: asset.basePrice,
        royaltyBps: asset.royaltyBps,
        collectionId: asset.collectionId,
        privacyPublic: val,
        fileRefs: asset.fileRefs,
      });
      toast.success(val ? "Asset is now public" : "Asset is now private");
    } catch {
      setPrivacyPublic(!val);
      toast.error("Failed to update privacy.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Lock className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground">Asset not found or private.</p>
        <Link to="/marketplace" className="text-accent underline text-sm">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const currentPrivacy = isOwner ? privacyPublic : asset.privacyPublic;

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-ocid="asset-detail-page">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link
          to="/marketplace"
          className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] sm:min-h-[36px] flex items-center"
          data-ocid="asset-back-link"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display font-bold text-xl text-foreground truncate flex-1">
          {asset.name}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          {currentPrivacy ? (
            <Badge
              variant="outline"
              className="border-accent/30 text-accent text-xs"
            >
              <Eye className="h-3 w-3 mr-1" /> Public
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-border/40 text-muted-foreground text-xs"
            >
              <EyeOff className="h-3 w-3 mr-1" /> Private
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: files + description + signed copies */}
        <div className="md:col-span-2 space-y-4">
          {/* Media player — replaces old plain file list */}
          {asset.fileRefs.length > 0 && (
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="pt-4 px-4 pb-4">
                <AssetFileList fileRefs={asset.fileRefs} />
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {asset.description && (
            <Card className="bg-card border-border">
              <CardContent className="pt-4 px-4 pb-4">
                <p className="text-sm text-muted-foreground">
                  {asset.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Signed Copies */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4 px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <PenTool className="h-4 w-4 text-accent" />
                  Signed Copies ({copies.length})
                </h2>
                {isOwner && isEligible && !showSignForm && (
                  <Button
                    size="sm"
                    onClick={() => setShowSignForm(true)}
                    className="bg-accent text-accent-foreground hover:bg-accent/80 text-xs min-h-[44px] sm:min-h-[36px]"
                    data-ocid="sign-asset-btn"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Sign Asset
                  </Button>
                )}
              </div>

              {/* Follower requirement notice */}
              {isOwner &&
                isCertificateIssuer &&
                !isAdmin &&
                followerCount < 500 && (
                  <div className="bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                    You need 500+ followers to sign assets.{" "}
                    <span className="text-foreground font-medium">
                      Current: {followerCount.toLocaleString()}
                    </span>
                  </div>
                )}

              {/* Sign form */}
              {showSignForm && (
                <div className="bg-muted/30 rounded-xl p-4 border border-accent/20 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    <p className="text-xs text-accent font-medium">
                      Mint a new signed copy as ICRC-7 NFT
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Price (0 = free)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={signPrice}
                        onChange={(e) => setSignPrice(e.target.value)}
                        placeholder="0.00"
                        data-ocid="copy-price-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Currency</Label>
                      <Select
                        value={signCurrency}
                        onValueChange={setSignCurrency}
                      >
                        <SelectTrigger data-ocid="copy-currency-select">
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
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSign}
                      disabled={signAsset.isPending}
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80 text-xs min-h-[44px] sm:min-h-[36px]"
                      data-ocid="create-signed-copy-btn"
                    >
                      {signAsset.isPending
                        ? "Signing…"
                        : "Sign & Mint Certificate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSignForm(false)}
                      className="text-xs min-h-[44px] sm:min-h-[36px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* New copy certificate preview */}
              {newCopyId && (
                <CertificateDisplay
                  certificate={{
                    id: newCopyId,
                    sequenceNumber: copies.length + 1,
                    assetTitle: asset.name,
                  }}
                  showDownload
                  showValidate
                />
              )}

              {/* Copies list */}
              {copiesLoading ? (
                <div className="space-y-2">
                  {["a", "b"].map((k) => (
                    <Skeleton key={`c-sk-${k}`} className="h-10 rounded" />
                  ))}
                </div>
              ) : copies.length === 0 && !showSignForm ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No signed copies yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {copies.map((copy) => {
                    const ownerPrincipal = copy.ownerId?.toString();
                    const isMyOwnedCopy =
                      myPrincipal && ownerPrincipal === myPrincipal;
                    return (
                      <div
                        key={copy.id}
                        className="flex items-center justify-between bg-muted/20 rounded px-3 py-2.5 border border-border/30 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-accent font-bold">
                            #{Number(copy.sequenceNumber)}
                          </span>
                          <span className="text-muted-foreground truncate max-w-[120px]">
                            {isMyOwnedCopy
                              ? "You"
                              : `${ownerPrincipal?.slice(0, 8)}…`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {copy.price !== undefined && (
                            <span className="text-foreground">
                              {copy.price === BigInt(0)
                                ? "Free"
                                : formatAmount(
                                    copy.price,
                                    (copy.currency as "ICP") ?? "ICP",
                                  )}
                            </span>
                          )}
                          <Link
                            to="/validate"
                            search={{ certId: copy.certificateId }}
                            className="text-accent hover:text-accent/80"
                            data-ocid="copy-cert-link"
                          >
                            <ShieldCheck className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: metadata */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4 px-4 pb-4 space-y-3">
              {/* Owner */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Owner</p>
                <ProfileBadge
                  profile={{
                    principal: asset.ownerId?.toString(),
                    displayName: `${asset.ownerId?.toString().slice(0, 12)}…`,
                  }}
                  size="sm"
                />
              </div>
              <Separator className="opacity-30" />

              <div className="space-y-2 text-xs">
                {asset.collectionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collection</span>
                    <Link
                      to="/collections/$collectionId"
                      params={{ collectionId: asset.collectionId }}
                      className="text-accent underline hover:text-accent/80"
                    >
                      View
                    </Link>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="text-foreground">
                    {asset.basePrice === BigInt(0)
                      ? "Free"
                      : formatAmount(asset.basePrice, "ICP")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Royalty</span>
                  <span className="text-foreground">
                    {(Number(asset.royaltyBps) / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span className="text-foreground">
                    {asset.fileRefs.length}
                  </span>
                </div>
                {asset.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-foreground">
                      {formatDate(asset.createdAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Privacy toggle for owner */}
              {isOwner && (
                <>
                  <Separator className="opacity-30" />
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Public Visibility
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentPrivacy
                          ? "Visible to everyone"
                          : "Only visible to you"}
                      </p>
                    </div>
                    <Switch
                      checked={currentPrivacy}
                      onCheckedChange={handlePrivacyToggle}
                      disabled={updateAsset.isPending}
                      data-ocid="asset-privacy-toggle"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Authenticity badge */}
          <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-lg px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="text-xs text-accent font-medium">
              ICRC-7 NFT · Fakes are impossible
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
