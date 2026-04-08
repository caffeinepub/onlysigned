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
import { useState } from "react";
import type { AppConfig } from "../config";
import { loadConfig } from "../config";
import { useActor } from "./useActor";

const GATEWAY_VERSION = "v1";

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

async function buildStorageClient(
  actor: ReturnType<typeof useActor>["actor"],
  config: AppConfig,
) {
  if (!actor) throw new Error("Backend is not available");

  const { StorageClient } = await import("../blob-storage/StorageClient");
  const { HttpAgent } = await import("@icp-sdk/core/agent");

  const agent = new HttpAgent({ host: config.backend_host });
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
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (
    path: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<{ path: string; hash: string; url: string }> => {
    setIsUploading(true);
    try {
      const config = await loadConfig();

      if (
        !config.backend_canister_id ||
        config.backend_canister_id === "undefined"
      ) {
        throw new Error(
          "Upload failed: backend canister ID could not be resolved. " +
            "Please refresh the page and try again. If the problem persists, contact support.",
        );
      }

      const client = await buildStorageClient(actor, config);
      return await client.putFile(path, file, onProgress);
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
}
