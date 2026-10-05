import { z } from "zod";
import { Container, Img, Section, SectionHeader } from "@/components/ui";
import { baseSection, imageRef, localized } from "@/lib/schema";
import { defineSection, type SectionProps } from "./types";

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  items: z.array(z.object({ image: imageRef, caption: localized.optional() }).strict()).min(1),
});
type Data = z.infer<typeof schema>;

function Caption({ text }: { text: string }) {
  if (!text) return null;
  return (
    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-sm font-medium text-white">
      {text}
    </figcaption>
  );
}

function Grid({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {data.items.map((g, i) => (
            <figure key={i} className="relative overflow-hidden rounded-card">
              <Img src={ctx.img(g.image)} alt={ctx.t(g.caption)} className="aspect-square w-full object-cover" />
              <Caption text={ctx.t(g.caption)} />
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Masonry({ id, data, ctx }: SectionProps<Data>) {
  const ratios = ["aspect-[3/4]", "aspect-square", "aspect-[4/3]"];
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="columns-2 gap-3 md:columns-3 md:gap-4">
          {data.items.map((g, i) => (
            <figure key={i} className="relative mb-3 break-inside-avoid overflow-hidden rounded-card md:mb-4">
              <Img
                src={ctx.img(g.image)}
                alt={ctx.t(g.caption)}
                className={`${ratios[i % ratios.length]} w-full object-cover`}
              />
              <Caption text={ctx.t(g.caption)} />
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export const gallery = defineSection({ type: "gallery", schema, layouts: { grid: Grid, masonry: Masonry } });
