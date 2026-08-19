"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, Trophy } from "lucide-react";

/* ── Lista squadre ── */
const TEAMS = [
  { name: "DIV. REG. 1",           category: "Seniores" },
  { name: "U19 GOLD",              category: "Under 19" },
  { name: "U17 GOLD",              category: "Under 17" },
  { name: "U19 LIBERTAS/U17 SILVER", category: "Under 17–19" },
  { name: "U14 SILVER",            category: "Under 14" },
  { name: "U13 SILVER",            category: "Under 13" },
  { name: "ESORDIENTI",            category: "Minibasket" },
  { name: "AQUILOTTI 2016",        category: "BTS" },
  { name: "AQUILOTTI 2017",        category: "BTS" },
  { name: "PULCINI B. CECCHI",     category: "B. Cecchi" },
  { name: "SCOIATTOLI B. CECCHI",  category: "B. Cecchi" },
  { name: "AQUILOTTI B. CECCHI",   category: "B. Cecchi" },
  { name: "PULCINI CICERONE",      category: "Cicerone" },
  { name: "SCOIATTOLI CICERONE",   category: "Cicerone" },
  { name: "AQUILOTTI CICERONE",    category: "Cicerone" },
  { name: "PULCINI DI CAPUA",      category: "Di Capua" },
  { name: "SCOIATTOLI DI CAPUA",   category: "Di Capua" },
];

/* Colori per categoria (pill badge) */
const CATEGORY_COLORS: Record<string, string> = {
  "Seniores":   "bg-[#0A1F44] text-white",
  "Under 19":   "bg-blue-700 text-white",
  "Under 17":   "bg-blue-600 text-white",
  "Under 17–19":"bg-blue-500 text-white",
  "Under 14":   "bg-indigo-500 text-white",
  "Under 13":   "bg-violet-500 text-white",
  "Minibasket": "bg-emerald-600 text-white",
  "BTS":        "bg-[#F5B800] text-[#0A1F44]",
  "B. Cecchi":  "bg-orange-500 text-white",
  "Cicerone":   "bg-teal-600 text-white",
  "Di Capua":   "bg-rose-500 text-white",
};

export default function HomePage() {
  const router = useRouter();

  const handleTeamSelect = (teamName: string) => {
    router.push(`/dashboard?team=${encodeURIComponent(teamName)}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">

      {/* ── Hero Header ── */}
      <div className="bg-[#0A1F44] text-white pb-10 pt-10 px-4 text-center relative overflow-hidden">
        {/* Cerchi decorativi di sfondo */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[#F5B800]/10" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-[#F5B800]/8" />
        <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-white/5" />

        {/* Doppio logo: Maschile + Femminile */}
        <div className="relative flex items-center justify-center gap-4 sm:gap-6 mb-4">
          <Image
            src="/logo.png"
            alt="Stabia Basket BTS – Maschile"
            width={140}
            height={140}
            className="w-28 sm:w-32 h-auto object-contain drop-shadow-2xl max-w-[38vw]"
            priority
          />
          <Image
            src="/logo-femminile.png"
            alt="Stabia Basket NPS – Femminile"
            width={140}
            height={140}
            className="w-28 sm:w-32 h-auto object-contain drop-shadow-2xl max-w-[38vw]"
            priority
          />
        </div>

        {/* Titolo */}
        <h1 className="relative text-2xl font-extrabold tracking-tight mb-1">
          Stabia Basket
        </h1>
        <p className="relative text-[#F5B800] text-sm font-semibold tracking-widest uppercase">
          BTS &amp; NPS
        </p>
        <p className="relative mt-3 text-white/60 text-sm">
          Seleziona la tua squadra per continuare
        </p>
      </div>

      {/* ── Lista Squadre ── */}
      <div className="flex-1 max-w-lg w-full mx-auto px-4 mt-6 pb-10">

        {/* Card contenitore */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] overflow-hidden">
          {/* Intestazione lista */}
          <div className="px-5 py-5 border-b border-[#E2E8F0] flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#F5B800]/15 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-[#F5B800]" />
            </div>
            <span className="text-sm font-bold text-[#0A1F44] tracking-wide">
              {TEAMS.length} Squadre disponibili
            </span>
          </div>

          {/* Righe squadre */}
          <ul className="divide-y divide-[#F4F6F9]">
            {TEAMS.map((team, index) => (
              <li key={team.name}>
                <button
                  onClick={() => handleTeamSelect(team.name)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left
                             hover:bg-[#F4F6F9] active:bg-[#E2E8F0]
                             transition-colors duration-150 group
                             focus:outline-none focus-visible:bg-[#F4F6F9]"
                  aria-label={`Seleziona squadra ${team.name}`}
                >
                  {/* Numero */}
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F4F6F9] group-hover:bg-[#E2E8F0]
                                   text-[#94A3B8] text-xs font-bold flex items-center justify-center
                                   transition-colors duration-150">
                    {index + 1}
                  </span>

                  {/* Nome squadra */}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[#0A1F44] text-sm block truncate
                                     group-hover:text-[#122558] transition-colors">
                      {team.name}
                    </span>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                                      ${CATEGORY_COLORS[team.category]}`}>
                      {team.category}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    className="flex-shrink-0 w-4 h-4 text-[#CBD5E1] group-hover:text-[#F5B800]
                                 group-hover:translate-x-0.5 transition-all duration-150"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#94A3B8] mt-6">
          © 2024 Stabia Basket BTS &amp; NPS · Tutti i diritti riservati
        </p>
      </div>
    </div>
  );
}
