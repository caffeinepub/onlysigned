import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  CheckCircle,
  ChevronDown,
  Coins,
  FileCheck,
  Globe,
  Link as LinkIcon,
  Lock,
  PenTool,
  Shield,
  ShoppingBag,
  Star,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { useRef } from "react";

// ─── Slide wrapper ────────────────────────────────────────────────────────────

function Slide({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`min-h-screen flex flex-col justify-center py-16 px-4 md:px-8 lg:px-16 ${className}`}
    >
      {children}
    </section>
  );
}

function SlideNumber({ n, total }: { n: number; total: number }) {
  return (
    <div className="text-xs text-muted-foreground/50 font-mono mb-6">
      {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
  );
}

function ScrollDown({ to }: { to: string }) {
  const handleClick = () => {
    document.getElementById(to)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      aria-label="Scroll to next section"
    >
      <ChevronDown className="h-5 w-5 animate-bounce" />
    </button>
  );
}

// ─── Slide 1 — Hero ──────────────────────────────────────────────────────────

function SlideHero() {
  return (
    <Slide id="slide-1" className="relative">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
        style={{
          backgroundImage: "url(/assets/generated/pitch-hero.dim_1200x600.jpg)",
        }}
        aria-hidden
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background pointer-events-none"
        aria-hidden
      />

      <div className="relative max-w-4xl mx-auto w-full space-y-8">
        <SlideNumber n={1} total={5} />

        <div className="space-y-4">
          <Badge
            variant="outline"
            className="border-accent/40 text-accent gap-1.5 px-3 py-1"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Web3 Digital Authenticity Platform
          </Badge>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black text-foreground leading-tight tracking-tight">
            Only<span className="text-accent">Signed</span>
          </h1>

          <p className="text-xl sm:text-2xl font-display font-semibold text-foreground/80 max-w-2xl">
            Where <span className="text-accent">Fakes Are Impossible</span>
          </p>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Every certificate is verifiable on-chain. Creators, institutions,
            and celebrities can sign digital assets as ICRC-7 NFTs — with
            trustless, immutable proof of authenticity.
          </p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
          {[
            {
              icon: Shield,
              label: "On-Chain Certificates",
              sub: "ICRC-7 NFT Standard",
            },
            {
              icon: Zap,
              label: "Trustless Verification",
              sub: "Zero central authority",
            },
            {
              icon: Globe,
              label: "Multi-Currency Market",
              sub: "ICP · ckBTC · ckUSDC · ckUSDT",
            },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="bg-card/60 border border-border/60 rounded-xl p-4 backdrop-blur-sm hover:border-accent/30 transition-colors"
            >
              <Icon className="h-5 w-5 text-accent mb-2" />
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button
            asChild
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2 font-semibold"
            data-ocid="pitch-cta-marketplace"
          >
            <Link to="/marketplace">
              Explore Marketplace <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            className="border-accent/30 text-accent hover:bg-accent/10 gap-2"
          >
            <FileCheck className="h-4 w-4" />
            Validate Certificate
          </Button>
        </div>
      </div>

      <ScrollDown to="slide-2" />
    </Slide>
  );
}

// ─── Slide 2 — How It Works ───────────────────────────────────────────────────

function SlideHowItWorks() {
  const steps = [
    {
      icon: Upload,
      step: "01",
      title: "Upload Your Asset",
      description:
        "Certificate Issuers (celebrities, institutions, governments) upload digital assets — images, documents, audio, or video — organized into collections.",
    },
    {
      icon: PenTool,
      step: "02",
      title: "Sign & Certify",
      description:
        "Sign your asset to create a numbered copy. Each signing generates a unique, tamper-proof certificate with your cryptographic signature.",
    },
    {
      icon: Award,
      step: "03",
      title: "ICRC-7 NFT Minted",
      description:
        "Each signed copy is minted as an ICRC-7 compliant NFT on the Internet Computer — with complete metadata, creator info, and authenticity hash.",
    },
    {
      icon: ShoppingBag,
      step: "04",
      title: "List on Marketplace",
      description:
        "Signed copies and collections can be listed for sale via direct purchase or auction in ICP, ckBTC, ckUSDC, or ckUSDT. Royalties are automatic.",
    },
  ];

  return (
    <Slide id="slide-2" className="bg-muted/10 relative">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        <SlideNumber n={2} total={5} />

        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            From asset upload to on-chain certificate in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {steps.map(({ icon: Icon, step, title, description }, i) => (
            <div
              key={step}
              className="relative bg-card border border-border rounded-2xl p-6 hover:border-accent/40 transition-all group"
              data-ocid={`how-it-works-step-${i + 1}`}
            >
              {/* Step line connector */}
              {i < steps.length - 1 && i % 2 === 0 && (
                <div className="hidden sm:block absolute right-0 top-1/2 w-5 border-t border-dashed border-accent/20 translate-x-5 z-10" />
              )}

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-xs font-mono text-accent/60 mb-1">
                    Step {step}
                  </div>
                  <h3 className="font-display font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ScrollDown to="slide-3" />
    </Slide>
  );
}

// ─── Slide 3 — Web3 Innovation ────────────────────────────────────────────────

function SlideWeb3Innovation() {
  const features = [
    {
      icon: FileCheck,
      title: "ICRC-7 NFT Standard",
      points: [
        "Full Internet Computer ecosystem compatibility",
        "Metadata: creator, signers, asset hash, cert ID",
        "External canister queryable & transferable",
        "Multi-signer co-signing in NFT metadata",
      ],
    },
    {
      icon: Shield,
      title: "On-Chain Verification",
      points: [
        "Validate any certificate by ID or unique URL",
        "Cryptographic proof — no central authority",
        "Every signer's signature verifiable on-chain",
        "Fakes are mathematically impossible",
      ],
    },
    {
      icon: Coins,
      title: "Multi-Currency Marketplace",
      points: [
        "ICP, ckBTC, ckUSDC, ckUSDT supported",
        "Direct purchase and auction methods",
        "Zero-price listings for free distribution",
        "Automatic royalty distribution to creators",
      ],
    },
    {
      icon: TrendingUp,
      title: "Royalty Distribution",
      points: [
        "Configured per-asset royalty percentage",
        "Auto-distributed on every secondary sale",
        "All currencies supported for royalties",
        "Transparent, on-chain royalty records",
      ],
    },
  ];

  return (
    <Slide id="slide-3" className="relative">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        <SlideNumber n={3} total={5} />

        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Web3 Innovation
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Built on the Internet Computer with full ICRC-7 compliance and
            trustless economics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, points }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-accent/30 transition-colors"
              data-ocid={`web3-feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {title}
                </h3>
              </div>
              <ul className="space-y-2">
                {points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <ScrollDown to="slide-4" />
    </Slide>
  );
}

// ─── Slide 4 — Social & Community ────────────────────────────────────────────

function SlideSocial() {
  const features = [
    {
      icon: Users,
      title: "Certificate Issuers",
      description:
        "Celebrities, institutions, and government entities can sign digital assets. 500+ follower requirement ensures quality and prevents spam.",
    },
    {
      icon: Star,
      title: "Username NFTs",
      description:
        "Verified usernames are minted as NFTs by admin. Username NFTs confer verified status and can be transferred or traded via offers.",
    },
    {
      icon: Globe,
      title: "Following System",
      description:
        "Follow Certificate Issuers and creators to stay updated. Follower counts determine Certificate Issuer eligibility and credibility.",
    },
    {
      icon: Lock,
      title: "Privacy by Default",
      description:
        "All assets, copies, and collections are private by default. Owners control visibility. Private assets are encrypted — even admins can't access them.",
    },
  ];

  return (
    <Slide id="slide-4" className="bg-muted/10 relative">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        <SlideNumber n={4} total={5} />

        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Social & Community
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            A thriving ecosystem of creators, collectors, and institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-accent/30 transition-colors"
              data-ocid={`social-feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* User Explorer showcase */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-7 w-7 text-accent" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-display font-semibold text-foreground mb-1">
              User Explorer
            </h3>
            <p className="text-sm text-muted-foreground">
              Advanced user discovery with filters for verified status,
              Certificate Issuer type, follower ranges, and more. Public
              profiles showcase collections and signed copies.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-accent/30 text-accent hover:bg-accent/10 flex-shrink-0"
            data-ocid="pitch-explore-users-btn"
          >
            <Link to="/users">
              Explore Users
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
      <ScrollDown to="slide-5" />
    </Slide>
  );
}

// ─── Slide 5 — Why OnlySigned ────────────────────────────────────────────────

function SlideWhyOnlySigned() {
  const reasons = [
    "Blockchain-backed: every certificate lives on the Internet Computer — immutable and forever verifiable",
    "No central authority required for certificate validation — trustless by design",
    "ICRC-7 NFT standard ensures ecosystem-wide interoperability and longevity",
    "Multi-signer co-signing enables collaboration between creators without sacrificing authenticity",
    "Privacy-first: all assets private by default, encrypted, never sold or monetized",
    "Zero advertisements, zero data selling — revenue only from transaction fees and donations",
  ];

  return (
    <Slide id="slide-5" className="relative">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        <SlideNumber n={5} total={5} />

        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Why OnlySigned
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            The only platform where fakes are mathematically impossible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Reasons */}
          <div className="space-y-3">
            {reasons.map((reason) => (
              <div
                key={reason.slice(0, 40)}
                className="flex items-start gap-3 p-3.5 bg-card border border-border rounded-xl hover:border-accent/30 transition-colors"
                data-ocid="why-reason"
              >
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {reason}
                </p>
              </div>
            ))}
          </div>

          {/* CTA block */}
          <div className="bg-gradient-to-br from-card via-accent/5 to-card border border-accent/20 rounded-2xl p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto">
              <LinkIcon className="h-8 w-8 text-accent" />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Only<span className="text-accent">Signed</span>
              </h3>
              <p className="text-muted-foreground text-sm mt-2">
                Where fakes are impossible. Every certificate is verifiable
                on-chain.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent/80 font-semibold gap-2 w-full"
                data-ocid="pitch-cta-get-started"
              >
                <Link to="/marketplace">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-border hover:border-accent/40 w-full"
                data-ocid="pitch-cta-validate"
              >
                <Link to="/validate">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Validate a Certificate
                </Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground/60">
              PDF export available via browser print (Ctrl+P / Cmd+P)
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function PitchNav() {
  const slides = ["Intro", "How It Works", "Web3", "Community", "Why Us"];
  const scrollToRef = useRef<HTMLDivElement>(null);

  return (
    <nav
      className="sticky top-16 z-30 bg-card/80 backdrop-blur border-b border-border"
      ref={scrollToRef}
    >
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-12 gap-4 overflow-x-auto no-scrollbar">
        <Link
          to="/"
          className="flex items-center gap-1.5 flex-shrink-0"
          data-ocid="pitch-nav-home"
        >
          <LinkIcon className="h-4 w-4 text-accent" />
          <span className="font-display font-bold text-sm text-foreground">
            Only<span className="text-accent">Signed</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {slides.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                document
                  .getElementById(`slide-${i + 1}`)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors whitespace-nowrap"
              data-ocid={`pitch-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PitchDeckPage() {
  return (
    <div
      className="-mx-4 -mt-4 md:-mx-6 md:-mt-6 bg-background"
      data-ocid="pitch-deck-page"
    >
      <PitchNav />
      <SlideHero />
      <SlideHowItWorks />
      <SlideWeb3Innovation />
      <SlideSocial />
      <SlideWhyOnlySigned />
    </div>
  );
}
