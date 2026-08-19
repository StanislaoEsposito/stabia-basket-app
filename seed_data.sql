-- =======================================================================
-- seed_data.sql  --  Dati fittizi per Stabia Basket BTS & NPS
-- Eseguire nel SQL Editor di Supabase.
-- Idempotente: puo` essere rieseguito senza creare duplicati.
-- =======================================================================

DO $$
DECLARE
  v_team UUID;

  -- UUID fissi per idempotenza
  p1  UUID := 'aa010001-0000-4000-8000-000000000001';
  p2  UUID := 'aa010001-0000-4000-8000-000000000002';
  p3  UUID := 'aa010001-0000-4000-8000-000000000003';
  p4  UUID := 'aa010001-0000-4000-8000-000000000004';
  p5  UUID := 'aa010001-0000-4000-8000-000000000005';
  p6  UUID := 'aa010001-0000-4000-8000-000000000006';
  p7  UUID := 'aa010001-0000-4000-8000-000000000007';
  p8  UUID := 'aa010001-0000-4000-8000-000000000008';
  p9  UUID := 'aa010001-0000-4000-8000-000000000009';
  p10 UUID := 'aa010001-0000-4000-8000-000000000010';
  pr1 UUID := 'bb020001-0000-4000-8000-000000000001';
  pr2 UUID := 'bb020001-0000-4000-8000-000000000002';
  pr3 UUID := 'bb020001-0000-4000-8000-000000000003';
  m1  UUID := 'cc030001-0000-4000-8000-000000000001';
  m2  UUID := 'cc030001-0000-4000-8000-000000000002';
  rpr1 UUID; rpr2 UUID; rpr3 UUID;
  rm1  UUID; rm2  UUID;
BEGIN

  -- Recupera ID squadra
  SELECT id INTO v_team FROM teams WHERE name = 'DIV. REG. 1' LIMIT 1;
  IF v_team IS NULL THEN
    RAISE EXCEPTION 'Squadra "DIV. REG. 1" non trovata. Esegui prima supabase_schema.sql.';
  END IF;

  -- GIOCATORI (10)
  INSERT INTO players (id, team_id, first_name, last_name, dob, size, med_expiry, member_type, member_expiry)
  VALUES
    (p1,  v_team, 'Marco',     'Esposito',  '2005-03-15', 'L',  '2026-12-31',                                          'FIP',      '2025-09-30'),
    (p2,  v_team, 'Luigi',     'Romano',    '2006-07-22', 'M',  (CURRENT_DATE + INTERVAL ''20 days'')::date::text,     'FIP',      '2025-09-30'),
    (p3,  v_team, 'Davide',    'Ferraro',   '2005-11-08', 'XL', '2027-03-20',                                          'Libertas', '2026-06-30'),
    (p4,  v_team, 'Francesco', 'Greco',     '2006-02-14', 'S',  NULL,                                                  'FIP',      '2025-09-30'),
    (p5,  v_team, 'Simone',    'Bruno',     '2005-09-01', 'L',  '2023-08-01',                                          'Libertas', '2025-12-31'),
    (p6,  v_team, 'Antonio',   'Mancuso',   '2006-05-19', 'M',  '2026-06-15',                                          'FIP',      '2026-09-30'),
    (p7,  v_team, 'Vincenzo',  'Napoli',    '2005-12-25', 'L',  NULL,                                                  NULL,       NULL),
    (p8,  v_team, 'Salvatore', 'Caruso',    '2006-04-03', 'XL', '2027-01-10',                                          'FIP',      '2025-09-30'),
    (p9,  v_team, 'Riccardo',  'Monti',     '2005-06-30', 'M',  (CURRENT_DATE + INTERVAL ''10 days'')::date::text,    'Libertas', '2026-06-30'),
    (p10, v_team, 'Matteo',    'Sorrento',  '2006-10-11', 'L',  '2026-08-20',                                          'FIP',      '2025-09-30')
  ON CONFLICT (id) DO NOTHING;

  -- ALLENAMENTI (3 sessioni passate)
  INSERT INTO practices (id, team_id, practice_date) VALUES
    (pr1, v_team, (CURRENT_DATE - INTERVAL '18 days')::date),
    (pr2, v_team, (CURRENT_DATE - INTERVAL '11 days')::date),
    (pr3, v_team, (CURRENT_DATE - INTERVAL '4 days')::date)
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO rpr1 FROM practices WHERE team_id = v_team AND practice_date = (CURRENT_DATE - INTERVAL '18 days')::date;
  SELECT id INTO rpr2 FROM practices WHERE team_id = v_team AND practice_date = (CURRENT_DATE - INTERVAL '11 days')::date;
  SELECT id INTO rpr3 FROM practices WHERE team_id = v_team AND practice_date = (CURRENT_DATE - INTERVAL '4 days')::date;

  -- PRESENZE (allenamento 1: 7/10, 2: 6/10, 3: 8/10)
  INSERT INTO attendances (practice_id, player_id, is_present) VALUES
    (rpr1,p1,true),(rpr1,p2,true),(rpr1,p3,false),(rpr1,p4,true),(rpr1,p5,false),
    (rpr1,p6,true),(rpr1,p7,true),(rpr1,p8,false),(rpr1,p9,true),(rpr1,p10,true)
  ON CONFLICT (practice_id, player_id) DO NOTHING;

  INSERT INTO attendances (practice_id, player_id, is_present) VALUES
    (rpr2,p1,true),(rpr2,p2,false),(rpr2,p3,true),(rpr2,p4,true),(rpr2,p5,true),
    (rpr2,p6,false),(rpr2,p7,true),(rpr2,p8,true),(rpr2,p9,false),(rpr2,p10,false)
  ON CONFLICT (practice_id, player_id) DO NOTHING;

  INSERT INTO attendances (practice_id, player_id, is_present) VALUES
    (rpr3,p1,true),(rpr3,p2,true),(rpr3,p3,true),(rpr3,p4,false),(rpr3,p5,false),
    (rpr3,p6,true),(rpr3,p7,true),(rpr3,p8,true),(rpr3,p9,true),(rpr3,p10,true)
  ON CONFLICT (practice_id, player_id) DO NOTHING;

  -- PARTITE (2)
  INSERT INTO matches (id, team_id, match_date, opponent) VALUES
    (m1, v_team, (CURRENT_DATE + INTERVAL '7 days')::date,  'Napoli Basket 2004'),
    (m2, v_team, (CURRENT_DATE - INTERVAL '5 days')::date,  'Sorrento Lions U20')
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO rm1 FROM matches WHERE id = m1;
  SELECT id INTO rm2 FROM matches WHERE id = m2;

  -- CONVOCAZIONI
  INSERT INTO call_ups (match_id, player_id) VALUES
    (rm1,p1),(rm1,p2),(rm1,p3),(rm1,p4),(rm1,p6),(rm1,p8),(rm1,p9),(rm1,p10)
  ON CONFLICT (match_id, player_id) DO NOTHING;

  INSERT INTO call_ups (match_id, player_id) VALUES
    (rm2,p1),(rm2,p3),(rm2,p4),(rm2,p5),(rm2,p7),(rm2,p9),(rm2,p10)
  ON CONFLICT (match_id, player_id) DO NOTHING;

  -- ABBIGLIAMENTO (trigger crea le righe FALSE; aggiorniamo)
  UPDATE apparel SET jersey=true, backpack=true, tracksuit=true, jacket=false,tshirt=true, polo=false WHERE player_id=p1;
  UPDATE apparel SET jersey=true, backpack=false,tracksuit=true, jacket=false,tshirt=false,polo=false WHERE player_id=p2;
  UPDATE apparel SET jersey=true, backpack=true, tracksuit=true, jacket=true, tshirt=false,polo=false WHERE player_id=p3;
  UPDATE apparel SET jersey=false,backpack=false,tracksuit=false,jacket=false,tshirt=false,polo=false WHERE player_id=p4;
  UPDATE apparel SET jersey=true, backpack=false,tracksuit=false,jacket=false,tshirt=false,polo=false WHERE player_id=p5;
  UPDATE apparel SET jersey=true, backpack=true, tracksuit=false,jacket=false,tshirt=false,polo=false WHERE player_id=p6;
  UPDATE apparel SET jersey=true, backpack=true, tracksuit=true, jacket=true, tshirt=true, polo=true  WHERE player_id=p7;
  UPDATE apparel SET jersey=true, backpack=false,tracksuit=true, jacket=false,tshirt=false,polo=false WHERE player_id=p8;
  UPDATE apparel SET jersey=true, backpack=true, tracksuit=false,jacket=false,tshirt=false,polo=true  WHERE player_id=p9;
  UPDATE apparel SET jersey=true, backpack=false,tracksuit=false,jacket=false,tshirt=true, polo=true  WHERE player_id=p10;

  -- EVENTI (idempotenti via NOT EXISTS)
  INSERT INTO events (title, event_date, requires_pin)
  SELECT 'Cena Sociale di Fine Stagione',(CURRENT_DATE + INTERVAL '30 days')::date,true
  WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Cena Sociale di Fine Stagione');

  INSERT INTO events (title, event_date, requires_pin)
  SELECT 'Torneo Giovanile "Stabia Cup"',(CURRENT_DATE + INTERVAL '65 days')::date,true
  WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Torneo Giovanile "Stabia Cup"');

  RAISE NOTICE 'Seed completato: 10 giocatori, 3 allenamenti, 2 partite, 2 eventi (DIV. REG. 1).';
END $$;
