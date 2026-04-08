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

  // isAuthenticated is true only when ALL of the following hold:
  //   1. identity object is present
  //   2. internet identity is not still initialising
  //   3. the actor query is fully settled (not mid-refresh / mid-recreate)
  //   4. the principal is a real, non-anonymous, non-empty principal
  //
  // Checking !result.isFetching is critical: when the identity changes,
  // the actor is recreated asynchronously. Until the new actor is ready
  // isFetching === true, so isAuthenticated stays false — preventing any
  // write mutation from running with the old anonymous actor.
  const principalText = identity?.getPrincipal()?.toString() ?? "";
  const isAuthenticated =
    !!identity &&
    !isInitializing &&
    !result.isFetching &&
    isValidPrincipal(principalText);

  return {
    ...(result as { actor: Backend | null; isFetching: boolean }),
    isAuthenticated,
  };
}
