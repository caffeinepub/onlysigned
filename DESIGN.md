# Design Brief

## Direction

OnlySigned — Premium Web3 NFT platform for trustless digital asset signing, certification, and trading where fakes are impossible. Deep navy + cyan blockchain aesthetic, dark-capable, mobile-first with 44px touch targets.

## Tone

Bold, authoritative, immutable—deep navy/cyan palette communicates cryptographic permanence and trustless verification. No gradients, no glassmorphism, no generic tech aesthetics—only intentional borders and color layering.

## Differentiation

Bright cyan accents on verification badges and certificate states reinforce "impossible to fake" messaging. Every UI element speaks blockchain vocabulary: mono fonts for hashes/addresses, layered cards for depth, minimal hover lift for interaction clarity.

## Color Palette

| Token          | OKLCH             | Role                                        |
|----------------|-------------------|---------------------------------------------|
| background     | 0.10 0.018 265    | Deep navy charcoal—trustless foundation     |
| foreground     | 0.96 0.008 260    | Off-white text—max AA+ contrast             |
| card           | 0.14 0.02 265     | Lifted surface layer, subtle depth          |
| primary        | 0.72 0.20 200     | Deep blue—blockchain authority, CTAs        |
| accent         | 0.76 0.24 180     | Bright cyan—verification, certificates      |
| destructive    | 0.65 0.22 25      | Red-orange—irreversible actions              |
| border         | 0.22 0.028 265    | Subtle dividers, intentional depth          |

## Typography

- Display: Space Grotesk — bold, geometric, tech-forward for headings and brand
- Body: DM Sans — clean, readable, professional for UI labels and content
- Mono: Geist Mono — certificate hashes, principal IDs, transaction data
- Scale: Hero `text-6xl font-bold`, h2 `text-3xl font-bold`, label `text-xs font-semibold uppercase`, body `text-base`

## Mobile-First & Touch Targets

Min 44px height/width for all interactive elements (buttons, inputs, toggles). Desktop: 36px via `sm:min-h-[36px]`. Cards use full-width on mobile with 1rem padding, grid layouts on md+. Navigation uses bottom tab or collapsible drawer on mobile.

## Elevation & Depth

No drop shadows—only 1px borders and background color transitions. Cards: `bg-card border border-border`. Hover state: `border-accent/30` + `bg-card/80`. Elevated sections: `shadow-elevated` (0 10px 24px -8px) for modals/popovers only.

## Structural Zones

| Zone    | Background      | Border           | Notes                                          |
|---------|-----------------|------------------|------------------------------------------------|
| Header  | `bg-card`       | `border-b`       | Logo, nav, auth status. Sticky on mobile.     |
| Content | `bg-background` | —                | Main canvas. Alternating `bg-muted/20` cards. |
| Footer  | `bg-card/50`    | `border-t`       | Links, legal, support. Compact on mobile.     |

## Spacing & Rhythm

Mobile: 16px section gaps, 12px card padding. Desktop: 24px gaps, 16px card padding. Asymmetric layout favoring marketplace/certificate cards as focal points.

## Component Patterns

- Buttons: `bg-primary text-white rounded-md`, hover `brightness-110`, active `scale-95`. Full-width on mobile.
- Cards: `bg-card border border-border rounded-lg`, hover `card-hover` (border-accent/30, bg lift). Staggered entrance animation.
- Badges: `verified-badge` (cyan text, uppercase, no fill), perfect for verified status on profiles and certificates.
- Inputs: `bg-input border border-border`, focus `ring-2 ring-primary`, focus-visible outline.
- Pills (copy buttons): `bg-muted/50 text-xs font-medium px-3 py-1 rounded-full`, active shows checkmark + "Copied!".

## Motion

- Entrance: `fade-in` + `slide-up` (300ms) on page load, staggered for cards
- Hover: `transition-smooth` (300ms cubic-bezier(0.4, 0, 0.2, 1)), border-accent/30 lift, brightness-110
- Badges: `pulse-subtle` (2s, opacity 1→0.8) on new verification badges
- No bouncy animations, no over-motion—all easing is smooth and intentional

## Constraints

- No gradients, no glassmorphism, no neon—effects via color and borders only
- All blockchain data (hashes, principals, amounts) use `font-mono` for immutability feel
- Cyan accent reserved for verified badges, certificates, verification states, and transaction validation
- All interactive elements have explicit 44px min height on mobile, 36px on desktop

## Signature Detail

Verified badges: cyan text + chain-link icon, reinforcing "impossible to fake" through blockchain vocabulary. Certificate cards: mono font for hashes, bright cyan checkmark on verified state, minimal hover lift for interaction clarity without visual noise.

