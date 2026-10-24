/*
  OBCHODNÍ PODMÍNKY, OCHRANA OSOBNÍCH ÚDAJŮ, REKLAMACE
  ----------------------------------------------------
  Tento soubor můžete upravit v Poznámkovém bloku. Po uložení stačí v prohlížeči stisknout F5.
  Odkazy na tyto stránky jsou ve spodní liště webu.

  - Text každé stránky je mezi zpětnými uvozovkami ` ... ` (pravý Alt + 7). Uvnitř textu znak ` nepoužívejte.
  - Prázdný řádek = nový odstavec. Řádek začínající "- " = odrážka.
    Samostatný řádek končící dvojtečkou = mezititulek.
  - Tyto značky se na webu samy nahradí údaji z OBCHOD v produkty.js:
      {provozovatel}  {ico}  {adresa}  {email}  {telefon}  {nazev}
  - [DOPLNIT: …] se na webu ukáže žlutě. Přepište ho správným údajem (i s hranatými závorkami),
    nebo celou větu smažte, pokud se vás netýká.
  - Texty jsou návrh. Před spuštěním e-shopu je doporučujeme nechat zkontrolovat odborníkem.
*/

const INFO_STRANKY = [
  {
    adresa: "obchodni-podminky",
    nadpis: "Obchodní podmínky",
    text: `
      Děkujeme, že nakupujete v naší malé rodinné dílně. Níže najdete pravidla, podle kterých objednávky vyřizujeme. Kdyby vám cokoli nebylo jasné, napište nám, rádi vše vysvětlíme.

      Kdo jsme:

      - Prodávající: {provozovatel}
      - IČO: {ico}
      - Sídlo: {adresa}
      - E-mail: {email}
      - Telefon: {telefon}

      [DOPLNIT: Podnikatel zapsaný v živnostenském rejstříku vedeném Městským úřadem …]

      Objednávka a uzavření smlouvy:

      Výrobky si vyberete na webu a vložíte do košíku. Po vyplnění údajů se vám otevře e-mail s připravenou objednávkou, který nám odešlete. Objednávku si přečteme a pošleme vám e-mailem potvrzení s celkovou cenou, platebními údaji a předpokládaným termínem. Kupní smlouva vzniká ve chvíli, kdy vám objednávku potvrdíme.

      Kdyby se v objednávce něco nedalo splnit (třeba barva už není k dispozici), ozveme se vám a domluvíme se. Objednávku můžete zdarma zrušit, dokud vám ji nepotvrdíme.

      Ceny:

      Ceny na webu jsou konečné. [DOPLNIT: Nejsme plátci DPH. / Ceny jsou včetně DPH.] K ceně se připočítává jen doprava podle způsobu, který si vyberete v košíku.

      Platba:

      [DOPLNIT: např. Platit můžete převodem na účet předem podle údajů v potvrzení objednávky, nebo hotově při osobním vyzvednutí.]

      Výroba a vyzvednutí:

      Výrobky, které máme skladem, jsou připravené hned. Ostatní pro vás tiskneme, ručně dočistíme a případně namalujeme, proto může výroba trvat několik dní. Přesný termín vám napíšeme v potvrzení objednávky.

      Osobně si objednávku vyzvednete po domluvě v Salonu Clair, {adresa}. Pokud web nabízí i zaslání, posíláme zboží dopravcem, kterého si vyberete v košíku.

      Vlastnosti výrobků:

      Výrobky tiskneme na 3D tiskárně z PLA. Jemné vrstvy na povrchu a drobné rozdíly v odstínu jsou přirozenou vlastností 3D tisku. Ručně malované výrobky jsou originály a každý kus se trochu liší. PLA nesnáší vysoké teploty: nenechávejte výrobky v rozpáleném autě, na přímém slunci za sklem ani v myčce.

      Odstoupení od smlouvy a reklamace:

      Jak vrátit zboží do 14 dnů a jak reklamovat, najdete na stránce Reklamace a vrácení.

      Mimosoudní řešení sporů:

      Pokud se nám nepodaří spor vyřešit dohodou, můžete se obrátit na Českou obchodní inspekci, Štěpánská 567/15, 120 00 Praha 2, www.coi.cz.

      Závěrečná ustanovení:

      Odesláním objednávky potvrzujete, že jste se s těmito podmínkami seznámili. Podmínky platí od [DOPLNIT: datum].
    `,
  },
  {
    adresa: "reklamace",
    nadpis: "Reklamace a vrácení",
    text: `
      Na každém výrobku si dáváme záležet. Když se přesto něco nepovede, napište nám a společně to vyřešíme.

      Vrácení zboží do 14 dnů:

      Jako spotřebitel můžete od smlouvy odstoupit bez udání důvodu do 14 dnů ode dne, kdy jste zboží převzali. Stačí nám to v této lhůtě napsat na {email}. Můžete použít vzorový formulář níže, ale není to povinné.

      Zboží nám vraťte nejpozději do 14 dnů od odstoupení, nepoškozené a nejlépe v původním balení. Můžete ho přinést osobně po domluvě, nebo poslat poštou. Náklady na vrácení zboží nesete vy.

      Peníze vám vrátíme do 14 dnů od odstoupení, stejným způsobem, jakým jste platili, pokud se nedomluvíme jinak. Vrátit je můžeme až poté, co nám zboží dorazí zpátky.

      Kdy zboží vrátit nelze:

      Odstoupit nelze u výrobku, který jsme vyrobili nebo upravili podle vašeho zvláštního přání, například s vlastním nápisem nebo v provedení, které běžně nenabízíme.

      Reklamace:

      Na zboží máte zákonnou záruku 24 měsíců od převzetí. Když se na výrobku objeví vada, napište nám na {email}, popište ji a přiložte fotku. Reklamaci vyřídíme nejpozději do 30 dnů a dáme vám vědět, jak jsme ji vyřešili (oprava, výměna, sleva nebo vrácení peněz).

      Za vadu nepovažujeme:

      - Vrstvy po tisku: jemné linky na povrchu jsou přirozenou vlastností 3D tisku.
      - Ruční malbu: každý ručně malovaný kus je originál a trochu se liší od fotky.
      - Poškození teplem: PLA se deformuje při vysoké teplotě (rozpálené auto, přímé slunce za sklem, myčka).
      - Běžné opotřebení a poškození nešetrným zacházením.

      Vzorový formulář pro odstoupení od smlouvy:

      Formulář zkopírujte, vyplňte a pošlete nám ho e-mailem.

      Adresát: {provozovatel}, {adresa}, {email}
      Oznamuji, že tímto odstupuji od smlouvy o nákupu tohoto zboží: …
      Datum objednání / datum převzetí: …
      Jméno a příjmení: …
      Adresa: …
      Číslo účtu pro vrácení peněz: …
      Datum a podpis (jen u papírové verze): …
    `,
  },
  {
    adresa: "ochrana-osobnich-udaju",
    nadpis: "Ochrana osobních údajů",
    text: `
      Vaše údaje používáme jen k tomu, abychom mohli vyřídit vaši objednávku. Nikomu je neprodáváme a neposíláme vám reklamu.

      Kdo údaje zpracovává:

      Správcem osobních údajů je {provozovatel}, IČO {ico}, {adresa}. Kontakt: {email}, {telefon}.

      Jaké údaje zpracováváme a proč:

      - Objednávka: jméno, e-mail, telefon, poznámka k objednávce a případně doručovací adresa. Potřebujeme je, abychom mohli objednávku potvrdit, vyrobit a předat (plnění smlouvy).
      - Účetnictví: údaje na dokladech o prodeji uchováváme, protože nám to ukládá zákon.
      - Komunikace: když nám napíšete, odpovídáme na váš e-mail nebo zprávu.

      Jak dlouho údaje uchováváme:

      Po dobu nutnou k vyřízení objednávky a případné reklamace a dále po dobu, kterou nám ukládají právní předpisy (např. účetní a daňové). Potom údaje smažeme.

      Komu údaje předáváme:

      - Poskytovateli e-mailu, přes který s vámi komunikujeme (Google – Gmail).
      - Dopravci, pokud si vyberete zaslání zboží, a to jen údaje potřebné k doručení.

      Cookies a košík:

      Náš web nepoužívá žádné sledovací ani reklamní cookies. Obsah košíku a rozepsané údaje se ukládají jen ve vašem prohlížeči a k nám se dostanou teprve tehdy, když nám objednávku odešlete e-mailem. Na stránce Kontakt je vložená mapa Google, která si při zobrazení může ukládat vlastní cookies podle pravidel společnosti Google.

      Vaše práva:

      Máte právo vědět, jaké údaje o vás máme, nechat je opravit nebo smazat, omezit jejich zpracování, získat je v přenosné podobě a vznést proti zpracování námitku. Stačí nám napsat na {email}. Pokud si myslíte, že s vašimi údaji nezacházíme správně, můžete podat stížnost u Úřadu pro ochranu osobních údajů (www.uoou.cz).
    `,
  },
];
