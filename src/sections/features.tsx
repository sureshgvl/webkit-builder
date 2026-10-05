import { z } from "zod";
import { ICON_NAMES, Icon } from "@/components/icon";
import { Container, Img, Section, SectionHeader } from "@/components/ui";
import { baseSection, imageRef, localized } from "@/lib/schema";
import { defineSection, type SectionProps } from "./types";

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  image: imageRef.optional(),
  items: z
    .array(z.object({ icon: z.enum(ICON_NAMES), title: localized, text: localized.optional() }).strict())
    .min(1),
});
type Data = z.infer<typeof schema>;

function Item({ item, ctx, onPrimary }: { item: Data["items"][number]; ctx: SectionProps<Data>["ctx"]; onPrimary: boolean }) {
  return (
    <div className="flex gap-4">
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-card ${onPrimary ? "bg-white/15" : "bg-primary/10 text-primary"}`}
      >
        <Icon name={item.icon} />
      </div>
      <div>
        <h3 className="text-lg">{ctx.t(item.title)}</h3>
        {item.text && <p className={`mt-1 ${onPrimary ? "opacity-85" : "text-muted"}`}>{ctx.t(item.text)}</p>}
      </div>
    </div>
  );
}

function Grid({ id, data, ctx }: SectionProps<Data>) {
  const onPrimary = data.tone === "primary";
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader
          eyebrow={ctx.t(data.eyebrow)}
          title={ctx.t(data.title)}
          subtitle={ctx.t(data.subtitle)}
          onPrimary={onPrimary}
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, i) => (
            <Item key={i} item={item} ctx={ctx} onPrimary={onPrimary} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Split({ id, data, ctx }: SectionProps<Data>) {
  const onPrimary = data.tone === "primary";
  return (
    <Section id={id} tone={data.tone}>
      <Container className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeader
            eyebrow={ctx.t(data.eyebrow)}
            title={ctx.t(data.title)}
            subtitle={ctx.t(data.subtitle)}
            align="left"
            onPrimary={onPrimary}
          />
          <div className="grid gap-7">
            {data.items.map((item, i) => (
              <Item key={i} item={item} ctx={ctx} onPrimary={onPrimary} />
            ))}
          </div>
        </div>
        <Img src={ctx.img(data.image)} alt="" className="aspect-square w-full rounded-card object-cover" />
      </Container>
    </Section>
  );
}

export const features = defineSection({ type: "features", schema, layouts: { grid: Grid, split: Split } });
