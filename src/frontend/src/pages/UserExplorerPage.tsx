import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Crown,
  Filter,
  Search,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import type {
  IssuerSubtype,
  ProfileType,
  SearchFilter,
  User,
} from "../backend-types";
import { Variant_UserNumber_LastActive_RegistrationTime_FollowerCount } from "../backend-types";
import { useAuth } from "../hooks/useAuth";
import {
  useFollowUser,
  useFollowing,
  useLatestUsers,
  useSearchUsers,
  useUnfollowUser,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortOption = "newest" | "followers" | "userNumber";
type ProfileTypeFilter = "all" | "Collector" | "CertificateIssuer";
type SubtypeFilter = "all" | "Celebrity" | "Government" | "Institution";

interface Filters {
  verified: boolean;
  admins: boolean;
  profileType: ProfileTypeFilter;
  subtype: SubtypeFilter;
  minFollowers: string;
  sortBy: SortOption;
}

const DEFAULT_FILTERS: Filters = {
  verified: false,
  admins: false,
  profileType: "all",
  subtype: "all",
  minFollowers: "",
  sortBy: "newest",
};

const SUBTYPE_ICONS: Record<string, React.ElementType> = {
  Celebrity: Crown,
  Government: Building2,
  Institution: Star,
};

const SUBTYPE_COLORS: Record<string, string> = {
  Celebrity: "text-amber-400 border-amber-400/30",
  Government: "text-primary border-primary/30",
  Institution: "text-chart-5 border-chart-5/30",
};

// ─── User Card ─────────────────────────────────────────────────────────────────

function UserCard({
  user,
  myPrincipal,
  followingSet,
}: {
  user: User;
  myPrincipal: string | undefined;
  followingSet: Set<string>;
}) {
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const principalStr = user.id.toString();
  const isMe = principalStr === myPrincipal;
  const isFollowing = followingSet.has(principalStr);

  const initials = user.displayName?.slice(0, 2).toUpperCase() ?? "??";
  const subtype = user.certIssuerSubtype as string | undefined;
  const SubIcon = subtype ? SUBTYPE_ICONS[subtype] : null;
  const subtypeColor = subtype ? (SUBTYPE_COLORS[subtype] ?? "") : "";
  const followerCount = Number(user.followerCount);

  return (
    <div
      className="group relative bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-all hover:shadow-lg hover:shadow-accent/5 flex flex-col gap-3"
      data-ocid="user-card"
    >
      {/* Avatar + name */}
      <Link
        to="/users/$userId"
        params={{ userId: principalStr }}
        className="flex items-start gap-3"
        data-ocid="user-card-link"
      >
        <Avatar className="h-12 w-12 border border-border/50 flex-shrink-0">
          <AvatarImage src={user.profilePhoto} alt={user.displayName} />
          <AvatarFallback className="bg-accent/10 text-accent font-display font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display font-semibold text-foreground text-sm min-w-0 break-words">
              {user.displayName}
            </span>
            {user.isVerified && (
              <CheckCircle
                className="h-3.5 w-3.5 text-accent flex-shrink-0"
                aria-label="Verified"
              />
            )}
            {user.isAdmin && (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 border-amber-400/40 text-amber-400 flex-shrink-0"
              >
                <Shield className="h-2.5 w-2.5 mr-0.5" />
                Admin
              </Badge>
            )}
          </div>
          {user.username && (
            <p className="text-xs text-muted-foreground truncate">
              @{user.username}
            </p>
          )}
          {subtype && SubIcon && (
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 mt-1", subtypeColor)}
            >
              <SubIcon className="h-2.5 w-2.5 mr-0.5" />
              {subtype}
            </Badge>
          )}
        </div>
      </Link>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <span className="text-foreground font-medium">
            {followerCount.toLocaleString()}
          </span>{" "}
          followers
        </span>
        <span>
          <span className="text-foreground font-medium">
            {Number(user.followingCount).toLocaleString()}
          </span>{" "}
          following
        </span>
        <span className="ml-auto text-muted-foreground/60">
          #{user.userNumber.toString()}
        </span>
      </div>

      {/* Follow button */}
      {!isMe && myPrincipal && (
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "outline"}
          className={cn(
            "w-full text-xs min-h-[44px] sm:min-h-[36px]",
            isFollowing
              ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              : "border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/60",
          )}
          onClick={() =>
            isFollowing
              ? unfollow.mutate(principalStr)
              : follow.mutate(principalStr)
          }
          disabled={follow.isPending || unfollow.isPending}
          data-ocid="user-card-follow-btn"
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function UserCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserExplorerPage() {
  const { isAuthenticated, principal } = useAuth();
  const myPrincipal = principal?.toString();

  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(12);

  // "following" returns string[] (principals the current user follows)
  const { data: followingRaw } = useFollowing(myPrincipal);
  const followingSet = new Set<string>(followingRaw ?? []);

  const sortByMap: Record<
    SortOption,
    Variant_UserNumber_LastActive_RegistrationTime_FollowerCount
  > = {
    newest:
      Variant_UserNumber_LastActive_RegistrationTime_FollowerCount.RegistrationTime,
    followers:
      Variant_UserNumber_LastActive_RegistrationTime_FollowerCount.FollowerCount,
    userNumber:
      Variant_UserNumber_LastActive_RegistrationTime_FollowerCount.UserNumber,
  };

  const isFiltered =
    searchQuery.trim().length > 0 ||
    filters.verified ||
    filters.admins ||
    filters.profileType !== "all" ||
    filters.subtype !== "all" ||
    filters.minFollowers !== "";

  const searchFilter: SearchFilter | undefined = isFiltered
    ? {
        searchText: searchQuery.trim(),
        onlyVerified: filters.verified,
        onlyAdmin: filters.admins,
        profileType:
          filters.profileType !== "all"
            ? (filters.profileType as ProfileType)
            : undefined,
        subtype:
          filters.subtype !== "all"
            ? (filters.subtype as IssuerSubtype)
            : undefined,
        minFollowers: filters.minFollowers
          ? BigInt(Number.parseInt(filters.minFollowers, 10))
          : undefined,
        sortBy: sortByMap[filters.sortBy],
      }
    : undefined;

  const { data: latestUsers, isLoading: latestLoading } = useLatestUsers(
    BigInt(50),
  );
  const { data: searchResults, isLoading: searchLoading } =
    useSearchUsers(searchFilter);

  const users: User[] = (isFiltered ? searchResults : latestUsers) ?? [];
  const isLoading = isFiltered ? searchLoading : latestLoading;
  const visibleUsers = users.slice(0, visibleCount);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            User Explorer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isFiltered
              ? `${users.length} result${users.length !== 1 ? "s" : ""}`
              : "Latest active users"}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, username, or user #…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(12);
              }}
              className="pl-9 bg-card border-border focus:border-accent min-h-[44px] sm:min-h-[36px]"
              data-ocid="user-search-input"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "border-border gap-2 min-h-[44px] sm:min-h-[36px]",
              filtersOpen && "border-accent/60 bg-accent/10 text-accent",
            )}
            data-ocid="user-filter-toggle"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {filtersOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {filtersOpen && (
          <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick toggles */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Quick Filters
              </Label>
              {[
                {
                  key: "verified" as const,
                  icon: CheckCircle,
                  label: "Verified only",
                  active: filters.verified,
                  activeClass: "bg-accent/10 border-accent/40 text-accent",
                },
                {
                  key: "admins" as const,
                  icon: Shield,
                  label: "Admins only",
                  active: filters.admins,
                  activeClass:
                    "bg-amber-400/10 border-amber-400/40 text-amber-400",
                },
              ].map(({ key, icon: Icon, label, active, activeClass }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateFilter(key, !active)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors min-h-[44px] sm:min-h-[36px]",
                    active
                      ? activeClass
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                  data-ocid={`filter-${key}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Profile type */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Profile Type
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    "all",
                    "Collector",
                    "CertificateIssuer",
                  ] as ProfileTypeFilter[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateFilter("profileType", t)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      filters.profileType === t
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                    data-ocid={`filter-type-${t}`}
                  >
                    {t === "all"
                      ? "All"
                      : t === "CertificateIssuer"
                        ? "Cert. Issuer"
                        : t}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    "all",
                    "Celebrity",
                    "Government",
                    "Institution",
                  ] as SubtypeFilter[]
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateFilter("subtype", s)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      filters.subtype === s
                        ? "bg-accent/10 border-accent/40 text-accent"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                    data-ocid={`filter-subtype-${s}`}
                  >
                    {s === "all" ? "Any subtype" : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Min followers + sort */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Min Followers
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={filters.minFollowers}
                  onChange={(e) => updateFilter("minFollowers", e.target.value)}
                  className="bg-background border-border text-sm h-9"
                  data-ocid="filter-min-followers"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Sort By
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["newest", "followers", "userNumber"] as SortOption[]).map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateFilter("sortBy", s)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                          filters.sortBy === s
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {s === "newest"
                          ? "Newest"
                          : s === "followers"
                            ? "Most Followers"
                            : "User #"}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs text-muted-foreground w-full"
              >
                Reset filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status hint */}
      {!isAuthenticated && (
        <p className="text-xs text-accent">Connect to follow users</p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"].map((k) => (
            <UserCardSkeleton key={k} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          data-ocid="user-explorer-empty"
        >
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isFiltered
                ? "Try different search terms or filters"
                : "No users have joined yet"}
            </p>
          </div>
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setSearchQuery("");
              }}
              className="border-accent/30 text-accent hover:bg-accent/10"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="user-explorer-grid"
          >
            {visibleUsers.map((user) => (
              <UserCard
                key={user.id.toString()}
                user={user}
                myPrincipal={myPrincipal}
                followingSet={followingSet}
              />
            ))}
          </div>

          {visibleCount < users.length && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + 12)}
                className="border-accent/30 text-accent hover:bg-accent/10 min-h-[44px] sm:min-h-[36px]"
                data-ocid="load-more-btn"
              >
                Load more ({users.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
