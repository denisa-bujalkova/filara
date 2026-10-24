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
  - Velikosti s vlastní cenou: místo řádku cena napište
      velikosti: [ { nazev: "S", cena: 290 }, { nazev: "M", cena: 390 } ],
    Zákazník si velikost vybere, v nabídce se ukáže „od 290 Kč“.
  - Delší popis pište mezi zpětné uvozovky ` ... ` (pravý Alt + 7), pak může mít víc řádků:
    prázdný řádek = nový odstavec, řádek začínající "- " = odrážka (text před dvojtečkou bude tučně),
    samostatný řádek končící dvojtečkou = mezititulek. Uvnitř popisu nepoužívejte znak `.
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
  email: "filara3dprint@gmail.com",
  telefon: "+420 777 782 749",
  adresa: "Rýznerova 177/10, 252 62 Únětice",   // sídlo i výdejní místo (Salon Clair)
  // Instagram: jméno účtu bez @, např. instagram: "filara.cz". Prázdné "" = odkaz se nezobrazí.
  instagram: "_filara_print",
  // Údaje o provozovateli – ukazují se ve spodní liště a v obchodních podmínkách (texty jsou v podminky.js).
  // Dokud je tu [DOPLNIT …], zobrazí se na webu žlutě.
  provozovatel: "[DOPLNIT: jméno a příjmení podnikatele]",
  ico: "[DOPLNIT: IČO]",
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

const KATEGORIE = ["Zvířata", "Dekorace", "Květiny", "Domácnost", "Vánoce", "Podzim", "Halloween", "Hračky", "Klíčenky"];

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
    kategorie: "Zvířata",               // Zvířata | Dekorace | Květiny | Domácnost | Vánoce | Podzim | Halloween | Hračky | Klíčenky
                                        // víc kategorií: ["Zvířata", "Hračky"]
    cena: 350,                          // nebo velikosti (viz návod nahoře), pak řádek cena vynechte
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
    id: "vlk",
    nazev: "Vlk",
    kategorie: "Zvířata",
    cena: 120,
    material: "PLA",
    popis: `
      3D tištěný flexibilní vlk

      Tento ohebný vlk zaujme na první pohled výraznýma, ručně malovanýma očima, které mu dávají jedinečný výraz.

      Díky pohyblivým kloubům a článkovanému tělu i ocasu je krásně tvárný. Poslouží jako originální dekorace na stůl, zábavná antistresová hračka do ruky i milý dárek.

      - Ruční práce: Oči jsou detailně ručně malované, takže každý kus je neopakovatelný originál.
      - Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů.
      - Materiál: Vyrobeno z biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Pro každého: Zabaví děti a dospělým pomůže odreagovat se u pracovního stolu.

      Péče a údržba:

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte vlka na přímém letním slunci za sklem, v rozpáleném autě ani blízko zdrojů tepla.
      - Pouze do interiéru: Dlouhodobé vystavení dešti a UV záření může materiálu i barvě uškodit.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé části.

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "snek",
    nazev: "Šnek",
    kategorie: "Zvířata",
    cena: 150,
    material: "PLA",
    popis: `
      3D tištěný flexibilní šnek

      Vneste do svého domova trochu přírodní pohody a roztomilosti! Tento 3D tištěný šnek s krásně tvarovanou ulitou a zvědavě vztyčenými tykadly si vás zaručeně získá.

      Díky článkovanému tělu je šnek příjemně ohebný a skvěle padne do ruky. Poslouží jako originální dekorace do pokoje či kanceláře, uklidňující antistresová hračka i skvělý dárek pro milovníky přírody.

      - Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb článků těla a elegantní tvar ulity.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Unikátní detail: Barevné provedení a detaily se mohou u jednotlivých kusů nepatrně lišit, každý kousek je tak originál.
      - Perfektní pro každého: Dospělým pomůže odbourat stres při práci, děti zabaví na dlouhé hodiny.

      Péče a údržba (jak o šneka pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte šneka za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Vhodné pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může způsobit křehnutí materiálu a ztrátu barev.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Přidejte si do života trochu pohodové hravosti — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    skladem: 3,
    obrazky: ["obrazky/snek-1.jpg"],
  },
  {
    id: "had",
    nazev: "Had hladký",
    kategorie: ["Zvířata", "Hračky"],
    velikosti: [
      { nazev: "S", cena: 150 },
      { nazev: "M", cena: 290 },
      { nazev: "L", cena: 390 },
    ],
    material: "PLA",
    popis: `
      3D tištěný flexibilní hladký had

      Přidejte do svého prostoru špetku exotické elegance! Tento trnitý had s výrazně plastickými šupinami po celé délce těla a zářivě modrýma očima je dokonalou ukázkou toho, co dokáže moderní 3D tisk.

      Díky velkému množství pohyblivých kloubů je neuvěřitelně ohebný, kroutí se úplně jako živý a skvěle padne do ruky. Poslouží jako nepřehlédnutelná dekorace na stůl či poličku, chytlavá antistresová hračka i skvělý dárek pro milovníky plazů a netradičních doplňků.

      - Detailní zpracování: Precizní 3D tisk s důrazem na výrazné ostny, uhrančivé oči a plynulý, přirozený pohyb kloubů.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Unikátní detail: Barevné provedení očí a přechody odstínů se mohou u jednotlivých kusů nepatrně lišit, každý kousek je tak neopakovatelný originál.
      - Perfektní pro každého: Dospělým pomůže odbourat stres při práci, děti zabaví na dlouhé hodiny.

      Péče a údržba (jak o hada pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte hada za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Vhodné pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může způsobit křehnutí materiálu a ztrátu barev.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Přidejte si do sbírky trochu tajemné hravosti — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "liska",
    nazev: "Liška",
    kategorie: ["Zvířata", "Podzim"],
    cena: 150,
    material: "PLA",
    popis: "",
    barvy: ["oranžová", "vínová"],
    obrazky: [],
  },
  {
    id: "hrib",
    nazev: "Houba hřib",
    kategorie: ["Dekorace", "Podzim"],
    velikosti: [
      { nazev: "Malý", cena: 80 },
      { nazev: "Velký", cena: 120 },
    ],
    material: "PLA",
    popis: "",
    barvy: ["světle hnědá", "tmavě hnědá"],
    obrazky: ["obrazky/hrib-1.jpg"],
  },
  {
    id: "zalud",
    nazev: "Žalud",
    kategorie: ["Dekorace", "Podzim"],
    cena: 150,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "dyne",
    nazev: "Dýně",
    kategorie: ["Dekorace", "Podzim"],
    velikosti: [
      { nazev: "S", cena: 30 },
      { nazev: "M", cena: 60 },
      { nazev: "L", cena: 120 },
    ],
    material: "PLA",
    popis: "",
    barvy: ["Žlutá", "Oranžová"],
    obrazky: [],
  },
  {
    id: "svicen",
    nazev: "Svícen dýně",
    kategorie: ["Dekorace", "Podzim"],
    cena: 80,
    material: "PLA",
    popis: "",
    barvy: ["béžová", "oranžová", "zelená"],
    obrazky: [],
  },
  {
    id: "vaza",
    nazev: "Váza žebrovaná",
    kategorie: ["Dekorace", "Podzim"],
    velikosti: [
      { nazev: "Malá", cena: 120 },
      { nazev: "Velká", cena: 350 },
    ],
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "miska-na-pistacie",
    nazev: "Miska na pistácie",
    kategorie: "Domácnost",
    cena: 250,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "podtacky",
    nazev: "Podtácky 4 ks + miska",
    kategorie: "Domácnost",
    cena: 250,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "chameleon",
    nazev: "Chameleon",
    kategorie: "Zvířata",
    cena: 250,
    material: "PLA",
    popis: `
      3D tištěný flexibilní chameleon

      Oživte svůj stůl nebo poličku tímto úžasným 3D tištěným chameleonem! Tento exotický ještěr vyniká nápaditým provedením s článkovaným tělem a typicky zvědavýma očima.

      Díky pohyblivým kloubům je chameleon krásně ohebný a skvěle padne do ruky. Poslouží jako stylová dekorace, chytlavá antistresová hračka i skvělý dárek pro milovníky zvířat a netradičních doplňků.

      - Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Unikátní detail: Výběr barevného provedení očí se může u jednotlivých kusů nepatrně lišit, každý kousek je tak originál.
      - Perfektní pro každého: Dospělým pomůže odbourat stres při práci, děti zabaví na dlouhé hodiny.

      Péče a údržba (jak o chameleona pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte chameleona za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Vhodné pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může způsobit křehnutí materiálu a ztrátu barev.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Přidejte si do života trochu tropické hravosti — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "zralok",
    nazev: "Žralok",
    kategorie: "Zvířata",
    cena: 250,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "duch",
    nazev: "Duch",
    kategorie: ["Halloween", "Hračky"],
    velikosti: [
      { nazev: "Malý", cena: 40 },
      { nazev: "Velký", cena: 80 },
    ],
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "drak",
    nazev: "Drak trnitý",
    kategorie: "Zvířata",
    velikosti: [
      { nazev: "Malý", cena: 290 },
      { nazev: "Velký", cena: 490 },
    ],
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: ["obrazky/drak-1.jpg"],
  },
  {
    id: "snehova-vlocka",
    nazev: "Sněhová vločka",
    kategorie: "Vánoce",
    velikosti: [
      { nazev: "Malá", cena: 40 },
      { nazev: "Velká", cena: 90 },
    ],
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "leguan",
    nazev: "Leguán",
    kategorie: "Zvířata",
    velikosti: [
      { nazev: "S", cena: 290 },
      { nazev: "M", cena: 390 },
    ],
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "t-rex",
    nazev: "T-Rex",
    kategorie: "Zvířata",
    velikosti: [
      { nazev: "S", cena: 190 },
      { nazev: "M", cena: 490 },
    ],
    material: "PLA",
    popis: `
      3D tištěný flexibilní T-Rex

      Připravte se na pořádnou dávku pravěké zábavy! Tento 3D tištěný T-Rex je ikonický dinosaurus v moderním, ultra flexibilním provedení, který si okamžitě získá pozornost na jakémkoliv stole či poličce.

      Díky propracovaným pohyblivým kloubům je úžasně ohebný. Skvěle poslouží jako originální dekorace, chytlavá antistresová hračka do ruky i perfektní dárek pro všechny milovníky dinosaurů.

      - Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Unikátní detail: Výběr barevného provedení očí se může u jednotlivých kusů nepatrně lišit, každý kousek je tak originál.
      - Perfektní pro každého: Dospělým pomůže odbourat stres při práci, děti zabaví na dlouhé hodiny.

      Péče a údržba (jak o T-rexe pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte T-rexe za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Vhodné pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může způsobit křehnutí materiálu a ztrátu barev.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Přidejte si do sbírky trochu pravěké hravosti — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "zaba",
    nazev: "Žába",
    kategorie: "Zvířata",
    cena: 150,
    material: "PLA",
    popis: `
      3D tištěná flexibilní žába

      Tato veselá ohebná žabka si vás získá svým usměvavým výrazem a nápaditě propracovanýma nohama.

      Díky pohyblivým kloubům v nohách a těle je úžasně tvárná a ohebná. Skvěle funguje jako hravá dekorace na pracovní stůl, zábavná antistresová hračka do ruky i milý dárek pro každého, kdo má rád originální doplňky.

      - Ruční práce: Oči jsou pečlivě ručně malované, což každé žabce dává jedinečný pohled a charakter.
      - Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů a výrazné žabí prsty s bílými akcenty.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Pro radost i klid: Pomůže odbourat stres při práci nebo škole a dospělým i dětem přinese kousek hravé přírody do pokoje.

      Péče a údržba (jak o žabku pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte žabku za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může oslabit barvy a materiál.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Oživte svou poličku nebo stůl touto originální žabkou — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "kun",
    nazev: "Kůň",
    kategorie: "Zvířata",
    cena: 190,
    material: "PLA",
    popis: `
      3D tištěný flexibilní kůň

      Tento ohebný koník si vás získá svým milým pohledem a jedinečnými, ručně malovanými detaily.

      Díky promyšleným kloubům v nohou a těle je krásně pohyblivý, takže ho můžete snadno napolohovat. Stane se z něj hravá dekorace na pracovní stůl, zábavná antistresová hračka i originální dárek pro všechny milovníky koní.

      - Ruční práce: Oči a další detaily jsou pečlivě ručně malované, což z každého koníka dělá jedinečný kousek.
      - Detailní zpracování: Precizní 3D tisk s důrazem na bohatou hřívu, ocas a rousy na kopytech.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Pro radost i klid: Skvělá antistresová hračka do ruky pro dospělé i parťák na hraní pro starší děti.

      Péče a údržba (jak o koníka pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte ho za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může oslabit barvy a materiál.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Oživte svou poličku nebo stůl tímto originálním koníkem — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "had-trnity",
    nazev: "Had trnitý",
    kategorie: "Zvířata",
    velikosti: [
      { nazev: "Malý", cena: 250 },
      { nazev: "Velký", cena: 490 },
    ],
    material: "PLA",
    popis: `
      3D tištěný flexibilní trnitý had

      Přidejte do svého prostoru špetku exotičnosti a fascinující elegance! Tento trnitý had s výraznými ostny po celé délce těla je dokonalou ukázkou toho, co dokáže moderní 3D tisk.

      Díky velkému množství pohyblivých kloubů je neuvěřitelně ohebný, kroutí se úplně jako živý a skvěle padne do ruky. Poslouží jako nepřehlédnutelná dekorace na stůl či poličku, chytlavá antistresová hračka i skvělý dárek pro milovníky netradičních doplňků.

      - Detailní zpracování: Precizní 3D tisk s důrazem na detailní ostny a plynulý, přirozený pohyb kloubů.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Unikátní detail: Výběr barevného provedení očí se může u jednotlivých kusů nepatrně lišit, každý kousek je tak originál.
      - Perfektní pro každého: Dospělým pomůže odbourat stres při práci, děti zabaví na dlouhé hodiny.

      Péče a údržba (jak o hada pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte hada za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Vhodné pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může způsobit křehnutí materiálu a ztrátu barev.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Přidejte si do sbírky trochu tajemné hravosti — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "had-trnity-se-stromem",
    nazev: "Had trnitý se stromem",
    kategorie: "Zvířata",
    cena: 590,
    material: "PLA",
    popis: `
      3D tištěná flexibilní větev se stromovým hadem

      Proměňte svůj stůl či poličku v malý kousek exotické přírody! Tato propracovaná sada obsahuje flexibilního trnitého hada a stylový stojánek v podobě větve stromu, na který můžete hada libovolně obmotat nebo zavěsit.

      Díky velkému množství pohyblivých kloubů je had neuvěřitelně ohebný a skvěle padne do ruky. Spolu se stojánkem tvoří nepřehlédnutelnou dekoraci, ale zároveň funguje jako chytlavá antistresová hračka a originální dárek pro všechny milovníky plazů.

      - Set 2 v 1: Obsahuje dlouhého flexibilního trnitého hada a padnoucí stojánek ve tvaru větve.
      - Detailní zpracování: Precizní 3D tisk s důrazem na plastické šupiny/ostny, plynulý pohyb kloubů a věrohodnou strukturu dřeva.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Pro radost i relax: Působivá dekorace do interiéru i skvělá antistresová pomůcka do ruky.

      Péče a údržba (jak o set pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte model za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může oslabit barvy a materiál.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Dopřejte svému prostoru dominantní exotický prvek — vyberte si svou barevnou kombinaci ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "had-hladky-se-stromem",
    nazev: "Had hladký se stromem",
    kategorie: "Zvířata",
    cena: 490,
    material: "PLA",
    popis: `
      3D tištěná flexibilní větev s hladkým stromovým hadem

      Proměňte svůj stůl či poličku v malý kousek exotické přírody! Tato propracovaná sada obsahuje flexibilního, příjemně hladkého hada a stylový stojánek v podobě větve stromu, na který můžete hada libovolně obmotat nebo zavěsit.

      Had s jemnými liniemi, hladkým tělem a zvědavě vztyčenou hlavou představuje elegantní a čistou variantu oblíbeného ohebného ještěra. Díky velkému množství pohyblivých kloubů je neuvěřitelně tvárný a skvěle padne do ruky.

      - Set 2 v 1: Obsahuje dlouhého flexibilního hladkého hada a padnoucí stojánek ve tvaru větve.
      - Elegantní vzhled: Precizní 3D tisk s důrazem na hladký povrch těla, plynulý přirozený pohyb a věrohodnou strukturu dřevěného podstavce.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Pro radost i relax: Působivá dekorace do interiéru i skvělá antistresová pomůcka do ruky.

      Péče a údržba (jak o set pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte model za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může oslabit barvy a materiál.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Dopřejte svému prostoru dominantní exotický prvek — vyberte si svou barevnou kombinaci ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "chameleon-se-stromem",
    nazev: "Chameleon se stromem",
    kategorie: "Zvířata",
    cena: 490,
    material: "PLA",
    popis: `
      3D tištěný chameleon na stojánku s větví

      Přeneste si domů kousek tropického pralesa! Tato promyšlená sada obsahuje flexibilního chameleona a propracovaný stojánek s větví, trávou a kameny, na který můžete chameleona libovolně usadit nebo uchytit.

      Díky pohyblivým kloubům těla, nohou i ocasu je chameleon úžasně ohebný a skvěle padne do ruky. Spolu se stojánkem tvoří nepřehlédnutelnou dominantní dekoraci na stůl či poličku, ale zároveň funguje jako chytlavá antistresová hračka.

      - Set 2 v 1: Obsahuje ohebného chameleona a detailně propracovaný stojánek v podobě větve s travnatým podstavcem a kameny.
      - Detailní zpracování: Precizní 3D tisk s důrazem na strukturu kůže, zvědavé oči a plynulý pohyb kloubů.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Pro radost i relax: Působivý dekorativní doplněk do interiéru i skvělá antistresová pomůcka do ruky.

      Péče a údržba (jak o set pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte model za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může oslabit barvy a materiál.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Oživte svůj prostor tímto exotickým modelem — vyberte si svou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "hadi-vejce",
    nazev: "Hadí vejce s hladkým hadem",
    kategorie: "Zvířata",
    cena: 490,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "draci-vejce",
    nazev: "Dračí vejce",
    kategorie: "Zvířata",
    velikosti: [
      { nazev: "Malý", cena: 350 },
      { nazev: "Velký", cena: 490 },
      { nazev: "+ drak", cena: 790 },
    ],
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "had-kogi",
    nazev: "Had KOGI",
    kategorie: "Zvířata",
    cena: 390,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "stromek-s-hvezdou",
    nazev: "Realistický stromek s hvězdou",
    kategorie: "Vánoce",
    velikosti: [
      { nazev: "Malý", cena: 80 },
      { nazev: "Velký", cena: 120 },
    ],
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "louskacek",
    nazev: "Louskáček",
    kategorie: "Vánoce",
    velikosti: [
      { nazev: "Malý", cena: 80 },
      { nazev: "Velký", cena: 150 },
    ],
    material: "PLA",
    popis: "",
    barvy: ["vínová", "zelená"],
    obrazky: [],
  },
  {
    id: "snehulak",
    nazev: "Sněhulák",
    kategorie: "Vánoce",
    cena: 190,
    material: "PLA",
    popis: "",
    barvy: ["béžová", "červená", "černá"],
    obrazky: [],
  },
  {
    id: "ozdoba-spicka",
    nazev: "Ozdoba špička",
    kategorie: "Vánoce",
    velikosti: [
      { nazev: "S", cena: 80 },
      { nazev: "M", cena: 190 },
      { nazev: "L", cena: 250 },
      { nazev: "Sada 3 ks S", cena: 210 },
      { nazev: "Sada 6 ks S", cena: 390 },
    ],
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "hvezda",
    nazev: "Hvězda",
    kategorie: "Vánoce",
    velikosti: [
      { nazev: "S", cena: 20 },
      { nazev: "M", cena: 30 },
      { nazev: "L", cena: 50 },
      { nazev: "Sada 3 ks (S, M, L)", cena: 80 },
    ],
    material: "PLA",
    popis: "",
    barvy: ["bílá", "zelená", "červená", "zlatá"],
    obrazky: [],
  },
  {
    id: "dyne-maslova",
    nazev: "Dýně máslová",
    kategorie: ["Dekorace", "Podzim"],
    velikosti: [
      { nazev: "S", cena: 30 },
      { nazev: "M", cena: 60 },
      { nazev: "L", cena: 140 },
    ],
    material: "PLA",
    popis: "",
    barvy: ["žlutá", "béžová"],
    obrazky: [],
  },
  {
    id: "vaza-strukturovana",
    nazev: "Váza",
    kategorie: ["Dekorace", "Podzim"],
    velikosti: [
      { nazev: "Malá", cena: 90 },
      { nazev: "Velká", cena: 250 },
    ],
    material: "PLA",
    popis: "",
    barvy: ["béžová", "zelená", "vínová"],
    obrazky: [],
  },
  {
    id: "houba-siskovec",
    nazev: "Houba šiškovec",
    kategorie: ["Dekorace", "Podzim"],
    cena: 180,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "duch-s-dyni",
    nazev: "Duch s dýní na hlavě",
    kategorie: ["Halloween", "Hračky"],
    cena: 50,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "svicen-kvet",
    nazev: "Svícen květ",
    kategorie: "Domácnost",
    cena: 90,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
];

/*
  VÝROBKY ZATÍM BEZ CENY – na webu se nezobrazují.
  Až budete znát cenu: zkopírujte celý výrobek (od { po },) na konec seznamu PRODUKTY výše,
  doplňte cenu a uložte.

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
    id: "jesterka",
    nazev: "Ještěrka",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: `
      3D tištěná flexibilní ještěrka

      Hledáte originální dekoraci, stylový doplněk na pracovní stůl nebo skvělý dárek, který prostě neomrzí? Tato 3D tištěná ještěrka si vás získá na první dotek!

      Díky pohyblivým kloubům je úžasně ohebná a živá. Skvěle funguje jako antistresová hračka do ruky, veselá ozdoba do pokoje i nevšední společník na monitor či poličku.

      - Detailní zpracování: Precizní 3D tisk s důrazem na plynulý pohyb kloubů.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Unikátní detail: Výběr barevného provedení očí se může u jednotlivých kusů nepatrně lišit, každý kousek je tak originál.
      - Perfektní pro každého: Dospělým pomůže odbourat stres při práci, děti zabaví na dlouhé hodiny.

      Péče a údržba (jak o ještěrku pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte ještěrku za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Vhodné pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může způsobit křehnutí materiálu a ztrátu barev.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Přidejte si do života trochu barevné hravosti — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: ["obrazky/jesterka-1.jpg", "obrazky/jesterka-2.jpg"],
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
    id: "srdce",
    nazev: "Srdce",
    kategorie: "Klíčenky",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
  {
    id: "krakatice",
    nazev: "Krakatice",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: `
      3D tištěná flexibilní krakatice

      Ponořte se do mořských hlubin s touto fascinující 3D tištěnou krakaticí! Zaujme na první pohled svými dlouhými rameny a výraznýma zvědavýma očima.

      Díky velkému množství ohebných kloubů v ramenou je úžasně tvárná a v rukou působí neuvěřitelně živě. Skvěle poslouží jako nepřehlédnutelná dekorace na stůl či poličku, chytlavá antistresová hračka i originální dárek pro všechny milovníky mořského světa.

      - Ohebná ramena: Množství samostatných kloubů umožňuje plynulý a přirozený pohyb ramen.
      - Detailní zpracování: Precizní 3D tisk s důrazem na výrazné oči a strukturu chapadel.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Pro radost i klid: Skvělá antistresová pomůcka do ruky pro dospělé i zábavný společník pro starší děti.

      Péče a údržba (jak o krakatici pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte krakatici za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může oslabit barvy a materiál.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Oživte svůj prostor tímto mořským tvorem — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "krokodyl",
    nazev: "Krokodýl",
    kategorie: "Zvířata",
    cena: 0,
    material: "PLA",
    popis: `
      3D tištěný flexibilní krokodýl

      Přidejte do své sbírky trochu divoké přírody! Tento ohebný krokodýl zaujme na první pohled svým přátelským výrazem, ručně malovanýma očima a propracovanými detaily, jako jsou malé zuby či šedé drápky.

      Díky pohyblivým kloubům v nohách i článkovaném těle je úžasně ohebný a skvěle padne do ruky. Poslouží jako veselá dekorace na stůl či poličku, chytlavá antistresová hračka i originální dárek pro všechny milovníky zvířat.

      - Ruční práce: Oči a drobné detaily jsou pečlivě ručně malované, takže každý krokodýl je jedinečný originál.
      - Detailní zpracování: Precizní 3D tisk s důrazem na strukturovaný hřbet, plynulý pohyb kloubů a výrazné drápy.
      - Materiál: Vyrobeno z lehké a pevné biologicky odbouratelné plastové hmoty PLA (z kukuřičného škrobu).
      - Pro radost i klid: Dospělým pomůže odbourat stres při práci, děti zabaví na dlouhé hodiny.

      Péče a údržba (jak o krokodýla pečovat):

      - Chraňte před teplem: Materiál PLA měkne při teplotách nad 50–60 °C. Nenechávejte krokodýla za sklem na přímém letním slunci, v rozpáleném autě ani blízko zdrojů tepla.
      - Pouze do interiéru: Dlouhodobé vystavení UV záření a dešti může oslabit barvy a materiál.
      - Není určeno pro nejmenší děti: Obsahuje drobné pohyblivé částice.

      Oživte svůj stůl tímto originálním krokodýlem — vyberte si svou oblíbenou barevnou variantu ještě dnes!

      Autor modelu / design: KOGI3D
    `,
    barvy: [],
    obrazky: [],
  },
  {
    id: "omalovanka-carodejnice",
    nazev: "3D omalovánka – čarodějnice",
    kategorie: "Halloween",
    cena: 0,
    material: "PLA",
    popis: "",
    barvy: [],
    obrazky: [],
  },
*/
