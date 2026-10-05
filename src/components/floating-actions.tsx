import { Phone } from "lucide-react";
import type { SectionCtx } from "@/sections/types";
import { WhatsAppIcon } from "./icon";

/**
 * Phone: fixed bottom bar with Call + WhatsApp (never covers content; the page reserves space for it).
 * Larger screens: floating WhatsApp button.
 */
export function FloatingActions({ ctx }: { ctx: SectionCtx }) {
  const wa = ctx.wa(ctx.ui.wa.intro);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-line bg-bg/95 p-2 backdrop-blur sm:hidden">
        <a
          href={ctx.tel}
          className="flex min-h-12 items-center justify-center gap-2 rounded-btn bg-primary font-semibold text-primary-fg"
        >
          <Phone className="size-5" /> {ctx.ui.call}
        </a>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-btn bg-[#1FA855] font-semibold text-white"
        >
          <WhatsAppIcon className="size-5" /> {ctx.ui.whatsapp}
        </a>
      </div>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ctx.ui.whatsapp}
        className="fixed right-5 bottom-5 z-50 hidden size-14 items-center justify-center rounded-full bg-[#1FA855] text-white shadow-lg transition hover:scale-105 sm:flex"
      >
        <WhatsAppIcon className="size-7" />
      </a>
    </>
  );
}
