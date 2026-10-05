import { Phone } from "lucide-react";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/icon";
import { ButtonLink, Container } from "@/components/ui";
import { baseSection, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const schema = baseSection.extend({ title: localized, subtitle: localized.optional() });
type Data = z.infer<typeof schema>;

function Buttons({ ctx }: { ctx: SectionCtx }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ButtonLink href={ctx.wa(ctx.ui.wa.intro)} variant="whatsapp" external>
        <WhatsAppIcon className="size-5" /> {ctx.ui.enquireWhatsApp}
      </ButtonLink>
      <ButtonLink href={ctx.tel} variant="light">
        <Phone className="size-5" /> {ctx.ui.call}
      </ButtonLink>
    </div>
  );
}

function Strip({ id, data, ctx }: SectionProps<Data>) {
  return (
    <section id={id} className="bg-primary py-12 text-primary-fg">
      <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl">{ctx.t(data.title)}</h2>
          {data.subtitle && <p className="mt-2 opacity-85">{ctx.t(data.subtitle)}</p>}
        </div>
        <Buttons ctx={ctx} />
      </Container>
    </section>
  );
}

function Card({ id, data, ctx }: SectionProps<Data>) {
  return (
    <section id={id} className="section-y bg-bg">
      <Container>
        <div className="flex flex-col items-center rounded-card bg-primary px-6 py-12 text-center text-primary-fg md:py-16">
          <h2 className="max-w-2xl text-3xl md:text-4xl">{ctx.t(data.title)}</h2>
          {data.subtitle && <p className="mt-3 max-w-xl opacity-85">{ctx.t(data.subtitle)}</p>}
          <div className="mt-8">
            <Buttons ctx={ctx} />
          </div>
        </div>
      </Container>
    </section>
  );
}

export const cta = defineSection({ type: "cta", schema, layouts: { card: Card, strip: Strip } });
