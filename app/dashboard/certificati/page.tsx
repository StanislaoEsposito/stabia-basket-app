"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { HeartPulse, Pencil, X, Loader2, AlertCircle, Save } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase, type Player } from "@/lib/supabase";
import { getExpiryStatus, EXPIRY_BADGE } from "@/lib/dateUtils";

/* ─────────────────────────────────────────────
   Utilità
───────────────────────────────────────────── */
function fmtDate(d: string | null) {
  if (!d) return null;
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: it }); }
  catch { return d; }
}

/* ─────────────────────────────────────────────
   Badge scadenza
───────────────────────────────────────────── */
function ExpiryBadge({ date }: { date: string | null }) {
  const status = getExpiryStatus(date);
  const badge = EXPIRY_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
      {badge.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Modal modifica data medica
───────────────────────────────────────────── */
function EditModal({
  player,
  onClose,
  onSave,
  saving,
}: {
  player: Player;
  onClose: () => void;
  onSave: (playerId: string, date: string | null) => Promise<void>;
  saving: boolean;
}) {
  const [date, setDate] = useState(player.med_expiry ?? "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#E2E8F0]" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <p className="text-xs text-[#94A3B8] font-medium">Certificato medico</p>
            <h2 className="font-bold text-[#0A1F44]">{player.last_name} {player.first_name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F4F6F9] flex items-center justify-center">
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
              Data Scadenza Certificato Medico
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" size="md" className="flex-1" onClick={onClose} disabled={saving}>
              Annulla
            </Button>
            <Button
              variant="primary" size="md" className="flex-1 gap-2"
              onClick={() => onSave(player.id, date || null)}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salva
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Riga giocatore
───────────────────────────────────────────── */
function PlayerRow({
  player,
  onEdit,
}: {
  player: Player;
  onEdit: (p: Player) => void;
}) {
  const status = getExpiryStatus(player.med_expiry);
  const formatted = fmtDate(player.med_expiry);

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors
      ${status === "expired" || status === "missing" ? "bg-red-50/60 border-red-200" :
        status === "expiring" ? "bg-amber-50/60 border-amber-200" :
        "bg-white border-[#E2E8F0]"}
    `}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#0A1F44]/10 flex items-center justify-center">
        <span className="text-xs font-bold text-[#0A1F44]">
          {player.last_name.charAt(0)}{player.first_name.charAt(0)}
        </span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0A1F44] text-sm truncate">
          {player.last_name} {player.first_name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <ExpiryBadge date={player.med_expiry} />
          {formatted && (
            <span className="text-xs text-[#94A3B8] font-mono">{formatted}</span>
          )}
        </div>
      </div>
      {/* Modifica */}
      <button
        onClick={() => onEdit(player)}
        className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-[#F4F6F9] flex items-center justify-center transition-colors"
        aria-label="Modifica data certificato"
      >
        <Pencil className="w-3.5 h-3.5 text-[#64748B]" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Contenuto principale
───────────────────────────────────────────── */
function CertificatiContent() {
  const searchParams = useSearchParams();
  const teamName = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Player | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: teamData, error: tErr } = await supabase
        .from("teams").select("id").eq("name", teamName).single();
      if (tErr || !teamData) { setError(`Squadra "${teamName}" non trovata.`); return; }

      const { data, error: pErr } = await supabase
        .from("players").select("*")
        .eq("team_id", teamData.id)
        .order("last_name").order("first_name");
      if (pErr) throw pErr;
      setPlayers(data ?? []);
    } catch (e) {
      setError("Errore caricamento dati."); console.error(e);
    } finally { setLoading(false); }
  }, [teamName]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (playerId: string, date: string | null) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("players").update({ med_expiry: date }).eq("id", playerId);
      if (error) throw error;
      setPlayers((prev) =>
        prev.map((p) => p.id === playerId ? { ...p, med_expiry: date } : p)
      );
      setEditing(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  /* Statistiche */
  const stats = players.reduce(
    (acc, p) => {
      const s = getExpiryStatus(p.med_expiry);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <AppHeader
        title="Stabia Basket BTS & NPS"
        subtitle={`Certificati · ${teamName}`}
        showBack backHref={`/dashboard?team=${teamParam}`} backLabel="Dashboard"
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-12">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-[#0A1F44] flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-500" /> Certificati Medici
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            <span className="font-semibold text-[#0A1F44]">{teamName}</span>
          </p>
        </div>

        {/* Riepilogo */}
        {!loading && !error && players.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Validi", count: stats.valid ?? 0, color: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
              { label: "In scadenza", count: stats.expiring ?? 0, color: "bg-amber-500", bg: "bg-amber-50 border-amber-200" },
              { label: "Scaduti/Assenti", count: (stats.expired ?? 0) + (stats.missing ?? 0), color: "bg-red-500", bg: "bg-red-50 border-red-200" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border px-3 py-3 text-center ${s.bg}`}>
                <p className="text-2xl font-extrabold text-[#0A1F44]">{s.count}</p>
                <p className="text-xs text-[#64748B] mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-2.5">
            {players.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl py-12 text-center">
                <p className="text-[#94A3B8] text-sm">Nessun giocatore trovato.</p>
              </div>
            ) : (
              /* Ordina: prima i problematici */
              [...players]
                .sort((a, b) => {
                  const order: Record<string, number> = { expired: 0, missing: 1, expiring: 2, valid: 3 };
                  return (order[getExpiryStatus(a.med_expiry)] ?? 4) - (order[getExpiryStatus(b.med_expiry)] ?? 4);
                })
                .map((p) => (
                  <PlayerRow key={p.id} player={p} onEdit={setEditing} />
                ))
            )}
          </div>
        )}
      </main>

      {editing && (
        <EditModal
          player={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

export default function CertificatiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" /></div>}>
      <CertificatiContent />
    </Suspense>
  );
}
