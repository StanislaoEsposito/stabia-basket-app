"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  ShoppingBag, FileDown, ChevronDown, ChevronUp,
  Loader2, AlertCircle, Check,
  Shirt, Backpack, PersonStanding, Layers, Tag,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────
   Tipi
───────────────────────────────────────────── */
type ApparelKey = "jersey" | "backpack" | "tracksuit" | "jacket" | "tshirt" | "polo";

interface ApparelData {
  jersey: boolean; backpack: boolean; tracksuit: boolean;
  jacket: boolean; tshirt: boolean; polo: boolean;
}

interface PlayerWithApparel {
  id: string; first_name: string; last_name: string;
  size: string | null; apparel: ApparelData;
}

const DEFAULT_APPAREL: ApparelData = {
  jersey: false, backpack: false, tracksuit: false,
  jacket: false, tshirt: false, polo: false,
};

/* ─────────────────────────────────────────────
   Definizione capi — icone Lucide al posto delle emoji
───────────────────────────────────────────── */
const ITEMS: {
  key: ApparelKey;
  label: string;
  Icon: React.ElementType;
  color: string;       // testo/icona
  bgActive: string;    // sfondo quando attivo
}[] = [
  { key: "jersey",    label: "Canotta",   Icon: Shirt,          color: "#0EA5E9", bgActive: "bg-sky-50 border-sky-200"     },
  { key: "backpack",  label: "Zaino",     Icon: Backpack,       color: "#F59E0B", bgActive: "bg-amber-50 border-amber-200" },
  { key: "tracksuit", label: "Tuta",      Icon: PersonStanding, color: "#10B981", bgActive: "bg-emerald-50 border-emerald-200" },
  { key: "jacket",    label: "Giubbotto", Icon: Layers,         color: "#8B5CF6", bgActive: "bg-violet-50 border-violet-200"  },
  { key: "tshirt",    label: "T-shirt",   Icon: Shirt,          color: "#F97316", bgActive: "bg-orange-50 border-orange-200"  },
  { key: "polo",      label: "Polo",      Icon: Tag,            color: "#EC4899", bgActive: "bg-pink-50 border-pink-200"   },
];

/* ─────────────────────────────────────────────
   Card giocatore (espandibile su mobile)
───────────────────────────────────────────── */
function PlayerCard({ player, savingField, onToggle, onSizeChange }: {
  player: PlayerWithApparel;
  savingField: ApparelKey | "size" | null;
  onToggle: (playerId: string, field: ApparelKey) => void;
  onSizeChange: (playerId: string, size: string) => void;
}) {
  const [expanded,    setExpanded]   = useState(false);
  const [sizeInput,   setSizeInput]  = useState(player.size ?? "");
  const [sizeDirty,   setSizeDirty]  = useState(false);

  const collectedCount = ITEMS.filter(i => player.apparel[i.key]).length;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Header card */}
      <button
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-[#F8FAFC] transition-colors"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0A1F44]/10 flex items-center justify-center">
          <span className="text-xs font-bold text-[#0A1F44]">
            {player.last_name.charAt(0)}{player.first_name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0A1F44] text-sm truncate">{player.last_name} {player.first_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-[#F4F6F9] rounded-full overflow-hidden max-w-[80px]">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(collectedCount / ITEMS.length) * 100}%` }} />
            </div>
            <span className="text-xs text-[#64748B] font-medium">{collectedCount}/{ITEMS.length}</span>
            {player.size && (
              <span className="text-xs bg-[#0A1F44]/10 text-[#0A1F44] font-bold px-2 py-0.5 rounded-lg">{player.size}</span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="flex-shrink-0 w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="flex-shrink-0 w-4 h-4 text-[#94A3B8]" />}
      </button>

      {/* Dettagli */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F4F6F9]">
          {/* Taglia */}
          <div className="mt-3 mb-4 flex items-center gap-2">
            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex-shrink-0">Taglia</label>
            <input type="text" value={sizeInput}
              onChange={(e) => { setSizeInput(e.target.value); setSizeDirty(true); }}
              placeholder="es. M, XL, 12…"
              className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#0A1F44] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC] max-w-[120px]" />
            {sizeDirty && (
              <button onClick={() => { onSizeChange(player.id, sizeInput); setSizeDirty(false); }}
                disabled={savingField === "size"}
                className="flex-shrink-0 w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                {savingField === "size" ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            )}
          </div>

          {/* Griglia 2 colonne */}
          <div className="grid grid-cols-2 gap-2">
            {ITEMS.map(item => (
              <div key={item.key}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors
                  ${player.apparel[item.key] ? item.bgActive : "bg-[#F8FAFC] border-[#E2E8F0]"}`}>
                <span className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: player.apparel[item.key] ? item.color : "#94A3B8" }}>
                  <item.Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </span>
                <ToggleSwitch
                  active={player.apparel[item.key]}
                  onToggle={() => onToggle(player.id, item.key)}
                  loading={savingField === item.key}
                  colorActive="emerald"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Contenuto principale
───────────────────────────────────────────── */
function AbbigliamentoContent() {
  const searchParams = useSearchParams();
  const teamName  = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  const [players,      setPlayers]      = useState<PlayerWithApparel[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [savingField,  setSavingField]  = useState<Record<string, ApparelKey | "size" | null>>({});
  const [pdfLoading,   setPdfLoading]   = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: teamData, error: tErr } = await supabase
        .from("teams").select("id").eq("name", teamName).single();
      if (tErr || !teamData) { setError(`Squadra "${teamName}" non trovata.`); return; }

      const [{ data: pData, error: pErr }, { data: aData }] = await Promise.all([
        supabase.from("players").select("id, first_name, last_name, size")
          .eq("team_id", teamData.id).order("last_name").order("first_name"),
        supabase.from("apparel").select("*"),
      ]);
      if (pErr) throw pErr;

      const apparelMap = new Map((aData ?? []).map((a: ApparelData & { player_id: string }) => [a.player_id, a]));
      setPlayers((pData ?? []).map(p => ({ ...p, apparel: (apparelMap.get(p.id) as ApparelData | undefined) ?? { ...DEFAULT_APPAREL } })));
    } catch (e) { setError("Errore caricamento dati."); console.error(e); }
    finally { setLoading(false); }
  }, [teamName]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (playerId: string, field: ApparelKey) => {
    if (savingField[playerId]) return;
    setSavingField(prev => ({ ...prev, [playerId]: field }));
    const player  = players.find(p => p.id === playerId);
    if (!player) return;
    const newValue = !player.apparel[field];
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, apparel: { ...p.apparel, [field]: newValue } } : p));
    try {
      const { error } = await supabase.from("apparel")
        .upsert({ player_id: playerId, ...player.apparel, [field]: newValue }, { onConflict: "player_id" });
      if (error) throw error;
    } catch (e) {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, apparel: { ...p.apparel, [field]: !newValue } } : p));
      console.error(e);
    } finally { setSavingField(prev => ({ ...prev, [playerId]: null })); }
  };

  const handleSizeChange = async (playerId: string, size: string) => {
    setSavingField(prev => ({ ...prev, [playerId]: "size" }));
    try {
      const { error } = await supabase.from("players").update({ size: size || null }).eq("id", playerId);
      if (error) throw error;
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, size: size || null } : p));
    } catch (e) { console.error(e); }
    finally { setSavingField(prev => ({ ...prev, [playerId]: null })); }
  };

  const handleExportPdf = async () => {
    if (!players.length) return;
    setPdfLoading(true);
    try {
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
      doc.text(`Abbigliamento – ${teamName}`, W/2, 18, { align:"center" });
      doc.setFillColor(244,246,249); doc.rect(0,26,W,7,"F");
      doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont("helvetica","normal");
      doc.text(`Generato il ${format(new Date(), "dd/MM/yyyy 'alle' HH:mm", { locale: it })} · ${players.length} giocatori`, W/2, 31, { align:"center" });

      const sorted = [...players].sort((a,b) => a.last_name.localeCompare(b.last_name,"it") || a.first_name.localeCompare(b.first_name,"it"));
      const head = [["N°","Cognome","Nome","Taglia", ...ITEMS.map(i => i.label)]];
      const body = sorted.map((p,idx) => [
        (idx+1).toString(), p.last_name.toUpperCase(), p.first_name, p.size ?? "—",
        ...ITEMS.map(i => (p.apparel[i.key] ? "X" : "")),
      ]);

      autoTable(doc, {
        startY:36, head, body, theme:"striped",
        styles: { fontSize:8.5, cellPadding:3, textColor:[30,41,59] },
        headStyles: { fillColor:[10,31,68], textColor:[245,184,0], fontStyle:"bold", fontSize:8 },
        alternateRowStyles: { fillColor:[248,250,252] },
        columnStyles: {
          0: { cellWidth:10, halign:"center", textColor:[148,163,184] },
          1: { fontStyle:"bold" },
          3: { cellWidth:16, halign:"center" },
          ...Object.fromEntries(ITEMS.map((_,i) => [i+4, { cellWidth:22, halign:"center" }])),
        },
        margin: { left:10, right:10 },
      });
      doc.save(`Abbigliamento_${teamName.replace(/\s+/g,"_")}.pdf`);
    } catch (e) { console.error("Errore PDF:", e); }
    finally { setPdfLoading(false); }
  };

  /* Riepilogo capi per header */
  const stats = ITEMS.map(item => ({ ...item, count: players.filter(p => p.apparel[item.key]).length }));

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <AppHeader title="Stabia Basket BTS & NPS" subtitle={`Abbigliamento · ${teamName}`}
        showBack backHref={`/dashboard?team=${teamParam}`} backLabel="Dashboard" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-12">
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#0A1F44] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-500" /> Abbigliamento
            </h2>
            <p className="text-sm text-[#64748B] mt-0.5"><span className="font-semibold text-[#0A1F44]">{teamName}</span></p>
          </div>
          <Button variant="gold" size="md" className="gap-2 flex-shrink-0"
            onClick={handleExportPdf} disabled={players.length === 0 || pdfLoading}>
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            PDF
          </Button>
        </div>

        {/* ── Riepilogo capi con icone lucide ── */}
        {!loading && !error && players.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mb-5">
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Riepilogo Capi Consegnati</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {stats.map(s => (
                <div key={s.key} className="text-center group">
                  <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1.5 transition-all"
                    style={{ backgroundColor: `${s.color}18` }}>
                    <s.Icon className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: s.color }} />
                  </div>
                  <p className="text-sm font-bold text-[#0A1F44]">
                    {s.count}<span className="text-xs text-[#94A3B8] font-normal">/{players.length}</span>
                  </p>
                  <p className="text-[10px] text-[#94A3B8] leading-tight mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" /></div>}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {players.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl py-12 text-center">
                <p className="text-[#94A3B8] text-sm">Nessun giocatore trovato.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#94A3B8] mb-3 text-center">Tocca una card per espanderla e gestire taglia e capi</p>
                <div className="flex flex-col gap-3">
                  {players.map(p => (
                    <PlayerCard key={p.id} player={p}
                      savingField={savingField[p.id] ?? null}
                      onToggle={handleToggle} onSizeChange={handleSizeChange} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function AbbigliamentoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" /></div>}>
      <AbbigliamentoContent />
    </Suspense>
  );
}
