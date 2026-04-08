import { Link } from "@tanstack/react-router";
import { Heart, Link as LinkIcon, Shield } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "onlysigned-app";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="border-t border-border bg-card/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-accent" />
            <span className="font-display font-bold text-sm text-foreground">
              Only<span className="text-accent">Signed</span>
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-accent" />
              All certificates verifiable on-chain
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/validate"
              className="hover:text-foreground transition-colors"
            >
              Validate Certificate
            </Link>
            <Link
              to="/support"
              className="hover:text-foreground transition-colors"
            >
              Support
            </Link>
            <Link
              to="/.well-known"
              className="hover:text-foreground transition-colors text-xs"
            >
              .well-known
            </Link>
          </div>

          {/* Caffeine credit */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>© {currentYear}. Built with</span>
            <Heart className="h-3 w-3 fill-primary text-primary" />
            <span>using</span>
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors font-medium"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
