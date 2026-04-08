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

export default defineConfig({
  logLevel: "error",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
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
