import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  Building2,
  Check,
  CheckCircle,
  Copy,
  Crown,
  ExternalLink,
  Hash,
  Layers,
  PenTool,
  Settings,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Collection, FileRef, SignedCopy, User } from "../backend-types";
import MediaPlayer from "../components/MediaPlayer";
import { useAuth } from "../hooks/useAuth";
import { useFileUrl } from "../hooks/useFileStorage";
import {
  useAsset,
  useCheckIsFollowing,
  useFollowUser,
  usePublicCollections,
  usePublicProfile,
  usePublicSignedCopies,
  useUnfollowUser,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";

// ─── Copy pill button ─────────────────────────────────────────────────────────

function CopyPill({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy — select and copy manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      data-ocid="principal-copy-btn"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
        "text-xs font-medium transition-all duration-200",
        "min-h-[44px] sm:min-h-[36px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        copied
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border bg-muted/40 text-muted-foreground hover:border-accent/40 hover:bg-muted/70 hover:text-foreground active:scale-95",
      )}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 shrink-0" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 shrink-0" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Subtype config ───────────────────────────────────────────────────────────

const SUBTYPE_CONFIG = {
  Celebrity: {
    icon: Crown,
    label: "Celebrity",
    color: "text-chart-4 border-chart-4/30",
  },
  Government: {
    icon: Building2,
    label: "Government",
    color: "text-primary border-primary/30",
  },
  Institution: {
    icon: Star,
    label: "Institution",
    color: "text-chart-5 border-chart-5/30",
  },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      to="/collections/$collectionId"
      params={{ collectionId: collection.id }}
      className="group bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-all hover:shadow-md hover:shadow-accent/5 flex flex-col gap-2"
      data-ocid="public-collection-card"
    >
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:bg-accent/20 transition-colors">
        <Layers className="h-5 w-5 text-accent" />
      </div>
      <p className="font-medium text-foreground text-sm truncate">
        {collection.name}
      </p>
      {collection.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {collection.description}
        </p>
      )}
    </Link>
  );
}

// ─── Compact file preview (single fileRef + URL) ─────────────────────────────

function CompactFilePreview({ fileRef }: { fileRef: FileRef }) {
  const { data: url, isLoading } = useFileUrl(fileRef.fileId);

  if (isLoading) {
    return <Skeleton className="w-full h-full rounded-t-xl" />;
  }
  if (!url) return null;

  return (
    <MediaPlayer
      fileRef={fileRef}
      url={url}
      compact
      className="w-full h-full object-cover"
    />
  );
}

// ─── Signed copy card with media preview ─────────────────────────────────────

function SignedCopyCard({ copy }: { copy: SignedCopy }) {
  const { data: assetData } = useAsset(copy.assetId);
  const firstFile = assetData?.fileRefs?.[0] ?? null;

  return (
    <Link
      to="/assets/$assetId"
      params={{ assetId: copy.assetId }}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-accent/40 transition-all hover:shadow-md hover:shadow-accent/5 flex flex-col"
      data-ocid="public-signed-copy-card"
    >
      {/* Media preview area */}
      <div className="relative w-full h-24 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center overflow-hidden">
        {firstFile ? (
          <CompactFilePreview fileRef={firstFile} />
        ) : (
          <PenTool className="h-8 w-8 text-primary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent pointer-events-none" />
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-foreground text-sm truncate">
            Signed Copy
          </p>
          <Badge
            variant="outline"
            className="text-[10px] border-accent/30 text-accent flex-shrink-0"
          >
            #{Number(copy.sequenceNumber)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {copy.assetId.slice(0, 16)}…
        </p>
      </div>
    </Link>
  );
}

function SectionEmpty({
  icon: Icon,
  message,
}: { icon: React.ElementType; message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-10 gap-3 text-center border border-dashed border-border rounded-xl">
      <Icon className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const { userId } = useParams({ from: "/users/$userId" });
  const { isAuthenticated, principal } = useAuth();
  const myPrincipal = principal?.toString();
  const isMe = myPrincipal === userId;

  const { data: profileData, isLoading: profileLoading } =
    usePublicProfile(userId);
  const { data: collections, isLoading: collectionsLoading } =
    usePublicCollections(userId);
  const { data: signedCopies, isLoading: copiesLoading } =
    usePublicSignedCopies(userId);
  const { data: isFollowingData } = useCheckIsFollowing(
    isAuthenticated && !isMe ? userId : undefined,
  );

  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  const p = profileData as User | null | undefined;
  const cols = (collections as Collection[] | undefined) ?? [];
  const copies = (signedCopies as SignedCopy[] | undefined) ?? [];
  const isFollowing = !!isFollowingData;

  const subtype = p?.certIssuerSubtype as
    | keyof typeof SUBTYPE_CONFIG
    | undefined;
  const subtypeConfig = subtype ? SUBTYPE_CONFIG[subtype] : null;
  const SubIcon = subtypeConfig?.icon;

  const principalText = p?.id?.toString() ?? null;
  const userNumber = p?.userNumber !== undefined ? Number(p.userNumber) : null;

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 flex gap-4 sm:gap-6 items-start">
          <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Users className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="font-display text-xl font-bold text-foreground">
          Profile Not Found
        </h2>
        <p className="text-sm text-muted-foreground">
          This user doesn't exist or their profile is private.
        </p>
        <Button asChild variant="outline">
          <Link to="/users">Browse User Explorer</Link>
        </Button>
      </div>
    );
  }

  const initials = p.displayName?.slice(0, 2).toUpperCase() ?? "??";

  const handleFollowToggle = () => {
    if (!p.id) return;
    const principalStr = p.id.toString();
    if (isFollowing) {
      unfollow.mutate(principalStr);
    } else {
      follow.mutate(principalStr);
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto space-y-6"
      data-ocid="public-profile-page"
    >
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <Avatar className="h-16 w-16 sm:h-24 sm:w-24 border-2 border-accent/30 flex-shrink-0">
            <AvatarImage
              src={p.profilePhoto ?? undefined}
              alt={p.displayName}
            />
            <AvatarFallback className="bg-accent/10 text-accent font-display font-bold text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {p.displayName ?? "Anonymous"}
              </h1>
              {p.isVerified && (
                <CheckCircle
                  className="h-5 w-5 text-accent flex-shrink-0"
                  aria-label="Verified"
                />
              )}
              {p.isAdmin && (
                <Badge
                  variant="outline"
                  className="border-chart-4/40 text-chart-4"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {userNumber !== null && (
                <Badge
                  variant="outline"
                  className="border-primary/40 text-primary font-mono"
                  data-ocid="public-profile-user-number"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  User #{userNumber}
                </Badge>
              )}
            </div>

            {/* Username */}
            {p.username && (
              <p className="text-sm text-accent font-medium">@{p.username}</p>
            )}

            {/* Certificate Issuer badge */}
            {subtypeConfig && SubIcon && (
              <Badge
                variant="outline"
                className={cn("w-fit", subtypeConfig.color)}
              >
                <SubIcon className="h-3 w-3 mr-1" />
                Certificate Issuer · {subtypeConfig.label}
              </Badge>
            )}
            {p.profileType === "CertificateIssuer" && !subtypeConfig && (
              <Badge
                variant="outline"
                className="w-fit border-primary/30 text-primary"
              >
                Certificate Issuer
              </Badge>
            )}

            {/* Principal ID */}
            {principalText && (
              <div className="w-full" data-ocid="public-profile-principal-id">
                <p className="text-xs text-muted-foreground mb-1.5">
                  Principal ID
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                  <span
                    className="font-mono text-xs text-foreground/70 flex-1 min-w-0 select-all"
                    style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                  >
                    {principalText}
                  </span>
                  <CopyPill text={principalText} label="Principal ID" />
                </div>
              </div>
            )}

            {/* Bio */}
            {p.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {p.bio}
              </p>
            )}

            {/* Personal URL */}
            {p.personalUrl && (
              <a
                href={
                  p.personalUrl.startsWith("http")
                    ? p.personalUrl
                    : `https://${p.personalUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors w-fit"
                data-ocid="public-profile-url"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {p.personalUrl}
              </a>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  <span className="font-semibold text-foreground">
                    {Number(p.followerCount ?? 0n).toLocaleString()}
                  </span>{" "}
                  followers
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {Number(p.followingCount ?? 0n).toLocaleString()}
                </span>{" "}
                following
              </div>
              <div className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {copies.length}
                </span>{" "}
                signed copies
              </div>
              <div className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {cols.length}
                </span>{" "}
                collections
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 sm:self-start">
            {isMe ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5 min-h-[44px] sm:min-h-[36px]"
                data-ocid="edit-profile-btn"
              >
                <Link to="/profile">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            ) : isAuthenticated ? (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                className={cn(
                  "gap-1.5 min-h-[44px] sm:min-h-[36px]",
                  isFollowing
                    ? "border-border/60 text-muted-foreground hover:border-destructive hover:text-destructive"
                    : "bg-accent text-accent-foreground hover:bg-accent/80",
                )}
                onClick={handleFollowToggle}
                disabled={follow.isPending || unfollow.isPending}
                data-ocid="follow-btn"
              >
                <Users className="h-4 w-4" />
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            ) : null}
          </div>
        </div>

        {/* "This is your profile" notice */}
        {isMe && (
          <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20 text-sm text-accent/80">
            This is your public profile.{" "}
            <Link
              to="/profile"
              className="underline text-accent hover:text-accent/80"
            >
              Edit in Profile Settings
            </Link>
          </div>
        )}
      </div>

      {/* Public Collections */}
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          Collections
        </h2>
        {collectionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {["a", "b", "c"].map((k) => (
              <Skeleton key={`col-skel-${k}`} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            data-ocid="public-collections-grid"
          >
            {cols.length > 0 ? (
              cols.map((c) => <CollectionCard key={c.id} collection={c} />)
            ) : (
              <SectionEmpty icon={Layers} message="No public collections yet" />
            )}
          </div>
        )}
      </section>

      {/* Public Signed Copies */}
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <PenTool className="h-5 w-5 text-accent" />
          Signed Copies
        </h2>
        {copiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {["a", "b", "c"].map((k) => (
              <Skeleton key={`copy-skel-${k}`} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            data-ocid="public-signed-copies-grid"
          >
            {copies.length > 0 ? (
              copies.map((c) => <SignedCopyCard key={c.id} copy={c} />)
            ) : (
              <SectionEmpty
                icon={PenTool}
                message="No public signed copies yet"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
