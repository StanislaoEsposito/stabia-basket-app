"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  UserPlus,
  FileDown,
  Users,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase, type Player } from "@/lib/supabase";

/* ─────────────────────────────────────────────
   Utilità
───────────────────────────────────────────── */
function formatDob(dob: string | null): string {
  if (!dob) return "—";
  try {
    return format(parseISO(dob), "dd/MM/yyyy", { locale: it });
  } catch {
    return dob;
  }
}

/* ─────────────────────────────────────────────
   Tipi
───────────────────────────────────────────── */
interface NewPlayerForm {
  first_name: string;
  last_name: string;
  dob: string;
}

const EMPTY_FORM: NewPlayerForm = { first_name: "", last_name: "", dob: "" };

/* ─────────────────────────────────────────────
   Componente: Riga giocatore su MOBILE (Card)
───────────────────────────────────────────── */
function PlayerCard({ player, index, onDelete }: {
  player: Player; index: number; onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3 flex items-center gap-4 shadow-sm group">
      {/* Numero */}
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0A1F44] text-white text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
      {/* Dati */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#0A1F44] text-sm leading-tight truncate">
          {player.last_name} {player.first_name}
        </p>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          {player.dob ? `Nato il ${formatDob(player.dob)}` : "Data di nascita non inserita"}
        </p>
      </div>
      {/* Elimina — sempre visibile su mobile */}
      <button
        onClick={() => onDelete(player.id, `${player.last_name} ${player.first_name}`)}
        className="flex-shrink-0 w-9 h-9 rounded-xl hover:bg-red-50 flex items-center justify-center
                   transition-colors text-red-400 hover:text-red-600 active:scale-95"
        aria-label="Elimina giocatore"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente: Tabella giocatori su DESKTOP
───────────────────────────────────────────── */
function PlayersTable({ players, onDelete }: {
  players: Player[];
  onDelete: (id: string, name: string) => void;
}) {
  const [sortField, setSortField] = useState<"last_name" | "first_name" | "dob">("last_name");
  const [sortAsc,   setSortAsc]   = useState(true);

  const sorted = [...players].sort((a, b) => {
    const va = (a[sortField] ?? "") as string;
    const vb = (b[sortField] ?? "") as string;
    return sortAsc ? va.localeCompare(vb, "it") : vb.localeCompare(va, "it");
  });

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />
    ) : null;

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc((p) => !p);
    else { setSortField(field); setSortAsc(true); }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <th className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider w-12">N°</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer hover:text-[#0A1F44] select-none"
              onClick={() => handleSort("last_name")}>
              Cognome <SortIcon field="last_name" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer hover:text-[#0A1F44] select-none"
              onClick={() => handleSort("first_name")}>
              Nome <SortIcon field="first_name" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer hover:text-[#0A1F44] select-none"
              onClick={() => handleSort("dob")}>
              Data di Nascita <SortIcon field="dob" />
            </th>
            <th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((player, i) => (
            <tr key={player.id}
              className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F8FAFC] transition-colors group">
              <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs">{i + 1}</td>
              <td className="px-4 py-3 font-semibold text-[#0A1F44]">{player.last_name}</td>
              <td className="px-4 py-3 text-[#334155]">{player.first_name}</td>
              <td className="px-4 py-3 text-[#64748B] font-mono text-xs">{formatDob(player.dob)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(player.id, `${player.last_name} ${player.first_name}`)}
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors
                             text-transparent group-hover:text-red-400 hover:!text-red-600 ml-auto"
                  aria-label="Elimina giocatore"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* ─────────────────────────────────────────────
   Componente: Modal / Form inserimento giocatore
───────────────────────────────────────────── */
function AddPlayerModal({
  onClose,
  onSave,
  saving,
  error,
}: {
  onClose: () => void;
  onSave: (form: NewPlayerForm) => Promise<void>;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<NewPlayerForm>(EMPTY_FORM);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!form.first_name.trim()) { setLocalError("Inserisci il nome."); return; }
    if (!form.last_name.trim())  { setLocalError("Inserisci il cognome."); return; }
    await onSave(form);
  };

  const displayError = localError ?? error;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel — bottom sheet su mobile, centered modal su desktop */}
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#E2E8F0]" />
        </div>

        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-bold text-[#0A1F44] text-base">Nuovo Giocatore</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F4F6F9] flex items-center justify-center transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Errore */}
          {displayError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {displayError}
            </div>
          )}

          {/* Cognome */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Cognome <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
              placeholder="es. Rossi"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent
                         placeholder:text-[#CBD5E1] bg-[#F8FAFC]"
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
              placeholder="es. Mario"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent
                         placeholder:text-[#CBD5E1] bg-[#F8FAFC]"
            />
          </div>

          {/* Data di nascita */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Data di Nascita
            </label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent
                         bg-[#F8FAFC]"
            />
          </div>

          {/* Pulsanti */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={onClose}
              disabled={saving}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvataggio…
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Salva
                </>
              )}
            </Button>
          </div>
        </form>
        {/* Safe area bottom per iOS */}
        <div className="h-safe-area-inset-bottom sm:hidden" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente principale: AnagraficaContent
───────────────────────────────────────────── */
function AnagraficaContent() {
  const searchParams = useSearchParams();
  const teamName = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  const [teamId, setTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [pdfLoading, setPdfLoading] = useState(false);

  /* ── Carica squadra + giocatori ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1. Trova UUID squadra
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("name", teamName)
        .single();

      if (teamError || !teamData) {
        setLoadError(`Squadra "${teamName}" non trovata nel database. Assicurati che il seed SQL sia stato eseguito.`);
        return;
      }

      setTeamId(teamData.id);

      // 2. Carica giocatori ordinati per cognome + nome
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamData.id)
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (playersError) throw playersError;
      setPlayers(playersData ?? []);
    } catch (err) {
      console.error(err);
      setLoadError("Errore nel caricamento dei dati. Controlla la connessione a Supabase.");
    } finally {
      setLoading(false);
    }
  }, [teamName]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Salva giocatore ── */
  const handleSave = async (form: NewPlayerForm) => {
    if (!teamId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        team_id: teamId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        dob: form.dob || null,
      };

      const { data, error } = await supabase
        .from("players")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Aggiorna la lista localmente (senza refetch) — poi riordina
      setPlayers((prev) =>
        [...prev, data as Player].sort((a, b) =>
          a.last_name.localeCompare(b.last_name, "it") ||
          a.first_name.localeCompare(b.first_name, "it")
        )
      );
      setShowModal(false);
    } catch (err: unknown) {
      console.error(err);
      setSaveError("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Elimina giocatore ── */
  const handleDeletePlayer = async (id: string, name: string) => {
    if (!window.confirm(
      `Sei sicuro di voler eliminare ${name}?\n` +
      `Verranno eliminate anche tutte le presenze, le convocazioni e i dati abbigliamento associati.\n` +
      `L'azione è irreversibile.`
    )) return;
    try {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    } catch (e) { console.error("Errore eliminazione giocatore:", e); }
  };

  /* ── Esporta PDF ── */
  const handleExportPdf = async () => {
    if (players.length === 0) return;
    setPdfLoading(true);
    try {
      // Import dinamico — non serve il bundle in SSR
      const jsPDFModule = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Intestazione documento
      doc.setFillColor(10, 31, 68); // Navy
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setTextColor(245, 184, 0); // Gold
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("STABIA BASKET BTS & NPS", pageWidth / 2, 10, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(`Roster – ${teamName}`, pageWidth / 2, 19, { align: "center" });

      // Data generazione
      doc.setFillColor(244, 246, 249);
      doc.rect(0, 28, pageWidth, 8, "F");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Generato il ${format(new Date(), "dd/MM/yyyy 'alle' HH:mm", { locale: it })} · ${players.length} giocatori`,
        pageWidth / 2,
        33,
        { align: "center" }
      );

      // Giocatori in ordine alfabetico
      const sorted = [...players].sort(
        (a, b) =>
          a.last_name.localeCompare(b.last_name, "it") ||
          a.first_name.localeCompare(b.first_name, "it")
      );

      const rows = sorted.map((p, i) => [
        (i + 1).toString(),
        p.last_name.toUpperCase(),
        p.first_name,
        formatDob(p.dob),
      ]);

      autoTable(doc, {
        startY: 40,
        head: [["N°", "Cognome", "Nome", "Data di Nascita"]],
        body: rows,
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [10, 31, 68],
          textColor: [245, 184, 0],
          fontStyle: "bold",
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12, halign: "center", textColor: [148, 163, 184] },
          1: { fontStyle: "bold" },
          3: { halign: "center", textColor: [100, 116, 139] },
        },
        margin: { left: 14, right: 14 },
      });

      // Footer pagine
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Pag. ${i} di ${pageCount}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 6,
          { align: "right" }
        );
      }

      doc.save(`Roster_${teamName.replace(/\s+/g, "_")}.pdf`);
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
      <AppHeader
        title="Stabia Basket BTS & NPS"
        subtitle={`Anagrafica · ${teamName}`}
        showBack
        backHref={`/dashboard?team=${teamParam}`}
        backLabel="Dashboard"
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-12">

        {/* ── Titolo + statistiche ── */}
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-[#0A1F44]">Anagrafica</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            <span className="font-semibold text-[#0A1F44]">{teamName}</span>
            {!loading && ` · ${players.length} giocator${players.length === 1 ? "e" : "i"}`}
          </p>
        </div>

        {/* ── Barra azioni ── */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="primary"
            size="md"
            className="flex-1 sm:flex-none gap-2"
            onClick={() => { setSaveError(null); setShowModal(true); }}
            disabled={loading || !!loadError}
          >
            <UserPlus className="w-4 h-4" />
            Aggiungi Giocatore
          </Button>
          <Button
            variant="gold"
            size="md"
            className="flex-1 sm:flex-none gap-2"
            onClick={handleExportPdf}
            disabled={loading || players.length === 0 || pdfLoading}
          >
            {pdfLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Scarica PDF
          </Button>
        </div>

        {/* ── Stato: loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
            <p className="text-sm text-[#64748B]">Caricamento giocatori…</p>
          </div>
        )}

        {/* ── Stato: errore ── */}
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

        {/* ── Stato: lista vuota ── */}
        {!loading && !loadError && players.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl px-5 py-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
            <p className="font-semibold text-[#0A1F44] mb-1">Nessun giocatore ancora</p>
            <p className="text-sm text-[#94A3B8]">
              Clicca su "Aggiungi Giocatore" per inserire il primo tesserato.
            </p>
          </div>
        )}

        {/* ── Lista giocatori: MOBILE (card) ── */}
        {!loading && !loadError && players.length > 0 && (
          <>
            {/* Mobile */}
            <div className="flex flex-col gap-2.5 sm:hidden">
              {players.map((p, i) => (
                <PlayerCard key={p.id} player={p} index={i} onDelete={handleDeletePlayer} />
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden sm:block">
              <PlayersTable players={players} onDelete={handleDeletePlayer} />
            </div>
          </>
        )}
      </main>

      {/* ── Modal Aggiungi Giocatore ── */}
      {showModal && (
        <AddPlayerModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Export con Suspense (richiesto da useSearchParams)
───────────────────────────────────────────── */
export default function AnagraficaPage() {
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
      <AnagraficaContent />
    </Suspense>
  );
}
