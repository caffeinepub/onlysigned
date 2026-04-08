import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FolderOpen,
  Lock,
  ShoppingCart,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Collection } from "../backend-types";
import { ItemType, SaleMethod } from "../backend-types";
import ProfileBadge from "../components/ProfileBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCollection,
  useDelistItem,
  useListForSale,
  usePublicAssets,
  usePurchaseItem,
  useUpdateCollection,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../lib/utils";

const CURRENCIES = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;
const SALE_METHODS = [
  { value: SaleMethod.Direct, label: "Direct Purchase" },
  { value: SaleMethod.Auction, label: "Auction" },
] as const;

export default function CollectionDetailPage() {
  const { collectionId } = useParams({ from: "/collections/$collectionId" });
  const { data: collectionRaw, isLoading } = useCollection(collectionId);
  const { identity } = useInternetIdentity();
  const purchaseItem = usePurchaseItem();
  const listForSale = useListForSale();
  const delistItem = useDelistItem();
  const updateCollection = useUpdateCollection();

  const col = collectionRaw as Collection | null | undefined;

  // Load public assets for this collection's owner to show contained assets
  const { data: ownerAssets } = usePublicAssets(col?.ownerId?.toString());

  const [buyModal, setBuyModal] = useState(false);
  const [saleModal, setSaleModal] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [saleCurrency, setSaleCurrency] = useState<string>("ICP");
  const [saleMethod, setSaleMethod] = useState<SaleMethod>(SaleMethod.Direct);
  const [privacyPublic, setPrivacyPublic] = useState<boolean>(
    col?.privacyPublic ?? false,
  );

  const myPrincipal = identity?.getPrincipal().toString();
  const isOwner = !!myPrincipal && col?.ownerId?.toString() === myPrincipal;
  const isForSale = !!col?.forSale;
  const currentPrivacy = isOwner
    ? privacyPublic
    : (col?.privacyPublic ?? false);

  // Filter assets that belong to this collection
  const collectionAssets = (ownerAssets ?? []).filter(
    (a) => (a as { collectionId?: string }).collectionId === collectionId,
  );

  const handleBuy = async () => {
    if (!col?.id) return;
    try {
      // Purchase via listing — we need a listing ID. Use the collection ID as fallback.
      await purchaseItem.mutateAsync(col.id);
      toast.success("Collection purchased!");
      setBuyModal(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Purchase failed.");
    }
  };

  const handleListForSale = async () => {
    if (!collectionId) return;
    try {
      await listForSale.mutateAsync({
        itemType: ItemType.Collection,
        itemId: collectionId,
        price: BigInt(Math.floor(Number.parseFloat(salePrice || "0") * 1e8)),
        currency: saleCurrency,
        saleMethod,
      });
      toast.success("Collection listed for sale!");
      setSaleModal(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to list collection.");
    }
  };

  const handleDelist = async () => {
    if (!col?.id) return;
    try {
      await delistItem.mutateAsync(col.id);
      toast.success("Collection delisted.");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to delist.");
    }
  };

  const handlePrivacyToggle = async (val: boolean) => {
    if (!col || !collectionId) return;
    setPrivacyPublic(val);
    try {
      await updateCollection.mutateAsync({
        id: collectionId,
        name: col.name,
        description: col.description,
        privacyPublic: val,
        forSale: col.forSale,
        salePrice: col.salePrice,
        saleCurrency: col.saleCurrency,
        saleMethod: col.saleMethod,
      });
      toast.success(
        val ? "Collection is now public" : "Collection is now private",
      );
    } catch {
      setPrivacyPublic(!val);
      toast.error("Failed to update privacy.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!col) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Lock className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          Collection not found or private.
        </p>
        <Link to="/marketplace" className="text-accent underline text-sm">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div
      className="max-w-3xl mx-auto space-y-6"
      data-ocid="collection-detail-page"
    >
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link
          to="/collections"
          className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] sm:min-h-[36px] flex items-center"
          data-ocid="collection-back-link"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display font-bold text-xl text-foreground truncate flex-1">
          {col.name}
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
          {isForSale && (
            <Badge
              variant="outline"
              className="border-accent/40 text-accent text-[10px]"
            >
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              For Sale
            </Badge>
          )}
        </div>
      </div>

      {/* Collection info card */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 px-4 pb-4 space-y-4">
          {col.description && (
            <p className="text-sm text-muted-foreground">{col.description}</p>
          )}

          {/* Owner */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Owner</p>
              <ProfileBadge
                profile={{
                  principal: col.ownerId?.toString(),
                  displayName: `${col.ownerId?.toString().slice(0, 12)}…`,
                }}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                <FolderOpen className="h-3 w-3 inline mr-1" />
                {collectionAssets.length} assets
              </span>
              {col.createdAt && (
                <span>Created {formatDate(col.createdAt)}</span>
              )}
            </div>
          </div>

          {/* For sale section */}
          {isForSale && (
            <>
              <Separator className="opacity-30" />
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-display font-bold text-accent text-lg">
                    {col.salePrice === BigInt(0)
                      ? "Free"
                      : formatAmount(
                          col.salePrice,
                          (col.saleCurrency as "ICP") ?? "ICP",
                        )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {col.saleMethod}
                  </p>
                </div>
                {identity && !isOwner && (
                  <Button
                    onClick={() => setBuyModal(true)}
                    className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
                    data-ocid="buy-collection-btn"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    {col.salePrice === BigInt(0) ? "Claim Free" : "Buy Now"}
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Owner actions */}
          {isOwner && (
            <>
              <Separator className="opacity-30" />
              <div className="space-y-3">
                {/* Privacy toggle */}
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
                    disabled={updateCollection.isPending}
                    data-ocid="collection-privacy-toggle"
                  />
                </div>
                {/* Sale actions */}
                <div className="flex flex-wrap gap-2">
                  {!isForSale ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSaleModal(true)}
                      className="border-accent/30 text-accent hover:bg-accent/10 text-xs min-h-[44px] sm:min-h-[36px]"
                      data-ocid="collection-detail-list-sale-btn"
                    >
                      <Tag className="h-3.5 w-3.5 mr-1" />
                      List for Sale
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelist}
                      disabled={delistItem.isPending}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs min-h-[44px] sm:min-h-[36px]"
                      data-ocid="collection-delist-btn"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      {delistItem.isPending ? "Delisting…" : "Delist"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Assets in collection */}
      {collectionAssets.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-accent" />
            Assets in this Collection
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {collectionAssets.map((asset) => {
              const a = asset as {
                id: string;
                name: string;
                fileRefs: unknown[];
              };
              return (
                <Link
                  key={a.id}
                  to="/assets/$assetId"
                  params={{ assetId: a.id }}
                  className="group"
                  data-ocid="collection-asset-link"
                >
                  <Card className="bg-card border-border hover:border-accent/30 transition-colors">
                    <CardContent className="pt-3 px-3 pb-3">
                      <div className="aspect-video bg-muted/40 rounded-md mb-2 flex items-center justify-center">
                        <FolderOpen className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {a.name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty assets state */}
      {collectionAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center border border-dashed border-border rounded-xl">
          <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No public assets in this collection yet.
          </p>
        </div>
      )}

      {/* Buy modal */}
      <Dialog open={buyModal} onOpenChange={setBuyModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Confirm Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-sm">
              <p className="font-medium text-foreground">{col.name}</p>
              <p className="text-accent font-semibold mt-1">
                {col.salePrice === BigInt(0)
                  ? "Free"
                  : formatAmount(
                      col.salePrice,
                      (col.saleCurrency as "ICP") ?? "ICP",
                    )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBuy}
                disabled={purchaseItem.isPending}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
                data-ocid="buy-collection-confirm-btn"
              >
                {purchaseItem.isPending ? "Processing…" : "Confirm Purchase"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBuyModal(false)}
                className="flex-1 min-h-[44px] sm:min-h-[36px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* List for sale modal */}
      <Dialog open={saleModal} onOpenChange={setSaleModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              List Collection for Sale
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="col-sale-price">Price (0 for free)</Label>
              <Input
                id="col-sale-price"
                placeholder="0.00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                data-ocid="col-detail-price-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={saleCurrency} onValueChange={setSaleCurrency}>
                  <SelectTrigger data-ocid="col-detail-currency-select">
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
                  <SelectTrigger data-ocid="col-detail-method-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
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
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
                data-ocid="col-detail-list-btn"
              >
                {listForSale.isPending ? "Listing…" : "List for Sale"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaleModal(false)}
                className="flex-1 min-h-[44px] sm:min-h-[36px]"
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
