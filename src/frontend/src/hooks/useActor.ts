// Pre-wired useActor hook for the backend
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
// TypeScript resolves "backend" → "backend-types.ts" via tsconfig paths.
// Vite resolves "backend" → "backend.ts" (patched by fixBackendReservedKeywords plugin).
import { createActor } from "backend"; // eslint-disable-line import/no-unresolved
import type { Backend } from "../backend-types";

export function useActor(): { actor: Backend | null; isFetching: boolean } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = _useActor(createActor as any);
  return result as { actor: Backend | null; isFetching: boolean };
}
