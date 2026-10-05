import { Check, Clock, MapPin } from "lucide-react";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/icon";
import { ButtonLink, Container, Img, Section, SectionHeader } from "@/components/ui";
import { baseSection, imageRef, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const item = z
  .object({
    title: localized,
    image: imageRef.optional(),
    location: localized.optional(),
    days: z.number().int().positive().optional(),
    nights: z.number().int().nonnegative().optional(),
    /** Price in rupees. Leave out to show "Enquire" only. */
    price: z.number().nonnegative().optional(),
    /** Overrides "per person". */
    priceNote: localized.optional(),
    highlights: z.array(localized).optional(),
    /** Small label on the card, e.g. "Best seller". */
    badge: localized.optional(),
  })
  .strict();

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  items: z.array(item).min(1),
});
type Data = z.infer<typeof schema>;
type Item = z.infer<typeof item>;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function Duration({ p, ctx }: { p: Item; ctx: SectionCtx }) {
  if (!p.days) return null;
  const nights = p.nights ?? p.days - 1;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Clock className="size-4" /> {p.days} {ctx.ui.days} / {nights} {ctx.ui.nights}
    </span>
  );
}

function Price({ p, ctx }: { p: Item; ctx: SectionCtx }) {
  if (p.price === undefined) return null;
  return (
    <div>
      <p className="text-xs text-muted">{ctx.ui.startingFrom}</p>
      <p className="text-2xl font-bold text-primary">
        {inr.format(p.price)}
        <span className="ml-1 text-sm font-normal text-muted">/ {ctx.t(p.priceNote) || ctx.ui.perPerson}</span>
      </p>
    </div>
  );
}

function enquire(p: Item, ctx: SectionCtx) {
  return ctx.wa(`${ctx.ui.wa.package} ${ctx.t(p.title)}`);
}

function Cards({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p, i) => (
            <article key={i} className="flex flex-col overflow-hidden rounded-card border border-line bg-bg shadow-sm">
              <div className="relative">
                <Img src={ctx.img(p.image)} alt={ctx.t(p.title)} className="aspect-[4/3] w-full object-cover" />
                {p.badge && (
                  <span className="absolute top-3 left-3 rounded-btn bg-accent px-3 py-1 text-xs font-semibold text-white">
                    {ctx.t(p.badge)}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  {p.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4" /> {ctx.t(p.location)}
                    </span>
                  )}
                  <Duration p={p} ctx={ctx} />
                </div>
                <h3 className="mt-2 text-xl">{ctx.t(p.title)}</h3>
                {p.highlights && (
                  <ul className="mt-3 space-y-1.5 text-sm text-muted">
                    {p.highlights.map((h, j) => (
                      <li key={j} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {ctx.t(h)}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                  <Price p={p} ctx={ctx} />
                  <ButtonLink href={enquire(p, ctx)} variant="whatsapp" external className="!min-h-10 !px-4 !py-2 text-sm">
                    <WhatsAppIcon className="size-4" /> {ctx.ui.whatsapp}
                  </ButtonLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function List({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container className="max-w-4xl">
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="space-y-5">
          {data.items.map((p, i) => (
            <article
              key={i}
              className="grid overflow-hidden rounded-card border border-line bg-bg shadow-sm sm:grid-cols-[220px_1fr]"
            >
              <Img src={ctx.img(p.image)} alt={ctx.t(p.title)} className="aspect-[16/10] size-full object-cover sm:aspect-auto" />
              <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl">{ctx.t(p.title)}</h3>
                    {p.badge && (
                      <span className="rounded-btn bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
                        {ctx.t(p.badge)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    {p.location && <span>{ctx.t(p.location)}</span>}
                    <Duration p={p} ctx={ctx} />
                  </div>
                  {p.highlights && (
                    <p className="mt-2 text-sm text-muted">{p.highlights.map((h) => ctx.t(h)).join(" · ")}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-end gap-4 md:flex-col md:items-end">
                  <Price p={p} ctx={ctx} />
                  <ButtonLink href={enquire(p, ctx)} variant="whatsapp" external className="!min-h-10 !px-4 !py-2 text-sm">
                    <WhatsAppIcon className="size-4" /> {ctx.ui.whatsapp}
                  </ButtonLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export const packages = defineSection({ type: "packages", schema, layouts: { cards: Cards, list: List } });
