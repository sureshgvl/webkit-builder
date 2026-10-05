import type { SiteStyle } from "./types";

export const modern: SiteStyle = {
  id: "modern",
  label: "Modern",
  description: "Clean and rounded, teal with amber accents.",
  colors: {
    primary: "#0E7490",
    primaryFg: "#FFFFFF",
    accent: "#F59E0B",
    bg: "#FFFFFF",
    surface: "#F1F5F9",
    text: "#0F172A",
    muted: "#475569",
    border: "#E2E8F0",
  },
  fonts: {
    heading: '"Poppins", "Mukta", system-ui, sans-serif',
    body: '"Inter", "Mukta", system-ui, sans-serif',
    google: ["Poppins:wght@500;600;700", "Inter:wght@400;500;600", "Mukta:wght@400;600;700"],
  },
  radius: "16px",
  buttonRadius: "999px",
  sectionPaddingY: "5rem",
  headingWeight: 700,
};
