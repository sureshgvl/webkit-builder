import { Mail, MapPin, Phone } from "lucide-react";
import { z } from "zod";
import { Container } from "@/components/ui";
import { baseSection, localized } from "@/lib/schema";
import { defineSection, type SectionProps } from "./types";

const schema = baseSection.extend({ about: localized.optional() });
type Data = z.infer<typeof schema>;

function Copyright({ ctx }: SectionProps<Data>) {
  return (
    <p className="text-sm opacity-75">
      © {new Date().getFullYear()} {ctx.t(ctx.business.name)}. {ctx.ui.footer.rights}.
    </p>
  );
}

function Socials({ ctx }: SectionProps<Data>) {
  const s = ctx.business.socials;
  if (!s) return null;
  const links = [
    ["Instagram", s.instagram],
    ["Facebook", s.facebook],
    ["YouTube", s.youtube],
  ].filter((l): l is [string, string] => Boolean(l[1]));
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {links.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
          {label}
        </a>
      ))}
    </div>
  );
}

function Simple(props: SectionProps<Data>) {
  return (
    <footer className="bg-text py-10 text-bg">
      <Container className="flex flex-col items-center gap-4 text-center">
        <p className="font-heading text-xl font-bold">{props.ctx.t(props.ctx.business.name)}</p>
        <Socials {...props} />
        <Copyright {...props} />
      </Container>
    </footer>
  );
}

function Columns(props: SectionProps<Data>) {
  const { ctx, data } = props;
  const b = ctx.business;
  return (
    <footer className="bg-text pt-14 pb-10 text-bg">
      <Container>
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-heading text-xl font-bold">{ctx.t(b.name)}</p>
            <p className="mt-3 text-sm opacity-80">{ctx.t(data.about ?? b.tagline)}</p>
            <div className="mt-4">
              <Socials {...props} />
            </div>
          </div>
          <div>
            <p className="font-semibold">{ctx.ui.footer.quickLinks}</p>
            <ul className="mt-3 space-y-2 text-sm opacity-85">
              {ctx.nav.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} className="hover:underline">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">{ctx.ui.footer.contact}</p>
            <ul className="mt-3 space-y-3 text-sm opacity-85">
              <li className="flex gap-2">
                <Phone className="size-4 shrink-0 translate-y-0.5" />
                <a href={ctx.tel}>{b.phone}</a>
              </li>
              {b.email && (
                <li className="flex gap-2">
                  <Mail className="size-4 shrink-0 translate-y-0.5" />
                  <a href={`mailto:${b.email}`}>{b.email}</a>
                </li>
              )}
              {b.address && (
                <li className="flex gap-2">
                  <MapPin className="size-4 shrink-0 translate-y-0.5" />
                  <span>{ctx.t(b.address)}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/15 pt-6">
          <Copyright {...props} />
        </div>
      </Container>
    </footer>
  );
}

export const footer = defineSection({ type: "footer", schema, layouts: { columns: Columns, simple: Simple } });
