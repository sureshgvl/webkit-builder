import type { NextConfig } from "next";

/**
 * Two modes from one codebase:
 *  - Single site (default; CLIENT=<slug>): a plain static export, as before. Uses page.tsx / layout.tsx files.
 *  - Platform (PLATFORM=1): one server app for every client site, chosen by the web address.
 *    Uses only *.p.tsx / *.p.ts files, so the two modes never mix.
 */
const platform = process.env.PLATFORM === "1";

const single: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

const multi: NextConfig = {
  pageExtensions: ["p.tsx", "p.ts"],
  images: { unoptimized: true },
  trailingSlash: true,
  async rewrites() {
    return {
      // Every request is served from /sites/<host>/…, except Next's own files, shared static files and the API.
      // (A direct /sites/<other-host>/ request is rewritten too, so it can't show another client's site.)
      beforeFiles: [
        {
          source: "/:path((?!_next/|api/|dev-assets/|placeholders/|preview/).*)",
          // Next matches the host without its port; "www." is left out so www.patiltours.in and patiltours.in
          // share one cached page.
          has: [{ type: "host", value: "(?:www\\.)?(?<host>.+?)\\.?" }],
          destination: "/sites/:host/:path",
        },
      ],
    };
  },
};

export default platform ? multi : single;
