import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@tanstack/react-router";
import {
  AtSign,
  ChevronDown,
  HelpCircle,
  Layers,
  Link as LinkIcon,
  Menu,
  MessageSquare,
  Shield,
  ShoppingBag,
  Star,
  Upload,
  User,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useProfile";
import { cn } from "../lib/utils";
import Footer from "./Footer";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  children?: NavItem[];
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Marketplace", to: "/marketplace", icon: ShoppingBag },
  {
    label: "Collectibles",
    to: "/collections",
    icon: Layers,
    children: [
      { label: "Collections", to: "/collections", icon: Layers },
      { label: "Upload Asset", to: "/upload", icon: Upload },
      { label: "My Collectibles", to: "/my-collectibles", icon: Star },
      { label: "Username NFTs", to: "/username-nfts", icon: AtSign },
    ],
  },
  { label: "User Explorer", to: "/users", icon: Users },
  {
    label: "Contacts",
    to: "/contacts",
    icon: UserCheck,
    children: [
      { label: "My Contacts", to: "/contacts", icon: UserCheck },
      { label: "Invitations", to: "/contact-invitations", icon: UserCheck },
      { label: "Messages", to: "/messages", icon: MessageSquare },
    ],
  },
  { label: "Support", to: "/support", icon: HelpCircle },
  { label: "Profile / Wallet", to: "/profile", icon: Wallet },
  { label: "Admin Dashboard", to: "/admin", icon: Shield, adminOnly: true },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = useIsAdmin();

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky top header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger — 44px touch target */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex flex-col items-center justify-center"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
              data-ocid="nav-hamburger"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-1.5 group min-h-[44px] sm:min-h-[36px] items-center"
              data-ocid="nav-logo"
            >
              <LinkIcon className="h-5 w-5 text-accent" strokeWidth={2.5} />
              <span className="font-display font-bold text-lg text-foreground tracking-tight">
                Only<span className="text-accent">Signed</span>
              </span>
            </Link>

            {/* Tagline – desktop only */}
            <span className="hidden lg:block text-xs text-muted-foreground border-l border-border pl-4">
              Where fakes are impossible.
            </span>
          </div>

          {/* Desktop auth buttons */}
          <nav
            className="hidden md:flex items-center gap-1"
            data-ocid="nav-desktop"
          >
            <AuthButtons />
          </nav>

          {/* Mobile auth buttons */}
          <div className="md:hidden">
            <AuthButtons compact />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed md:sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 border-r border-border bg-card/80 backdrop-blur overflow-y-auto z-40",
            "transition-transform duration-200 ease-in-out",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0",
          )}
          data-ocid="nav-sidebar"
        >
          <nav className="py-4 px-3 space-y-0.5">
            {visibleItems.map((item) => (
              <SidebarItem
                key={item.to}
                item={item}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}
          </nav>
        </aside>

        {/* Backdrop for mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-30 bg-background/80 md:hidden"
            role="button"
            tabIndex={0}
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          />
        )}

        {/* Main content area */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-3 sm:p-6">{children}</div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

interface SidebarItemProps {
  item: NavItem;
  onNavigate: () => void;
  depth?: number;
}

function SidebarItem({ item, onNavigate, depth = 0 }: SidebarItemProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const Icon = item.icon;
  const isActive = router.state.location.pathname === item.to;

  if (item.children) {
    const anyChildActive = item.children.some(
      (c) => router.state.location.pathname === c.to,
    );
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-[40px]",
            anyChildActive
              ? "text-foreground bg-accent/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
          data-ocid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}-toggle`}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              open || anyChildActive ? "rotate-180" : "",
            )}
          />
        </button>
        {(open || anyChildActive) && (
          <div className="mt-0.5 ml-3 pl-3 border-l border-border space-y-0.5">
            {item.children.map((child) => (
              <SidebarItem
                key={child.to}
                item={child}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-[40px]",
        isActive
          ? "text-accent bg-accent/10 font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        item.label === "Admin Dashboard" &&
          "text-chart-4 hover:text-chart-4/80 hover:bg-chart-4/10",
      )}
      data-ocid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

// ─── Auth Buttons ─────────────────────────────────────────────────────────────

function AuthButtons({ compact = false }: { compact?: boolean }) {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const principalStr = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principalStr.length > 12
      ? `${principalStr.slice(0, 6)}…${principalStr.slice(-4)}`
      : principalStr;

  if (!isAuthenticated) {
    return (
      <Button
        onClick={login}
        disabled={isLoggingIn}
        size="sm"
        className="bg-accent text-accent-foreground hover:bg-accent/80 font-semibold min-h-[44px] sm:min-h-[36px]"
        data-ocid="connect-btn"
      >
        {isLoggingIn ? "Connecting…" : "Connect"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!compact && (
        <Badge
          variant="outline"
          className="font-mono text-xs border-accent/30 text-muted-foreground hidden lg:flex"
          data-ocid="principal-badge"
        >
          {shortPrincipal}
        </Badge>
      )}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="min-h-[44px] sm:min-h-[36px] text-muted-foreground hover:text-foreground"
        data-ocid="nav-profile-btn"
      >
        <Link to="/profile">
          <User className="h-4 w-4 mr-1" />
          {!compact && <span className="hidden sm:inline">Profile</span>}
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={clear}
        className="border-border hover:border-destructive hover:text-destructive min-h-[44px] sm:min-h-[36px]"
        data-ocid="disconnect-btn"
      >
        Disconnect
      </Button>
    </div>
  );
}
