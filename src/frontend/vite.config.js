import { fileURLToPath, URL } from "url";
import { readFileSync } from "fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";

const ii_url =
  process.env.DFX_NETWORK === "local"
    ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/`
    : `https://identity.internetcomputer.org/`;

process.env.II_URL = process.env.II_URL || ii_url;
process.env.STORAGE_GATEWAY_URL =
  process.env.STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";

/**
 * Vite plugin that fixes the auto-generated backend.ts/backend.d.ts which
 * uses 'with' as a TypeScript parameter name. 'with' is a reserved word that
 * causes esbuild to crash. We intercept via load() before esbuild processes it.
 */
function fixBackendReservedKeywords() {
  return {
    name: "fix-backend-reserved-keywords",
    enforce: "pre",
    load(id) {
      if (!id.endsWith("src/backend.ts") && !id.endsWith("src/backend.d.ts")) return null;
      const raw = readFileSync(id, "utf-8");
      const fixed = raw
        .replace(/\bgetMessages\(with:/g, "getMessages(_with:")
        .replace(/\brevokeAssetShare\(assetId: string, with:/g, "revokeAssetShare(assetId: string, _with:")
        .replace(/\bshareAssetWithContact\(assetId: string, with:/g, "shareAssetWithContact(assetId: string, _with:");
      return fixed;
    },
  };
}

// Inject the canister ID under both names that config.ts detectCanisterId()
// checks for. The Caffeine deployment pipeline sets CANISTER_ID_BACKEND in
// process.env; vite-plugin-environment already exposes it as
// import.meta.env.CANISTER_ID_BACKEND, but config.ts looks for the VITE_
// prefixed names, so we explicitly define both here.
//
// Guard against the literal string "undefined" that can appear when env.json
// is copied before environment variables are substituted.
const RAW_BACKEND_ID = process.env.CANISTER_ID_BACKEND || "";
const BACKEND_CANISTER_ID = RAW_BACKEND_ID === "undefined" ? "" : RAW_BACKEND_ID;

export default defineConfig({
  logLevel: "error",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  define: {
    "import.meta.env.VITE_BACKEND_CANISTER_ID": JSON.stringify(BACKEND_CANISTER_ID),
    "import.meta.env.VITE_CANISTER_ID_BACKEND": JSON.stringify(BACKEND_CANISTER_ID),
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    fixBackendReservedKeywords(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment(["II_URL"]),
    environment(["STORAGE_GATEWAY_URL"]),
    react(),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: /^backend$/,
        replacement: fileURLToPath(new URL("./src/backend.ts", import.meta.url)),
      },
    ],
    dedupe: ["@dfinity/agent"]
  },
});
