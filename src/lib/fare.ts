/**
 * Outstation cab fare (client rule):
 *   Days             = travel date → return date, both included (6 Oct → 7 Oct = 2 days)
 *   Billable km      = MAX(actual km, minKmPerDay × days)
 *   Base fare        = rate × billable km
 *   Driver allowance = driverAllowancePerDay × days
 *   GST              = gstPercent of (base + allowance) when gstMode = "add"
 *   Toll / parking / permit are extra, as actual (never included).
 * Pure functions: used at build time (route prices) and in the browser (fare calculator).
 */
export type FareSettings = {
  minKmPerDay: number;
  driverAllowancePerDay: number;
  gstPercent: number;
  gstMode: "add" | "included";
};

export type Fare = {
  days: number;
  actualKm: number;
  minimumKm: number;
  billableKm: number;
  minimumApplied: boolean;
  rate: number;
  baseFare: number;
  driverAllowance: number;
  gst: number;
  total: number;
};

const DAY = 86_400_000;
const utc = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
};

/** Inclusive day count; 1 when dates are missing or reversed. */
export function tripDays(travelDate?: string, returnDate?: string): number {
  if (!travelDate || !returnDate) return 1;
  const diff = Math.round((utc(returnDate) - utc(travelDate)) / DAY);
  return diff < 0 ? 1 : diff + 1;
}

export function calculateFare(input: { km: number; rate: number; days: number }, s: FareSettings): Fare {
  const days = Math.max(1, Math.floor(input.days));
  const actualKm = Math.max(0, Math.ceil(input.km));
  const minimumKm = s.minKmPerDay * days;
  const billableKm = Math.max(actualKm, minimumKm);
  const baseFare = input.rate * billableKm;
  const driverAllowance = s.driverAllowancePerDay * days;
  const subtotal = baseFare + driverAllowance;
  const gst = s.gstMode === "add" ? Math.round((subtotal * s.gstPercent) / 100) : 0;
  return {
    days,
    actualKm,
    minimumKm,
    billableKm,
    minimumApplied: minimumKm > actualKm,
    rate: input.rate,
    baseFare,
    driverAllowance,
    gst,
    total: subtotal + gst,
  };
}

export const rupees = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
