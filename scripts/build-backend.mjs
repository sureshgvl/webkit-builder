// Bundles the Render backend (backend/src/server.ts + the admin page) into backend/dist/server.js.
//   npm run build:backend   →   node backend/dist/server.js
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const adminHtml = readFileSync(new URL("../backend/admin/index.html", import.meta.url), "utf8");

await build({
  entryPoints: ["backend/src/server.ts"],
  outfile: "backend/dist/server.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  jsx: "automatic",
  alias: { "@": "./src" },
  // sharp ships native binaries; pg-native is optional and unused.
  external: ["sharp", "pg-native"],
  define: { __ADMIN_HTML__: JSON.stringify(adminHtml), "process.env.NODE_ENV": '"production"' },
  sourcemap: true,
  logLevel: "info",
});
