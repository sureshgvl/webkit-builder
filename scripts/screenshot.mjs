// Screenshots of the built site (out/) on phone and desktop.
// Usage: npm run build && node scripts/screenshot.mjs [outDir]
import { createServer } from "node:http";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve("out");
const shots = path.resolve(process.argv[2] ?? "screenshots");
mkdirSync(shots, { recursive: true });

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json", ".txt": "text/plain", ".xml": "application/xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const server = createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": types[path.extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
}).listen(0);
const base = `http://localhost:${server.address().port}`;

// Use a pre-installed Chromium when present (e.g. cloud sandboxes), else Playwright's own.
const preinstalled = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const browser = await chromium.launch(existsSync(preinstalled) ? { executablePath: preinstalled } : {});
const errors = [];
for (const [name, viewport] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1366, height: 900 }]]) {
  const routes = readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(root, d.name, "index.html")) && /^[a-z]{2}$/.test(d.name))
    .map((d) => `/${d.name}/`);
  for (const route of ["/", ...routes]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(`${route} ${name}: ${e.message}`));
    // Only report errors from the site itself; third-party loads (fonts, maps) may be blocked offline.
    page.on("console", (m) => {
      const from = m.location()?.url ?? "";
      if (m.type() === "error" && (!from || from.startsWith(base))) errors.push(`${route} ${name}: ${m.text()} ${from}`);
    });
    await page.goto(base + route, { waitUntil: "load" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) errors.push(`${route} ${name}: page scrolls sideways by ${overflow}px`);
    const file = `${route === "/" ? "default" : route.replaceAll("/", "")}-${name}.png`;
    await page.screenshot({ path: path.join(shots, file), fullPage: true });
    console.log(`📸 ${file}`);
    await page.close();
  }
}
await browser.close();
server.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
