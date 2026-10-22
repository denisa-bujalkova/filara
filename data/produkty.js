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
*/

const OBCHOD = {
  nazev: "FILARA",
  // Na tento e-mail chodí objednávky z košíku – nezapomeňte ho přepsat na svůj.
  email: "klaudy@filara.cz",
  telefon: "+420 000 000 000",
  adresa: "Ulice 1, 000 00 Město",
  provozovatel: "Jméno Příjmení, IČO: 00000000",
};

// Způsoby dopravy nabízené v košíku. adresa: "vydejni-misto" | "dorucovaci" | "zadna"
const DOPRAVA = [
  { nazev: "Zásilkovna – výdejní místo", cena: 79, adresa: "vydejni-misto" },
  { nazev: "PPL – doručení na adresu", cena: 129, adresa: "dorucovaci" },
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
    barvy: [],
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
    obrazky: [],
  },
  {
    id: "jesterka",
    nazev: "Ještěrka",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
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
    obrazky: [],
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
];
