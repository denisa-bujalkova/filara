// Vygeneruje supabase/seed.sql z data/produkty.js (testovací data pro vývojový projekt).
// Spouští se z kořene repa: node supabase/scripts/generuj-seed.mjs data/produkty.js supabase/seed.sql
// Vymyšlené zásoby a ruční „vyprodáno“ jsou níže v ZASOBY a RUCNE_VYPRODANO_*.
import fs from "node:fs";
import vm from "node:vm";

const [, , vstup, vystup] = process.argv;
const kod = fs.readFileSync(vstup, "utf8") + "\n;({ BARVY, KATEGORIE, PRODUKTY })";
const { BARVY, KATEGORIE, PRODUKTY } = vm.runInNewContext(kod, {});

const q = (s) => "'" + String(s ?? "").replace(/'/g, "''") + "'";
const klic = (s) => String(s ?? "").trim().toLocaleLowerCase("cs");
const barvaPodleNazvu = new Map(BARVY.map((b) => [klic(b.nazev), b.nazev]));
const barva = (nazev) => {
  const n = barvaPodleNazvu.get(klic(nazev));
  if (!n) throw new Error("Neznámá barva: " + nazev);
  return `(select id from public.barvy where nazev = ${q(n)})`;
};
const moznost = (pid, nazev) => `(select id from public.moznosti where produkt_id = ${q(pid)} and nazev = ${q(nazev)})`;
const dedent = (t) => String(t || "").split("\n").map((r) => r.trim()).join("\n").trim();
const pole = (a) => "array[" + a.map(q).join(", ") + "]::text[]";

// Vymyšlené zásoby. Klíč = id výrobku. Chybí = režim „bez hlídání zásob“.
//   číslo          → režim 'celkem'
//   { barva: n }   → režim 'po_barvach' (barva, která chybí, má 0 kusů)
const ZASOBY = {
  vlk: 1,                 // TEST: poslední kus – na něm se zkouší, že nejde koupit dvakrát
  snek: 3,
  chameleon: 2,
  zralok: 0,              // vyprodáno podle počtu
  liska: { "Oranžová": 4, "Vínová": 2, "Černá": 1 },   // Béžová chybí = vyprodaná
  hrib: { "Světle hnědá": 6, "Tmavě hnědá": 3 },
  dyne: { "Žlutá": 8, "Oranžová": 5, "Zelená": 2 },
  svicen: { "Béžová": 3, "Oranžová": 0, "Zelená": 1 },
  vaza: { "Béžová": 2, "Tmavě hnědá": 1, "Vínová": 0 },
  podtacky: { "Béžová": 4, "Bílá": 6, "Růžová": 4, "Šedá": 0, "Zelená": 4, "Černá": 2 }, // Černá jen pro misku
  duch: { "Bílá": 10, "Fosforeskující": 4 },
  drak: { "Zelenomodrá": 1, "Modrofialová": 2, "Červená": 0, "Fosforeskující": 1 },
  "snehova-vlocka": { "Bílá": 20, "Zlatá": 7 },
  "ozdoba-spicka": { "Vínová": 9, "Béžová": 3, "Bílá": 6, "Tmavě hnědá": 2, "Zelená se třpytkami": 4 },
  hvezda: { "Bílá": 12, "Zelená se třpytkami": 5, "Červená": 5, "Zlatá": 1 },
  snehulak: { "Béžová": 2, "Červená": 1, "Zelená se třpytkami": 0 },
  "had-trnity": { "Zelená": 2, "Modrozelená": 1, "Oranžovošedivá": 1 },
  "draci-vejce": 2,
};
// Vymyšlené ruční „Momentálně vyprodáno“ (pro vyzkoušení přepínače).
const RUCNE_VYPRODANO_BARVA = [
  { produkt: "dyne", barva: "Zelená", poznamka: "TESTOVACÍ: došel zelený filament", nabidnout: false },
];
const RUCNE_VYPRODANO_PRODUKT = [
  { produkt: "had-kogi", poznamka: "TESTOVACÍ: tiskárna v opravě", nabidnout: true },
];

const out = [];
const w = (s = "") => out.push(s);

w(`-- =====================================================================
-- Filara – TESTOVACÍ data pro vývojový projekt (filara-vyvoj)
--
-- NEPOUŠTĚT NA OSTRÉM PROJEKTU. Zásoby a nastavení jsou vymyšlené.
-- Výrobky, barvy a kategorie jsou převedené z data/produkty.js (stav k 6. 11. 2026)
-- automaticky skriptem supabase/scripts/generuj-seed.mjs, aby se při přepisu nic neztratilo.
-- Soubor neupravujte ručně, změňte skript nebo produkty.js a vygenerujte ho znovu.
-- Pouští se jednou, po migraci 20261106120000_faze2_databaze.sql, na prázdnou databázi.
-- =====================================================================

begin;

do $$
begin
  if exists (select 1 from public.produkty) then
    raise exception 'Databáze už výrobky obsahuje – testovací data se nenahrají podruhé.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Nastavení – VŠECHNY HODNOTY JSOU VYMYŠLENÉ, skutečné doplní Filip.
-- ---------------------------------------------------------------------
insert into public.nastaveni (dny_na_zaplaceni, cena_zasilkovna, cislo_uctu, nazev_prijemce, text_vyroba) values (
  7,                    -- VYMYŠLENÉ: počet dní na zaplacení (skutečný ještě neznáme)
  99,                   -- VYMYŠLENÉ: cena Zásilkovny v Kč (skutečnou zadá Filip)
  '123456789/0000',     -- VYMYŠLENÉ: číslo účtu (kód banky 0000 neexistuje)
  'FILARA',
  'Zvládneme vyrobit a doručit do 3 týdnů'
);
`);

w("-- Barvy (z BARVY)");
w("insert into public.barvy (nazev, hex, poradi) values");
w(BARVY.map((b, i) => `  (${q(b.nazev)}, ${q(b.hex)}, ${i})`).join(",\n") + ";\n");

w("-- Kategorie (z KATEGORIE)");
w("insert into public.kategorie (nazev, poradi) values");
w(KATEGORIE.map((k, i) => `  (${q(k)}, ${i})`).join(",\n") + ";\n");

const varovani = [];
PRODUKTY.forEach((p, i) => {
  const moz = p.varianty || p.velikosti || [];
  const zas = ZASOBY[p.id];
  const rezim = zas === undefined ? "bez_hlidani" : typeof zas === "number" ? "celkem" : "po_barvach";
  const pece = [].concat(p.pece || []);
  const rucne = RUCNE_VYPRODANO_PRODUKT.find((r) => r.produkt === p.id);
  const sadaVyrobku = p.sada;
  const barvy = (p.barvy || []).filter((b) => {
    if (barvaPodleNazvu.has(klic(b))) return true;
    varovani.push(`${p.id}: barva ${b} není v BARVY – vynechána (web ji také nezobrazí)`);
    return false;
  });

  w(`-- ${p.nazev} (${p.id})`);
  w(`insert into public.produkty (id, nazev, popis, material, pece, autor, rozmery, doba_vyroby, doporuceny, rucne_malovano, cena, typ_moznosti, sada_stejne_kusy, rezim_zasob, vyprodano_rucne, vyprodano_poznamka, vyprodano_nabidnout_vyrobu, poradi) values (
  ${q(p.id)}, ${q(p.nazev)}, ${q(dedent(p.popis))}, ${q(p.material || "PLA")}, ${pole(pece)}, ${q(p.autor)}, ${q(p.rozmery)}, ${q(p.dobaVyroby)},
  ${!!p.doporuceny}, ${!!p.rucneMalovano}, ${moz.length ? "null" : Number(p.cena)}, ${q(p.varianty ? "varianta" : "velikost")},
  ${sadaVyrobku !== undefined && !Array.isArray(sadaVyrobku)}, ${q(rezim)}, ${!!rucne}, ${q(rucne?.poznamka)}, ${rucne ? rucne.nabidnout : true}, ${i + 1});`);

  const kat = [].concat(p.kategorie || []);
  if (kat.length)
    w(`insert into public.produkt_kategorie (produkt_id, kategorie_id) select ${q(p.id)}, id from public.kategorie where nazev in (${kat.map(q).join(", ")});`);

  // Barvy výrobku + barvy, které mají jen kusy sady (např. Černá u misky) – ty do produkt_barvy nepatří.
  barvy.forEach((b, j) => {
    const r = RUCNE_VYPRODANO_BARVA.find((x) => x.produkt === p.id && klic(x.barva) === klic(b));
    w(`insert into public.produkt_barvy (produkt_id, barva_id, poradi, vyprodano_rucne, vyprodano_poznamka, vyprodano_nabidnout_vyrobu) values (${q(p.id)}, ${barva(b)}, ${j}, ${!!r}, ${q(r?.poznamka)}, ${r ? r.nabidnout : true});`);
  });

  moz.forEach((m, j) => {
    w(`insert into public.moznosti (produkt_id, nazev, cena, poradi, sada_stejne_kusy) values (${q(p.id)}, ${q(m.nazev)}, ${Number(m.cena)}, ${j}, ${m.sada !== undefined && !Array.isArray(m.sada)});`);
    (m.barvy || []).forEach((b) => w(`insert into public.moznost_barvy (moznost_id, barva_id) values (${moznost(p.id, m.nazev)}, ${barva(b)});`));
  });

  // Kusy sad
  const kusySady = (sada) =>
    Array.isArray(sada) ? sada.map((k) => (typeof k === "string" ? { nazev: k } : k)) : Array.from({ length: Number(sada) || 0 }, (_, n) => ({ nazev: `${n + 1}. kus` }));
  const zapisSadu = (sada, moznostSql) =>
    kusySady(sada).forEach((k, j) => {
      w(`insert into public.sada_kusy (produkt_id, moznost_id, poradi, nazev) values (${q(p.id)}, ${moznostSql}, ${j}, ${q(k.nazev)});`);
      (k.barvy || []).forEach((b) =>
        w(`insert into public.sada_kus_barvy (kus_id, barva_id) values ((select id from public.sada_kusy where produkt_id = ${q(p.id)} and moznost_id is not distinct from ${moznostSql} and poradi = ${j}), ${barva(b)});`));
    });
  if (sadaVyrobku !== undefined) zapisSadu(sadaVyrobku, "null");
  moz.forEach((m) => m.sada !== undefined && zapisSadu(m.sada, moznost(p.id, m.nazev)));

  // Fotky
  const o = p.obrazky;
  if (Array.isArray(o)) o.forEach((url, j) => w(`insert into public.fotky (produkt_id, url, poradi) values (${q(p.id)}, ${q(url)}, ${j});`));
  else if (o)
    for (const [k, urls] of Object.entries(o)) {
      let b = k, v = null;
      if (p.varianty) [b, v] = k.split(/,\s*/);
      [].concat(urls).forEach((url, j) =>
        w(`insert into public.fotky (produkt_id, barva_id, moznost_id, url, poradi) values (${q(p.id)}, ${barva(b)}, ${v ? moznost(p.id, v) : "null"}, ${q(url)}, ${j});`));
    }

  // Zásoby (VYMYŠLENÉ)
  if (rezim === "celkem") w(`insert into public.zasoby (produkt_id, barva_id, pocet) values (${q(p.id)}, null, ${zas}); -- VYMYŠLENÉ`);
  if (rezim === "po_barvach")
    for (const [b, n] of Object.entries(zas)) w(`insert into public.zasoby (produkt_id, barva_id, pocet) values (${q(p.id)}, ${barva(b)}, ${n}); -- VYMYŠLENÉ`);
  w();
});

w("commit;");
fs.writeFileSync(vystup, out.join("\n"));
console.log(`Výrobků: ${PRODUKTY.length}, řádků: ${out.length}`);
varovani.forEach((v) => console.warn("VAROVÁNÍ:", v));
for (const id of Object.keys(ZASOBY)) if (!PRODUKTY.some((p) => p.id === id)) console.warn("VAROVÁNÍ: zásoba pro neznámý výrobek", id);
