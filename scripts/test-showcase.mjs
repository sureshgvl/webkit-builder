// End-to-end check of the showcase panel on the built site (out/).
// Usage: CLIENT=demo-travel npm run build && node scripts/test-showcase.mjs [screenshotDir]
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve("out");
const shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (shots) mkdirSync(shots, { recursive: true });

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": types[path.extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const preinstalled = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const browser = await chromium.launch(existsSync(preinstalled) ? { executablePath: preinstalled } : {});

let failures = 0;
function check(ok, message) {
  console.log(`${ok ? "✔" : "✖"} ${message}`);
  if (!ok) failures++;
}

const active = (page, id) =>
  page.evaluate((i) => document.querySelector(`[data-sc-section="${i}"] > [data-active]`)?.getAttribute("data-sc-variant"), id);
const cssVar = (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase(), name);

for (const [device, viewport] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1366, height: 900 }]]) {
  console.log(`\n— ${device}`);
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/", { waitUntil: "load" });

  const sections = await page.$$eval("[data-sc-section]", (els) => els.map((e) => e.getAttribute("data-sc-section")));
  check(sections.length >= 10, `${sections.length} sections are switchable`);
  const oneActive = await page.$$eval("[data-sc-section]", (els) => els.every((e) => e.querySelectorAll(":scope > [data-active]").length === 1));
  check(oneActive, "exactly one layout is visible per section");
  const dupIds = await page.$$eval("[id]", (els) => {
    const seen = new Set();
    return els.map((e) => e.id).filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  });
  check(dupIds.length === 0, `no duplicate ids${dupIds.length ? `: ${[...new Set(dupIds)].join(", ")}` : ""}`);

  await page.getByRole("button", { name: /Customize|डिझाइन बदला/ }).click();
  const dialog = page.getByRole("dialog");
  check(await dialog.isVisible(), "panel opens");

  // A ready look switches style + layouts. Looks are the first buttons in the panel's grid.
  const looks = dialog.locator("section").first().getByRole("button");
  await looks.nth(1).click(); // second look (e.g. Boutique: elegant + split hero + list packages)
  check((await cssVar(page, "--c-primary")) === "#7a4e3b", "look applies its style colours");
  check((await active(page, "hero")) === "split", "look switches the hero layout");
  check((await active(page, "packages")) === "list", "look switches the packages layout");
  check(page.url().includes("style=elegant") && page.url().includes("hero=split"), "design is saved in the URL");
  if (shots) {
    await page.waitForTimeout(400); // let button colour transitions finish
    await page.screenshot({ path: path.join(shots, `showcase-${device}-panel.png`) });
  }

  // Single layout switch.
  await dialog.locator("button[aria-pressed]").filter({ hasText: /Mosaic|मोझेक/ }).click();
  check((await active(page, "gallery")) === "masonry", "single section layout switch works");

  // Brand colour.
  await dialog.locator('input[type="color"]').fill("#1d4ed8");
  check((await cssVar(page, "--c-primary")) === "#1d4ed8", "brand colour picker changes the primary colour");
  check((await cssVar(page, "--c-primary-fg")) === "#ffffff", "text on the brand colour stays readable");

  // Language link keeps the design.
  const langHref = await page.locator("a[data-lang-link]").first().getAttribute("href");
  check(langHref.includes("style=elegant"), "language switch keeps the design");

  // Shared link reproduces the design after reload.
  const shared = page.url();
  await page.goto(shared, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector('[data-sc-section="hero"] > [data-active]')?.getAttribute("data-sc-variant") === "split");
  check((await active(page, "packages")) === "list", "shared link restores the layouts");
  check((await cssVar(page, "--c-primary")) === "#1d4ed8", "shared link restores the brand colour");

  // Sticky menu still sticks inside the showcase wrappers.
  await page.evaluate(() => window.scrollTo(0, 2500));
  await page.waitForTimeout(200);
  const navTop = await page.evaluate(() => {
    const h = [...document.querySelectorAll("header")].find((el) => el.offsetParent !== null);
    return h ? Math.round(h.getBoundingClientRect().top) : null;
  });
  check(navTop === 0, "menu bar stays at the top while scrolling");

  // Reset.
  await page.getByRole("button", { name: /Customize|डिझाइन बदला/ }).click();
  await page.getByRole("button", { name: /Reset everything|सगळे पूर्वीसारखे करा/ }).click();
  check((await active(page, "hero")) === "image" && !page.url().includes("?"), "reset restores the original design");

  check(errors.length === 0, `no JavaScript errors${errors.length ? `: ${errors.join("; ")}` : ""}`);
  if (shots && device === "phone") {
    await page.getByRole("dialog").getByRole("button", { name: /Close|बंद करा/ }).last().click();
    await page.goto(base + "/?style=modern&hero=centered", { waitUntil: "load" });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shots, "showcase-phone-modern.png") });
  }
  await page.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll showcase checks passed");
process.exit(failures ? 1 : 0);
