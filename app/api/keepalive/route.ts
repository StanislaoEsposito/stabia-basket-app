import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/keepalive
 *
 * Rotta richiamata ogni giorno dal Vercel Cron Job.
 * Esegue una query minimale su Supabase per impedire che il database
 * vada in pausa per inattività (piano gratuito: pausa dopo 7 gg).
 *
 * Sicurezza: la rotta è protetta dall'header CRON_SECRET impostato
 * automaticamente da Vercel. Richieste non autorizzate ricevono 401.
 */
export async function GET(request: Request) {
  // Vercel imposta automaticamente l'header "authorization: Bearer <CRON_SECRET>"
  // sulle richieste originate dai propri cron job. Lo verifichiamo per
  // impedire che chiunque possa chiamare questa rotta manualmente.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Query leggerissima: legge un solo ID dalla tabella teams.
    // Serve solo a mantenere attiva la connessione al database.
    const { error } = await supabase
      .from("teams")
      .select("id")
      .limit(1);

    if (error) {
      console.error("[keepalive] Supabase error:", error.message);
      return NextResponse.json(
        {
          status: "error",
          message: "Database query failed",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    console.log(`[keepalive] OK — ${now}`);

    return NextResponse.json({
      status: "ok",
      message: "Database is awake",
      timestamp: now,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[keepalive] Unexpected error:", message);
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}
