/* Katalog bez serveru: stránky se přepínají podle části adresy za # (např. index.html#produkt/ohebny-drak). */
(function () {
  "use strict";

  const app = document.getElementById("app");
  const kc = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const barvaPodleNazvu = new Map(BARVY.map((b) => [b.nazev, b]));

  function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function barvyProduktu(p) {
    return (p.barvy || []).map((n) => barvaPodleNazvu.get(n)).filter(Boolean);
  }

  /** Fotka produktu, nebo barevný zástupný obrázek, dokud fotka není. */
  function obrazek(src, alt, seed) {
    if (src) return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" />`;
    const hues = [24, 200, 140, 280, 340, 48, 0, 170];
    const h = hues[seed % hues.length];
    let lines = "";
    for (let i = 0; i < 9; i++) lines += `<line x1="0" x2="200" y1="${60 + i * 12}" y2="${60 + i * 12}" stroke="hsl(${h} 60% 88%)" />`;
    return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="200" fill="hsl(${h} 70% 95%)" />${lines}
      <path d="M100 40 150 68v64l-50 28-50-28V68z" fill="hsl(${h} 70% 62%)" />
      <path d="M100 40 150 68l-50 28-50-28z" fill="hsl(${h} 75% 74%)" />
      <path d="M100 96v64l50-28V68z" fill="hsl(${h} 65% 50%)" /></svg>`;
  }

  function kartaProduktu(p) {
    const i = PRODUKTY.indexOf(p);
    const barvy = barvyProduktu(p);
    const tecky = barvy
      .slice(0, 5)
      .map((b) => `<span style="background:${esc(b.hex)}" title="${esc(b.nazev)}"></span>`)
      .join("");
    return `<a href="#produkt/${encodeURIComponent(p.id)}" class="card product-card">
      <div class="thumb">${obrazek(p.obrazky && p.obrazky[0], p.nazev, i)}</div>
      <div class="product-card-body">
        <h3>${esc(p.nazev)}</h3>
        <div class="product-card-meta">
          <span class="price">${kc.format(p.cena)}</span>
          <span class="dots" aria-label="${barvy.length} barev">${tecky}${barvy.length > 5 ? `<small>+${barvy.length - 5}</small>` : ""}</span>
        </div>
      </div>
    </a>`;
  }

  /* ---------- Stránky ---------- */

  function uvod() {
    const doporucene = PRODUKTY.filter((p) => p.doporuceny);
    const vrstvy = Array.from(
      { length: 12 },
      (_, i) => `<rect x="${30 + i * 1.5}" y="${100 - i * 6}" width="${60 - i * 3}" height="5" rx="2" fill="hsl(${24 + i * 4} 90% ${55 + i * 2}%)" />`,
    ).join("");
    const vyhody = [
      ["Tiskneme na objednávku", "Každý kus vzniká až pro vás – žádné sklady, žádné plýtvání."],
      ["Vyberte si barvu", "U každého výrobku najdete barvy filamentu, které máme v dílně."],
      ["Přizpůsobení", "Jméno, text nebo přání? Napište nám a domluvíme se."],
      ["Rodinná výroba", "Každý výrobek ručně dočistíme a zkontrolujeme."],
    ];
    return `
      <section class="hero">
        <div class="container hero-inner">
          <div>
            <span class="badge">Rodinná 3D dílna</span>
            <h1>Originální výrobky <span>vrstvu po vrstvě</span></h1>
            <p>Dekorace, hračky a praktické pomocníky do domácnosti tiskneme s láskou na našich 3D tiskárnách. Vyberte si barvu a nechte si výrobek přizpůsobit.</p>
            <div class="hero-actions">
              <a href="#produkty" class="btn btn-primary">Prohlédnout produkty</a>
              <a href="#o-nas" class="btn btn-secondary">Kdo jsme</a>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="l1"></div><div class="l2"></div>
            <div class="l3"><svg viewBox="0 0 120 120">${vrstvy}<rect x="50" y="10" width="20" height="14" rx="3" fill="#e7e5e4" /><rect x="58" y="24" width="4" height="6" fill="#e7e5e4" /></svg></div>
          </div>
        </div>
      </section>
      <section class="container benefits">
        ${vyhody.map(([t, d]) => `<div class="card benefit"><h3>${t}</h3><p>${d}</p></div>`).join("")}
      </section>
      <section class="container section">
        <div class="section-head">
          <h2>Oblíbené výrobky</h2>
          <a href="#produkty" class="link">Všechny produkty →</a>
        </div>
        <div class="grid" style="margin-top:0">${doporucene.map(kartaProduktu).join("")}</div>
      </section>
      <section class="container section">
        <div class="card cta">
          <div><h2>Máte vlastní nápad?</h2><p>Rádi vytiskneme něco jen pro vás. Ozvěte se nám a domluvíme se.</p></div>
          <a href="#kontakt" class="btn">Napište nám</a>
        </div>
      </section>`;
  }

  const stavKatalogu = { kategorie: "", razeni: "vychozi" };

  function katalog() {
    const pills = ["", ...KATEGORIE]
      .map((k) => `<button type="button" class="pill" data-kategorie="${esc(k)}" aria-pressed="${stavKatalogu.kategorie === k}">${k ? esc(k) : "Vše"}</button>`)
      .join("");
    return `
      <div class="container page">
        <h1>${stavKatalogu.kategorie ? esc(stavKatalogu.kategorie) : "Všechny produkty"}</h1>
        <div class="toolbar">
          <div class="pills">${pills}</div>
          <label class="sort">Řadit:
            <select id="razeni">
              <option value="vychozi">Doporučené</option>
              <option value="nejlevnejsi">Nejlevnější</option>
              <option value="nejdrazsi">Nejdražší</option>
            </select>
          </label>
        </div>
        <div id="vypis"></div>
      </div>`;
  }

  function vypisKatalogu() {
    let seznam = PRODUKTY.filter((p) => !stavKatalogu.kategorie || p.kategorie === stavKatalogu.kategorie);
    if (stavKatalogu.razeni === "nejlevnejsi") seznam = [...seznam].sort((a, b) => a.cena - b.cena);
    if (stavKatalogu.razeni === "nejdrazsi") seznam = [...seznam].sort((a, b) => b.cena - a.cena);
    document.getElementById("vypis").innerHTML = seznam.length
      ? `<div class="grid">${seznam.map(kartaProduktu).join("")}</div>`
      : `<p class="empty">V této kategorii zatím nic nemáme. Brzy přidáme!</p>`;
  }

  function napojKatalog() {
    const select = document.getElementById("razeni");
    select.value = stavKatalogu.razeni;
    select.addEventListener("change", () => {
      stavKatalogu.razeni = select.value;
      vypisKatalogu();
    });
    app.querySelectorAll("[data-kategorie]").forEach((btn) =>
      btn.addEventListener("click", () => {
        stavKatalogu.kategorie = btn.dataset.kategorie;
        app.querySelector("h1").textContent = stavKatalogu.kategorie || "Všechny produkty";
        app.querySelectorAll("[data-kategorie]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        vypisKatalogu();
      }),
    );
    vypisKatalogu();
  }

  function detail(id) {
    const p = PRODUKTY.find((x) => x.id === id);
    if (!p) return nenalezeno();
    const i = PRODUKTY.indexOf(p);
    const fotky = p.obrazky || [];
    const barvy = barvyProduktu(p);
    const predmet = encodeURIComponent(`Dotaz na výrobek: ${p.nazev}`);
    const telo = encodeURIComponent(`Dobrý den,\n\nmám zájem o výrobek „${p.nazev}“ (${kc.format(p.cena)}).\nBarva: \nPočet kusů: \nPoznámka / text na výrobek: \n\nDěkuji`);
    const nahledy =
      fotky.length > 1
        ? `<div class="gallery-thumbs">${fotky
            .map((f, n) => `<button type="button" data-foto="${n}" aria-current="${n === 0}" aria-label="Obrázek ${n + 1}"><img src="${esc(f)}" alt="" /></button>`)
            .join("")}</div>`
        : "";
    return `
      <div class="container page">
        <nav class="breadcrumb"><a href="#produkty">Produkty</a> / ${esc(p.kategorie)}</nav>
        <div class="detail">
          <div>
            <div class="card gallery-main" id="hlavni-foto">${obrazek(fotky[0], p.nazev, i)}</div>
            ${nahledy}
          </div>
          <div>
            <h1>${esc(p.nazev)}</h1>
            <p class="price">${kc.format(p.cena)}</p>
            <p class="detail-desc">${esc(p.popis)}</p>
            <dl class="specs">
              <div class="card"><dt>Materiál</dt><dd>${esc(p.material)}</dd></div>
              ${p.rozmery ? `<div class="card"><dt>Rozměry</dt><dd>${esc(p.rozmery)}</dd></div>` : ""}
              ${p.dobaVyroby ? `<div class="card"><dt>Doba výroby</dt><dd>${esc(p.dobaVyroby)}</dd></div>` : ""}
            </dl>
            ${
              barvy.length
                ? `<div class="colors"><p>Dostupné barvy</p><ul>${barvy
                    .map((b) => `<li><span style="background:${esc(b.hex)}"></span>${esc(b.nazev)}</li>`)
                    .join("")}</ul></div>`
                : ""
            }
            <div class="card ask">
              <p>Líbí se vám? Napište nám, jakou barvu a kolik kusů chcete, případně jaký text na výrobek. Ozveme se s potvrzením a domluvíme platbu i dopravu.</p>
              <a class="btn btn-primary" href="mailto:${esc(OBCHOD.email)}?subject=${predmet}&body=${telo}">Mám zájem – napsat e-mail</a>
            </div>
          </div>
        </div>
      </div>`;
  }

  function napojDetail(id) {
    const p = PRODUKTY.find((x) => x.id === id);
    if (!p) return;
    document.title = `${p.nazev} | ${OBCHOD.nazev}`;
    app.querySelectorAll("[data-foto]").forEach((btn) =>
      btn.addEventListener("click", () => {
        document.getElementById("hlavni-foto").innerHTML = obrazek(p.obrazky[Number(btn.dataset.foto)], p.nazev, 0);
        app.querySelectorAll("[data-foto]").forEach((b) => b.setAttribute("aria-current", String(b === btn)));
      }),
    );
  }

  function oNas() {
    return `
      <div class="container page prose">
        <h1>O nás</h1>
        <p>Jsme rodinná dílna. Co začalo jednou 3D tiskárnou v obýváku a pár dárky pro kamarády, se postupně rozrostlo v malou výrobu, která nás baví každý den.</p>
        <h2>Jak pracujeme</h2>
        <ul>
          <li>Většinu výrobků tiskneme až na objednávku – v barvě, kterou si vyberete.</li>
          <li>Používáme převážně PLA z obnovitelných zdrojů a odolné PETG pro věci do kuchyně a na zahradu.</li>
          <li>Každý kus ručně dočistíme a zkontrolujeme, než ho zabalíme.</li>
          <li>Rádi vytiskneme i něco podle vašeho přání.</li>
        </ul>
        <h2>Máte nápad?</h2>
        <p>Napište nám přes <a href="#kontakt" class="link">kontakt</a> – společně vymyslíme, jak ho vytisknout.</p>
      </div>`;
  }

  function kontakt() {
    return `
      <div class="container page prose">
        <h1>Kontakt</h1>
        <p>Chcete si něco objednat, máte dotaz nebo nápad na výrobek na zakázku? Ozvěte se nám, odpovídáme obvykle do 24 hodin.</p>
        <div class="card contact-grid">
          <div><small>E-mail</small><strong><a href="mailto:${esc(OBCHOD.email)}">${esc(OBCHOD.email)}</a></strong></div>
          <div><small>Telefon</small><strong>${esc(OBCHOD.telefon)}</strong></div>
          <div><small>Provozovatel</small><strong>${esc(OBCHOD.nazev)}</strong><br />${esc(OBCHOD.provozovatel)}<br />${esc(OBCHOD.adresa)}</div>
          <div><small>Osobní odběr</small>Po předchozí domluvě na výše uvedené adrese.</div>
        </div>
      </div>`;
  }

  function nenalezeno() {
    return `<div class="container page" style="text-align:center"><h1>Stránka nenalezena</h1><p class="empty" style="margin:16px 0 32px">Tahle stránka se asi ještě tiskne… nebo neexistuje.</p><a href="#produkty" class="btn btn-primary">Zpět na produkty</a></div>`;
  }

  /* ---------- Přepínání stránek ---------- */

  function zobraz() {
    const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [stranka, param] = hash.split("/");
    document.title = `${OBCHOD.nazev} – výrobky z 3D tiskárny`;

    if (!stranka) app.innerHTML = uvod();
    else if (stranka === "produkty") {
      app.innerHTML = katalog();
      napojKatalog();
    } else if (stranka === "produkt") {
      app.innerHTML = detail(param);
      napojDetail(param);
    } else if (stranka === "o-nas") app.innerHTML = oNas();
    else if (stranka === "kontakt") app.innerHTML = kontakt();
    else app.innerHTML = nenalezeno();

    const aktivni = stranka === "produkt" ? "produkty" : stranka;
    document.querySelectorAll(".nav a").forEach((a) => {
      if (a.getAttribute("href") === `#${aktivni}`) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }

  document.querySelectorAll("[data-shop-name]").forEach((el) => (el.textContent = OBCHOD.nazev));
  document.querySelectorAll("[data-shop-email]").forEach((el) => {
    el.textContent = OBCHOD.email;
    el.href = `mailto:${OBCHOD.email}`;
  });
  document.querySelectorAll("[data-shop-phone]").forEach((el) => (el.textContent = OBCHOD.telefon));
  document.getElementById("year").textContent = new Date().getFullYear();

  window.addEventListener("hashchange", zobraz);
  zobraz();
})();
