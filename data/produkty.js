/*
  ÚDAJE O OBCHODĚ A VÝROBCÍCH
  ---------------------------
  Tento soubor můžete upravit v Poznámkovém bloku. Po uložení stačí v prohlížeči stisknout F5.

  - Text pište vždy do uvozovek "..." a za každou položkou nechte čárku.
  - Fotky dejte do složky "obrazky" a u produktu je uveďte, např. obrazky: ["obrazky/vaza-1.jpg", "obrazky/vaza-2.jpg"].
    Bez fotky se zobrazí barevný zástupný obrázek.
  - Barvy u produktu musí mít stejný název jako v seznamu BARVY níže.
  - doporuceny: true = produkt se ukáže na úvodní stránce.
  - Nové výrobky přidávejte na konec seznamu PRODUKTY – řazení „Od nejnovějšího“ se řídí jejich pořadím.
  - Kategorie výrobku musí být napsaná stejně jako v seznamu KATEGORIE.
    Výrobek může být ve více kategoriích, napište je do hranatých závorek: kategorie: ["Dekorace", "Podzim"],
  - rucneMalovano: true = u produktu se zobrazí štítek „Ručně malováno“ (řádek můžete vynechat = bez štítku).
  - skladem: 3 = kolik hotových kusů máte. Na webu se číslo nezobrazí, jen nedovolí dát do košíku víc kusů.
    skladem: 0 = výrobek nejde objednat (u výrobku se ukáže „Momentálně vyprodáno“).
    Počet pro každou barvu zvlášť: skladem: { "Bílá": 2, "Černá": 1 },  (barva, která tu chybí, je vyprodaná)
    Řádek skladem vynechaný = počet se nehlídá (tisknete na objednávku).
    Po každé objednávce počet sami snižte – web si prodané kusy nepamatuje.
*/

const OBCHOD = {
  nazev: "FILARA",
  // Na tento e-mail chodí objednávky z košíku – nezapomeňte ho přepsat na svůj.
  email: "klaudy@filara.cz",
  telefon: "+420 000 000 000",
  adresa: "Rýznerova 177/10, 252 62 Únětice",   // sídlo i výdejní místo (Salon Clair)
  provozovatel: "Klára a Filip Klaudy, IČO: 00000000",
  // Instagram: jméno účtu bez @, např. instagram: "filara.cz". Prázdné "" = odkaz se nezobrazí.
  instagram: "_filara_print",
};

// Způsoby dopravy nabízené v košíku. adresa: "vydejni-misto" | "dorucovaci" | "zadna"
// Řádky začínající // jsou skryté. Dopravu znovu zapnete smazáním // na začátku řádku.
const DOPRAVA = [
  // { nazev: "Zásilkovna – výdejní místo", cena: 79, adresa: "vydejni-misto" },
  // { nazev: "PPL – doručení na adresu", cena: 129, adresa: "dorucovaci" },
  { nazev: "Osobní odběr (po domluvě)", cena: 0, adresa: "zadna" },
];

const BARVY = [
  { nazev: "Bílá", hex: "#F5F5F4" },
  { nazev: "Černá", hex: "#1C1917" },
  { nazev: "Šedá", hex: "#78716C" },
  { nazev: "Červená", hex: "#DC2626" },
  { nazev: "Oranžová", hex: "#F97316" },
  { nazev: "Žlutá", hex: "#FACC15" },
  { nazev: "Zelená", hex: "#16A34A" },
  { nazev: "Modrá", hex: "#2563EB" },
  { nazev: "Fialová", hex: "#7C3AED" },
  { nazev: "Růžová", hex: "#EC4899" },
];

const KATEGORIE = ["Zvířata", "Dekorace", "Květiny", "Domácnost", "Vánoce", "Podzim", "Hračky", "Klíčenky"];

// Fotky, které se střídají v kruhu na úvodní stránce (nejlépe čtvercové, výrobek uprostřed).
// Když seznam necháte prázdný [], ukáže se místo nich obrázek tiskárny.
const UVODNI_FOTKY = [
  "obrazky/uvod-1.jpg",
  "obrazky/uvod-2.jpg",
  "obrazky/uvod-3.jpg",
  "obrazky/uvod-4.jpg",
  "obrazky/uvod-5.jpg",
];

// Trhy, na kterých prodáváte – ukazují se na úvodní stránce v sekci „Potkejte nás na trzích“.
// Datum pište jako 14. 12. 2026 – trh se po skončení sám skryje. Když je seznam prázdný,
// pruh s trhy se na úvodu vůbec neukáže. Vzor (smažte // na začátku a upravte):
// { datum: "14. 12. 2026", cas: "9–16 h", nazev: "Vánoční trh", misto: "Únětice, náves" },
// Víc dní: datum: "28.–29. 11. 2026". Odkaz na stránku akce (nepovinný): odkaz: "https://...",
const TRHY = [
  {
    datum: "28.–29. 11. 2026",
    cas: "10–18 h",
    nazev: "Vánoční trhy v Únětickém pivovaru",
    misto: "Únětický pivovar (stodola), Rýznerova 19, Únětice",
    odkaz: "https://www.unetickypivovar.cz/akce/vanocni-trhy-v-unetickem-pivovaru",
  },
];

/*
  VZOR NOVÉHO VÝROBKU – zkopírujte část od { po }, (včetně čárky) mezi hranaté závorky
  u PRODUKTY pod tímto rámečkem a upravte údaje. Text za // je jen nápověda, můžete ho smazat.
  Další výrobky přidávejte stejně, každý na konec seznamu.

  {
    id: "liska-na-polici",              // krátký jedinečný název bez mezer a diakritiky
    nazev: "Liška na polici",
    kategorie: "Zvířata",               // Zvířata | Dekorace | Květiny | Domácnost | Vánoce | Podzim | Hračky | Klíčenky
                                        // víc kategorií: ["Zvířata", "Hračky"]
    cena: 350,
    material: "PLA",
    rozmery: "12 × 6 × 8 cm",
    dobaVyroby: "cca 3 pracovní dny",   // nebo "skladem"
    doporuceny: true,                   // true = ukáže se na úvodní stránce
    rucneMalovano: true,                // true = štítek „Ručně malováno“
    skladem: 3,                         // kolik kusů máte hotových (na webu se nezobrazí)
    popis: "Popis výrobku…",
    barvy: ["Bílá", "Černá"],
    obrazky: ["obrazky/liska-1.jpg"],
  },
*/

const PRODUKTY = [
  {
    id: "axolotl",
    nazev: "Axolotl",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: ["Růžová", "Modrá"],
    skladem: { "Růžová": 2, "Modrá": 0 },
    obrazky: [],
  },
  {
    id: "vlk",
    nazev: "Vlk",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    skladem: 0,
    obrazky: [],
  },
  {
    id: "snek",
    nazev: "Šnek",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    skladem: 3,
    obrazky: ["obrazky/snek-1.jpg"],
  },
  {
    id: "jesterka",
    nazev: "Ještěrka",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: ["obrazky/jesterka-1.jpg", "obrazky/jesterka-2.jpg"],
  },
  {
    id: "had",
    nazev: "Had",
    kategorie: ["Zvířata", "Hračky"],
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "liska",
    nazev: "Liška",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "hrib",
    nazev: "Hřib",
    kategorie: ["Dekorace", "Podzim"],
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: ["obrazky/hrib-1.jpg"],
  },
  {
    id: "zalud",
    nazev: "Žalud",
    kategorie: ["Dekorace", "Podzim"],
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "dyne",
    nazev: "Dýně",
    kategorie: ["Dekorace", "Podzim"],
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "svicen",
    nazev: "Svícen",
    kategorie: "Dekorace",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "vaza",
    nazev: "Váza",
    kategorie: "Dekorace",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "kvetinac",
    nazev: "Květináč",
    kategorie: "Květiny",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "mak",
    nazev: "Mák",
    kategorie: "Květiny",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "tulipan",
    nazev: "Tulipán",
    kategorie: "Květiny",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "ruze",
    nazev: "Růže",
    kategorie: "Květiny",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "kaktus",
    nazev: "Kaktus",
    kategorie: "Květiny",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "miska-na-pistacie",
    nazev: "Miska na pistácie",
    kategorie: "Domácnost",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "podtacky",
    nazev: "Podtácky",
    kategorie: "Domácnost",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "chameleon",
    nazev: "Chameleon",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "sova",
    nazev: "Sova",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "zralok",
    nazev: "Žralok",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "chobotnice",
    nazev: "Chobotnice",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "lenochod",
    nazev: "Lenochod",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "vejce",
    nazev: "Vejce",
    kategorie: "Hračky",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "duch",
    nazev: "Duch",
    kategorie: "Hračky",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "kostlivec",
    nazev: "Kostlivec",
    kategorie: "Hračky",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "drak",
    nazev: "Drak",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: ["obrazky/drak-1.jpg"],
  },
  {
    id: "snehova-vlocka",
    nazev: "Sněhová vločka",
    kategorie: "Vánoce",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "srdce",
    nazev: "Srdce",
    kategorie: "Klíčenky",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
];
