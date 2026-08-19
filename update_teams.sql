-- =======================================================================
-- update_teams.sql  --  Aggiornamento elenco squadre Stabia Basket
-- Eseguire nel SQL Editor di Supabase.
-- =======================================================================

INSERT INTO teams (name) VALUES 
('DIV. REG. 1'),
('SERIE B FEMM.'),
('U19 FEMM.'),
('U19 GOLD'),
('U17 GOLD'),
('U19 LIBERTAS/U17 SILVER'),
('U15 FEMM.'),
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
