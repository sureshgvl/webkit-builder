import { Star } from "lucide-react";
import { z } from "zod";
import { Container, Img, Section, SectionHeader } from "@/components/ui";
import { baseSection, imageRef, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const item = z
  .object({
    name: z.string(),
    place: localized.optional(),
    text: localized,
    rating: z.number().int().min(1).max(5).optional(),
    photo: imageRef.optional(),
  })
  .strict();

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  items: z.array(item).min(1),
});
type Data = z.infer<typeof schema>;

function Card({ r, ctx }: { r: z.infer<typeof item>; ctx: SectionCtx }) {
  const initials = r.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <figure className="flex h-full flex-col rounded-card border border-line bg-bg p-6 shadow-sm">
      {r.rating && (
        <div className="flex gap-0.5 text-accent" aria-label={`${r.rating}/5`}>
          {Array.from({ length: r.rating }, (_, i) => (
            <Star key={i} className="size-4 fill-current" />
          ))}
        </div>
      )}
      <blockquote className="mt-3 flex-1 text-text">“{ctx.t(r.text)}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        {r.photo ? (
          <Img src={ctx.img(r.photo)} alt="" className="size-11 rounded-full object-cover" />
        ) : (
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {initials}
          </span>
        )}
        <span>
          <span className="block font-semibold">{r.name}</span>
          {r.place && <span className="block text-sm text-muted">{ctx.t(r.place)}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

function Cards({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="grid gap-6 md:grid-cols-3">
          {data.items.map((r, i) => (
            <Card key={i} r={r} ctx={ctx} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Horizontal swipe row (CSS scroll-snap, no JavaScript). */
function Scroll({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
      </Container>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        {data.items.map((r, i) => (
          <div key={i} className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[32%]">
            <Card r={r} ctx={ctx} />
          </div>
        ))}
      </div>
    </Section>
  );
}

export const testimonials = defineSection({ type: "testimonials", schema, layouts: { cards: Cards, scroll: Scroll } });
