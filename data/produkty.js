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
  - rucneMalovano: true = u produktu se zobrazí štítek „Ručně malováno“ (řádek můžete vynechat = bez štítku).
*/

const OBCHOD = {
  nazev: "FILARA",
  // Na tento e-mail chodí objednávky z košíku – nezapomeňte ho přepsat na svůj.
  email: "info@example.cz",
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

const KATEGORIE = ["Zvířata", "Dekorace", "Květiny", "Domácnost"];

/*
  VZOR NOVÉHO VÝROBKU – zkopírujte část od { po }, (včetně čárky) mezi hranaté závorky
  u PRODUKTY pod tímto rámečkem a upravte údaje. Text za // je jen nápověda, můžete ho smazat.
  Další výrobky přidávejte stejně, každý na konec seznamu.

  {
    id: "liska-na-polici",              // krátký jedinečný název bez mezer a diakritiky
    nazev: "Liška na polici",
    kategorie: "Zvířata",               // Zvířata | Dekorace | Květiny | Domácnost
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
];
