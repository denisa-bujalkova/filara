-- =====================================================================
-- Filara – fáze 2, krok 2a: databáze (výrobky, zásoby, objednávky, poptávky, nastavení)
--
-- Pouští se jednou na prázdný projekt Supabase (SQL Editor → vložit → Run).
-- Celý skript běží v jedné transakci: buď projde celý, nebo se neprovede nic.
--
-- Pravidla (viz CLAUDE.md):
--  * RLS je zapnuté na všech tabulkách.
--  * Nepřihlášený (role anon) smí jen ČÍST katalog: výrobky (a jejich barvy, velikosti,
--    fotky, sady, kategorie) a zásoby. Nic jiného.
--  * Objednávky, položky, poptávky, nastavení a seznam adminů čte a mění jen admin:
--    uživatel zapsaný v tabulce admini A přihlášený s dvoufázovým ověřením (aal2).
--  * Objednávka vzniká jen funkcí vytvor_objednavku(): ceny bere z databáze,
--    zásoby kontroluje a odečítá v jedné transakci se zámkem řádků.
--
-- Ceny jsou v celých korunách (integer) – všechny ceny e-shopu jsou celé Kč.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Číselníky: barvy a kategorie
-- ---------------------------------------------------------------------

create table public.barvy (
  id      integer generated always as identity primary key,
  nazev   text not null unique check (length(trim(nazev)) between 1 and 60),
  hex     text not null check (length(hex) <= 1000),   -- #RRGGBB nebo CSS gradient (přelévavé barvy)
  poradi  integer not null default 0
);
comment on table public.barvy is 'Barvy filamentů, ze kterých zákazník vybírá (dříve BARVY v produkty.js).';

create table public.kategorie (
  id      integer generated always as identity primary key,
  nazev   text not null unique check (length(trim(nazev)) between 1 and 60),
  poradi  integer not null default 0
);
comment on table public.kategorie is 'Kategorie výrobků (dříve KATEGORIE v produkty.js).';

-- ---------------------------------------------------------------------
-- Výrobky
-- ---------------------------------------------------------------------

create table public.produkty (
  id                          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),  -- např. "had-trnity" (stejné id jako v košíku)
  nazev                       text not null check (length(trim(nazev)) between 1 and 120),
  popis                       text not null default '',
  material                    text not null default 'PLA',
  pece                        text[] not null default '{}',   -- typy doplňků „Materiál a péče“: ohebne | led | vaza | miska | podtacky | zavesne
  autor                       text not null default '',       -- autor modelu, např. KOGI3D
  rozmery                     text not null default '',
  doba_vyroby                 text not null default '',
  doporuceny                  boolean not null default false, -- ukáže se na úvodní stránce
  rucne_malovano              boolean not null default false, -- štítek „Ručně malováno“
  cena                        integer check (cena >= 0),      -- jen u výrobku BEZ velikostí/variant; jinak null a cena je u možnosti
  typ_moznosti                text not null default 'velikost' check (typ_moznosti in ('velikost', 'varianta')),
  -- Sada na úrovni výrobku (výrobek s jednou cenou a víc díly, např. podtácky + miska):
  -- kusy jsou v tabulce sada_kusy s moznost_id = null.
  sada_stejne_kusy            boolean not null default false, -- true = kusy jsou stejné („2× Vínová“), false = různé díly („Miska: Bílá“)
  -- Zásoby:
  --  'bez_hlidani' = tiskne se na objednávku, počet se nehlídá (dříve: řádek skladem chyběl)
  --  'celkem'      = jeden počet za celý výrobek, sada se počítá jako 1 kus (dříve: skladem: 3)
  --  'po_barvach'  = počet pro každou barvu, sada ubere z každé barvy tolik kusů, kolik jich v ní je
  --                  (dříve: skladem: { "Bílá": 2 }); barva bez řádku v zasoby = vyprodaná
  rezim_zasob                 text not null default 'bez_hlidani' check (rezim_zasob in ('bez_hlidani', 'celkem', 'po_barvach')),
  -- Ruční přepínač „Momentálně vyprodáno“ (nezávislý na počtu kusů, např. došel filament):
  vyprodano_rucne             boolean not null default false,
  vyprodano_poznamka          text not null default '',      -- POZOR: tabulku čte i nepřihlášený, poznámka je tedy veřejná
  vyprodano_nabidnout_vyrobu  boolean not null default true,  -- nabídnout u pozastaveného výrobku „Objednat do výroby“?
  aktivni                     boolean not null default true,  -- false = na webu se nezobrazí (rozpracovaný výrobek)
  poradi                      integer not null default 0,     -- vyšší = novější (řazení „Od nejnovějšího“)
  vytvoreno                   timestamptz not null default now(),
  upraveno                    timestamptz not null default now()
);
comment on table public.produkty is 'Výrobky (dříve PRODUKTY v produkty.js).';

create table public.produkt_kategorie (
  produkt_id    text    not null references public.produkty (id) on delete cascade,
  kategorie_id  integer not null references public.kategorie (id) on delete cascade,
  primary key (produkt_id, kategorie_id)
);
create index on public.produkt_kategorie (kategorie_id);

-- Barvy, ve kterých se výrobek prodává. Prázdné = výrobek nemá volbu barvy.
create table public.produkt_barvy (
  produkt_id                  text    not null references public.produkty (id) on delete cascade,
  barva_id                    integer not null references public.barvy (id) on delete restrict,
  poradi                      integer not null default 0,
  -- Ruční „Momentálně vyprodáno“ jen pro tuto barvu:
  vyprodano_rucne             boolean not null default false,
  vyprodano_poznamka          text not null default '',      -- veřejná, viz produkty.vyprodano_poznamka
  vyprodano_nabidnout_vyrobu  boolean not null default true,
  primary key (produkt_id, barva_id)
);
create index on public.produkt_barvy (barva_id);

-- Velikosti nebo varianty s vlastní cenou (dříve velikosti: [...] / varianty: [...]).
create table public.moznosti (
  id                integer generated always as identity primary key,
  produkt_id        text    not null references public.produkty (id) on delete cascade,
  nazev             text    not null check (length(trim(nazev)) between 1 and 80),
  cena              integer not null check (cena >= 0),
  poradi            integer not null default 0,
  aktivni           boolean not null default true,   -- false = skrytá (dříve zakomentovaný řádek)
  sada_stejne_kusy  boolean not null default false,  -- u sady: true = „Sada 3 ks S“ (kusy stejné), false = „Sada S, M, L“
  unique (produkt_id, nazev),
  unique (id, produkt_id)                            -- pro cizí klíče, které hlídají, že možnost patří k výrobku
);

-- Barvy dostupné jen v určité variantě (dříve barvy: ["Bílá"] u varianty).
-- Žádný řádek pro možnost = všechny barvy výrobku.
create table public.moznost_barvy (
  moznost_id  integer not null references public.moznosti (id) on delete cascade,
  barva_id    integer not null references public.barvy (id) on delete cascade,
  primary key (moznost_id, barva_id)
);

-- Kusy sady, u kterých si zákazník volí barvu každého kusu.
--  moznost_id vyplněné = sada patří k velikosti/variantě (např. „Sada 3 ks (S, M, L)“)
--  moznost_id null     = sada patří k celému výrobku (např. podtácky + miska)
create table public.sada_kusy (
  id          integer generated always as identity primary key,
  produkt_id  text    not null references public.produkty (id) on delete cascade,
  moznost_id  integer,
  poradi      integer not null default 0,
  nazev       text    not null check (length(trim(nazev)) between 1 and 80),  -- „S“, „1. kus“, „Miska“…
  foreign key (moznost_id, produkt_id) references public.moznosti (id, produkt_id) on delete cascade
);
create index on public.sada_kusy (produkt_id, moznost_id);

-- Kus sady s vlastním výběrem barev (dříve { nazev: "Miska", barvy: [...] }).
-- Žádný řádek pro kus = všechny barvy výrobku.
create table public.sada_kus_barvy (
  kus_id    integer not null references public.sada_kusy (id) on delete cascade,
  barva_id  integer not null references public.barvy (id) on delete cascade,
  primary key (kus_id, barva_id)
);

-- Fotky. barva_id/moznost_id null = fotka pro všechny barvy / všechny varianty.
--  jen produkt         → obrazky: ["a.jpg"]
--  produkt + barva     → obrazky: { "Modrá": ["a.jpg"] }
--  produkt + barva + varianta → obrazky: { "Bílá, Varianta 1": ["a.jpg"] }
create table public.fotky (
  id          integer generated always as identity primary key,
  produkt_id  text    not null references public.produkty (id) on delete cascade,
  barva_id    integer references public.barvy (id) on delete cascade,
  moznost_id  integer,
  url         text    not null check (length(url) between 1 and 500),
  poradi      integer not null default 0,
  foreign key (moznost_id, produkt_id) references public.moznosti (id, produkt_id) on delete cascade
);
create index on public.fotky (produkt_id);

-- Zásoby. Režim 'celkem': jeden řádek s barva_id = null. Režim 'po_barvach': řádek pro každou barvu.
create table public.zasoby (
  produkt_id  text    not null references public.produkty (id) on delete cascade,
  barva_id    integer references public.barvy (id) on delete cascade,
  pocet       integer not null default 0 check (pocet >= 0),
  upraveno    timestamptz not null default now()
);
create unique index zasoby_produkt_barva on public.zasoby (produkt_id, barva_id) nulls not distinct;

-- ---------------------------------------------------------------------
-- Nastavení (jeden řádek)
-- ---------------------------------------------------------------------

create table public.nastaveni (
  id                 boolean primary key default true check (id),   -- vždy jen jeden řádek
  dny_na_zaplaceni   integer not null check (dny_na_zaplaceni between 1 and 60),
  cena_zasilkovna    integer not null check (cena_zasilkovna >= 0),
  cislo_uctu         text    not null,                               -- např. 123456789/3030
  nazev_prijemce     text    not null default 'FILARA',
  text_vyroba        text    not null default 'Zvládneme vyrobit a doručit do 3 týdnů',
  upraveno           timestamptz not null default now()
);
comment on table public.nastaveni is 'Nastavení e-shopu. Čte a mění jen admin; web dostane veřejné hodnoty přes verejne_nastaveni().';

-- ---------------------------------------------------------------------
-- Objednávky
-- ---------------------------------------------------------------------

create type public.stav_objednavky as enum ('nova', 'zaplacena', 've_vyrobe', 'odeslana', 'vyrizena', 'zrusena');

-- Číslo objednávky = variabilní symbol: kladné celé číslo, nejvýš 10 číslic.
create sequence public.objednavky_cislo_seq as bigint start with 100001 minvalue 1 maxvalue 9999999999 no cycle;

create table public.objednavky (
  cislo               bigint primary key default nextval('public.objednavky_cislo_seq')
                        check (cislo between 1 and 9999999999),
  stav                public.stav_objednavky not null default 'nova',
  vytvoreno           timestamptz not null default now(),
  splatnost           timestamptz not null,           -- do kdy zaplatit; admin ji může prodloužit
  zaplaceno           timestamptz,
  -- Zákazník (bez registrace; user_id se vyplní až ve fázi 3 u přihlášených)
  user_id             uuid references auth.users (id) on delete set null,
  jmeno               text not null check (length(trim(jmeno)) between 1 and 120),
  email               text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  telefon             text not null default '' check (length(telefon) <= 30),
  -- Doprava (kopie v okamžiku nákupu)
  doprava             text not null check (doprava in ('osobni', 'zasilkovna')),
  doprava_nazev       text not null,
  doprava_cena        integer not null check (doprava_cena >= 0),
  zasilkovna_id       text not null default '' check (length(zasilkovna_id) <= 50),   -- id výdejního místa z widgetu
  zasilkovna_nazev    text not null default '' check (length(zasilkovna_nazev) <= 300),
  -- Ceny (kopie v okamžiku nákupu)
  cena_zbozi          integer not null check (cena_zbozi >= 0),
  cena_celkem         integer not null check (cena_celkem >= 0),
  cislo_uctu          text not null,                   -- kam má zákazník platit (kopie z nastavení)
  poznamka_zakaznika  text not null default '' check (length(poznamka_zakaznika) <= 1000),
  poznamka_admin      text not null default '',
  -- Co se při vzniku odečetlo ze zásob: [{"produkt_id": "...", "barva_id": 3 | null, "pocet": 2}]
  -- Podle toho se při zrušení vrátí přesně stejné kusy, i když se mezitím výrobek změnil.
  odecteno_zasob      jsonb not null default '[]',
  zasoby_vraceny      boolean not null default false
);
create index on public.objednavky (stav, vytvoreno);

create table public.polozky_objednavky (
  id               bigint generated always as identity primary key,
  cislo            bigint  not null references public.objednavky (cislo) on delete cascade,
  poradi           integer not null default 0,
  -- Odkazy na katalog (po smazání výrobku zůstanou null, kopie níže zůstanou)
  produkt_id       text    references public.produkty (id) on delete set null,
  moznost_id       integer references public.moznosti (id) on delete set null,
  barva_id         integer references public.barvy (id) on delete set null,
  -- Kopie v okamžiku nákupu – pozdější změna výrobku je nepřepíše
  nazev_produktu   text    not null,
  typ_moznosti     text    not null default '',   -- 'Velikost' / 'Varianta' / ''
  nazev_moznosti   text    not null default '',
  nazev_barvy      text    not null default '',
  sada             jsonb   not null default '[]', -- [{"kus": "S", "barva": "Bílá", "barva_id": 1}, …]
  poznamka         text    not null default '' check (length(poznamka) <= 500),
  cena_za_kus      integer not null check (cena_za_kus >= 0),
  pocet            integer not null check (pocet between 1 and 99),
  cena_celkem      integer generated always as (cena_za_kus * pocet) stored
);
create index on public.polozky_objednavky (cislo);
create index on public.polozky_objednavky (produkt_id);

-- ---------------------------------------------------------------------
-- Poptávky z kontaktního formuláře („Objednat do výroby“ apod.)
-- ---------------------------------------------------------------------

create table public.poptavky (
  id              bigint generated always as identity primary key,
  vytvoreno       timestamptz not null default now(),
  jmeno           text not null check (length(trim(jmeno)) between 1 and 120),
  email           text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  telefon         text not null default '' check (length(telefon) <= 30),
  zprava          text not null check (length(zprava) between 1 and 3000),
  produkt_id      text references public.produkty (id) on delete set null,
  nazev_produktu  text not null default '',       -- kopie (výrobek se může smazat)
  vyrizeno        boolean not null default false,
  poznamka_admin  text not null default ''
);

-- ---------------------------------------------------------------------
-- Admini a kontrola oprávnění
-- ---------------------------------------------------------------------

-- Admina přidá Filip ručně v SQL Editoru (viz návod). Přes API se sem zapsat nedá.
create table public.admini (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  jmeno    text not null default ''
);

-- true jen pro admina přihlášeného s dvoufázovým ověřením (aal2).
-- security definer: čte tabulku admini mimo RLS; volající si ji sám přečíst nemusí.
create function public.je_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.admini a where a.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Práva: nejdřív všem všechno vzít, pak povolit jen to potřebné
-- (Supabase standardně dává rolím anon a authenticated plná práva na nové tabulky.)
-- ---------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on function public.je_admin() from public, anon, authenticated;
grant execute on function public.je_admin() to anon, authenticated;

-- Katalog a zásoby: číst smí každý, měnit jen admin (přes RLS níže).
grant select on public.barvy, public.kategorie, public.produkty, public.produkt_kategorie,
                public.produkt_barvy, public.moznosti, public.moznost_barvy, public.sada_kusy,
                public.sada_kus_barvy, public.fotky, public.zasoby
  to anon, authenticated;
grant insert, update, delete on public.barvy, public.kategorie, public.produkty, public.produkt_kategorie,
                public.produkt_barvy, public.moznosti, public.moznost_barvy, public.sada_kusy,
                public.sada_kus_barvy, public.fotky, public.zasoby
  to authenticated;

-- Citlivé tabulky: role anon nemá vůbec žádné právo (dotaz skončí chybou „permission denied“).
-- Přihlášený uživatel má práva, ale RLS je pustí jen adminovi s aal2.
grant select, update, delete on public.objednavky, public.polozky_objednavky, public.poptavky to authenticated;
grant select, update on public.nastaveni to authenticated;
grant select on public.admini to authenticated;
-- Objednávky nevznikají přímým INSERTem, jen funkcí vytvor_objednavku().

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.barvy              enable row level security;
alter table public.kategorie          enable row level security;
alter table public.produkty           enable row level security;
alter table public.produkt_kategorie  enable row level security;
alter table public.produkt_barvy      enable row level security;
alter table public.moznosti           enable row level security;
alter table public.moznost_barvy      enable row level security;
alter table public.sada_kusy          enable row level security;
alter table public.sada_kus_barvy     enable row level security;
alter table public.fotky              enable row level security;
alter table public.zasoby             enable row level security;
alter table public.nastaveni          enable row level security;
alter table public.objednavky         enable row level security;
alter table public.polozky_objednavky enable row level security;
alter table public.poptavky           enable row level security;
alter table public.admini             enable row level security;

-- Číselníky: číst všichni, měnit admin.
create policy "cist vsichni" on public.barvy for select to anon, authenticated using (true);
create policy "admin meni"   on public.barvy for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

create policy "cist vsichni" on public.kategorie for select to anon, authenticated using (true);
create policy "admin meni"   on public.kategorie for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

-- Výrobky: nepřihlášený vidí jen aktivní, admin všechny.
create policy "cist aktivni" on public.produkty for select to anon, authenticated
  using (aktivni or (select public.je_admin()));
create policy "admin meni"   on public.produkty for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

-- Tabulky navázané na výrobek: vidět jen u aktivního výrobku (RLS na produkty se uplatní i v poddotazu).
create policy "cist u aktivnich" on public.produkt_kategorie for select to anon, authenticated
  using (exists (select 1 from public.produkty p where p.id = produkt_id));
create policy "admin meni" on public.produkt_kategorie for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

create policy "cist u aktivnich" on public.produkt_barvy for select to anon, authenticated
  using (exists (select 1 from public.produkty p where p.id = produkt_id));
create policy "admin meni" on public.produkt_barvy for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

create policy "cist u aktivnich" on public.moznosti for select to anon, authenticated
  using (exists (select 1 from public.produkty p where p.id = produkt_id));
create policy "admin meni" on public.moznosti for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

create policy "cist u aktivnich" on public.moznost_barvy for select to anon, authenticated
  using (exists (select 1 from public.moznosti m where m.id = moznost_id));
create policy "admin meni" on public.moznost_barvy for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

create policy "cist u aktivnich" on public.sada_kusy for select to anon, authenticated
  using (exists (select 1 from public.produkty p where p.id = produkt_id));
create policy "admin meni" on public.sada_kusy for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

create policy "cist u aktivnich" on public.sada_kus_barvy for select to anon, authenticated
  using (exists (select 1 from public.sada_kusy k where k.id = kus_id));
create policy "admin meni" on public.sada_kus_barvy for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

create policy "cist u aktivnich" on public.fotky for select to anon, authenticated
  using (exists (select 1 from public.produkty p where p.id = produkt_id));
create policy "admin meni" on public.fotky for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

create policy "cist u aktivnich" on public.zasoby for select to anon, authenticated
  using (exists (select 1 from public.produkty p where p.id = produkt_id));
create policy "admin meni" on public.zasoby for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));

-- Citlivé tabulky: jen admin (anon nemá ani GRANT, takže sem vůbec nedosáhne).
create policy "jen admin" on public.nastaveni for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));
create policy "jen admin" on public.objednavky for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));
create policy "jen admin" on public.polozky_objednavky for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));
create policy "jen admin" on public.poptavky for all to authenticated
  using ((select public.je_admin())) with check ((select public.je_admin()));
create policy "jen admin cte" on public.admini for select to authenticated
  using ((select public.je_admin()));

-- ---------------------------------------------------------------------
-- Veřejné hodnoty z nastavení (text „do 3 týdnů“, cena Zásilkovny, dny na zaplacení).
-- Tabulku nastaveni nepřihlášený číst nesmí, tahle funkce vrací jen to, co web potřebuje ukázat.
-- ---------------------------------------------------------------------

create function public.verejne_nastaveni()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'text_vyroba',      n.text_vyroba,
    'cena_zasilkovna',  n.cena_zasilkovna,
    'dny_na_zaplaceni', n.dny_na_zaplaceni
  )
  from public.nastaveni n;
$$;
revoke execute on function public.verejne_nastaveni() from public, anon, authenticated;
grant execute on function public.verejne_nastaveni() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Vytvoření objednávky
--
-- Volá web (i nepřihlášený):  supabase.rpc('vytvor_objednavku', { zakaznik, polozky })
--
-- zakaznik: {
--   "jmeno": "Jana Testovací", "email": "jana@example.com", "telefon": "+420…",
--   "doprava": "osobni" | "zasilkovna",
--   "zasilkovna_id": "1234", "zasilkovna_nazev": "Praha 6, …",   -- jen u zasilkovna
--   "poznamka": "…"
-- }
-- polozky: [
--   { "produkt_id": "liska", "barva_id": 3, "pocet": 1 },
--   { "produkt_id": "hvezda", "moznost_id": 12, "sada_barvy": [1, 7, 7], "pocet": 2 },
--   { "produkt_id": "vlk", "pocet": 1, "poznamka": "…" }
-- ]
-- Ceny ani názvy z prohlížeče se nepoužijí – bere se jen co, v jaké barvě/velikosti a kolik.
--
-- Vrací: { "cislo": 100001, "cena_celkem": 320, "splatnost": "…", "cislo_uctu": "…",
--          "nazev_prijemce": "…", "variabilni_symbol": "100001" }
--
-- Chyby (PostgREST je vrátí jako { code, message, details }):
--   message 'nedostatek_zasob'  details = [{produkt_id, barva_id, nazev, chci, zbyva}, …]
--   message 'vyprodano'         details = {produkt_id, barva_id}  (ruční „Momentálně vyprodáno“)
--   message 'neplatna_objednavka' details = popis, co nesedí
-- Při chybě se neuloží nic a zásoby se nezmění.
--
-- Poslední kus: zásoby se zamknou (SELECT … FOR UPDATE) ve stálém pořadí. Druhý zákazník
-- počká, až první transakce skončí, a pak už vidí nový počet – nedostane kus, který není.
-- ---------------------------------------------------------------------

create function public.vytvor_objednavku(zakaznik jsonb, polozky jsonb)
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
  v_splatnost := now() + make_interval(days => v_nast.dny_na_zaplaceni);
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
