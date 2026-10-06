import type { ReactNode } from "react";
import "./globals.css";

/** Platform root layout: site-specific head tags come from each page (SiteHead). */
export default function PlatformRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mr">
      <body>{children}</body>
    </html>
  );
}
