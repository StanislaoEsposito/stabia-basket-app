"use client";

import { useSearchParams, useRouter } from "next/navigation";
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
  Lock,
  ChevronRight,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";

/* ── Definizione sezioni ── */
interface Section {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  locked?: boolean;
}

const SECTIONS: Section[] = [
  {
    id: "anagrafica",
    label: "Anagrafica",
    description: "Gestione tesserati e profili",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "allenamenti",
    label: "Allenamenti",
    description: "Presenze e programma allenamenti",
    icon: CalendarCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "convocazioni",
    label: "Convocazioni Partite",
    description: "Liste e gestione convocati",
    icon: ClipboardList,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: "certificati",
    label: "Certificati Medici",
    description: "Scadenze e documenti medici",
    icon: HeartPulse,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  {
    id: "abbigliamento",
    label: "Abbigliamento",
    description: "Taglie e ordini divise",
    icon: ShoppingBag,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "tesseramento",
    label: "Tesseramento",
    description: "Stato e documenti tesseramenti",
    icon: BadgeCheck,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    id: "eventi",
    label: "Eventi",
    description: "Calendario eventi e feste",
    icon: PartyPopper,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    locked: true,
  },
  {
    id: "quote",
    label: "Quote Associative",
    description: "Pagamenti e quote societa",
    icon: Euro,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    locked: true,
  },
];

/* ── Card singola sezione ── */
function SectionCard({
  section,
  teamParam,
}: {
  section: Section;
  teamParam: string;
}) {
  const Icon = section.icon;
  const DEFINITIVE_ROUTES: Record<string, string> = {
    anagrafica:    `/dashboard/anagrafica?team=${teamParam}`,
    allenamenti:   `/dashboard/allenamenti?team=${teamParam}`,
    convocazioni:  `/dashboard/convocazioni?team=${teamParam}`,
    certificati:   `/dashboard/certificati?team=${teamParam}`,
    tesseramento:  `/dashboard/tesseramento?team=${teamParam}`,
    abbigliamento: `/dashboard/abbigliamento?team=${teamParam}`,
    eventi:        `/dashboard/eventi?team=${teamParam}`,
    quote:         `/dashboard/quote?team=${teamParam}`,
  };
  const href = DEFINITIVE_ROUTES[section.id] ?? `/wip/${section.id}?team=${teamParam}`;

  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl border border-[#E2E8F0]
                 shadow-sm hover:shadow-md hover:-translate-y-0.5
                 active:scale-[0.98] active:shadow-sm
                 transition-all duration-200 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-[#0A1F44] focus-visible:ring-offset-2"
      aria-label={`Vai a ${section.label}`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Icona */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                       ${section.iconBg} group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon className={`w-6 h-6 ${section.iconColor}`} strokeWidth={1.8} />
        </div>

        {/* Testo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0A1F44] text-sm leading-tight">
              {section.label}
            </span>
            {section.locked && (
              <span title="Richiede PIN">
                <Lock className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />
              </span>
            )}
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
            {section.description}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight
          className="flex-shrink-0 w-4 h-4 text-[#CBD5E1]
                       group-hover:text-[#F5B800] group-hover:translate-x-0.5
                       transition-all duration-200"
        />
      </div>
    </Link>
  );
}

/* ── Dashboard Content ── */
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamName = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <AppHeader
        title="Stabia Basket BTS & NPS"
        subtitle={teamName}
        showBack
        backHref="/"
        backLabel="Cambia Squadra"
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-10">
        {/* Benvenuto */}
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-[#0A1F44]">
            Ciao, Coach! 👋
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Seleziona una sezione da gestire per{" "}
            <span className="font-semibold text-[#0A1F44]">{teamName}</span>
          </p>
        </div>

        {/* Griglia sezioni — 1 col mobile / 2 col tablet / 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SECTIONS.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              teamParam={teamParam}
            />
          ))}
        </div>

        {/* Info Lucchetto */}
        <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-[#E2E8F0]">
          <Lock className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
          <p className="text-xs text-[#94A3B8]">
            Le sezioni con <span className="font-semibold">🔒</span> richiedono
            un PIN di accesso.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ── Export con Suspense (richiesto da useSearchParams) ── */
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
            <p className="text-sm text-[#64748B]">Caricamento...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
