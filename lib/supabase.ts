import { createClient } from "@supabase/supabase-js";

/**
 * ============================================================
 *  SUPABASE CLIENT – Stabia Basket BTS & NPS
 * ============================================================
 *
 *  ⚠️  PRIMA DI USARE: crea un file `.env.local` nella root
 *      del progetto e aggiungi le seguenti variabili:
 *
 *      NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
 *      NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
 *
 *  Trovi questi valori su:
 *  https://supabase.com/dashboard → progetto → Settings → API
 *
 *  Il file .env.local è già incluso nel .gitignore di Next.js
 *  (non verrà mai committato su Git).
 * ============================================================
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Variabili Supabase mancanti.\n" +
      "Crea il file .env.local con NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Vedi lib/supabase.ts per le istruzioni dettagliate."
  );
}

/**
 * Client Supabase condiviso per l'intera applicazione.
 * Usalo nei componenti client e nelle Server Actions.
 *
 * Esempio di utilizzo:
 *   import { supabase } from "@/lib/supabase";
 *   const { data, error } = await supabase.from("players").select("*");
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste la sessione nel localStorage (utile per PWA mobile)
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Tipi TypeScript derivati dallo schema del database.
 * Aggiornare se si modificano le tabelle in supabase_schema.sql
 */
export type Team = {
  id: string;
  name: string;
};

export type Player = {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  dob: string | null;           // ISO date string "YYYY-MM-DD"
  size: string | null;          // Taglia abbigliamento
  med_expiry: string | null;    // Scadenza certificato medico
  member_type: string | null;   // "FIP" | "Libertas"
  member_expiry: string | null; // Scadenza tesseramento
  jersey_number: string | null; // Numero Maglia
  is_captain: boolean;          // Capitano (boolean)
  phone_athlete: string | null; // Cellulare Atleta
  phone_parent: string | null;  // Cellulare Genitore
};

export type Apparel = {
  player_id: string;
  jersey: boolean;
  backpack: boolean;
  tracksuit: boolean;
  jacket: boolean;
  tshirt: boolean;
  polo: boolean;
};

export type Practice = {
  id: string;
  team_id: string;
  practice_date: string; // "YYYY-MM-DD"
};

export type Attendance = {
  practice_id: string;
  player_id: string;
  is_present: boolean;
};

export type Match = {
  id: string;
  team_id: string;
  match_date: string; // "YYYY-MM-DD"
  opponent: string;
};

export type CallUp = {
  match_id: string;
  player_id: string;
};

export type Event = {
  id: string;
  title: string;
  event_date: string; // "YYYY-MM-DD"
  poster_url: string | null;
  requires_pin: boolean;
};
