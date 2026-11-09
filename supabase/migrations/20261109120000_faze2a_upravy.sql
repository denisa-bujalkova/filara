-- =====================================================================
-- Filara – fáze 2, krok 2a: úpravy po rozhodnutí (9. 11. 2026)
--
-- Pouští se po 20261106120000_faze2_databaze.sql (SQL Editor → vložit → Run).
-- Celý skript běží v jedné transakci.
--
-- 1. Poznámka k ručnímu „Momentálně vyprodáno“ je jen pro admina: přesouvá se
--    z tabulek produkty a produkt_barvy (které čte každý) do nové tabulky
--    vyprodano_poznamky, kterou čte jen admin. Veřejně zůstává jen stav.
-- 2. Lhůta na zaplacení je v pracovních dnech (bez víkendů a českých státních
--    svátků), výchozí hodnota 3. Splatnost = konec posledního pracovního dne lhůty
--    (23:59:59 pražského času); den objednávky se nepočítá.
-- 3. Limity v nastavení, které hlídá vytvor_objednavku():
--    max. nezaplacených objednávek na stejný e-mail nebo telefon (výchozí 2)
--    a max. kusů jednoho výrobku v objednávce (výchozí 10).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Poznámka k „Momentálně vyprodáno“ jen pro admina
-- ---------------------------------------------------------------------

-- barva_id null = poznámka k celému výrobku, jinak k jeho barvě.
create table public.vyprodano_poznamky (
  produkt_id  text    not null references public.produkty (id) on delete cascade,
  barva_id    integer references public.barvy (id) on delete cascade,
  poznamka    text    not null check (length(poznamka) <= 1000),
  upraveno    timestamptz not null default now()
);
create unique index vyprodano_poznamky_produkt_barva on public.vyprodano_poznamky (produkt_id, barva_id) nulls not distinct;
comment on table public.vyprodano_poznamky is 'Interní poznámky admina k ručnímu „Momentálně vyprodáno“ (např. došel filament). Nepřihlášený je nečte.';

insert into public.vyprodano_poznamky (produkt_id, barva_id, poznamka)
  select id, null, vyprodano_poznamka from public.produkty where vyprodano_poznamka <> '';
insert into public.vyprodano_poznamky (produkt_id, barva_id, poznamka)
  select produkt_id, barva_id, vyprodano_poznamka from public.produkt_barvy where vyprodano_poznamka <> '';

alter table public.produkty      drop column vyprodano_poznamka;
alter table public.produkt_barvy drop column vyprodano_poznamka;

revoke all on public.vyprodano_poznamky from anon, authenticated;
grant select, insert, update, delete on public.vyprodano_poznamky to authenticated;
alter table public.vyprodano_poznamky enable row level security;
create policy "jen admin" on public.vyprodano_poznamky for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

-- ---------------------------------------------------------------------
-- 2. Lhůta na zaplacení v pracovních dnech
-- ---------------------------------------------------------------------

alter table public.nastaveni rename column dny_na_zaplaceni to pracovni_dny_na_zaplaceni;
alter table public.nastaveni alter column pracovni_dny_na_zaplaceni set default 3;
update public.nastaveni set pracovni_dny_na_zaplaceni = 3;

-- Velikonoční neděle (gregoriánský kalendář, tzv. anonymní algoritmus).
create function public.velikonocni_nedele(rok integer)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  a integer := rok % 19;
  b integer := rok / 100;
  c integer := rok % 100;
  d integer := b / 4;
  e integer := b % 4;
  f integer := (b + 8) / 25;
  g integer := (b - f + 1) / 3;
  h integer := (19 * a + b - d - g + 15) % 30;
  i integer := c / 4;
  k integer := c % 4;
  l integer := (32 + 2 * e + 2 * i - h - k) % 7;
  m integer := (a + 11 * h + 22 * l) / 451;
begin
  return make_date(rok, (h + l - 7 * m + 114) / 31, ((h + l - 7 * m + 114) % 31) + 1);
end;
$$;

-- Pracovní den = pondělí až pátek, který není český státní svátek
-- (zákon č. 245/2000 Sb.: státní svátky a ostatní svátky, kdy se nepracuje).
create function public.je_pracovni_den(den date)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select extract(isodow from den) < 6
     and to_char(den, 'DD.MM') not in (
           '01.01',  -- Den obnovy samostatného českého státu, Nový rok
           '01.05',  -- Svátek práce
           '08.05',  -- Den vítězství
           '05.07',  -- Den slovanských věrozvěstů Cyrila a Metoděje
           '06.07',  -- Den upálení mistra Jana Husa
           '28.09',  -- Den české státnosti
           '28.10',  -- Den vzniku samostatného československého státu
           '17.11',  -- Den boje za svobodu a demokracii
           '24.12', '25.12', '26.12')  -- Štědrý den, 1. a 2. svátek vánoční
     and den <> public.velikonocni_nedele(extract(year from den)::integer) - 2   -- Velký pátek
     and den <> public.velikonocni_nedele(extract(year from den)::integer) + 1;  -- Velikonoční pondělí
$$;

-- Splatnost: od dne objednávky (pražský čas) se odpočítá daný počet pracovních dnů,
-- splatnost je na konci posledního z nich. Den objednávky se nepočítá.
-- Příklad: objednávka v pátek 13. 11. 2026, 3 pracovní dny → po 16., st 18., čt 19. 11.
--          (17. 11. je svátek) → splatnost 19. 11. 2026 23:59:59.
create function public.splatnost_objednavky(od timestamptz, pracovni_dny integer)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  den   date := (od at time zone 'Europe/Prague')::date;
  zbyva integer := greatest(pracovni_dny, 1);
begin
  while zbyva > 0 loop
    den := den + 1;
    if public.je_pracovni_den(den) then
      zbyva := zbyva - 1;
    end if;
  end loop;
  return (den + time '23:59:59') at time zone 'Europe/Prague';
end;
$$;

revoke execute on function public.velikonocni_nedele(integer), public.je_pracovni_den(date),
                           public.splatnost_objednavky(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.velikonocni_nedele(integer), public.je_pracovni_den(date),
                          public.splatnost_objednavky(timestamptz, integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Limity objednávek
-- ---------------------------------------------------------------------

alter table public.nastaveni
  add column max_nezaplacenych integer not null default 2  check (max_nezaplacenych between 1 and 50),
  add column max_kusu_vyrobku  integer not null default 10 check (max_kusu_vyrobku between 1 and 99);
comment on column public.nastaveni.max_nezaplacenych is 'Kolik objednávek ve stavu „nova“ (čeká na platbu) smí mít jeden e-mail nebo telefon.';
comment on column public.nastaveni.max_kusu_vyrobku is 'Kolik kusů jednoho výrobku (všechny barvy a velikosti dohromady) smí být v jedné objednávce.';

-- Telefon pro porovnání: jen číslice, bez předvolby +420 / 00420.
-- „+420 777 123 456“, „777123456“ i „00420777123456“ dají stejné „777123456“.
create function public.normalizuj_telefon(telefon text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
           regexp_replace(coalesce(telefon, ''), '\D', '', 'g'),
           '^(00)?420(?=\d{9}$)', '');
$$;
revoke execute on function public.normalizuj_telefon(text) from public, anon, authenticated;

create index objednavky_nezaplacene_email on public.objednavky (email) where stav = 'nova';

-- ---------------------------------------------------------------------
-- Veřejné nastavení: nové a přejmenované hodnoty
-- ---------------------------------------------------------------------

create or replace function public.verejne_nastaveni()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'text_vyroba',               n.text_vyroba,
    'cena_zasilkovna',           n.cena_zasilkovna,
    'pracovni_dny_na_zaplaceni', n.pracovni_dny_na_zaplaceni,
    'max_kusu_vyrobku',          n.max_kusu_vyrobku
  )
  from public.nastaveni n;
$$;

-- ---------------------------------------------------------------------
-- vytvor_objednavku: splatnost v pracovních dnech a limity
--
-- Nové chyby (PostgREST je vrátí jako { code, message, details, hint }):
--   message 'limit_nezaplacenych'  details = {"limit": 2, "nezaplacene": 2}
--   message 'limit_kusu'           details = {"produkt_id": "…", "limit": 10, "chci": 11}
-- V hint je u nich věta pro zákazníka, kterou může web rovnou ukázat.
--
-- Souběh: dvě objednávky na stejný e-mail/telefon ve stejné chvíli by obě viděly jen
-- starší objednávky a limit by přeskočily. Proto se na e-mail a telefon bere zámek
-- (pg_advisory_xact_lock) – druhá objednávka počká, než první skončí.
-- Zbytek funkce (kontroly, ceny z databáze, zámek a odečet zásob) je beze změny.
-- ---------------------------------------------------------------------

create or replace function public.vytvor_objednavku(zakaznik jsonb, polozky jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_nast          public.nastaveni%rowtype;
  v_jmeno         text := trim(coalesce(zakaznik ->> 'jmeno', ''));
  v_email         text := lower(trim(coalesce(zakaznik ->> 'email', '')));
  v_telefon       text := trim(coalesce(zakaznik ->> 'telefon', ''));
  v_doprava       text := coalesce(zakaznik ->> 'doprava', '');
  v_zas_id        text := trim(coalesce(zakaznik ->> 'zasilkovna_id', ''));
  v_zas_nazev     text := trim(coalesce(zakaznik ->> 'zasilkovna_nazev', ''));
  v_poznamka      text := trim(coalesce(zakaznik ->> 'poznamka', ''));
  v_doprava_nazev text;
  v_doprava_cena  integer;

  v_pol           jsonb;
  v_idx           integer := 0;
  v_p             public.produkty%rowtype;
  v_m             public.moznosti%rowtype;
  v_moznost_id    integer;
  v_barva_id      integer;
  v_pocet         integer;
  v_pol_pozn      text;
  v_ma_moznosti   boolean;
  v_ma_barvy      boolean;
  v_kusy          integer[];      -- id kusů sady v pořadí
  v_sada_barvy    integer[];      -- barva každého kusu
  v_barvy_pol     integer[];      -- barvy, které položka spotřebuje (1 nebo víc u sady)
  v_b             integer;
  v_i             integer;
  v_cena          integer;
  v_sada_json     jsonb;
  v_nazev_barvy   text;

  v_radky         jsonb := '[]';  -- připravené položky k uložení
  v_potreba       jsonb := '{}';  -- "produkt_id|barva_id" → počet kusů ze zásob
  v_klic          text;
  v_chci          integer;
  v_mam           integer;
  v_chybi         jsonb := '[]';
  v_odecteno      jsonb := '[]';
  v_cena_zbozi    integer := 0;
  v_cislo         bigint;
  v_splatnost     timestamptz;
  v_tel_norm      text;
  v_nezaplacene   integer;
  v_kusy_vyrobku  jsonb := '{}';  -- produkt_id → kusů v objednávce (všechny barvy a velikosti)
begin
  -- Nastavení
  select * into v_nast from public.nastaveni;
  if not found then
    raise exception 'chybi_nastaveni' using detail = 'V tabulce nastaveni chybí řádek.';
  end if;

  -- Zákazník
  if v_jmeno = '' or length(v_jmeno) > 120 then
    raise exception 'neplatna_objednavka' using detail = 'Chybí jméno.';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception 'neplatna_objednavka' using detail = 'Neplatný e-mail.';
  end if;
  if length(v_telefon) > 30 or length(v_poznamka) > 1000 then
    raise exception 'neplatna_objednavka' using detail = 'Telefon nebo poznámka je příliš dlouhá.';
  end if;

  -- Limit nezaplacených objednávek na stejný e-mail nebo telefon.
  -- Zámky ve stálém pořadí, aby dvě souběžné objednávky téhož zákazníka limit nepřeskočily.
  v_tel_norm := public.normalizuj_telefon(v_telefon);
  for v_klic in
    select k from unnest(array['email:' || v_email]
                         || case when v_tel_norm <> '' then array['tel:' || v_tel_norm] else '{}'::text[] end) as k
     order by k
  loop
    perform pg_advisory_xact_lock(hashtextextended('filara-objednavka:' || v_klic, 0));
  end loop;

  select count(*) into v_nezaplacene
    from public.objednavky o
   where o.stav = 'nova'
     and (o.email = v_email
          or (v_tel_norm <> '' and public.normalizuj_telefon(o.telefon) = v_tel_norm));
  if v_nezaplacene >= v_nast.max_nezaplacenych then
    raise exception 'limit_nezaplacenych'
      using detail = jsonb_build_object('limit', v_nast.max_nezaplacenych, 'nezaplacene', v_nezaplacene)::text,
            hint   = 'Na tento e-mail nebo telefon už evidujeme nezaplacené objednávky. Novou objednávku můžete odeslat, '
                     'až některou z nich zaplatíte. Pokud jde o omyl, napište nám prosím.';
  end if;

  -- Doprava (cena z nastavení, ne z prohlížeče)
  if v_doprava = 'osobni' then
    v_doprava_nazev := 'Osobní odběr (po domluvě)';
    v_doprava_cena  := 0;
    v_zas_id := ''; v_zas_nazev := '';
  elsif v_doprava = 'zasilkovna' then
    if v_zas_id = '' or length(v_zas_id) > 50 or length(v_zas_nazev) > 300 then
      raise exception 'neplatna_objednavka' using detail = 'Chybí výdejní místo Zásilkovny.';
    end if;
    v_doprava_nazev := 'Zásilkovna – výdejní místo';
    v_doprava_cena  := v_nast.cena_zasilkovna;
  else
    raise exception 'neplatna_objednavka' using detail = 'Neznámý způsob dopravy.';
  end if;

  -- Položky
  if jsonb_typeof(polozky) is distinct from 'array' or jsonb_array_length(polozky) = 0 then
    raise exception 'neplatna_objednavka' using detail = 'Košík je prázdný.';
  end if;
  if jsonb_array_length(polozky) > 50 then
    raise exception 'neplatna_objednavka' using detail = 'Příliš mnoho položek.';
  end if;

  for v_pol in select value from jsonb_array_elements(polozky) loop
    v_idx := v_idx + 1;

    -- Výrobek
    select * into v_p from public.produkty where id = v_pol ->> 'produkt_id' and aktivni;
    if not found then
      raise exception 'neplatna_objednavka' using detail = format('Položka %s: výrobek neexistuje.', v_idx);
    end if;
    if v_p.vyprodano_rucne then
      raise exception 'vyprodano' using detail = jsonb_build_object('produkt_id', v_p.id, 'barva_id', null)::text;
    end if;

    -- Počet
    begin
      v_pocet := (v_pol ->> 'pocet')::integer;
    exception when others then
      v_pocet := null;
    end;
    if v_pocet is null or v_pocet < 1 or v_pocet > 99 then
      raise exception 'neplatna_objednavka' using detail = format('Položka %s: neplatný počet kusů.', v_idx);
    end if;

    v_pol_pozn := trim(coalesce(v_pol ->> 'poznamka', ''));
    if length(v_pol_pozn) > 500 then
      raise exception 'neplatna_objednavka' using detail = format('Položka %s: poznámka je příliš dlouhá.', v_idx);
    end if;

    -- Velikost / varianta a cena
    v_ma_moznosti := exists (select 1 from public.moznosti where produkt_id = v_p.id and aktivni);
    v_moznost_id  := nullif(v_pol ->> 'moznost_id', '')::integer;
    v_m := null;
    if v_ma_moznosti then
      select * into v_m from public.moznosti where id = v_moznost_id and produkt_id = v_p.id and aktivni;
      if not found then
        raise exception 'neplatna_objednavka' using detail = format('Položka %s: neplatná velikost/varianta.', v_idx);
      end if;
      v_cena := v_m.cena;
    else
      if v_moznost_id is not null then
        raise exception 'neplatna_objednavka' using detail = format('Položka %s: výrobek nemá velikosti.', v_idx);
      end if;
      v_cena := v_p.cena;
    end if;
    if v_cena is null then
      raise exception 'neplatna_objednavka' using detail = format('Položka %s: výrobek nemá cenu.', v_idx);
    end if;

    -- Kusy sady: u možnosti, jinak u celého výrobku
    select coalesce(array_agg(k.id order by k.poradi, k.id), '{}') into v_kusy
      from public.sada_kusy k
     where k.produkt_id = v_p.id
       and (case when v_m.id is not null and exists (select 1 from public.sada_kusy k2 where k2.moznost_id = v_m.id)
                 then k.moznost_id = v_m.id
                 else k.moznost_id is null end);

    v_ma_barvy := exists (select 1 from public.produkt_barvy where produkt_id = v_p.id);
    v_barva_id := nullif(v_pol ->> 'barva_id', '')::integer;
    v_sada_json := '[]';
    v_nazev_barvy := '';

    if cardinality(v_kusy) > 0 then
      -- Sada: barva pro každý kus
      if v_barva_id is not null then
        raise exception 'neplatna_objednavka' using detail = format('Položka %s: u sady se barva volí po kusech.', v_idx);
      end if;
      begin
        select array_agg(value::integer order by ord) into v_sada_barvy
          from jsonb_array_elements_text(v_pol -> 'sada_barvy') with ordinality as t(value, ord);
      exception when others then
        v_sada_barvy := null;
      end;
      if v_sada_barvy is null or cardinality(v_sada_barvy) <> cardinality(v_kusy) then
        raise exception 'neplatna_objednavka' using detail = format('Položka %s: počet barev nesedí s počtem kusů sady.', v_idx);
      end if;
      for v_i in 1 .. cardinality(v_kusy) loop
        v_b := v_sada_barvy[v_i];
        -- Barva musí být povolená pro kus (vlastní seznam kusu, jinak barvy výrobku)
        if exists (select 1 from public.sada_kus_barvy where kus_id = v_kusy[v_i]) then
          if not exists (select 1 from public.sada_kus_barvy where kus_id = v_kusy[v_i] and barva_id = v_b) then
            raise exception 'neplatna_objednavka' using detail = format('Položka %s: barva kusu %s není v nabídce.', v_idx, v_i);
          end if;
        elsif not exists (select 1 from public.produkt_barvy where produkt_id = v_p.id and barva_id = v_b) then
          raise exception 'neplatna_objednavka' using detail = format('Položka %s: barva kusu %s není v nabídce.', v_idx, v_i);
        end if;
        if exists (select 1 from public.produkt_barvy where produkt_id = v_p.id and barva_id = v_b and vyprodano_rucne) then
          raise exception 'vyprodano' using detail = jsonb_build_object('produkt_id', v_p.id, 'barva_id', v_b)::text;
        end if;
        v_sada_json := v_sada_json || jsonb_build_object(
          'kus',      (select nazev from public.sada_kusy where id = v_kusy[v_i]),
          'barva',    (select nazev from public.barvy where id = v_b),
          'barva_id', v_b);
      end loop;
      v_barvy_pol := v_sada_barvy;
    elsif v_ma_barvy then
      -- Jedna barva: musí patřit k výrobku a k variantě (pokud má varianta vlastní seznam)
      if v_barva_id is null
         or not exists (select 1 from public.produkt_barvy where produkt_id = v_p.id and barva_id = v_barva_id)
         or (v_m.id is not null
             and exists (select 1 from public.moznost_barvy where moznost_id = v_m.id)
             and not exists (select 1 from public.moznost_barvy where moznost_id = v_m.id and barva_id = v_barva_id)) then
        raise exception 'neplatna_objednavka' using detail = format('Položka %s: neplatná barva.', v_idx);
      end if;
      if exists (select 1 from public.produkt_barvy where produkt_id = v_p.id and barva_id = v_barva_id and vyprodano_rucne) then
        raise exception 'vyprodano' using detail = jsonb_build_object('produkt_id', v_p.id, 'barva_id', v_barva_id)::text;
      end if;
      select nazev into v_nazev_barvy from public.barvy where id = v_barva_id;
      v_barvy_pol := array[v_barva_id];
    else
      if v_barva_id is not null then
        raise exception 'neplatna_objednavka' using detail = format('Položka %s: výrobek nemá volbu barvy.', v_idx);
      end if;
      v_barvy_pol := '{}';
    end if;

    -- Kolik kusů ze zásob položka potřebuje
    if v_p.rezim_zasob = 'celkem' then
      v_klic := v_p.id || '|';
      v_potreba := jsonb_set(v_potreba, array[v_klic], to_jsonb(coalesce((v_potreba ->> v_klic)::integer, 0) + v_pocet));
    elsif v_p.rezim_zasob = 'po_barvach' then
      if cardinality(v_barvy_pol) = 0 then
        raise exception 'neplatna_objednavka' using detail = format('Položka %s: výrobek hlídá zásoby po barvách, ale nemá barvu.', v_idx);
      end if;
      foreach v_b in array v_barvy_pol loop
        v_klic := v_p.id || '|' || v_b;
        v_potreba := jsonb_set(v_potreba, array[v_klic], to_jsonb(coalesce((v_potreba ->> v_klic)::integer, 0) + v_pocet));
      end loop;
    end if;

    -- Limit kusů jednoho výrobku (všechny položky výrobku dohromady; sada = 1 kus)
    v_kusy_vyrobku := jsonb_set(v_kusy_vyrobku, array[v_p.id],
                                to_jsonb(coalesce((v_kusy_vyrobku ->> v_p.id)::integer, 0) + v_pocet));
    if (v_kusy_vyrobku ->> v_p.id)::integer > v_nast.max_kusu_vyrobku then
      raise exception 'limit_kusu'
        using detail = jsonb_build_object('produkt_id', v_p.id, 'limit', v_nast.max_kusu_vyrobku,
                                          'chci', (v_kusy_vyrobku ->> v_p.id)::integer)::text,
              hint   = format('Výrobek „%s“ můžete v jedné objednávce koupit nejvýš %s×. '
                              'Pokud potřebujete víc kusů, napište nám prosím.', v_p.nazev, v_nast.max_kusu_vyrobku);
    end if;

    v_cena_zbozi := v_cena_zbozi + v_cena * v_pocet;
    v_radky := v_radky || jsonb_build_object(
      'poradi',         v_idx,
      'produkt_id',     v_p.id,
      'moznost_id',     v_m.id,
      'barva_id',       case when cardinality(v_kusy) > 0 then null else v_barva_id end,
      'nazev_produktu', v_p.nazev,
      'typ_moznosti',   case when v_m.id is null then '' when v_p.typ_moznosti = 'varianta' then 'Varianta' else 'Velikost' end,
      'nazev_moznosti', coalesce(v_m.nazev, ''),
      'nazev_barvy',    coalesce(v_nazev_barvy, ''),
      'sada',           v_sada_json,
      'poznamka',       v_pol_pozn,
      'cena_za_kus',    v_cena,
      'pocet',          v_pocet);
  end loop;

  -- Zásoby: zamknout řádky ve stálém pořadí (podle klíče), zkontrolovat všechno, pak odečíst.
  for v_klic, v_chci in
    select key, value::integer from jsonb_each_text(v_potreba) order by key
  loop
    v_b := nullif(split_part(v_klic, '|', 2), '')::integer;
    select z.pocet into v_mam
      from public.zasoby z
     where z.produkt_id = split_part(v_klic, '|', 1)
       and z.barva_id is not distinct from v_b
       for update;
    if not found then
      v_mam := 0;   -- chybějící řádek = vyprodáno
    end if;
    if v_mam < v_chci then
      v_chybi := v_chybi || jsonb_build_object(
        'produkt_id', split_part(v_klic, '|', 1),
        'barva_id',   v_b,
        'nazev',      (select nazev from public.produkty where id = split_part(v_klic, '|', 1))
                      || coalesce(', ' || (select nazev from public.barvy where id = v_b), ''),
        'chci',       v_chci,
        'zbyva',      v_mam);
    end if;
  end loop;

  if jsonb_array_length(v_chybi) > 0 then
    raise exception 'nedostatek_zasob' using detail = v_chybi::text;
  end if;

  for v_klic, v_chci in
    select key, value::integer from jsonb_each_text(v_potreba) order by key
  loop
    v_b := nullif(split_part(v_klic, '|', 2), '')::integer;
    update public.zasoby z
       set pocet = z.pocet - v_chci, upraveno = now()
     where z.produkt_id = split_part(v_klic, '|', 1)
       and z.barva_id is not distinct from v_b;
    v_odecteno := v_odecteno || jsonb_build_object('produkt_id', split_part(v_klic, '|', 1), 'barva_id', v_b, 'pocet', v_chci);
  end loop;

  -- Uložit objednávku
  v_splatnost := public.splatnost_objednavky(now(), v_nast.pracovni_dny_na_zaplaceni);
  insert into public.objednavky (
    splatnost, user_id, jmeno, email, telefon,
    doprava, doprava_nazev, doprava_cena, zasilkovna_id, zasilkovna_nazev,
    cena_zbozi, cena_celkem, cislo_uctu, poznamka_zakaznika, odecteno_zasob)
  values (
    v_splatnost, auth.uid(), v_jmeno, v_email, v_telefon,
    v_doprava, v_doprava_nazev, v_doprava_cena, v_zas_id, v_zas_nazev,
    v_cena_zbozi, v_cena_zbozi + v_doprava_cena, v_nast.cislo_uctu, v_poznamka, v_odecteno)
  returning cislo into v_cislo;

  insert into public.polozky_objednavky (
    cislo, poradi, produkt_id, moznost_id, barva_id, nazev_produktu, typ_moznosti,
    nazev_moznosti, nazev_barvy, sada, poznamka, cena_za_kus, pocet)
  select v_cislo, (r ->> 'poradi')::integer, r ->> 'produkt_id', (r ->> 'moznost_id')::integer,
         (r ->> 'barva_id')::integer, r ->> 'nazev_produktu', r ->> 'typ_moznosti',
         r ->> 'nazev_moznosti', r ->> 'nazev_barvy', r -> 'sada', r ->> 'poznamka',
         (r ->> 'cena_za_kus')::integer, (r ->> 'pocet')::integer
    from jsonb_array_elements(v_radky) as r;

  return jsonb_build_object(
    'cislo',             v_cislo,
    'variabilni_symbol', v_cislo::text,
    'cena_zbozi',        v_cena_zbozi,
    'doprava_cena',      v_doprava_cena,
    'cena_celkem',       v_cena_zbozi + v_doprava_cena,
    'splatnost',         v_splatnost,
    'cislo_uctu',        v_nast.cislo_uctu,
    'nazev_prijemce',    v_nast.nazev_prijemce);
end;
$$;

revoke execute on function public.vytvor_objednavku(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.vytvor_objednavku(jsonb, jsonb) to anon, authenticated;

commit;
