/*
  ÚDAJE O OBCHODĚ A VÝROBCÍCH
  ---------------------------
  Tento soubor můžete upravit v Poznámkovém bloku. Po uložení stačí v prohlížeči stisknout F5.

  - Text pište vždy do uvozovek "..." a za každou položkou nechte čárku.
  - Fotky dejte do složky "obrazky" a u produktu je uveďte, např. obrazky: ["obrazky/vaza-1.jpg", "obrazky/vaza-2.jpg"].
    Bez fotky se zobrazí barevný zástupný obrázek.
  - Barvy u produktu musí mít stejný název jako v seznamu BARVY níže.
  - doporuceny: true = produkt se ukáže na úvodní stránce.
*/

const OBCHOD = {
  nazev: "Tiskárna u nás",
  email: "info@example.cz",
  telefon: "+420 000 000 000",
  adresa: "Ulice 1, 000 00 Město",
  provozovatel: "Jméno Příjmení, IČO: 00000000",
};

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

const KATEGORIE = ["Dekorace", "Do domácnosti", "Hračky", "Na zakázku"];

const PRODUKTY = [
  {
    id: "geometricka-vaza",
    nazev: "Geometrická váza Voronoi",
    kategorie: "Dekorace",
    cena: 590,
    material: "PLA",
    rozmery: "12 × 12 × 22 cm",
    dobaVyroby: "cca 4 pracovní dny",
    doporuceny: true,
    popis:
      "Elegantní váza s organickým vzorem Voronoi. Vhodná pro sušené květiny, se skleněnou vložkou i pro živé. Každý kus tiskneme až po objednání.",
    barvy: ["Bílá", "Černá", "Zelená", "Růžová"],
    obrazky: [],
  },
  {
    id: "kvetinac",
    nazev: "Květináč s podmiskou",
    kategorie: "Do domácnosti",
    cena: 349,
    material: "PETG",
    rozmery: "Ø 10 cm",
    dobaVyroby: "cca 3 pracovní dny",
    doporuceny: true,
    popis:
      "Minimalistický květináč z voděodolného PETG s odtokovým otvorem a podmiskou. Ideální pro sukulenty a bylinky na parapet.",
    barvy: ["Bílá", "Šedá", "Zelená", "Oranžová"],
    obrazky: [],
  },
  {
    id: "organizer",
    nazev: "Organizér na stůl",
    kategorie: "Do domácnosti",
    cena: 420,
    material: "PLA",
    rozmery: "20 × 10 × 9 cm",
    dobaVyroby: "cca 3 pracovní dny",
    doporuceny: false,
    popis: "Praktický organizér na tužky, nůžky, telefon a drobnosti. Pět přihrádek a stojánek na mobil.",
    barvy: ["Bílá", "Černá", "Modrá", "Šedá"],
    obrazky: [],
  },
  {
    id: "ohebny-drak",
    nazev: "Ohebný drak",
    kategorie: "Hračky",
    cena: 290,
    material: "PLA",
    rozmery: "délka 30 cm",
    dobaVyroby: "skladem",
    doporuceny: true,
    popis:
      "Kloubový drak tištěný vcelku – žádné lepení, hned se hýbe. Oblíbená hračka i dárek. Pro děti od 3 let.",
    barvy: ["Červená", "Zelená", "Fialová", "Modrá", "Oranžová"],
    obrazky: [],
  },
  {
    id: "klicenka-se-jmenem",
    nazev: "Klíčenka se jménem",
    kategorie: "Na zakázku",
    cena: 120,
    material: "PLA",
    rozmery: "cca 6 × 2 cm",
    dobaVyroby: "cca 2 pracovní dny",
    doporuceny: true,
    popis:
      "Personalizovaná klíčenka s vaším jménem nebo krátkým textem (max. 12 znaků). Napište nám, jaký text chcete.",
    barvy: ["Bílá", "Černá", "Červená", "Modrá", "Růžová", "Žlutá"],
    obrazky: [],
  },
  {
    id: "stojanek-na-sluchatka",
    nazev: "Stojánek na sluchátka",
    kategorie: "Do domácnosti",
    cena: 390,
    material: "PETG",
    rozmery: "26 cm výška",
    dobaVyroby: "cca 3 pracovní dny",
    doporuceny: false,
    popis: "Stabilní stojan na sluchátka s protiskluzovou základnou. Udělá pořádek na herním i pracovním stole.",
    barvy: ["Černá", "Šedá", "Bílá"],
    obrazky: [],
  },
  {
    id: "vanocni-ozdoby",
    nazev: "Vánoční ozdoby – sada 6 ks",
    kategorie: "Dekorace",
    cena: 260,
    material: "PLA",
    rozmery: "Ø 6 cm",
    dobaVyroby: "cca 3 pracovní dny",
    doporuceny: false,
    popis:
      "Sada šesti lehkých ozdob s jemným krajkovým vzorem. Nerozbitné, takže se nemusíte bát dětí ani koček.",
    barvy: ["Bílá", "Červená", "Zelená", "Žlutá"],
    obrazky: [],
  },
  {
    id: "jmenovka-na-dvere",
    nazev: "Jmenovka na dveře",
    kategorie: "Na zakázku",
    cena: 450,
    material: "PLA",
    rozmery: "25 × 8 cm",
    dobaVyroby: "cca 4 pracovní dny",
    doporuceny: false,
    popis:
      "Dvoubarevná cedulka na dveře dětského pokoje nebo domu. Napište nám text a případně motiv (zvířátko, hvězdička…).",
    barvy: ["Bílá", "Modrá", "Růžová", "Zelená", "Fialová"],
    obrazky: [],
  },
];
