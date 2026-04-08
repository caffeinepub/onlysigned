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

import type { Identity } from "@icp-sdk/core/agent";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { AppConfig } from "../config";
import { loadConfig } from "../config";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

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
 * Build a StorageClient using an HttpAgent constructed directly from the
 * authenticated Identity — NOT via Actor.agentOf() which silently falls back
 * to anonymous.
 *
 * Using the identity directly is the only reliable way to ensure the
 * StorageClient's _caffeineStorageCreateCertificate call is signed by the
 * real user, which blob.caffeine.ai requires to return a valid certificate.
 * An anonymous agent always produces a 403 Forbidden.
 */
async function buildStorageClient(
  actor: ReturnType<typeof useActor>["actor"],
  config: AppConfig,
  identity: Identity,
) {
  // Hard guard: actor must be non-null at the moment we build the client.
  if (!actor) {
    throw new Error(
      "Please log in before uploading. Your session may have expired — refresh and try again.",
    );
  }

  // Validate the identity is real and not anonymous before creating the agent.
  const principalText = (() => {
    try {
      return identity.getPrincipal().toString();
    } catch {
      return "";
    }
  })();
  if (!principalText || ANONYMOUS_PRINCIPALS.has(principalText)) {
    throw new Error(
      "Your session is anonymous. Please log out, log back in, and try again.",
    );
  }

  const { StorageClient } = await import("../blob-storage/StorageClient");
  const { HttpAgent } = await import("@icp-sdk/core/agent");

  // Create an authenticated HttpAgent using the real Identity directly.
  // This is the ONLY reliable approach — Actor.agentOf() silently returns
  // undefined in many SDK configurations, causing a fallback to anonymous.
  const agent = await HttpAgent.create({
    identity,
    host: config.backend_host,
  });

  // Fetch root key only on local dev networks
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
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
 * Uses a ref to track the latest actor and identity values so that the async
 * uploadFile closure always reads the freshest values at the moment of the
 * call, not the stale values captured at render time.
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
  const { identity } = useInternetIdentity();

  // Always hold the latest actor and identity — reads inside the async closure are live.
  const actorRef = useRef(actor);
  actorRef.current = actor;
  const identityRef = useRef(identity);
  identityRef.current = identity;

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

      // Step 2: re-read actor and identity from refs AFTER config resolves so
      // we have the freshest values, not the ones captured at render/closure time.
      const currentActor = actorRef.current;
      const currentIdentity = identityRef.current;

      // Step 3: validate the actor is real and authenticated
      if (!currentActor) {
        throw new Error(
          "You must be logged in to upload assets. Please log in and try again.",
        );
      }

      // Step 4: validate the identity is available and not anonymous
      if (!currentIdentity) {
        throw new Error(
          "Your session identity is not available. Please log in and try again.",
        );
      }
      const principalText = (() => {
        try {
          return currentIdentity.getPrincipal().toString();
        } catch {
          return "";
        }
      })();
      if (!principalText || ANONYMOUS_PRINCIPALS.has(principalText)) {
        throw new Error(
          "Your session shows an anonymous identity. Please log out, log back in, and try again.",
        );
      }

      // Step 5: build the storage client with the authenticated identity and upload
      let client: Awaited<ReturnType<typeof buildStorageClient>>;
      try {
        client = await buildStorageClient(
          currentActor,
          config,
          currentIdentity,
        );
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
