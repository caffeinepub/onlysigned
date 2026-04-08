import { Actor, type Agent, HttpAgent } from "@icp-sdk/core/agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FileReference } from "../backend-types";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { StorageClient } from "./StorageClient";

/**
 * Extracts the authenticated HttpAgent from the backend actor if available,
 * otherwise falls back to creating a new anonymous agent.
 * Using the actor's agent ensures the certificate call in StorageClient uses
 * the user's identity and avoids 503 auth failures on blob.caffeine.ai.
 */
const getAgentForActor = async (actor: unknown): Promise<Agent> => {
  if (actor) {
    const extracted = Actor.agentOf(
      actor as Parameters<typeof Actor.agentOf>[0],
    );
    if (extracted) return extracted;
  }
  // Fallback: create a plain agent (for anonymous / unauthenticated cases)
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running",
      );
      console.error(err);
    });
  }
  return agent;
};

// Hook to fetch the list of files
export const useFileList = () => {
  const { actor } = useActor();

  return useQuery({
    queryKey: ["fileList"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not available");
      return await actor.listFileReferences();
    },
    enabled: !!actor,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Unified hook for getting file URLs
export const useFileUrl = (path: string) => {
  const { actor } = useActor();

  const getFileReference = async (path: string) => {
    if (!actor) throw new Error("Backend is not available");
    const envConfig = await loadConfig();
    const storageClient = new StorageClient(
      actor,
      envConfig.bucket_name,
      envConfig.storage_gateway_url,
      envConfig.backend_canister_id,
      envConfig.project_id,
      await getAgentForActor(actor),
    );
    const url = await storageClient.getDirectURL(path);
    return url;
  };

  return useQuery({
    queryKey: ["fileUrl", path],
    queryFn: () => getFileReference(path!),
    enabled: !!path,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useFileUpload = () => {
  const { actor } = useActor();
  const [isUploading, setIsUploading] = useState(false);
  const { invalidateFileList } = useInvalidateQueries();

  const uploadFile = async (
    path: string,
    data: File,
    onProgress?: (percentage: number) => void,
  ): Promise<{
    path: string;
    hash: string;
    url: string;
  }> => {
    if (!actor) {
      throw new Error("Backend is not available");
    }

    const envConfig = await loadConfig();
    const storageClient = new StorageClient(
      actor,
      envConfig.bucket_name,
      envConfig.storage_gateway_url,
      envConfig.backend_canister_id,
      envConfig.project_id,
      await getAgentForActor(actor),
    );

    setIsUploading(true);

    try {
      const res = await storageClient.putFile(path, data, onProgress);
      await invalidateFileList();
      return res;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};

export const useFileDelete = () => {
  const { actor } = useActor();
  const [isDeleting, setIsDeleting] = useState(false);
  const { invalidateFileList, invalidateFileUrl } = useInvalidateQueries();

  const deleteFile = async (path: string): Promise<void> => {
    if (!actor) {
      throw new Error("Backend is not available");
    }

    setIsDeleting(true);

    try {
      await actor.dropFileReference(path);
      await invalidateFileList();
      invalidateFileUrl(path);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteFile, isDeleting };
};

// Utility to invalidate queries
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateFileList: () =>
      queryClient.invalidateQueries({ queryKey: ["fileList"] }),
    invalidateFileUrl: (path: string) =>
      queryClient.invalidateQueries({ queryKey: ["fileUrl", path] }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["fileList"] });
      queryClient.invalidateQueries({ queryKey: ["fileUrl"] });
    },
  };
};
