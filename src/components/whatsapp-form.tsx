"use client";

import { useState, type FormEvent } from "react";
import type { UiStrings } from "@/lib/i18n";
import { WhatsAppIcon } from "./icon";

export type WhatsAppFormProps = {
  /** Digits only, with country code. */
  number: string;
  ui: UiStrings;
  packages: string[];
  show: { package: boolean; date: boolean; people: boolean };
};

const field =
  "w-full rounded-btn border border-line bg-bg px-4 py-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/** Enquiry form with no server: builds a WhatsApp message and opens wa.me. */
export function WhatsAppForm({ number, ui, packages, show }: WhatsAppFormProps) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const lines = [
      ui.wa.intro,
      `${ui.wa.name}: ${get("name")}`,
      `${ui.wa.phone}: ${get("phone")}`,
      get("package") && `${ui.form.package}: ${get("package")}`,
      get("date") && `${ui.wa.date}: ${get("date")}`,
      get("people") && `${ui.wa.people}: ${get("people")}`,
      get("message") && `${ui.wa.message}: ${get("message")}`,
    ].filter(Boolean);
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium">
        {ui.form.name}
        <input name="name" required autoComplete="name" className={field} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        {ui.form.phone}
        <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9+\s-]{10,15}" className={field} />
      </label>
      {show.package && packages.length > 0 && (
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          {ui.form.package}
          <select name="package" className={field} defaultValue="">
            <option value="">{ui.form.anyPackage}</option>
            {packages.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      )}
      {show.date && (
        <label className="grid gap-1.5 text-sm font-medium">
          {ui.form.date}
          <input name="date" type="date" className={field} />
        </label>
      )}
      {show.people && (
        <label className="grid gap-1.5 text-sm font-medium">
          {ui.form.people}
          <input name="people" type="number" min={1} max={500} inputMode="numeric" className={field} />
        </label>
      )}
      <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
        {ui.form.message}
        <textarea name="message" rows={3} className={field} />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-btn bg-[#1FA855] px-6 py-3 font-semibold text-white shadow-sm transition hover:brightness-105 sm:w-auto"
        >
          <WhatsAppIcon className="size-5" /> {ui.form.submit}
        </button>
        <p className="mt-3 text-sm text-muted" aria-live="polite">
          {ui.form.note}
          {sent ? " ✓" : ""}
        </p>
      </div>
    </form>
  );
}
