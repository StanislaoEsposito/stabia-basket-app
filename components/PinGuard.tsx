"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────
   Costanti
───────────────────────────────────────────── */
// Il PIN è letto dalla variabile d'ambiente NEXT_PUBLIC_ADMIN_PIN.
// Se non definita, usa "1234" come fallback di sviluppo.
// ⚠️  Aggiungi al file .env.local:  NEXT_PUBLIC_ADMIN_PIN=tuoPin
const CORRECT_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1234";

// Chiave sessionStorage: sblocco persiste fino alla chiusura del tab
const SESSION_KEY = "stabia_basket_unlocked_v1";

/* ─────────────────────────────────────────────
   Dot indicator — PIN visivo
───────────────────────────────────────────── */
function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <div className="flex justify-center gap-3 mb-6">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-200 ${
            i < filled ? "bg-[#0A1F44] scale-110" : "bg-[#E2E8F0]"
          }`}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PinGuard — componente wrapper
───────────────────────────────────────────── */
interface PinGuardProps {
  children: React.ReactNode;
  sectionName?: string;
}

export default function PinGuard({
  children,
  sectionName = "Sezione Protetta",
}: PinGuardProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Controlla sessionStorage dopo l'hydration (evita SSR mismatch)
  useEffect(() => {
    setHydrated(true);
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "true") {
        setUnlocked(true);
      }
    } catch {
      // sessionStorage non disponibile (es. incognito con restrizioni)
    }
  }, []);

  const handleUnlock = useCallback(() => {
    if (pin === CORRECT_PIN) {
      try { sessionStorage.setItem(SESSION_KEY, "true"); } catch { /* noop */ }
      setUnlocked(true);
      setError(null);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(
        newAttempts >= 3
          ? `PIN errato (${newAttempts} tentativi). Contatta il responsabile.`
          : "PIN errato. Riprova."
      );
      setPin("");
    }
  }, [pin, attempts]);

  const handleLock = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
    setUnlocked(false);
    setPin("");
    setError(null);
    setAttempts(0);
  };

  // Loader di hydration
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
      </div>
    );
  }

  // Contenuto sbloccato — aggiunge tasto "Blocca" in overlay
  if (unlocked) {
    return (
      <div className="relative">
        {/* Tasto ri-blocca */}
        <button
          onClick={handleLock}
          className="fixed bottom-5 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full
                     bg-[#0A1F44] text-white text-xs font-semibold shadow-lg
                     hover:bg-[#122558] transition-colors"
          title="Blocca sezione"
        >
          <Lock className="w-3 h-3" /> Blocca
        </button>
        {children}
      </div>
    );
  }

  // Schermata PIN
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-[#E2E8F0] p-8 w-full max-w-sm">
        {/* Icona */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#0A1F44] rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10 text-[#F5B800]" />
          </div>
        </div>

        {/* Testi */}
        <h1 className="text-xl font-extrabold text-[#0A1F44] text-center mb-1">
          {sectionName}
        </h1>
        <p className="text-sm text-[#94A3B8] text-center mb-6">
          Inserisci il PIN amministratore per accedere.
        </p>

        {/* Indicatori dots (basati su lunghezza PIN corretto) */}
        <PinDots length={CORRECT_PIN.length} filled={pin.length} />

        {/* Input PIN */}
        <div className="relative mb-4">
          <input
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            maxLength={CORRECT_PIN.length + 2}
            placeholder="••••"
            autoFocus
            className={`
              w-full text-center text-3xl font-mono tracking-[0.6em] px-4 py-4 pr-12
              rounded-2xl border-2 transition-colors
              focus:outline-none bg-[#F8FAFC] text-[#0A1F44]
              ${error
                ? "border-red-400 bg-red-50"
                : pin.length > 0
                ? "border-[#0A1F44]"
                : "border-[#E2E8F0] focus:border-[#0A1F44]"
              }
            `}
          />
          <button
            type="button"
            onClick={() => setShowPin((p) => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
            aria-label={showPin ? "Nascondi PIN" : "Mostra PIN"}
          >
            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Errore */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-xl border border-red-200 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Bottone sblocca */}
        <Button
          variant="primary"
          size="lg"
          className="w-full gap-2"
          onClick={handleUnlock}
          disabled={pin.length === 0}
        >
          <ShieldCheck className="w-5 h-5" />
          Sblocca
        </Button>

        {/* Tasto cancella */}
        {pin.length > 0 && (
          <button
            onClick={() => { setPin(""); setError(null); }}
            className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#64748B] transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Cancella
          </button>
        )}

        <p className="text-xs text-[#CBD5E1] text-center mt-5">
          PIN dimenticato? Contatta il responsabile.
        </p>
      </div>
    </div>
  );
}
