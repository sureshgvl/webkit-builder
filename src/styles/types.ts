export type StyleColors = {
  primary: string;
  /** Text on top of `primary` (buttons, primary-tone sections). */
  primaryFg: string;
  accent: string;
  bg: string;
  /** Alternate section background. */
  surface: string;
  text: string;
  muted: string;
  border: string;
};

export type SiteStyle = {
  id: string;
  label: string;
  description: string;
  colors: StyleColors;
  fonts: {
    /** CSS font stacks. Put a Devanagari-capable family in each so Marathi renders well. */
    heading: string;
    body: string;
    /** Google Fonts `family=` values to load, e.g. "Poppins:wght@600;700". */
    google: string[];
  };
  radius: string;
  buttonRadius: string;
  sectionPaddingY: string;
  headingWeight: number;
};
