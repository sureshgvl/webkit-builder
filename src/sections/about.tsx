import { Check } from "lucide-react";
import { z } from "zod";
import { Container, Img, Paragraphs, Section, SectionHeader } from "@/components/ui";
import { baseSection, imageRef, localized } from "@/lib/schema";
import { defineSection, type SectionProps } from "./types";

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized,
  /** Separate paragraphs with a blank line. */
  body: localized,
  image: imageRef.optional(),
  points: z.array(localized).optional(),
});
type Data = z.infer<typeof schema>;

function Points({ data, ctx }: SectionProps<Data>) {
  if (!data.points?.length) return null;
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {data.points.map((p, i) => (
        <li key={i} className="flex items-start gap-2">
          <Check className="mt-1 size-5 shrink-0 text-primary" /> <span>{ctx.t(p)}</span>
        </li>
      ))}
    </ul>
  );
}

function Split(props: SectionProps<Data>) {
  const { id, data, ctx } = props;
  return (
    <Section id={id} tone={data.tone}>
      <Container className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <Img src={ctx.img(data.image)} alt="" className="aspect-[4/5] w-full rounded-card object-cover md:order-none" />
        <div>
          <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} align="left" />
          <div className="-mt-4 space-y-4 text-lg text-muted">
            <Paragraphs text={ctx.t(data.body)} />
          </div>
          <Points {...props} />
        </div>
      </Container>
    </Section>
  );
}

function Centered(props: SectionProps<Data>) {
  const { id, data, ctx } = props;
  return (
    <Section id={id} tone={data.tone}>
      <Container className="max-w-3xl text-center">
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} />
        <div className="-mt-4 space-y-4 text-lg text-muted">
          <Paragraphs text={ctx.t(data.body)} />
        </div>
        <div className="text-left">
          <Points {...props} />
        </div>
      </Container>
    </Section>
  );
}

export const about = defineSection({ type: "about", schema, layouts: { split: Split, centered: Centered } });
