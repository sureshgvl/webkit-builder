import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const TYPES: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };

/** Local development only: serves clients/<slug>/<file> when Supabase/R2 are not configured. */
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.SUPABASE_URL) return new Response("Not found", { status: 404 });
  const parts = (await params).path;
  const root = path.join(process.cwd(), "clients");
  const file = path.join(root, ...parts);
  if (!file.startsWith(root + path.sep) || !existsSync(file) || !statSync(file).isFile() || !TYPES[path.extname(file)]) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(readFileSync(file), { headers: { "Content-Type": TYPES[path.extname(file)], "Cache-Control": "public, max-age=3600" } });
}
