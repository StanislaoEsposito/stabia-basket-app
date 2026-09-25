# Documentazione Tecnica - Stabia Basket App

## 1. Panoramica
Applicazione gestionale per la società di pallacanestro **Stabia Basket BTS & NPS**. 
Il sistema permette di gestire anagrafiche giocatori, presenze agli allenamenti, materiale tecnico, scadenze mediche, tesseramenti, convocazioni alle partite e comunicazione di eventi. 
L'applicativo è costruito sul framework **Next.js**.

## 2. Tecnologie e Stack
- **Frontend / Framework**: [Next.js 15+](https://nextjs.org/) basato su App Router.
- **Libreria UI**: [React 19](https://react.dev/).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) per lo styling utility-first.
- **Iconografia**: [Lucide React](https://lucide.dev/).
- **Backend / Database**: [Supabase](https://supabase.com/) con database PostgreSQL integrato. Le chiamate al DB avvengono tramite il client ufficiale `@supabase/supabase-js`.
- **Generazione Report**: `jspdf` e `jspdf-autotable` per esportare elenchi, presenze e anagrafiche in formato PDF.
- **Utility**:
  - `date-fns` per la manipolazione avanzata delle date (formattazione, scadenze).
  - `clsx` e `tailwind-merge` (spesso wrappate in una funzione `cn()`) per gestire e unire le classi CSS dinamicamente in base allo stato dei componenti.

## 3. Architettura del Database (Supabase / PostgreSQL)
Il database è progettato per centralizzare tutta l'operatività di una società sportiva. Comprende le seguenti tabelle:

1. **`teams`**: Le squadre della società (es. "U19 GOLD", "DIV. REG. 1", "AQUILOTTI").
2. **`players`**: L'anagrafica dei giocatori. Relazione 1 a N con `teams`. Include nome, cognome, data di nascita, taglia abbigliamento, tipo e scadenza tesseramento e scadenza del certificato medico agonistico.
3. **`apparel`**: Tracciamento dell'abbigliamento sportivo (canotta, tuta, zaino, ecc.). Relazione 1 a 1 con `players`. C'è un *Trigger SQL* (`trg_create_apparel`) che crea automaticamente questo record di default non appena un nuovo giocatore viene aggiunto in anagrafica.
4. **`practices`**: Le singole sessioni di allenamento, associate a un team e a una data.
5. **`attendances`**: Tabella ponte/join tra `practices` e `players` per gestire l'appello. Un flag booleano indica la presenza o l'assenza.
6. **`matches`**: Le partite ufficiali (squadra, data, nome dell'avversario).
7. **`call_ups`**: Tabella ponte/join tra `matches` e `players` per le convocazioni.
8. **`events`**: Eventi societari come feste o tornei. Supporta URL per locandine (salvate su Supabase Storage) e protezione opzionale tramite PIN d'accesso.

**Sicurezza (RLS):** Tutte le tabelle hanno la Row Level Security (RLS) di PostgreSQL attivata. Durante questa fase di sviluppo sono attive policy di lettura/scrittura di tipo "aperto" ("allow_all"), che andranno poi restrinte per la produzione mediante logiche di autenticazione.

## 4. Struttura del Progetto
La directory utilizza il paradigma "App Router" introdotto nelle ultime versioni di Next.js.
Di seguito l'alberatura principale:

```text
stabia-basket-app/
├── app/                      # Rotte dell'applicazione
│   ├── page.tsx              # Landing page di ingresso
│   ├── globals.css           # Fogli di stile globali
│   ├── layout.tsx            # Layout root
│   ├── dashboard/            # Contenitore delle sezioni del gestionale
│   │   ├── abbigliamento/    # Tracciamento materiale tecnico
│   │   ├── allenamenti/      # Appello e storico presenze
│   │   ├── anagrafica/       # Gestione giocatori, roster e PDF
│   │   ├── certificati/      # Cruscotto scadenze visite mediche
│   │   ├── convocazioni/     # Scelta giocatori per le partite
│   │   ├── eventi/           # Gestione eventi protetti da PIN
│   │   ├── quote/            # (WIP) Contabilità quote soci
│   │   └── tesseramento/     # Dashboard scadenze tesseramenti FIP/Libertas
│   └── wip/                  # Sezioni in lavorazione / prototipi
├── components/               # Componenti React riutilizzabili
│   ├── ui/                   # Componenti base di sistema (Button, Card, ToggleSwitch)
│   ├── AppHeader.tsx         # Navbar di navigazione superiore
│   └── PinGuard.tsx          # Wrapper per proteggere contenuti e azioni sensibili tramite PIN
├── lib/                      # Logica di business e configurazioni
│   ├── dateUtils.ts          # Funzioni wrapper per date-fns
│   ├── supabase.ts           # Istanza del client Supabase per il frontend
│   └── utils.ts              # Utilità CSS (es. classe cn)
├── public/                   # Asset statici (favicon, ecc.)
├── supabase_schema.sql       # Script idempotente per generare lo schema DB su Supabase
└── seed_data.sql             # (e seed_data_full.sql) Popolamento dummy/iniziale del DB
```

## 5. Logiche e Funzionamento
- **Data Fetching e Mutazioni**: Attualmente il progetto interagisce con il database chiamando direttamente il client Supabase dal browser tramite le funzioni esportate da `lib/supabase.ts`.
- **Modello di Sicurezza (Frontend)**: Piuttosto che usare un sistema di login utente tradizionale (email/password), molte sezioni critiche o sensibili sfruttano il componente `PinGuard.tsx` per impedire modifiche o accessi indesiderati mediante la richiesta di un PIN di sblocco.
- **Export PDF**: Nelle viste tabellari (es. elenco iscritti, elenco convocati), sono stati integrati dei bottoni per generare report in formato PDF in modo client-side utilizzando `jspdf`.
- **UI Responsiva**: L'utilizzo di Tailwind CSS permette alla dashboard di adattarsi agli schermi mobili, garantendo la possibilità per gli allenatori e dirigenti di usare il gestionale direttamente da smartphone (es. per fare l'appello durante gli allenamenti o controllare un certificato in palestra).
