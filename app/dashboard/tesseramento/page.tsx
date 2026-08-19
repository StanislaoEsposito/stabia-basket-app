"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { BadgeCheck, Pencil, X, Loader2, AlertCircle, Save } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase, type Player } from "@/lib/supabase";
import { getExpiryStatus, EXPIRY_BADGE } from "@/lib/dateUtils";

/* ─────────────────────────────────────────────
   Costanti
───────────────────────────────────────────── */
const MEMBER_TYPES = ["FIP", "Libertas", "Altro"] as const;
type MemberType = (typeof MEMBER_TYPES)[number] | null;

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
   Badge tipo tesseramento
───────────────────────────────────────────── */
const TYPE_COLORS: Record<string, string> = {
  FIP:      "bg-blue-100 text-blue-700 border border-blue-200",
  Libertas: "bg-purple-100 text-purple-700 border border-purple-200",
  Altro:    "bg-gray-100 text-gray-600 border border-gray-200",
};

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      Non impostato
    </span>
  );
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[type] ?? TYPE_COLORS.Altro}`}>
      {type}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Modal modifica tesseramento
───────────────────────────────────────────── */
function EditModal({
  player,
  onClose,
  onSave,
  saving,
}: {
  player: Player;
  onClose: () => void;
  onSave: (id: string, type: MemberType, expiry: string | null) => Promise<void>;
  saving: boolean;
}) {
  const [type, setType] = useState<MemberType>(player.member_type as MemberType ?? null);
  const [expiry, setExpiry] = useState(player.member_expiry ?? "");

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
            <p className="text-xs text-[#94A3B8] font-medium">Tesseramento</p>
            <h2 className="font-bold text-[#0A1F44]">{player.last_name} {player.first_name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F4F6F9] flex items-center justify-center">
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
              Tipo Tesseramento
            </label>
            <div className="flex gap-2 flex-wrap">
              {[null, ...MEMBER_TYPES].map((t) => (
                <button
                  key={t ?? "nessuno"}
                  onClick={() => setType(t as MemberType)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    type === t
                      ? "border-[#0A1F44] bg-[#0A1F44] text-white"
                      : "border-[#E2E8F0] text-[#64748B] hover:border-[#0A1F44]/30"
                  }`}
                >
                  {t ?? "Nessuno"}
                </button>
              ))}
            </div>
          </div>

          {/* Scadenza */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
              Data Scadenza Tesseramento
            </label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
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
              onClick={() => onSave(player.id, type, expiry || null)}
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
function PlayerRow({ player, onEdit }: { player: Player; onEdit: (p: Player) => void }) {
  const expStatus = getExpiryStatus(player.member_expiry);
  const borderColor =
    expStatus === "expired" || expStatus === "missing" || !player.member_type
      ? "border-red-200 bg-red-50/50"
      : expStatus === "expiring"
      ? "border-amber-200 bg-amber-50/50"
      : "border-[#E2E8F0] bg-white";

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${borderColor}`}>
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#0A1F44]/10 flex items-center justify-center">
        <span className="text-xs font-bold text-[#0A1F44]">
          {player.last_name.charAt(0)}{player.first_name.charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0A1F44] text-sm truncate">
          {player.last_name} {player.first_name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <TypeBadge type={player.member_type} />
          <ExpiryBadge date={player.member_expiry} />
          {fmtDate(player.member_expiry) && (
            <span className="text-xs text-[#94A3B8] font-mono">{fmtDate(player.member_expiry)}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onEdit(player)}
        className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-[#F4F6F9] flex items-center justify-center transition-colors"
      >
        <Pencil className="w-3.5 h-3.5 text-[#64748B]" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Contenuto principale
───────────────────────────────────────────── */
function TesseramentoContent() {
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

  const handleSave = async (id: string, type: MemberType, expiry: string | null) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("players")
        .update({ member_type: type, member_expiry: expiry })
        .eq("id", id);
      if (error) throw error;
      setPlayers((prev) =>
        prev.map((p) => p.id === id ? { ...p, member_type: type, member_expiry: expiry } : p)
      );
      setEditing(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  /* Statistiche */
  const stats = {
    fip: players.filter((p) => p.member_type === "FIP").length,
    libertas: players.filter((p) => p.member_type === "Libertas").length,
    other: players.filter((p) => !p.member_type).length,
    expiring: players.filter((p) => getExpiryStatus(p.member_expiry) === "expiring").length,
    expired: players.filter((p) => {
      const s = getExpiryStatus(p.member_expiry);
      return s === "expired" || s === "missing";
    }).length,
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <AppHeader
        title="Stabia Basket BTS & NPS"
        subtitle={`Tesseramento · ${teamName}`}
        showBack backHref={`/dashboard?team=${teamParam}`} backLabel="Dashboard"
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-12">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-[#0A1F44] flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-indigo-500" /> Tesseramento
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            <span className="font-semibold text-[#0A1F44]">{teamName}</span>
          </p>
        </div>

        {/* Statistiche */}
        {!loading && !error && players.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "FIP", count: stats.fip, bg: "bg-blue-50 border-blue-200" },
              { label: "Libertas", count: stats.libertas, bg: "bg-purple-50 border-purple-200" },
              { label: "In scadenza", count: stats.expiring, bg: "bg-amber-50 border-amber-200" },
              { label: "Problemi", count: stats.expired + stats.other, bg: "bg-red-50 border-red-200" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border px-3 py-3 text-center ${s.bg}`}>
                <p className="text-2xl font-extrabold text-[#0A1F44]">{s.count}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{s.label}</p>
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
              [...players]
                .sort((a, b) => {
                  const rank = (p: Player) => {
                    if (!p.member_type) return 0;
                    const s = getExpiryStatus(p.member_expiry);
                    if (s === "expired" || s === "missing") return 1;
                    if (s === "expiring") return 2;
                    return 3;
                  };
                  return rank(a) - rank(b);
                })
                .map((p) => <PlayerRow key={p.id} player={p} onEdit={setEditing} />)
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

export default function TesseramentoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" /></div>}>
      <TesseramentoContent />
    </Suspense>
  );
}
