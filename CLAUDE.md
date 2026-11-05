# Filara: pravidla pro práci na e-shopu

Tento soubor čte Claude na začátku práce. Platí pro celý projekt.

## O projektu

E-shop Filara (3D tisk, Únětice). Provozovatel: Klára Klaudy, IČO 02215497, Rýznerova 177/10, 252 62 Únětice. Správce projektu a jediný, kdo nasazuje do ostrého provozu: Filip Klaudy.

Web je statický (index.html, js/app.js, data/produkty.js) na GitHub Pages, doména filara3dtisk.cz. Backend bude Supabase. Podrobné zadání po fázích je v ZADANI.md.

## Pravidla, která se nesmí porušit

1. **Repozitář je veřejný.** Nikdy do něj nepatří hesla, tokeny, klíč `service_role`, soubor `.env`, výpisy z banky ani žádná data zákazníků. Do kódu webu patří jen veřejný klíč (anon / publishable) vlastního vývojového projektu Supabase. Před každým commitem zkontroluj, že v něm nic takového není.
2. **Ochrana dat je v databázi, ne v prohlížeči.** Všechny tabulky mají zapnuté Row Level Security. Skrytá stránka admina nic nechrání. Akce admina smí provést jen uživatel s rolí admin a ověřuje se to v databázi. Po každé změně zkus jako nepřihlášený uživatel přečíst objednávky. Musí to selhat.
3. **Objednat musí jít bez registrace.** Účet je pro zákazníka volitelný.
4. **Zásoby se odečítají v databázi jednou transakcí** při odeslání objednávky, ne v prohlížeči. Dva zákazníci nesmí koupit poslední kus.
5. **Košík zůstává jen v prohlížeči** (localStorage), jako dosud. Nic nerezervuje a neukládá se do databáze.
6. **Změny databáze patří do skriptů v repu** (`supabase/migrations/`), ne do ručního klikání v dashboardu. Skripty pak pustí Filip na ostrém projektu.
7. **Pracuješ jen se svým vývojovým projektem Supabase.** K ostrému projektu přístup nemáš a nepotřebuješ ho. Nikdo po tobě nebude chtít sdílet klíče.
8. **Osobní údaje neposílej do cizích služeb** (analytika, e-mailové služby, formuláře třetích stran) bez domluvy s Filipem.

## Jak postupovat

- Po každém kroku musí web fungovat. Dělej malé změny a po každé fázi ukaž výsledek Filipovi.
- Neměň stávající vzhled ani texty, dokud to není součástí zadání. Vzhled se ladí zvlášť s Klárou.
- Texty na webu piš česky a vykáním, jako dosud.
- Testovací data musí být vymyšlená. Žádná skutečná jména, účty ani výpisy.
- Pokud si nejsi jistá, co se má stát (ceny, právní texty, faktury), nehádej, zeptej se Filipa.
