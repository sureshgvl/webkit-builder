import { z } from "zod";
import { FareCalculator } from "@/components/fare-calculator";
import { Container, Section, SectionHeader } from "@/components/ui";
import { baseSection, localized } from "@/lib/schema";
import { defineSection, type SectionProps } from "./types";

const schema = baseSection.extend({
  eyebrow: localized.optional(),
  title: localized.optional(),
  subtitle: localized.optional(),
  minKmPerDay: z.number().int().nonnegative().default(300),
  driverAllowancePerDay: z.number().nonnegative().default(300),
  gstPercent: z.number().nonnegative().default(5),
  gstMode: z.enum(["add", "included"]).default("add"),
  defaultPickup: localized.optional(),
  /** Quick-pick routes (one-way km). */
  routes: z.array(z.object({ from: localized, to: localized, km: z.number().positive() }).strict()).default([]),
  /** Suggestions while typing pickup / drop (used when there is no Google key, or Google has no match). */
  places: z.array(z.string()).default([]),
  /** Google address suggestions prefer places near this point, e.g. the business's city. */
  searchNear: z.object({ lat: z.number(), lng: z.number() }).strict().optional(),
  /** Filled in automatically from the fleet section's vehicles that have a rate. */
  vehicles: z
    .array(z.object({ name: localized, rate: z.number().positive(), seats: z.union([z.number(), z.string()]).optional() }).strict())
    .optional(),
});
type Data = z.infer<typeof schema>;

function Calculator({ id, data, ctx }: SectionProps<Data>) {
  // The key is read at build time from the Vercel project's environment; it must be restricted to the site's domain.
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY || undefined;
  return (
    <Section id={id} tone={data.tone}>
      <Container>
        <SectionHeader eyebrow={ctx.t(data.eyebrow)} title={ctx.t(data.title)} subtitle={ctx.t(data.subtitle)} />
        <FareCalculator
          lang={ctx.lang}
          vehicles={(data.vehicles ?? []).map((v) => ({ name: ctx.t(v.name), rate: v.rate, seats: v.seats === undefined ? undefined : String(v.seats) }))}
          settings={{ minKmPerDay: data.minKmPerDay, driverAllowancePerDay: data.driverAllowancePerDay, gstPercent: data.gstPercent, gstMode: data.gstMode }}
          routes={data.routes.map((r) => ({ from: ctx.t(r.from), to: ctx.t(r.to), km: r.km }))}
          places={data.places}
          defaultPickup={ctx.t(data.defaultPickup)}
          mapsKey={mapsKey}
          near={data.searchNear}
          waNumber={ctx.waNumber}
        />
      </Container>
    </Section>
  );
}

export const fare = defineSection({ type: "fare", schema, layouts: { calculator: Calculator } });
