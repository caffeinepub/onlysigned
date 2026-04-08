/**
 * Canister ID detection with multiple fallback strategies.
 * Priority order: VITE_BACKEND_CANISTER_ID → VITE_CANISTER_ID_BACKEND → window.ic
 */

function detectCanisterId(): string {
  // 1. Vite env vars (set at build time)
  const viteBackend = import.meta.env.VITE_BACKEND_CANISTER_ID as string | undefined;
  if (viteBackend && viteBackend.length > 0) return viteBackend;

  const viteCanister = import.meta.env.VITE_CANISTER_ID_BACKEND as string | undefined;
  if (viteCanister && viteCanister.length > 0) return viteCanister;

  // 2. window.ic injected by the IC agent
  try {
    const win = window as unknown as Record<string, unknown>;
    const ic = win["ic"] as Record<string, unknown> | undefined;
    if (ic) {
      const canister = ic["BACKEND_CANISTER_ID"] as string | undefined;
      if (canister) return canister;
      const canisters = ic["canisters"] as Record<string, unknown> | undefined;
      if (canisters) {
        const backend = canisters["backend"] as { canister_id?: string } | undefined;
        if (backend?.canister_id) return backend.canister_id;
      }
    }
  } catch {
    // ignore
  }

  // Fallback empty string — actor creation will handle the error
  return "";
}

export const CANISTER_ID = detectCanisterId();

export const IS_LOCAL = import.meta.env.DEV === true;

export const IC_HOST = IS_LOCAL ? "http://localhost:4943" : "https://ic0.app";

export interface AppConfig {
  backend_host: string;
  backend_canister_id: string;
  bucket_name: string;
  storage_gateway_url: string;
  project_id: string;
}

/**
 * Async config loader used by the blob-storage scaffold (FileStorage.ts).
 * Caffeine injects this at deploy time; here we provide a runtime fallback
 * that reads the same env vars used by the rest of the app.
 */
export async function loadConfig(): Promise<AppConfig> {
  const canisterId = detectCanisterId();
  const isLocal = import.meta.env.DEV === true;
  const host = isLocal ? "http://localhost:4943" : "https://ic0.app";

  const bucketName =
    (import.meta.env.CANISTER_STORAGE_BUCKET_NAME as string | undefined) ?? "assets";
  const storageGatewayUrl =
    (import.meta.env.STORAGE_GATEWAY_URL as string | undefined) ??
    "https://blob.caffeine.ai";
  const projectId =
    (import.meta.env.CANISTER_PROJECT_ID as string | undefined) ?? "";

  return {
    backend_host: host,
    backend_canister_id: canisterId,
    bucket_name: bucketName,
    storage_gateway_url: storageGatewayUrl,
    project_id: projectId,
  };
}
