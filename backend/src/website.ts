import { createHmac, timingSafeEqual } from "node:crypto";

/** Tells the website (Vercel) to drop its cached copy of these addresses. Failures are logged, never fatal. */
export async function refreshHosts(websiteUrl: string | undefined, secret: string | undefined, hosts: string[]): Promise<boolean> {
  if (!websiteUrl || !secret || !hosts.length) return false;
  try {
    const res = await fetch(`${websiteUrl.replace(/\/$/, "")}/api/revalidate/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ hosts }),
    });
    if (!res.ok) console.error(`Cache refresh failed (${res.status}) for ${hosts.join(", ")}`);
    return res.ok;
  } catch (e) {
    console.error(`Cache refresh failed for ${hosts.join(", ")}:`, (e as Error).message);
    return false;
  }
}

/** Short-lived signed link to preview a draft: "<slug>.<expiry>.<signature>". */
export function previewToken(secret: string, slug: string, ttlSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${slug}.${exp}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

export function readPreviewToken(secret: string, token: string): string | null {
  const m = /^([a-z0-9-]+)\.(\d+)\.([A-Za-z0-9_-]+)$/.exec(token);
  if (!m) return null;
  const [, slug, exp, sig] = m;
  const want = createHmac("sha256", secret).update(`${slug}.${exp}`).digest();
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return slug;
}
