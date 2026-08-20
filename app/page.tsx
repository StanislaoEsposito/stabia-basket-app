"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, Trophy, ArrowLeft } from "lucide-react";

/* ── Lista squadre ── */
const TEAMS = [
  // Maschile
  { name: "DIV. REG. 1",             category: "NPS", sector: "maschile" },
  { name: "U19 GOLD",                category: "NPS", sector: "maschile" },
  { name: "U17 GOLD",                category: "NPS", sector: "maschile" },
  { name: "U19 LIBERTAS/U17 SILVER", category: "NPS", sector: "maschile" },
  { name: "U14 SILVER",              category: "BTS", sector: "maschile" },
  { name: "U13 SILVER",              category: "BTS", sector: "maschile" },
  { name: "ESORDIENTI",              category: "BTS", sector: "maschile" },
  // Femminile
  { name: "SERIE B FEMM.",           category: "BFS", sector: "femminile" },
  { name: "U19 FEMM.",               category: "BFS", sector: "femminile" },
  { name: "U15 FEMM.",               category: "BFS", sector: "femminile" },
  // Minibasket
  { name: "AQUILOTTI 2016",          category: "MiniBasket", sector: "minibasket" },
  { name: "AQUILOTTI 2017",          category: "MiniBasket", sector: "minibasket" },
  { name: "PULCINI B. CECCHI",       category: "B. Cecchi", sector: "minibasket" },
  { name: "SCOIATTOLI B. CECCHI",    category: "B. Cecchi", sector: "minibasket" },
  { name: "AQUILOTTI B. CECCHI",     category: "B. Cecchi", sector: "minibasket" },
  { name: "PULCINI CICERONE",        category: "Cicerone", sector: "minibasket" },
  { name: "SCOIATTOLI CICERONE",     category: "Cicerone", sector: "minibasket" },
  { name: "AQUILOTTI CICERONE",      category: "Cicerone", sector: "minibasket" },
  { name: "PULCINI DI CAPUA",        category: "Di Capua", sector: "minibasket" },
  { name: "SCOIATTOLI DI CAPUA",     category: "Di Capua", sector: "minibasket" },
];

/* Colori per categoria (pill badge) */
const CATEGORY_COLORS: Record<string, string> = {
  "NPS":        "bg-blue-600 text-white",
  "BFS":        "bg-pink-500 text-white",
  "BTS":        "bg-[#F5B800] text-[#0A1F44]",
  "MiniBasket": "bg-emerald-600 text-white",
  "B. Cecchi":  "bg-orange-500 text-white",
  "Cicerone":   "bg-teal-600 text-white",
  "Di Capua":   "bg-rose-500 text-white",
};

const SECTORS = [
  {
    id: 'maschile',
    label: 'Settore Maschile (BTS & NPS)',
    logo: '/logo.png',
  },
  {
    id: 'femminile',
    label: 'Settore Femminile (BFS)',
    logo: '/logo-femminile.png',
  },
  {
    id: 'minibasket',
    label: 'Settore Minibasket',
    logo: '/MINIBASKETLOGO.png',
  }
];

export default function HomePage() {
  const router = useRouter();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const handleTeamSelect = (teamName: string) => {
    router.push(`/dashboard?team=${encodeURIComponent(teamName)}`);
  };

  const filteredTeams = selectedSector 
    ? TEAMS.filter(t => t.sector === selectedSector) 
    : [];

  const activeSectorData = SECTORS.find(s => s.id === selectedSector);

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-slate-50">

      {/* ── Header (Blu) ── */}
      <header className="shrink-0 bg-[#0A1F44] flex flex-col items-center pt-8 pb-6 rounded-b-[2rem] relative transition-all duration-300">
        {/* Cerchi decorativi di sfondo */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[#F5B800]/10 pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-[#F5B800]/8 pointer-events-none" />
        <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

        {/* Contenuto dinamico Header */}
        {!selectedSector ? (
          <>
            <div className="relative z-10 flex flex-col items-center gap-2 mb-3">
              {/* Prima riga del triangolo */}
              <div className="flex gap-4">
                <Image
                  src="/logo.png"
                  alt="Stabia Basket BTS"
                  width={140}
                  height={140}
                  className="w-20 sm:w-24 h-auto object-contain drop-shadow-lg"
                  priority
                />
                <Image
                  src="/logo-femminile.png"
                  alt="Stabia Basket NPS"
                  width={140}
                  height={140}
                  className="w-20 sm:w-24 h-auto object-contain drop-shadow-lg"
                  priority
                />
              </div>
              {/* Seconda riga del triangolo */}
              <Image
                src="/MINIBASKETLOGO.png"
                alt="Stabia Basket Minibasket"
                width={140}
                height={140}
                className="w-20 sm:w-24 h-auto object-contain drop-shadow-lg"
                priority
              />
            </div>
            <h1 className="relative z-10 text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-1">
              Stabia Basket
            </h1>
            <p className="relative z-10 text-white/60 text-xs sm:text-sm">
              Scegli il settore per continuare
            </p>
          </>
        ) : (
          <>
            <div className="relative z-10 flex items-center justify-center mb-3">
              <Image
                src={activeSectorData?.logo || ""}
                alt={activeSectorData?.label || ""}
                width={100}
                height={100}
                className="w-16 sm:w-20 h-auto object-contain drop-shadow-xl"
                priority
              />
            </div>
            <h1 className="relative z-10 text-lg sm:text-xl font-extrabold tracking-tight text-white mb-1">
              {activeSectorData?.label}
            </h1>
            <p className="relative z-10 text-white/60 text-xs sm:text-sm">
              Seleziona la tua squadra
            </p>
          </>
        )}
      </header>

      {/* ── Main (Pulsanti o Lista) ── */}
      <main className="flex-1 w-full max-w-md mx-auto flex flex-col justify-start pt-8 px-4 gap-4">
        {!selectedSector ? (
          /* Cards per scegliere il settore */
          <>
            {SECTORS.map((sector) => (
              <button
                key={sector.id}
                onClick={() => setSelectedSector(sector.id)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-row items-center justify-start gap-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
              >
                <div className="w-16 h-16 flex-shrink-0 relative flex items-center justify-center">
                  <Image
                    src={sector.logo}
                    alt={sector.label}
                    fill
                    className="object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-[#0A1F44] font-bold text-sm text-left tracking-tight leading-tight">
                  {sector.label}
                </h3>
              </button>
            ))}
          </>
        ) : (
          /* Lista Squadre per il settore scelto */
          <div className="flex flex-col w-full h-full min-h-0 pb-2">
            <button
              onClick={() => setSelectedSector(null)}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0A1F44] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna alle categorie
            </button>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-0">
              {/* Intestazione lista */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 flex-shrink-0">
                <div className="w-6 h-6 rounded-lg bg-[#F5B800]/15 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-3 h-3 text-[#F5B800]" />
                </div>
                <span className="text-sm font-bold text-[#0A1F44] tracking-wide">
                  {filteredTeams.length} Squadre disponibili
                </span>
              </div>

              {/* Righe squadre (scroll confinato qui) */}
              <ul className="divide-y divide-slate-100 overflow-y-auto min-h-0">
                {filteredTeams.map((team, index) => (
                  <li key={team.name}>
                    <button
                      onClick={() => handleTeamSelect(team.name)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 group focus:outline-none"
                      aria-label={`Seleziona squadra ${team.name}`}
                    >
                      {/* Numero */}
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 group-hover:bg-slate-200 text-slate-400 text-[10px] font-bold flex items-center justify-center transition-colors duration-150">
                        {index + 1}
                      </span>

                      {/* Nome squadra */}
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-[#0A1F44] text-sm block truncate group-hover:text-[#122558] transition-colors">
                          {team.name}
                        </span>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${CATEGORY_COLORS[team.category]}`}>
                          {team.category}
                        </span>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="flex-shrink-0 w-4 h-4 text-slate-300 group-hover:text-[#F5B800] group-hover:translate-x-0.5 transition-all duration-150" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 py-6 text-center">
        <p className="text-[10px] text-slate-400">
          © 2024 Stabia Basket BTS &amp; NPS
        </p>
      </footer>
    </div>
  );
}
