"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toggle switch riutilizzabile — dimensioni garantite senza overflow.
 *
 * Matematica verificata:
 *  Container: w-11 (44px) × h-6 (24px)
 *  Thumb:     w-5  (20px) × h-5 (20px)
 *  Inattivo:  left-0.5 (2px)  → thumb occupa [2, 22]px ✓
 *  Attivo:    translate-x-5 (20px) → thumb occupa [22, 42]px < 44px ✓
 */
interface ToggleSwitchProps {
  active: boolean;
  onToggle: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Colore del track quando attivo */
  colorActive?: "emerald" | "navy";
  ariaLabel?: string;
  className?: string;
}

export function ToggleSwitch({
  active,
  onToggle,
  loading = false,
  disabled = false,
  colorActive = "emerald",
  ariaLabel,
  className,
}: ToggleSwitchProps) {
  const trackColor = active
    ? colorActive === "emerald"
      ? "bg-emerald-500 shadow-sm shadow-emerald-200"
      : "bg-[#0A1F44] shadow-sm shadow-blue-200"
    : "bg-[#D1D5DB]";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      onClick={onToggle}
      disabled={disabled || loading}
      className={cn(
        // Dimensioni fisse — NON modificare senza ricalcolare la traslazione
        "relative flex-shrink-0 w-11 h-6 rounded-full",
        "transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A1F44]",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        trackColor,
        className
      )}
    >
      {loading ? (
        <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 text-white animate-spin" />
      ) : (
        <span
          className={cn(
            // Thumb — top-0.5 left-0.5 per centratura precisa
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md",
            "transition-transform duration-200 ease-in-out",
            active ? "translate-x-5" : "translate-x-0"
          )}
        />
      )}
    </button>
  );
}
