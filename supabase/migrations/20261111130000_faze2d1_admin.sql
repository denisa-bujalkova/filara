-- =====================================================================
-- Filara – fáze 2, krok 2d-1: admin (objednávky a sklad)
--
-- Pouští se po 20261111120000_faze2c_platebni_udaje.sql (SQL Editor → vložit → Run).
-- Celý skript běží v jedné transakci. Žádná data nemaže ani nepřepisuje.
--
-- 1. Zrušení objednávky vrátí odečtené zásoby do prodeje – hlídá to trigger přímo v databázi,
--    takže to platí, ať stav změní admin, nebo později automatické rušení. Zásoby se vrátí
--    jen jednou (příznak zasoby_vraceny + zámek řádku objednávky). Zrušenou objednávku
--    nejde vrátit do jiného stavu (kusy už jsou zpátky v prodeji).
-- 2. Admin smí u objednávky měnit jen stav, interní poznámku a splatnost. Podklady pro vrácení
--    zásob, ceny a položky jsou kopie z okamžiku nákupu a přes API se měnit nedají.
--    Objednávky ani položky se přes API nemažou (zrušení = stav „zrušená“).
-- 3. Funkce pro admin: prodloužení splatnosti o pracovní dny, změna zásoby o ±N (bez ztráty
--    souběžné objednávky) a ruční „Momentálně vyprodáno“ s interní poznámkou.
--    Všechny ověřují je_admin() – tedy admina s dvoufázovým ověřením (aal2).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Změna stavu objednávky: vrácení zásob při zrušení, datum zaplacení
-- ---------------------------------------------------------------------

create function public.pri_zmene_stavu_objednavky()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r jsonb;
  v_produkt text;
  v_barva   integer;
  v_pocet   integer;
begin
  if new.stav = old.stav then
    return new;
  end if;

  if old.stav = 'zrusena' then
    raise exception 'zrusenou_nelze_obnovit'
      using hint = 'Zrušenou objednávku nejde vrátit zpět – kusy se už vrátily do prodeje. Vytvořte prosím novou objednávku.';
  end if;

  if new.stav = 'zaplacena' and new.zaplaceno is null then
    new.zaplaceno := now();
  elsif new.stav = 'nova' then
    new.zaplaceno := null;
  end if;

  -- Zrušení: vrátit přesně to, co se při vzniku objednávky odečetlo. Jen jednou.
  -- (UPDATE drží zámek řádku objednávky, druhé souběžné zrušení počká a uvidí zasoby_vraceny = true.)
  if new.stav = 'zrusena' and not old.zasoby_vraceny then
    for r in select value from jsonb_array_elements(coalesce(old.odecteno_zasob, '[]')) loop
      v_produkt := r ->> 'produkt_id';
      v_barva   := nullif(r ->> 'barva_id', '')::integer;
      v_pocet   := coalesce((r ->> 'pocet')::integer, 0);
      continue when v_pocet <= 0
                 or not exists (select 1 from public.produkty where id = v_produkt)
                 or (v_barva is not null and not exists (select 1 from public.barvy where id = v_barva));
      update public.zasoby
         set pocet = pocet + v_pocet, upraveno = now()
       where produkt_id = v_produkt and barva_id is not distinct from v_barva;
      if not found then
        insert into public.zasoby (produkt_id, barva_id, pocet) values (v_produkt, v_barva, v_pocet);
      end if;
    end loop;
    new.zasoby_vraceny := true;
  end if;

  return new;
end;
$$;
revoke execute on function public.pri_zmene_stavu_objednavky() from public, anon, authenticated;

create trigger objednavky_zmena_stavu
  before update of stav on public.objednavky
  for each row execute function public.pri_zmene_stavu_objednavky();

-- ---------------------------------------------------------------------
-- 2. Co smí admin přes API u objednávek měnit
-- ---------------------------------------------------------------------

revoke update, delete on public.objednavky from authenticated;
revoke update, delete on public.polozky_objednavky from authenticated;
grant update (stav, poznamka_admin, splatnost) on public.objednavky to authenticated;
-- RLS „jen admin“ z první migrace dál platí: ostatní přihlášení nezmění nic.

-- ---------------------------------------------------------------------
-- 3. Funkce pro admin
-- ---------------------------------------------------------------------

-- Prodloužení splatnosti o daný počet pracovních dnů (od dosavadní splatnosti, nebo od dneška,
-- pokud už uplynula). Vrací novou splatnost.
create function public.prodluz_splatnost(p_cislo bigint, p_pracovni_dny integer)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v timestamptz;
begin
  if not public.je_admin() then
    raise exception 'jen_admin' using hint = 'Přihlaste se prosím jako admin s dvoufázovým ověřením.';
  end if;
  if p_pracovni_dny is null or p_pracovni_dny not between 1 and 30 then
    raise exception 'neplatna_hodnota' using hint = 'Lhůtu jde prodloužit o 1 až 30 pracovních dnů.';
  end if;
  update public.objednavky
     set splatnost = public.splatnost_objednavky(greatest(splatnost, now()), p_pracovni_dny)
   where cislo = p_cislo and stav = 'nova'
  returning splatnost into v;
  if v is null then
    raise exception 'nelze_prodlouzit' using hint = 'Lhůtu jde prodloužit jen u objednávky, která čeká na platbu.';
  end if;
  return v;
end;
$$;

-- Změna zásoby o ±N jedním příkazem (nepřepíše kus, který mezitím odečetla objednávka).
-- barva_id null = zásoba za celý výrobek (režim „celkem“). Nikdy neklesne pod 0. Vrací nový počet.
create function public.zmen_zasobu(p_produkt_id text, p_barva_id integer, p_zmena integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v integer;
begin
  if not public.je_admin() then
    raise exception 'jen_admin' using hint = 'Přihlaste se prosím jako admin s dvoufázovým ověřením.';
  end if;
  if p_zmena is null or p_zmena not between -1000 and 1000 then
    raise exception 'neplatna_hodnota' using hint = 'Neplatná změna počtu kusů.';
  end if;
  update public.zasoby
     set pocet = greatest(0, pocet + p_zmena), upraveno = now()
   where produkt_id = p_produkt_id and barva_id is not distinct from p_barva_id
  returning pocet into v;
  if v is null then
    insert into public.zasoby (produkt_id, barva_id, pocet)
    values (p_produkt_id, p_barva_id, greatest(0, p_zmena))
    returning pocet into v;
  end if;
  return v;
end;
$$;

-- Ruční „Momentálně vyprodáno“ u výrobku (p_barva_id null) nebo u jeho barvy,
-- s volbou „nabízet Objednat do výroby“ a interní poznámkou (prázdná = smazat).
create function public.nastav_vyprodano(p_produkt_id text, p_barva_id integer, p_vyprodano boolean,
                                        p_nabidnout_vyrobu boolean, p_poznamka text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.je_admin() then
    raise exception 'jen_admin' using hint = 'Přihlaste se prosím jako admin s dvoufázovým ověřením.';
  end if;
  if length(coalesce(p_poznamka, '')) > 1000 then
    raise exception 'neplatna_hodnota' using hint = 'Poznámka může mít nejvýš 1000 znaků.';
  end if;
  if p_barva_id is null then
    update public.produkty
       set vyprodano_rucne = coalesce(p_vyprodano, false),
           vyprodano_nabidnout_vyrobu = coalesce(p_nabidnout_vyrobu, true),
           upraveno = now()
     where id = p_produkt_id;
  else
    update public.produkt_barvy
       set vyprodano_rucne = coalesce(p_vyprodano, false),
           vyprodano_nabidnout_vyrobu = coalesce(p_nabidnout_vyrobu, true)
     where produkt_id = p_produkt_id and barva_id = p_barva_id;
  end if;
  if not found then
    raise exception 'nenalezeno' using hint = 'Výrobek nebo barva neexistuje.';
  end if;

  delete from public.vyprodano_poznamky
   where produkt_id = p_produkt_id and barva_id is not distinct from p_barva_id;
  if trim(coalesce(p_poznamka, '')) <> '' then
    insert into public.vyprodano_poznamky (produkt_id, barva_id, poznamka)
    values (p_produkt_id, p_barva_id, trim(p_poznamka));
  end if;
end;
$$;

revoke execute on function public.prodluz_splatnost(bigint, integer),
                           public.zmen_zasobu(text, integer, integer),
                           public.nastav_vyprodano(text, integer, boolean, boolean, text)
  from public, anon, authenticated;
grant execute on function public.prodluz_splatnost(bigint, integer),
                          public.zmen_zasobu(text, integer, integer),
                          public.nastav_vyprodano(text, integer, boolean, boolean, text)
  to authenticated;

commit;
