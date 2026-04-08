// Pre-wired useActor hook for the backend
import {
  useActor as _useActor,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
// TypeScript resolves "backend" → "backend-types.ts" via tsconfig paths.
// Vite resolves "backend" → "backend.ts" (patched by fixBackendReservedKeywords plugin).
import { createActor as _createActor } from "backend"; // eslint-disable-line import/no-unresolved
import type {
  Backend,
  CreateActorOptions,
  ExternalBlob,
} from "../backend-types";

/**
 * Wrapper around the generated createActor that strips `agentOptions` from the
 * options object when `agent` is already provided. The core-infrastructure
 * `createActorWithConfig` spreads `resolvedOptions` (which contains
 * `agentOptions`) and then adds `agent`, causing the generated createActor to
 * receive both and emit a console warning. Removing `agentOptions` before the
 * call eliminates the warning without changing any behaviour.
 */
function createActor(
  canisterId: string,
  uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
  options: CreateActorOptions = {},
): Backend {
  const { agentOptions: _discarded, ...safeOptions } =
    options as CreateActorOptions & { agentOptions?: unknown };
  const cleanOptions = options.agent ? safeOptions : options;
  return _createActor(
    canisterId,
    uploadFile,
    downloadFile,
    cleanOptions as Parameters<typeof _createActor>[3],
  );
}

/**
 * All known string representations of anonymous / invalid principals.
 *
 * "2vxsx-fae" — canonical IC anonymous principal (Principal.anonymous())
 * "aaaaa-aa"  — empty/zero principal from Principal.fromText("") or
 *               Principal.fromUint8Array(new Uint8Array(0))
 *
 * Both MUST be rejected before any authenticated canister call.
 * This set is the single source of truth — keep in sync with useQueries.ts.
 */
const ANONYMOUS_PRINCIPALS = new Set(["2vxsx-fae", "aaaaa-aa"]);

/**
 * Returns true only when the principal text represents a real, authenticated
 * user — i.e. it is non-empty and not one of the known anonymous forms.
 */
function isRealPrincipalText(text: string): boolean {
  return text.length > 0 && !ANONYMOUS_PRINCIPALS.has(text);
}

export function useActor(): {
  actor: Backend | null;
  isFetching: boolean;
  isAuthenticated: boolean;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = _useActor(createActor as any);
  const { identity, isInitializing } = useInternetIdentity();

  /**
   * THREE-LAYER identity check — all three must pass for the actor to be exposed:
   *
   *  1. identity object exists and isInitializing is false
   *  2. identity.getPrincipal().isAnonymous() === false  (IC SDK canonical check)
   *  3. principal.toString() is not in the ANONYMOUS_PRINCIPALS set  (belt-and-suspenders)
   *
   * Layer 2 catches the canonical anonymous principal used by the IC SDK.
   * Layer 3 catches the "aaaaa-aa" empty/zero form that isAnonymous() may not
   * recognise depending on SDK version, and any other edge-case representations.
   *
   * _useActor from @caffeineai/core-infrastructure ALWAYS creates an actor with
   * an anonymous agent on startup (before login). We must NEVER expose that
   * actor — callers use `if (!actor)` as their primary guard, so a non-null
   * anonymous actor bypasses every downstream check.
   */
  const identityIsReal = (() => {
    // Layer 1: identity must exist and initialisation must be complete
    if (!identity || isInitializing) return false;

    let principal: ReturnType<typeof identity.getPrincipal>;
    try {
      principal = identity.getPrincipal();
    } catch {
      // getPrincipal() threw — identity not ready
      return false;
    }

    // Layer 2: IC SDK canonical anonymous check
    try {
      if (principal.isAnonymous()) return false;
    } catch {
      // isAnonymous() unavailable in this SDK version — fall through to layer 3
    }

    // Layer 3: string-based guard for "aaaaa-aa" and "2vxsx-fae"
    const text = (() => {
      try {
        return principal.toString();
      } catch {
        return "";
      }
    })();

    return isRealPrincipalText(text);
  })();

  /**
   * isAuthenticated: identity is confirmed real AND the actor query has
   * finished rebuilding (isFetching === false). This ensures the actor in
   * the query cache was built with the authenticated identity, not the old
   * anonymous one that existed before login completed.
   */
  const isAuthenticated = identityIsReal && !result.isFetching;

  /**
   * CRITICAL RULE: actor is non-null ONLY when:
   *   (a) the identity is confirmed real (all three layers above passed), AND
   *   (b) the actor query is not currently rebuilding (isFetching === false)
   *
   * This means any code that checks `if (!actor)` will correctly block
   * during login transitions and before authentication.
   */
  const actor: Backend | null =
    identityIsReal && !result.isFetching
      ? (result.actor as Backend | null)
      : null;

  return {
    actor,
    // isFetching is true while initialising OR while we have an identity that
    // hasn't yet been confirmed as real (prevents premature "not loading" state)
    isFetching:
      result.isFetching || isInitializing || (!!identity && !identityIsReal),
    isAuthenticated,
  };
}
