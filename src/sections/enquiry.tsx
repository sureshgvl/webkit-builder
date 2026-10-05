import { Mail, MapPin, Phone } from "lucide-react";
import { z } from "zod";
import { Container, Section, SectionHeader } from "@/components/ui";
import { WhatsAppForm } from "@/components/whatsapp-form";
import { baseSection, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  /** Which optional fields to show. Package choices come from the "packages" section. */
  fields: z
    .object({ package: z.boolean().default(true), date: z.boolean().default(true), people: z.boolean().default(true) })
    .default({ package: true, date: true, people: true }),
  /** Filled in automatically from the packages section. */
  packageNames: z.array(localized).optional(),
});
type Data = z.infer<typeof schema>;

function Form({ data, ctx }: { data: Data; ctx: SectionCtx }) {
  return (
    <WhatsAppForm
      number={ctx.waNumber}
      ui={ctx.ui}
      packages={(data.packageNames ?? []).map((p) => ctx.t(p))}
      show={data.fields}
    />
  );
}

function Simple({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container className="max-w-3xl">
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="rounded-card border border-line bg-bg p-5 shadow-sm md:p-8">
          <Form data={data} ctx={ctx} />
        </div>
      </Container>
    </Section>
  );
}

function Split({ id, data, ctx }: SectionProps<Data>) {
  const b = ctx.business;
  return (
    <Section id={id} tone={data.tone}>
      <Container className="grid gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} align="left" />
          <ul className="-mt-4 space-y-4">
            <li className="flex gap-3">
              <Phone className="size-5 shrink-0 text-primary" />
              <a href={ctx.tel} className="font-medium">
                {b.phone}
              </a>
            </li>
            {b.email && (
              <li className="flex gap-3">
                <Mail className="size-5 shrink-0 text-primary" />
                <a href={`mailto:${b.email}`}>{b.email}</a>
              </li>
            )}
            {b.address && (
              <li className="flex gap-3">
                <MapPin className="size-5 shrink-0 text-primary" />
                <span>{ctx.t(b.address)}</span>
              </li>
            )}
          </ul>
        </div>
        <div className="rounded-card border border-line bg-bg p-5 shadow-sm md:p-8">
          <Form data={data} ctx={ctx} />
        </div>
      </Container>
    </Section>
  );
}

export const enquiry = defineSection({ type: "enquiry", schema, layouts: { split: Split, simple: Simple } });
