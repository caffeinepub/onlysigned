/**
 * Admin Offers Tab — manage all Username NFT purchase offers.
 * Pending offers can be accepted or rejected; all resolved offers are listed below.
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Filter, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAcceptUsernameOffer,
  useAllUsernameOffers,
  useRejectUsernameOffer,
} from "../../hooks/useQueries";
import { formatDate, formatPrincipal } from "../../lib/utils";

import type { UsernameOffer } from "../../backend-types";
import { OfferStatus } from "../../backend-types";

function toNum(v: bigint | number): number {
  return typeof v === "bigint" ? Number(v) : v;
}

export default function AdminOffersTab() {
  const { data: rawOffers, isLoading } = useAllUsernameOffers();
  const acceptOffer = useAcceptUsernameOffer();
  const rejectOffer = useRejectUsernameOffer();

  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<UsernameOffer | null>(null);
  const [acceptTarget, setAcceptTarget] = useState<UsernameOffer | null>(null);

  const allOffers = rawOffers ?? [];
  const pendingOffers = useMemo(
    () => allOffers.filter((o) => o.status === OfferStatus.Pending),
    [allOffers],
  );
  const resolvedOffers = useMemo(
    () => allOffers.filter((o) => o.status !== OfferStatus.Pending),
    [allOffers],
  );
  const displayedOffers = showPendingOnly ? pendingOffers : allOffers;

  return (
    <div className="space-y-8">
      {/* Header + filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Username NFT Offers
          </h2>
          {pendingOffers.length > 0 && (
            <Badge className="bg-accent/20 text-accent border-0">
              {pendingOffers.length} pending
            </Badge>
          )}
        </div>
        <Button
          variant={showPendingOnly ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowPendingOnly((v) => !v)}
          className="gap-2"
          data-ocid="admin-offers-filter-btn"
        >
          <Filter className="h-3.5 w-3.5" />
          {showPendingOnly ? "Show All" : "Pending Only"}
        </Button>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-md bg-muted/40 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold text-foreground">
            {allOffers.length}
          </span>
        </div>
        <div className="rounded-md bg-accent/10 px-4 py-2 text-sm">
          <span className="text-accent">Pending: </span>
          <span className="font-semibold text-accent">
            {pendingOffers.length}
          </span>
        </div>
        <div className="rounded-md bg-muted/40 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Resolved: </span>
          <span className="font-semibold text-foreground">
            {resolvedOffers.length}
          </span>
        </div>
      </div>

      {/* Offers list */}
      {isLoading ? (
        <div className="space-y-3">
          {["o1", "o2", "o3", "o4"].map((k) => (
            <Skeleton key={k} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : displayedOffers.length === 0 ? (
        <div
          className="rounded-lg border border-border bg-card px-6 py-12 text-center"
          data-ocid="admin-offers-empty"
        >
          <p className="text-muted-foreground">No offers to display.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending section */}
          {!showPendingOnly && pendingOffers.length > 0 && (
            <>
              <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Pending
              </h3>
              {pendingOffers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  onAccept={() => setAcceptTarget(offer)}
                  onReject={() => setRejectTarget(offer)}
                  isPending
                />
              ))}
              {resolvedOffers.length > 0 && (
                <Separator className="my-2 bg-border" />
              )}
            </>
          )}

          {/* Show pending-only list or resolved list */}
          {showPendingOnly
            ? pendingOffers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  onAccept={() => setAcceptTarget(offer)}
                  onReject={() => setRejectTarget(offer)}
                  isPending
                />
              ))
            : resolvedOffers.length > 0 && (
                <>
                  {pendingOffers.length > 0 && (
                    <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                      Resolved
                    </h3>
                  )}
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left">
                        <tr>
                          {[
                            "Username",
                            "Offered By",
                            "Amount",
                            "Type",
                            "Date",
                            "Status",
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
                        {resolvedOffers.map((offer) => {
                          return (
                            <tr
                              key={offer.id}
                              className="transition-colors hover:bg-muted/20"
                            >
                              <td className="px-4 py-3 font-medium text-foreground">
                                @{offer.targetUsername}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                {formatPrincipal(
                                  offer.offererPrincipal.toString(),
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono whitespace-nowrap">
                                {toNum(offer.amount).toFixed(4)}{" "}
                                {offer.currency}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-xs">
                                  {offer.nftExists ? "Transfer" : "Mint"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                                {formatDate(offer.submittedAt)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className={
                                    offer.status === OfferStatus.Accepted
                                      ? "border-accent/40 text-accent"
                                      : "border-destructive/40 text-destructive"
                                  }
                                >
                                  {offer.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
        </div>
      )}

      {/* Accept Confirm Dialog */}
      <AlertDialog
        open={!!acceptTarget}
        onOpenChange={(o) => {
          if (!o) setAcceptTarget(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Accept the offer for{" "}
              <strong>@{acceptTarget?.targetUsername}</strong>?{" "}
              {acceptTarget && (
                <>
                  Payment of{" "}
                  <strong>
                    {toNum(acceptTarget.amount).toFixed(4)}{" "}
                    {acceptTarget.currency}
                  </strong>{" "}
                  will be processed and the NFT will be{" "}
                  {acceptTarget.nftExists ? "transferred" : "minted"} to the
                  buyer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!acceptTarget) return;
                acceptOffer.mutate(acceptTarget.id, {
                  onSuccess: () => {
                    toast.success("Offer accepted — NFT transferred/minted");
                    setAcceptTarget(null);
                  },
                  onError: () => toast.error("Failed to accept offer"),
                });
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Accept Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirm Dialog */}
      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) setRejectTarget(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Reject the offer for{" "}
              <strong>@{rejectTarget?.targetUsername}</strong>? The user will be
              notified that their offer was declined.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!rejectTarget) return;
                rejectOffer.mutate(rejectTarget.id, {
                  onSuccess: () => {
                    toast.success("Offer rejected");
                    setRejectTarget(null);
                  },
                  onError: () => toast.error("Failed to reject offer"),
                });
              }}
              className="bg-destructive text-destructive-foreground"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Reject Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface OfferRowProps {
  offer: UsernameOffer;
  onAccept: () => void;
  onReject: () => void;
  isPending?: boolean;
}

function OfferRow({ offer, onAccept, onReject }: OfferRowProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:border-accent/30 transition-colors"
      data-ocid="admin-offer-row"
    >
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-accent">
            @{offer.targetUsername}
          </span>
          <Badge variant="outline" className="text-xs">
            {offer.nftExists ? "Transfer existing" : "Mint new"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          By {formatPrincipal(offer.offererPrincipal.toString())} •{" "}
          {toNum(offer.amount).toFixed(4)} {offer.currency} •{" "}
          {formatDate(offer.submittedAt)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onAccept}
          className="bg-accent text-accent-foreground hover:bg-accent/90 min-h-[44px] sm:min-h-[36px]"
          data-ocid="admin-accept-offer-btn"
        >
          <CheckCircle className="mr-1 h-3.5 w-3.5" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 min-h-[44px] sm:min-h-[36px]"
          data-ocid="admin-reject-offer-btn"
        >
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Reject
        </Button>
      </div>
    </div>
  );
}
