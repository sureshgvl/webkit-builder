import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { hostTag, normalizeHost } from "@/platform/source";

/**
 * Called by the backend after a site is published or changed:
 *   POST /api/revalidate   Authorization: Bearer $REVALIDATE_SECRET   { "hosts": ["patil-tours.example.in"] }
 * The next visit to those addresses gets the new version.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const got = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  if (!secret || got.length !== Buffer.byteLength(secret) || !timingSafeEqual(got, Buffer.from(secret))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { hosts?: unknown };
  const hosts = Array.isArray(body.hosts) ? body.hosts.filter((h): h is string => typeof h === "string").map(normalizeHost).filter(Boolean) : [];
  if (!hosts.length || hosts.length > 50) return Response.json({ error: "send 1–50 hosts" }, { status: 400 });
  for (const host of hosts) {
    revalidateTag(hostTag(host), { expire: 0 });
    revalidatePath(`/sites/${host}`, "layout");
  }
  return Response.json({ revalidated: hosts });
}
