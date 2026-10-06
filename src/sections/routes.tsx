import { ArrowRight, Calculator } from "lucide-react";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/icon";
import { Container, Section, SectionHeader } from "@/components/ui";
import { calculateFare, rupees } from "@/lib/fare";
import { baseSection, localized } from "@/lib/schema";
import { defineSection, type SectionCtx, type SectionProps } from "./types";

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  from: localized,
  /** One-way km; the price is for `trip` over `days` (round trip, 1 day by default). */
  items: z
    .array(
      z
        .object({
          to: localized,
          km: z.number().positive(),
          trip: z.enum(["round", "oneway"]).default("round"),
          days: z.number().int().positive().default(1),
          note: localized.optional(),
        })
        .strict(),
    )
    .min(1),
  /** Vehicle used for the shown prices (matched against fleet names, e.g. "Dzire"). Default: cheapest. */
  vehicle: z.string().optional(),
  /** Filled in automatically from the fare section (rules) and the cheapest fleet vehicle. */
  pricing: z
    .object({
      minKmPerDay: z.number(),
      driverAllowancePerDay: z.number(),
      gstPercent: z.number(),
      gstMode: z.enum(["add", "included"]),
      rate: z.number(),
      vehicleName: localized,
    })
    .optional(),
});
type Data = z.infer<typeof schema>;

const L = {
  en: {
    round: "Round trip", oneway: "One way", day: "day", days: "days",
    note: "Prices for a {vehicle}, incl. driver allowance & GST. Toll, parking & permit extra.",
    calc: "Calculate", book: "Book", hi: "Hello! I'd like to book a cab:",
  },
  mr: {
    round: "Round trip", oneway: "One way", day: "दिवस", days: "दिवस",
    note: "दर {vehicle} साठी, ड्रायव्हर भत्ता व GST सह. टोल, पार्किंग व परमिट वेगळे.",
    calc: "भाडे पहा", book: "बुक करा", hi: "नमस्कार! मला गाडी बुक करायची आहे:",
  },
};

function price(data: Data, item: Data["items"][number]): number | null {
  const p = data.pricing;
  if (!p) return null;
  const km = item.trip === "round" ? item.km * 2 : item.km;
  return calculateFare({ km, rate: p.rate, days: item.days }, p).total;
}

function Card({ data, item, ctx }: { data: Data; item: Data["items"][number]; ctx: SectionCtx }) {
  const l = L[ctx.lang];
  const from = ctx.t(data.from);
  const to = ctx.t(item.to);
  const p = price(data, item);
  return (
    <article className="flex flex-col rounded-card border border-line bg-bg p-5 shadow-sm">
      <p className="flex flex-wrap items-center gap-1.5 font-heading text-lg font-bold">
        {from} <ArrowRight className="size-4 text-primary" /> {to}
      </p>
      <p className="mt-1 text-sm text-muted">
        ~{item.km} km{item.note ? ` · ${ctx.t(item.note)}` : ""}
      </p>
      {p !== null && (
        <p className="mt-3">
          <span className="text-2xl font-bold text-primary">{rupees(p)}</span>
          <span className="ml-2 text-sm text-muted">
            {item.trip === "round" ? l.round : l.oneway} · {item.days} {item.days === 1 ? l.day : l.days}
          </span>
        </p>
      )}
      <div className="mt-auto flex gap-2 pt-4">
        <a href="#fare" className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-btn border border-line text-sm font-semibold hover:border-primary">
          <Calculator className="size-4" /> {l.calc}
        </a>
        <a
          href={ctx.wa(`${l.hi} ${from} → ${to}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-btn bg-[#1FA855] text-sm font-semibold text-white"
        >
          <WhatsAppIcon className="size-4" /> {l.book}
        </a>
      </div>
    </article>
  );
}

function Grid({ id, data, ctx }: SectionProps<Data>) {
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, i) => (
            <Card key={i} data={data} item={item} ctx={ctx} />
          ))}
        </div>
        {data.pricing && (
          <p className="mt-5 text-center text-sm text-muted">{L[ctx.lang].note.replace("{vehicle}", ctx.t(data.pricing.vehicleName))}</p>
        )}
      </Container>
    </Section>
  );
}

export const routes = defineSection({ type: "routes", schema, layouts: { grid: Grid } });
