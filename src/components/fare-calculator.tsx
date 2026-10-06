"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateFare, rupees, tripDays, type FareSettings } from "@/lib/fare";
import type { Lang } from "@/lib/i18n";
import { WhatsAppIcon } from "./icon";

export type FareVehicle = { name: string; rate: number; seats?: string };
export type FareRoute = { from: string; to: string; km: number };

export type FareCalculatorProps = {
  lang: Lang;
  vehicles: FareVehicle[];
  settings: FareSettings;
  routes: FareRoute[];
  places: string[];
  defaultPickup?: string;
  /** Google Maps browser key (restricted to the site's domain). Without it, km is typed or picked from routes. */
  mapsKey?: string;
  waNumber: string;
};

const T = {
  en: {
    oneWay: "One way",
    round: "Round trip",
    pickup: "Pickup",
    drop: "Drop",
    travelDate: "Travel date",
    returnDate: "Return date",
    time: "Pickup time",
    vehicle: "Vehicle",
    passengers: "Passengers",
    km: "Distance (one way, km)",
    find: "Find distance",
    finding: "Finding distance…",
    found: "Road distance from Google Maps",
    notFound: "Couldn't find this route. Check the place names, or type the km.",
    popular: "Popular routes",
    totalKm: "Total distance",
    minimum: "Minimum",
    billable: "Billable",
    base: "Fare",
    driver: "Driver allowance",
    gst: "GST",
    gstIncluded: "GST included",
    total: "Estimated total",
    days: "days",
    day: "day",
    toll: "Toll, parking and permit extra, as actual.",
    book: "Book on WhatsApp",
    fill: "Enter the distance to see the fare.",
    perKm: "km",
    rule: "Minimum {min} km per day is charged.",
    wa: {
      hello: "Hello SearchCab! I'd like to book:",
      trip: "Trip",
      dates: "Dates",
      time: "Pickup time",
      vehicle: "Vehicle",
      passengers: "Passengers",
      distance: "Distance",
      estimate: "Website estimate",
    },
  },
  mr: {
    oneWay: "One way",
    round: "Round trip",
    pickup: "कुठून",
    drop: "कुठे",
    travelDate: "प्रवासाची तारीख",
    returnDate: "परतीची तारीख",
    time: "Pickup वेळ",
    vehicle: "वाहन",
    passengers: "प्रवासी",
    km: "अंतर (एका बाजूचे, km)",
    find: "अंतर शोधा",
    finding: "अंतर शोधत आहे…",
    found: "Google Maps वरील रस्त्याचे अंतर",
    notFound: "हा route सापडला नाही. ठिकाणांची नावे तपासा किंवा km लिहा.",
    popular: "लोकप्रिय routes",
    totalKm: "एकूण अंतर",
    minimum: "किमान",
    billable: "आकारणी अंतर",
    base: "भाडे",
    driver: "ड्रायव्हर भत्ता",
    gst: "GST",
    gstIncluded: "GST समाविष्ट",
    total: "अंदाजे एकूण",
    days: "दिवस",
    day: "दिवस",
    toll: "टोल, पार्किंग आणि परमिट वेगळे – प्रत्यक्ष खर्चाप्रमाणे.",
    book: "व्हॉट्सॲपवर बुक करा",
    fill: "भाडे पाहण्यासाठी अंतर लिहा.",
    perKm: "km",
    rule: "दररोज किमान {min} km आकारले जातात.",
    wa: {
      hello: "नमस्कार SearchCab! मला बुकिंग करायचे आहे:",
      trip: "प्रवास",
      dates: "तारीख",
      time: "Pickup वेळ",
      vehicle: "वाहन",
      passengers: "प्रवासी",
      distance: "अंतर",
      estimate: "वेबसाइटवरील अंदाज",
    },
  },
} satisfies Record<Lang, unknown>;

// ---------------------------------------------------------------- Google Maps (browser)

type GoogleMaps = {
  importLibrary?: (name: string) => Promise<Record<string, unknown>>;
  DirectionsService?: new () => { route(req: unknown): Promise<{ routes: { legs: { distance?: { value: number } }[] }[] }> };
  TravelMode?: Record<string, string>;
};
declare global {
  interface Window {
    google?: { maps?: GoogleMaps };
    __scMapsReady?: () => void;
  }
}

let mapsPromise: Promise<GoogleMaps> | undefined;
function loadMaps(key: string, lang: Lang): Promise<GoogleMaps> {
  mapsPromise ??= new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps);
    window.__scMapsReady = () => resolve(window.google!.maps!);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&region=IN&language=${lang}&callback=__scMapsReady`;
    s.async = true;
    s.onerror = () => {
      mapsPromise = undefined;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.append(s);
  });
  return mapsPromise;
}

/** Road distance in km: Routes (current API) first, Directions as a fallback for older keys. */
async function roadKm(key: string, lang: Lang, from: string, to: string): Promise<number> {
  const maps = await loadMaps(key, lang);
  try {
    const lib = (await maps.importLibrary?.("routes")) as
      | { Route?: { computeRoutes(req: unknown): Promise<{ routes?: { distanceMeters?: number }[] }> } }
      | undefined;
    if (lib?.Route?.computeRoutes) {
      const { routes } = await lib.Route.computeRoutes({ origin: from, destination: to, travelMode: "DRIVING", fields: ["distanceMeters"] });
      const m = routes?.[0]?.distanceMeters;
      if (m) return m / 1000;
    }
  } catch {
    // fall through to Directions
  }
  if (maps.DirectionsService) {
    const r = await new maps.DirectionsService().route({ origin: from, destination: to, travelMode: maps.TravelMode?.DRIVING ?? "DRIVING", region: "IN" });
    const m = r.routes?.[0]?.legs?.reduce((sum, l) => sum + (l.distance?.value ?? 0), 0);
    if (m) return m / 1000;
  }
  throw new Error("No route");
}

// ---------------------------------------------------------------- component

const field =
  "w-full rounded-btn border border-line bg-bg px-3.5 py-2.5 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function FareCalculator({ lang, vehicles, settings, routes, places, defaultPickup = "", mapsKey, waNumber }: FareCalculatorProps) {
  const t = T[lang];
  const [round, setRound] = useState(true);
  const [pickup, setPickup] = useState(defaultPickup);
  const [drop, setDrop] = useState("");
  const [km, setKm] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [time, setTime] = useState("");
  const [vehicleIdx, setVehicleIdx] = useState(0);
  const [passengers, setPassengers] = useState("");
  const [status, setStatus] = useState<"" | "finding" | "found" | "error">("");

  // Dates are set after mount so the static HTML doesn't carry the build day.
  useEffect(() => {
    const d = todayIST();
    setTravelDate((v) => v || d);
    setReturnDate((v) => v || d);
  }, []);

  const vehicle = vehicles[vehicleIdx];
  const oneWayKm = Number(km);
  const totalKm = round ? oneWayKm * 2 : oneWayKm;
  const days = tripDays(travelDate, returnDate);
  const fare = useMemo(
    () => (vehicle && oneWayKm > 0 ? calculateFare({ km: totalKm, rate: vehicle.rate, days }, settings) : null),
    [vehicle, oneWayKm, totalKm, days, settings],
  );

  async function findDistance(from = pickup, to = drop) {
    if (!mapsKey || from.trim().length < 2 || to.trim().length < 2) return;
    setStatus("finding");
    try {
      setKm(String(Math.round(await roadKm(mapsKey, lang, from, to))));
      setStatus("found");
    } catch {
      setStatus("error");
    }
  }

  function pickRoute(r: FareRoute) {
    setPickup(r.from);
    setDrop(r.to);
    setKm(String(r.km));
    setStatus("");
  }

  const dayWord = (n: number) => `${n} ${n === 1 ? t.day : t.days}`;
  const message = fare
    ? [
        t.wa.hello,
        `${t.wa.trip}: ${pickup} → ${drop}${round ? ` → ${pickup}` : ""} (${round ? t.round : t.oneWay})`,
        `${t.wa.dates}: ${travelDate}${returnDate !== travelDate ? ` → ${returnDate}` : ""} (${dayWord(fare.days)})`,
        time && `${t.wa.time}: ${time}`,
        `${t.wa.vehicle}: ${vehicle.name}`,
        passengers && `${t.wa.passengers}: ${passengers}`,
        `${t.wa.distance}: ~${fare.actualKm} km`,
        `${t.wa.estimate}: ${rupees(fare.total)} (${t.toll})`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="rounded-card border border-line bg-bg p-5 shadow-sm md:p-6">
        <div className="mb-5 inline-flex rounded-btn border border-line p-1" role="group">
          {[
            [false, t.oneWay],
            [true, t.round],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={round === value}
              onClick={() => setRound(value as boolean)}
              className={`rounded-btn px-4 py-2 text-sm font-semibold ${round === value ? "bg-primary text-primary-fg" : "text-text"}`}
            >
              {label as string}
            </button>
          ))}
        </div>

        <datalist id="fare-places">
          {places.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            {t.pickup}
            <input className={field} list="fare-places" value={pickup} onChange={(e) => setPickup(e.target.value)} autoComplete="off" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            {t.drop}
            <input
              className={field}
              list="fare-places"
              value={drop}
              onChange={(e) => setDrop(e.target.value)}
              onBlur={() => !km && findDistance()}
              autoComplete="off"
            />
          </label>
        </div>

        {routes.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-muted">{t.popular}</p>
            <div className="flex flex-wrap gap-2">
              {routes.map((r) => (
                <button
                  key={`${r.from}-${r.to}`}
                  type="button"
                  onClick={() => pickRoute(r)}
                  className={`rounded-btn border px-3 py-1.5 text-sm ${
                    pickup === r.from && drop === r.to ? "border-primary bg-primary text-primary-fg" : "border-line hover:border-primary"
                  }`}
                >
                  {r.to} · {r.km} km
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-1.5 text-sm font-medium">
            {t.km}
            <input
              className={field}
              type="number"
              inputMode="numeric"
              min={0}
              value={km}
              onChange={(e) => {
                setKm(e.target.value);
                setStatus("");
              }}
            />
          </label>
          {mapsKey && (
            <button
              type="button"
              onClick={() => findDistance()}
              disabled={status === "finding" || pickup.trim().length < 2 || drop.trim().length < 2}
              className="min-h-11 rounded-btn border-2 border-primary px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50"
            >
              {t.find}
            </button>
          )}
        </div>
        <p className="mt-1.5 min-h-5 text-sm text-muted" aria-live="polite">
          {status === "finding" ? t.finding : status === "found" ? `✓ ${t.found}` : status === "error" ? t.notFound : ""}
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            {t.travelDate}
            <input
              className={field}
              type="date"
              value={travelDate}
              min={todayIST()}
              onChange={(e) => {
                setTravelDate(e.target.value);
                if (returnDate < e.target.value) setReturnDate(e.target.value);
              }}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            {t.returnDate}
            <input className={field} type="date" value={returnDate} min={travelDate} onChange={(e) => setReturnDate(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            {t.time}
            <input className={field} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
          <label className="grid gap-1.5 text-sm font-medium">
            {t.vehicle}
            <select className={field} value={vehicleIdx} onChange={(e) => setVehicleIdx(Number(e.target.value))}>
              {vehicles.map((v, i) => (
                <option key={v.name} value={i}>
                  {v.name} · ₹{v.rate}/km{v.seats ? ` · ${v.seats}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            {t.passengers}
            <input className={field} type="number" inputMode="numeric" min={1} max={60} value={passengers} onChange={(e) => setPassengers(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 md:p-6 lg:sticky lg:top-24 lg:self-start" aria-live="polite">
        {fare ? (
          <>
            <ul className="space-y-2 text-sm">
              <Line label={t.totalKm} value={`${fare.actualKm} km${round ? ` (${oneWayKm} × 2)` : ""}`} />
              <Line label={`${t.minimum} (${settings.minKmPerDay} × ${dayWord(fare.days)})`} value={`${fare.minimumKm} km`} />
              <Line label={t.billable} value={`${fare.billableKm} km`} strong />
              <Line label={`${t.base} (${fare.billableKm} × ₹${fare.rate})`} value={rupees(fare.baseFare)} />
              <Line label={`${t.driver} (₹${settings.driverAllowancePerDay} × ${fare.days})`} value={rupees(fare.driverAllowance)} />
              <Line label={settings.gstMode === "add" ? `${t.gst} ${settings.gstPercent}%` : t.gstIncluded} value={rupees(fare.gst)} />
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-semibold">{t.total}</span>
              <span className="font-heading text-3xl font-bold text-primary">{rupees(fare.total)}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{t.toll}</p>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-btn bg-[#1FA855] px-6 py-3 font-semibold text-white shadow-sm hover:brightness-105"
            >
              <WhatsAppIcon className="size-5" /> {t.book}
            </a>
          </>
        ) : (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center text-muted">
            <p>{t.fill}</p>
            <p className="text-sm">{t.rule.replace("{min}", String(settings.minKmPerDay))}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <li className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className={strong ? "font-bold" : "font-medium"}>{value}</span>
    </li>
  );
}
