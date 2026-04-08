import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Shorten a principal string: "abc123...xyz890" */
export function formatPrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
}

type Currency = "ICP" | "ckBTC" | "ckUSDC" | "ckUSDT";

/** Format wallet amounts with currency symbol */
export function formatAmount(
  amount: bigint | number,
  currency: Currency,
): string {
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  const decimals = currency === "ckBTC" ? 8 : 8;
  const formatted = (n / 10 ** decimals).toFixed(currency === "ckBTC" ? 6 : 2);
  const symbols: Record<Currency, string> = {
    ICP: "ICP",
    ckBTC: "ckBTC",
    ckUSDC: "ckUSDC",
    ckUSDT: "ckUSDT",
  };
  return `${formatted} ${symbols[currency]}`;
}

/** Alias for formatAmount */
export function formatCurrency(
  amount: bigint | number,
  currency: string,
): string {
  const known = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as Currency[];
  if (known.includes(currency as Currency)) {
    return formatAmount(amount, currency as Currency);
  }
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  return `${(n / 1e8).toFixed(2)} ${currency}`;
}

/** Convert nanosecond Int timestamp from backend to human-readable date */
export function formatDate(nanoseconds: bigint | number): string {
  const ms =
    typeof nanoseconds === "bigint"
      ? Number(nanoseconds / BigInt(1_000_000))
      : nanoseconds / 1_000_000;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

/** Truncate text with ellipsis */
export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

/**
 * Copy text to clipboard with textarea fallback for iOS Safari.
 * Returns true on success, false on failure.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try the modern async Clipboard API first
  try {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea fallback
  }

  // 2. Fallback: hidden textarea + execCommand (iOS Safari compatible)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText =
      "position:fixed;top:0;left:0;width:2em;height:2em;opacity:0;pointer-events:none;";
    document.body.appendChild(textarea);

    // iOS Safari requires selecting a range
    const range = document.createRange();
    range.selectNodeContents(textarea);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    textarea.setSelectionRange(0, 999999);

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
