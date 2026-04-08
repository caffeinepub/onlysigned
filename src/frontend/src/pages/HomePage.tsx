import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart2,
  CheckCircle,
  Crown,
  Link as LinkIcon,
  PenTool,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Star,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend-types";
import { ProfileType } from "../backend-types";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyProfile, useRegisterUser } from "../hooks/useProfile";
import {
  useLatestUsers,
  usePublicMarketplaceListings,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";

// ─── Feature Highlights ───────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "On-Chain Certificates",
    description:
      "Every signed copy is an ICRC-7 NFT with cryptographic proof. Fakes are mathematically impossible.",
    accent: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
  {
    icon: Zap,
    title: "Multi-Currency Marketplace",
    description:
      "Trade signed copies and collections in ICP, ckBTC, ckUSDC, and ckUSDT with atomic payment transfers.",
    accent: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    icon: Crown,
    title: "Certificate Issuers",
    description:
      "Celebrities, institutions, and governments create verifiable digital certificates for authentic works.",
    accent: "text-chart-4",
    bg: "bg-chart-4/10 border-chart-4/20",
  },
  {
    icon: Users,
    title: "Multi-Signer Support",
    description:
      "Asset owners can invite co-signers. All signatures are embedded in ICRC-7 token metadata on-chain.",
    accent: "text-chart-5",
    bg: "bg-chart-5/10 border-chart-5/20",
  },
] as const;

// ─── How It Works ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload Your Asset",
    description:
      "Certificate Issuers upload digital assets — images, audio, documents, or videos — and organise them into collections.",
  },
  {
    step: "02",
    title: "Sign & Certify",
    description:
      "Sign your asset to create unique numbered copies, each minted as an ICRC-7 NFT with a verifiable certificate.",
  },
  {
    step: "03",
    title: "Set Your Price",
    description:
      "Price each signed copy individually — free or paid, direct purchase or auction — in any supported currency.",
  },
  {
    step: "04",
    title: "Sell in the Marketplace",
    description:
      "Collectors buy verified signed copies knowing every certificate is cryptographically authentic and on-chain.",
  },
] as const;

const PROFILE_TYPES = [
  {
    value: "Collector",
    label: "Collector — Browse and collect signed digital assets",
  },
  {
    value: "CertificateIssuer",
    label: "Certificate Issuer — Create and sign digital assets",
  },
];
const ISSUER_SUBTYPES = [
  { value: "Celebrity", label: "Celebrity" },
  { value: "Government", label: "Government" },
  { value: "Institution", label: "Institution" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { mutateAsync: registerUser, isPending: isRegistering } =
    useRegisterUser();
  const { data: listings } = usePublicMarketplaceListings();
  const { data: latestUsers, isLoading: usersLoading } = useLatestUsers(
    BigInt(12),
  );

  const [displayName, setDisplayName] = useState("");
  const [profileType, setProfileType] = useState("Collector");
  const [subtype, setSubtype] = useState("Celebrity");

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";
  const hasProfile = !!profile;

  const handleRegister = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    try {
      await registerUser(displayName.trim());
      toast.success("Welcome to OnlySigned! Your profile has been created.");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to create profile");
    }
  };

  // ─── Unauthenticated Hero ────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Hero */}
        <section className="pt-10 pb-4 text-center space-y-6 relative">
          <div className="absolute inset-0 -top-8 overflow-hidden rounded-2xl opacity-10 pointer-events-none">
            <img
              src="/assets/generated/hero-certificate-abstract.dim_1200x600.jpg"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-sm text-accent">
              <ShieldCheck className="h-3.5 w-3.5" />
              OnlySigned — Powered by Internet Computer · ICRC-7 NFT Standard
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl text-foreground leading-tight tracking-tight">
              A New Era of <br />
              <span className="text-accent">Trustless Authenticity.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Fakes are impossible. Every certificate is verifiable on-chain.
              Creators, celebrities, and institutions sign digital assets as{" "}
              <span className="text-foreground font-medium">ICRC-7 NFTs</span> —
              with cryptographic proof that can never be forged.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                onClick={login}
                disabled={isLoggingIn}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/80 font-bold px-8 text-base h-12 min-h-[44px]"
                data-ocid="hero-connect-btn"
              >
                {isLoggingIn ? "Connecting…" : "Connect & Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-border/60 h-12 text-base min-h-[44px]"
              >
                <Link to="/marketplace">Explore Marketplace</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-accent" /> No passwords
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-accent" /> Zero ads
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-accent" />{" "}
                Privacy-first
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-accent" /> On-chain
                verification
              </span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-card/40 border border-border/30 rounded-2xl p-6 sm:p-8">
          <h2 className="font-display font-bold text-2xl text-center text-foreground mb-8">
            The Trustless Authenticity Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 p-4 rounded-xl bg-background/60 border border-border/30"
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center",
                    f.bg,
                  )}
                >
                  <f.icon className={cn("h-5 w-5", f.accent)} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="font-display font-bold text-2xl text-center text-foreground mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center space-y-3 relative">
                <div className="font-display font-bold text-5xl text-accent/20">
                  {step.step}
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Latest Active Users */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-foreground">
              Latest Active Users
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/users">
                Explore all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          {usersLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
                <Skeleton key={`u-sk-${k}`} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(latestUsers ?? []).map((user) => (
                <UserCard key={user.id.toString()} user={user} />
              ))}
            </div>
          )}
        </section>

        {/* CTA footer */}
        <section className="bg-card/50 border border-accent/20 rounded-2xl p-8 text-center space-y-4">
          <h2 className="font-display font-bold text-2xl text-foreground">
            Ready to sign the future?
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Join OnlySigned — where every certificate is on-chain, every fake is
            impossible, and every signature matters.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/80 font-bold px-10 h-12 min-h-[44px]"
            data-ocid="cta-connect-btn"
          >
            {isLoggingIn ? "Connecting…" : "Connect & Get Started"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </div>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ─── Registration ────────────────────────────────────────────────────────────
  if (!hasProfile) {
    return (
      <div className="max-w-lg mx-auto pt-8">
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
            <LinkIcon className="h-7 w-7 text-accent" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Welcome to OnlySigned
          </h1>
          <p className="text-muted-foreground text-sm">
            Create your profile to start collecting or issuing certificates on
            the blockchain.
          </p>
        </div>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your unique public display name"
                maxLength={60}
                data-ocid="register-display-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profileType">Account Type</Label>
              <Select value={profileType} onValueChange={setProfileType}>
                <SelectTrigger
                  id="profileType"
                  data-ocid="register-profile-type"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {profileType === "CertificateIssuer" && (
              <div className="space-y-2">
                <Label htmlFor="subtype">Issuer Type</Label>
                <Select value={subtype} onValueChange={setSubtype}>
                  <SelectTrigger id="subtype" data-ocid="register-subtype">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUER_SUBTYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Certificate Issuers require 500+ followers to issue
                  certificates.
                </p>
              </div>
            )}
            <Button
              onClick={handleRegister}
              disabled={isRegistering || !displayName.trim()}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/80 font-semibold min-h-[44px]"
              data-ocid="register-submit-btn"
            >
              {isRegistering ? "Creating profile…" : "Create Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Authenticated Dashboard ──────────────────────────────────────────────────
  const p = profile as User;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <section className="bg-card/60 border border-border/30 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Welcome back, {p.displayName}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {p.profileType === ProfileType.CertificateIssuer
                ? "Certificate Issuer — You can sign assets and create on-chain certificates"
                : "Collector — Browse and collect signed digital assets"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {p.isVerified && (
              <Badge
                variant="outline"
                className="border-accent/30 text-accent text-xs"
              >
                <ShieldCheck className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
            {p.isAdmin && (
              <Badge
                variant="outline"
                className="border-chart-4/40 text-chart-4 text-xs"
              >
                <Shield className="h-3 w-3 mr-1" /> Admin
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Signed Copies", value: 0, icon: PenTool },
          { label: "Collections", value: 0, icon: LayersIcon },
          {
            label: "Following",
            value: Number(p.followingCount ?? 0n),
            icon: Users,
          },
          {
            label: "Followers",
            value: Number(p.followerCount ?? 0n),
            icon: BarChart2,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/40 bg-card/60">
            <CardContent className="pt-4 pb-4 text-center">
              <stat.icon className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
              <div className="font-display font-bold text-2xl text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-16 flex-col gap-1 border-border/50 min-h-[44px]"
          >
            <Link to="/marketplace">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Browse Marketplace</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-16 flex-col gap-1 border-border/50 min-h-[44px]"
          >
            <Link to="/my-collectibles">
              <Star className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">My Collectibles</span>
            </Link>
          </Button>
          {p.profileType === ProfileType.CertificateIssuer ? (
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-16 flex-col gap-1 border-accent/30 min-h-[44px]"
            >
              <Link to="/upload">
                <Upload className="h-5 w-5 text-accent" />
                <span className="text-sm text-accent">Upload Asset</span>
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-16 flex-col gap-1 border-border/50 min-h-[44px]"
            >
              <Link to="/users">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">User Explorer</span>
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Latest users */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-foreground">
            Latest Active Users
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/users">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        {usersLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
              <Skeleton key={`us-${k}`} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(latestUsers ?? []).slice(0, 8).map((user) => (
              <UserCard key={user.id.toString()} user={user} />
            ))}
          </div>
        )}
      </section>

      {/* Marketplace listings */}
      {Array.isArray(listings) && listings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-foreground">
              Recent Listings
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/marketplace">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.slice(0, 6).map((listing) => (
              <Link
                key={listing.id}
                to="/marketplace"
                className="block"
                data-ocid="listing-card"
              >
                <Card className="border-border/40 bg-card/60 hover:border-accent/30 hover:bg-card/80 transition-all group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-accent" />
                      </div>
                      <Badge
                        variant="outline"
                        className="border-accent/30 text-accent text-xs"
                      >
                        {listing.itemType}
                      </Badge>
                    </div>
                    <p className="font-semibold text-foreground text-sm truncate group-hover:text-accent transition-colors">
                      {listing.itemId.slice(0, 16)}…
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {listing.price === BigInt(0)
                          ? "Free"
                          : `${(Number(listing.price) / 1e8).toFixed(2)} ${listing.currency}`}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {listing.saleMethod}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────

function UserCard({ user }: { user: User }) {
  const initials = user.displayName?.slice(0, 2).toUpperCase() ?? "??";
  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id.toString() }}
      className="group"
      data-ocid="home-user-card"
    >
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/40 bg-card/50 hover:border-accent/30 hover:bg-card/80 transition-all">
        <Avatar className="h-9 w-9 flex-shrink-0 border border-border/50">
          <AvatarImage
            src={user.profilePhoto ?? undefined}
            alt={user.displayName}
          />
          <AvatarFallback className="bg-accent/10 text-accent font-display font-bold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
              {user.displayName}
            </p>
            {user.isVerified && (
              <CheckCircle className="h-3 w-3 text-accent flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            #{Number(user.userNumber)}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Layers icon (inline SVG) ─────────────────────────────────────────────────

function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
