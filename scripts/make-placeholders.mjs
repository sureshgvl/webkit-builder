// Generates simple illustrated SVG scenes used as preset sample images.
// Real client sites replace these with their own photos.
// Run: node scripts/make-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1200;
const H = 900;

const sky = (top, bottom) => `
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>`;

const sun = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;

const ridge = (points, c) => `<path d="M0 ${H} ${points} L${W} ${H} Z" fill="${c}"/>`;

const scenes = {
  mountains: () =>
    sky("#7CC4E8", "#E9F6FB") +
    sun(920, 200, 70, "#FFE29A") +
    ridge("L0 520 L220 300 L420 520 L600 260 L820 500 L1000 330 L1200 480", "#5C7F67") +
    ridge("L0 640 L260 470 L520 640 L760 480 L1000 620 L1200 540", "#3F6B4E") +
    ridge("L0 760 L300 660 L640 760 L900 680 L1200 760", "#2F5540"),
  snow: () =>
    sky("#9CC9F0", "#F2F8FD") +
    ridge("L0 560 L260 230 L520 560 L760 180 L1040 540 L1200 420", "#E9EEF5") +
    `<path d="M260 230 L320 310 L290 300 L260 340 L230 300 L200 310 Z M760 180 L830 270 L790 260 L760 300 L725 262 L690 270 Z" fill="#fff"/>` +
    ridge("L0 680 L300 560 L620 690 L900 580 L1200 680", "#6C8EA8") +
    ridge("L0 800 L400 720 L800 800 L1200 730", "#3D5F78"),
  beach: () =>
    sky("#4FB3D9", "#CFEFFA") +
    sun(260, 220, 80, "#FFF1B8") +
    `<rect y="460" width="${W}" height="200" fill="#1E88B6"/>` +
    `<path d="M0 520 Q300 500 600 520 T1200 520" stroke="#BDE8F7" stroke-width="6" fill="none" opacity=".7"/>` +
    ridge("L0 660 Q400 600 800 650 T1200 630", "#F3D9A4") +
    `<path d="M960 820 Q940 640 1000 520" stroke="#6B4A2B" stroke-width="18" fill="none"/>` +
    `<path d="M1000 520 q-120 -20 -170 40 M1000 520 q110 -40 170 20 M1000 520 q-40 -90 -130 -90 M1000 520 q60 -100 150 -70" stroke="#2E7D4F" stroke-width="22" fill="none" stroke-linecap="round"/>`,
  sunset: () =>
    sky("#F7845E", "#FFD39A") +
    sun(600, 470, 120, "#FFF0C2") +
    `<rect y="470" width="${W}" height="200" fill="#C4576B"/>` +
    `<path d="M480 520 h240 M520 560 h160 M560 600 h80" stroke="#FFD39A" stroke-width="8" stroke-linecap="round"/>` +
    ridge("L0 680 Q600 620 1200 690", "#E9B87A"),
  backwaters: () =>
    sky("#8FD3C8", "#EAF8F4") +
    `<rect y="520" width="${W}" height="${H - 520}" fill="#2E8C7E"/>` +
    ridge("L0 520 Q300 470 600 515 T1200 505 L1200 540 L0 540", "#2E6B3C") +
    `<path d="M380 640 Q600 700 820 640 L780 610 Q600 650 420 610 Z" fill="#6B3F1F"/>` +
    `<path d="M480 612 Q600 540 720 612" fill="#C9A35E"/>` +
    `<path d="M150 540 Q140 380 190 280 M1050 540 Q1060 400 1010 300" stroke="#5A3A20" stroke-width="14" fill="none"/>` +
    `<path d="M190 280 q-90 0 -120 60 M190 280 q80 -20 130 40 M1010 300 q-90 -10 -130 50 M1010 300 q80 0 120 60" stroke="#2E7D4F" stroke-width="20" fill="none" stroke-linecap="round"/>`,
  desert: () =>
    sky("#F6B76B", "#FCE7C2") +
    sun(860, 260, 90, "#FFF4D6") +
    ridge("L0 600 Q300 480 600 590 T1200 560", "#E39B4E") +
    ridge("L0 720 Q400 600 800 700 T1200 680", "#C97A35") +
    `<g fill="#5A3A1E"><ellipse cx="380" cy="560" rx="60" ry="26"/><rect x="335" y="575" width="10" height="60"/><rect x="415" y="575" width="10" height="60"/><path d="M430 555 q40 -60 60 -20 l-10 10 q-20 -15 -40 20 Z"/><path d="M360 540 q20 -40 45 0 Z"/></g>`,
  fort: () =>
    sky("#A9C9E8", "#F1F6FB") +
    ridge("L0 560 L300 420 L700 430 L1000 400 L1200 500", "#6F8B5E") +
    `<g fill="#8A6A4C"><rect x="360" y="330" width="480" height="140"/><rect x="330" y="300" width="70" height="170"/><rect x="800" y="300" width="70" height="170"/><rect x="560" y="280" width="80" height="190"/></g>` +
    `<g fill="#6E523A"><rect x="580" y="400" width="40" height="70" rx="20"/></g>` +
    ridge("L0 700 Q600 600 1200 700", "#4E6B40"),
  temple: () =>
    sky("#FBC97C", "#FFF1D6") +
    `<g fill="#B5562E"><path d="M540 260 L600 140 L660 260 Z"/><rect x="520" y="260" width="160" height="200"/><path d="M420 360 L470 290 L520 360 Z M680 360 L730 290 L780 360 Z"/><rect x="400" y="360" width="400" height="140"/></g>` +
    `<rect x="572" y="400" width="56" height="100" rx="28" fill="#6E2C14"/>` +
    `<path d="M600 140 v-40 l40 14 -40 14" stroke="#6E2C14" stroke-width="4" fill="#E8432E"/>` +
    ridge("L0 500 L1200 500", "#D9A066") +
    ridge("L0 620 Q600 560 1200 620", "#9C7A4A"),
  city: () =>
    sky("#8FB8E8", "#E8F1FB") +
    `<g fill="#4D6B8A">${[0, 120, 230, 360, 470, 600, 720, 850, 980, 1090]
      .map((x, i) => `<rect x="${x}" y="${300 + ((i * 97) % 220)}" width="100" height="${600 - ((i * 97) % 220)}"/>`)
      .join("")}</g>` +
    `<path d="M520 300 h160 l-20 -40 h-120 Z M560 260 q40 -80 80 0" fill="#E8E1D5"/>` +
    ridge("L0 820 L1200 820", "#2F475F"),
  group: () =>
    sky("#FFD8A8", "#FFF5E8") +
    ridge("L0 600 Q600 520 1200 600", "#8CB369") +
    [200, 380, 560, 740, 920]
      .map(
        (x, i) =>
          `<g fill="${["#C2410C", "#0F766E", "#7C3AED", "#B45309", "#1D4ED8"][i]}"><circle cx="${x + 40}" cy="${430 - (i % 2) * 20}" r="44"/><rect x="${x}" y="${480 - (i % 2) * 20}" width="80" height="200" rx="38"/></g>`,
      )
      .join("") +
    ridge("L0 760 L1200 760", "#5E8C4A"),
  bus: () =>
    sky("#9AD0EC", "#EEF8FD") +
    ridge("L0 560 L1200 560", "#7FA36A") +
    `<rect y="560" width="${W}" height="160" fill="#555"/>` +
    `<path d="M0 640 h1200" stroke="#fff" stroke-width="8" stroke-dasharray="60 40"/>` +
    `<rect x="300" y="330" width="600" height="260" rx="40" fill="#E0A21B"/>` +
    `<g fill="#BFE3F5">${[340, 450, 560, 670, 780].map((x) => `<rect x="${x}" y="370" width="90" height="90" rx="10"/>`).join("")}</g>` +
    `<g fill="#222"><circle cx="420" cy="600" r="46"/><circle cx="780" cy="600" r="46"/></g>`,
};

// Cut-out vehicles (transparent background) for the fleet section.
const wheel = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#222"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#bbb"/>`;
const vehicles = {
  "vehicle-suv": () =>
    `<path d="M120 560 L150 430 Q170 380 230 370 L420 360 L560 250 Q600 225 660 225 L900 225 Q960 225 990 270 L1060 380 Q1090 400 1090 450 L1090 560 Z" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="6"/>` +
    `<path d="M590 270 L680 260 L680 360 L470 365 Z M710 260 L880 260 Q920 262 940 300 L970 360 L710 360 Z" fill="#93C5FD"/>` +
    `<rect x="120" y="520" width="970" height="40" fill="#6B7280"/>` + wheel(330, 570, 85) + wheel(890, 570, 85),
  "vehicle-van": () =>
    `<path d="M110 580 L110 300 Q110 240 170 240 L860 240 Q920 240 960 300 L1080 450 Q1095 470 1095 500 L1095 580 Z" fill="#F3F4F6" stroke="#9CA3AF" stroke-width="6"/>` +
    `<g fill="#93C5FD">${[160, 330, 500, 670].map((x) => `<rect x="${x}" y="280" width="150" height="110" rx="10"/>`).join("")}<path d="M850 280 L900 280 Q925 285 945 315 L1020 420 L850 420 Z"/></g>` +
    `<rect x="110" y="540" width="985" height="40" fill="#6B7280"/>` + wheel(300, 590, 80) + wheel(900, 590, 80),
  "vehicle-bus": () =>
    `<rect x="80" y="220" width="1040" height="380" rx="50" fill="#F9FAFB" stroke="#9CA3AF" stroke-width="6"/>` +
    `<g fill="#93C5FD">${[130, 290, 450, 610, 770].map((x) => `<rect x="${x}" y="270" width="140" height="120" rx="10"/>`).join("")}<rect x="930" y="270" width="150" height="220" rx="14"/></g>` +
    `<path d="M80 450 H900" stroke="#F59E0B" stroke-width="16"/>` +
    `<rect x="80" y="560" width="1040" height="40" fill="#6B7280"/>` + wheel(270, 610, 75) + wheel(930, 610, 75),
};

mkdirSync("public/placeholders", { recursive: true });
for (const [name, draw] of Object.entries(vehicles)) {
  writeFileSync(`public/placeholders/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 120 ${W} 600">${draw()}</svg>\n`);
}
for (const [name, draw] of Object.entries(scenes)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${draw()}</svg>\n`;
  writeFileSync(`public/placeholders/${name}.svg`, svg);
}
console.log(`Wrote ${Object.keys(scenes).length + Object.keys(vehicles).length} placeholders to public/placeholders/`);
