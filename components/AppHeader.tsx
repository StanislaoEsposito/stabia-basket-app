"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

interface AppHeaderProps {
  /** Testo principale nell'header */
  title: string;
  /** Sottotitolo opzionale (es. nome squadra) */
  subtitle?: string;
  /** Se true, mostra il tasto "Cambia Squadra" (back) */
  showBack?: boolean;
  /** Link di destinazione del tasto back */
  backHref?: string;
  /** Label tasto back */
  backLabel?: string;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  backHref = "/",
  backLabel = "Cambia Squadra",
}: AppHeaderProps) {
  const searchParams = useSearchParams();
  const team = searchParams?.get("team") || "";

  // Logica di selezione del logo
  const isFemminile = ["SERIE B FEMM.", "U19 FEMM.", "U15 FEMM."].includes(team);
  const isMinibasket =
    team.includes("AQUILOTTI") ||
    team.includes("PULCINI") ||
    team.includes("SCOIATTOLI");

  let logoSrc = "/logo.png";
  if (isFemminile) {
    logoSrc = "/logo-femminile.png";
  } else if (isMinibasket) {
    logoSrc = "/MINIBASKETLOGO.png";
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0A1F44] text-white shadow-lg">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo + Testi */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Singolo logo dinamico */}
          <div className="flex-shrink-0 flex items-center h-10 w-12 justify-center">
            <Image
              src={logoSrc}
              alt="Logo Stabia Basket"
              width={80}
              height={80}
              className="w-12 h-auto max-h-10 object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#F5B800] uppercase tracking-widest leading-none">
              Stabia Basket
            </p>
            {subtitle ? (
              <h1 className="text-base font-bold truncate leading-tight mt-0.5">
                {subtitle}
              </h1>
            ) : (
              <h1 className="text-base font-bold truncate leading-tight mt-0.5">
                Gestionale
              </h1>
            )}
          </div>
        </div>

        {/* Tasto Cambia Squadra */}
        {showBack && (
          <Link href={backHref} className="flex-shrink-0">
            <Button
              variant="gold"
              size="sm"
              className="gap-1.5 text-xs whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {backLabel}
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
