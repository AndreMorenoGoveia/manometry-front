/** Shown wherever a number the API did not send would go. */
export const MISSING = "n/d";

const decimals = (value: number, places: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(value);

/** Decimal places that suit each Chicago metric's dynamic range. */
const PLACES: Record<string, number> = {
  dci: 0,
  irp4: 1,
  distal_latency: 1,
  front_arrival: 1,
  largest_break_cm: 1,
  egj_basal: 1,
  peak_distal_pressure: 1,
  pressurization_fraction: 2,
  pan_time_fraction: 2,
  body_length_cm: 1,
};

export function formatMetric(key: string, value: number): string {
  if (!Number.isFinite(value)) return MISSING;
  return decimals(value, PLACES[key] ?? 1);
}

export function formatUnit(unit: string): string {
  return unit === "fração" ? "" : unit;
}

export function percent(value: number, places = 0): string {
  if (!Number.isFinite(value)) return MISSING;
  return `${decimals(value * 100, places)}%`;
}

export function number(value: number, places = 1): string {
  if (!Number.isFinite(value)) return MISSING;
  return decimals(value, places);
}

/** An integer with pt-BR thousands grouping: 1681 -> "1.681". */
export function count(value: number): string {
  if (!Number.isFinite(value)) return MISSING;
  return decimals(value, 0);
}

export function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${decimals(value / 1024, 0)} kB`;
  return `${decimals(value / (1024 * 1024), 1)} MB`;
}

export function duration(milliseconds: number): string {
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  return `${decimals(milliseconds / 1000, 1)} s`;
}

/** `rgba()` of a `#rrggbb`, for glows and washes built from the accent. */
export function alpha(hex: string, opacity: number): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  const numeric = Number.parseInt(full, 16);
  if (!Number.isFinite(numeric) || full.length !== 6) return `rgba(96, 230, 200, ${opacity})`;
  return `rgba(${(numeric >> 16) & 255}, ${(numeric >> 8) & 255}, ${numeric & 255}, ${opacity})`;
}
