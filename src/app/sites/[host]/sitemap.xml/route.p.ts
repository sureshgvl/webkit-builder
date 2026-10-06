import { langPath } from "@/lib/render";
import { loadHostSite } from "@/platform/load";

export const revalidate = 300;

export async function GET(_: Request, { params }: { params: Promise<{ host: string }> }) {
  const r = await loadHostSite((await params).host);
  if (r.status !== "ok") return new Response("Not found", { status: 404 });
  const urls = r.site.langs
    .map((l) => `  <url><loc>https://${r.host}${langPath(r.site, l)}</loc><priority>${l === r.site.defaultLang ? "1.0" : "0.8"}</priority></url>`)
    .join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
