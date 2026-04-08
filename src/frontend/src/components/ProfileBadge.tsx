import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { Building2, CheckCircle, Crown, Shield, Star } from "lucide-react";
import { cn } from "../lib/utils";

interface ProfileData {
  principal?: string;
  displayName?: string;
  photoUrl?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  isCertificateIssuer?: boolean;
  certificateIssuerSubtype?:
    | "Celebrity"
    | "Government"
    | "Institution"
    | string;
  followerCount?: number | bigint;
}

interface ProfileBadgeProps {
  profile: ProfileData;
  size?: "sm" | "md" | "lg";
  showFollowers?: boolean;
  clickable?: boolean;
  className?: string;
}

const SUBTYPE_CONFIG = {
  Celebrity: {
    icon: Crown,
    label: "Celebrity",
    className: "text-chart-4 border-chart-4/40",
  },
  Government: {
    icon: Building2,
    label: "Government",
    className: "text-primary border-primary/40",
  },
  Institution: {
    icon: Star,
    label: "Institution",
    className: "text-chart-5 border-chart-5/40",
  },
} as const;

export default function ProfileBadge({
  profile,
  size = "md",
  showFollowers = false,
  clickable = true,
  className,
}: ProfileBadgeProps) {
  const initials = profile.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : "??";

  const subtype = profile.certificateIssuerSubtype as
    | keyof typeof SUBTYPE_CONFIG
    | undefined;
  const subtypeConfig = subtype ? SUBTYPE_CONFIG[subtype] : null;

  const avatarSize =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const nameSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm";

  const followerCount =
    profile.followerCount !== undefined
      ? Number(profile.followerCount)
      : undefined;

  const content = (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <Avatar
        className={cn(avatarSize, "flex-shrink-0 border border-border/50")}
      >
        <AvatarImage src={profile.photoUrl} alt={profile.displayName} />
        <AvatarFallback className="bg-accent/10 text-accent font-display font-bold text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn("font-medium text-foreground truncate", nameSize)}
          >
            {profile.displayName ?? "Anonymous"}
          </span>
          {profile.isVerified && (
            <CheckCircle
              className="h-3.5 w-3.5 text-accent flex-shrink-0"
              aria-label="Verified"
            />
          )}
          {profile.isAdmin && (
            <Badge
              variant="outline"
              className="text-[10px] px-1 py-0 border-chart-4/40 text-chart-4 flex-shrink-0"
            >
              <Shield className="h-2.5 w-2.5 mr-0.5" />
              Admin
            </Badge>
          )}
          {subtypeConfig && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1 py-0 border-border/40 flex-shrink-0",
                subtypeConfig.className,
              )}
            >
              <subtypeConfig.icon className="h-2.5 w-2.5 mr-0.5" />
              {subtypeConfig.label}
            </Badge>
          )}
        </div>
        {showFollowers && followerCount !== undefined && (
          <p className="text-xs text-muted-foreground">
            {followerCount.toLocaleString()} followers
          </p>
        )}
      </div>
    </div>
  );

  if (clickable && profile.principal) {
    return (
      <Link
        to="/users/$userId"
        params={{ userId: profile.principal }}
        className="hover:opacity-80 transition-opacity"
        data-ocid="profile-badge-link"
      >
        {content}
      </Link>
    );
  }

  return content;
}
