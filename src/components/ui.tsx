import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

const TONES = {
  default: "bg-bg text-text",
  surface: "bg-surface text-text",
  primary: "bg-primary text-primary-fg",
} as const;

export type Tone = keyof typeof TONES;

export function Section({
  id,
  tone = "default",
  className = "",
  children,
}: {
  id: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-tone={tone} className={`section-y ${TONES[tone]} ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  onPrimary = false,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: "center" | "left";
  onPrimary?: boolean;
}) {
  if (!eyebrow && !title && !subtitle) return null;
  const centered = align === "center";
  return (
    <div className={`mb-10 md:mb-14 ${centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && (
        <p
          className={`mb-3 text-sm font-semibold uppercase tracking-wider ${onPrimary ? "opacity-80" : "text-primary"}`}
        >
          {eyebrow}
        </p>
      )}
      {title && <h2 className="text-3xl md:text-4xl">{title}</h2>}
      {subtitle && <p className={`mt-4 text-lg ${onPrimary ? "opacity-85" : "text-muted"}`}>{subtitle}</p>}
    </div>
  );
}

const BUTTONS = {
  primary: "bg-primary text-primary-fg hover:brightness-110 shadow-sm",
  outline: "border-2 border-current hover:bg-black/5",
  light: "bg-white text-[#111] hover:bg-white/90 shadow-sm",
  whatsapp: "bg-[#1FA855] text-white hover:brightness-105 shadow-sm",
} as const;

export function ButtonLink({
  href,
  variant = "primary",
  external = false,
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof BUTTONS;
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-btn px-6 py-3 text-base font-semibold transition ${BUTTONS[variant]} ${className}`}
    >
      {children}
    </a>
  );
}

/** Plain <img>: sites are static exports, so images are pre-sized at build/upload time. */
export function Img({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      {...(eager ? { fetchPriority: "high" as const } : {})}
    />
  );
}

export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}
