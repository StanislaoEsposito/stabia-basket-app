-- ==============================================================================
-- 1. AGGIORNAMENTO SCHEMA (Nuovi campi anagrafica)
-- ==============================================================================
ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_number text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_captain boolean DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS phone_athlete text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS phone_parent text;

-- ==============================================================================
-- 2. PULIZIA DEL DATABASE ESISTENTE
-- ==============================================================================
TRUNCATE TABLE apparel, call_ups, attendances, matches, practices, events, players, teams CASCADE;

-- ==============================================================================
-- 3. INSERIMENTO SQUADRE (20 Squadre Ufficiali)
-- ==============================================================================
INSERT INTO teams (id, name) VALUES
-- Maschile
('t-01', 'DIV. REG. 1'),
('t-02', 'U19 GOLD'),
('t-03', 'U17 GOLD'),
('t-04', 'U19 LIBERTAS/U17 SILVER'),
('t-05', 'U14 SILVER'),
('t-06', 'U13 SILVER'),
('t-07', 'ESORDIENTI'),
-- Femminile
('t-08', 'SERIE B FEMM.'),
('t-09', 'U19 FEMM.'),
('t-10', 'U15 FEMM.'),
-- Minibasket
('t-11', 'AQUILOTTI 2016'),
('t-12', 'AQUILOTTI 2017'),
('t-13', 'PULCINI B. CECCHI'),
('t-14', 'SCOIATTOLI B. CECCHI'),
('t-15', 'AQUILOTTI B. CECCHI'),
('t-16', 'PULCINI CICERONE'),
('t-17', 'SCOIATTOLI CICERONE'),
('t-18', 'AQUILOTTI CICERONE'),
('t-19', 'PULCINI DI CAPUA'),
('t-20', 'SCOIATTOLI DI CAPUA');

-- ==============================================================================
-- 4. INSERIMENTO GIOCATORI (Squadra: DIV. REG. 1)
-- 15 giocatori realistici
-- ==============================================================================
INSERT INTO players (id, team_id, first_name, last_name, dob, size, med_expiry, member_type, jersey_number, is_captain, phone_athlete, phone_parent) VALUES
('p-01', 't-01', 'Marco', 'Rossi', '1998-05-12', 'L', '2027-01-15', 'FIP', '4', false, '+39 333 1111111', null),
('p-02', 't-01', 'Luigi', 'Bianchi', '1995-11-23', 'XL', '2026-12-10', 'FIP', '5', false, '+39 333 2222222', null),
('p-03', 't-01', 'Francesco', 'Esposito', '1992-02-08', 'L', '2026-11-05', 'FIP', '7', true, '+39 333 3333333', null), -- Capitano
('p-04', 't-01', 'Antonio', 'Romano', '1999-07-30', 'M', '2027-02-20', 'FIP', '8', false, '+39 333 4444444', null),
('p-05', 't-01', 'Giovanni', 'Colombo', '1997-09-14', 'XXL', '2026-09-12', 'FIP', '10', false, '+39 333 5555555', null),
('p-06', 't-01', 'Andrea', 'Ricci', '2001-01-22', 'M', '2027-03-01', 'Libertas', '11', false, '+39 333 6666666', '+39 338 1234567'),
('p-07', 't-01', 'Matteo', 'Marino', '1996-04-18', 'L', '2026-10-30', 'FIP', '13', false, '+39 333 7777777', null),
('p-08', 't-01', 'Alessandro', 'Greco', '2000-12-05', 'XL', '2026-11-25', 'FIP', '15', false, '+39 333 8888888', null),
('p-09', 't-01', 'Giuseppe', 'Conti', '1994-08-19', 'L', '2026-12-01', 'FIP', '18', false, '+39 333 9999999', null),
('p-10', 't-01', 'Luca', 'De Luca', '1998-03-27', 'M', '2027-04-10', 'FIP', '21', false, '+39 333 1010101', null),
('p-11', 't-01', 'Simone', 'Russo', '1993-06-11', 'XL', '2026-08-15', 'FIP', '23', false, '+39 333 2020202', null),
('p-12', 't-01', 'Davide', 'Ferrara', '2002-10-09', 'L', '2027-01-20', 'FIP', '32', false, '+39 333 3030303', '+39 339 9876543'),
('p-13', 't-01', 'Emanuele', 'Gallo', '1997-01-16', 'M', '2026-07-28', 'FIP', '34', false, '+39 333 4040404', null),
('p-14', 't-01', 'Vincenzo', 'Costa', '1995-09-02', 'L', '2026-12-30', 'FIP', '44', false, '+39 333 5050505', null),
('p-15', 't-01', 'Giacomo', 'Giordano', '1999-11-11', 'XXL', '2027-02-05', 'FIP', '55', false, '+39 333 6060606', null);

-- ==============================================================================
-- 5. ABBIGLIAMENTO (Apparel)
-- ==============================================================================
INSERT INTO apparel (player_id, jersey, backpack, tracksuit, jacket, tshirt, polo) VALUES
('p-01', true, true, false, true, true, false),
('p-02', true, true, true, true, true, true),
('p-03', true, true, true, true, true, true),
('p-04', false, true, false, false, true, false),
('p-05', true, false, true, false, true, false),
('p-06', true, true, true, true, true, true),
('p-07', true, true, true, true, true, true),
('p-08', true, true, true, true, true, true),
('p-09', true, true, true, true, true, true),
('p-10', false, false, false, false, false, false),
('p-11', true, true, true, true, true, true),
('p-12', true, true, true, true, true, true),
('p-13', true, true, true, true, true, true),
('p-14', true, true, true, true, true, true),
('p-15', true, true, true, true, true, true);

-- ==============================================================================
-- 6. ALLENAMENTI (8 allenamenti passati per DIV. REG. 1)
-- ==============================================================================
INSERT INTO practices (id, team_id, practice_date) VALUES
('pr-01', 't-01', '2026-07-01'),
('pr-02', 't-01', '2026-07-03'),
('pr-03', 't-01', '2026-07-08'),
('pr-04', 't-01', '2026-07-10'),
('pr-05', 't-01', '2026-07-15'),
('pr-06', 't-01', '2026-07-17'),
('pr-07', 't-01', '2026-07-22'),
('pr-08', 't-01', '2026-07-24');

-- ==============================================================================
-- 7. PRESENZE AGLI ALLENAMENTI (Mix casuale)
-- ==============================================================================
-- pr-01 (Tutti presenti tranne 1 e 10)
INSERT INTO attendances (practice_id, player_id, is_present) VALUES
('pr-01','p-01',false), ('pr-01','p-02',true), ('pr-01','p-03',true), ('pr-01','p-04',true), ('pr-01','p-05',true),
('pr-01','p-06',true), ('pr-01','p-07',true), ('pr-01','p-08',true), ('pr-01','p-09',true), ('pr-01','p-10',false),
('pr-01','p-11',true), ('pr-01','p-12',true), ('pr-01','p-13',true), ('pr-01','p-14',true), ('pr-01','p-15',true);

-- pr-02 (Tutti presenti tranne 4, 5)
INSERT INTO attendances (practice_id, player_id, is_present) VALUES
('pr-02','p-01',true), ('pr-02','p-02',true), ('pr-02','p-03',true), ('pr-02','p-04',false), ('pr-02','p-05',false),
('pr-02','p-06',true), ('pr-02','p-07',true), ('pr-02','p-08',true), ('pr-02','p-09',true), ('pr-02','p-10',true),
('pr-02','p-11',true), ('pr-02','p-12',true), ('pr-02','p-13',true), ('pr-02','p-14',true), ('pr-02','p-15',true);

-- pr-03 (Presenti 12 su 15)
INSERT INTO attendances (practice_id, player_id, is_present) VALUES
('pr-03','p-01',true), ('pr-03','p-02',true), ('pr-03','p-03',true), ('pr-03','p-04',true), ('pr-03','p-05',true),
('pr-03','p-06',true), ('pr-03','p-07',false), ('pr-03','p-08',false), ('pr-03','p-09',true), ('pr-03','p-10',true),
('pr-03','p-11',false), ('pr-03','p-12',true), ('pr-03','p-13',true), ('pr-03','p-14',true), ('pr-03','p-15',true);

-- pr-04, pr-05, pr-06, pr-07, pr-08 (Assumiamo tutti presenti per semplicità)
INSERT INTO attendances (practice_id, player_id, is_present)
SELECT 'pr-04', id, true FROM players WHERE team_id = 't-01';
INSERT INTO attendances (practice_id, player_id, is_present)
SELECT 'pr-05', id, true FROM players WHERE team_id = 't-01';
INSERT INTO attendances (practice_id, player_id, is_present)
SELECT 'pr-06', id, true FROM players WHERE team_id = 't-01';
INSERT INTO attendances (practice_id, player_id, is_present)
SELECT 'pr-07', id, true FROM players WHERE team_id = 't-01';
INSERT INTO attendances (practice_id, player_id, is_present)
SELECT 'pr-08', id, true FROM players WHERE team_id = 't-01';


-- ==============================================================================
-- 8. PARTITE (4 partite giocate per DIV. REG. 1)
-- ==============================================================================
INSERT INTO matches (id, team_id, match_date, opponent) VALUES
('m-01', 't-01', '2026-07-05', 'C.B. Torre Annunziata'),
('m-02', 't-01', '2026-07-12', 'Sorrento Basket'),
('m-03', 't-01', '2026-07-19', 'Portici 2000'),
('m-04', 't-01', '2026-07-26', 'Ercolano Sporting Club');

-- ==============================================================================
-- 9. CONVOCAZIONI (Call Ups)
-- ==============================================================================
-- m-01: Convocati primi 12
INSERT INTO call_ups (match_id, player_id) VALUES
('m-01', 'p-01'), ('m-01', 'p-02'), ('m-01', 'p-03'), ('m-01', 'p-04'),
('m-01', 'p-05'), ('m-01', 'p-06'), ('m-01', 'p-07'), ('m-01', 'p-08'),
('m-01', 'p-09'), ('m-01', 'p-10'), ('m-01', 'p-11'), ('m-01', 'p-12');

-- m-02: Convocati 10 giocatori
INSERT INTO call_ups (match_id, player_id) VALUES
('m-02', 'p-03'), ('m-02', 'p-04'), ('m-02', 'p-05'), ('m-02', 'p-06'),
('m-02', 'p-07'), ('m-02', 'p-08'), ('m-02', 'p-09'), ('m-02', 'p-13'),
('m-02', 'p-14'), ('m-02', 'p-15');

-- m-03: Convocati 12 giocatori
INSERT INTO call_ups (match_id, player_id) VALUES
('m-03', 'p-01'), ('m-03', 'p-02'), ('m-03', 'p-03'), ('m-03', 'p-07'),
('m-03', 'p-08'), ('m-03', 'p-09'), ('m-03', 'p-10'), ('m-03', 'p-11'),
('m-03', 'p-12'), ('m-03', 'p-13'), ('m-03', 'p-14'), ('m-03', 'p-15');

-- m-04: Convocati 12 giocatori
INSERT INTO call_ups (match_id, player_id) VALUES
('m-04', 'p-01'), ('m-04', 'p-03'), ('m-04', 'p-04'), ('m-04', 'p-05'),
('m-04', 'p-06'), ('m-04', 'p-08'), ('m-04', 'p-09'), ('m-04', 'p-10'),
('m-04', 'p-11'), ('m-04', 'p-12'), ('m-04', 'p-14'), ('m-04', 'p-15');

-- ==============================================================================
-- 10. EVENTI (Visibili a tutta la società)
-- ==============================================================================
INSERT INTO events (id, title, event_date, poster_url, requires_pin) VALUES
('e-01', 'Cena di Fine Anno Stabia Basket', '2026-06-30', null, false),
('e-02', 'Torneo Estivo "Città delle Acque"', '2026-07-20', null, false),
('e-03', 'Riunione Staff Tecnico', '2026-08-25', null, true),
('e-04', 'Open Day Minibasket 2026/2027', '2026-09-05', null, false);

-- FINE SCRIPT
