import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { Shield, ShieldCheck } from "lucide-react";

const LAST_UPDATED = "April 7, 2026";

const sections = [
  {
    id: "data-collection",
    title: "1. Data We Collect",
    content: `OnlySigned collects only what is necessary to provide the platform's functionality on the Internet Computer blockchain:
    
• Blockchain identity (Internet Identity principal) — required for authentication
• User profile information you voluntarily provide: display name, bio, profile photo URL, personal URL, email address, birthdate, and profile type
• Digital assets, signed copies, and collections you upload or create
• Transaction records for marketplace activity (publicly recorded on-chain)
• Contact relationships, follow connections, and messaging content (encrypted and private)
• Support form submissions you choose to send

We do not collect browsing history, device fingerprints, location data, or any analytics beyond what is required for the platform to function.`,
  },
  {
    id: "user-rights",
    title: "2. Your Rights",
    content: `Under GDPR, CCPA, and applicable international privacy law, you have the right to:

• Access all personal data we hold about you
• Correct inaccurate profile information at any time through your profile settings
• Delete your account and associated off-chain data
• Export your data in a portable format upon request
• Object to processing of your personal data
• Withdraw consent for any optional data processing

To exercise any of these rights, contact us at support@onlysigned.com. We will respond within 30 days.

Note: Blockchain transaction records (on-chain NFT ownership, signed certificates) are immutable by design and cannot be deleted. This is fundamental to the authenticity guarantees the platform provides.`,
  },
  {
    id: "data-security",
    title: "3. Data Security & Encryption",
    content: `All private data is encrypted using industry-standard methods:

• Private assets, signed copies, and collections marked as private are encrypted at rest
• Encryption keys are derived from your Internet Identity — only you can decrypt your private content
• Admin users have NO access to your private assets, messages, or encrypted content
• Private chat messages are encrypted end-to-end and accessible only to conversation participants
• All data transmission uses HTTPS/TLS

The Internet Computer protocol provides cryptographic guarantees at the infrastructure level, meaning your data is protected by the underlying blockchain architecture itself.`,
  },
  {
    id: "privacy-controls",
    title: "4. Privacy Controls",
    content: `You control the visibility of all your content:

• All assets, signed copies, and collections default to private upon creation
• You can toggle any item public or private at any time from your profile or detail pages
• Private items are visible only to you — never shown on public profiles or in searches
• Public items appear on your public profile and may be indexed in the User Explorer
• You can share private assets with specific trusted contacts only
• Contact relationships are mutual and require both parties to accept

These privacy settings are technically enforced, not just policy-enforced.`,
  },
  {
    id: "revenue-model",
    title: "5. Revenue Model & Zero-Advertising Policy",
    content: `OnlySigned has a strict zero-advertising policy. We do not display any advertisements on the platform. We never have and never will.

Our revenue is generated exclusively through:
• Transaction fees on marketplace sales (a small percentage of each completed sale)
• Voluntary donations from users who want to support the platform

We do not sell, rent, license, or share user data with any third parties for commercial purposes. We do not use your data to build advertising profiles or engage in behavioral targeting. Your data is not a product.

All revenue is used exclusively for platform development, infrastructure costs, and operational maintenance.`,
  },
  {
    id: "crypto-disclaimer",
    title: "6. Cryptocurrency Disclaimer & User Responsibility",
    content: `All transactions on OnlySigned are conducted in cryptocurrencies on the Internet Computer blockchain (ICP, ckBTC, ckUSDC, ckUSDT).

IMPORTANT — PLEASE READ CAREFULLY:

• You are solely responsible for your own funds, wallets, and private keys
• OnlySigned cannot reverse, recover, or refund blockchain transactions under any circumstances
• If you lose access to your Internet Identity, your funds and assets may be permanently inaccessible
• The ONLY exception: admin can assist in recovering Username NFTs for users who can prove identity through alternative means — but no other asset recovery is possible
• OnlySigned is not responsible for losses due to user error, lost keys, compromised devices, or network issues
• Cryptocurrency values are volatile — only invest what you can afford to lose
• You are responsible for complying with the tax and regulatory laws of your jurisdiction

By using OnlySigned, you acknowledge and accept full responsibility for all cryptocurrency transactions you perform on the platform.`,
  },
  {
    id: "contact",
    title: "7. Contact Information",
    content: `For privacy-related requests, data protection inquiries, or general support:

Email: support@onlysigned.com
Platform: Use the Support form at onlysigned.com/support

We are committed to responding to all privacy-related inquiries within 30 days. For urgent matters, please include "URGENT" in your subject line.

This Privacy Policy was last updated on ${LAST_UPDATED}. We will notify users of material changes by updating this page and, where appropriate, sending a notification through the platform.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div
      className="max-w-3xl mx-auto space-y-8"
      data-ocid="privacy-policy-page"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Privacy Policy
            </h1>
            <p className="text-xs text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent flex-shrink-0" />
            <p className="text-sm font-medium text-foreground">
              Our Core Commitments
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="text-accent">✓</span> Zero advertisements, ever
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent">✓</span> We never sell your data
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent">✓</span> Admin cannot see private
              content
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent">✓</span> GDPR & international law
              compliant
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent">✓</span> Revenue from fees &
              donations only
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent">✓</span> Your keys, your assets
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <nav
        className="bg-card border border-border rounded-xl p-4"
        aria-label="Privacy Policy sections"
      >
        <p className="text-xs font-medium text-muted-foreground mb-2.5">
          Contents
        </p>
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((s, idx) => (
          <section key={s.id} id={s.id} data-ocid={`privacy-section-${s.id}`}>
            <h2 className="font-display font-bold text-lg text-foreground mb-3">
              {s.title}
            </h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {s.content}
            </div>
            {idx < sections.length - 1 && (
              <Separator className="opacity-20 mt-8" />
            )}
          </section>
        ))}
      </div>

      {/* Footer links */}
      <div className="bg-muted/20 rounded-xl p-4 border border-border/50 text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Questions about this policy?
        </p>
        <Link
          to="/support"
          className="text-accent text-sm underline hover:text-accent/80"
          data-ocid="privacy-support-link"
        >
          Contact our support team
        </Link>
      </div>
    </div>
  );
}
