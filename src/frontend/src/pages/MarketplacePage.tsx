import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  Crown,
  Filter,
  Gavel,
  Layers,
  Music,
  ShoppingCart,
  SortAsc,
  Star,
  Tag,
  Trash2,
  Video,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  ItemType,
  MarketplaceListing,
  SaleMethod,
} from "../backend-types";
import ProfileBadge from "../components/ProfileBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDelistItem,
  useMarketplaceListings,
  useMyWallet,
  usePlaceBid,
  usePublicMarketplaceListings,
  usePurchaseItem,
} from "../hooks/useQueries";
import { formatCurrency, formatPrincipal } from "../lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES_FILTER = ["All", "ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;
const SALE_METHODS = ["All", "Direct", "Auction"] as const;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const CURRENCY_SYMBOLS: Record<string, string> = {
  ICP: "ICP",
  ckBTC: "₿",
  ckUSDC: "USDC",
  ckUSDT: "USDT",
};

const ISSUER_SUBTYPES = {
  Celebrity: {
    icon: Crown,
    label: "Celebrity",
    cls: "text-chart-4 border-chart-4/40",
  },
  Government: {
    icon: Building2,
    label: "Government",
    cls: "text-primary border-primary/40",
  },
  Institution: {
    icon: Star,
    label: "Institution",
    cls: "text-chart-5 border-chart-5/40",
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWalletBalance(
  wallet: Record<string, bigint> | null,
  currency: string,
): bigint {
  if (!wallet) return BigInt(0);
  const map: Record<string, keyof typeof wallet> = {
    icp: "icp",
    ckbtc: "ckbtc",
    ckusdc: "ckusdc",
    ckusdt: "ckusdt",
  };
  return (wallet[map[currency.toLowerCase()] ?? "icp"] as bigint) ?? BigInt(0);
}

function sortListings(
  listings: MarketplaceListing[],
  sort: SortOption,
): MarketplaceListing[] {
  return [...listings].sort((a, b) => {
    if (sort === "newest") return Number(b.listedAt - a.listedAt);
    if (sort === "price_asc") return Number(a.price - b.price);
    if (sort === "price_desc") return Number(b.price - a.price);
    return 0;
  });
}

function filterListings(
  listings: MarketplaceListing[],
  itemType: string,
  currency: string,
  saleMethod: string,
): MarketplaceListing[] {
  return listings.filter((l) => {
    if (itemType !== "All" && l.itemType !== itemType) return false;
    if (currency !== "All" && l.currency !== currency) return false;
    if (saleMethod !== "All" && l.saleMethod !== saleMethod) return false;
    return true;
  });
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const myPrincipal = identity?.getPrincipal().toString();

  // Filters & sort
  const [itemType, setItemType] = useState<string>("All");
  const [currency, setCurrency] = useState<string>("All");
  const [saleMethod, setSaleMethod] = useState<string>("All");
  const [sort, setSort] = useState<SortOption>("newest");

  // Modal state
  const [buyListing, setBuyListing] = useState<MarketplaceListing | null>(null);
  const [bidListing, setBidListing] = useState<MarketplaceListing | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [delistId, setDelistId] = useState<string | null>(null);

  // Data
  const { data: publicListings = [], isLoading: publicLoading } =
    usePublicMarketplaceListings();
  const { data: allMyListings = [], isLoading: myListingsLoading } =
    useMarketplaceListings(isAuthenticated ? {} : null);
  const { data: wallet } = useMyWallet();

  const purchaseItem = usePurchaseItem();
  const placeBid = usePlaceBid();
  const delistItem = useDelistItem();

  // Compute filtered + sorted public listings
  const displayedListings = useMemo(() => {
    const filtered = filterListings(
      publicListings,
      itemType,
      currency,
      saleMethod,
    );
    return sortListings(filtered, sort);
  }, [publicListings, itemType, currency, saleMethod, sort]);

  // My listings (active, and I'm the seller)
  const myActiveListings = useMemo(
    () =>
      allMyListings.filter(
        (l) =>
          l.active &&
          myPrincipal &&
          l.sellerPrincipal.toString() === myPrincipal,
      ),
    [allMyListings, myPrincipal],
  );

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleBuy = async () => {
    if (!buyListing) return;
    if (!isAuthenticated) {
      toast.error("Connect Internet Identity to purchase.");
      return;
    }
    // Balance check for non-free items
    const isFree = buyListing.price === BigInt(0);
    if (!isFree && wallet) {
      const bal = getWalletBalance(
        wallet as unknown as Record<string, bigint>,
        buyListing.currency,
      );
      if (bal < buyListing.price) {
        toast.error(`Insufficient ${buyListing.currency} balance.`);
        setBuyListing(null);
        return;
      }
    }
    try {
      await purchaseItem.mutateAsync(buyListing.id);
      toast.success(
        buyListing.price === BigInt(0)
          ? "Item claimed!"
          : "Purchase successful!",
      );
      setBuyListing(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Purchase failed. Please try again.",
      );
    }
  };

  const handleBid = async () => {
    if (!bidListing) return;
    if (!isAuthenticated) {
      toast.error("Connect Internet Identity to place a bid.");
      return;
    }
    const amountNum = Number.parseFloat(bidAmount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid bid amount.");
      return;
    }
    const amountBigInt = BigInt(Math.floor(amountNum * 1e8));
    if (wallet) {
      const bal = getWalletBalance(
        wallet as unknown as Record<string, bigint>,
        bidListing.currency,
      );
      if (bal < amountBigInt) {
        toast.error(`Insufficient ${bidListing.currency} balance.`);
        return;
      }
    }
    try {
      await placeBid.mutateAsync({
        listingId: bidListing.id,
        amount: amountBigInt,
      });
      toast.success("Bid placed successfully!");
      setBidListing(null);
      setBidAmount("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Bid failed. Please try again.",
      );
    }
  };

  const handleDelist = async () => {
    if (!delistId) return;
    try {
      await delistItem.mutateAsync(delistId);
      toast.success("Listing removed.");
      setDelistId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove listing.",
      );
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8" data-ocid="marketplace-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
            Marketplace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verified signed copies and collections — every certificate on-chain
          </p>
        </div>
        {isAuthenticated && wallet && (
          <WalletSummary wallet={wallet as unknown as Record<string, bigint>} />
        )}
      </div>

      {/* Filter bar */}
      <div
        className="bg-card border border-border rounded-xl p-4 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 sm:items-center"
        data-ocid="marketplace-filters"
      >
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
          <Filter className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Filters:</span>
        </div>

        <Select value={itemType} onValueChange={setItemType}>
          <SelectTrigger
            className="w-full sm:w-36 min-h-[44px] sm:min-h-[36px]"
            data-ocid="filter-item-type"
          >
            <SelectValue placeholder="Item Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="SignedCopy">Signed Copies</SelectItem>
            <SelectItem value="Collection">Collections</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger
            className="w-full sm:w-32 min-h-[44px] sm:min-h-[36px]"
            data-ocid="filter-currency"
          >
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES_FILTER.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "All" ? "All Currencies" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={saleMethod} onValueChange={setSaleMethod}>
          <SelectTrigger
            className="w-full sm:w-32 min-h-[44px] sm:min-h-[36px]"
            data-ocid="filter-sale-method"
          >
            <SelectValue placeholder="Sale Method" />
          </SelectTrigger>
          <SelectContent>
            {SALE_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m === "All" ? "All Methods" : m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
          <SortAsc className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger
              className="flex-1 sm:w-44 min-h-[44px] sm:min-h-[36px]"
              data-ocid="sort-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listings grid */}
      {publicLoading ? (
        <ListingGridSkeleton />
      ) : displayedListings.length === 0 ? (
        <EmptyState
          filtered={
            itemType !== "All" || currency !== "All" || saleMethod !== "All"
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onBuy={() => setBuyListing(listing)}
              onBid={() => setBidListing(listing)}
            />
          ))}
        </div>
      )}

      {/* My Listings */}
      {isAuthenticated && (
        <div className="space-y-4" data-ocid="my-listings-section">
          <Separator className="opacity-40" />
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-foreground">
              My Active Listings
            </h2>
            {myListingsLoading && (
              <span className="text-xs text-muted-foreground">Loading…</span>
            )}
          </div>

          {!myListingsLoading && myActiveListings.length === 0 ? (
            <div
              className="bg-card border border-border rounded-xl p-6 text-center"
              data-ocid="my-listings-empty"
            >
              <Tag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                You have no active listings.{" "}
                <Link to="/upload" className="text-accent hover:underline">
                  Sign an asset
                </Link>{" "}
                and list it to start selling.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myActiveListings.map((listing) => (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  onDelist={() => setDelistId(listing.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buy confirm dialog */}
      <BuyDialog
        listing={buyListing}
        wallet={wallet as unknown as Record<string, bigint> | null}
        isPending={purchaseItem.isPending}
        onConfirm={handleBuy}
        onCancel={() => setBuyListing(null)}
      />

      {/* Bid dialog */}
      <BidDialog
        listing={bidListing}
        bidAmount={bidAmount}
        onBidAmountChange={setBidAmount}
        wallet={wallet as unknown as Record<string, bigint> | null}
        isPending={placeBid.isPending}
        onConfirm={handleBid}
        onCancel={() => {
          setBidListing(null);
          setBidAmount("");
        }}
      />

      {/* Delist confirm */}
      <AlertDialog
        open={!!delistId}
        onOpenChange={(o) => !o && setDelistId(null)}
      >
        <AlertDialogContent className="bg-card border-border w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Remove Listing?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your item from the marketplace. You can re-list
              it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="delist-cancel-btn">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelist}
              disabled={delistItem.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
              data-ocid="delist-confirm-btn"
            >
              {delistItem.isPending ? "Removing…" : "Remove Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function WalletSummary({ wallet }: { wallet: Record<string, bigint> }) {
  const currencies = [
    { key: "icp", label: "ICP" },
    { key: "ckbtc", label: "ckBTC" },
    { key: "ckusdc", label: "ckUSDC" },
    { key: "ckusdt", label: "ckUSDT" },
  ] as const;

  const nonZero = currencies.filter(
    (c) => (wallet[c.key] ?? BigInt(0)) > BigInt(0),
  );
  const display = nonZero.length > 0 ? nonZero : [currencies[0]];

  return (
    <div
      className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-shrink-0"
      data-ocid="wallet-summary"
    >
      <Wallet className="h-4 w-4 text-accent flex-shrink-0" />
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {display.map((c) => (
          <span key={c.key} className="text-xs text-muted-foreground">
            <span className="font-mono text-foreground">
              {formatCurrency(wallet[c.key] ?? BigInt(0), c.label)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function IssuerSubtypeBadge({ subtype }: { subtype?: string }) {
  if (!subtype) return null;
  const config = ISSUER_SUBTYPES[subtype as keyof typeof ISSUER_SUBTYPES];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 border flex-shrink-0 ${config.cls}`}
    >
      <Icon className="h-2.5 w-2.5 mr-0.5" />
      {config.label}
    </Badge>
  );
}

function SaleMethodBadge({ method }: { method: SaleMethod }) {
  const isAuction = method === "Auction";
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
        isAuction
          ? "border-chart-4/40 text-chart-4"
          : "border-accent/40 text-accent"
      }`}
    >
      {isAuction ? (
        <Gavel className="h-2.5 w-2.5 mr-0.5" />
      ) : (
        <Tag className="h-2.5 w-2.5 mr-0.5" />
      )}
      {isAuction ? "Auction" : "Direct"}
    </Badge>
  );
}

function ListingCard({
  listing,
  onBuy,
  onBid,
}: {
  listing: MarketplaceListing;
  onBuy: () => void;
  onBid: () => void;
}) {
  const isAuction = listing.saleMethod === "Auction";
  const isFree = listing.price === BigInt(0);
  const isCollection = listing.itemType === "Collection";
  const detailPath = isCollection
    ? `/collections/${listing.itemId}`
    : `/assets/${listing.itemId}`;

  return (
    <Card
      className="bg-card border-border hover:border-accent/30 transition-colors flex flex-col"
      data-ocid="listing-card"
    >
      {/* Media preview banner */}
      <Link to={detailPath} tabIndex={-1} aria-hidden>
        <div className="relative w-full h-28 bg-gradient-to-br from-accent/5 to-primary/5 rounded-t-xl overflow-hidden flex items-center justify-center border-b border-border/30">
          {isCollection ? (
            <div className="flex items-center gap-2 opacity-40">
              <Layers className="h-10 w-10 text-accent" />
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-40">
              <Video className="h-6 w-6 text-accent" />
              <Music className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
        </div>
      </Link>

      <CardContent className="pt-3 px-4 pb-3 flex-1 space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={detailPath}
              className="font-display font-semibold text-foreground hover:text-accent transition-colors block"
              data-ocid="listing-title-link"
            >
              <span className="flex items-center gap-1.5">
                {isCollection ? (
                  <Layers className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <Tag className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-sm">
                  {isCollection ? "Collection" : "Signed Copy"}{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    #{formatPrincipal(listing.itemId)}
                  </span>
                </span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-border/50 text-muted-foreground"
            >
              {isCollection ? "Collection" : "Signed Copy"}
            </Badge>
          </div>
        </div>

        {/* Sale method + issuer subtype */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <SaleMethodBadge method={listing.saleMethod} />
          {!isCollection && <IssuerSubtypeBadge subtype={undefined} />}
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-border/50 text-muted-foreground"
          >
            {CURRENCY_SYMBOLS[listing.currency] ?? listing.currency}
          </Badge>
        </div>

        {/* Seller */}
        <ProfileBadge
          profile={{
            principal: listing.sellerPrincipal.toString(),
            displayName: formatPrincipal(listing.sellerPrincipal.toString()),
          }}
          size="sm"
          clickable
        />

        {/* Auction info */}
        {isAuction &&
          listing.highestBid !== undefined &&
          listing.highestBid > BigInt(0) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 rounded px-2 py-1">
              <Gavel className="h-3 w-3 flex-shrink-0" />
              <span>
                Current bid:{" "}
                <span className="text-accent font-semibold">
                  {formatCurrency(listing.highestBid, listing.currency)}
                </span>
              </span>
            </div>
          )}
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {isFree ? (
            <span className="font-display font-bold text-accent text-base">
              Free
            </span>
          ) : (
            <span className="font-display font-bold text-foreground text-sm">
              {formatCurrency(listing.price, listing.currency)}
            </span>
          )}
        </div>

        {isAuction ? (
          <Button
            size="sm"
            onClick={onBid}
            className="min-h-[44px] sm:min-h-[36px] bg-muted hover:bg-accent hover:text-accent-foreground border border-accent/30 text-accent text-xs transition-colors"
            data-ocid="listing-bid-btn"
          >
            <Gavel className="h-3.5 w-3.5 mr-1" />
            Bid
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onBuy}
            className="min-h-[44px] sm:min-h-[36px] bg-accent text-accent-foreground hover:bg-accent/80 text-xs"
            data-ocid="listing-buy-btn"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            {isFree ? "Claim" : "Buy Now"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function MyListingCard({
  listing,
  onDelist,
}: {
  listing: MarketplaceListing;
  onDelist: () => void;
}) {
  const isAuction = listing.saleMethod === "Auction";
  const isCollection = listing.itemType === "Collection";

  return (
    <Card
      className="bg-card border-border flex flex-col"
      data-ocid="my-listing-card"
    >
      <CardContent className="pt-3 px-4 pb-3 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {isCollection ? "Collection" : "Signed Copy"}{" "}
              <span className="font-mono text-xs text-muted-foreground">
                #{formatPrincipal(listing.itemId)}
              </span>
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <SaleMethodBadge method={listing.saleMethod} />
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-border/50 text-muted-foreground"
              >
                {listing.currency}
              </Badge>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display font-semibold text-sm text-foreground">
              {listing.price === BigInt(0)
                ? "Free"
                : formatCurrency(listing.price, listing.currency)}
            </p>
            {isAuction &&
              listing.highestBid !== undefined &&
              listing.highestBid > BigInt(0) && (
                <p className="text-xs text-accent">
                  Bid: {formatCurrency(listing.highestBid, listing.currency)}
                </p>
              )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-3 pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onDelist}
          className="w-full min-h-[44px] sm:min-h-[36px] border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
          data-ocid="delist-btn"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Remove Listing
        </Button>
      </CardFooter>
    </Card>
  );
}

function BuyDialog({
  listing,
  wallet,
  isPending,
  onConfirm,
  onCancel,
}: {
  listing: MarketplaceListing | null;
  wallet: Record<string, bigint> | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!listing) return null;

  const isFree = listing.price === BigInt(0);
  const isCollection = listing.itemType === "Collection";
  const balance = getWalletBalance(wallet, listing.currency);
  const hasEnough = isFree || balance >= listing.price;

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="bg-card border-border w-[95vw] max-w-lg"
        data-ocid="buy-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {isFree ? "Claim Free Item" : "Confirm Purchase"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item info */}
          <div className="bg-muted/20 rounded-lg p-4 border border-border/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {isCollection ? "Collection" : "Signed Copy"}
              </p>
              <SaleMethodBadge method={listing.saleMethod} />
            </div>
            <p className="font-mono text-xs text-muted-foreground break-all">
              {listing.itemId}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-display font-bold text-accent text-lg">
                {isFree
                  ? "Free"
                  : formatCurrency(listing.price, listing.currency)}
              </span>
            </div>
          </div>

          {/* Wallet balance */}
          {!isFree && wallet && (
            <div
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm border ${
                hasEnough
                  ? "bg-muted/10 border-border/50"
                  : "bg-destructive/10 border-destructive/30"
              }`}
              data-ocid="balance-check"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Your balance
              </span>
              <span
                className={`font-mono font-semibold ${hasEnough ? "text-foreground" : "text-destructive"}`}
              >
                {formatCurrency(balance, listing.currency)}
              </span>
            </div>
          )}

          {/* Insufficient funds warning */}
          {!isFree && !hasEnough && (
            <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3 border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Insufficient {listing.currency} balance. Please deposit funds in
                your{" "}
                <Link to="/profile" className="underline font-medium">
                  wallet
                </Link>{" "}
                before purchasing.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onConfirm}
              disabled={isPending || (!isFree && !hasEnough)}
              className="flex-1 min-h-[44px] sm:min-h-[36px] bg-accent text-accent-foreground hover:bg-accent/80"
              data-ocid="buy-confirm-btn"
            >
              {isPending
                ? "Processing…"
                : isFree
                  ? "Claim for Free"
                  : "Confirm Purchase"}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 min-h-[44px] sm:min-h-[36px]"
              data-ocid="buy-cancel-btn"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BidDialog({
  listing,
  bidAmount,
  onBidAmountChange,
  wallet,
  isPending,
  onConfirm,
  onCancel,
}: {
  listing: MarketplaceListing | null;
  bidAmount: string;
  onBidAmountChange: (v: string) => void;
  wallet: Record<string, bigint> | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!listing) return null;

  const bidNum = Number.parseFloat(bidAmount);
  const bidBigInt =
    !Number.isNaN(bidNum) && bidNum > 0
      ? BigInt(Math.floor(bidNum * 1e8))
      : null;
  const balance = getWalletBalance(wallet, listing.currency);
  const hasEnough = bidBigInt ? balance >= bidBigInt : true;
  const minBid =
    listing.highestBid !== undefined && listing.highestBid > BigInt(0)
      ? listing.highestBid
      : listing.price;

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="bg-card border-border w-[95vw] max-w-lg"
        data-ocid="bid-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Place a Bid</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current bid info */}
          <div className="bg-muted/20 rounded-lg p-4 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Starting / Min
              </span>
              <span className="font-semibold text-foreground text-sm">
                {formatCurrency(listing.price, listing.currency)}
              </span>
            </div>
            {listing.highestBid !== undefined &&
              listing.highestBid > BigInt(0) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Gavel className="h-3.5 w-3.5" />
                    Current bid
                  </span>
                  <span className="font-bold text-accent">
                    {formatCurrency(listing.highestBid, listing.currency)}
                  </span>
                </div>
              )}
          </div>

          {/* Bid amount input */}
          <div className="space-y-2">
            <Label htmlFor="bidAmount">
              Your bid amount{" "}
              <span className="text-muted-foreground text-xs">
                (min: {formatCurrency(minBid, listing.currency)})
              </span>
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="bidAmount"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.0000"
                value={bidAmount}
                onChange={(e) => onBidAmountChange(e.target.value)}
                className="flex-1 min-h-[44px] sm:min-h-[36px]"
                data-ocid="bid-amount-input"
              />
              <Badge
                variant="outline"
                className="px-3 py-1.5 border-accent/40 text-accent font-mono"
              >
                {listing.currency}
              </Badge>
            </div>
          </div>

          {/* Balance display */}
          {wallet && (
            <div
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm border ${
                hasEnough
                  ? "bg-muted/10 border-border/50"
                  : "bg-destructive/10 border-destructive/30"
              }`}
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Your balance
              </span>
              <span
                className={`font-mono font-semibold ${hasEnough ? "text-foreground" : "text-destructive"}`}
              >
                {formatCurrency(balance, listing.currency)}
              </span>
            </div>
          )}

          {!hasEnough && bidBigInt && (
            <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3 border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Insufficient balance for this bid amount.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onConfirm}
              disabled={isPending || !bidAmount || !hasEnough}
              className="flex-1 min-h-[44px] sm:min-h-[36px] bg-accent text-accent-foreground hover:bg-accent/80"
              data-ocid="bid-confirm-btn"
            >
              {isPending ? "Placing bid…" : "Place Bid"}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 min-h-[44px] sm:min-h-[36px]"
              data-ocid="bid-cancel-btn"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 gap-4"
      data-ocid="marketplace-empty"
    >
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
        <ShoppingCart className="h-8 w-8 text-accent/60" />
      </div>
      <div className="text-center max-w-sm">
        <p className="font-display font-semibold text-foreground text-lg">
          {filtered ? "No matching listings" : "No items listed yet"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered
            ? "Try adjusting your filters to see more listings."
            : "Be the first to sign and sell — sign an asset to create a signed copy, then list it here."}
        </p>
      </div>
      {!filtered && (
        <Link to="/upload">
          <Button
            className="min-h-[44px] sm:min-h-[36px] bg-accent text-accent-foreground hover:bg-accent/80"
            data-ocid="marketplace-empty-cta"
          >
            Upload an Asset
          </Button>
        </Link>
      )}
    </div>
  );
}

function ListingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
        <Skeleton key={k} className="h-52 rounded-xl" />
      ))}
    </div>
  );
}
