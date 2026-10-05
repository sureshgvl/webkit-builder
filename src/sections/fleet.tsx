import { Check, Users } from "lucide-react";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/icon";
import { ButtonLink, Container, Img, Section, SectionHeader } from "@/components/ui";
import { baseSection, imageRef, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const vehicle = z
  .object({
    name: localized,
    /** Cut-out photo (transparent background) works best. */
    image: imageRef,
    /** e.g. "SUV", "Tempo Traveller", "Mini bus". */
    category: localized.optional(),
    /** e.g. 7 or "13–17". */
    seats: z.union([z.number().int().positive(), z.string()]).optional(),
    features: z.array(localized).optional(),
    /** Rate in rupees, e.g. 18 with rateUnit "per km". Leave out to show "Book" only. */
    rate: z.number().nonnegative().optional(),
    rateUnit: localized.optional(),
  })
  .strict();

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  items: z.array(vehicle).min(1),
});
type Data = z.infer<typeof schema>;
type Vehicle = z.infer<typeof vehicle>;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function Card({ v, ctx }: { v: Vehicle; ctx: SectionCtx }) {
  const name = ctx.t(v.name);
  return (
    <article className="flex h-full flex-col rounded-card border border-line bg-bg p-4 shadow-sm">
      <div className="relative aspect-[3/2] rounded-card bg-gradient-to-b from-surface to-bg">
        <Img src={ctx.img(v.image)} alt={name} className="absolute inset-0 size-full object-contain p-3 drop-shadow-md" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        {v.category && <span className="rounded-btn bg-surface px-2.5 py-0.5">{ctx.t(v.category)}</span>}
        {v.seats !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" /> {v.seats} {ctx.ui.fleet.seats}
          </span>
        )}
      </div>
      <h3 className="mt-2 text-xl">{name}</h3>
      {v.features && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {v.features.map((f, i) => (
            <li key={i} className="inline-flex items-center gap-1">
              <Check className="size-4 text-primary" /> {ctx.t(f)}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        {v.rate !== undefined ? (
          <p className="text-xl font-bold text-primary">
            {inr.format(v.rate)}
            <span className="ml-1 text-sm font-normal text-muted">/ {ctx.t(v.rateUnit) || "km"}</span>
          </p>
        ) : (
          <span />
        )}
        <ButtonLink
          href={ctx.wa(`${ctx.ui.fleet.waBook} ${name}`)}
          variant="whatsapp"
          external
          className="!min-h-10 !px-4 !py-2 text-sm"
        >
          <WhatsAppIcon className="size-4" /> {ctx.ui.fleet.book}
        </ButtonLink>
      </div>
    </article>
  );
}

function Cards({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((v, i) => (
            <Card key={i} v={v} ctx={ctx} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Swipeable row: good when the fleet is large (10+ vehicles). */
function Scroll({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
      </Container>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        {data.items.map((v, i) => (
          <div key={i} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[30%]">
            <Card v={v} ctx={ctx} />
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Small cards, 2 per row on phones: good for a big fleet. */
function Compact({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {data.items.map((v, i) => {
            const name = ctx.t(v.name);
            return (
              <article key={i} className="flex flex-col rounded-card border border-line bg-bg p-3 shadow-sm">
                <div className="relative aspect-[3/2] rounded-card bg-gradient-to-b from-surface to-bg">
                  <Img src={ctx.img(v.image)} alt={name} className="absolute inset-0 size-full object-contain p-2 drop-shadow-md" />
                </div>
                <h3 className="mt-2 text-base leading-snug md:text-lg">{name}</h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted md:text-sm">
                  {v.category && <span>{ctx.t(v.category)}</span>}
                  {v.seats !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {v.seats}
                    </span>
                  )}
                </p>
                {v.rate !== undefined && (
                  <p className="mt-1 font-bold text-primary">
                    {inr.format(v.rate)}
                    <span className="text-xs font-normal text-muted"> / {ctx.t(v.rateUnit) || "km"}</span>
                  </p>
                )}
                <div className="mt-auto pt-3">
                  <a
                    href={ctx.wa(`${ctx.ui.fleet.waBook} ${name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-btn bg-[#1FA855] text-sm font-semibold text-white"
                  >
                    <WhatsAppIcon className="size-4" /> {ctx.ui.fleet.book}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

export const fleet = defineSection({ type: "fleet", schema, layouts: { compact: Compact, cards: Cards, scroll: Scroll } });
