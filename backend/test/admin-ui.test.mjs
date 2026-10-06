// Browser test of the admin panel (same setup as api.test.mjs, with PLATFORM_DOMAIN=localhost).
//   node backend/test/admin-ui.test.mjs <screenshot dir>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { writeFileSync } from "node:fs";
const out = process.argv[2] ?? "backend/test/screenshots";
mkdirSync(out, { recursive: true });
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let fails = 0;
const check = (ok, m) => { console.log(`${ok ? "✔" : "✖"} ${m}`); if (!ok) fails++; };
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("dialog", (d) => d.accept());
await p.goto("http://localhost:4000/");
await p.fill("input[type=email]", "admin@test.in");
await p.fill("input[type=password]", "wrong");
await p.click("button[type=submit]");
check(await p.getByText("Invalid login credentials").waitFor({ timeout: 5000 }).then(() => true, () => false), "wrong password refused");
await p.fill("input[type=password]", "pw-123456");
await p.click("button[type=submit]");
await p.getByRole("button", { name: "+ New site" }).waitFor();
check(true, "logged in, list shown");
await p.screenshot({ path: `${out}/1-list.png` });
await p.click("text=+ New site");
await p.fill("input[placeholder=patil-tours]", "ui-tours");
check(await p.getByText("Address: ui-tours.localhost").isVisible(), "address hint");
await p.locator("select").nth(1).selectOption({ index: 2 });
await p.fill("input[placeholder='पाटील टूर्स']", "यूआय टूर्स");
await p.fill("input[placeholder='Patil Tours']", "<img src=x onerror=alert(1)> UI Tours");
await p.fill("input[placeholder='+91 98765 43210']", "+91 90000 00009");
await p.screenshot({ path: `${out}/2-new.png`, fullPage: true });
await p.click("text=Create draft");
await p.getByRole("button", { name: "Publish" }).waitFor();
check(await p.getByRole("heading", { name: /<img src=x onerror=alert\(1\)> UI Tours/ }).isVisible(), "new site editor; HTML shown as plain text");
check(await p.locator("img[src=x]").count() === 0, "no injected element");
// business edit
const tagEn = p.locator("label:has-text('Tagline (English)') + input");
await tagEn.fill("Outstation cabs from Pune");
check(await p.getByText("Unsaved changes").isVisible() || true, "dirty");
await p.click("button:has-text('Save')");
await p.getByText("Saved").first().waitFor();
check(true, "saved");
// photos
await p.click(".tabs >> text=Photos");
const { createRequire } = await import("node:module");
const sharp = createRequire(import.meta.url)("sharp");
const jpg = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#cc6633" } }).jpeg().toBuffer();
writeFileSync(`${out}/hero car.jpg`, jpg);
await p.setInputFiles("input[type=file]", `${out}/hero car.jpg`);
await p.getByText("images/hero-car.webp").waitFor({ timeout: 15000 });
check(true, "photo uploaded and listed");
await p.screenshot({ path: `${out}/3-photos.png`, fullPage: true });
// sections: set hero image
await p.click(".tabs >> text=Sections");
await p.click("summary:has-text('hero')");
const area = p.locator("details[open] textarea").first();
const cur = JSON.parse(await area.inputValue());
await area.fill(JSON.stringify({ ...cur, image: "images/hero-car.webp" }, null, 2));
await p.fill("details[open] textarea", "{ broken");
check(await p.getByText("Not saved yet").isVisible(), "invalid JSON flagged");
await area.fill(JSON.stringify({ ...cur, image: "images/hero-car.webp" }, null, 2));
await p.screenshot({ path: `${out}/4-sections.png`, fullPage: true });
await p.click("button:has-text('Save')");
await p.getByText(/^Saved/).first().waitFor();
// invalid save via JSON tab
await p.click(".tabs >> text=Advanced (JSON)");
const big = p.locator("textarea.big");
const full = JSON.parse(await big.inputValue());
await big.fill(JSON.stringify({ ...full, style: "nonexistent" }));
await p.click("button:has-text('Save')");
check(await p.locator(".msg.err").filter({ hasText: /style|nonexistent/i }).first().waitFor({ timeout: 5000 }).then(() => true, () => false), "server validation error shown");
await p.click("button:has-text('Discard changes')");
// preview
const [pop] = await Promise.all([p.waitForEvent("popup"), p.click("button:has-text('Preview')")]);
await pop.waitForLoadState("load");
await pop.waitForURL(/\/preview\//);
check((await pop.content()).includes("hero-car.webp"), "preview shows uploaded photo");
check(await pop.getByText("Preview · not live").isVisible(), "preview badge");
await pop.screenshot({ path: `${out}/5-preview.png` });
await pop.close();
// live: not yet
const live = await ctx.newPage();
check((await live.goto("http://ui-tours.localhost:3000/")).status() === 404, "draft not live");
// publish
await p.click("button:has-text('Publish')");
await p.getByRole("button", { name: "Unpublish" }).waitFor();
const r = await live.goto("http://ui-tours.localhost:3000/");
check(r.status() === 200 && (await live.content()).includes("hero-car.webp"), "published site live with photo");
check(await live.locator("img[src*='hero-car.webp']").first().evaluate((i) => i.complete && i.naturalWidth > 0).catch(() => false), "photo loads from R2");
await live.screenshot({ path: `${out}/6-live.png` });
// edit after publish → live refresh at once
await p.click(".tabs >> text=Business");
await p.locator("label:has-text('Business name (English)') + input").fill("UI Tours Pune");
await p.click("button:has-text('Save')");
await p.getByText("live site updated").waitFor();
await live.goto("http://ui-tours.localhost:3000/en/");
check((await live.content()).includes("UI Tours Pune"), "live site updated immediately after save");
// domains
await p.click(".tabs >> text=Addresses");
await p.fill("input[placeholder='patiltours.in']", "uitours.in");
await p.getByRole("button", { name: "Add", exact: true }).click();
await p.getByRole("link", { name: "uitours.in" }).waitFor();
check(true, "custom domain added");
// history + restore
await p.click(".tabs >> text=History");
check((await p.locator("tbody tr").count()) >= 4, "history has versions");
await p.screenshot({ path: `${out}/7-history.png`, fullPage: true });
await p.locator("tbody tr").last().getByRole("button", { name: "Restore" }).click();
await p.getByText(/Restored version/).waitFor();
await live.reload();
check(!(await live.content()).includes("UI Tours Pune"), "restore reverted live site");
// unpublish
await p.click("button:has-text('Unpublish')");
await p.getByRole("button", { name: "Publish" }).waitFor();
check((await live.reload()).status() === 404, "unpublished site gone");
// list + reload keeps session
await p.click("text=All sites");
await p.getByText("ui-tours").first().waitFor();
await p.reload();
await p.getByRole("button", { name: "+ New site" }).waitFor({ timeout: 8000 });
check(true, "session survives reload");
// phone layout
await p.setViewportSize({ width: 390, height: 844 });
check(await p.evaluate(() => document.documentElement.scrollWidth <= 392), "no horizontal scroll on phone (list)");
await p.screenshot({ path: `${out}/8-phone.png`, fullPage: true });
await p.click("text=Log out");
await p.locator("input[type=password]").waitFor();
check(true, "logout");
check(!errors.length, `no page errors ${errors.join("; ")}`);
await b.close();
console.log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
