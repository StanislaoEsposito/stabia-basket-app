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
  Pencil,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Check,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase, type Player, type Team, updatePlayer, togglePlayerPayment, type RataField } from "@/lib/supabase";

/* ─────────────────────────────────────────────
   Utilità
───────────────────────────────────────────── */
function getDynamicHeader(teamName: string): string {
  const upper = teamName.toUpperCase();
  if (upper.includes("FEMM") || upper.includes("BFS")) return "Basket Femminile Stabia";
  if (upper.includes("AQUILOTTI") || upper.includes("PULCINI") || upper.includes("SCOIATTOLI")) return "Minibasket Stabia";
  return "Stabia Basket BTS & NPS";
}

function formatDob(dob: string | null): string {
  if (!dob) return "—";
  try {
    return format(parseISO(dob), "dd/MM/yyyy", { locale: it });
  } catch {
    return dob;
  }
}

function formatPlayerName(player: Player): string {
  const cap = player.is_captain ? " (C)" : "";
  const num = player.jersey_number ? `[#${player.jersey_number}] ` : "";
  return `${num}${player.last_name} ${player.first_name}${cap}`.toUpperCase();
}

/* ─────────────────────────────────────────────
   Componente: Pill rata pagamento
   Cerchietto cliccabile: verde+spunta = pagata, grigio = non pagata.
   Chiama onPaymentClick per richiedere il PIN prima di aggiornare.
───────────────────────────────────────────── */
function RatePills({
  player,
  isMinibasket,
  onPaymentClick,
}: {
  player: Player;
  isMinibasket: boolean;
  onPaymentClick: (playerId: string, field: RataField, currentValue: boolean) => void;
}) {
  const rateCount = isMinibasket ? 4 : 3;
  const fields: RataField[] = ["p_rata_1", "p_rata_2", "p_rata_3", "p_rata_4"];

  return (
    <div className="flex items-center gap-1.5">
      {fields.slice(0, rateCount).map((field, i) => {
        const paid = player[field] ?? false;
        return (
          <button
            key={field}
            onClick={() => onPaymentClick(player.id, field, paid)}
            title={paid ? `Rata ${i + 1} — Pagata (clicca per stornare)` : `Rata ${i + 1} — Non pagata (clicca per segnare)`}
            aria-label={`Rata ${i + 1} ${paid ? "pagata" : "non pagata"}`}
            className={`
              w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px]
              border-2 transition-all duration-200 active:scale-90 select-none
              ${paid
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200"
                : "bg-white border-[#CBD5E1] text-[#94A3B8] hover:border-[#0A1F44] hover:text-[#0A1F44]"
              }
            `}
          >
            {paid ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : `R${i + 1}`}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tipi
───────────────────────────────────────────── */
interface NewPlayerForm {
  first_name: string;
  last_name: string;
  dob: string;
  jersey_number: string;
  is_captain: boolean;
  phone_athlete: string;
  phone_parent: string;
}

interface EditPlayerForm extends NewPlayerForm {
  team_id: string; // Permette di cambiare la squadra di appartenenza
}

const EMPTY_FORM: NewPlayerForm = { 
  first_name: "", 
  last_name: "", 
  dob: "", 
  jersey_number: "", 
  is_captain: false, 
  phone_athlete: "", 
  phone_parent: "" 
};

/* ─────────────────────────────────────────────
   Componente: Riga giocatore su MOBILE (Card)
───────────────────────────────────────────── */
function PlayerCard({ player, index, onDelete, onToggleCaptain, onEdit }: {
  player: Player; 
  index: number; 
  isMinibasket: boolean;
  onDelete: (id: string, name: string) => void;
  onToggleCaptain: (id: string, status: boolean) => void;
  onEdit: (player: Player) => void;
  onPaymentClick: (playerId: string, field: RataField, currentValue: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3 shadow-sm group">
      <div className="flex items-center gap-4">
        {/* Numero */}
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0A1F44] text-white text-xs font-bold flex items-center justify-center">
          {player.jersey_number ? player.jersey_number : index + 1}
        </span>
        {/* Dati */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-[#0A1F44] text-sm leading-tight truncate uppercase">
              {player.last_name} {player.first_name}
            </p>
            <button
              onClick={() => onToggleCaptain(player.id, player.is_captain)}
              className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                player.is_captain 
                  ? "bg-[#F5B800]/20 text-[#D97706]" 
                  : "text-[#CBD5E1] bg-transparent hover:text-[#94A3B8] hover:bg-[#F4F6F9]"
              }`}
              aria-label="Toggle Capitano"
              title={player.is_captain ? "Rimuovi capitano" : "Rendi capitano"}
            >
              (C)
            </button>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {player.dob ? formatDob(player.dob) : "Nascita N/D"}
            {player.phone_athlete && ` · Cel: ${player.phone_athlete}`}
            {player.phone_parent && ` · Gen: ${player.phone_parent}`}
          </p>
        </div>
        {/* Azioni */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(player)}
            className="w-9 h-9 rounded-xl hover:bg-blue-50 flex items-center justify-center
                       transition-colors text-[#64748B] hover:text-blue-600 active:scale-95"
            aria-label="Modifica giocatore"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(player.id, `${player.last_name} ${player.first_name}`)}
            className="w-9 h-9 rounded-xl hover:bg-red-50 flex items-center justify-center
                       transition-colors text-red-400 hover:text-red-600 active:scale-95"
            aria-label="Elimina giocatore"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* ── Riga Pagamenti ── */}
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[#F4F6F9]">
        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide flex-shrink-0">Quote:</span>
        <RatePills player={player} isMinibasket={isMinibasket} onPaymentClick={onPaymentClick} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente: Tabella giocatori su DESKTOP
───────────────────────────────────────────── */
function PlayersTable({ players, onDelete, onToggleCaptain, onEdit, isMinibasket, onPaymentClick }: {
  players: Player[];
  isMinibasket: boolean;
  onDelete: (id: string, name: string) => void;
  onToggleCaptain: (id: string, status: boolean) => void;
  onEdit: (player: Player) => void;
  onPaymentClick: (playerId: string, field: RataField, currentValue: boolean) => void;
}) {
  const [sortField, setSortField] = useState<"last_name" | "first_name" | "dob" | "jersey_number">("last_name");
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
            <th className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider cursor-pointer select-none"
              onClick={() => handleSort("jersey_number")}>
              Maglia <SortIcon field="jersey_number" />
            </th>
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
              Nascita <SortIcon field="dob" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">Telefoni</th>
            <th className="px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider text-left">
              Quote {isMinibasket ? "(4)" : "(3)"}
            </th>
            <th className="w-20 px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player) => (
            <tr key={player.id}
              className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F8FAFC] transition-colors group">
              <td className="px-4 py-3 text-[#0A1F44] font-bold text-sm text-center w-16">{player.jersey_number || "-"}</td>
              <td className="px-4 py-3 font-semibold text-[#0A1F44] uppercase">
                <div className="flex items-center gap-2">
                  <span>{player.last_name}</span>
                  <button
                    onClick={() => onToggleCaptain(player.id, player.is_captain)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                      player.is_captain 
                        ? "bg-[#F5B800]/20 text-[#D97706]" 
                        : "text-[#CBD5E1] bg-transparent hover:text-[#94A3B8] hover:bg-[#F4F6F9]"
                    }`}
                    aria-label="Toggle Capitano"
                    title={player.is_captain ? "Rimuovi capitano" : "Rendi capitano"}
                  >
                    (C)
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-[#334155] uppercase">{player.first_name}</td>
              <td className="px-4 py-3 text-[#64748B] font-mono text-xs">{formatDob(player.dob)}</td>
              <td className="px-4 py-3 text-[#64748B] text-xs">
                {player.phone_athlete && <div>Atl: {player.phone_athlete}</div>}
                {player.phone_parent && <div>Gen: {player.phone_parent}</div>}
              </td>
              {/* ── Colonna Quote ── */}
              <td className="px-4 py-3">
                <RatePills
                  player={player}
                  isMinibasket={isMinibasket}
                  onPaymentClick={onPaymentClick}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(player)}
                    className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center transition-colors
                               text-transparent group-hover:text-[#64748B] hover:!text-blue-600"
                    aria-label="Modifica giocatore"
                    title="Modifica"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(player.id, `${player.last_name} ${player.first_name}`)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors
                               text-transparent group-hover:text-red-400 hover:!text-red-600"
                    aria-label="Elimina giocatore"
                    title="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl mt-12 sm:mt-0 mb-auto sm:mb-0">
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
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Errore */}
          {displayError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {displayError}
            </div>
          )}

          <div className="flex gap-4">
            {/* Cognome */}
            <div className="flex-1">
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
            <div className="flex-1">
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
          </div>

          <div className="flex gap-4 items-end">
            {/* Numero Maglia */}
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                N° Maglia
              </label>
              <input
                type="text"
                value={form.jersey_number}
                onChange={(e) => setForm((p) => ({ ...p, jersey_number: e.target.value }))}
                placeholder="es. 23"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent
                           bg-[#F8FAFC]"
              />
            </div>
            {/* Capitano Toggle */}
            <div className="flex-1 flex items-center mb-2.5 gap-2">
              <input
                type="checkbox"
                id="is_captain"
                checked={form.is_captain}
                onChange={(e) => setForm((p) => ({ ...p, is_captain: e.target.checked }))}
                className="w-4 h-4 rounded text-[#0A1F44] focus:ring-[#0A1F44] cursor-pointer"
              />
              <label htmlFor="is_captain" className="text-sm font-semibold text-[#0A1F44] cursor-pointer select-none">
                Capitano della squadra
              </label>
            </div>
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

          {/* Telefoni */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Cellulare Atleta
              </label>
              <input
                type="tel"
                value={form.phone_athlete}
                onChange={(e) => setForm((p) => ({ ...p, phone_athlete: e.target.value }))}
                placeholder="+39 333..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent
                           placeholder:text-[#CBD5E1] bg-[#F8FAFC]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Cellulare Genitore
              </label>
              <input
                type="tel"
                value={form.phone_parent}
                onChange={(e) => setForm((p) => ({ ...p, phone_parent: e.target.value }))}
                placeholder="+39 333..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] focus:border-transparent
                           placeholder:text-[#CBD5E1] bg-[#F8FAFC]"
              />
            </div>
          </div>

          {/* Pulsanti */}
          <div className="flex gap-3 pt-4 border-t border-[#E2E8F0] mt-4">
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
   Componente: PIN Prompt Modale (inline, leggero)
   Chiede il PIN prima di eseguire un'azione sensibile.
   NON blocca l'intera pagina come PinGuard.
───────────────────────────────────────────── */
const CORRECT_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1234";

function PinPromptModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      onConfirm();
    } else {
      const n = attempts + 1;
      setAttempts(n);
      setError(n >= 3 ? `PIN errato (${n} tentativi). Contatta il responsabile.` : "PIN errato. Riprova.");
      setPin("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0A1F44] flex items-center justify-center">
              <Lock className="w-4.5 h-4.5 text-[#F5B800]" />
            </div>
            <div>
              <h3 className="font-bold text-[#0A1F44] text-sm">Conferma Modifica</h3>
              <p className="text-xs text-[#94A3B8]">Inserisci il PIN amministratore</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F4F6F9] flex items-center justify-center">
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>

        {/* Form PIN */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg border border-red-200">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(null); }}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-3 pr-12
                         rounded-xl border-2 border-[#E2E8F0] focus:border-[#0A1F44] focus:outline-none
                         bg-[#F8FAFC] text-[#0A1F44]"
            />
            <button
              type="button"
              onClick={() => setShowPin((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" size="md" className="flex-1" onClick={onClose}>Annulla</Button>
            <Button type="submit" variant="primary" size="md" className="flex-1 gap-1.5" disabled={pin.length === 0}>
              <ShieldCheck className="w-4 h-4" /> Conferma
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente: Modale Modifica Giocatore
   Form pre-compilato con tutti i campi + select squadra
───────────────────────────────────────────── */
function EditPlayerModal({
  player,
  teams,
  onClose,
  onSave,
  saving,
  error,
}: {
  player: Player;
  teams: Team[];
  onClose: () => void;
  onSave: (form: EditPlayerForm) => void; // Non async: il save reale avviene dopo il PIN
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<EditPlayerForm>({
    first_name: player.first_name,
    last_name: player.last_name,
    dob: player.dob ?? "",
    jersey_number: player.jersey_number ?? "",
    is_captain: player.is_captain,
    phone_athlete: player.phone_athlete ?? "",
    phone_parent: player.phone_parent ?? "",
    team_id: player.team_id,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!form.first_name.trim()) { setLocalError("Inserisci il nome."); return; }
    if (!form.last_name.trim())  { setLocalError("Inserisci il cognome."); return; }
    onSave(form); // Passa il form al genitore che aprirà il PIN modal
  };

  const displayError = localError ?? error;
  const isTeamChanged = form.team_id !== player.team_id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl mt-12 sm:mt-0 mb-auto sm:mb-0">
        {/* Handle bar mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#E2E8F0]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-[#0A1F44] text-base">Modifica Giocatore</h2>
              <p className="text-xs text-[#94A3B8]">{player.last_name} {player.first_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F4F6F9] flex items-center justify-center" aria-label="Chiudi">
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {displayError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {displayError}
            </div>
          )}

          {/* Nome e Cognome */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Cognome <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Nome <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]" />
            </div>
          </div>

          {/* Maglia + Capitano */}
          <div className="flex gap-4 items-end">
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">N° Maglia</label>
              <input type="text" value={form.jersey_number}
                onChange={(e) => setForm((p) => ({ ...p, jersey_number: e.target.value }))}
                placeholder="es. 23"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]" />
            </div>
            <div className="flex-1 flex items-center mb-2.5 gap-2">
              <input type="checkbox" id="edit_is_captain" checked={form.is_captain}
                onChange={(e) => setForm((p) => ({ ...p, is_captain: e.target.checked }))}
                className="w-4 h-4 rounded text-[#0A1F44] focus:ring-[#0A1F44] cursor-pointer" />
              <label htmlFor="edit_is_captain" className="text-sm font-semibold text-[#0A1F44] cursor-pointer select-none">
                Capitano della squadra
              </label>
            </div>
          </div>

          {/* Data di nascita */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Data di Nascita</label>
            <input type="date" value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]" />
          </div>

          {/* Telefoni */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Cellulare Atleta</label>
              <input type="tel" value={form.phone_athlete}
                onChange={(e) => setForm((p) => ({ ...p, phone_athlete: e.target.value }))}
                placeholder="+39 333..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] placeholder:text-[#CBD5E1] bg-[#F8FAFC]" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Cellulare Genitore</label>
              <input type="tel" value={form.phone_parent}
                onChange={(e) => setForm((p) => ({ ...p, phone_parent: e.target.value }))}
                placeholder="+39 333..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0A1F44] placeholder:text-[#CBD5E1] bg-[#F8FAFC]" />
            </div>
          </div>

          {/* ── Cambio Squadra ── */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
              Squadra
            </label>
            <div className="relative">
              <select
                value={form.team_id}
                onChange={(e) => setForm((p) => ({ ...p, team_id: e.target.value }))}
                className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-[#E2E8F0]
                           text-[#0A1F44] text-sm bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
            </div>
            {isTeamChanged && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                ⚠️ Il giocatore verrà spostato in un&apos;altra squadra. Lo storico presenze e convocazioni rimarrà intatto.
              </p>
            )}
          </div>

          {/* Pulsanti */}
          <div className="flex gap-3 pt-4 border-t border-[#E2E8F0] mt-2">
            <Button type="button" variant="ghost" size="md" className="flex-1" onClick={onClose} disabled={saving}>
              Annulla
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1 gap-1.5" disabled={saving}>
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvataggio…</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Salva con PIN</>
              )}
            </Button>
          </div>
        </form>
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [isMinibasket, setIsMinibasket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── State per modifica giocatore ──
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingEditForm, setPendingEditForm] = useState<EditPlayerForm | null>(null);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── State per pagamenti rate ──
  // pendingPayment tiene in sospeso il click fino alla conferma PIN
  const [pendingPayment, setPendingPayment] = useState<{
    playerId: string;
    field: RataField;
    newValue: boolean;
  } | null>(null);
  const [showPaymentPinPrompt, setShowPaymentPinPrompt] = useState(false);

  const [pdfLoading, setPdfLoading] = useState(false);

  /* ── Carica squadra + giocatori + tutte le squadre ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Carica UUID+is_minibasket squadra corrente e lista di tutte le squadre in parallelo
      const [{ data: teamData, error: teamError }, { data: allTeams }] = await Promise.all([
        supabase.from("teams").select("id, is_minibasket").eq("name", teamName).single(),
        supabase.from("teams").select("*").order("name"),
      ]);

      if (teamError || !teamData) {
        setLoadError(`Squadra "${teamName}" non trovata nel database. Assicurati che il seed SQL sia stato eseguito.`);
        return;
      }

      setTeamId(teamData.id);
      setIsMinibasket((teamData as Team).is_minibasket ?? false);
      setTeams((allTeams as Team[]) ?? []);

      // Carica giocatori ordinati per cognome + nome
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
        first_name: form.first_name.trim().toUpperCase(),
        last_name: form.last_name.trim().toUpperCase(),
        dob: form.dob || null,
        jersey_number: form.jersey_number.trim() || null,
        is_captain: form.is_captain,
        phone_athlete: form.phone_athlete.trim() || null,
        phone_parent: form.phone_parent.trim() || null,
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

  /* ── Quick Toggle Capitano ── */
  const handleToggleCaptain = async (playerId: string, currentStatus: boolean) => {
    if (!teamId) return;
    const newStatus = !currentStatus;

    // Aggiornamento ottimistico dell'interfaccia (Optimistic UI)
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          return { ...p, is_captain: newStatus };
        }
        // Se stiamo eleggendo un nuovo capitano, rimuoviamo lo status a tutti gli altri
        if (newStatus && p.is_captain) {
          return { ...p, is_captain: false };
        }
        return p;
      })
    );

    try {
      if (newStatus) {
        // Togli capitano agli altri giocatori della stessa squadra
        await supabase
          .from("players")
          .update({ is_captain: false })
          .eq("team_id", teamId);
      }
      
      // Imposta il nuovo status al giocatore scelto
      const { error } = await supabase
        .from("players")
        .update({ is_captain: newStatus })
        .eq("id", playerId);
        
      if (error) throw error;
    } catch (err) {
      console.error("Errore durante l'aggiornamento del capitano:", err);
      // In caso di errore, ricarica i dati reali per sicurezza
      loadData();
    }
  };

  /* ── Apri modale modifica ── */
  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditError(null);
    setShowEditModal(true);
  };

  /* ── Riceve il form, apre il PIN prompt ── */
  const handleEditFormSave = (form: EditPlayerForm) => {
    setPendingEditForm(form);
    setShowPinPrompt(true);
  };

  /* ── Salva dopo conferma PIN ── */
  const handleConfirmEdit = async () => {
    if (!editingPlayer || !pendingEditForm) return;
    setShowPinPrompt(false);
    setSavingEdit(true);
    setEditError(null);
    try {
      const payload: Partial<Omit<Player, "id">> = {
        first_name: pendingEditForm.first_name.trim().toUpperCase(),
        last_name: pendingEditForm.last_name.trim().toUpperCase(),
        dob: pendingEditForm.dob || null,
        jersey_number: pendingEditForm.jersey_number.trim() || null,
        is_captain: pendingEditForm.is_captain,
        phone_athlete: pendingEditForm.phone_athlete.trim() || null,
        phone_parent: pendingEditForm.phone_parent.trim() || null,
        team_id: pendingEditForm.team_id,
      };

      const { data: updated, error: updateError } = await updatePlayer(editingPlayer.id, payload);
      if (updateError || !updated) throw new Error(updateError ?? "Errore sconosciuto");

      const teamChanged = pendingEditForm.team_id !== editingPlayer.team_id;
      if (teamChanged) {
        // Il giocatore è stato spostato: va rimosso dalla lista corrente
        setPlayers((prev) => prev.filter((p) => p.id !== editingPlayer.id));
      } else {
        // Aggiornamento ottimistico nella lista corrente
        setPlayers((prev) =>
          prev
            .map((p) => (p.id === editingPlayer.id ? updated : p))
            .sort((a, b) =>
              a.last_name.localeCompare(b.last_name, "it") ||
              a.first_name.localeCompare(b.first_name, "it")
            )
        );
      }
      setShowEditModal(false);
      setEditingPlayer(null);
      setPendingEditForm(null);
    } catch (err) {
      console.error("Errore modifica giocatore:", err);
      setEditError("Errore nel salvataggio. Riprova.");
    } finally {
      setSavingEdit(false);
    }
  };

  /* ── Pagamento rata: click sulla pill → mette in attesa il PIN ── */
  const handlePaymentClick = (playerId: string, field: RataField, currentValue: boolean) => {
    setPendingPayment({ playerId, field, newValue: !currentValue });
    setShowPaymentPinPrompt(true);
  };

  /* ── Pagamento rata: dopo conferma PIN → aggiorna DB ── */
  const handleConfirmPayment = async () => {
    if (!pendingPayment) return;
    setShowPaymentPinPrompt(false);
    const { playerId, field, newValue } = pendingPayment;
    setPendingPayment(null);

    // Aggiornamento ottimistico: aggiorna subito la UI
    setPlayers((prev) =>
      prev.map((p) => p.id === playerId ? { ...p, [field]: newValue } : p)
    );

    try {
      const { error } = await togglePlayerPayment(playerId, field, newValue);
      if (error) throw new Error(error);
    } catch (err) {
      // In caso di errore, ripristina il valore originale
      console.error("Errore aggiornamento pagamento:", err);
      setPlayers((prev) =>
        prev.map((p) => p.id === playerId ? { ...p, [field]: !newValue } : p)
      );
    }
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
      doc.text(getDynamicHeader(teamName), pageWidth / 2, 10, { align: "center" });

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
        formatPlayerName(p),
        formatDob(p.dob),
        p.phone_athlete || p.phone_parent || "",
      ]);

      autoTable(doc, {
        startY: 40,
        head: [["N°", "Giocatore (Maglia/Cap.)", "Data di Nascita", "Contatti"]],
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
          0: { cellWidth: 10, halign: "center", textColor: [148, 163, 184] },
          1: { fontStyle: "bold" },
          2: { halign: "center", textColor: [100, 116, 139], cellWidth: 35 },
          3: { textColor: [100, 116, 139] },
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
                <PlayerCard 
                  key={p.id} 
                  player={p} 
                  index={i}
                  isMinibasket={isMinibasket}
                  onDelete={handleDeletePlayer} 
                  onToggleCaptain={handleToggleCaptain}
                  onEdit={handleEditPlayer}
                  onPaymentClick={handlePaymentClick}
                />
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden sm:block">
              <PlayersTable 
                players={players} 
                isMinibasket={isMinibasket}
                onDelete={handleDeletePlayer} 
                onToggleCaptain={handleToggleCaptain}
                onEdit={handleEditPlayer}
                onPaymentClick={handlePaymentClick}
              />
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

      {/* ── Modal Modifica Giocatore ── */}
      {showEditModal && editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          teams={teams}
          onClose={() => { setShowEditModal(false); setEditingPlayer(null); setEditError(null); }}
          onSave={handleEditFormSave}
          saving={savingEdit}
          error={editError}
        />
      )}

      {/* ── Modal PIN di Conferma (Modifica Anagrafica) ── */}
      {showPinPrompt && (
        <PinPromptModal
          onConfirm={handleConfirmEdit}
          onClose={() => { setShowPinPrompt(false); setPendingEditForm(null); }}
        />
      )}

      {/* ── Modal PIN di Conferma (Pagamento Rata) ── */}
      {showPaymentPinPrompt && (
        <PinPromptModal
          onConfirm={handleConfirmPayment}
          onClose={() => { setShowPaymentPinPrompt(false); setPendingPayment(null); }}
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
