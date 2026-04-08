// Pre-wired useActor hook for the backend
import {
  useActor as _useActor,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
// TypeScript resolves "backend" → "backend-types.ts" via tsconfig paths.
// Vite resolves "backend" → "backend.ts" (patched by fixBackendReservedKeywords plugin).
import { createActor } from "backend"; // eslint-disable-line import/no-unresolved
import type { Backend } from "../backend-types";

/** The well-known text representation of the anonymous principal on IC. */
const ANONYMOUS_PRINCIPAL = "2vxsx-fae";

export function useActor(): {
  actor: Backend | null;
  isFetching: boolean;
  isAuthenticated: boolean;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = _useActor(createActor as any);
  const { identity, isInitializing } = useInternetIdentity();

  // isAuthenticated is true only when:
  //   1. identity is present (not null/undefined)
  //   2. auth is not initialising
  //   3. the underlying actor query is settled (not mid-refresh)
  //   4. the principal is NOT the anonymous principal (2vxsx-fae)
  //      — this is the key guard that prevents the race condition where the
  //        anonymous actor is still in use after identity transitions.
  const principalText = identity?.getPrincipal()?.toString() ?? "";
  const isRealPrincipal =
    principalText.length > 0 && principalText !== ANONYMOUS_PRINCIPAL;

  const isAuthenticated =
    !!identity && !isInitializing && !result.isFetching && isRealPrincipal;

  return {
    ...(result as { actor: Backend | null; isFetching: boolean }),
    isAuthenticated,
  };
}
