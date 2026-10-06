import { loadHostSite } from "@/platform/load";

export const revalidate = 300;

export async function GET(_: Request, { params }: { params: Promise<{ host: string }> }) {
  const r = await loadHostSite((await params).host);
  const body =
    r.status === "ok"
      ? `User-agent: *\nAllow: /\nSitemap: https://${r.host}/sitemap.xml\n`
      : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
