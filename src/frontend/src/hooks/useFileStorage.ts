/**
 * Type-safe blob-storage hooks.
 *
 * ROOT CAUSE OF 403: Our local StorageClient.ts was calling
 * _caffeineStorageCreateCertificate but the Caffeine platform backend exposes
 * _immutableObjectStorageCreateCertificate. That has been fixed in StorageClient.ts.
 *
 * The authenticated agent is extracted from the actor via Actor.agentOf().
 * useActor() guarantees actor is non-null only when identity is real and
 * authenticated, so the agent inside is always authenticated.
 */

import { Actor, type Agent, type HttpAgent } from "@dfinity/agent";
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

  const config = await loadConfig();

  // path may be a hash directly (sha256:...) or a storage path
  // If it looks like a hash, use it directly; otherwise try to get file reference
  if (path.startsWith("sha256:")) {
    const { storage_gateway_url, backend_canister_id, project_id } = config;
    return (
      `${storage_gateway_url}/${GATEWAY_VERSION}/blob/` +
      `?blob_hash=${encodeURIComponent(path)}` +
      `&owner_id=${encodeURIComponent(backend_canister_id)}` +
      `&project_id=${encodeURIComponent(project_id)}`
    );
  }

  // Try the object-storage extension's getFileReference
  try {
    const fileReference = await actor.getFileReference(path);
    if (fileReference?.hash) {
      const { storage_gateway_url, backend_canister_id, project_id } = config;
      return (
        `${storage_gateway_url}/${GATEWAY_VERSION}/blob/` +
        `?blob_hash=${encodeURIComponent(fileReference.hash)}` +
        `&owner_id=${encodeURIComponent(backend_canister_id)}` +
        `&project_id=${encodeURIComponent(project_id)}`
      );
    }
  } catch {
    // getFileReference may not be available if extension is not configured
  }

  throw new Error(`Could not resolve URL for file: ${path}`);
}

/**
 * Resolve a blob-storage path to a direct gateway URL.
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
 * Extract the authenticated HttpAgent from the actor.
 *
 * Actor.agentOf(actor) returns the HttpAgent that was used to create the actor.
 * Since useActor() only exposes an actor when identityIsReal === true (three-layer
 * check), this agent is ALWAYS authenticated — it was built from the user's
 * real Internet Identity by createActorWithConfig.
 *
 * This is the ONLY reliable approach. Creating a new HttpAgent from the identity
 * directly risks using a different agent instance than the one the IC SDK uses for
 * certificate validation, potentially producing mismatched signatures.
 */
function extractAuthenticatedAgent(
  actor: NonNullable<ReturnType<typeof useActor>["actor"]>,
): Agent {
  const agent = Actor.agentOf(
    actor as unknown as Parameters<typeof Actor.agentOf>[0],
  );

  if (!agent) {
    throw new Error(
      "Could not extract authenticated agent from actor. " +
        "Please log out and log back in, then try again.",
    );
  }

  return agent;
}

/**
 * Build a StorageClient using the authenticated agent extracted from the actor.
 *
 * The StorageClient now calls _immutableObjectStorageCreateCertificate which is
 * what the Caffeine platform backend actually exposes — fixing the 403 Forbidden.
 */
async function buildStorageClient(
  actor: NonNullable<ReturnType<typeof useActor>["actor"]>,
  config: AppConfig,
) {
  const agent = extractAuthenticatedAgent(actor);

  // Belt-and-suspenders: validate the agent has a real (non-anonymous) identity
  try {
    const identity = (
      agent as unknown as {
        _identity?: {
          getPrincipal?: () => {
            toString: () => string;
            isAnonymous?: () => boolean;
          };
        };
      }
    )._identity;
    if (identity?.getPrincipal) {
      const principal = identity.getPrincipal();
      const text = principal.toString();
      if (ANONYMOUS_PRINCIPALS.has(text) || principal.isAnonymous?.()) {
        throw new Error(
          "Agent identity is anonymous. Please log out and log back in.",
        );
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("anonymous")) throw e;
    // Identity check API not available — useActor's three-layer guard already validated
  }

  const { StorageClient } = await import("../blob-storage/StorageClient");
  return new StorageClient(
    actor,
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent as HttpAgent,
  );
}

/**
 * Upload a file to blob storage.
 *
 * Returns { path, hash, url } where:
 *   - path: the storage path used (e.g. "assets/1234567890-file.mp3")
 *   - hash: the sha256 content hash (e.g. "sha256:abc...")
 *   - url: direct download URL
 *
 * The caller (UploadPage) is responsible for registering the file reference
 * in the backend via createAsset({ fileRefs: [{ fileId: path, ... }] }).
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

  // Always hold the latest actor — reads inside the async closure are live.
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
      // Step 1: resolve config
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

      // Step 2: re-read actor from ref for the freshest value
      const currentActor = actorRef.current;

      if (!currentActor) {
        throw new Error(
          "You must be logged in to upload assets. Please log in and try again.",
        );
      }

      // Step 3: build the storage client with the authenticated agent from the actor
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

      // Step 4: upload the file — StorageClient.putFile now calls
      // _immutableObjectStorageCreateCertificate (correct method) and returns
      // { path, hash, url } without any actor calls for registration.
      return await client.putFile(path, file, onProgress);
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
}
