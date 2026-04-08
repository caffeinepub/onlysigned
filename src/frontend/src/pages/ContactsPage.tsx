import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Mail,
  MessageSquare,
  Search,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend-types";
import { Variant_UserNumber_LastActive_RegistrationTime_FollowerCount as SortBy } from "../backend-types";
import ConnectWall from "../components/ConnectWall";
import ProfileBadge from "../components/ProfileBadge";
import { useAuth } from "../hooks/useAuth";
import {
  useMyContacts,
  usePublicProfile,
  useSearchUsers,
  useSendContactInvitation,
} from "../hooks/useQueries";

// ─── Contact Row ─────────────────────────────────────────────────────────────

function ContactRow({ principal }: { principal: string }) {
  const { data: profile } = usePublicProfile(principal);
  if (!profile) {
    return (
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3.5">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-3.5 hover:border-accent/30 transition-colors"
      data-ocid="contact-card"
    >
      <ProfileBadge
        profile={{
          principal: profile.id.toString(),
          displayName: profile.displayName,
          photoUrl: profile.profilePhoto,
          isVerified: profile.isVerified,
          isAdmin: profile.isAdmin,
          certificateIssuerSubtype: profile.certIssuerSubtype,
          followerCount: profile.followerCount,
        }}
        size="md"
        showFollowers
      />
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10 min-h-[44px] sm:min-h-[36px]"
          data-ocid="contact-message-btn"
        >
          <Link to="/messages">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Message</span>
          </Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled
          title="Remove contact (coming soon)"
          className="text-muted-foreground/40 cursor-not-allowed min-h-[44px] sm:min-h-[36px]"
          aria-label="Remove contact (not yet available)"
          data-ocid="contact-remove-btn"
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Find Users Panel ─────────────────────────────────────────────────────────

function FindUsersPanel() {
  const [query, setQuery] = useState("");
  const { isAuthenticated } = useAuth();

  const searchFilter = query.trim()
    ? {
        searchText: query.trim(),
        onlyVerified: false,
        onlyAdmin: false,
        sortBy: SortBy.UserNumber,
      }
    : undefined;

  const { data: results, isLoading } = useSearchUsers(searchFilter);
  const sendInvite = useSendContactInvitation();

  const users = (results as User[] | undefined) ?? [];
  const showResults = query.trim().length > 0;

  const handleInvite = (user: User) => {
    const principalStr = user.id.toString();
    sendInvite.mutate(principalStr, {
      onSuccess: () => toast.success(`Invitation sent to ${user.displayName}`),
      onError: (e) => toast.error(e.message || "Failed to send invitation"),
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        Find Users to Add
      </h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name or username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-background border-border min-h-[44px] sm:min-h-[36px]"
          data-ocid="find-users-input"
          disabled={!isAuthenticated}
        />
      </div>

      {showResults && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            ["a", "b", "c"].map((k) => (
              <div key={k} className="flex items-center gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found
            </p>
          ) : (
            users.map((user) => {
              const principalStr = user.id.toString();
              const initials = user.displayName.slice(0, 2).toUpperCase();
              return (
                <div
                  key={principalStr}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8 border border-border/50 flex-shrink-0">
                      <AvatarImage
                        src={user.profilePhoto}
                        alt={user.displayName}
                      />
                      <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground truncate">
                      {user.displayName}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-accent/30 text-accent hover:bg-accent/10 flex-shrink-0 min-h-[36px]"
                    onClick={() => handleInvite(user)}
                    disabled={sendInvite.isPending}
                    data-ocid="send-invite-btn"
                  >
                    Invite
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {!showResults && (
        <p className="text-xs text-muted-foreground">
          Type to search for users and send contact invitations
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");

  // returns string[] (principal strings)
  const { data: contactPrincipals, isLoading } = useMyContacts();
  const principals = contactPrincipals ?? [];

  const filtered = search.trim()
    ? principals.filter((p) => p.toLowerCase().includes(search.toLowerCase()))
    : principals;

  if (!isAuthenticated) {
    return (
      <ConnectWall message="Connect your wallet to access your contacts." />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-accent" />
            My Contacts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mutual connections you can chat with privately
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-accent/30 text-accent hover:bg-accent/10 flex-shrink-0 min-h-[44px] sm:min-h-[36px]"
          data-ocid="view-invitations-btn"
        >
          <Link to="/contact-invitations">
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Invitations
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts list */}
        <div className="lg:col-span-2 space-y-4">
          {principals.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Filter contacts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border min-h-[44px] sm:min-h-[36px]"
                data-ocid="contacts-search-input"
              />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {["a", "b", "c", "d", "e"].map((k) => (
                <div
                  key={k}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3.5"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 gap-4 text-center border border-dashed border-border rounded-xl"
              data-ocid="contacts-empty"
            >
              <UserCheck className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-semibold text-foreground">
                  {search ? "No contacts match your filter" : "No contacts yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search
                    ? "Try a different name"
                    : "Find users in the User Explorer and send invitations to connect"}
                </p>
              </div>
              {!search && (
                <Button
                  asChild
                  variant="outline"
                  className="border-accent/30 text-accent hover:bg-accent/10"
                >
                  <Link to="/users">
                    <Users className="h-4 w-4 mr-2" />
                    Explore Users
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2" data-ocid="contacts-list">
              {filtered.map((principal) => (
                <ContactRow key={principal} principal={principal} />
              ))}
            </div>
          )}
        </div>

        {/* Find users panel */}
        <div className="lg:col-span-1">
          <FindUsersPanel />
          <div className="mt-4 p-4 bg-muted/20 border border-dashed border-border rounded-xl text-center">
            <p className="text-xs text-muted-foreground">
              Contacts are mutual — both users must accept each other's
              invitation before chatting is enabled.
            </p>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-accent hover:bg-accent/10"
            >
              <Link to="/contact-invitations">View pending invitations →</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
