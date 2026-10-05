import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { z } from "zod";
import { Container, Section, SectionHeader } from "@/components/ui";
import { baseSection, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
});
type Data = z.infer<typeof schema>;

function mapQuery(ctx: SectionCtx) {
  return ctx.business.mapQuery ?? ctx.t(ctx.business.address);
}

function Details({ ctx }: { ctx: SectionCtx }) {
  const b = ctx.business;
  const q = mapQuery(ctx);
  const rows = [
    { icon: Phone, label: ctx.ui.contact.phone, value: b.phone, href: ctx.tel },
    b.email && { icon: Mail, label: ctx.ui.contact.email, value: b.email, href: `mailto:${b.email}` },
    b.address && { icon: MapPin, label: ctx.ui.contact.address, value: ctx.t(b.address) },
    b.hours && { icon: Clock, label: ctx.ui.contact.hours, value: ctx.t(b.hours) },
  ].filter((r) => !!r);
  return (
    <div className="space-y-5">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
            <r.icon className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted">{r.label}</p>
            {"href" in r && r.href ? (
              <a href={r.href} className="font-medium">
                {r.value}
              </a>
            ) : (
              <p className="font-medium whitespace-pre-line">{r.value}</p>
            )}
          </div>
        </div>
      ))}
      {q && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-primary"
        >
          <Navigation className="size-4" /> {ctx.ui.contact.directions}
        </a>
      )}
    </div>
  );
}

function WithMap({ id, data, ctx }: SectionProps<Data>) {
  const q = mapQuery(ctx);
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="grid gap-10 md:grid-cols-[2fr_3fr]">
          <Details ctx={ctx} />
          {q && (
            <iframe
              title={ctx.ui.contact.address}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full rounded-card border border-line"
            />
          )}
        </div>
      </Container>
    </Section>
  );
}

function DetailsOnly({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container className="max-w-2xl">
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <Details ctx={ctx} />
      </Container>
    </Section>
  );
}

export const contact = defineSection({ type: "contact", schema, layouts: { map: WithMap, details: DetailsOnly } });
