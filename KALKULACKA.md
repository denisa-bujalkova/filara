# Filara kalkulačka cen 3D tisku: vložení do adminu

Popis pro fázi 4 v ZADANI.md. Stav ke dni 5. 11. 2026.

## Co to je

Samostatná webová kalkulačka (jedna stránka), kterou Filip používá k určení prodejní ceny tisku. Patří Filipovi, běží mimo e-shop a v e-shopu se jen zobrazí.

## Důležité: adresa je neveřejná

Kalkulačka nemá být vidět nikomu cizímu. Otevře ji jen ten, kdo zná přesnou adresu, a stránka je skrytá před vyhledávači. Proto:

1. **Adresu ti Filip pošle zvlášť, mimo repo.** Nepatří do žádného souboru v repozitáři, protože repo je veřejné. V tomto souboru je záměrně jen zástupný text `ADRESA_KALKULACKY`.
2. **Neukládej ji natvrdo do kódu webu.** Ulož ji do tabulky nastavení v databázi tak, aby ji mohl přečíst jen přihlášený admin (stejná pravidla přístupu jako u objednávek). Admin ji pak načte po přihlášení.
3. **Nikde veřejně na ni neodkazuj.** Záložka kalkulačky se zobrazí jen v adminu.

## Jak ji vložit do adminu

Nekopíruj kód kalkulačky. Má jednoho vlastníka a jednu adresu, kopie by se rozešly. Zobraz ji jako rámec s adresou načtenou z nastavení:

```html
<iframe src="ADRESA_KALKULACKY" title="Kalkulačka cen" loading="lazy"
        style="width:100%;height:80vh;border:0"></iframe>
```

Adresa nesmí posílat hlavičku, která vložení do rámce zakazuje. U dnešní adresy to tak je (kontrola 5. 11. 2026), ale vyzkoušej to na stránce adminu hned na začátku.

## Na co si dát pozor

1. **Kalkulačku neupravuj.** Pokud chceš změnu, napiš Filipovi.
2. **Admin kalkulačku nechrání heslem.** Skrytí adresy je ochrana jen před náhodou. Kdo adresu zná, otevře ji i bez přihlášení do adminu. Vzorec je v kódu stránky čitelný každému, kdo se na ni dostane.
3. **Propojení dat** (například cena filamentu z databáze nebo ukládání zakázek z kalkulačky) v téhle fázi neděláme. Jen vložení.
