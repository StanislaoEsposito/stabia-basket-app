"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  PartyPopper,
  Plus,
  X,
  Loader2,
  AlertCircle,
  ImageOff,
  CalendarDays,
  UploadCloud,
  Trash2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import PinGuard from "@/components/PinGuard";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────
   Costanti
───────────────────────────────────────────── */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in byte

/* ─────────────────────────────────────────────
   Tipi
───────────────────────────────────────────── */
interface EventRecord {
  id: string;
  title: string;
  event_date: string;
  poster_url: string | null;
  requires_pin: boolean;
}

interface NewEventForm {
  title: string;
  date: string;
  file: File | null;
}

const EMPTY_FORM: NewEventForm = { title: "", date: "", file: null };

/* ─────────────────────────────────────────────
   Utilità
───────────────────────────────────────────── */
function fmtDate(d: string) {
  try { return format(parseISO(d), "d MMMM yyyy", { locale: it }); }
  catch { return d; }
}

function fileSizeMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

/* ─────────────────────────────────────────────
   Card Evento
───────────────────────────────────────────── */
function EventCard({
  event,
  onDelete,
  deleting,
}: {
  event: EventRecord;
  onDelete: (id: string, posterPath: string | null) => void;
  deleting: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-200">
      {/* Immagine copertina */}
      {event.poster_url && !imgError ? (
        <div className="relative aspect-[16/9] bg-[#F4F6F9] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.poster_url}
            alt={`Locandina ${event.title}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : event.poster_url && imgError ? (
        <div className="aspect-[16/9] bg-[#F4F6F9] flex items-center justify-center">
          <ImageOff className="w-8 h-8 text-[#CBD5E1]" />
        </div>
      ) : (
        /* Placeholder gradient quando non c'è locandina */
        <div className="aspect-[16/9] bg-gradient-to-br from-[#0A1F44] to-[#122558] flex items-center justify-center">
          <PartyPopper className="w-12 h-12 text-[#F5B800]/60" strokeWidth={1.5} />
        </div>
      )}

      {/* Contenuto card */}
      <div className="px-4 py-3.5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#0A1F44] text-sm leading-snug truncate">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
            <span className="text-xs text-[#64748B]">{fmtDate(event.event_date)}</span>
          </div>
        </div>

        {/* Tasto elimina */}
        <button
          onClick={() => onDelete(event.id, event.poster_url)}
          disabled={deleting}
          className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 text-[#CBD5E1] hover:text-red-500
                     flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Elimina evento"
        >
          {deleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Form Nuovo Evento (collassabile)
───────────────────────────────────────────── */
function NewEventForm({
  onSaved,
}: {
  onSaved: (event: EventRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewEventForm>(EMPTY_FORM);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Gestione selezione file */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setForm((p) => ({ ...p, file: null }));
      setPreview(null);
      return;
    }

    /* Validazione dimensione: max 50 MB */
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File troppo grande: ${fileSizeMB(file.size)} MB. Dimensione massima consentita: 50 MB.`
      );
      e.target.value = "";
      setForm((p) => ({ ...p, file: null }));
      setPreview(null);
      return;
    }

    setForm((p) => ({ ...p, file }));
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  /* Cleanup object URL */
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleClose = () => {
    setOpen(false);
    setForm(EMPTY_FORM);
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError("Inserisci il titolo dell'evento."); return; }
    if (!form.date)          { setError("Seleziona una data per l'evento."); return; }

    setSaving(true);
    try {
      let posterUrl: string | null = null;

      /* Upload immagine → Supabase Storage */
      if (form.file) {
        /* ⚠️  Azione richiesta su Supabase:
           1. Dashboard → Storage → Crea bucket "events_posters"
           2. Imposta il bucket come "Public"
           3. Assicurati che la policy consenta INSERT per anon */
        const ext = form.file.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("events_posters")
          .upload(path, form.file, { contentType: form.file.type, upsert: false });

        if (uploadErr) throw new Error(`Upload fallito: ${uploadErr.message}`);

        const { data: urlData } = supabase.storage
          .from("events_posters")
          .getPublicUrl(path);

        posterUrl = urlData.publicUrl;
      }

      /* Inserimento record in events */
      const { data, error: insertErr } = await supabase
        .from("events")
        .insert({
          title:        form.title.trim(),
          event_date:   form.date,
          poster_url:   posterUrl,
          requires_pin: true,
        })
        .select()
        .single();

      if (insertErr || !data) throw insertErr ?? new Error("Inserimento fallito");

      onSaved(data as EventRecord);
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant="primary" size="md" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Nuovo Evento
      </Button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mb-6">
      {/* Header form */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
            <PartyPopper className="w-4 h-4 text-yellow-600" />
          </div>
          <h2 className="font-bold text-[#0A1F44] text-base">Nuovo Evento</h2>
        </div>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full hover:bg-[#F4F6F9] flex items-center justify-center"
        >
          <X className="w-4 h-4 text-[#64748B]" />
        </button>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
        {/* Errore */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-3 py-3 rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Titolo */}
        <div>
          <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
            Titolo Evento <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="es. Cena Sociale 2024"
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]
                       placeholder:text-[#CBD5E1]"
          />
        </div>

        {/* Data */}
        <div>
          <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
            Data Evento <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#0A1F44] text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#0A1F44] bg-[#F8FAFC]"
          />
        </div>

        {/* Upload immagine */}
        <div>
          <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
            Locandina / Immagine <span className="text-[#94A3B8] font-normal normal-case">(opzionale)</span>
          </label>

          {/* Drop area */}
          <label
            className="flex flex-col items-center justify-center gap-2 px-4 py-5
                       border-2 border-dashed border-[#E2E8F0] rounded-xl cursor-pointer
                       hover:border-[#0A1F44]/40 hover:bg-[#F8FAFC] transition-colors"
          >
            {preview ? (
              /* Anteprima immagine selezionata */
              <div className="w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Anteprima"
                  className="w-full max-h-40 object-contain rounded-lg"
                />
                <p className="text-xs text-[#64748B] text-center mt-2">
                  {form.file?.name} &middot; {fileSizeMB(form.file?.size ?? 0)} MB
                </p>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-[#CBD5E1]" />
                <p className="text-sm text-[#64748B] font-medium">
                  Clicca per selezionare un&apos;immagine
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Helper text dimensione massima */}
          <p className="mt-1.5 text-xs text-[#94A3B8] flex items-center gap-1">
            <span className="text-[#CBD5E1]">ℹ</span>
            Dimensione massima consentita: <strong>50 MB</strong>. Formati accettati: JPG, PNG, GIF, WebP.
          </p>
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" size="md" className="flex-1" onClick={handleClose} disabled={saving}>
            Annulla
          </Button>
          <Button type="submit" variant="gold" size="md" className="flex-1 gap-2" disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvataggio…</>
            ) : (
              <><Plus className="w-4 h-4" /> Pubblica Evento</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Contenuto principale (dopo PIN)
───────────────────────────────────────────── */
function EventiContent() {
  const searchParams = useSearchParams();
  const teamName = searchParams.get("team") ?? "Squadra";
  const teamParam = encodeURIComponent(teamName);

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* Carica tutti gli eventi */
  const loadEvents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });
      if (err) throw err;
      setEvents(data ?? []);
    } catch (e) {
      setError("Errore nel caricamento degli eventi."); console.error(e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  /* Aggiungi evento appena creato alla lista */
  const handleEventSaved = (event: EventRecord) => {
    setEvents((prev) =>
      [event, ...prev].sort((a, b) => b.event_date.localeCompare(a.event_date))
    );
  };

  /* Elimina evento */
  const handleDelete = async (id: string, posterUrl: string | null) => {
    if (!confirm("Sei sicuro di voler eliminare questo evento?")) return;
    setDeletingId(id);
    try {
      /* Elimina file storage se esiste */
      if (posterUrl) {
        const urlObj = new URL(posterUrl);
        const pathParts = urlObj.pathname.split("/events_posters/");
        if (pathParts[1]) {
          await supabase.storage.from("events_posters").remove([pathParts[1]]);
        }
      }
      /* Elimina record */
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.error("Errore eliminazione:", e);
    } finally { setDeletingId(null); }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <AppHeader
        title="Stabia Basket BTS & NPS"
        subtitle={`Eventi · ${teamName}`}
        showBack
        backHref={`/dashboard?team=${teamParam}`}
        backLabel="Dashboard"
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-12">
        {/* Titolo + form toggle */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#0A1F44] flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-yellow-500" /> Eventi
            </h2>
            <p className="text-sm text-[#64748B] mt-0.5">
              {!loading && `${events.length} event${events.length === 1 ? "o" : "i"} pubblicat${events.length === 1 ? "o" : "i"}`}
            </p>
          </div>
          <NewEventForm onSaved={handleEventSaved} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
          </div>
        )}

        {/* Errore */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={loadEvents}>
              Riprova
            </Button>
          </div>
        )}

        {/* Lista vuota */}
        {!loading && !error && events.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] border-dashed rounded-2xl py-16 text-center px-6">
            <PartyPopper className="w-14 h-14 text-[#CBD5E1] mx-auto mb-4" strokeWidth={1.5} />
            <p className="font-semibold text-[#0A1F44] mb-1">Nessun evento ancora</p>
            <p className="text-sm text-[#94A3B8]">
              Clicca su &quot;Nuovo Evento&quot; per pubblicare il primo evento societario.
            </p>
          </div>
        )}

        {/* Griglia eventi — 1 col mobile / 2 col desktop */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                onDelete={handleDelete}
                deleting={deletingId === ev.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page export — avvolto in PinGuard + Suspense
───────────────────────────────────────────── */
export default function EventiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5B800] border-t-[#0A1F44] rounded-full animate-spin" />
      </div>
    }>
      <EventiInner />
    </Suspense>
  );
}

/* Componente interno che legge searchParams (deve stare dentro Suspense) */
function EventiInner() {
  const searchParams = useSearchParams();
  const teamName = searchParams.get("team") ?? "Squadra";

  return (
    <PinGuard sectionName={`Eventi – ${teamName}`}>
      <EventiContent />
    </PinGuard>
  );
}
