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
 * Known string representations of anonymous / invalid principals.
 * "2vxsx-fae" is the canonical IC anonymous principal.
 * "aaaaa-aa"  is what you get from Principal.fromUint8Array(Uint8Array(0))
 *              or Principal.fromText("") — an all-zero/empty principal.
 * Both must be rejected before any authenticated canister call.
 */
const INVALID_PRINCIPALS = new Set(["2vxsx-fae", "aaaaa-aa"]);

/** Returns true when the principal text represents a real authenticated user. */
function isValidPrincipal(text: string): boolean {
  return text.length > 0 && !INVALID_PRINCIPALS.has(text);
}

export function useActor(): {
  actor: Backend | null;
  isFetching: boolean;
  isAuthenticated: boolean;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = _useActor(createActor as any);
  const { identity, isInitializing } = useInternetIdentity();

  // Determine whether the current identity is a real authenticated user.
  // "2vxsx-fae" is the canonical anonymous principal.
  // "aaaaa-aa"  is what you get from an empty / zero principal.
  // Both must be rejected.
  const principalText = identity?.getPrincipal()?.toString() ?? "";
  const identityIsReal =
    !!identity && !isInitializing && isValidPrincipal(principalText);

  // isAuthenticated requires identity to be real AND the actor query to have
  // finished recreating (isFetching === false) so the actor in the query
  // cache corresponds to the authenticated identity, not an old one.
  const isAuthenticated = identityIsReal && !result.isFetching;

  // CRITICAL: The underlying _useActor hook creates an anonymous actor when
  // no identity is present (see core-infrastructure useActor.js lines 18-21).
  // We must NEVER expose that anonymous actor to callers — mutations check
  // `if (!actor)` as their primary guard. If we pass through the anonymous
  // actor, that guard is bypassed and the backend rejects with
  // "Principal aaaaa-aa does not have a valid checksum".
  //
  // Rule: actor is non-null ONLY when the identity is real AND the actor
  // query has finished building with that identity (not mid-recreate).
  const actor: Backend | null =
    identityIsReal && !result.isFetching
      ? (result.actor as Backend | null)
      : null;

  return {
    actor,
    isFetching: result.isFetching || (!!identity && !identityIsReal),
    isAuthenticated,
  };
}
