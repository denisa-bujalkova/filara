-- =====================================================================
-- Filara – fáze 2, krok 2d-2: správa výrobků, barev, kategorií a fotek v adminu
--
-- Pouští se po 20261111130000_faze2d1_admin.sql (SQL Editor → vložit → Run).
-- Celý skript běží v jedné transakci. Žádná data nemaže ani nepřepisuje.
--
-- 1. Storage: bucket „fotky“ – veřejné čtení (fotky na webu), nahrávat, měnit a mazat smí jen
--    admin s dvoufázovým ověřením (je_admin() v pravidlech Storage). Jen JPG do 5 MB.
-- 2. Ochrana mazání:
--    – výrobek, který je v nějaké objednávce, nejde smazat (jen skrýt),
--    – barvu nebo kategorii, kterou používá nějaký výrobek, nejde smazat.
-- 3. uloz_vyrobek(jsonb): uloží celý výrobek najednou (kategorie, barvy, velikosti/varianty,
--    omezení barev, sady, fotky) v jedné transakci. Jen pro admina.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Storage: bucket a pravidla
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotky', 'fotky', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

-- Veřejné čtení zajišťuje public = true (odkazy …/storage/v1/object/public/fotky/…).
-- Vypsat obsah bucketu ani nic měnit veřejnost nesmí – tyto pravidla platí jen pro admina.
create policy "fotky: admin vidí"   on storage.objects for select to authenticated
  using (bucket_id = 'fotky' and (select public.je_admin()));
create policy "fotky: admin nahrává" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotky' and (select public.je_admin()));
create policy "fotky: admin mění"   on storage.objects for update to authenticated
  using (bucket_id = 'fotky' and (select public.je_admin()))
  with check (bucket_id = 'fotky' and (select public.je_admin()));
create policy "fotky: admin maže"   on storage.objects for delete to authenticated
  using (bucket_id = 'fotky' and (select public.je_admin()));

-- ---------------------------------------------------------------------
-- 2. Ochrana mazání
-- ---------------------------------------------------------------------

create function public.pred_smazanim_vyrobku()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.polozky_objednavky where produkt_id = old.id) then
    raise exception 'vyrobek_v_objednavce'
      using hint = 'Výrobek je v nějaké objednávce, proto ho nejde smazat. Můžete ho skrýt z webu.';
  end if;
  return old;
end;
$$;
create trigger produkty_pred_smazanim before delete on public.produkty
  for each row execute function public.pred_smazanim_vyrobku();

create function public.pred_smazanim_barvy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v text;
begin
  select string_agg(distinct p.nazev, ', ' order by p.nazev) into v
    from public.produkty p
   where exists (select 1 from public.produkt_barvy x where x.produkt_id = p.id and x.barva_id = old.id)
      or exists (select 1 from public.moznost_barvy x join public.moznosti m on m.id = x.moznost_id where m.produkt_id = p.id and x.barva_id = old.id)
      or exists (select 1 from public.sada_kus_barvy x join public.sada_kusy k on k.id = x.kus_id where k.produkt_id = p.id and x.barva_id = old.id)
      or exists (select 1 from public.fotky x where x.produkt_id = p.id and x.barva_id = old.id)
      or exists (select 1 from public.zasoby x where x.produkt_id = p.id and x.barva_id = old.id and x.pocet > 0);
  if v is not null then
    raise exception 'barva_se_pouziva'
      using hint = format('Barvu „%s“ používají výrobky: %s. Nejdřív ji u nich odeberte.', old.nazev, v);
  end if;
  return old;
end;
$$;
create trigger barvy_pred_smazanim before delete on public.barvy
  for each row execute function public.pred_smazanim_barvy();

create function public.pred_smazanim_kategorie()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v text;
begin
  select string_agg(p.nazev, ', ' order by p.nazev) into v
    from public.produkt_kategorie x join public.produkty p on p.id = x.produkt_id
   where x.kategorie_id = old.id;
  if v is not null then
    raise exception 'kategorie_se_pouziva'
      using hint = format('Kategorii „%s“ používají výrobky: %s. Nejdřív je přesuňte do jiné kategorie.', old.nazev, v);
  end if;
  return old;
end;
$$;
create trigger kategorie_pred_smazanim before delete on public.kategorie
  for each row execute function public.pred_smazanim_kategorie();

revoke execute on function public.pred_smazanim_vyrobku(), public.pred_smazanim_barvy(), public.pred_smazanim_kategorie()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Uložení celého výrobku
-- ---------------------------------------------------------------------

-- Id z názvu: „Had trnitý se stromem“ → „had-trnity-se-stromem“ (při shodě -2, -3…).
create function public.nove_id_vyrobku(p_nazev text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  zaklad text := trim(both '-' from regexp_replace(
                   translate(lower(coalesce(p_nazev, '')), 'áäčďéěëíľĺňóöôřŕšťúůüýž', 'aacdeeeillnooorrstuuuyz'),
                   '[^a-z0-9]+', '-', 'g'));
  v text;
  n integer := 1;
begin
  if zaklad = '' then zaklad := 'vyrobek'; end if;
  zaklad := left(zaklad, 60);
  v := zaklad;
  while exists (select 1 from public.produkty where id = v) loop
    n := n + 1;
    v := zaklad || '-' || n;
  end loop;
  return v;
end;
$$;

-- Vstup (JSON):
-- { "id": "liska" | null (nový),
--   "nazev", "popis", "material", "rozmery", "doba_vyroby", "autor",
--   "rucne_malovano", "doporuceny", "aktivni", "poradi",
--   "pece": ["ohebne"], "kategorie": [1, 5], "barvy": [5, 12, 2]   (pořadí = pořadí na webu),
--   "cena": 150                        (jen bez velikostí/variant),
--   "typ_moznosti": "velikost" | "varianta",
--   "moznosti": [ { "id": 7 | null, "klic": "m1", "nazev": "S", "cena": 150, "aktivni": true,
--                   "barvy": [1],                         (omezení barev u varianty; prázdné = všechny)
--                   "sada": null | { "stejne": 3 } | { "kusy": [ { "nazev": "S", "barvy": [] }, … ] } } ],
--   "sada": null | { … }               (sada celého výrobku, např. podtácky + miska),
--   "fotky": [ { "id": 3 | null, "url": "obrazky/x.jpg", "barva_id": 5 | null, "moznost_klic": "m1" | null } ]
--                                      (pořadí = pořadí na webu, první je hlavní) }
-- Vrací id výrobku.
create function public.uloz_vyrobek(v jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id       text := nullif(trim(coalesce(v ->> 'id', '')), '');
  v_nazev    text := trim(coalesce(v ->> 'nazev', ''));
  v_moznosti jsonb := coalesce(v -> 'moznosti', '[]');
  v_barvy    integer[];
  v_klice    jsonb := '{}';   -- klíč možnosti → id
  m          jsonb;
  f          jsonb;
  k          jsonb;
  v_mid      integer;
  v_kid      integer;
  i          integer;
  v_sada     jsonb;
  v_vlastnik integer;
begin
  if not public.je_admin() then
    raise exception 'jen_admin' using hint = 'Přihlaste se prosím jako admin s dvoufázovým ověřením.';
  end if;
  if v_nazev = '' or length(v_nazev) > 120 then
    raise exception 'neplatny_vyrobek' using hint = 'Vyplňte název výrobku (nejvýš 120 znaků).';
  end if;
  if jsonb_array_length(coalesce(v -> 'kategorie', '[]')) = 0 then
    raise exception 'neplatny_vyrobek' using hint = 'Vyberte aspoň jednu kategorii.';
  end if;
  if jsonb_array_length(v_moznosti) = 0 and (v ->> 'cena') is null then
    raise exception 'neplatny_vyrobek' using hint = 'Zadejte cenu, nebo přidejte velikosti či varianty s cenou.';
  end if;
  select coalesce(array_agg(x::integer), '{}') into v_barvy from jsonb_array_elements_text(coalesce(v -> 'barvy', '[]')) x;

  -- Výrobek
  if v_id is null then
    v_id := public.nove_id_vyrobku(v_nazev);
    insert into public.produkty (id, nazev) values (v_id, v_nazev);
  elsif not exists (select 1 from public.produkty where id = v_id) then
    raise exception 'nenalezeno' using hint = 'Výrobek mezitím někdo smazal.';
  end if;
  update public.produkty set
    nazev            = v_nazev,
    popis            = coalesce(v ->> 'popis', ''),
    material         = coalesce(nullif(trim(v ->> 'material'), ''), 'PLA'),
    rozmery          = trim(coalesce(v ->> 'rozmery', '')),
    doba_vyroby      = trim(coalesce(v ->> 'doba_vyroby', '')),
    autor            = trim(coalesce(v ->> 'autor', '')),
    pece             = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v -> 'pece', '[]')) x), '{}'),
    rucne_malovano   = coalesce((v ->> 'rucne_malovano')::boolean, false),
    doporuceny       = coalesce((v ->> 'doporuceny')::boolean, false),
    aktivni          = coalesce((v ->> 'aktivni')::boolean, true),
    poradi           = coalesce((v ->> 'poradi')::integer, (select coalesce(max(poradi), 0) + 1 from public.produkty)),
    cena             = case when jsonb_array_length(v_moznosti) = 0 then (v ->> 'cena')::integer end,
    typ_moznosti     = case when v ->> 'typ_moznosti' = 'varianta' then 'varianta' else 'velikost' end,
    sada_stejne_kusy = coalesce((v -> 'sada' ->> 'stejne') is not null, false),
    upraveno         = now()
  where id = v_id;

  -- Kategorie
  delete from public.produkt_kategorie where produkt_id = v_id;
  insert into public.produkt_kategorie (produkt_id, kategorie_id)
    select distinct v_id, x::integer from jsonb_array_elements_text(v -> 'kategorie') x;

  -- Barvy (ruční „vyprodáno“ u ponechaných barev zůstává)
  delete from public.produkt_barvy where produkt_id = v_id and not (barva_id = any (v_barvy));
  for i in 1 .. coalesce(array_length(v_barvy, 1), 0) loop
    insert into public.produkt_barvy (produkt_id, barva_id, poradi) values (v_id, v_barvy[i], i - 1)
    on conflict (produkt_id, barva_id) do update set poradi = excluded.poradi;
  end loop;

  -- Velikosti / varianty: ponechané podle id (objednávky na ně odkazují), nové se přidají, ostatní smažou.
  -- Fotky se od variant nejdřív odpojí, jinak by je smazání varianty smazalo s sebou (přiřazení se nastaví níže).
  update public.fotky set moznost_id = null where produkt_id = v_id;
  delete from public.moznosti
   where produkt_id = v_id
     and id not in (select (x ->> 'id')::integer from jsonb_array_elements(v_moznosti) x where (x ->> 'id') is not null);
  -- Dočasné názvy, aby šlo názvy prohodit (S ↔ M) bez kolize unikátního názvu.
  update public.moznosti set nazev = '~' || id where produkt_id = v_id;
  i := 0;
  for m in select value from jsonb_array_elements(v_moznosti) loop
    if trim(coalesce(m ->> 'nazev', '')) = '' or (m ->> 'cena') is null then
      raise exception 'neplatny_vyrobek' using hint = 'Každá velikost/varianta musí mít název a cenu.';
    end if;
    v_mid := null;
    if (m ->> 'id') is not null then
      update public.moznosti set nazev = trim(m ->> 'nazev'), cena = (m ->> 'cena')::integer, poradi = i,
             aktivni = coalesce((m ->> 'aktivni')::boolean, true), sada_stejne_kusy = (m -> 'sada' ->> 'stejne') is not null
       where id = (m ->> 'id')::integer and produkt_id = v_id
      returning id into v_mid;
      if v_mid is null then
        raise exception 'neplatny_vyrobek' using hint = 'Velikost/varianta mezitím zmizela. Načtěte prosím výrobek znovu.';
      end if;
    else
      insert into public.moznosti (produkt_id, nazev, cena, poradi, aktivni, sada_stejne_kusy)
      values (v_id, trim(m ->> 'nazev'), (m ->> 'cena')::integer, i, coalesce((m ->> 'aktivni')::boolean, true),
              (m -> 'sada' ->> 'stejne') is not null)
      returning id into v_mid;
    end if;
    v_klice := v_klice || jsonb_build_object(coalesce(m ->> 'klic', m ->> 'id'), v_mid);
    delete from public.moznost_barvy where moznost_id = v_mid;
    insert into public.moznost_barvy (moznost_id, barva_id)
      select distinct v_mid, x::integer from jsonb_array_elements_text(coalesce(m -> 'barvy', '[]')) x
       where x::integer = any (v_barvy);
    i := i + 1;
  end loop;

  -- Sady: smazat a založit znovu (sada celého výrobku + sady u velikostí/variant)
  delete from public.sada_kusy where produkt_id = v_id;
  for v_sada, v_vlastnik in
    select v -> 'sada', null::integer
    union all
    select x -> 'sada', (v_klice ->> coalesce(x ->> 'klic', x ->> 'id'))::integer from jsonb_array_elements(v_moznosti) x
  loop
    continue when v_sada is null or jsonb_typeof(v_sada) <> 'object';
    if (v_sada ->> 'stejne') is not null then
      if (v_sada ->> 'stejne')::integer not between 2 and 20 then
        raise exception 'neplatny_vyrobek' using hint = 'Sada stejných kusů musí mít 2 až 20 kusů.';
      end if;
      for i in 1 .. (v_sada ->> 'stejne')::integer loop
        insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values (v_id, v_vlastnik, i - 1, i || '. kus');
      end loop;
    else
      i := 0;
      for k in select value from jsonb_array_elements(coalesce(v_sada -> 'kusy', '[]')) loop
        if trim(coalesce(k ->> 'nazev', '')) = '' then
          raise exception 'neplatny_vyrobek' using hint = 'Každý kus sady musí mít název.';
        end if;
        insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values (v_id, v_vlastnik, i, trim(k ->> 'nazev'))
        returning id into v_kid;
        insert into public.sada_kus_barvy (kus_id, barva_id)
          select distinct v_kid, x::integer from jsonb_array_elements_text(coalesce(k -> 'barvy', '[]')) x;
        i := i + 1;
      end loop;
    end if;
  end loop;

  -- Fotky: ponechané podle id, nové přidat, ostatní smazat. Pořadí = pořadí v seznamu.
  delete from public.fotky
   where produkt_id = v_id
     and id not in (select (x ->> 'id')::integer from jsonb_array_elements(coalesce(v -> 'fotky', '[]')) x where (x ->> 'id') is not null);
  i := 0;
  for f in select value from jsonb_array_elements(coalesce(v -> 'fotky', '[]')) loop
    v_mid := (v_klice ->> (f ->> 'moznost_klic'))::integer;
    if (f ->> 'id') is not null then
      update public.fotky set barva_id = (f ->> 'barva_id')::integer, moznost_id = v_mid, poradi = i
       where id = (f ->> 'id')::integer and produkt_id = v_id;
    else
      insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi)
      values (v_id, (f ->> 'barva_id')::integer, v_mid, f ->> 'url', i);
    end if;
    i := i + 1;
  end loop;

  return v_id;
end;
$$;

revoke execute on function public.nove_id_vyrobku(text), public.uloz_vyrobek(jsonb) from public, anon, authenticated;
grant execute on function public.uloz_vyrobek(jsonb) to authenticated;
grant execute on function public.nove_id_vyrobku(text) to authenticated;

commit;
