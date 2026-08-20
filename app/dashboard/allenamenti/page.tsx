"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  CalendarCheck, FileDown, Loader2, AlertCircle,
  CheckCircle2, Circle, Users, Trash2, History,
  ChevronDown, ChevronUp, XCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { supabase, type Player } from "@/lib/supabase";

/* ─────────────────────────────────────────────
   Tipi locali
───────────────────────────────────────────── */
interface Practice { id: string; team_id: string; practice_date: string; }
interface AttendanceMap { [player_id: string]: boolean; }
type StoricoMap = Record<string, Record<string, boolean>>;

/* ─────────────────────────────────────────────
   Utilità
───────────────────────────────────────────── */
function fmtDate(d: string) {
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: it }); }
  catch { return d; }
}
function today() { return format(new Date(), "yyyy-MM-dd"); }

/* ─────────────────────────────────────────────
   Riga giocatore — griglia presenze
───────────────────────────────────────────── */
function PlayerRow({ player, index, present, saving, onToggle }: {
  player: Player; index: number; present: boolean; saving: boolean; onToggle: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200
      ${present ? "bg-emerald-50 border-emerald-200" : "bg-white border-[#E2E8F0]"}`}>
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F4F6F9] text-[#94A3B8] text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${present ? "text-emerald-800" : "text-[#0A1F44]"}`}>
          {player.last_name} {player.first_name}
        </p>
        {present
          ? <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> Presente</p>
          : <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5"><Circle className="w-3 h-3" /> Assente</p>
        }
      </div>
      <ToggleSwitch active={present} onToggle={onToggle} loading={saving} colorActive="emerald" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sezione Storico Giocatori (accordion)
───────────────────────────────────────────── */
function StoricoSection({ players, practices, storicoMap, loading }: {
  players: Player[];
  practices: Practice[];
  storicoMap: StoricoMap;
  loading: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const sortedPractices = [...practices].sort((a, b) => a.practice_date.localeCompare(b.practice_date));
  const sortedPlayers  = [...players].sort((a, b) => a.last_name.localeCompare(b.last_name, "it") || a.first_name.localeCompare(b.first_name, "it"));

  if (loading) return (
    <div className="flex justify-center py-6">
      <Loader2 className="w-6 h-6 animate-spin text-[#0A1F44]" />
    </div>
  );

  if (players.length === 0) return (
    <p className="text-center text-sm text-[#94A3B8] py-6">Nessun giocatore in rosa.</p>
  );

  return (
    <div className="space-y-2">
      {sortedPlayers.map((player) => {
        const total    = sortedPractices.length;
        const presenti = sortedPractices.filter(pr => storicoMap[player.id]?.[pr.id] === true).length;
        const pct      = total > 0 ? Math.round((presenti / total) * 100) : null;
        const isOpen   = openId === player.id;

        return (
          <div key={player.id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            {/* Header accordion */}
            <button
              onClick={() => setOpenId(isOpen ? null : player.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors text-left"
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0A1F44]/10 text-[#0A1F44] text-xs font-bold flex items-center justify-center">
                {player.last_name.charAt(0)}{player.first_name.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0A1F44] truncate">
                  {player.last_name} {player.first_name}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {total > 0 ? `${presenti}/${total} presenze` : "Nessun allenamento"}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {pct !== null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    pct >= 75 ? "bg-emerald-100 text-emerald-700" :
                    pct >= 50 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>{pct}%</span>
                )}
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
                  : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                }
              </div>
            </button>

            {/* Dettaglio allenamenti */}
            {isOpen && (
              <div className="border-t border-[#F4F6F9] px-4 py-3">
                {sortedPractices.length === 0 ? (
                  <p className="text-xs text-[#94A3B8]">Nessun allenamento registrato.</p>
                ) : (
                  <div className="space-y-1.5">
                    {sortedPractices.map((pr) => {
                      const isPresent = storicoMap[player.id]?.[pr.id] === true;
                      
                      return (
                        <div key={pr.id} className="flex items-center justify-between gap-4 py-1 border-b border-[#F8FAFC] last:border-0">
                          <span className="text-xs text-[#64748B] font-mono">{fmtDate(pr.practice_date)}</span>
                          {isPresent ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Presente</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-500"><XCircle className="w-3.5 h-3.5" /> Assente</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Contenuto principale
───────────────────────────────────────────── */
function AllenamentiContent() {
  const searchParams = useSearchParams();
  const teamName  = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  /* ── Stato principale ── */
  const [teamId,            setTeamId]            = useState<string | null>(null);
  const [players,           setPlayers]           = useState<Player[]>([]);
  const [practices,         setPractices]         = useState<Practice[]>([]);
  const [selectedDate,      setSelectedDate]      = useState<string>(today());
  const [selectedPractice,  setSelectedPractice]  = useState<Practice | null>(null);
  const [attendance,        setAttendance]        = useState<AttendanceMap>({});

  /* ── Stato UI ── */
  const [initLoading,    setInitLoading]    = useState(true);
  const [practiceLoading,setPracticeLoading]= useState(false);
  const [savingPlayer,   setSavingPlayer]   = useState<string | null>(null);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [initError,      setInitError]      = useState<string | null>(null);
  const [practiceError,  setPracticeError]  = useState<string | null>(null);

  /* ── Stato Storico ── */
  const [showStorico,    setShowStorico]    = useState(false);
  const [storicoMap,     setStoricoMap]     = useState<StoricoMap>({});
  const [storicoLoading, setStoricoLoading] = useState(false);
  const [storicoLoaded,  setStoricoLoaded]  = useState(false);

  /* ─── Init ─── */
  const loadInit = useCallback(async () => {
    setInitLoading(true); setInitError(null);
    try {
      const { data: teamData, error: tErr } = await supabase
        .from("teams").select("id").eq("name", teamName).single();
      if (tErr || !teamData) { setInitError(`Squadra "${teamName}" non trovata.`); return; }
      setTeamId(teamData.id);

      const [{ data: pData }, { data: prData }] = await Promise.all([
        supabase.from("players").select("*").eq("team_id", teamData.id).order("last_name").order("first_name"),
        supabase.from("practices").select("*").eq("team_id", teamData.id)
          .order("practice_date", { ascending: false }).limit(50),
      ]);
      setPlayers(pData ?? []);
      setPractices(prData ?? []);
    } catch (e) { setInitError("Errore di connessione a Supabase."); console.error(e); }
    finally { setInitLoading(false); }
  }, [teamName]);

  useEffect(() => { loadInit(); }, [loadInit]);

  /* ─── Carica / crea allenamento ─── */
  const handleSelectDate = async () => {
    if (!teamId || !selectedDate) return;
    setPracticeLoading(true); setPracticeError(null); setSelectedPractice(null); setAttendance({});
    try {
      const { data: existing } = await supabase.from("practices").select("*")
        .eq("team_id", teamId).eq("practice_date", selectedDate).single();

      let practice: Practice;
      if (existing) {
        practice = existing as Practice;
      } else {
        const { data: created, error: cErr } = await supabase.from("practices")
          .insert({ team_id: teamId, practice_date: selectedDate }).select().single();
        if (cErr || !created) throw cErr ?? new Error("Creazione fallita");
        practice = created as Practice;
        setPractices(prev => [practice, ...prev].sort((a, b) => b.practice_date.localeCompare(a.practice_date)));
        setStoricoLoaded(false); // invalida cache storico
      }

      const { data: attData } = await supabase.from("attendances")
        .select("player_id, is_present").eq("practice_id", practice.id);

      const map: AttendanceMap = {};
      players.forEach(p => { map[p.id] = false; });
      (attData ?? []).forEach((a: { player_id: string; is_present: boolean }) => { map[a.player_id] = a.is_present; });

      setSelectedPractice(practice); setAttendance(map);
    } catch (e) { setPracticeError("Errore nel creare/caricare l'allenamento."); console.error(e); }
    finally { setPracticeLoading(false); }
  };

  /* ─── Toggle presenza (solo stato locale) ─── */
  const handleToggle = (playerId: string) => {
    setAttendance(prev => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  /* ─── Salva presenze (Upsert di massa) ─── */
  const handleSaveAll = async () => {
    if (!selectedPractice || !players.length) return;
    setSavingPlayer("all");
    try {
      const rows = players.map(p => ({
        practice_id: selectedPractice.id,
        player_id: p.id,
        is_present: !!attendance[p.id]
      }));
      const { error } = await supabase.from("attendances").upsert(rows, { onConflict: "practice_id,player_id" });
      if (error) throw error;
      setStoricoLoaded(false); // Invalida cache storico
      alert("Presenze salvate correttamente!");
    } catch (e) {
      console.error("Errore salvataggio presenze:", e);
      alert("Errore nel salvataggio. Riprova.");
    } finally {
      setSavingPlayer(null);
    }
  };

  /* ─── Segna tutti ─── */
  const handleMarkAll = (present: boolean) => {
    if (!selectedPractice || !players.length) return;
    const newMap: AttendanceMap = {};
    players.forEach(p => { newMap[p.id] = present; });
    setAttendance(newMap);
  };

  /* ─── Elimina allenamento ─── */
  const handleDeletePractice = async () => {
    if (!selectedPractice) return;
    if (!window.confirm(`Sei sicuro di voler eliminare l'allenamento del ${fmtDate(selectedPractice.practice_date)}?\nVerranno eliminate anche tutte le presenze associate. L'azione è irreversibile.`)) return;
    try {
      const { error } = await supabase.from("practices").delete().eq("id", selectedPractice.id);
      if (error) throw error;
      setPractices(prev => prev.filter(p => p.id !== selectedPractice.id));
      setSelectedPractice(null); setAttendance({});
      setStoricoLoaded(false);
    } catch (e) { console.error("Errore eliminazione:", e); }
  };

  /* ─── Carica storico presenze ─── */
  const loadStorico = async () => {
    if (practices.length === 0 || storicoLoaded) return;
    setStoricoLoading(true);
    try {
      const { data } = await supabase.from("attendances")
        .select("practice_id, player_id, is_present")
        .in("practice_id", practices.map(p => p.id));

      const map: StoricoMap = {};
      (data ?? []).forEach((a: { practice_id: string; player_id: string; is_present: boolean }) => {
        if (!map[a.player_id]) map[a.player_id] = {};
        map[a.player_id][a.practice_id] = a.is_present;
      });
      setStoricoMap(map); setStoricoLoaded(true);
    } catch (e) { console.error(e); }
    finally { setStoricoLoading(false); }
  };

  const handleToggleStorico = () => {
    const next = !showStorico;
    setShowStorico(next);
    if (next && !storicoLoaded) loadStorico();
  };

  /* ─── Export PDF presenze (ultimi 4 allenamenti) ─── */
  const handleExportPdf = async () => {
    if (!teamId || players.length === 0) return;
    setPdfLoading(true);
    try {
      const { data: last4 } = await supabase.from("practices").select("*")
        .eq("team_id", teamId).order("practice_date", { ascending: false }).limit(4);
      const practiceList = ((last4 ?? []) as Practice[]).reverse();
      const practiceIds  = practiceList.map(p => p.id);

      const { data: allAtt } = await supabase.from("attendances")
        .select("practice_id, player_id, is_present").in("practice_id", practiceIds);

      const attLookup: Record<string, Record<string, boolean>> = {};
      (allAtt ?? []).forEach((a: { practice_id: string; player_id: string; is_present: boolean }) => {
        if (!attLookup[a.player_id]) attLookup[a.player_id] = {};
        attLookup[a.player_id][a.practice_id] = a.is_present;
      });

      const jsPDFModule    = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF    = jsPDFModule.default;
      const autoTable = autoTableModule.default;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();

      doc.setFillColor(10,31,68); doc.rect(0,0,W,26,"F");
      doc.setTextColor(245,184,0); doc.setFontSize(8); doc.setFont("helvetica","bold");
      doc.text("STABIA BASKET BTS & NPS", W/2, 9, { align:"center" });
      doc.setTextColor(255,255,255); doc.setFontSize(13);
      doc.text(`Report Presenze – ${teamName}`, W/2, 18, { align:"center" });

      doc.setFillColor(244,246,249); doc.rect(0,26,W,7,"F");
      doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont("helvetica","normal");
      doc.text(`Generato il ${format(new Date(), "dd/MM/yyyy 'alle' HH:mm", { locale: it })} · Ultimi ${practiceList.length} allenamenti`, W/2, 31, { align:"center" });

      const sorted = [...players].sort((a,b) => a.last_name.localeCompare(b.last_name,"it") || a.first_name.localeCompare(b.first_name,"it"));
      const head = [["N°","Cognome","Nome", ...practiceList.map(pr => fmtDate(pr.practice_date))]];
      const body = sorted.map((p,i) => [
        (i+1).toString(), p.last_name.toUpperCase(), p.first_name,
        ...practiceList.map(pr => (attLookup[p.id]?.[pr.id] ? "X" : "")),
      ]);

      autoTable(doc, {
        startY: 36, head, body, theme: "striped",
        styles: { fontSize:9, cellPadding:3, textColor:[30,41,59] },
        headStyles: { fillColor:[10,31,68], textColor:[245,184,0], fontStyle:"bold", fontSize:8 },
        alternateRowStyles: { fillColor:[248,250,252] },
        columnStyles: {
          0: { cellWidth:10, halign:"center", textColor:[148,163,184] },
          1: { fontStyle:"bold" },
          ...Object.fromEntries(practiceList.map((_,i) => [i+3, { halign:"center", cellWidth:24 }])),
        },
        margin: { left:12, right:12 },
      });
      doc.save(`Presenze_${teamName.replace(/\s+/g,"_")}.pdf`);
    } catch (e) { console.error("Errore PDF:", e); }
    finally { setPdfLoading(false); }
  };

  const presentiCount = Object.values(attendance).filter(Boolean).length;
  const totale = players.length;

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <AppHeader title="Stabia Basket BTS & NPS" subtitle={`Allenamenti · ${teamName}`}
        showBack backHref={`/dashboard?team=${teamParam}`} backLabel="Dashboard" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-12">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-[#0A1F44]">Allenamenti</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            <span className="font-semibold text-[#0A1F44]">{teamName}</span>
            {practices.length > 0 && ` · ${practices.length} sessioni registrate`}
          </p>
        </div>

        {initError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-6 text-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">{initError}</p>
          </div>
        )}
        {initLoading && <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" /></div>}

        {!initLoading && !initError && (
          <>
            {/* ── Selettore data + azioni ── */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mb-3">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-500" /> Seleziona data allenamento
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]" />
                <Button variant="primary" size="md" onClick={handleSelectDate} disabled={practiceLoading || !selectedDate} className="gap-2">
                  {practiceLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Caricamento…</> : <><CalendarCheck className="w-4 h-4" /> Apri Allenamento</>}
                </Button>
                <Button variant="gold" size="md" onClick={handleExportPdf} disabled={practices.length === 0 || pdfLoading} className="gap-2">
                  {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  Report PDF
                </Button>
              </div>
              {practiceError && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {practiceError}
                </p>
              )}
            </div>

            {/* ── Toggle Storico Giocatori ── */}
            <button
              onClick={handleToggleStorico}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors mb-5"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#0A1F44]">
                <History className="w-4 h-4 text-[#64748B]" />
                Storico Presenze Giocatori
                {practices.length > 0 && (
                  <span className="text-xs font-normal text-[#94A3B8]">({practices.length} sessioni)</span>
                )}
              </span>
              {showStorico
                ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
                : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
              }
            </button>

            {/* ── Sezione Storico ── */}
            {showStorico && (
              <div className="mb-6">
                <StoricoSection
                  players={players}
                  practices={practices}
                  storicoMap={storicoMap}
                  loading={storicoLoading}
                />
              </div>
            )}

            {/* ── Pannello allenamento selezionato ── */}
            {selectedPractice && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0A1F44]">
                      Allenamento del {fmtDate(selectedPractice.practice_date)}
                    </h3>
                    <p className="text-sm text-[#64748B] mt-0.5">
                      {presentiCount} / {totale} presenti
                      {totale > 0 && <span className="ml-2 font-semibold text-emerald-600">({Math.round((presentiCount / totale) * 100)}%)</span>}
                    </p>
                  </div>

                  {/* Barra progresso */}
                  <div className="sm:w-32">
                    <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: totale > 0 ? `${(presentiCount / totale) * 100}%` : "0%" }} />
                    </div>
                  </div>

                  {/* Azioni rapide */}
                  <div className="flex gap-2 flex-wrap items-center mt-3 sm:mt-0">
                    <Button variant="primary" size="sm" onClick={handleSaveAll} disabled={savingPlayer === "all"}>
                      {savingPlayer === "all" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                      Salva Presenze
                    </Button>
                    <div className="h-6 w-px bg-[#E2E8F0] mx-1 hidden sm:block" />
                    <button onClick={() => handleMarkAll(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                      Tutti ✓
                    </button>
                    <button onClick={() => handleMarkAll(false)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F4F6F9] text-[#64748B] hover:bg-[#E2E8F0] transition-colors">
                      Nessuno
                    </button>
                    <div className="h-6 w-px bg-[#E2E8F0] mx-1 hidden sm:block" />
                    <button onClick={handleDeletePractice}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200">
                      <Trash2 className="w-3.5 h-3.5" /> Elimina
                    </button>
                  </div>
                </div>

                {/* Lista giocatori */}
                {players.length === 0 ? (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl py-12 text-center">
                    <Users className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                    <p className="text-sm text-[#94A3B8]">Nessun giocatore. Aggiungine dall&apos;Anagrafica.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {players.map((p, i) => (
                      <PlayerRow key={p.id} player={p} index={i}
                        present={!!attendance[p.id]} saving={savingPlayer === p.id}
                        onToggle={() => handleToggle(p.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stato iniziale */}
            {!selectedPractice && !practiceLoading && !showStorico && (
              <div className="bg-white border border-[#E2E8F0] border-dashed rounded-2xl py-14 text-center">
                <CalendarCheck className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
                <p className="font-semibold text-[#0A1F44] mb-1">Seleziona una data</p>
                <p className="text-sm text-[#94A3B8]">Scegli la data e premi &quot;Apri Allenamento&quot; per registrare le presenze.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function AllenamentiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" /></div>}>
      <AllenamentiContent />
    </Suspense>
  );
}
