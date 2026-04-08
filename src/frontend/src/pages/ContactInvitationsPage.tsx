import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Clock, MailOpen, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { ContactInvitation } from "../backend-types";
import { InvitationStatus } from "../backend-types";
import ConnectWall from "../components/ConnectWall";
import ProfileBadge from "../components/ProfileBadge";
import { useAuth } from "../hooks/useAuth";
import { useMyProfile } from "../hooks/useProfile";
import {
  useAcceptContactInvitation,
  useDeclineContactInvitation,
  usePendingInvitations,
  usePublicProfile,
} from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ─── Invitation Skeleton ──────────────────────────────────────────────────────

function InvitationSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-xl"
      data-ocid="invitations-empty"
    >
      <MailOpen className="h-10 w-10 text-muted-foreground/40" />
      <p className="font-semibold text-foreground">No invitations</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Received Invitation Card ─────────────────────────────────────────────────

function ReceivedInvitationCard({
  invitation,
}: {
  invitation: ContactInvitation;
}) {
  const accept = useAcceptContactInvitation();
  const decline = useDeclineContactInvitation();
  const fromPrincipalStr = invitation.fromPrincipal.toString();
  const { data: fromProfile } = usePublicProfile(fromPrincipalStr);

  const handleAccept = () => {
    accept.mutate(invitation.id, {
      onSuccess: () =>
        toast.success(
          `${fromProfile?.displayName ?? "User"} added as contact!`,
        ),
      onError: (e) => toast.error(e.message || "Failed to accept invitation"),
    });
  };

  const handleDecline = () => {
    decline.mutate(invitation.id, {
      onSuccess: () => toast.info("Invitation declined"),
      onError: (e) => toast.error(e.message || "Failed to decline invitation"),
    });
  };

  const isPending = accept.isPending || decline.isPending;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-4 hover:border-accent/20 transition-colors"
      data-ocid="received-invitation-card"
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <ProfileBadge
          profile={{
            principal: fromPrincipalStr,
            displayName: fromProfile?.displayName ?? "Loading…",
            photoUrl: fromProfile?.profilePhoto,
            isVerified: fromProfile?.isVerified,
            isAdmin: fromProfile?.isAdmin,
            certificateIssuerSubtype: fromProfile?.certIssuerSubtype,
          }}
          size="md"
        />
        <span className="text-xs text-muted-foreground mt-1 ml-auto flex-shrink-0">
          {formatRelativeTime(invitation.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/80 gap-1.5 min-h-[44px] sm:min-h-[36px]"
          onClick={handleAccept}
          disabled={isPending}
          data-ocid="accept-invitation-btn"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive min-h-[44px] sm:min-h-[36px]"
          onClick={handleDecline}
          disabled={isPending}
          data-ocid="decline-invitation-btn"
        >
          <XCircle className="h-3.5 w-3.5" />
          Decline
        </Button>
      </div>
    </div>
  );
}

// ─── Sent Invitation Card ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  [InvitationStatus.Pending]: {
    icon: Clock,
    color: "text-amber-400",
    label: "Pending",
  },
  [InvitationStatus.Accepted]: {
    icon: CheckCircle,
    color: "text-accent",
    label: "Accepted",
  },
  [InvitationStatus.Declined]: {
    icon: XCircle,
    color: "text-destructive",
    label: "Declined",
  },
} as const;

function SentInvitationCard({ invitation }: { invitation: ContactInvitation }) {
  const toPrincipalStr = invitation.toPrincipal.toString();
  const { data: toProfile } = usePublicProfile(toPrincipalStr);
  const config =
    STATUS_CONFIG[invitation.status] ?? STATUS_CONFIG[InvitationStatus.Pending];
  const StatusIcon = config.icon;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-4"
      data-ocid="sent-invitation-card"
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <ProfileBadge
          profile={{
            principal: toPrincipalStr,
            displayName: toProfile?.displayName ?? "Loading…",
            photoUrl: toProfile?.profilePhoto,
            isVerified: toProfile?.isVerified,
            isAdmin: toProfile?.isAdmin,
          }}
          size="md"
        />
        <span className="text-xs text-muted-foreground mt-1 ml-auto flex-shrink-0">
          {formatRelativeTime(invitation.createdAt)}
        </span>
      </div>
      <div
        className={`flex items-center gap-1.5 text-sm font-medium flex-shrink-0 ${config.color}`}
      >
        <StatusIcon className="h-4 w-4" />
        {config.label}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContactInvitationsPage() {
  const { isAuthenticated } = useAuth();
  const { data: myProfile } = useMyProfile();
  const myPrincipalStr = myProfile?.id.toString();

  const { data: invitations, isLoading } = usePendingInvitations();

  if (!isAuthenticated) {
    return (
      <ConnectWall message="Connect your wallet to view your contact invitations." />
    );
  }

  // `getPendingInvitations` returns both sent and received, differentiated by direction
  // fromPrincipal === me → sent; toPrincipal === me → received
  const allInvitations = (invitations as ContactInvitation[] | undefined) ?? [];
  const received = allInvitations.filter(
    (i) =>
      i.toPrincipal.toString() === myPrincipalStr ||
      (!myPrincipalStr && i.status === InvitationStatus.Pending),
  );
  const sent = allInvitations.filter(
    (i) => i.fromPrincipal.toString() === myPrincipalStr,
  );

  // Fallback: if we can't differentiate, show all as received
  const receivedList = myPrincipalStr ? received : allInvitations;
  const sentList = myPrincipalStr ? sent : [];

  const pendingReceivedCount = receivedList.filter(
    (i) => i.status === InvitationStatus.Pending,
  ).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <MailOpen className="h-6 w-6 text-accent" />
            Contact Invitations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your received and sent contact requests
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-border text-muted-foreground hover:text-foreground flex-shrink-0 min-h-[44px] sm:min-h-[36px]"
        >
          <Link to="/users">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Find users
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/30 border border-border">
          <TabsTrigger
            value="received"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground min-h-[44px] sm:min-h-[36px]"
            data-ocid="tab-received"
          >
            Received
            {pendingReceivedCount > 0 && (
              <span className="ml-1.5 bg-accent text-accent-foreground text-xs rounded-full px-1.5 py-0.5 font-bold">
                {pendingReceivedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground min-h-[44px] sm:min-h-[36px]"
            data-ocid="tab-sent"
          >
            Sent
            {sentList.length > 0 && (
              <span className="ml-1.5 bg-muted text-muted-foreground text-xs rounded-full px-1.5 py-0.5">
                {sentList.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Received */}
        <TabsContent
          value="received"
          className="mt-4 space-y-3"
          data-ocid="received-invitations-list"
        >
          {isLoading ? (
            ["a", "b", "c"].map((k) => <InvitationSkeleton key={k} />)
          ) : receivedList.length === 0 ? (
            <EmptyState message="No pending invitations from other users" />
          ) : (
            receivedList.map((inv) => (
              <ReceivedInvitationCard key={inv.id} invitation={inv} />
            ))
          )}
        </TabsContent>

        {/* Sent */}
        <TabsContent
          value="sent"
          className="mt-4 space-y-3"
          data-ocid="sent-invitations-list"
        >
          {isLoading ? (
            ["a", "b", "c"].map((k) => <InvitationSkeleton key={k} />)
          ) : sentList.length === 0 ? (
            <EmptyState message="You haven't sent any invitations yet. Find users in the Explorer!" />
          ) : (
            sentList.map((inv) => (
              <SentInvitationCard key={inv.id} invitation={inv} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
