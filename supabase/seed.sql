-- =====================================================================
-- Filara – TESTOVACÍ data pro vývojový projekt (filara-vyvoj)
--
-- NEPOUŠTĚT NA OSTRÉM PROJEKTU. Zásoby a nastavení jsou vymyšlené.
-- Výrobky, barvy a kategorie jsou převedené z data/produkty.js (stav k 6. 11. 2026)
-- automaticky skriptem supabase/scripts/generuj-seed.mjs, aby se při přepisu nic neztratilo.
-- Soubor neupravujte ručně, změňte skript nebo produkty.js a vygenerujte ho znovu.
-- Pouští se jednou, po všech migracích ze supabase/migrations/ (20261106120000_faze2_databaze.sql
-- a 20261109120000_faze2a_upravy.sql), na prázdnou databázi.
-- =====================================================================

begin;

do $$
begin
  if exists (select 1 from public.produkty) then
    raise exception 'Databáze už výrobky obsahuje – testovací data se nenahrají podruhé.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Nastavení
-- ---------------------------------------------------------------------
insert into public.nastaveni (pracovni_dny_na_zaplaceni, cena_zasilkovna, cislo_uctu, nazev_prijemce, text_vyroba, max_nezaplacenych, max_kusu_vyrobku) values (
  3,                    -- rozhodnuto 9. 11. 2026: 3 pracovní dny (bez víkendů a svátků)
  75,                   -- rozhodnuto 9. 11. 2026: Zásilkovna 75 Kč
  '123456789/0000',     -- VYMYŠLENÉ: číslo účtu (kód banky 0000 neexistuje), skutečné doplní Filip
  'FILARA',
  'Zvládneme vyrobit a doručit do 3 týdnů',
  2,                    -- rozhodnuto 9. 11. 2026: max. 2 nezaplacené objednávky na e-mail nebo telefon
  10                    -- rozhodnuto 9. 11. 2026: max. 10 ks jednoho výrobku v objednávce
);

-- Barvy (z BARVY)
insert into public.barvy (nazev, hex, poradi) values
  ('Bílá', '#F5F5F4', 0),
  ('Černá', '#1C1917', 1),
  ('Šedá', '#78716C', 2),
  ('Červená', '#DC2626', 3),
  ('Oranžová', '#F97316', 4),
  ('Žlutá', '#FACC15', 5),
  ('Zelená', '#16A34A', 6),
  ('Modrá', '#2563EB', 7),
  ('Fialová', '#7C3AED', 8),
  ('Růžová', '#EC4899', 9),
  ('Béžová', '#E8D9B5', 10),
  ('Vínová', '#93303A', 11),
  ('Tmavě hnědá', '#5A2D00', 12),
  ('Světle hnědá', '#CAA580', 13),
  ('Zlatá', '#D4AF37', 14),
  ('Modrofialová', 'linear-gradient(135deg, #2563EB, #C084FC)', 15),
  ('Zelenomodrá', 'linear-gradient(135deg, #22C55E, #0E7490)', 16),
  ('Fosforeskující', '#F3EBA6', 17),
  ('Červenozlatá', 'linear-gradient(135deg, #DC2626, #D4AF37)', 18),
  ('Modrozelená', 'linear-gradient(135deg, #3B82F6, #84CC16)', 19),
  ('Oranžovošedivá', 'linear-gradient(135deg, #F97316, #A8A29E)', 20),
  ('Zelená se třpytkami', 'radial-gradient(circle at 30% 30%, #E8F5EF 0 1px, transparent 1.5px), radial-gradient(circle at 68% 42%, #E8F5EF 0 1px, transparent 1.5px), radial-gradient(circle at 42% 72%, #E8F5EF 0 1px, transparent 1.5px), #2F5052', 21);

-- Kategorie (z KATEGORIE)
insert into public.kategorie (nazev, poradi) values
  ('Zvířata', 0),
  ('Dekorace', 1),
  ('Květiny', 2),
  ('Domácnost', 3),
  ('Vánoce', 4),
  ('Podzim', 5),
  ('Halloween', 6),
  ('Klíčenky', 7),
  ('Fidgety', 8);

-- Vlk (vlk)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'vlk', 'Vlk', 'Tento ohebný vlk zaujme na první pohled výraznýma, ručně malovanýma očima, které mu dávají jedinečný výraz.

Díky pohyblivým kloubům a článkovanému tělu i ocasu je krásně tvárný. Poslouží jako originální dekorace na stůl, zábavná antistresová hračka do ruky i milý dárek.

- Ruční práce: Oči jsou detailně ručně malované, takže každý kus je neopakovatelný originál.
- Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 120, 'velikost',
  false, 'celkem', false, true, 1);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'vlk', id from public.kategorie where nazev in ('Zvířata');
insert into public.zasoby (produkt_id, barva_id, pocet) values ('vlk', null, 1); -- VYMYŠLENÉ

-- Šnek (snek)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'snek', 'Šnek', 'Vneste do svého domova trochu přírodní pohody a roztomilosti! Tento 3D tištěný šnek s krásně tvarovanou ulitou a zvědavě vztyčenými tykadly si vás zaručeně získá.

Díky článkovanému tělu je šnek příjemně ohebný a skvěle padne do ruky. Poslouží jako originální dekorace do pokoje či kanceláře, uklidňující antistresová hračka i skvělý dárek pro milovníky přírody.

- Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb článků těla a elegantní tvar ulity.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 150, 'velikost',
  false, 'celkem', false, true, 2);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'snek', id from public.kategorie where nazev in ('Zvířata');
insert into public.fotky (produkt_id, url, poradi) values ('snek', 'obrazky/snek-1.jpg', 0);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('snek', null, 3); -- VYMYŠLENÉ

-- Had hladký (had)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'had', 'Had hladký', 'Přidejte do svého prostoru špetku exotické elegance! Tento trnitý had s výrazně plastickými šupinami po celé délce těla a zářivě modrýma očima je dokonalou ukázkou toho, co dokáže moderní 3D tisk.

Díky velkému množství pohyblivých kloubů je neuvěřitelně ohebný, kroutí se úplně jako živý a skvěle padne do ruky. Poslouží jako nepřehlédnutelná dekorace na stůl či poličku, chytlavá antistresová hračka i skvělý dárek pro milovníky plazů a netradičních doplňků.

- Detailní zpracování: Precizní 3D tisk s důrazem na výrazné ostny, uhrančivé oči a plynulý, přirozený pohyb kloubů.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, null, 'velikost',
  false, 'bez_hlidani', false, true, 3);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'had', id from public.kategorie where nazev in ('Zvířata');
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('had', 'S', 150, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('had', 'M', 290, 1, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('had', 'L', 390, 2, false);

-- Liška (liska)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'liska', 'Liška', '', 'PLA', array['ohebne']::text[], '', '', '',
  false, false, 150, 'velikost',
  false, 'po_barvach', false, true, 4);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'liska', id from public.kategorie where nazev in ('Zvířata', 'Podzim');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('liska', (select id from public.barvy where nazev = 'Oranžová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('liska', (select id from public.barvy where nazev = 'Vínová'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('liska', (select id from public.barvy where nazev = 'Černá'), 2, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('liska', (select id from public.barvy where nazev = 'Béžová'), 3, false, true);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Oranžová'), null, 'obrazky/liska-oranzova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Oranžová'), null, 'obrazky/liska-oranzova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Oranžová'), null, 'obrazky/liska-oranzova-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/liska-vinova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/liska-vinova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/liska-vinova-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Černá'), null, 'obrazky/liska-cerna-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Černá'), null, 'obrazky/liska-cerna-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('liska', (select id from public.barvy where nazev = 'Černá'), null, 'obrazky/liska-cerna-3.jpg', 2);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('liska', (select id from public.barvy where nazev = 'Oranžová'), 4); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('liska', (select id from public.barvy where nazev = 'Vínová'), 2); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('liska', (select id from public.barvy where nazev = 'Černá'), 1); -- VYMYŠLENÉ

-- Houba hřib (hrib)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'hrib', 'Houba hřib', '', 'PLA', array['led']::text[], 'Sabre Design', '', '',
  false, false, null, 'velikost',
  false, 'po_barvach', false, true, 5);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'hrib', id from public.kategorie where nazev in ('Dekorace', 'Podzim');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('hrib', (select id from public.barvy where nazev = 'Světle hnědá'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('hrib', (select id from public.barvy where nazev = 'Tmavě hnědá'), 1, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('hrib', 'Malý', 80, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('hrib', 'Velký', 120, 1, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hrib', (select id from public.barvy where nazev = 'Světle hnědá'), null, 'obrazky/hrib-svetle-hneda-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hrib', (select id from public.barvy where nazev = 'Světle hnědá'), null, 'obrazky/hrib-svetle-hneda-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hrib', (select id from public.barvy where nazev = 'Světle hnědá'), null, 'obrazky/hrib-svetle-hneda-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hrib', (select id from public.barvy where nazev = 'Tmavě hnědá'), null, 'obrazky/hrib-tmave-hneda-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hrib', (select id from public.barvy where nazev = 'Tmavě hnědá'), null, 'obrazky/hrib-tmave-hneda-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hrib', (select id from public.barvy where nazev = 'Tmavě hnědá'), null, 'obrazky/hrib-tmave-hneda-3.jpg', 2);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('hrib', (select id from public.barvy where nazev = 'Světle hnědá'), 6); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('hrib', (select id from public.barvy where nazev = 'Tmavě hnědá'), 3); -- VYMYŠLENÉ

-- Žalud (zalud)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'zalud', 'Žalud', '', 'PLA', array['led']::text[], 'Sabre Design', '', '',
  false, false, 150, 'velikost',
  false, 'bez_hlidani', false, true, 6);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'zalud', id from public.kategorie where nazev in ('Dekorace', 'Podzim');
insert into public.fotky (produkt_id, url, poradi) values ('zalud', 'obrazky/zalud-1.jpg', 0);
insert into public.fotky (produkt_id, url, poradi) values ('zalud', 'obrazky/zalud-2.jpg', 1);
insert into public.fotky (produkt_id, url, poradi) values ('zalud', 'obrazky/zalud-3.jpg', 2);

-- Dýně (dyne)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'dyne', 'Dýně', '', 'PLA', array[]::text[], 'Sabre Design', '', '',
  false, false, null, 'velikost',
  false, 'po_barvach', false, true, 7);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'dyne', id from public.kategorie where nazev in ('Dekorace', 'Podzim');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('dyne', (select id from public.barvy where nazev = 'Žlutá'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('dyne', (select id from public.barvy where nazev = 'Oranžová'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('dyne', (select id from public.barvy where nazev = 'Zelená'), 2, true, false);
insert into public.vyprodano_poznamky (produkt_id, barva_id, poznamka) values ('dyne', (select id from public.barvy where nazev = 'Zelená'), 'TESTOVACÍ: došel zelený filament');
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('dyne', 'S', 30, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('dyne', 'M', 60, 1, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('dyne', 'L', 120, 2, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne', (select id from public.barvy where nazev = 'Žlutá'), null, 'obrazky/dyne-zluta-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne', (select id from public.barvy where nazev = 'Žlutá'), null, 'obrazky/dyne-zluta-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne', (select id from public.barvy where nazev = 'Žlutá'), null, 'obrazky/dyne-zluta-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne', (select id from public.barvy where nazev = 'Žlutá'), null, 'obrazky/dyne-zluta-4.jpg', 3);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne', (select id from public.barvy where nazev = 'Oranžová'), null, 'obrazky/dyne-oranzova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne', (select id from public.barvy where nazev = 'Oranžová'), null, 'obrazky/dyne-oranzova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/dyne-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/dyne-zelena-2.jpg', 1);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('dyne', (select id from public.barvy where nazev = 'Žlutá'), 8); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('dyne', (select id from public.barvy where nazev = 'Oranžová'), 5); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('dyne', (select id from public.barvy where nazev = 'Zelená'), 2); -- VYMYŠLENÉ

-- Svícen dýně (svicen)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'svicen', 'Svícen dýně', '', 'PLA', array['led']::text[], 'KOGI3D', '', '',
  false, false, 80, 'velikost',
  false, 'po_barvach', false, true, 8);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'svicen', id from public.kategorie where nazev in ('Dekorace', 'Podzim');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('svicen', (select id from public.barvy where nazev = 'Béžová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('svicen', (select id from public.barvy where nazev = 'Oranžová'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('svicen', (select id from public.barvy where nazev = 'Zelená'), 2, false, true);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/svicen-dyne-bezova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/svicen-dyne-bezova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/svicen-dyne-bezova-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Oranžová'), null, 'obrazky/svicen-dyne-oranzova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Oranžová'), null, 'obrazky/svicen-dyne-oranzova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Oranžová'), null, 'obrazky/svicen-dyne-oranzova-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/svicen-dyne-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/svicen-dyne-zelena-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/svicen-dyne-zelena-3.jpg', 2);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('svicen', (select id from public.barvy where nazev = 'Béžová'), 3); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('svicen', (select id from public.barvy where nazev = 'Oranžová'), 0); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('svicen', (select id from public.barvy where nazev = 'Zelená'), 1); -- VYMYŠLENÉ

-- Váza žebrovaná (vaza)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'vaza', 'Váza žebrovaná', '', 'PLA', array['vaza']::text[], 'Sabre Design', '', '',
  false, false, null, 'velikost',
  false, 'po_barvach', false, true, 9);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'vaza', id from public.kategorie where nazev in ('Dekorace', 'Podzim');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('vaza', (select id from public.barvy where nazev = 'Béžová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('vaza', (select id from public.barvy where nazev = 'Tmavě hnědá'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('vaza', (select id from public.barvy where nazev = 'Vínová'), 2, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('vaza', 'Malá', 120, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('vaza', 'Velká', 350, 1, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/vaza-vroubkovana-bezova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/vaza-vroubkovana-bezova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza', (select id from public.barvy where nazev = 'Tmavě hnědá'), null, 'obrazky/vaza-vroubkovana-tmave-hneda-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza', (select id from public.barvy where nazev = 'Tmavě hnědá'), null, 'obrazky/vaza-vroubkovana-tmave-hneda-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/vaza-vroubkovana-vinova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/vaza-vroubkovana-vinova-2.jpg', 1);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('vaza', (select id from public.barvy where nazev = 'Béžová'), 2); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('vaza', (select id from public.barvy where nazev = 'Tmavě hnědá'), 1); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('vaza', (select id from public.barvy where nazev = 'Vínová'), 0); -- VYMYŠLENÉ

-- Miska na pistácie (miska-na-pistacie)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'miska-na-pistacie', 'Miska na pistácie', '', 'PLA', array['miska']::text[], '', '', '',
  false, false, 250, 'velikost',
  false, 'bez_hlidani', false, true, 10);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'miska-na-pistacie', id from public.kategorie where nazev in ('Domácnost');

-- Podtácky 4 ks + miska (podtacky)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'podtacky', 'Podtácky 4 ks + miska', '', 'PLA', array['podtacky']::text[], '', '', '',
  false, false, 250, 'velikost',
  false, 'po_barvach', false, true, 11);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'podtacky', id from public.kategorie where nazev in ('Domácnost');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('podtacky', (select id from public.barvy where nazev = 'Béžová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('podtacky', (select id from public.barvy where nazev = 'Bílá'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('podtacky', (select id from public.barvy where nazev = 'Růžová'), 2, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('podtacky', (select id from public.barvy where nazev = 'Šedá'), 3, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('podtacky', (select id from public.barvy where nazev = 'Zelená'), 4, false, true);
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('podtacky', null, 0, 'Podtácky');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('podtacky', null, 1, 'Miska');
insert into public.sada_kus_barvy (kus_id, barva_id) values ((select id from public.sada_kusy where produkt_id = 'podtacky' and moznost_id is not distinct from null and poradi = 1), (select id from public.barvy where nazev = 'Bílá'));
insert into public.sada_kus_barvy (kus_id, barva_id) values ((select id from public.sada_kusy where produkt_id = 'podtacky' and moznost_id is not distinct from null and poradi = 1), (select id from public.barvy where nazev = 'Černá'));
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/podtacky-bezova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/podtacky-bezova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Bílá'), null, 'obrazky/podtacky-bila-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Bílá'), null, 'obrazky/podtacky-bila-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Růžová'), null, 'obrazky/podtacky-ruzova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Růžová'), null, 'obrazky/podtacky-ruzova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Šedá'), null, 'obrazky/podtacky-seda-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Šedá'), null, 'obrazky/podtacky-seda-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/podtacky-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('podtacky', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/podtacky-zelena-2.jpg', 1);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('podtacky', (select id from public.barvy where nazev = 'Béžová'), 4); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('podtacky', (select id from public.barvy where nazev = 'Bílá'), 6); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('podtacky', (select id from public.barvy where nazev = 'Růžová'), 4); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('podtacky', (select id from public.barvy where nazev = 'Šedá'), 0); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('podtacky', (select id from public.barvy where nazev = 'Zelená'), 4); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('podtacky', (select id from public.barvy where nazev = 'Černá'), 2); -- VYMYŠLENÉ

-- Chameleon (chameleon)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'chameleon', 'Chameleon', 'Oživte svůj stůl nebo poličku tímto úžasným 3D tištěným chameleonem! Tento exotický ještěr vyniká nápaditým provedením s článkovaným tělem a typicky zvědavýma očima.

Díky pohyblivým kloubům je chameleon krásně ohebný a skvěle padne do ruky. Poslouží jako stylová dekorace, chytlavá antistresová hračka i skvělý dárek pro milovníky zvířat a netradičních doplňků.

- Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 250, 'velikost',
  false, 'celkem', false, true, 12);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'chameleon', id from public.kategorie where nazev in ('Zvířata');
insert into public.zasoby (produkt_id, barva_id, pocet) values ('chameleon', null, 2); -- VYMYŠLENÉ

-- Žralok (zralok)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'zralok', 'Žralok', '', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 250, 'velikost',
  false, 'celkem', false, true, 13);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'zralok', id from public.kategorie where nazev in ('Zvířata');
insert into public.zasoby (produkt_id, barva_id, pocet) values ('zralok', null, 0); -- VYMYŠLENÉ

-- Duch (duch)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'duch', 'Duch', '', 'PLA', array[]::text[], '', '', '',
  false, false, null, 'velikost',
  false, 'po_barvach', false, true, 14);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'duch', id from public.kategorie where nazev in ('Halloween');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('duch', (select id from public.barvy where nazev = 'Bílá'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('duch', (select id from public.barvy where nazev = 'Fosforeskující'), 1, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('duch', 'Malý', 40, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('duch', 'Velký', 80, 1, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('duch', (select id from public.barvy where nazev = 'Bílá'), null, 'obrazky/duch-bila-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('duch', (select id from public.barvy where nazev = 'Bílá'), null, 'obrazky/duch-bila-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('duch', (select id from public.barvy where nazev = 'Bílá'), null, 'obrazky/duch-bila-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('duch', (select id from public.barvy where nazev = 'Fosforeskující'), null, 'obrazky/duch-fosforeskujici-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('duch', (select id from public.barvy where nazev = 'Fosforeskující'), null, 'obrazky/duch-fosforeskujici-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('duch', (select id from public.barvy where nazev = 'Fosforeskující'), null, 'obrazky/duch-fosforeskujici-3.jpg', 2);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('duch', (select id from public.barvy where nazev = 'Bílá'), 10); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('duch', (select id from public.barvy where nazev = 'Fosforeskující'), 4); -- VYMYŠLENÉ

-- Drak trnitý (drak)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'drak', 'Drak trnitý', '', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, null, 'velikost',
  false, 'po_barvach', false, true, 15);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'drak', id from public.kategorie where nazev in ('Zvířata');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('drak', (select id from public.barvy where nazev = 'Zelenomodrá'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('drak', (select id from public.barvy where nazev = 'Modrofialová'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('drak', (select id from public.barvy where nazev = 'Červená'), 2, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('drak', (select id from public.barvy where nazev = 'Fosforeskující'), 3, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('drak', 'Malý', 290, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('drak', 'Velký', 490, 1, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('drak', (select id from public.barvy where nazev = 'Zelenomodrá'), null, 'obrazky/drak-zelenomodra.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('drak', (select id from public.barvy where nazev = 'Modrofialová'), null, 'obrazky/drak-modrofialova.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('drak', (select id from public.barvy where nazev = 'Červená'), null, 'obrazky/drak-cervena.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('drak', (select id from public.barvy where nazev = 'Fosforeskující'), null, 'obrazky/drak-fosforeskujici.jpg', 0);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('drak', (select id from public.barvy where nazev = 'Zelenomodrá'), 1); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('drak', (select id from public.barvy where nazev = 'Modrofialová'), 2); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('drak', (select id from public.barvy where nazev = 'Červená'), 0); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('drak', (select id from public.barvy where nazev = 'Fosforeskující'), 1); -- VYMYŠLENÉ

-- Sněhová vločka (snehova-vlocka)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'snehova-vlocka', 'Sněhová vločka', '', 'PLA', array['zavesne']::text[], 'Sabre Design', '', '',
  false, false, null, 'varianta',
  false, 'po_barvach', false, true, 16);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'snehova-vlocka', id from public.kategorie where nazev in ('Vánoce');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Bílá'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Zlatá'), 1, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('snehova-vlocka', 'Varianta 1', 90, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('snehova-vlocka', 'Varianta 2', 90, 1, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('snehova-vlocka', 'Varianta 3', 90, 2, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('snehova-vlocka', 'Varianta 4', 90, 3, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('snehova-vlocka', 'Varianta 5', 40, 4, false);
insert into public.moznost_barvy (moznost_id, barva_id) values ((select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 5'), (select id from public.barvy where nazev = 'Bílá'));
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Bílá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 1'), 'obrazky/vlocka-bila-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Bílá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 2'), 'obrazky/vlocka-bila-2.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Bílá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 3'), 'obrazky/vlocka-bila-3.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Bílá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 4'), 'obrazky/vlocka-bila-4.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Bílá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 5'), 'obrazky/vlocka-bila-5-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Bílá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 5'), 'obrazky/vlocka-bila-5-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Zlatá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 1'), 'obrazky/vlocka-zlata-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Zlatá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 2'), 'obrazky/vlocka-zlata-2.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Zlatá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 3'), 'obrazky/vlocka-zlata-3.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Zlatá'), (select id from public.moznosti where produkt_id = 'snehova-vlocka' and nazev = 'Varianta 4'), 'obrazky/vlocka-zlata-4.jpg', 0);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Bílá'), 20); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('snehova-vlocka', (select id from public.barvy where nazev = 'Zlatá'), 7); -- VYMYŠLENÉ

-- Leguán (leguan)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'leguan', 'Leguán', '', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, null, 'velikost',
  false, 'bez_hlidani', false, true, 17);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'leguan', id from public.kategorie where nazev in ('Zvířata');
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('leguan', 'S', 290, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('leguan', 'M', 390, 1, false);

-- T-Rex (t-rex)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  't-rex', 'T-Rex', 'Připravte se na pořádnou dávku pravěké zábavy! Tento 3D tištěný T-Rex je ikonický dinosaurus v moderním, ultra flexibilním provedení, který si okamžitě získá pozornost na jakémkoliv stole či poličce.

Díky propracovaným pohyblivým kloubům je úžasně ohebný. Skvěle poslouží jako originální dekorace, chytlavá antistresová hračka do ruky i perfektní dárek pro všechny milovníky dinosaurů.

- Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, null, 'velikost',
  false, 'bez_hlidani', false, true, 18);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 't-rex', id from public.kategorie where nazev in ('Zvířata');
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('t-rex', 'S', 190, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('t-rex', 'M', 490, 1, false);

-- Žába (zaba)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'zaba', 'Žába', 'Tato veselá ohebná žabka si vás získá svým usměvavým výrazem a nápaditě propracovanýma nohama.

Díky pohyblivým kloubům v nohách a těle je úžasně tvárná a ohebná. Skvěle funguje jako hravá dekorace na pracovní stůl, zábavná antistresová hračka do ruky i milý dárek pro každého, kdo má rád originální doplňky.

- Ruční práce: Oči jsou pečlivě ručně malované, což každé žabce dává jedinečný pohled a charakter.
- Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů a výrazné žabí prsty s bílými akcenty.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 150, 'velikost',
  false, 'bez_hlidani', false, true, 19);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'zaba', id from public.kategorie where nazev in ('Zvířata');

-- Kůň (kun)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'kun', 'Kůň', 'Tento ohebný koník si vás získá svým milým pohledem a jedinečnými, ručně malovanými detaily.

Díky promyšleným kloubům v nohou a těle je krásně pohyblivý, takže ho můžete snadno napolohovat. Stane se z něj hravá dekorace na pracovní stůl, zábavná antistresová hračka i originální dárek pro všechny milovníky koní.

- Ruční práce: Oči a další detaily jsou pečlivě ručně malované, což z každého koníka dělá jedinečný kousek.
- Detailní zpracování: Precizní 3D tisk s důrazem na bohatou hřívu, ocas a rousy na kopytech.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 190, 'velikost',
  false, 'bez_hlidani', false, true, 20);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'kun', id from public.kategorie where nazev in ('Zvířata');

-- Had trnitý (had-trnity)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'had-trnity', 'Had trnitý', 'Přidejte do svého prostoru špetku exotičnosti a fascinující elegance! Tento trnitý had s výraznými ostny po celé délce těla je dokonalou ukázkou toho, co dokáže moderní 3D tisk.

Díky velkému množství pohyblivých kloubů je neuvěřitelně ohebný, kroutí se úplně jako živý a skvěle padne do ruky. Poslouží jako nepřehlédnutelná dekorace na stůl či poličku, chytlavá antistresová hračka i skvělý dárek pro milovníky netradičních doplňků.

- Detailní zpracování: Precizní 3D tisk s důrazem na detailní ostny a plynulý, přirozený pohyb kloubů.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, null, 'velikost',
  false, 'po_barvach', false, true, 21);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'had-trnity', id from public.kategorie where nazev in ('Zvířata');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('had-trnity', (select id from public.barvy where nazev = 'Zelená'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('had-trnity', (select id from public.barvy where nazev = 'Modrozelená'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('had-trnity', (select id from public.barvy where nazev = 'Oranžovošedivá'), 2, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('had-trnity', 'Velký', 490, 0, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-trnity', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/had-trnity-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-trnity', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/had-trnity-zelena-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-trnity', (select id from public.barvy where nazev = 'Modrozelená'), null, 'obrazky/had-trnity-modrozelena.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-trnity', (select id from public.barvy where nazev = 'Oranžovošedivá'), null, 'obrazky/had-trnity-oranzovosediva.jpg', 0);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('had-trnity', (select id from public.barvy where nazev = 'Zelená'), 2); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('had-trnity', (select id from public.barvy where nazev = 'Modrozelená'), 1); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('had-trnity', (select id from public.barvy where nazev = 'Oranžovošedivá'), 1); -- VYMYŠLENÉ

-- Had trnitý se stromem (had-trnity-se-stromem)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'had-trnity-se-stromem', 'Had trnitý se stromem', 'Proměňte svůj stůl či poličku v malý kousek exotické přírody! Tato propracovaná sada obsahuje flexibilního trnitého hada a stylový stojánek v podobě větve stromu, na který můžete hada libovolně obmotat nebo zavěsit.

Díky velkému množství pohyblivých kloubů je had neuvěřitelně ohebný a skvěle padne do ruky. Spolu se stojánkem tvoří nepřehlédnutelnou dekoraci, ale zároveň funguje jako chytlavá antistresová hračka a originální dárek pro všechny milovníky plazů.

- Set 2 v 1: Obsahuje dlouhého flexibilního trnitého hada a padnoucí stojánek ve tvaru větve.
- Detailní zpracování: Precizní 3D tisk s důrazem na plastické šupiny/ostny, plynulý pohyb kloubů a věrohodnou strukturu dřeva.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 590, 'velikost',
  false, 'bez_hlidani', false, true, 22);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'had-trnity-se-stromem', id from public.kategorie where nazev in ('Zvířata');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('had-trnity-se-stromem', (select id from public.barvy where nazev = 'Zelená'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('had-trnity-se-stromem', (select id from public.barvy where nazev = 'Modrozelená'), 1, false, true);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-trnity-se-stromem', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/had-trnity-se-stromem-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-trnity-se-stromem', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/had-trnity-se-stromem-zelena-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-trnity-se-stromem', (select id from public.barvy where nazev = 'Modrozelená'), null, 'obrazky/had-trnity-se-stromem-modrozelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-trnity-se-stromem', (select id from public.barvy where nazev = 'Modrozelená'), null, 'obrazky/had-trnity-se-stromem-modrozelena-2.jpg', 1);

-- Had hladký se stromem (had-hladky-se-stromem)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'had-hladky-se-stromem', 'Had hladký se stromem', 'Proměňte svůj stůl či poličku v malý kousek exotické přírody! Tato propracovaná sada obsahuje flexibilního, příjemně hladkého hada a stylový stojánek v podobě větve stromu, na který můžete hada libovolně obmotat nebo zavěsit.

Had s jemnými liniemi, hladkým tělem a zvědavě vztyčenou hlavou představuje elegantní a čistou variantu oblíbeného ohebného ještěra. Díky velkému množství pohyblivých kloubů je neuvěřitelně tvárný a skvěle padne do ruky.

- Set 2 v 1: Obsahuje dlouhého flexibilního hladkého hada a padnoucí stojánek ve tvaru větve.
- Elegantní vzhled: Precizní 3D tisk s důrazem na hladký povrch těla, plynulý přirozený pohyb a věrohodnou strukturu dřevěného podstavce.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 490, 'velikost',
  false, 'bez_hlidani', false, true, 23);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'had-hladky-se-stromem', id from public.kategorie where nazev in ('Zvířata');

-- Chameleon se stromem (chameleon-se-stromem)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'chameleon-se-stromem', 'Chameleon se stromem', 'Přeneste si domů kousek tropického pralesa! Tato promyšlená sada obsahuje flexibilního chameleona a propracovaný stojánek s větví, trávou a kameny, na který můžete chameleona libovolně usadit nebo uchytit.

Díky pohyblivým kloubům těla, nohou i ocasu je chameleon úžasně ohebný a skvěle padne do ruky. Spolu se stojánkem tvoří nepřehlédnutelnou dominantní dekoraci na stůl či poličku, ale zároveň funguje jako chytlavá antistresová hračka.

- Set 2 v 1: Obsahuje ohebného chameleona a detailně propracovaný stojánek v podobě větve s travnatým podstavcem a kameny.
- Detailní zpracování: Precizní 3D tisk s důrazem na strukturu kůže, zvědavé oči a plynulý pohyb kloubů.', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 490, 'velikost',
  false, 'bez_hlidani', false, true, 24);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'chameleon-se-stromem', id from public.kategorie where nazev in ('Zvířata');

-- Hadí vejce s hladkým hadem (hadi-vejce)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'hadi-vejce', 'Hadí vejce s hladkým hadem', '', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 490, 'velikost',
  false, 'bez_hlidani', false, true, 25);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'hadi-vejce', id from public.kategorie where nazev in ('Zvířata');

-- Dračí vejce (draci-vejce)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'draci-vejce', 'Dračí vejce', '', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, null, 'velikost',
  false, 'celkem', false, true, 26);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'draci-vejce', id from public.kategorie where nazev in ('Zvířata');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('draci-vejce', (select id from public.barvy where nazev = 'Červenozlatá'), 0, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('draci-vejce', 'Malý', 350, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('draci-vejce', 'Velký', 490, 1, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('draci-vejce', '+ drak', 790, 2, false);
insert into public.fotky (produkt_id, url, poradi) values ('draci-vejce', 'obrazky/draci-vejce-1.jpg', 0);
insert into public.fotky (produkt_id, url, poradi) values ('draci-vejce', 'obrazky/draci-vejce-2.jpg', 1);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('draci-vejce', null, 2); -- VYMYŠLENÉ

-- Had KOGI (had-kogi)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'had-kogi', 'Had KOGI', '', 'PLA', array['ohebne']::text[], 'KOGI3D', '', '',
  false, false, 390, 'velikost',
  false, 'bez_hlidani', true, true, 27);
insert into public.vyprodano_poznamky (produkt_id, barva_id, poznamka) values ('had-kogi', null, 'TESTOVACÍ: tiskárna v opravě');
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'had-kogi', id from public.kategorie where nazev in ('Zvířata');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('had-kogi', (select id from public.barvy where nazev = 'Modrá'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('had-kogi', (select id from public.barvy where nazev = 'Zelená'), 1, false, true);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-kogi', (select id from public.barvy where nazev = 'Modrá'), null, 'obrazky/had-kogi-modra-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-kogi', (select id from public.barvy where nazev = 'Modrá'), null, 'obrazky/had-kogi-modra-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-kogi', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/had-kogi-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('had-kogi', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/had-kogi-zelena-2.jpg', 1);

-- Stromek s hvězdou (stromek-s-hvezdou)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'stromek-s-hvezdou', 'Stromek s hvězdou', '', 'PLA', array[]::text[], 'Nowcraft 3D', '', '',
  false, false, null, 'velikost',
  false, 'bez_hlidani', false, true, 28);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'stromek-s-hvezdou', id from public.kategorie where nazev in ('Vánoce');
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('stromek-s-hvezdou', 'Malý', 80, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('stromek-s-hvezdou', 'Velký', 120, 1, false);
insert into public.fotky (produkt_id, url, poradi) values ('stromek-s-hvezdou', 'obrazky/stromek-s-hvezdou-1.jpg', 0);
insert into public.fotky (produkt_id, url, poradi) values ('stromek-s-hvezdou', 'obrazky/stromek-s-hvezdou-2.jpg', 1);

-- Louskáček (louskacek)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'louskacek', 'Louskáček', '', 'PLA', array[]::text[], 'Sabre Design', '', '',
  false, false, null, 'velikost',
  false, 'bez_hlidani', false, true, 29);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'louskacek', id from public.kategorie where nazev in ('Vánoce');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('louskacek', (select id from public.barvy where nazev = 'Vínová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('louskacek', (select id from public.barvy where nazev = 'Zelená se třpytkami'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('louskacek', (select id from public.barvy where nazev = 'Červená'), 2, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('louskacek', 'Malý', 80, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('louskacek', 'Velký', 150, 1, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('louskacek', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/louskacek-vinova.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('louskacek', (select id from public.barvy where nazev = 'Zelená se třpytkami'), null, 'obrazky/louskacek-zelena.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('louskacek', (select id from public.barvy where nazev = 'Červená'), null, 'obrazky/louskacek-cervena.jpg', 0);

-- Sněhulák (snehulak)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'snehulak', 'Sněhulák', '', 'PLA', array[]::text[], 'Sabre Design', '', '',
  false, false, 190, 'velikost',
  false, 'po_barvach', false, true, 30);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'snehulak', id from public.kategorie where nazev in ('Vánoce');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('snehulak', (select id from public.barvy where nazev = 'Béžová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('snehulak', (select id from public.barvy where nazev = 'Červená'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('snehulak', (select id from public.barvy where nazev = 'Zelená se třpytkami'), 2, false, true);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehulak', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/snehulak-bezova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehulak', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/snehulak-bezova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehulak', (select id from public.barvy where nazev = 'Červená'), null, 'obrazky/snehulak-cervena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehulak', (select id from public.barvy where nazev = 'Červená'), null, 'obrazky/snehulak-cervena-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehulak', (select id from public.barvy where nazev = 'Zelená se třpytkami'), null, 'obrazky/snehulak-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('snehulak', (select id from public.barvy where nazev = 'Zelená se třpytkami'), null, 'obrazky/snehulak-zelena-2.jpg', 1);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('snehulak', (select id from public.barvy where nazev = 'Béžová'), 2); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('snehulak', (select id from public.barvy where nazev = 'Červená'), 1); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('snehulak', (select id from public.barvy where nazev = 'Zelená se třpytkami'), 0); -- VYMYŠLENÉ

-- Ozdoba špička (ozdoba-spicka)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'ozdoba-spicka', 'Ozdoba špička', '', 'PLA', array['zavesne']::text[], 'Sabre Design', '', '',
  false, false, null, 'velikost',
  false, 'po_barvach', false, true, 31);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'ozdoba-spicka', id from public.kategorie where nazev in ('Vánoce');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Vínová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Béžová'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Bílá'), 2, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Tmavě hnědá'), 3, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Zelená se třpytkami'), 4, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('ozdoba-spicka', 'S', 80, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('ozdoba-spicka', 'M', 190, 1, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('ozdoba-spicka', 'L', 250, 2, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('ozdoba-spicka', 'Sada 3 ks S', 210, 3, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('ozdoba-spicka', 'Sada 6 ks S', 390, 4, true);
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 3 ks S'), 0, '1. kus');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 3 ks S'), 1, '2. kus');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 3 ks S'), 2, '3. kus');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 6 ks S'), 0, '1. kus');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 6 ks S'), 1, '2. kus');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 6 ks S'), 2, '3. kus');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 6 ks S'), 3, '4. kus');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 6 ks S'), 4, '5. kus');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('ozdoba-spicka', (select id from public.moznosti where produkt_id = 'ozdoba-spicka' and nazev = 'Sada 6 ks S'), 5, '6. kus');
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/ozdoba-spicka-vinova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/ozdoba-spicka-vinova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/ozdoba-spicka-vinova-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/ozdoba-spicka-bezova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Bílá'), null, 'obrazky/ozdoba-spicka-bila-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Tmavě hnědá'), null, 'obrazky/ozdoba-spicka-tmave-hneda-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Zelená se třpytkami'), null, 'obrazky/ozdoba-spicka-zelena-1.jpg', 0);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Vínová'), 9); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Béžová'), 3); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Bílá'), 6); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Tmavě hnědá'), 2); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('ozdoba-spicka', (select id from public.barvy where nazev = 'Zelená se třpytkami'), 4); -- VYMYŠLENÉ

-- Hvězda (hvezda)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'hvezda', 'Hvězda', '', 'PLA', array['zavesne']::text[], '', '', '',
  false, false, null, 'velikost',
  false, 'po_barvach', false, true, 32);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'hvezda', id from public.kategorie where nazev in ('Vánoce');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('hvezda', (select id from public.barvy where nazev = 'Bílá'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('hvezda', (select id from public.barvy where nazev = 'Zelená se třpytkami'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('hvezda', (select id from public.barvy where nazev = 'Červená'), 2, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('hvezda', (select id from public.barvy where nazev = 'Zlatá'), 3, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('hvezda', 'S', 20, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('hvezda', 'M', 30, 1, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('hvezda', 'L', 50, 2, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('hvezda', 'Sada 3 ks (S, M, L)', 80, 3, false);
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('hvezda', (select id from public.moznosti where produkt_id = 'hvezda' and nazev = 'Sada 3 ks (S, M, L)'), 0, 'S');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('hvezda', (select id from public.moznosti where produkt_id = 'hvezda' and nazev = 'Sada 3 ks (S, M, L)'), 1, 'M');
insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values ('hvezda', (select id from public.moznosti where produkt_id = 'hvezda' and nazev = 'Sada 3 ks (S, M, L)'), 2, 'L');
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hvezda', (select id from public.barvy where nazev = 'Bílá'), null, 'obrazky/hvezda-bila.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hvezda', (select id from public.barvy where nazev = 'Zelená se třpytkami'), null, 'obrazky/hvezda-zelena.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hvezda', (select id from public.barvy where nazev = 'Červená'), null, 'obrazky/hvezda-cervena.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('hvezda', (select id from public.barvy where nazev = 'Zlatá'), null, 'obrazky/hvezda-zlata.jpg', 0);
insert into public.zasoby (produkt_id, barva_id, pocet) values ('hvezda', (select id from public.barvy where nazev = 'Bílá'), 12); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('hvezda', (select id from public.barvy where nazev = 'Zelená se třpytkami'), 5); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('hvezda', (select id from public.barvy where nazev = 'Červená'), 5); -- VYMYŠLENÉ
insert into public.zasoby (produkt_id, barva_id, pocet) values ('hvezda', (select id from public.barvy where nazev = 'Zlatá'), 1); -- VYMYŠLENÉ

-- Dýně máslová (dyne-maslova)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'dyne-maslova', 'Dýně máslová', '', 'PLA', array[]::text[], 'Sabre Design', '', '',
  false, false, null, 'velikost',
  false, 'bez_hlidani', false, true, 33);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'dyne-maslova', id from public.kategorie where nazev in ('Dekorace', 'Podzim');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('dyne-maslova', (select id from public.barvy where nazev = 'Žlutá'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('dyne-maslova', (select id from public.barvy where nazev = 'Béžová'), 1, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('dyne-maslova', 'S', 30, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('dyne-maslova', 'M', 60, 1, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('dyne-maslova', 'L', 140, 2, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne-maslova', (select id from public.barvy where nazev = 'Žlutá'), null, 'obrazky/dyne-maslova-zluta-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne-maslova', (select id from public.barvy where nazev = 'Žlutá'), null, 'obrazky/dyne-maslova-zluta-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne-maslova', (select id from public.barvy where nazev = 'Žlutá'), null, 'obrazky/dyne-maslova-zluta-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne-maslova', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/dyne-maslova-bezova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('dyne-maslova', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/dyne-maslova-bezova-2.jpg', 1);

-- Váza (vaza-strukturovana)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'vaza-strukturovana', 'Váza', '', 'PLA', array['vaza']::text[], 'Sabre Design', '', '',
  false, false, null, 'velikost',
  false, 'bez_hlidani', false, true, 34);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'vaza-strukturovana', id from public.kategorie where nazev in ('Dekorace', 'Podzim');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Béžová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Zelená'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Vínová'), 2, false, true);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('vaza-strukturovana', 'Malá', 90, 0, false);
insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values ('vaza-strukturovana', 'Velká', 250, 1, false);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/vaza-hladka-bezova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Béžová'), null, 'obrazky/vaza-hladka-bezova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/vaza-hladka-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/vaza-hladka-zelena-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/vaza-hladka-vinova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('vaza-strukturovana', (select id from public.barvy where nazev = 'Vínová'), null, 'obrazky/vaza-hladka-vinova-2.jpg', 1);

-- Houba šiškovec (houba-siskovec)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'houba-siskovec', 'Houba šiškovec', '', 'PLA', array[]::text[], '', '', '',
  false, false, 180, 'velikost',
  false, 'bez_hlidani', false, true, 35);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'houba-siskovec', id from public.kategorie where nazev in ('Dekorace', 'Podzim');

-- Duch s dýní na hlavě (duch-s-dyni)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'duch-s-dyni', 'Duch s dýní na hlavě', '', 'PLA', array[]::text[], '', '', '',
  false, false, 50, 'velikost',
  false, 'bez_hlidani', false, true, 36);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'duch-s-dyni', id from public.kategorie where nazev in ('Halloween');
insert into public.fotky (produkt_id, url, poradi) values ('duch-s-dyni', 'obrazky/duch-s-dyni-1.jpg', 0);
insert into public.fotky (produkt_id, url, poradi) values ('duch-s-dyni', 'obrazky/duch-s-dyni-2.jpg', 1);

-- Svícen květ (svicen-kvet)
insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_nabidnout_vyrobu, poradi) values (
  'svicen-kvet', 'Svícen květ', '', 'PLA', array['led']::text[], '', '', '',
  false, false, 90, 'velikost',
  false, 'bez_hlidani', false, true, 37);
insert into public.produkt_kategorie (produkt_id, kategorie_id) select 'svicen-kvet', id from public.kategorie where nazev in ('Domácnost');
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('svicen-kvet', (select id from public.barvy where nazev = 'Fialová'), 0, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('svicen-kvet', (select id from public.barvy where nazev = 'Růžová'), 1, false, true);
insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_nabidnout_vyrobu) values ('svicen-kvet', (select id from public.barvy where nazev = 'Zelená'), 2, false, true);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Fialová'), null, 'obrazky/svicen-kvet-fialova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Fialová'), null, 'obrazky/svicen-kvet-fialova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Fialová'), null, 'obrazky/svicen-kvet-fialova-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Růžová'), null, 'obrazky/svicen-kvet-ruzova-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Růžová'), null, 'obrazky/svicen-kvet-ruzova-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Růžová'), null, 'obrazky/svicen-kvet-ruzova-3.jpg', 2);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/svicen-kvet-zelena-1.jpg', 0);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/svicen-kvet-zelena-2.jpg', 1);
insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values ('svicen-kvet', (select id from public.barvy where nazev = 'Zelená'), null, 'obrazky/svicen-kvet-zelena-3.jpg', 2);

commit;