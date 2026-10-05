import { Plus } from "lucide-react";
import { z } from "zod";
import { Container, Section, SectionHeader } from "@/components/ui";
import { baseSection, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const qa = z.object({ q: localized, a: localized }).strict();
const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  items: z.array(qa).min(1),
});
type Data = z.infer<typeof schema>;

function Item({ item, ctx }: { item: z.infer<typeof qa>; ctx: SectionCtx }) {
  return (
    <details className="faq-item group rounded-card border border-line bg-bg">
      <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-semibold">
        {ctx.t(item.q)}
        <Plus className="faq-icon size-5 shrink-0 text-primary transition-transform" />
      </summary>
      <p className="px-5 pb-5 text-muted">{ctx.t(item.a)}</p>
    </details>
  );
}

function Accordion({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container className="max-w-3xl">
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="space-y-3">
          {data.items.map((item, i) => (
            <Item key={i} item={item} ctx={ctx} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function TwoColumn({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container className="grid gap-10 md:grid-cols-[1fr_2fr]">
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} align="left" />
        <div className="space-y-3">
          {data.items.map((item, i) => (
            <Item key={i} item={item} ctx={ctx} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export const faq = defineSection({ type: "faq", schema, layouts: { accordion: Accordion, "two-column": TwoColumn } });
