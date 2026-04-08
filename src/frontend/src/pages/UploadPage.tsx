import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Collection, FileRef } from "../backend-types";
import CertificateDisplay from "../components/CertificateDisplay";
import ConnectWall from "../components/ConnectWall";
import PageScaffold from "../components/PageScaffold";
import { useActor } from "../hooks/useActor";
import { useAuth } from "../hooks/useAuth";
import { useFileUpload } from "../hooks/useFileStorage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin, useMyProfile } from "../hooks/useProfile";
import {
  useCreateAsset,
  useMyCollections,
  useSignAsset,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";

const CURRENCIES = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function UploadPage() {
  const { identity } = useInternetIdentity();
  if (!identity) {
    return (
      <ConnectWall message="Connect your wallet to upload assets and issue certificates." />
    );
  }
  return <UploadContent />;
}

// ─── Upload Content ───────────────────────────────────────────────────────────

/**
 * All known string representations of invalid / anonymous principals.
 * Matches the set in useActor.ts and useQueries.ts.
 */
const INVALID_PRINCIPALS_SET = new Set(["2vxsx-fae", "aaaaa-aa"]);

function UploadContent() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { isAuthenticated, principal } = useAuth();
  // actor is non-null ONLY when the identity is confirmed real and the actor
  // query has finished rebuilding — useActor() already enforces this contract.
  const { actor, isFetching: actorFetching } = useActor();
  const { data: profile } = useMyProfile();
  const isAdmin = useIsAdmin();
  const { data: collectionsRaw } = useMyCollections();
  const createAsset = useCreateAsset();
  const signAsset = useSignAsset();
  const { uploadFile, isUploading } = useFileUpload();

  const isCertificateIssuer = profile?.profileType === "CertificateIssuer";
  const followerCount = Number(profile?.followerCount ?? 0);
  const isEligible = isAdmin || (isCertificateIssuer && followerCount >= 500);
  const collections = (collectionsRaw ?? []) as Collection[];

  /**
   * authReady: the SINGLE source of truth for whether the form submit button
   * should be enabled. No timers, no polling — purely synchronous state checks.
   *
   * All three conditions must be true simultaneously:
   *   1. actor !== null  — useActor guarantees this only when identity is real
   *                        and the actor has finished rebuilding after login
   *   2. isAuthenticated — composite check: identity real + principal valid +
   *                        actor not mid-recreate
   *   3. !actorFetching  — actor query is not currently rebuilding
   *
   * Since actor !== null already implies isAuthenticated and !actorFetching,
   * checking all three is belt-and-suspenders but makes the intent explicit.
   */
  const principalText = principal?.toString() ?? "";
  const isValidPrincipal =
    principalText.length > 0 && !INVALID_PRINCIPALS_SET.has(principalText);
  const authReady =
    !!identity &&
    !isInitializing &&
    !actorFetching &&
    isAuthenticated &&
    isValidPrincipal &&
    actor !== null;

  // Form state
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionId, setCollectionId] = useState<string | undefined>(
    undefined,
  );
  const [basePrice, setBasePrice] = useState("0");
  const [royaltyPercent, setRoyaltyPercent] = useState("10");
  const [isPublic, setIsPublic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  // Post-create state
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);
  const [signedCopy, setSignedCopy] = useState<Record<string, unknown> | null>(
    null,
  );
  const [signPrice, setSignPrice] = useState("0");
  const [signCurrency, setSignCurrency] =
    useState<(typeof CURRENCIES)[number]>("ICP");

  // Validation
  const [errors, setErrors] = useState<{ name?: string; royalty?: string }>({});

  if (!isEligible) {
    return (
      <PageScaffold title="Upload Asset" description="Certificate Issuers only">
        <EligibilityWall
          isCertificateIssuer={isCertificateIssuer}
          followerCount={followerCount}
        />
      </PageScaffold>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    // Reset the input so the same file can be re-selected if removed
    if (e.target) e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Asset name is required.";
    const royaltyVal = Number(royaltyPercent);
    if (Number.isNaN(royaltyVal) || royaltyVal < 0 || royaltyVal > 100) {
      newErrors.royalty = "Royalty must be between 0 and 100.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!authReady) {
      toast.error(
        "Please wait for authentication to complete before creating an asset.",
      );
      return;
    }

    // Explicit principal guard — final safety net before any backend call.
    // Rejects the anonymous principal ("2vxsx-fae") and the all-zero/empty
    // principal ("aaaaa-aa") which can appear during identity transitions.
    const currentPrincipal = principal?.toString() ?? "";
    if (!currentPrincipal || INVALID_PRINCIPALS_SET.has(currentPrincipal)) {
      toast.error("Please log in before uploading an asset.");
      return;
    }

    // Fresh actor check at submission time — actor may have gone null since
    // the form rendered (e.g. identity refresh in the background).
    if (!actor) {
      toast.error(
        "Your session is not ready yet. Please wait a moment and try again.",
      );
      return;
    }

    if (!validate()) return;
    const royaltyVal = Number.parseFloat(royaltyPercent || "0");
    const priceVal = Number.parseFloat(basePrice || "0");

    try {
      // Step 1: Upload each file to blob storage and capture the returned path
      const fileRefs: FileRef[] = [];
      for (const f of files) {
        // Use a unique storage path: timestamp + filename to avoid collisions
        const storagePath = `assets/${Date.now()}-${f.name}`;
        const { path } = await uploadFile(storagePath, f, (pct) =>
          setUploadProgress((prev) => ({ ...prev, [f.name]: pct })),
        );
        fileRefs.push({
          filename: f.name,
          mimeType: f.type || "application/octet-stream",
          // Use the path returned by blob storage — this is what getFileReference() needs
          fileId: path,
          sizeBytes: BigInt(f.size),
        });
      }

      // Step 2: Create asset record with the correct fileIds
      const result = await createAsset.mutateAsync({
        name,
        description: description || undefined,
        collectionId: collectionId ?? undefined,
        basePrice: BigInt(Math.floor(priceVal * 1e8)),
        royaltyBps: BigInt(Math.floor(royaltyVal * 100)),
        fileRefs,
      });
      const assetId = typeof result === "string" ? result : null;
      setCreatedAssetId(assetId);
      setUploadProgress({});
      toast.success(
        "Asset created! Now sign it to mint an ICRC-7 certificate.",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create asset.";
      toast.error(msg);
      setUploadProgress({});
    }
  };

  const handleSign = async () => {
    if (!createdAssetId) return;
    const priceVal = Number.parseFloat(signPrice || "0");
    try {
      const result = await signAsset.mutateAsync({
        assetId: createdAssetId,
        price: BigInt(Math.floor(priceVal * 1e8)),
        currency: signCurrency,
      });
      setSignedCopy(result as unknown as Record<string, unknown>);
      toast.success("Certificate minted! ICRC-7 NFT created.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to sign asset.";
      toast.error(msg);
    }
  };

  const handleGoToAsset = () => {
    if (createdAssetId)
      navigate({ to: "/assets/$assetId", params: { assetId: createdAssetId } });
  };

  return (
    <PageScaffold
      title="Upload Asset"
      description="Upload digital assets and issue ICRC-7 signed certificates"
      breadcrumbs={[
        { label: "Collectibles", href: "/collections" },
        { label: "Upload Asset" },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {!createdAssetId ? (
          <AssetForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            collectionId={collectionId}
            setCollectionId={setCollectionId}
            basePrice={basePrice}
            setBasePrice={setBasePrice}
            royaltyPercent={royaltyPercent}
            setRoyaltyPercent={setRoyaltyPercent}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            files={files}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onRemoveFile={removeFile}
            collections={collections}
            errors={errors}
            onSubmit={handleSubmit}
            isPending={createAsset.isPending || isUploading}
            isAuthReady={authReady}
            isLoggedIn={isAuthenticated}
            uploadProgress={uploadProgress}
          />
        ) : (
          <PostCreateFlow
            assetName={name}
            signPrice={signPrice}
            setSignPrice={setSignPrice}
            signCurrency={signCurrency}
            setSignCurrency={setSignCurrency}
            onSign={handleSign}
            onGoToAsset={handleGoToAsset}
            isSigning={signAsset.isPending}
            signedCopy={signedCopy}
          />
        )}
      </div>
    </PageScaffold>
  );
}

// ─── Asset Form ───────────────────────────────────────────────────────────────

interface AssetFormProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  collectionId: string | undefined;
  setCollectionId: (v: string | undefined) => void;
  basePrice: string;
  setBasePrice: (v: string) => void;
  royaltyPercent: string;
  setRoyaltyPercent: (v: string) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  files: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (idx: number) => void;
  collections: Collection[];
  errors: { name?: string; royalty?: string };
  onSubmit: () => void;
  isPending: boolean;
  isAuthReady: boolean;
  /** True when identity is present but not yet confirmed as a real (non-anonymous) principal */
  isLoggedIn: boolean;
  uploadProgress: Record<string, number>;
}

function AssetForm({
  name,
  setName,
  description,
  setDescription,
  collectionId,
  setCollectionId,
  basePrice,
  setBasePrice,
  royaltyPercent,
  setRoyaltyPercent,
  isPublic,
  setIsPublic,
  files,
  fileInputRef,
  onFileChange,
  onRemoveFile,
  collections,
  errors,
  onSubmit,
  isPending,
  isAuthReady,
  isLoggedIn,
  uploadProgress,
}: AssetFormProps) {
  const isDisabled = isPending || !isAuthReady;
  return (
    <Card className="bg-card border-border" data-ocid="upload-asset-form">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Upload className="h-4 w-4 text-accent" />
          Asset Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="asset-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="asset-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Limited Edition Print #001"
            className={cn(errors.name && "border-destructive")}
            data-ocid="asset-name-input"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="asset-desc">Description</Label>
          <Textarea
            id="asset-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe your digital asset…"
            data-ocid="asset-desc-input"
          />
        </div>

        {/* File upload */}
        <div className="space-y-1.5">
          <Label>Files</Label>
          <button
            type="button"
            className="w-full border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:border-accent/40 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            data-ocid="file-drop-zone"
          >
            <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload files
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Images, audio, video, documents — multiple allowed
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFileChange}
              data-ocid="file-input"
            />
          </button>
          {files.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {files.map((file, idx) => {
                const pct = uploadProgress[file.name];
                const isUploading = pct !== undefined && pct < 100;
                return (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex flex-col gap-1 bg-muted/30 rounded-lg px-3 py-2 text-xs border border-border/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {isUploading ? (
                          <Loader2 className="h-3.5 w-3.5 text-accent animate-spin flex-shrink-0" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate text-foreground">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground/60 flex-shrink-0">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => onRemoveFile(idx)}
                          className="text-muted-foreground hover:text-destructive ml-2 flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-h-[24px] sm:min-w-[24px] flex items-center justify-center"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {isUploading && (
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator className="opacity-30" />

        {/* Collection + Royalty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="collection-select">Collection</Label>
            <Select
              value={collectionId ?? "__none__"}
              onValueChange={(v) =>
                setCollectionId(v === "__none__" ? undefined : v)
              }
            >
              <SelectTrigger
                id="collection-select"
                data-ocid="collection-select"
              >
                <SelectValue placeholder="No collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No collection</SelectItem>
                {collections.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="royalty">
              Royalty %{" "}
              <span className="text-muted-foreground text-xs">(0–100)</span>
            </Label>
            <Input
              id="royalty"
              type="number"
              min="0"
              max="100"
              value={royaltyPercent}
              onChange={(e) => setRoyaltyPercent(e.target.value)}
              className={cn(errors.royalty && "border-destructive")}
              data-ocid="royalty-input"
            />
            {errors.royalty && (
              <p className="text-xs text-destructive">{errors.royalty}</p>
            )}
          </div>
        </div>

        {/* Base price */}
        <div className="space-y-1.5">
          <Label htmlFor="base-price">
            Base Price{" "}
            <span className="text-muted-foreground text-xs">(0 for free)</span>
          </Label>
          <Input
            id="base-price"
            type="number"
            min="0"
            step="any"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            data-ocid="base-price-input"
          />
        </div>

        {/* Privacy toggle */}
        <div className="flex items-center gap-3">
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
            data-ocid="asset-privacy-toggle"
          />
          <Label className="text-sm cursor-pointer">
            {isPublic ? "Public" : "Private (default)"}
          </Label>
        </div>

        {/* Auth loading warning */}
        {!isAuthReady && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
            <span>
              {!isLoggedIn
                ? "Please log in to create assets."
                : "Waiting for authentication…"}
            </span>
          </div>
        )}

        <Button
          onClick={onSubmit}
          disabled={isDisabled}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[40px]"
          data-ocid="create-asset-btn"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {Object.keys(uploadProgress).length > 0
                ? "Uploading files…"
                : "Creating…"}
            </span>
          ) : !isLoggedIn ? (
            "Login required"
          ) : !isAuthReady ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Authenticating…
            </span>
          ) : (
            "Create Asset"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Post-Create Flow ─────────────────────────────────────────────────────────

interface PostCreateFlowProps {
  assetName: string;
  signPrice: string;
  setSignPrice: (v: string) => void;
  signCurrency: (typeof CURRENCIES)[number];
  setSignCurrency: (v: (typeof CURRENCIES)[number]) => void;
  onSign: () => void;
  onGoToAsset: () => void;
  isSigning: boolean;
  signedCopy: Record<string, unknown> | null;
}

function PostCreateFlow({
  assetName,
  signPrice,
  setSignPrice,
  signCurrency,
  setSignCurrency,
  onSign,
  onGoToAsset,
  isSigning,
  signedCopy,
}: PostCreateFlowProps) {
  return (
    <div className="space-y-4" data-ocid="post-create-flow">
      {/* Success banner */}
      <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3">
        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
        <p className="text-sm text-accent font-medium">
          Asset created successfully!
        </p>
      </div>

      {!signedCopy ? (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              Sign &amp; Mint Certificate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                Signing creates an ICRC-7 NFT certificate with cryptographic
                proof of authenticity.
              </p>
              <p className="text-muted-foreground/60 pl-5">
                Each signed copy receives a unique sequence number.
              </p>
            </div>

            <Separator className="opacity-30" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sign-price">
                  Price for This Copy{" "}
                  <span className="text-muted-foreground text-xs">
                    (0 for free)
                  </span>
                </Label>
                <Input
                  id="sign-price"
                  type="number"
                  min="0"
                  step="any"
                  value={signPrice}
                  onChange={(e) => setSignPrice(e.target.value)}
                  data-ocid="sign-price-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  value={signCurrency}
                  onValueChange={(v) =>
                    setSignCurrency(v as (typeof CURRENCIES)[number])
                  }
                >
                  <SelectTrigger data-ocid="sign-currency-select">
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

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={onSign}
                disabled={isSigning}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[40px]"
                data-ocid="sign-asset-btn"
              >
                {isSigning ? "Signing…" : "Sign & Mint Certificate"}
              </Button>
              <Button
                variant="outline"
                onClick={onGoToAsset}
                className="min-h-[44px] sm:min-h-[40px]"
                data-ocid="go-to-asset-btn"
              >
                Skip, go to asset
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-ocid="certificate-minted-section">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <p className="text-sm font-medium text-foreground">
              Certificate minted!
            </p>
            <Badge
              variant="outline"
              className="border-accent/40 text-accent text-[10px]"
            >
              ICRC-7 NFT
            </Badge>
          </div>
          <CertificateDisplay
            certificate={{
              id:
                (signedCopy.certificateId as string) ??
                (signedCopy.id as string) ??
                "cert",
              sequenceNumber:
                Number(signedCopy.sequenceNumber as bigint | number) ?? 1,
              assetTitle: assetName,
              shareableUrl: signedCopy.shareableUrl as string,
              icrc7TokenId: signedCopy.tokenId?.toString() ?? "",
            }}
            showDownload
            showValidate
          />
          <Button
            onClick={onGoToAsset}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[40px]"
            data-ocid="view-asset-btn"
          >
            View Asset
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Eligibility Wall ─────────────────────────────────────────────────────────

function EligibilityWall({
  isCertificateIssuer,
  followerCount,
}: {
  isCertificateIssuer: boolean;
  followerCount: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 gap-6 text-center max-w-md mx-auto"
      data-ocid="upload-eligibility-wall"
    >
      <div className="w-20 h-20 rounded-full bg-muted/40 border border-border flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-xl font-bold text-foreground">
          Certificate Issuer Status Required
        </h2>
        <p className="text-sm text-muted-foreground">
          To upload assets and issue certificates, you need both of the
          following:
        </p>
      </div>
      <ul className="text-sm space-y-2 text-left w-full max-w-xs">
        <li className="flex items-center gap-3">
          <span
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0",
              isCertificateIssuer
                ? "bg-accent/20 text-accent"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isCertificateIssuer ? "✓" : "1"}
          </span>
          <span
            className={
              isCertificateIssuer ? "text-foreground" : "text-muted-foreground"
            }
          >
            Certificate Issuer profile type
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0",
              followerCount >= 500
                ? "bg-accent/20 text-accent"
                : "bg-muted text-muted-foreground",
            )}
          >
            {followerCount >= 500 ? "✓" : "2"}
          </span>
          <span
            className={
              followerCount >= 500 ? "text-foreground" : "text-muted-foreground"
            }
          >
            500+ followers{" "}
            <span className="text-muted-foreground/60">
              ({followerCount} current)
            </span>
          </span>
        </li>
      </ul>
      <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-4 py-2.5 border border-border/50 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Grow your following on your public profile to reach 500 followers
        </span>
      </div>
      <Button
        asChild
        className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
        data-ocid="upgrade-profile-btn"
      >
        <Link to="/profile">Update Profile Type</Link>
      </Button>
    </div>
  );
}
