import { Menu, Phone } from "lucide-react";
import { z } from "zod";
import { Container, Img } from "@/components/ui";
import { LANG_NAMES } from "@/lib/i18n";
import { baseSection } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const schema = baseSection.extend({});
type Data = z.infer<typeof schema>;

function Brand({ ctx }: { ctx: SectionCtx }) {
  const name = ctx.t(ctx.business.name);
  const logo = ctx.img(ctx.business.logo);
  return (
    <a href={ctx.langHref(ctx.lang)} className="flex min-w-0 items-center gap-2 font-heading text-xl font-bold">
      {logo && <Img src={logo} alt="" className="size-9 rounded-full object-cover" eager />}
      <span className="truncate">{name}</span>
    </a>
  );
}

function LangSwitch({ ctx }: { ctx: SectionCtx }) {
  if (ctx.langs.length < 2) return null;
  return (
    <div className="flex items-center gap-1 text-sm" aria-label={ctx.ui.language}>
      {ctx.langs.map((l) => (
        <a
          key={l}
          href={ctx.langHref(l)}
          lang={l}
          aria-current={l === ctx.lang ? "true" : undefined}
          className={`rounded-btn px-2.5 py-1 ${l === ctx.lang ? "bg-primary text-primary-fg" : "hover:bg-surface"}`}
        >
          {LANG_NAMES[l]}
        </a>
      ))}
    </div>
  );
}

function MobileMenu({ ctx }: { ctx: SectionCtx }) {
  return (
    <details className="nav-menu relative md:hidden">
      <summary className="flex size-11 cursor-pointer items-center justify-center rounded-btn border border-line">
        <Menu className="size-5" />
        <span className="sr-only">{ctx.ui.menu}</span>
      </summary>
      <div className="absolute right-0 top-13 w-64 rounded-card border border-line bg-bg p-3 shadow-xl">
        <nav className="flex flex-col">
          {ctx.nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="rounded-btn px-3 py-2.5 hover:bg-surface">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="mt-2 border-t border-line pt-3">
          <LangSwitch ctx={ctx} />
        </div>
      </div>
    </details>
  );
}

function CallButton({ ctx }: { ctx: SectionCtx }) {
  return (
    <a
      href={ctx.tel}
      className="hidden items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg sm:inline-flex"
    >
      <Phone className="size-4" /> {ctx.ui.call}
    </a>
  );
}

function Simple({ ctx }: SectionProps<Data>) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Brand ctx={ctx} />
        <nav className="hidden items-center gap-1 md:flex">
          {ctx.nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="rounded-btn px-3 py-2 text-sm font-medium hover:bg-surface">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LangSwitch ctx={ctx} />
          </div>
          <CallButton ctx={ctx} />
          <MobileMenu ctx={ctx} />
        </div>
      </Container>
    </header>
  );
}

function Centered({ ctx }: SectionProps<Data>) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-auto md:flex-col md:gap-2 md:py-3">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="hidden w-40 md:block">
            <LangSwitch ctx={ctx} />
          </div>
          <Brand ctx={ctx} />
          <div className="flex w-40 items-center justify-end gap-2">
            <CallButton ctx={ctx} />
            <MobileMenu ctx={ctx} />
          </div>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {ctx.nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="rounded-btn px-3 py-1.5 text-sm font-medium hover:bg-surface">
              {n.label}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  );
}

export const navbar = defineSection({ type: "navbar", schema, layouts: { simple: Simple, centered: Centered } });
