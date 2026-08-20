"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  ClipboardList,
  FileDown,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle,
  Trophy,
  X,
  ChevronDown,
  Users,
  Trash2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { supabase, type Player } from "@/lib/supabase";

/* ─────────────────────────────────────────────
   Tipi locali
───────────────────────────────────────────── */
interface Match {
  id: string;
  team_id: string;
  match_date: string;
  opponent: string;
}

interface CallUpMap {
  [player_id: string]: boolean;
}

/* ─────────────────────────────────────────────
   Utilità
───────────────────────────────────────────── */
function getDynamicHeader(teamName: string): string {
  const upper = teamName.toUpperCase();
  if (upper.includes("FEMM") || upper.includes("BFS")) return "Basket Femminile Stabia";
  if (upper.includes("AQUILOTTI") || upper.includes("PULCINI") || upper.includes("SCOIATTOLI")) return "Minibasket Stabia";
  return "Stabia Basket BTS & NPS";
}

function fmtDate(d: string) {
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: it }); }
  catch { return d; }
}

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

/* ─────────────────────────────────────────────
   Riga giocatore nella griglia convocazioni
───────────────────────────────────────────── */
function PlayerRow({
  player,
  index,
  called,
  saving,
  onToggle,
}: {
  player: Player;
  index: number;
  called: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200
        ${called
          ? "bg-[#0A1F44]/5 border-[#0A1F44]/20"
          : "bg-white border-[#E2E8F0]"
        }
      `}
    >
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F4F6F9] text-[#94A3B8] text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate uppercase ${called ? "text-[#0A1F44]" : "text-[#334155]"}`}>
          {player.last_name} {player.first_name}
        </p>
        {called ? (
          <p className="text-xs text-[#0A1F44]/70 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> Convocato
          </p>
        ) : (
          <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5">
            <Circle className="w-3 h-3" /> Non convocato
          </p>
        )}
      </div>
      <ToggleSwitch
        active={called}
        onToggle={onToggle}
        loading={saving}
        colorActive="navy"
        ariaLabel={called ? "Convocato – clicca per rimuovere" : "Non convocato – clicca per aggiungere"}
      />
    </div>
  );
}


/* ─────────────────────────────────────────────
   Modal crea nuova partita
───────────────────────────────────────────── */
function NewMatchModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (date: string, opponent: string) => Promise<void>;
  saving: boolean;
}) {
  const [date, setDate] = useState(today());
  const [opponent, setOpponent] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!opponent.trim()) { setErr("Inserisci il nome dell'avversario."); return; }
    if (!date) { setErr("Seleziona una data."); return; }
    await onSave(date, opponent.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#E2E8F0]" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="font-bold text-[#0A1F44] text-base">Nuova Partita</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F4F6F9] flex items-center justify-center">
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {err && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Data Partita <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Avversario <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="es. Napoli Basket"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]
                         placeholder:text-[#CBD5E1]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" size="md" className="flex-1" onClick={onClose} disabled={saving}>
              Annulla
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1" disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvataggio…</> : <><Plus className="w-4 h-4" /> Crea Partita</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Contenuto principale
───────────────────────────────────────────── */
function ConvocazioniContent() {
  const searchParams = useSearchParams();
  const teamName = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  const [teamId, setTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [callUps, setCallUps] = useState<CallUpMap>({});

  const [initLoading, setInitLoading] = useState(true);
  const [callUpsLoading, setCallUpsLoading] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState<string | null>(null);
  const [savingMatch, setSavingMatch] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showNewMatch, setShowNewMatch] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  /* ── Init ── */
  const loadInit = useCallback(async () => {
    setInitLoading(true);
    setInitError(null);
    try {
      const { data: teamData, error: tErr } = await supabase
        .from("teams").select("id").eq("name", teamName).single();
      if (tErr || !teamData) {
        setInitError(`Squadra "${teamName}" non trovata.`);
        return;
      }
      setTeamId(teamData.id);

      const [{ data: pData }, { data: mData }] = await Promise.all([
        supabase.from("players").select("*").eq("team_id", teamData.id)
          .order("last_name").order("first_name"),
        supabase.from("matches").select("*").eq("team_id", teamData.id)
          .order("match_date", { ascending: false }).limit(30),
      ]);
      setPlayers(pData ?? []);
      setMatches(mData ?? []);
    } catch (e) {
      setInitError("Errore di connessione a Supabase.");
      console.error(e);
    } finally {
      setInitLoading(false);
    }
  }, [teamName]);

  useEffect(() => { loadInit(); }, [loadInit]);

  /* ── Seleziona partita ── */
  const handleSelectMatch = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId) ?? null;
    setSelectedMatch(match);
    if (!match) { setCallUps({}); return; }

    setCallUpsLoading(true);
    try {
      const { data } = await supabase
        .from("call_ups").select("player_id")
        .eq("match_id", match.id);

      const map: CallUpMap = {};
      players.forEach((p) => { map[p.id] = false; });
      (data ?? []).forEach((c: { player_id: string }) => { map[c.player_id] = true; });
      setCallUps(map);
    } catch (e) {
      console.error(e);
    } finally {
      setCallUpsLoading(false);
    }
  };

  /* ── Crea partita ── */
  const handleCreateMatch = async (date: string, opponent: string) => {
    if (!teamId) return;
    setSavingMatch(true);
    try {
      const { data, error } = await supabase
        .from("matches")
        .insert({ team_id: teamId, match_date: date, opponent })
        .select().single();
      if (error || !data) throw error;
      const newMatch = data as Match;
      setMatches((prev) =>
        [newMatch, ...prev].sort((a, b) => b.match_date.localeCompare(a.match_date))
      );
      setShowNewMatch(false);
      // Auto-seleziona la partita appena creata
      setSelectedMatch(newMatch);
      const map: CallUpMap = {};
      players.forEach((p) => { map[p.id] = false; });
      setCallUps(map);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMatch(false);
    }
  };

  /* ── Elimina partita ── */
  const handleDeleteMatch = async () => {
    if (!selectedMatch) return;
    if (!window.confirm(
      `Sei sicuro di voler eliminare la partita contro "${selectedMatch.opponent}"?\nVerranno eliminate anche tutte le convocazioni associate. L'azione è irreversibile.`
    )) return;
    try {
      const { error } = await supabase.from("matches").delete().eq("id", selectedMatch.id);
      if (error) throw error;
      setMatches((prev) => prev.filter((m) => m.id !== selectedMatch.id));
      setSelectedMatch(null);
      setCallUps({});
    } catch (e) { console.error("Errore eliminazione partita:", e); }
  };

  /* ── Toggle convocazione ── */
  const handleToggle = async (playerId: string) => {
    if (!selectedMatch || savingPlayer) return;
    setSavingPlayer(playerId);
    const newValue = !callUps[playerId];
    setCallUps((prev) => ({ ...prev, [playerId]: newValue }));

    try {
      if (newValue) {
        const { error } = await supabase
          .from("call_ups")
          .insert({ match_id: selectedMatch.id, player_id: playerId });
        if (error && error.code !== "23505") throw error; // ignora duplicate
      } else {
        const { error } = await supabase
          .from("call_ups")
          .delete()
          .eq("match_id", selectedMatch.id)
          .eq("player_id", playerId);
        if (error) throw error;
      }
    } catch (e) {
      setCallUps((prev) => ({ ...prev, [playerId]: !newValue }));
      console.error("Errore convocazione:", e);
    } finally {
      setSavingPlayer(null);
    }
  };

  /* ── Export PDF convocazioni ── */
  const handleExportPdf = async () => {
    if (!selectedMatch) return;
    setPdfLoading(true);
    try {
      const convocati = players.filter((p) => callUps[p.id]);
      const sorted = [...convocati].sort(
        (a, b) => a.last_name.localeCompare(b.last_name, "it") || a.first_name.localeCompare(b.first_name, "it")
      );

      const jsPDFModule = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, W, 32, "F");
      doc.setTextColor(245, 184, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(getDynamicHeader(teamName), W / 2, 9, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text(`Convocazione Gara`, W / 2, 17, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${teamName}  vs  ${selectedMatch.opponent}  ·  ${fmtDate(selectedMatch.match_date)}`,
        W / 2, 25, { align: "center" }
      );

      // Sub-header
      doc.setFillColor(244, 246, 249);
      doc.rect(0, 32, W, 7, "F");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text(
        `${sorted.length} giocatori convocati · Generato il ${format(new Date(), "dd/MM/yyyy 'alle' HH:mm", { locale: it })}`,
        W / 2, 37, { align: "center" }
      );

      if (sorted.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(148, 163, 184);
        doc.text("Nessun giocatore convocato.", W / 2, 65, { align: "center" });
      } else {
        const rows = sorted.map((p, i) => [
          (i + 1).toString(),
          `${p.jersey_number ? `[#${p.jersey_number}] ` : ""}${p.last_name} ${p.first_name}${p.is_captain ? " (C)" : ""}`.toUpperCase()
        ]);

        autoTable(doc, {
          startY: 43,
          head: [["N°", "Giocatore (Maglia/Cap.)"]],
          body: rows,
          theme: "striped",
          styles: { fontSize: 11, cellPadding: 4, textColor: [30, 41, 59] },
          headStyles: { fillColor: [10, 31, 68], textColor: [245, 184, 0], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 14, halign: "center", textColor: [148, 163, 184] },
            1: { fontStyle: "bold" },
          },
          margin: { left: 20, right: 20 },
        });
      }

      // Firma allenatore
      const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 120;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, lastY + 20, 90, lastY + 20);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Firma Allenatore", 55, lastY + 26, { align: "center" });

      doc.save(`Convocazione_${selectedMatch.opponent.replace(/\s+/g, "_")}_${selectedMatch.match_date}.pdf`);
    } catch (e) {
      console.error("Errore PDF:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  /* ─────────────────────────
     RENDER
  ───────────────────────── */
  const convocatiCount = Object.values(callUps).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <AppHeader
        title="Stabia Basket BTS & NPS"
        subtitle={`Convocazioni · ${teamName}`}
        showBack
        backHref={`/dashboard?team=${teamParam}`}
        backLabel="Dashboard"
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-12">

        {/* Titolo */}
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-[#0A1F44]">Convocazioni Partite</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            <span className="font-semibold text-[#0A1F44]">{teamName}</span>
            {matches.length > 0 && ` · ${matches.length} partite registrate`}
          </p>
        </div>

        {initLoading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
          </div>
        )}

        {initError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">{initError}</p>
          </div>
        )}

        {!initLoading && !initError && (
          <>
            {/* ── Pannello selezione/creazione partita ── */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-orange-500" />
                  Seleziona Partita
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowNewMatch(true)}
                >
                  <Plus className="w-3.5 h-3.5" /> Nuova Partita
                </Button>
              </div>

              {matches.length === 0 ? (
                <div className="text-center py-6 text-[#94A3B8]">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
                  <p className="text-sm">Nessuna partita ancora. Creane una!</p>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedMatch?.id ?? ""}
                    onChange={(e) => handleSelectMatch(e.target.value)}
                    className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-[#E2E8F0]
                               text-[#0A1F44] text-sm bg-[#F8FAFC]
                               focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
                  >
                    <option value="">— Scegli una partita —</option>
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {fmtDate(m.match_date)} · vs {m.opponent}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                </div>
              )}
            </div>

            {/* ── Pannello convocazioni ── */}
            {callUpsLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-[#0A1F44] animate-spin" />
              </div>
            )}

            {selectedMatch && !callUpsLoading && (
              <div>
                 {/* Header partita selezionata */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0A1F44]">
                      vs {selectedMatch.opponent}
                    </h3>
                    <p className="text-sm text-[#64748B] mt-0.5">
                      {fmtDate(selectedMatch.match_date)} ·{" "}
                      <span className="font-semibold text-[#0A1F44]">{convocatiCount}</span>
                      {" "}convocati su {players.length}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="gold"
                      size="md"
                      onClick={handleExportPdf}
                      disabled={pdfLoading}
                      className="gap-2"
                    >
                      {pdfLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <FileDown className="w-4 h-4" />
                      }
                      Convocazioni PDF
                    </Button>
                    <button
                      onClick={handleDeleteMatch}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl
                                 text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Elimina partita
                    </button>
                  </div>
                </div>

                {/* Lista giocatori */}
                {players.length === 0 ? (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl py-12 text-center">
                    <Users className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                    <p className="text-sm text-[#94A3B8]">Nessun giocatore. Aggiungi giocatori dall&apos;Anagrafica.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {players.map((p, i) => (
                      <PlayerRow
                        key={p.id}
                        player={p}
                        index={i}
                        called={!!callUps[p.id]}
                        saving={savingPlayer === p.id}
                        onToggle={() => handleToggle(p.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stato iniziale */}
            {!selectedMatch && !callUpsLoading && matches.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] border-dashed rounded-2xl py-14 text-center">
                <ClipboardList className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
                <p className="font-semibold text-[#0A1F44] mb-1">Seleziona una partita</p>
                <p className="text-sm text-[#94A3B8]">Scegli una partita dal menu per gestire le convocazioni.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal nuova partita */}
      {showNewMatch && (
        <NewMatchModal
          onClose={() => setShowNewMatch(false)}
          onSave={handleCreateMatch}
          saving={savingMatch}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Export con Suspense
───────────────────────────────────────────── */
export default function ConvocazioniPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
      </div>
    }>
      <ConvocazioniContent />
    </Suspense>
  );
}
