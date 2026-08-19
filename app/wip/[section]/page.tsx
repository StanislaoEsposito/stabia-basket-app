"use client";

import { useSearchParams, useParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  ShoppingBag,
  BadgeCheck,
  PartyPopper,
  Euro,
  Wrench,
  ArrowLeft,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";

/* ── Mappa sezione → titolo + icona + colori ── */
const SECTION_META: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    description: string;
  }
> = {
  anagrafica: {
    label: "Anagrafica",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    description: "Gestione dei profili e dei dati anagrafici dei tesserati.",
  },
  allenamenti: {
    label: "Allenamenti",
    icon: CalendarCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    description: "Registro presenze, programma settimanale e note allenamenti.",
  },
  convocazioni: {
    label: "Convocazioni Partite",
    icon: ClipboardList,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    description: "Creazione liste convocati e gestione partite ufficiali.",
  },
  certificati: {
    label: "Certificati Medici",
    icon: HeartPulse,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    description: "Monitoraggio scadenze e archiviazione documenti medici.",
  },
  abbigliamento: {
    label: "Abbigliamento",
    icon: ShoppingBag,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    description: "Gestione taglie, ordini e consegna divise.",
  },
  tesseramento: {
    label: "Tesseramento",
    icon: BadgeCheck,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    description: "Stato tesseramenti FIP e documenti richiesti.",
  },
  eventi: {
    label: "Eventi",
    icon: PartyPopper,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    description: "Calendario eventi, tornei e feste societarie.",
  },
  quote: {
    label: "Quote Associative",
    icon: Euro,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    description: "Riscossione quote, storico pagamenti e solleciti.",
  },
};

/* ── Contenuto WIP ── */
function WipContent() {
  const params = useParams<{ section: string }>();
  const searchParams = useSearchParams();

  const sectionId = params.section ?? "unknown";
  const teamName = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  const meta = SECTION_META[sectionId];
  const Icon = meta?.icon ?? Wrench;
  const label = meta?.label ?? sectionId;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <AppHeader
        title={teamName}
        subtitle={label}
        showBack
        backHref={`/dashboard?team=${teamParam}`}
        backLabel="Dashboard"
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Icona sezione */}
        <div
          className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-md
                       ${meta?.iconBg ?? "bg-gray-100"}`}
        >
          <Icon
            className={`w-12 h-12 ${meta?.iconColor ?? "text-gray-500"}`}
            strokeWidth={1.5}
          />
        </div>

        {/* Titolo */}
        <h1 className="text-2xl font-extrabold text-[#0A1F44] text-center mb-2">
          {label}
        </h1>

        {/* Descrizione */}
        {meta?.description && (
          <p className="text-sm text-[#64748B] text-center max-w-xs mb-8">
            {meta.description}
          </p>
        )}

        {/* Badge WIP */}
        <div className="flex flex-col items-center gap-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-8 py-7 max-w-sm w-full">
          <div className="flex items-center gap-2 bg-[#F5B800]/15 text-[#D4A000] px-4 py-2 rounded-full">
            <Wrench className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">
              In sviluppo
            </span>
          </div>

          <p className="text-center text-sm text-[#64748B]">
            Questa sezione è attualmente in fase di sviluppo.
            Tornerà disponibile nelle prossime versioni dell&apos;app.
          </p>

          {/* Barra di progresso fittizia */}
          <div className="w-full">
            <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
              <span>Progresso Fase 1</span>
              <span>In corso…</span>
            </div>
            <div className="h-2 bg-[#F4F6F9] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0A1F44] to-[#F5B800] rounded-full"
                style={{ width: "35%" }}
              />
            </div>
          </div>
        </div>

        {/* Tasto Indietro */}
        <div className="mt-8">
          <Link href={`/dashboard?team=${teamParam}`}>
            <Button variant="primary" size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Torna alla Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ── Export con Suspense ── */
export default function WipPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
        </div>
      }
    >
      <WipContent />
    </Suspense>
  );
}
