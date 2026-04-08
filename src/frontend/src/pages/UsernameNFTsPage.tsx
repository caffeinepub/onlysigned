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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AtSign,
  CheckCircle,
  Clock,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConnectWall from "../components/ConnectWall";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useMyUsernameOffers,
  useSubmitUsernameOffer,
  useUsernameNFT,
} from "../hooks/useQueries";
import { formatAmount, formatDate, formatPrincipal } from "../lib/utils";

const CURRENCIES = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;

export default function UsernameNFTsPage() {
  const { identity } = useInternetIdentity();
  if (!identity) {
    return (
      <ConnectWall message="Connect your wallet to search for username NFTs and submit offers." />
    );
  }
  return <UsernameNFTsContent />;
}

function UsernameNFTsContent() {
  const [searchInput, setSearchInput] = useState("");
  const [queryUsername, setQueryUsername] = useState<string | undefined>(
    undefined,
  );
  const [offerAmount, setOfferAmount] = useState("");
  const [offerCurrency, setOfferCurrency] = useState<string>("ICP");

  const { data: nftRaw, isLoading: nftLoading } = useUsernameNFT(queryUsername);
  const { data: myOffersRaw, isLoading: offersLoading } = useMyUsernameOffers();
  const submitOffer = useSubmitUsernameOffer();

  const nft = nftRaw as Record<string, unknown> | null | undefined;
  const myOffers = (myOffersRaw as unknown[]) ?? [];

  const handleSearch = () => {
    if (!searchInput.trim()) {
      toast.error("Enter a username to search.");
      return;
    }
    setQueryUsername(searchInput.trim().toLowerCase());
  };

  const handleSubmitOffer = async () => {
    if (!queryUsername) return;
    const amt = Number.parseFloat(offerAmount);
    if (Number.isNaN(amt) || amt < 0) {
      toast.error("Please enter a valid offer amount.");
      return;
    }
    try {
      await submitOffer.mutateAsync({
        username: queryUsername,
        amount: BigInt(Math.floor(amt * 1e8)),
        currency: offerCurrency,
      });
      toast.success("Offer submitted successfully!");
      setOfferAmount("");
    } catch {
      toast.error("Failed to submit offer. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-ocid="username-nfts-page">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">
          Username NFTs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search username availability and submit purchase offers to admin
        </p>
      </div>

      <Card className="bg-muted/20 border-border/50">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Username NFTs are minted and transferred by admin only. Submit an
              offer to request a username. Once you own a Username NFT, you can
              set your verified username in your profile.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Search className="h-4 w-4 text-accent" />
            Search Username
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="username"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-ocid="username-search-input"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-accent text-accent-foreground hover:bg-accent/80"
              data-ocid="username-search-btn"
            >
              Search
            </Button>
          </div>

          {/* Search results */}
          {queryUsername && (
            <div className="mt-2">
              {nftLoading ? (
                <Skeleton className="h-24 w-full rounded-lg" />
              ) : nft ? (
                <div
                  className="bg-muted/30 rounded-xl p-4 border border-accent/20 space-y-3"
                  data-ocid="username-nft-found"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="font-display font-semibold text-foreground">
                      @{nft.username as string}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-accent/40 text-accent"
                    >
                      Owned
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Owner</p>
                      <p className="font-mono text-foreground">
                        {formatPrincipal(nft.owner as string)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Minted</p>
                      <p className="text-foreground">
                        {nft.mintedAt
                          ? formatDate(nft.mintedAt as bigint)
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <Separator className="opacity-30" />
                  <p className="text-xs text-muted-foreground">
                    This username is taken. You can submit an offer to purchase
                    it:
                  </p>
                  <OfferForm
                    offerAmount={offerAmount}
                    setOfferAmount={setOfferAmount}
                    offerCurrency={offerCurrency}
                    setOfferCurrency={setOfferCurrency}
                    onSubmit={handleSubmitOffer}
                    isPending={submitOffer.isPending}
                  />
                </div>
              ) : (
                <div
                  className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-3"
                  data-ocid="username-nft-available"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-[10px]">✓</span>
                    </div>
                    <span className="font-display font-semibold text-foreground">
                      @{queryUsername}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-accent/40 text-accent"
                    >
                      Available
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This username NFT doesn&apos;t exist yet. Submit an offer
                    and admin will mint it for you.
                  </p>
                  <OfferForm
                    offerAmount={offerAmount}
                    setOfferAmount={setOfferAmount}
                    offerCurrency={offerCurrency}
                    setOfferCurrency={setOfferCurrency}
                    onSubmit={handleSubmitOffer}
                    isPending={submitOffer.isPending}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My offers */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">My Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {offersLoading ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : myOffers.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-4"
              data-ocid="offers-empty"
            >
              No offers submitted yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myOffers.map((offer) => {
                const o = offer as Record<string, unknown>;
                return (
                  <div
                    key={o.id as string}
                    className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2.5 border border-border/30 text-sm"
                    data-ocid="offer-row"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AtSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground truncate">
                        {o.username as string}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {o.amount
                          ? formatAmount(
                              o.amount as bigint,
                              (o.currency as "ICP") ?? "ICP",
                            )
                          : ""}
                      </span>
                      <OfferStatusBadge status={o.status as string} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OfferForm({
  offerAmount,
  setOfferAmount,
  offerCurrency,
  setOfferCurrency,
  onSubmit,
  isPending,
}: {
  offerAmount: string;
  setOfferAmount: (v: string) => void;
  offerCurrency: string;
  setOfferCurrency: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Offer Amount</Label>
          <Input
            placeholder="0.00"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            data-ocid="offer-amount-input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Currency</Label>
          <Select value={offerCurrency} onValueChange={setOfferCurrency}>
            <SelectTrigger data-ocid="offer-currency-select">
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
      <Button
        onClick={onSubmit}
        disabled={isPending}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/80 text-sm"
        data-ocid="submit-offer-btn"
      >
        {isPending ? "Submitting…" : "Submit Offer"}
      </Button>
    </div>
  );
}

function OfferStatusBadge({ status }: { status: string }) {
  if (status === "accepted") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-accent/40 text-accent"
      >
        <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
        Accepted
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-destructive/40 text-destructive"
      >
        <XCircle className="h-2.5 w-2.5 mr-0.5" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] border-border text-muted-foreground"
    >
      <Clock className="h-2.5 w-2.5 mr-0.5" />
      Pending
    </Badge>
  );
}
