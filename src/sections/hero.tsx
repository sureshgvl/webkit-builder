import { z } from "zod";
import { WhatsAppIcon } from "@/components/icon";
import { ButtonLink, Container, Img } from "@/components/ui";
import { baseSection, imageRef, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const cta = z.object({ label: localized, href: z.string() }).strict();

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized,
  subtitle: localized.optional(),
  image: imageRef.optional(),
  /** "contain" shows the whole image (logos, cut-out vehicles) instead of filling the box. */
  imageFit: z.enum(["cover", "contain"]).default("cover"),
  /** Short trust points shown under the buttons, e.g. "5000+ happy travellers". */
  badges: z.array(localized).optional(),
  /** Defaults to "Enquire on WhatsApp". */
  primaryCta: cta.optional(),
  secondaryCta: cta.optional(),
});
type Data = z.infer<typeof schema>;

function Ctas({ data, ctx, onImage = false }: { data: Data; ctx: SectionCtx; onImage?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {data.primaryCta ? (
        <ButtonLink href={data.primaryCta.href}>{ctx.t(data.primaryCta.label)}</ButtonLink>
      ) : (
        <ButtonLink href={ctx.wa(ctx.ui.wa.intro)} variant="whatsapp" external>
          <WhatsAppIcon className="size-5" /> {ctx.ui.enquireWhatsApp}
        </ButtonLink>
      )}
      {data.secondaryCta && (
        <ButtonLink href={data.secondaryCta.href} variant={onImage ? "light" : "outline"}>
          {ctx.t(data.secondaryCta.label)}
        </ButtonLink>
      )}
    </div>
  );
}

function Badges({ data, ctx }: { data: Data; ctx: SectionCtx }) {
  if (!data.badges?.length) return null;
  return (
    <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium opacity-90">
      {data.badges.map((b, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" /> {ctx.t(b)}
        </li>
      ))}
    </ul>
  );
}

function Split({ id, data, ctx }: SectionProps<Data>) {
  return (
    <section id={id} className="bg-bg py-12 md:py-20">
      <Container className="grid items-center gap-10 md:grid-cols-2">
        <div>
          {data.eyebrow && <p className="mb-4 font-semibold text-primary">{ctx.t(data.eyebrow)}</p>}
          <h1 className="text-4xl md:text-5xl lg:text-6xl">{ctx.t(data.title)}</h1>
          {data.subtitle && <p className="mt-5 text-lg text-muted md:text-xl">{ctx.t(data.subtitle)}</p>}
          <div className="mt-8">
            <Ctas data={data} ctx={ctx} />
          </div>
          <Badges data={data} ctx={ctx} />
        </div>
        <Img
          src={ctx.img(data.image)}
          alt=""
          eager
          className={`aspect-[4/3] w-full ${data.imageFit === "contain" ? "object-contain" : "rounded-card object-cover shadow-xl"}`}
        />
      </Container>
    </section>
  );
}

function Centered({ id, data, ctx }: SectionProps<Data>) {
  return (
    <section id={id} className="bg-surface py-16 text-center md:py-24">
      <Container className="flex flex-col items-center">
        {data.eyebrow && <p className="mb-4 font-semibold text-primary">{ctx.t(data.eyebrow)}</p>}
        <h1 className="max-w-3xl text-4xl md:text-6xl">{ctx.t(data.title)}</h1>
        {data.subtitle && <p className="mt-5 max-w-2xl text-lg text-muted md:text-xl">{ctx.t(data.subtitle)}</p>}
        <div className="mt-8">
          <Ctas data={data} ctx={ctx} />
        </div>
        <Badges data={data} ctx={ctx} />
        {data.image && (
          <Img
            src={ctx.img(data.image)}
            alt=""
            eager
            className={`mt-12 aspect-[21/9] w-full ${data.imageFit === "contain" ? "object-contain" : "rounded-card object-cover shadow-xl"}`}
          />
        )}
      </Container>
    </section>
  );
}

function ImageBg({ id, data, ctx }: SectionProps<Data>) {
  return (
    <section id={id} className="relative isolate overflow-hidden bg-text text-white">
      <Img src={ctx.img(data.image)} alt="" eager className="absolute inset-0 -z-10 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
      <Container className="flex min-h-[78vh] flex-col justify-center py-20">
        <div className="max-w-2xl">
          {data.eyebrow && (
            <p className="mb-5 inline-block rounded-btn bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
              {ctx.t(data.eyebrow)}
            </p>
          )}
          <h1 className="text-4xl md:text-6xl">{ctx.t(data.title)}</h1>
          {data.subtitle && <p className="mt-5 text-lg opacity-90 md:text-xl">{ctx.t(data.subtitle)}</p>}
          <div className="mt-8">
            <Ctas data={data} ctx={ctx} onImage />
          </div>
          <Badges data={data} ctx={ctx} />
        </div>
      </Container>
    </section>
  );
}

export const hero = defineSection({
  type: "hero",
  schema,
  layouts: { image: ImageBg, split: Split, centered: Centered },
});
