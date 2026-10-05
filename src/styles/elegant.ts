import type { SiteStyle } from "./types";

export const elegant: SiteStyle = {
  id: "elegant",
  label: "Elegant",
  description: "Serif headings, soft browns and lots of space. Good for premium and boutique brands.",
  colors: {
    primary: "#7A4E3B",
    primaryFg: "#FFFFFF",
    accent: "#B08A5B",
    bg: "#FFFBF7",
    surface: "#F6EEE6",
    text: "#2B2B2B",
    muted: "#6B6259",
    border: "#E8DDD2",
  },
  fonts: {
    heading: '"Playfair Display", "Tiro Devanagari Marathi", Georgia, serif',
    body: '"Inter", "Mukta", system-ui, sans-serif',
    google: [
      "Playfair+Display:wght@500;600;700",
      "Tiro+Devanagari+Marathi",
      "Inter:wght@400;500;600",
      "Mukta:wght@400;600",
    ],
  },
  radius: "6px",
  buttonRadius: "4px",
  sectionPaddingY: "6rem",
  headingWeight: 600,
};
