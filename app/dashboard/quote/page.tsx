"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Euro } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import PinGuard from "@/components/PinGuard";

function QuoteContent() {
  const searchParams = useSearchParams();
  const teamName = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  return (
    <PinGuard sectionName="Quote Associative">
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
        <AppHeader
          title="Stabia Basket BTS & NPS"
          subtitle={`Quote · ${teamName}`}
          showBack
          backHref={`/dashboard?team=${teamParam}`}
          backLabel="Dashboard"
        />

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
          {/* Icona */}
          <div className="w-24 h-24 rounded-3xl bg-teal-100 flex items-center justify-center mb-6 shadow-md">
            <Euro className="w-12 h-12 text-teal-600" strokeWidth={1.5} />
          </div>

          {/* Titolo */}
          <h1 className="text-2xl font-extrabold text-[#0A1F44] mb-2">
            Quote Associative
          </h1>
          <p className="text-sm font-semibold text-[#0A1F44] mb-6">{teamName}</p>

          {/* Card WIP */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-8 py-7 max-w-sm w-full">
            <div className="inline-flex items-center gap-2 bg-[#F5B800]/15 text-[#D4A000] px-4 py-2 rounded-full mb-4">
              <span className="text-sm font-bold uppercase tracking-wider">In sviluppo</span>
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Sezione in fase di sviluppo.
              <br />
              Le funzionalità di gestione quote, pagamenti e storico saranno disponibili nelle prossime versioni.
            </p>
            <div className="mt-5 pt-4 border-t border-[#F4F6F9]">
              <p className="text-xs text-[#94A3B8] font-medium">Funzionalità previste:</p>
              <ul className="mt-2 text-xs text-[#94A3B8] space-y-1 text-left list-none">
                {["Riscossione quote mensili", "Storico pagamenti per giocatore", "Solleciti automatici", "Export PDF riepilogo"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </PinGuard>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
      </div>
    }>
      <QuoteContent />
    </Suspense>
  );
}
