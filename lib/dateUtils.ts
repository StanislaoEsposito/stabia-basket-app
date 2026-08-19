import { parseISO, isBefore, differenceInDays } from "date-fns";

/* ─────────────────────────────────────────────
   Stato scadenza di una data
───────────────────────────────────────────── */
export type ExpiryStatus = "missing" | "expired" | "expiring" | "valid";

export function getExpiryStatus(dateStr: string | null | undefined): ExpiryStatus {
  if (!dateStr) return "missing";
  try {
    const d = parseISO(dateStr);
    const now = new Date();
    if (isBefore(d, now)) return "expired";
    if (differenceInDays(d, now) <= 30) return "expiring";
    return "valid";
  } catch {
    return "missing";
  }
}

/* ─────────────────────────────────────────────
   Mappa status → label + classi Tailwind
───────────────────────────────────────────── */
export const EXPIRY_BADGE: Record<
  ExpiryStatus,
  { label: string; className: string; dotClass: string }
> = {
  missing:  {
    label: "Assente",
    className: "bg-red-50 text-red-700 border border-red-200",
    dotClass: "bg-red-500",
  },
  expired:  {
    label: "Scaduto",
    className: "bg-red-50 text-red-700 border border-red-200",
    dotClass: "bg-red-500",
  },
  expiring: {
    label: "In scadenza",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dotClass: "bg-amber-500",
  },
  valid:    {
    label: "Valido",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dotClass: "bg-emerald-500",
  },
};
