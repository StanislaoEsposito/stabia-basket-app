"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  Users,
  FileDown,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  HeartPulse,
  Euro,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Check,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase, type PlayerWithTeam } from "@/lib/supabase";
import { getExpiryStatus, EXPIRY_BADGE, type ExpiryStatus } from "@/lib/dateUtils";

/* ─────────────────────────────────────────────
   Costanti colori per badge gruppo
───────────────────────────────────────────── */
const GROUP_COLORS: Record<string, string> = {
  "AQUILOTTI":  "bg-sky-100 text-sky-800 border-sky-200",
  "PULCINI":    "bg-emerald-100 text-emerald-800 border-emerald-200",
  "SCOIATTOLI": "bg-orange-100 text-orange-800 border-orange-200",
  "ESORDIENTI": "bg-purple-100 text-purple-800 border-purple-200",
};

function getGroupBadgeClass(teamName: string): string {
  const upper = teamName.toUpperCase();
  for (const key of Object.keys(GROUP_COLORS)) {
    if (upper.includes(key)) return GROUP_COLORS[key];
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

/* ─────────────────────────────────────────────
   Utilità formattazione
───────────────────────────────────────────── */
function formatDob(dob: string | null): string {
  if (!dob) return "—";
  try {
    return format(parseISO(dob), "dd/MM/yyyy", { locale: it });
  } catch {
    return dob;
  }
}

function getBirthYear(dob: string | null): string | null {
  if (!dob) return null;
  const trimmed = dob.trim();
  if (trimmed.length >= 4) return trimmed.slice(0, 4);
  return null;
}

/* ─────────────────────────────────────────────
   Componente: Badge Gruppo / Squadra
───────────────────────────────────────────── */
function TeamBadge({ name }: { name: string }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap border ${getGroupBadgeClass(
        name
      )}`}
    >
      {name}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Componente: Badge Certificato Medico
───────────────────────────────────────────── */
function MedicalBadge({ date }: { date: string | null }) {
  const status = getExpiryStatus(date);
  const badge = EXPIRY_BADGE[status];
  const dateFormatted = date ? formatDob(date) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border ${badge.className}`}
      title={dateFormatted ? `Scadenza: ${dateFormatted}` : "Certificato medico non inserito"}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
      <span>{badge.label}</span>
      {dateFormatted && <span className="opacity-75 font-mono text-[10px]">({dateFormatted})</span>}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Componente: Mini Pills Rate Minibasket (4 rate)
───────────────────────────────────────────── */
function RatePillsSummary({ player }: { player: PlayerWithTeam }) {
  const rates = [
    { label: "R1", paid: player.p_rata_1 ?? false },
    { label: "R2", paid: player.p_rata_2 ?? false },
    { label: "R3", paid: player.p_rata_3 ?? false },
    { label: "R4", paid: player.p_rata_4 ?? false },
  ];

  return (
    <div className="flex items-center gap-1">
      {rates.map((r, i) => (
        <span
          key={i}
          title={`Rata ${i + 1}: ${r.paid ? "Pagata" : "In attesa"}`}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-colors select-none ${
            r.paid
              ? "bg-emerald-500 border-emerald-600 text-white shadow-xs"
              : "bg-slate-100 border-slate-300 text-slate-400"
          }`}
        >
          {r.paid ? <Check className="w-3 h-3 stroke-[3]" /> : r.label}
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tipi per ordinamento e filtri
───────────────────────────────────────────── */
type SortField = "last_name" | "first_name" | "dob" | "team_name" | "med_expiry";

type MedicalFilter = "all" | "valid" | "expiring" | "irregular";
type PaymentFilter = "all" | "paid_all" | "has_pending" | "missing_r1" | "missing_r2" | "missing_r3" | "missing_r4";
type CategoryFilter = "all" | "AQUILOTTI" | "PULCINI" | "SCOIATTOLI" | "ESORDIENTI";

/* ─────────────────────────────────────────────
   Componente: Tabella DESKTOP
───────────────────────────────────────────── */
function MinibasketTable({
  players,
  sortField,
  sortAsc,
  onSort,
}: {
  players: PlayerWithTeam[];
  sortField: SortField;
  sortAsc: boolean;
  onSort: (field: SortField) => void;
}) {
  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortAsc ? (
        <ChevronUp className="w-3 h-3 inline ml-1" />
      ) : (
        <ChevronDown className="w-3 h-3 inline ml-1" />
      )
    ) : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="text-center px-3 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider w-10">
                #
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer hover:text-[#0A1F44] select-none"
                onClick={() => onSort("last_name")}
              >
                Cognome <SortIcon field="last_name" />
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer hover:text-[#0A1F44] select-none"
                onClick={() => onSort("first_name")}
              >
                Nome <SortIcon field="first_name" />
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer hover:text-[#0A1F44] select-none"
                onClick={() => onSort("dob")}
              >
                Nascita <SortIcon field="dob" />
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer hover:text-[#0A1F44] select-none"
                onClick={() => onSort("team_name")}
              >
                Gruppo / Squadra <SortIcon field="team_name" />
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer hover:text-[#0A1F44] select-none"
                onClick={() => onSort("med_expiry")}
              >
                Certificato Medico <SortIcon field="med_expiry" />
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Quote (4 Rate)
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Contatti
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, i) => {
              const birthYear = getBirthYear(player.dob);
              return (
                <tr
                  key={player.id}
                  className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-3 py-3 text-xs text-[#94A3B8] font-mono text-center">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#0A1F44] uppercase whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{player.last_name}</span>
                      {player.is_captain && (
                        <span
                          className="bg-[#F5B800]/20 text-[#D97706] text-[10px] font-extrabold px-1.5 py-0.2 rounded"
                          title="Capitano"
                        >
                          (C)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#334155] uppercase font-medium whitespace-nowrap">
                    {player.first_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-[#64748B]">{formatDob(player.dob)}</span>
                      {birthYear && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[#0A1F44] text-[10px] font-bold">
                          {birthYear}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TeamBadge name={player.team_name} />
                  </td>
                  <td className="px-4 py-3">
                    <MedicalBadge date={player.med_expiry} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <RatePillsSummary player={player} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">
                    {player.phone_parent ? (
                      <a
                        href={`tel:${player.phone_parent}`}
                        className="inline-flex items-center gap-1 hover:text-[#0A1F44] hover:underline"
                        title="Chiama genitore"
                      >
                        <Phone className="w-3 h-3 text-[#94A3B8]" />
                        <span>{player.phone_parent}</span>
                      </a>
                    ) : player.phone_athlete ? (
                      <span className="text-[#94A3B8]">{player.phone_athlete}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente: Card MOBILE
───────────────────────────────────────────── */
function MinibasketCard({
  player,
  index,
}: {
  player: PlayerWithTeam;
  index: number;
}) {
  const birthYear = getBirthYear(player.dob);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col gap-3">
      {/* Intestazione Card: Numero, Nome, Badge Squadra */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0A1F44] text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-extrabold text-[#0A1F44] text-sm leading-tight uppercase truncate">
              {player.last_name} {player.first_name}
              {player.is_captain && (
                <span className="ml-1 text-[10px] bg-[#F5B800]/20 text-[#D97706] px-1.5 py-0.2 rounded font-bold">
                  (C)
                </span>
              )}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5">
              <span>{player.dob ? formatDob(player.dob) : "Nascita N/D"}</span>
              {birthYear && (
                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[#0A1F44] text-[10px] font-bold">
                  leva {birthYear}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <TeamBadge name={player.team_name} />
        </div>
      </div>

      {/* Dettagli: Certificato & Quote */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div>
          <MedicalBadge date={player.med_expiry} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Quote:</span>
          <RatePillsSummary player={player} />
        </div>
      </div>

      {/* Contatto Genitore (se presente) */}
      {player.phone_parent && (
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-50 text-slate-600">
          <span className="text-[11px] text-slate-400">Contatto Genitore:</span>
          <a
            href={`tel:${player.phone_parent}`}
            className="font-semibold text-[#0A1F44] flex items-center gap-1 hover:underline"
          >
            <Phone className="w-3 h-3 text-[#F5B800]" />
            {player.phone_parent}
          </a>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente principale: MinibasketContent
───────────────────────────────────────────── */
function MinibasketContent() {
  const [players, setPlayers]       = useState<PlayerWithTeam[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Filtri
  const [search, setSearch]                 = useState("");
  const [filterTeam, setFilterTeam]         = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>("all");
  const [filterYear, setFilterYear]         = useState<string>("all");
  const [filterMedical, setFilterMedical]   = useState<MedicalFilter>("all");
  const [filterPayment, setFilterPayment]   = useState<PaymentFilter>("all");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Ordinamento
  const [sortField, setSortField] = useState<SortField>("last_name");
  const [sortAsc, setSortAsc]     = useState(true);

  /* ── Carica dati da Supabase ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*, teams!inner(id, name, is_minibasket)")
        .eq("teams.is_minibasket", true)
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: PlayerWithTeam[] = (data ?? []).map((row: any) => ({
        ...row,
        team_name: row.teams?.name ?? "—",
      }));

      setPlayers(mapped);
    } catch (err) {
      console.error("Errore caricamento atleti minibasket:", err);
      setLoadError(
        "Errore nel caricamento dei dati Minibasket. Verifica la connessione a Supabase e che il flag is_minibasket sia impostato."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Opzioni dinamiche derivate dai dati ── */
  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      if (p.team_name && p.team_name !== "—") set.add(p.team_name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "it"));
  }, [players]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      const y = getBirthYear(p.dob);
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a)); // Anni decrescenti
  }, [players]);

  /* ── Statistiche generali calcolate sui dati complessivi ── */
  const stats = useMemo(() => {
    let medicalIrregular = 0;
    let paymentPending = 0;
    let fullyCompliant = 0;

    players.forEach((p) => {
      const medStatus = getExpiryStatus(p.med_expiry);
      const isMedOk = medStatus === "valid";
      const isPaidOk = (p.p_rata_1 && p.p_rata_2 && p.p_rata_3 && p.p_rata_4) ?? false;

      if (medStatus === "expired" || medStatus === "missing" || medStatus === "expiring") {
        medicalIrregular++;
      }
      if (!isPaidOk) {
        paymentPending++;
      }
      if (isMedOk && isPaidOk) {
        fullyCompliant++;
      }
    });

    return {
      total: players.length,
      medicalIrregular,
      paymentPending,
      fullyCompliant,
    };
  }, [players]);

  /* ── Conteggio filtri attivi ── */
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (filterTeam !== "all") count++;
    if (filterCategory !== "all") count++;
    if (filterYear !== "all") count++;
    if (filterMedical !== "all") count++;
    if (filterPayment !== "all") count++;
    return count;
  }, [search, filterTeam, filterCategory, filterYear, filterMedical, filterPayment]);

  /* ── Reset filtri ── */
  const handleResetFilters = () => {
    setSearch("");
    setFilterTeam("all");
    setFilterCategory("all");
    setFilterYear("all");
    setFilterMedical("all");
    setFilterPayment("all");
  };

  /* ── Filtraggio atleti ── */
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // 1. Ricerca testo
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName =
          p.last_name.toLowerCase().includes(q) ||
          p.first_name.toLowerCase().includes(q) ||
          `${p.last_name} ${p.first_name}`.toLowerCase().includes(q) ||
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q);
        const matchTeam = p.team_name.toLowerCase().includes(q);
        const matchPhone =
          (p.phone_parent && p.phone_parent.includes(q)) ||
          (p.phone_athlete && p.phone_athlete.includes(q));

        if (!matchName && !matchTeam && !matchPhone) return false;
      }

      // 2. Filtro Squadra specifica
      if (filterTeam !== "all" && p.team_name !== filterTeam) {
        return false;
      }

      // 3. Filtro Categoria Minibasket (Aquilotti, Pulcini, Scoiattoli, Esordienti)
      if (filterCategory !== "all") {
        if (!p.team_name.toUpperCase().includes(filterCategory)) {
          return false;
        }
      }

      // 4. Filtro Anno di nascita
      if (filterYear !== "all") {
        const year = getBirthYear(p.dob);
        if (year !== filterYear) return false;
      }

      // 5. Filtro Certificato Medico
      if (filterMedical !== "all") {
        const status = getExpiryStatus(p.med_expiry);
        if (filterMedical === "valid" && status !== "valid") return false;
        if (filterMedical === "expiring" && status !== "expiring") return false;
        if (filterMedical === "irregular" && status !== "expired" && status !== "missing") {
          return false;
        }
      }

      // 6. Filtro Quote / Pagamenti
      if (filterPayment !== "all") {
        const r1 = p.p_rata_1 ?? false;
        const r2 = p.p_rata_2 ?? false;
        const r3 = p.p_rata_3 ?? false;
        const r4 = p.p_rata_4 ?? false;
        const allPaid = r1 && r2 && r3 && r4;

        if (filterPayment === "paid_all" && !allPaid) return false;
        if (filterPayment === "has_pending" && allPaid) return false;
        if (filterPayment === "missing_r1" && r1) return false;
        if (filterPayment === "missing_r2" && r2) return false;
        if (filterPayment === "missing_r3" && r3) return false;
        if (filterPayment === "missing_r4" && r4) return false;
      }

      return true;
    });
  }, [players, search, filterTeam, filterCategory, filterYear, filterMedical, filterPayment]);

  /* ── Ordinamento ── */
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      let va: string = "";
      let vb: string = "";

      if (sortField === "last_name") {
        va = a.last_name || "";
        vb = b.last_name || "";
      } else if (sortField === "first_name") {
        va = a.first_name || "";
        vb = b.first_name || "";
      } else if (sortField === "dob") {
        va = a.dob || "";
        vb = b.dob || "";
      } else if (sortField === "team_name") {
        va = a.team_name || "";
        vb = b.team_name || "";
      } else if (sortField === "med_expiry") {
        va = a.med_expiry || "9999-99-99"; // se nullo in fondo
        vb = b.med_expiry || "9999-99-99";
      }

      const cmp = va.localeCompare(vb, "it", { sensitivity: "base" });
      if (cmp !== 0) return sortAsc ? cmp : -cmp;

      // Sort secondario per nome se i cognomi sono uguali
      return (a.first_name || "").localeCompare(b.first_name || "", "it");
    });
  }, [filteredPlayers, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  /* ── Export PDF avanzato con filtri attivi ── */
  const handleExportPdf = async () => {
    if (sortedPlayers.length === 0) return;
    setPdfLoading(true);

    try {
      const jsPDFModule     = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF     = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      // Usiamo orientation 'portrait' o 'landscape' in base al numero di colonne
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const today = format(new Date(), "dd/MM/yyyy 'alle' HH:mm", { locale: it });

      // Costruisci stringa di descrizione dei filtri applicati
      const appliedFiltersText: string[] = [];
      if (filterTeam !== "all") appliedFiltersText.push(`Squadra: ${filterTeam}`);
      if (filterCategory !== "all") appliedFiltersText.push(`Categoria: ${filterCategory}`);
      if (filterYear !== "all") appliedFiltersText.push(`Leva: ${filterYear}`);
      if (filterMedical === "valid") appliedFiltersText.push("Certificato: Valido");
      if (filterMedical === "expiring") appliedFiltersText.push("Certificato: In scadenza");
      if (filterMedical === "irregular") appliedFiltersText.push("Certificato: Irregolare/Assente");
      if (filterPayment === "paid_all") appliedFiltersText.push("Quote: Tutte pagate");
      if (filterPayment === "has_pending") appliedFiltersText.push("Quote: Con sospesi");
      if (filterPayment === "missing_r1") appliedFiltersText.push("Manca Rata 1");
      if (filterPayment === "missing_r2") appliedFiltersText.push("Manca Rata 2");
      if (filterPayment === "missing_r3") appliedFiltersText.push("Manca Rata 3");
      if (filterPayment === "missing_r4") appliedFiltersText.push("Manca Rata 4");
      if (search.trim()) appliedFiltersText.push(`Ricerca: "${search.trim()}"`);

      const filterSummary = appliedFiltersText.length > 0
        ? `Filtri applicati: ${appliedFiltersText.join("  |  ")}`
        : "Tutte le squadre e gruppi Minibasket (senza filtri)";

      /* ── Header banner blu ── */
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 26, "F");

      doc.setTextColor(245, 184, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("MINIBASKET STABIA · ELENCO GENERALE ATLETI", pageWidth / 2, 9, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text("Prospetto Generale Frequentanti Minibasket", pageWidth / 2, 18, { align: "center" });

      /* ── Sottotitolo informativo ── */
      doc.setFillColor(244, 246, 249);
      doc.rect(0, 26, pageWidth, 11, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Generato il ${today}  ·  Totale atleti estratti: ${sortedPlayers.length}  ·  Ordinamento alfabetico`,
        pageWidth / 2,
        31,
        { align: "center" }
      );
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(filterSummary, pageWidth / 2, 35, { align: "center" });

      /* ── Tabella Dati ── */
      const rows = sortedPlayers.map((p, i) => {
        const medStatus = getExpiryStatus(p.med_expiry);
        const medLabel = EXPIRY_BADGE[medStatus].label;
        const medDate = p.med_expiry ? `(${formatDob(p.med_expiry)})` : "";

        const paidCount = [p.p_rata_1, p.p_rata_2, p.p_rata_3, p.p_rata_4].filter(Boolean).length;
        const quoteStr = `${paidCount}/4 rate`;

        const capStr = p.is_captain ? " (C)" : "";

        return [
          (i + 1).toString(),
          `${p.last_name} ${p.first_name}${capStr}`.toUpperCase(),
          formatDob(p.dob),
          getBirthYear(p.dob) || "—",
          p.team_name.toUpperCase(),
          `${medLabel} ${medDate}`.trim(),
          quoteStr,
          p.phone_parent || p.phone_athlete || "—",
        ];
      });

      autoTable(doc, {
        startY: 40,
        head: [
          [
            "N°",
            "Cognome e Nome",
            "Data Nascita",
            "Leva",
            "Gruppo / Squadra",
            "Certificato Medico",
            "Quote",
            "Recapito Genitore",
          ],
        ],
        body: rows,
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [10, 31, 68],
          textColor: [245, 184, 0],
          fontStyle: "bold",
          fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", textColor: [148, 163, 184] },
          1: { fontStyle: "bold" },
          2: { halign: "center", cellWidth: 26 },
          3: { halign: "center", cellWidth: 16 },
          4: { fontStyle: "bold", cellWidth: 46 },
          5: { cellWidth: 42 },
          6: { halign: "center", cellWidth: 24 },
          7: { cellWidth: 35 },
        },
        margin: { left: 12, right: 12 },
      });

      /* ── Footer Paginazione ── */
      const pageCount = (
        doc.internal as unknown as { getNumberOfPages: () => number }
      ).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Pag. ${i} di ${pageCount} · Stabia Basket BTS & NPS`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 6,
          { align: "right" }
        );
      }

      doc.save("Elenco_Generale_Minibasket.pdf");
    } catch (err) {
      console.error("Errore generazione PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#0A1F44] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 flex items-center h-10 w-12 justify-center">
              <Image
                src="/MINIBASKETLOGO.png"
                alt="Logo Minibasket Stabia"
                width={80}
                height={80}
                className="w-12 h-auto max-h-10 object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F5B800] uppercase tracking-widest leading-none">
                Stabia Basket
              </p>
              <h1 className="text-base font-bold truncate leading-tight mt-0.5">
                Minibasket · Elenco Generale
              </h1>
            </div>
          </div>

          <Link href="/" className="flex-shrink-0">
            <Button variant="gold" size="sm" className="gap-1.5 text-xs whitespace-nowrap">
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-16">
        {/* ── Titolo & Descrizione ── */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0A1F44] tracking-tight">
              Elenco Generale Minibasket
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Anagrafica unificata di tutti i frequentanti e gruppi minibasket.
            </p>
          </div>

          {/* Badge conteggio */}
          {!loading && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs self-start sm:self-auto">
              <Users className="w-4 h-4 text-[#0A1F44]" />
              <span className="text-xs font-bold text-[#0A1F44]">
                {sortedPlayers.length} / {players.length} Atleti
              </span>
            </div>
          )}
        </div>

        {/* ── Quick KPI Bar: Cliccabili per impostare filtri al volo ── */}
        {!loading && players.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
            {/* 1. Tutti gli atleti */}
            <button
              onClick={handleResetFilters}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeFiltersCount === 0
                  ? "bg-[#0A1F44] text-white border-[#0A1F44] shadow-sm"
                  : "bg-white border-[#E2E8F0] text-[#0A1F44] hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                  Tutti gli Atleti
                </span>
                <Users className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-xl font-extrabold mt-1">{stats.total}</p>
            </button>

            {/* 2. Certificati da rinnovare */}
            <button
              onClick={() => {
                setFilterMedical(filterMedical === "irregular" ? "all" : "irregular");
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterMedical === "irregular"
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-white border-[#E2E8F0] text-red-600 hover:border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide opacity-90">
                  Certificati Irregolari
                </span>
                <HeartPulse className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-xl font-extrabold mt-1">{stats.medicalIrregular}</p>
            </button>

            {/* 3. Quote con rate in sospeso */}
            <button
              onClick={() => {
                setFilterPayment(filterPayment === "has_pending" ? "all" : "has_pending");
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterPayment === "has_pending"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white border-[#E2E8F0] text-amber-600 hover:border-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide opacity-90">
                  Quote con Sospesi
                </span>
                <Euro className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-xl font-extrabold mt-1">{stats.paymentPending}</p>
            </button>

            {/* 4. Completamente in regola */}
            <button
              onClick={() => {
                setFilterMedical("valid");
                setFilterPayment("paid_all");
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterMedical === "valid" && filterPayment === "paid_all"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white border-[#E2E8F0] text-emerald-700 hover:border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide opacity-90">
                  In Regola (100%)
                </span>
                <ShieldCheck className="w-4 h-4 opacity-75" />
              </div>
              <p className="text-xl font-extrabold mt-1">{stats.fullyCompliant}</p>
            </button>
          </div>
        )}

        {/* ── Barra di Ricerca, Toggle Filtri e Pulsante PDF ── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 sm:p-4 shadow-sm mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Input Ricerca */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca per cognome, nome, squadra, telefono…"
                className="w-full pl-9.5 pr-9 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent
                           placeholder:text-[#94A3B8] bg-[#F8FAFC]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  aria-label="Cancella ricerca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Pulsante Toggle Filtri Avanzati */}
            <Button
              type="button"
              variant={activeFiltersCount > 0 ? "primary" : "outline"}
              size="md"
              onClick={() => setShowFiltersPanel((prev) => !prev)}
              className="gap-2 relative whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtri</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#F5B800] text-[#0A1F44] text-xs font-extrabold flex items-center justify-center ml-0.5">
                  {activeFiltersCount}
                </span>
              )}
              {showFiltersPanel ? (
                <ChevronUp className="w-4 h-4 ml-1 opacity-70" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
              )}
            </Button>

            {/* Pulsante Export PDF */}
            <Button
              variant="gold"
              size="md"
              className="gap-2 whitespace-nowrap"
              onClick={handleExportPdf}
              disabled={loading || sortedPlayers.length === 0 || pdfLoading}
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Scarica PDF</span>
              {sortedPlayers.length > 0 && (
                <span className="opacity-80 text-xs">({sortedPlayers.length})</span>
              )}
            </Button>
          </div>

          {/* ── Pannello Filtri Avanzati (Collassabile) ── */}
          {showFiltersPanel && (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Filtro Squadra Specifica */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Squadra / Gruppo
                  </label>
                  <div className="relative">
                    <select
                      value={filterTeam}
                      onChange={(e) => setFilterTeam(e.target.value)}
                      className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-[#E2E8F0] text-xs text-[#0A1F44] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0A1F44] font-medium"
                    >
                      <option value="all">Tutte le squadre ({availableTeams.length})</option>
                      {availableTeams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>

                {/* 2. Filtro Macro Categoria */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as CategoryFilter)}
                      className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-[#E2E8F0] text-xs text-[#0A1F44] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0A1F44] font-medium"
                    >
                      <option value="all">Tutte le categorie</option>
                      <option value="AQUILOTTI">Aquilotti</option>
                      <option value="PULCINI">Pulcini</option>
                      <option value="SCOIATTOLI">Scoiattoli</option>
                      <option value="ESORDIENTI">Esordienti</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>

                {/* 3. Filtro Anno di Nascita */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Anno di Nascita (Leva)
                  </label>
                  <div className="relative">
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-[#E2E8F0] text-xs text-[#0A1F44] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0A1F44] font-medium"
                    >
                      <option value="all">Tutte le annate</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          Nati nel {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>

                {/* 4. Filtro Certificato Medico */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Certificato Medico
                  </label>
                  <div className="relative">
                    <select
                      value={filterMedical}
                      onChange={(e) => setFilterMedical(e.target.value as MedicalFilter)}
                      className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-[#E2E8F0] text-xs text-[#0A1F44] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0A1F44] font-medium"
                    >
                      <option value="all">Tutti gli stati</option>
                      <option value="valid">🟢 Valido</option>
                      <option value="expiring">🟡 In scadenza (≤ 30 gg)</option>
                      <option value="irregular">🔴 Irregolare / Mancante</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>

                {/* 5. Filtro Quote / Pagamenti */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Quote Minibasket
                  </label>
                  <div className="relative">
                    <select
                      value={filterPayment}
                      onChange={(e) => setFilterPayment(e.target.value as PaymentFilter)}
                      className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-[#E2E8F0] text-xs text-[#0A1F44] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0A1F44] font-medium"
                    >
                      <option value="all">Tutti gli stati quote</option>
                      <option value="paid_all">🟢 Tutte le rate pagate</option>
                      <option value="has_pending">🔴 Con rate in sospeso</option>
                      <option value="missing_r1">Manca Rata 1</option>
                      <option value="missing_r2">Manca Rata 2</option>
                      <option value="missing_r3">Manca Rata 3</option>
                      <option value="missing_r4">Manca Rata 4</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Barra Reset Filtri */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-[#64748B]">
                    Filtri attivi: <strong className="text-[#0A1F44]">{activeFiltersCount}</strong>
                    {sortedPlayers.length !== players.length && (
                      <span> · Mostrati {sortedPlayers.length} su {players.length}</span>
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Azzera filtri
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Chips Filtri Attivi (se presenti e pannello chiuso) ── */}
        {!showFiltersPanel && activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-xs font-semibold text-[#64748B] mr-1">Filtri attivi:</span>
            {filterTeam !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-200 text-slate-800 font-medium">
                Squadra: {filterTeam}
                <button onClick={() => setFilterTeam("all")} aria-label="Rimuovi filtro squadra">
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-800" />
                </button>
              </span>
            )}
            {filterCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-200 text-slate-800 font-medium">
                Categoria: {filterCategory}
                <button onClick={() => setFilterCategory("all")} aria-label="Rimuovi filtro categoria">
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-800" />
                </button>
              </span>
            )}
            {filterYear !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-200 text-slate-800 font-medium">
                Leva: {filterYear}
                <button onClick={() => setFilterYear("all")} aria-label="Rimuovi filtro anno">
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-800" />
                </button>
              </span>
            )}
            {filterMedical !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-200 text-slate-800 font-medium">
                Certificato: {filterMedical}
                <button onClick={() => setFilterMedical("all")} aria-label="Rimuovi filtro certificato">
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-800" />
                </button>
              </span>
            )}
            {filterPayment !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-200 text-slate-800 font-medium">
                Quote: {filterPayment}
                <button onClick={() => setFilterPayment("all")} aria-label="Rimuovi filtro quote">
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-800" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-200 text-slate-800 font-medium">
                &ldquo;{search}&rdquo;
                <button onClick={() => setSearch("")} aria-label="Rimuovi ricerca">
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-800" />
                </button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-red-600 hover:underline ml-1"
            >
              Azzera tutto
            </button>
          </div>
        )}

        {/* ── STATO: LOADING ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
            <p className="text-sm text-[#64748B]">Caricamento atleti Minibasket…</p>
          </div>
        )}

        {/* ── STATO: ERRORE ── */}
        {!loading && loadError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-red-700 mb-1">Impossibile caricare i dati</p>
            <p className="text-xs text-red-500 max-w-sm mx-auto">{loadError}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={loadData}>
              Riprova
            </Button>
          </div>
        )}

        {/* ── STATO: LISTA VUOTA TOTALE ── */}
        {!loading && !loadError && players.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl px-5 py-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
            <p className="font-bold text-[#0A1F44] mb-1">Nessun atleta Minibasket trovato</p>
            <p className="text-sm text-[#94A3B8] max-w-sm mx-auto">
              Verifica che le squadre del Minibasket abbiano il flag{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0A1F44]">
                is_minibasket = TRUE
              </code>{" "}
              nel database Supabase.
            </p>
          </div>
        )}

        {/* ── STATO: NESSUN RISULTATO DOPO I FILTRI ── */}
        {!loading && !loadError && players.length > 0 && sortedPlayers.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl px-5 py-12 text-center shadow-sm">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="font-bold text-[#0A1F44] mb-1">Nessun atleta corrisponde ai filtri selezionati</p>
            <p className="text-xs text-[#94A3B8] max-w-xs mx-auto mb-4">
              Prova a modificare i criteri di ricerca o a reimpostare i filtri per vedere tutti gli atleti.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              Azzera filtri
            </Button>
          </div>
        )}

        {/* ── LISTA ATLETI: MOBILE & DESKTOP ── */}
        {!loading && !loadError && sortedPlayers.length > 0 && (
          <>
            {/* Mobile (Card verticali) */}
            <div className="flex flex-col gap-3 sm:hidden">
              {sortedPlayers.map((player, index) => (
                <MinibasketCard key={player.id} player={player} index={index} />
              ))}
            </div>

            {/* Desktop (Tabella completa) */}
            <div className="hidden sm:block">
              <MinibasketTable
                players={sortedPlayers}
                sortField={sortField}
                sortAsc={sortAsc}
                onSort={handleSort}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Export con Suspense
───────────────────────────────────────────── */
export default function MinibasketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
            <p className="text-sm text-[#64748B]">Caricamento…</p>
          </div>
        </div>
      }
    >
      <MinibasketContent />
    </Suspense>
  );
}
