/**
 * Canister ID detection with multiple fallback strategies.
 * Priority order:
 *   1. VITE_BACKEND_CANISTER_ID (injected at build time)
 *   2. VITE_CANISTER_ID_BACKEND (injected at build time)
 *   3. window.ic injected by the IC gateway
 *   4. /env.json deployed to dist/ at build time (runtime fallback)
 */

/** Returns true if the value is a real canister ID, not empty or "undefined". */
function isValidId(value: string | undefined): value is string {
  return !!value && value.length > 0 && value !== "undefined";
}

export async function detectCanisterId(): Promise<string> {
  // 1. Vite env vars (injected at build time via vite.config.js define)
  const viteBackend = import.meta.env.VITE_BACKEND_CANISTER_ID as string | undefined;
  if (isValidId(viteBackend)) return viteBackend;

  const viteCanister = import.meta.env.VITE_CANISTER_ID_BACKEND as string | undefined;
  if (isValidId(viteCanister)) return viteCanister;

  // 2. window.ic injected by the IC boundary node / agent
  try {
    const win = window as unknown as Record<string, unknown>;
    const ic = win["ic"] as Record<string, unknown> | undefined;
    if (ic) {
      const canister = ic["BACKEND_CANISTER_ID"] as string | undefined;
      if (isValidId(canister)) return canister;
      const canisters = ic["canisters"] as Record<string, unknown> | undefined;
      if (canisters) {
        const backend = canisters["backend"] as { canister_id?: string } | undefined;
        if (isValidId(backend?.canister_id)) return backend!.canister_id!;
      }
    }
  } catch {
    // ignore
  }

  // 3. /env.json runtime fallback — deployed to dist/ by the build pipeline
  try {
    const resp = await fetch("/env.json");
    if (resp.ok) {
      const json = await resp.json() as Record<string, string>;
      const fromEnvJson = json["backend_canister_id"];
      if (isValidId(fromEnvJson)) return fromEnvJson;
    }
  } catch {
    // env.json not present or not parseable — not fatal
  }

  // No canister ID found anywhere
  console.error(
    "[OnlySigned] Could not detect backend canister ID from env vars, window.ic, or /env.json. " +
    "Set VITE_BACKEND_CANISTER_ID at build time. Actor calls will fail until this is resolved."
  );
  return "";
}

/**
 * Synchronous best-effort canister ID, resolved from build-time env vars only.
 * Used by parts of the app that can't await (e.g. top-level module initializers).
 * Falls back to empty string; async loadConfig() should be preferred.
 */
function detectCanisterIdSync(): string {
  const viteBackend = import.meta.env.VITE_BACKEND_CANISTER_ID as string | undefined;
  if (isValidId(viteBackend)) return viteBackend;

  const viteCanister = import.meta.env.VITE_CANISTER_ID_BACKEND as string | undefined;
  if (isValidId(viteCanister)) return viteCanister;

  try {
    const win = window as unknown as Record<string, unknown>;
    const ic = win["ic"] as Record<string, unknown> | undefined;
    if (ic) {
      const canister = ic["BACKEND_CANISTER_ID"] as string | undefined;
      if (isValidId(canister)) return canister;
      const canisters = ic["canisters"] as Record<string, unknown> | undefined;
      if (canisters) {
        const backend = canisters["backend"] as { canister_id?: string } | undefined;
        if (isValidId(backend?.canister_id)) return backend!.canister_id!;
      }
    }
  } catch {
    // ignore
  }

  return "";
}

export const CANISTER_ID = detectCanisterIdSync();

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
 * Uses the full async detectCanisterId() which includes the /env.json fallback.
 */
export async function loadConfig(): Promise<AppConfig> {
  const canisterId = await detectCanisterId();
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
