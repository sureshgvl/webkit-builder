import { bundledAdminHtml, createBackend, loadEnv } from "./app";

// Render sets PORT. All settings come from environment variables (Render → Environment); none are in the code.
const env = loadEnv();
const { server, db } = createBackend(env, bundledAdminHtml());
const port = Number(process.env.PORT ?? 10000);
server.listen(port, () => console.log(`Averix backend listening on :${port}`));

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    server.close();
    void db.close().finally(() => process.exit(0));
  });
}
