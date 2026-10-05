import type { SiteStyle } from "./types";

export const warm: SiteStyle = {
  id: "warm",
  label: "Warm",
  description: "Earthy orange and teal, friendly rounded type. Good for travel and food.",
  colors: {
    primary: "#C2410C",
    primaryFg: "#FFFFFF",
    accent: "#0F766E",
    bg: "#FFFBF5",
    surface: "#FDF0E2",
    text: "#2A1A0F",
    muted: "#6B5544",
    border: "#EBD9C6",
  },
  fonts: {
    heading: '"Baloo 2", system-ui, sans-serif',
    body: '"Mukta", system-ui, sans-serif',
    google: ["Baloo+2:wght@500;600;700", "Mukta:wght@400;500;600;700"],
  },
  radius: "20px",
  buttonRadius: "14px",
  sectionPaddingY: "5rem",
  headingWeight: 700,
};
