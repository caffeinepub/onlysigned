/**
 * Type-safe blob-storage hooks.
 *
 * The platform scaffold files (FileStorage.ts / StorageClient.ts) import from
 * "../backend" via relative paths that bypass tsconfig path aliases when resolved
 * transitively, causing TypeScript 5.9 parse errors on the 'with' reserved
 * keyword in the auto-generated backend.ts.
 *
 * This module re-implements useFileUrl directly using backend-types.ts and
 * loadConfig — without importing the scaffold files at all.
 */

import { useQuery } from "@tanstack/react-query";
import { loadConfig } from "../config";
import { useActor } from "./useActor";

const GATEWAY_VERSION = "v1";

/**
 * Resolve a blob-storage file path to a direct gateway URL.
 * Mirrors the behaviour of StorageClient.getDirectURL().
 */
async function resolveFileUrl(
  actor: ReturnType<typeof useActor>["actor"],
  path: string,
): Promise<string> {
  if (!actor) throw new Error("Backend is not available");
  if (!path) throw new Error("Path must not be empty");

  const [fileReference, config] = await Promise.all([
    actor.getFileReference(path),
    loadConfig(),
  ]);

  // getFileReference returns FileReference | null
  if (!fileReference) {
    throw new Error(`File not found: ${path}`);
  }

  const { hash } = fileReference;

  // Guard against empty/malformed hash so we surface a useful error
  // instead of producing a broken gateway URL
  if (!hash || hash.trim() === "") {
    throw new Error(
      `File reference for "${path}" has no hash — the upload may have failed`,
    );
  }

  const { storage_gateway_url, backend_canister_id, project_id } = config;

  return (
    `${storage_gateway_url}/${GATEWAY_VERSION}/blob/` +
    `?blob_hash=${encodeURIComponent(hash)}` +
    `&owner_id=${encodeURIComponent(backend_canister_id)}` +
    `&project_id=${encodeURIComponent(project_id)}`
  );
}

/**
 * Resolve a blob-storage path to a direct gateway URL.
 * Drop-in replacement for `useFileUrl` from blob-storage/FileStorage.ts.
 *
 * Returns { data, isLoading, isError } where:
 *   - isLoading is true while either the actor is loading OR the URL is being resolved
 *   - data is the fully resolved blob-gateway URL, or undefined while loading
 *   - isError is true when the URL could not be resolved (file missing, network error, etc.)
 */
export function useFileUrl(path: string): {
  data: string | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<string>({
    queryKey: ["fileUrl", path],
    queryFn: () => resolveFileUrl(actor, path),
    // Don't run until both path is set AND actor is ready
    enabled: !!path && !!actor && !actorFetching,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  // While the actor is still loading, report as loading (not error)
  const isLoading =
    query.isLoading || actorFetching || (!actor && !query.isError);

  return {
    data: query.data,
    isLoading,
    isError: query.isError,
  };
}
