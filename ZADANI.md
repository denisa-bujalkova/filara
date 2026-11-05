# Filara e-shop: zadání po fázích

Pracuj fázi po fázi. Další začni až po potvrzení od Filipa. Pravidla jsou v CLAUDE.md.

## Fáze 1: doména a drobnosti (hotové DNS, zbývá repo)

DNS pro filara3dtisk.cz je nastavené. Zbývá:
1. GitHub → repo → Settings → Pages → Custom domain: `filara3dtisk.cz`, uložit.
2. Až GitHub ověří DNS, zapnout "Enforce HTTPS".
3. V `index.html` ř. 20 změnit `email` na `filara3dprint@gmail.com` (původní adresa byla jen ukázka).
4. V `index.html` ř. 12 změnit `og:image` na `https://filara3dtisk.cz/obrazky/uvod-1.jpg` (náhled při sdílení nefunguje s relativní adresou).
5. V `data/produkty.js` ř. 55 a 56 doplnit `provozovatel: "Klára Klaudy"` a `ico: "02215497"`.

## Fáze 2: objednávky v databázi a admin

Cíl: objednávka se ukládá do databáze místo mailto a admin ji vidí.

**Tabulky (návrh, uprav podle potřeby):** produkty (název, popis, cena, fotky, kategorie), varianty/barvy se zásobou, objednávky (číslo, stav, zákazník, doprava, celková cena, termín platnosti), položky objednávky, poptávky z kontaktního formuláře, nastavení (počet dní na zaplacení, text "do 3 týdnů").

**Objednávka bez registrace:** zákazník vyplní údaje a odešle. Vznikne objednávka s číslem. Číslo objednávky je zároveň variabilní symbol. Zákazník uvidí platební údaje a QR platbu (český standard SPAYD) s přesnou částkou, VS a zprávou pro příjemce, která obsahuje číslo objednávky. Doprava: zákazník vybere výdejní místo Zásilkovny (widget), cenu dopravy zadává Filip v nastavení. Zboží odesílá Filip.

**Stavy objednávky:** nová (čeká na platbu), zaplacená, ve výrobě, odeslaná, vyřízená, zrušená.

**Zásoby:** po barvách. Při 2 ks se u výrobku ukáže "Zbývají poslední 2 kusy", při 1 ks "Zbývá poslední kus". Odečtení se děje v databázi při odeslání objednávky. Výrobek může mít i režim "bez hlídání zásob" (tiskne se na objednávku).

**Vyprodáno:** místo "Momentálně vyprodáno" tlačítko "Objednat do výroby", které otevře kontaktní formulář s předvyplněným výrobkem a textem "Zvládneme vyrobit a doručit do 3 týdnů" (text je v nastavení). Admin má navíc ruční přepínač "Momentálně vyprodáno" u výrobku nebo barvy (třeba když dojde filament), nezávislý na počtu kusů, s poznámkou. U takto pozastaveného kusu admin volí, jestli se "Objednat do výroby" nabídne.

**Košík:** je jen v prohlížeči a nic nedrží. Při otevření košíku se porovná s aktuálními zásobami a při odeslání objednávky se zkontroluje znovu v databázi. Vyprodaná položka v košíku: fotka černobílá (CSS filtr, aby byla pořád vidět), pod fotkou červený štítek s textem "Bohužel někdo byl rychlejší, kus je už pryč" a odkaz "Můžeme ho vyrobit na zakázku". Pokud zbývá jen část, ukáže se "Zbývá jen 1 ks, v košíku máte 2" s úpravou počtu. Dokud vyprodaná položka v košíku je, nejde objednávku odeslat.

**Neuhrazené objednávky:** po uplynutí počtu dní z nastavení se objednávka zruší a zásoby se vrátí do prodeje. Admin může lhůtu u objednávky prodloužit.

**Admin:** přihlášení admina s dvoufázovým ověřením, pro dva uživatele (Filip a Klára). Přehled objednávek, změna stavu, poznámky, pohled "Čeká na platbu" seřazený od nejstarších s tlačítkem "Označit jako zaplaceno", správa výrobků a zásob (přidat, upravit, smazat), poptávky z formuláře.

## Fáze 3: zákaznické účty

Volitelná registrace a přihlášení, obnovení hesla, ověření e-mailu. Zákazník vidí historii svých objednávek se stavem, může objednávku zopakovat a stáhnout fakturu. Faktury se generují z dat objednávky jako PDF, ukládají se a zpětně se nemění. Náležitosti faktury (Klára je podle ARES neplátce DPH, ověří se) dodá Filip od účetní, nehádej je. GDPR: souhlas, možnost smazat účet a vyexportovat data.

## Fáze 4: statistiky, kalkulačka, import plateb

- **Statistiky** v adminu za den, týden, měsíc a rok: počet objednávek, tržby, nejprodávanější výrobky. Export do CSV.
- **Kalkulačka:** do adminu se jako záložka vloží stávající kalkulačka cen 3D tisku (samostatná aplikace Filipa), jen přes rámec bez zásahu do jejího kódu. Popis a odkaz jsou v KALKULACKA.md.
- **Import výpisu z Air Bank:** Filip jednou denně stáhne CSV a nahraje ho v adminu.
  - Formát: kódování Windows-1250 (v prohlížeči `TextDecoder('windows-1250')`), oddělovač `;`, hodnoty v uvozovkách, data dd/mm/rrrr, částky s čárkou, odchozí s mínusem.
  - Použij sloupce: Datum provedení, Směr úhrady (jen "Příchozí"), Částka v měně účtu, Variabilní symbol, Zpráva pro příjemce, Referenční číslo.
  - Referenční číslo je unikátní u každé platby a slouží jako ID, aby se překrývající výpisy nezpracovaly dvakrát.
  - Párování: shoda variabilního symbolu a přesné částky s neuhrazenou objednávkou, jinak číslo objednávky ve zprávě pro příjemce. Shoda označí objednávku za zaplacenou.
  - Všechno ostatní (jiná částka, neznámý VS, platba k již zaplacené objednávce, platba ke zrušené objednávce) jde do fronty "Ke kontrole" a rozhoduje člověk.
  - Soubor se zpracuje v prohlížeči. Do databáze se ukládá jen VS, částka, datum a referenční číslo, ne jména ani čísla účtů plátců.
  - Do repa nikdy nedávej skutečný výpis. Vytvoř si vymyšlený soubor stejného formátu.

## Později

E-maily zákazníkům (potvrzení, změna stavu) a upozornění adminovi, zálohy databáze, případně platební brána a načítání plateb přes API banky.
