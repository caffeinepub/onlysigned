import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowRight,
  AtSign,
  Building2,
  Check,
  CheckCircle,
  Copy,
  Crown,
  Edit3,
  Hash,
  Info,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  IssuerSubtype,
  Transaction,
  WalletBalance,
} from "../backend-types";
import { ProfileType } from "../backend-types";
import ConnectWall from "../components/ConnectWall";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyProfile, useSaveProfile } from "../hooks/useProfile";
import {
  useMySignedCopies,
  useMyTransactions,
  useMyWallet,
  useUsernameNFT,
  useWithdrawFunds,
} from "../hooks/useQueries";
import { copyToClipboard, formatAmount, formatDate } from "../lib/utils";

const CURRENCIES = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;
type Currency = (typeof CURRENCIES)[number];

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  if (!identity) {
    return (
      <ConnectWall message="Connect your wallet to manage your OnlySigned profile." />
    );
  }
  return <ProfileContent />;
}

// ─── Pill-style copy button ────────────────────────────────────────────────────

function CopyPill({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Could not copy — please select and copy manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      data-ocid="principal-copy-btn"
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
        "text-xs font-medium transition-all duration-200 select-none",
        "min-h-[44px] sm:min-h-[36px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        copied
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-border bg-muted/40 text-muted-foreground hover:border-accent/40 hover:bg-muted/60 hover:text-foreground active:scale-95",
      ].join(" ")}
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

// ─── Main profile content (authenticated) ─────────────────────────────────────

function ProfileContent() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();
  const saveProfile = useSaveProfile();
  const withdrawFunds = useWithdrawFunds();
  const { data: wallet } = useMyWallet() as {
    data: WalletBalance | null | undefined;
  };
  const { data: transactions } = useMyTransactions() as {
    data: Transaction[] | undefined;
  };
  const { data: signedCopies } = useMySignedCopies();

  const p = profile;
  const usernameVal = p?.username ?? "";
  const { data: usernameNFTData } = useUsernameNFT(usernameVal || undefined);
  const hasUsernameNFT = !!p?.hasUsernameNFT;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    profileType: "Collector" as string,
    issuerSubtype: "" as string,
    birthdate: "",
    email: "",
    photoUrl: "",
    personalUrl: "",
  });
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState<Currency>("ICP");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [txPage, setTxPage] = useState(0);
  const TX_PAGE_SIZE = 10;

  const startEdit = () => {
    if (!p) return;
    setForm({
      displayName: p.displayName ?? "",
      bio: p.bio ?? "",
      profileType: p.profileType ?? "Collector",
      issuerSubtype: p.certIssuerSubtype ?? "",
      birthdate: p.birthdate ?? "",
      email: p.email ?? "",
      photoUrl: p.profilePhoto ?? "",
      personalUrl: p.personalUrl ?? "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await saveProfile.mutateAsync({
        displayName: form.displayName,
        bio: form.bio,
        profileType: form.profileType as ProfileType,
        certIssuerSubtype: form.issuerSubtype
          ? (form.issuerSubtype as IssuerSubtype)
          : undefined,
        birthdate: form.birthdate || undefined,
        email: form.email || undefined,
        profilePhoto: form.photoUrl || undefined,
        personalUrl: form.personalUrl || undefined,
      });
      toast.success("Profile saved!");
      setEditing(false);
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawAmount);
    if (!withdrawAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (withdrawCurrency === "ICP" && !withdrawAddress.trim()) {
      toast.error("Destination ICP principal address is required.");
      return;
    }
    try {
      await withdrawFunds.mutateAsync({
        amount: BigInt(Math.floor(amount * 1e8)),
        currency: withdrawCurrency,
        destinationAddress:
          withdrawCurrency === "ICP" ? withdrawAddress.trim() : undefined,
      });
      toast.success(`Withdrawal of ${amount} ${withdrawCurrency} submitted.`);
      setWithdrawAmount("");
      setWithdrawAddress("");
    } catch {
      toast.error("Withdrawal failed. Check your balance and try again.");
    }
  };

  const isAdmin = !!p?.isAdmin;
  const isVerified = !!p?.isVerified;
  const isCertificateIssuer = p?.profileType === ProfileType.CertificateIssuer;
  const followerCount = Number(p?.followerCount ?? 0n);
  const followingCount = Number(p?.followingCount ?? 0n);
  const isEligible = isAdmin || followerCount >= 500;

  const userNumber = p?.userNumber !== undefined ? Number(p.userNumber) : null;
  const principalText = p?.id ? p.id.toString() : null;

  const txList = transactions ?? [];
  const copiesList = signedCopies ?? [];
  const txPageSlice = txList.slice(
    txPage * TX_PAGE_SIZE,
    (txPage + 1) * TX_PAGE_SIZE,
  );
  const txPageCount = Math.ceil(txList.length / TX_PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0"
      data-ocid="profile-page"
    >
      {/* ── Header card ──────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardContent className="pt-5 pb-5 px-4 sm:px-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <Avatar className="h-14 w-14 sm:h-18 sm:w-18 border-2 border-accent/30 flex-shrink-0">
              <AvatarImage src={p?.profilePhoto ?? ""} />
              <AvatarFallback className="bg-accent/10 text-accent font-display font-bold text-xl">
                {(p?.displayName ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-xl text-foreground">
                  {p?.displayName ?? "Anonymous"}
                </h1>
                {isVerified && (
                  <CheckCircle
                    className="h-4 w-4 text-accent"
                    aria-label="Verified"
                  />
                )}
                {isAdmin && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-400/40 text-amber-400"
                  >
                    <Shield className="h-2.5 w-2.5 mr-0.5" />
                    Admin
                  </Badge>
                )}
                {isCertificateIssuer && (
                  <IssuerBadge subtype={p?.certIssuerSubtype ?? ""} />
                )}
                {userNumber !== null && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/40 text-primary font-mono"
                    data-ocid="profile-user-number"
                  >
                    <Hash className="h-2.5 w-2.5 mr-0.5" />
                    User #{userNumber}
                  </Badge>
                )}
              </div>

              {/* Username */}
              {usernameVal && (
                <div className="flex items-center gap-1 mt-0.5">
                  <AtSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {usernameVal}
                  </span>
                </div>
              )}

              {/* Follower counts */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>
                  <Users className="h-3 w-3 inline mr-1" />
                  {followerCount} followers
                </span>
                <span>{followingCount} following</span>
                {isCertificateIssuer && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${isEligible ? "border-accent/40 text-accent" : "border-border text-muted-foreground"}`}
                  >
                    {isEligible
                      ? "✓ Can issue certificates"
                      : `${500 - followerCount} more followers needed`}
                  </Badge>
                )}
              </div>

              {/* Principal ID */}
              {principalText && (
                <div className="mt-3 w-full" data-ocid="profile-principal-id">
                  <p className="text-xs text-muted-foreground mb-1">
                    Principal ID
                  </p>
                  <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                    <p className="font-mono text-xs text-foreground/80 leading-relaxed flex-1 min-w-0 select-all break-anywhere">
                      {principalText}
                    </p>
                    <CopyPill text={principalText} label="Principal ID" />
                  </div>
                </div>
              )}

              {/* Username NFT status */}
              {hasUsernameNFT ? (
                <div
                  className="mt-3 flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-accent/10 border border-accent/30 w-full"
                  data-ocid="profile-nft-username-verified"
                >
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-accent/80 uppercase tracking-wide leading-none mb-0.5">
                      NFT Username
                    </p>
                    <p className="text-sm font-display font-semibold text-foreground truncate">
                      @{usernameNFTData?.username ?? usernameVal}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-auto shrink-0 text-[10px] border-accent/40 text-accent"
                  >
                    Verified
                  </Badge>
                </div>
              ) : (
                <div
                  className="mt-3 flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-muted/40 border border-border w-full"
                  data-ocid="profile-nft-username-cta"
                >
                  <Sparkles className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground leading-snug">
                      You don't have a Username NFT yet
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Claim a verified username on-chain
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/username-nfts" })}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors mt-0.5 min-h-[44px] sm:min-h-[36px]"
                    data-ocid="profile-get-nft-btn"
                  >
                    Get one
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Edit / Save button */}
            <Button
              variant="outline"
              size="sm"
              onClick={editing ? handleSave : startEdit}
              disabled={saveProfile.isPending}
              className="flex-shrink-0 min-h-[44px] sm:min-h-[36px]"
              data-ocid="profile-edit-btn"
            >
              {editing ? (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saveProfile.isPending ? "Saving…" : "Save"}
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Profile Information ───────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  data-ocid="profile-displayname-input"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  rows={3}
                  data-ocid="profile-bio-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profileType">Profile Type</Label>
                <Select
                  value={form.profileType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, profileType: v }))
                  }
                >
                  <SelectTrigger
                    id="profileType"
                    data-ocid="profile-type-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Collector">Collector</SelectItem>
                    <SelectItem value="CertificateIssuer">
                      Certificate Issuer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.profileType === "CertificateIssuer" && (
                <div className="space-y-1.5">
                  <Label htmlFor="issuerSubtype">Issuer Type</Label>
                  <Select
                    value={form.issuerSubtype}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, issuerSubtype: v }))
                    }
                  >
                    <SelectTrigger
                      id="issuerSubtype"
                      data-ocid="profile-subtype-select"
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Celebrity">Celebrity</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Institution">Institution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email{" "}
                  <span className="text-muted-foreground text-xs">
                    (private)
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  data-ocid="profile-email-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={form.birthdate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, birthdate: e.target.value }))
                  }
                  data-ocid="profile-birthdate-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="photoUrl">Profile Photo URL</Label>
                <Input
                  id="photoUrl"
                  value={form.photoUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, photoUrl: e.target.value }))
                  }
                  placeholder="https://…"
                  data-ocid="profile-photo-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="personalUrl">Personal URL</Label>
                <Input
                  id="personalUrl"
                  value={form.personalUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, personalUrl: e.target.value }))
                  }
                  placeholder="https://…"
                  data-ocid="profile-url-input"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saveProfile.isPending}
                  className="bg-accent text-accent-foreground hover:bg-accent/80"
                  data-ocid="profile-save-btn"
                >
                  {saveProfile.isPending ? "Saving…" : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: "Display Name", value: p?.displayName },
                { label: "Email", value: p?.email },
                { label: "Personal URL", value: p?.personalUrl },
                {
                  label: "Profile Type",
                  value:
                    p?.profileType === ProfileType.CertificateIssuer
                      ? "Certificate Issuer"
                      : p?.profileType,
                },
                { label: "Issuer Type", value: p?.certIssuerSubtype },
              ]
                .filter((f) => f.value)
                .map((f) => (
                  <div key={f.label}>
                    <p className="text-muted-foreground text-xs">{f.label}</p>
                    <p className="text-foreground font-medium truncate">
                      {f.value}
                    </p>
                  </div>
                ))}
              {p?.bio && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs">Bio</p>
                  <p className="text-foreground">{p.bio}</p>
                </div>
              )}
              {!p?.displayName && (
                <p className="text-muted-foreground text-sm sm:col-span-2">
                  No profile info yet.{" "}
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-accent underline"
                  >
                    Set up your profile
                  </button>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Wallet ─────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Balances */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CURRENCIES.map((currency) => {
              let balance = 0n;
              if (wallet) {
                if (currency === "ICP") balance = wallet.icp;
                else if (currency === "ckBTC") balance = wallet.ckbtc;
                else if (currency === "ckUSDC") balance = wallet.ckusdc;
                else if (currency === "ckUSDT") balance = wallet.ckusdt;
              }
              return (
                <div
                  key={currency}
                  className="bg-muted/30 rounded-lg p-3 border border-border/50"
                >
                  <p className="text-xs text-muted-foreground">{currency}</p>
                  <p className="font-display font-semibold text-foreground text-sm mt-0.5">
                    {formatAmount(
                      balance,
                      currency as "ICP" | "ckBTC" | "ckUSDC" | "ckUSDT",
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <Separator className="opacity-30" />

          {/* Deposit instructions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              Deposit Funds
            </p>
            <div className="rounded-lg bg-muted/20 border border-border/50 px-4 py-3 space-y-1.5 text-xs text-muted-foreground">
              <p>
                Deposits are processed through real blockchain transactions on
                the Internet Computer.
              </p>
              <p>
                To add ICP, ckBTC, ckUSDC, or ckUSDT — send from any compatible
                wallet directly to your principal address above.
              </p>
              <p className="text-foreground/60 italic">
                Note: no fake or simulated deposits are accepted. All balances
                reflect on-chain activity only.
              </p>
            </div>
          </div>

          <Separator className="opacity-30" />

          {/* Withdraw */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Withdraw Funds
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                data-ocid="withdraw-amount-input"
                className="min-h-[44px] sm:min-h-[36px]"
              />
              <Select
                value={withdrawCurrency}
                onValueChange={(v) => setWithdrawCurrency(v as Currency)}
              >
                <SelectTrigger
                  data-ocid="withdraw-currency-select"
                  className="min-h-[44px] sm:min-h-[36px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-accent/30 text-accent hover:bg-accent/10 min-h-[44px] sm:min-h-[36px]"
                onClick={handleWithdraw}
                disabled={withdrawFunds.isPending}
                data-ocid="withdraw-submit-btn"
              >
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                {withdrawFunds.isPending ? "Processing…" : "Withdraw"}
              </Button>
            </div>
            {withdrawCurrency === "ICP" && (
              <Input
                placeholder="Destination ICP principal address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                data-ocid="withdraw-address-input"
                className="min-h-[44px] sm:min-h-[36px]"
              />
            )}
            <p className="text-xs text-muted-foreground">
              You are solely responsible for your funds and keys. OnlySigned
              cannot recover lost funds.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Collectibles summary ─────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            My Collectibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 bg-muted/30 rounded-lg p-4 border border-border/50 w-fit">
            <span className="font-display font-bold text-3xl text-accent">
              {copiesList.length}
            </span>
            <span className="text-sm text-muted-foreground">
              Signed Copies Owned
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Transaction History ──────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No transactions yet.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {txPageSlice.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs bg-muted/20 rounded px-3 py-2.5 border border-border/30"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {tx.txType}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {tx.timestamp ? formatDate(tx.timestamp) : ""}
                      </span>
                    </div>
                    <span className="font-mono text-accent">
                      {tx.amount
                        ? formatAmount(
                            tx.amount,
                            tx.currency as
                              | "ICP"
                              | "ckBTC"
                              | "ckUSDC"
                              | "ckUSDT",
                          )
                        : ""}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {txPageCount > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txPage === 0}
                    onClick={() => setTxPage((p) => p - 1)}
                    className="text-xs min-h-[44px] sm:min-h-[36px]"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {txPage + 1} of {txPageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txPage >= txPageCount - 1}
                    onClick={() => setTxPage((p) => p + 1)}
                    className="text-xs min-h-[44px] sm:min-h-[36px]"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Issuer badge helper ───────────────────────────────────────────────────────

function IssuerBadge({ subtype }: { subtype: string }) {
  if (subtype === "Celebrity")
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-amber-400/40 text-amber-400"
      >
        <Crown className="h-2.5 w-2.5 mr-0.5" />
        Celebrity
      </Badge>
    );
  if (subtype === "Government")
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-blue-400/40 text-blue-400"
      >
        <Building2 className="h-2.5 w-2.5 mr-0.5" />
        Government
      </Badge>
    );
  if (subtype === "Institution")
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-purple-400/40 text-purple-400"
      >
        <Star className="h-2.5 w-2.5 mr-0.5" />
        Institution
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="text-[10px] border-accent/40 text-accent"
    >
      Certificate Issuer
    </Badge>
  );
}
