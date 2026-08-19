-- ============================================================
--  SCHEMA SQL – Stabia Basket BTS & NPS
--  Database: PostgreSQL (Supabase)
--
--  ISTRUZIONI:
--  1. Vai su https://supabase.com/dashboard
--  2. Apri il tuo progetto → SQL Editor
--  3. Incolla questo script e premi "Run"
--
--  Lo script è IDEMPOTENTE: usa IF NOT EXISTS e DROP ... CASCADE
--  per poter essere ri-eseguito senza errori in fase di sviluppo.
-- ============================================================

-- Abilita estensione UUID (già attiva su Supabase, per sicurezza)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
--  1. TEAMS — Squadre della società
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

COMMENT ON TABLE  teams      IS 'Squadre della società Stabia Basket BTS & NPS';
COMMENT ON COLUMN teams.id   IS 'Identificatore univoco della squadra';
COMMENT ON COLUMN teams.name IS 'Nome della squadra (es. "U19 GOLD", "DIV. REG. 1")';

-- ============================================================
--  2. PLAYERS — Anagrafica giocatori
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id        UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    first_name     TEXT        NOT NULL,
    last_name      TEXT        NOT NULL,
    dob            DATE,                          -- Data di nascita
    size           TEXT,                          -- Taglia abbigliamento (es. "S", "M", "XL", "12")
    med_expiry     DATE,                          -- Scadenza certificato medico agonistico
    member_type    TEXT CHECK (member_type IN ('FIP', 'Libertas', 'Altro')),
    member_expiry  DATE                           -- Scadenza tesseramento federale
);

COMMENT ON TABLE  players              IS 'Anagrafica completa di ogni giocatore tesserato';
COMMENT ON COLUMN players.team_id      IS 'Squadra di appartenenza (FK → teams)';
COMMENT ON COLUMN players.dob          IS 'Data di nascita';
COMMENT ON COLUMN players.size         IS 'Taglia abbigliamento (usata dalla sezione Abbigliamento)';
COMMENT ON COLUMN players.med_expiry   IS 'Scadenza certificato medico agonistico';
COMMENT ON COLUMN players.member_type  IS 'Tipo di tesseramento: FIP, Libertas o Altro';
COMMENT ON COLUMN players.member_expiry IS 'Data di scadenza del tesseramento federale';

-- Indici utili per le query più frequenti
CREATE INDEX IF NOT EXISTS idx_players_team_id    ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_last_name  ON players(last_name);
CREATE INDEX IF NOT EXISTS idx_players_med_expiry ON players(med_expiry);

-- ============================================================
--  3. APPAREL — Abbigliamento consegnato per giocatore
-- ============================================================
CREATE TABLE IF NOT EXISTS apparel (
    player_id  UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    jersey     BOOLEAN NOT NULL DEFAULT FALSE,   -- Canotta/Maglia gara
    backpack   BOOLEAN NOT NULL DEFAULT FALSE,   -- Zaino
    tracksuit  BOOLEAN NOT NULL DEFAULT FALSE,   -- Tuta
    jacket     BOOLEAN NOT NULL DEFAULT FALSE,   -- Giacca/Felpa
    tshirt     BOOLEAN NOT NULL DEFAULT FALSE,   -- T-shirt allenamento
    polo       BOOLEAN NOT NULL DEFAULT FALSE    -- Polo rappresentanza
);

COMMENT ON TABLE  apparel           IS 'Tracciamento consegna abbigliamento per ogni giocatore';
COMMENT ON COLUMN apparel.player_id IS 'Un record per giocatore (1:1 con players, FK con CASCADE)';
COMMENT ON COLUMN apparel.jersey    IS 'TRUE se la canotta gara è stata consegnata';
COMMENT ON COLUMN apparel.backpack  IS 'TRUE se lo zaino è stato consegnato';
COMMENT ON COLUMN apparel.tracksuit IS 'TRUE se la tuta è stata consegnata';
COMMENT ON COLUMN apparel.jacket    IS 'TRUE se la giacca/felpa è stata consegnata';
COMMENT ON COLUMN apparel.tshirt    IS 'TRUE se la t-shirt da allenamento è stata consegnata';
COMMENT ON COLUMN apparel.polo      IS 'TRUE se la polo di rappresentanza è stata consegnata';

-- ============================================================
--  4. PRACTICES — Sessioni di allenamento
-- ============================================================
CREATE TABLE IF NOT EXISTS practices (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    practice_date DATE NOT NULL
);

COMMENT ON TABLE  practices               IS 'Registro delle sessioni di allenamento per squadra';
COMMENT ON COLUMN practices.team_id       IS 'Squadra a cui appartiene l''allenamento (FK → teams)';
COMMENT ON COLUMN practices.practice_date IS 'Data della sessione di allenamento';

CREATE INDEX IF NOT EXISTS idx_practices_team_id       ON practices(team_id);
CREATE INDEX IF NOT EXISTS idx_practices_practice_date ON practices(practice_date);

-- ============================================================
--  5. ATTENDANCES — Presenze agli allenamenti
-- ============================================================
CREATE TABLE IF NOT EXISTS attendances (
    practice_id UUID    NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    player_id   UUID    NOT NULL REFERENCES players(id)   ON DELETE CASCADE,
    is_present  BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (practice_id, player_id)   -- Chiave primaria composta
);

COMMENT ON TABLE  attendances            IS 'Presenze per ogni allenamento: una riga per coppia (allenamento, giocatore)';
COMMENT ON COLUMN attendances.is_present IS 'TRUE = presente, FALSE = assente/non registrato';

CREATE INDEX IF NOT EXISTS idx_attendances_player_id ON attendances(player_id);

-- ============================================================
--  6. MATCHES — Partite ufficiali
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    opponent   TEXT NOT NULL   -- Nome squadra avversaria
);

COMMENT ON TABLE  matches          IS 'Partite ufficiali (campionato, coppe, tornei)';
COMMENT ON COLUMN matches.opponent IS 'Nome della squadra avversaria';

CREATE INDEX IF NOT EXISTS idx_matches_team_id    ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);

-- ============================================================
--  7. CALL_UPS — Convocazioni per le partite
-- ============================================================
CREATE TABLE IF NOT EXISTS call_ups (
    match_id  UUID NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
    PRIMARY KEY (match_id, player_id)   -- Chiave primaria composta
);

COMMENT ON TABLE call_ups IS 'Lista convocati per ogni partita: una riga per coppia (partita, giocatore)';

CREATE INDEX IF NOT EXISTS idx_call_ups_player_id ON call_ups(player_id);

-- ============================================================
--  8. EVENTS — Eventi societari (richiede PIN)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title        TEXT    NOT NULL,
    event_date   DATE    NOT NULL,
    poster_url   TEXT,                          -- URL immagine/locandina (Supabase Storage)
    requires_pin BOOLEAN NOT NULL DEFAULT TRUE  -- Protetto da PIN per default
);

COMMENT ON TABLE  events              IS 'Eventi societari: feste, tornei, raduni (accesso opzionalmente protetto da PIN)';
COMMENT ON COLUMN events.poster_url   IS 'URL della locandina evento (archiviata su Supabase Storage)';
COMMENT ON COLUMN events.requires_pin IS 'Se TRUE, l''accesso richiede inserimento PIN (default: TRUE)';

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- ============================================================
--  TRIGGER: crea automaticamente un record apparel
--  ogni volta che viene inserito un nuovo giocatore.
--  Così non si deve fare l'INSERT manuale in apparel.
-- ============================================================
CREATE OR REPLACE FUNCTION create_apparel_for_new_player()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO apparel (player_id)
    VALUES (NEW.id)
    ON CONFLICT (player_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_apparel ON players;

CREATE TRIGGER trg_create_apparel
    AFTER INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION create_apparel_for_new_player();

COMMENT ON FUNCTION create_apparel_for_new_player() IS
    'Trigger: crea automaticamente il record apparel (tutti FALSE) quando si aggiunge un giocatore';

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  Abilita RLS su tutte le tabelle per sicurezza.
--  Per ora: policy "aperta" (anon può leggere, solo auth può scrivere).
--  Da raffinare nella Fase 3 con autenticazione reale.
-- ============================================================
ALTER TABLE teams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE players     ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparel     ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_ups    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events      ENABLE ROW LEVEL SECURITY;

-- Policy temporanea di sviluppo: accesso completo con anon key
-- ⚠️ RIMUOVERE o restringere in produzione!
-- Nota: PostgreSQL non supporta CREATE POLICY IF NOT EXISTS,
--       quindi usiamo DROP + CREATE per garantire idempotenza.
DROP POLICY IF EXISTS "dev_allow_all_teams"       ON teams;
CREATE POLICY "dev_allow_all_teams"       ON teams       FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_players"     ON players;
CREATE POLICY "dev_allow_all_players"     ON players     FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_apparel"     ON apparel;
CREATE POLICY "dev_allow_all_apparel"     ON apparel     FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_practices"   ON practices;
CREATE POLICY "dev_allow_all_practices"   ON practices   FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_attendances" ON attendances;
CREATE POLICY "dev_allow_all_attendances" ON attendances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_matches"     ON matches;
CREATE POLICY "dev_allow_all_matches"     ON matches     FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_call_ups"    ON call_ups;
CREATE POLICY "dev_allow_all_call_ups"    ON call_ups    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_events"      ON events;
CREATE POLICY "dev_allow_all_events"      ON events      FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
--  DATI SEED — Inserisce le squadre di default
--  (Eseguire una sola volta o con ON CONFLICT DO NOTHING)
-- ============================================================
INSERT INTO teams (name) VALUES
    ('DIV. REG. 1'),
    ('U19 GOLD'),
    ('U17 GOLD'),
    ('U19 LIBERTAS/U17 SILVER'),
    ('U14 SILVER'),
    ('U13 SILVER'),
    ('ESORDIENTI'),
    ('AQUILOTTI 2016'),
    ('AQUILOTTI 2017'),
    ('PULCINI B. CECCHI'),
    ('SCOIATTOLI B. CECCHI'),
    ('AQUILOTTI B. CECCHI'),
    ('PULCINI CICERONE'),
    ('SCOIATTOLI CICERONE'),
    ('AQUILOTTI CICERONE'),
    ('PULCINI DI CAPUA'),
    ('SCOIATTOLI DI CAPUA')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
--  FINE SCRIPT
--  Tabelle create: teams, players, apparel, practices,
--                  attendances, matches, call_ups, events
--  Trigger creato: trg_create_apparel (auto-insert apparel)
--  RLS abilitata su tutte le tabelle
--  Seed: 17 squadre inserite
-- ============================================================
