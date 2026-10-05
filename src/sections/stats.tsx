import { z } from "zod";
import { Container, Section } from "@/components/ui";
import { baseSection, localized } from "@/lib/schema";
import { defineSection, type SectionProps } from "./types";

const schema = baseSection.extend({
  items: z.array(z.object({ value: z.string(), label: localized }).strict()).min(1).max(6),
});
type Data = z.infer<typeof schema>;

function Band({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone ?? "primary"} className="!py-12">
      <Container className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
        {data.items.map((s, i) => (
          <div key={i}>
            <p className="font-heading text-4xl font-bold md:text-5xl">{s.value}</p>
            <p className="mt-1 opacity-85">{ctx.t(s.label)}</p>
          </div>
        ))}
      </Container>
    </Section>
  );
}

function Cards({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone} className="!py-12">
      <Container className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.items.map((s, i) => (
          <div key={i} className="rounded-card border border-line bg-bg p-6 text-center shadow-sm">
            <p className="font-heading text-3xl font-bold text-primary md:text-4xl">{s.value}</p>
            <p className="mt-1 text-muted">{ctx.t(s.label)}</p>
          </div>
        ))}
      </Container>
    </Section>
  );
}

export const stats = defineSection({ type: "stats", schema, layouts: { band: Band, cards: Cards } });
