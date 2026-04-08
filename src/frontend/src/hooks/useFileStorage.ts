/**
 * Type-safe blob-storage hooks.
 *
 * The platform scaffold files (FileStorage.ts / StorageClient.ts) previously
 * imported from "../backend" (relative), which caused TypeScript 5.9 to parse
 * backend.ts and fail on the `with` reserved keyword (TS1390).
 *
 * That relative import has been patched in both scaffold files to use
 * "../backend-types" instead. This module re-implements useFileUrl without
 * touching the scaffold at all, and provides a useFileUpload hook that
 * delegates to the scaffold.
 */

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { AppConfig } from "../config";
import { loadConfig } from "../config";
import { useActor } from "./useActor";

const GATEWAY_VERSION = "v1";

/** Known anonymous / invalid principal strings — keep in sync with useActor.ts */
const ANONYMOUS_PRINCIPALS = new Set(["2vxsx-fae", "aaaaa-aa"]);

// ─── URL resolution ───────────────────────────────────────────────────────────

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

  if (!fileReference) throw new Error(`File not found: ${path}`);

  const { hash } = fileReference;
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
    enabled: !!path && !!actor && !actorFetching,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const isLoading =
    query.isLoading || actorFetching || (!actor && !query.isError);

  return { data: query.data, isLoading, isError: query.isError };
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Build a StorageClient using the actor's own authenticated agent.
 *
 * IMPORTANT: `actor` is captured from the ref at call-time (not render-time),
 * so it always reflects the freshest value. We re-validate it here so the raw
 * "Cannot read properties of undefined (reading 'config')" JS error can never
 * bubble up from StorageClient.
 */
async function buildStorageClient(
  actor: ReturnType<typeof useActor>["actor"],
  config: AppConfig,
) {
  // Hard guard: actor must be non-null at the moment we build the client.
  if (!actor) {
    throw new Error(
      "Please log in before uploading. Your session may have expired — refresh and try again.",
    );
  }

  const { StorageClient } = await import("../blob-storage/StorageClient");
  const { Actor, HttpAgent } = await import("@icp-sdk/core/agent");

  // Extract the authenticated agent from the actor so the StorageClient's
  // certificate call (_caffeineStorageCreateCertificate) is signed with the
  // user's identity. Using a new anonymous HttpAgent here causes a 403 on
  // blob.caffeine.ai because the certificate cannot be validated.
  let extractedAgent: ReturnType<typeof Actor.agentOf> | undefined;
  try {
    extractedAgent = Actor.agentOf(
      actor as unknown as Parameters<typeof Actor.agentOf>[0],
    );
  } catch {
    extractedAgent = undefined;
  }

  // StorageClient expects HttpAgent from @dfinity/agent; both HttpAgent
  // implementations share the same wire protocol so casting via unknown is safe.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type DfinityHttpAgent = ConstructorParameters<typeof StorageClient>[5];
  let agent: DfinityHttpAgent;

  if (extractedAgent) {
    agent = extractedAgent as unknown as DfinityHttpAgent;
  } else {
    // Fallback: create a plain agent. This path should not normally be reached
    // for authenticated uploads — if it is, the 403 guard in StorageClient
    // will reject the request with a clear error.
    const fallback = new HttpAgent({ host: config.backend_host });
    if (config.backend_host?.includes("localhost")) {
      await fallback.fetchRootKey().catch(() => {});
    }
    agent = fallback as unknown as DfinityHttpAgent;
  }

  // Final null/undefined guard on agent before handing it to StorageClient,
  // so the raw "Cannot read properties of undefined (reading 'config')" error
  // can never surface from the constructor or getCertificate().
  if (!agent) {
    throw new Error(
      "Could not obtain an authenticated agent. Please log in and try again.",
    );
  }

  return new StorageClient(
    actor,
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );
}

/**
 * Upload a file to blob storage.
 * Drop-in replacement for `useFileUpload` from blob-storage/FileStorage.ts.
 *
 * Uses a ref to track the latest actor value so that the async uploadFile
 * closure always reads the freshest actor at the moment of the call, not the
 * stale value captured at render time.
 */
export function useFileUpload(): {
  uploadFile: (
    path: string,
    file: File,
    onProgress?: (pct: number) => void,
  ) => Promise<{ path: string; hash: string; url: string }>;
  isUploading: boolean;
} {
  const { actor } = useActor();
  // Always holds the latest actor — reads inside the async closure are live.
  const actorRef = useRef(actor);
  actorRef.current = actor;

  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (
    path: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<{ path: string; hash: string; url: string }> => {
    setIsUploading(true);
    try {
      // Step 1: resolve config (async — may take a moment for /env.json fallback)
      const config = await loadConfig();

      if (
        !config.backend_canister_id ||
        config.backend_canister_id === "undefined"
      ) {
        throw new Error(
          "Upload failed: backend canister ID could not be resolved. " +
            "Please refresh the page and try again.",
        );
      }

      // Step 2: re-read actor from ref AFTER config resolves so we have the
      // freshest value, not the one captured at render/closure creation time.
      const currentActor = actorRef.current;

      // Step 3: validate the actor is real and authenticated
      if (!currentActor) {
        throw new Error(
          "You must be logged in to upload assets. Please log in and try again.",
        );
      }

      // Extra belt-and-suspenders: check the principal inside the actor
      // to catch any edge-case anonymous identity transitions.
      try {
        const { Actor: _Actor } = await import("@icp-sdk/core/agent");
        const agentCheck = _Actor.agentOf(
          currentActor as unknown as Parameters<typeof _Actor.agentOf>[0],
        );
        if (agentCheck) {
          const agentWithPrincipal = agentCheck as unknown as {
            getPrincipal?: () => { toString(): string };
          };
          const p = agentWithPrincipal.getPrincipal?.();
          if (p) {
            const pText = typeof p.toString === "function" ? p.toString() : "";
            if (pText && ANONYMOUS_PRINCIPALS.has(pText)) {
              throw new Error(
                "Your session shows an anonymous identity. Please log out, log back in, and try again.",
              );
            }
          }
        }
      } catch (principalCheckErr) {
        // Only re-throw if this is our explicit anonymous-principal error
        if (
          principalCheckErr instanceof Error &&
          principalCheckErr.message.includes("anonymous identity")
        ) {
          throw principalCheckErr;
        }
        // Otherwise it's a harmless SDK introspection error — continue
      }

      // Step 4: build the storage client and upload
      let client: Awaited<ReturnType<typeof buildStorageClient>>;
      try {
        client = await buildStorageClient(currentActor, config);
      } catch (buildErr) {
        const msg =
          buildErr instanceof Error
            ? buildErr.message
            : "Failed to initialise file storage client.";
        throw new Error(msg);
      }

      return await client.putFile(path, file, onProgress);
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
}
