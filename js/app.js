/* Web bez serveru: stránky se přepínají podle části adresy za # (např. index.html#produkt/ohebny-drak).
   Košík se ukládá v prohlížeči (localStorage) a objednávka se odesílá e-mailem přes zákazníkův e-mailový program. */
(function () {
  "use strict";

  const app = document.getElementById("app");
  const kc = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const barvaPodleNazvu = new Map(BARVY.map((b) => [b.nazev, b]));
  const MAX_KUSU = 99;
  const MAX_POZNAMKA = 200;

  function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function najdiProdukt(id) {
    return PRODUKTY.find((p) => p.id === id);
  }

  /** Kategorie výrobku jako seznam – v produkty.js může být jedna ("Zvířata") i víc (["Zvířata", "Hračky"]). */
  function kategorieProduktu(p) {
    return [].concat(p.kategorie || []);
  }

  function barvyProduktu(p) {
    return (p.barvy || []).map((n) => barvaPodleNazvu.get(n)).filter(Boolean);
  }

  /** Fotka produktu, nebo zástupný obrázek ve stylu FILARA, dokud fotka není. */
  function obrazek(src, alt, seed) {
    if (src) return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" />`;
    const hues = [172, 192, 208, 222, 160, 200, 184, 232];
    const h = hues[seed % hues.length];
    const id = `g${seed}`;
    let lines = "";
    for (let i = 0; i < 10; i++) lines += `<line x1="0" x2="200" y1="${52 + i * 12}" y2="${52 + i * 12}" stroke="hsl(${h} 40% 22%)" />`;
    return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">
      <defs><radialGradient id="${id}" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="hsl(${h} 60% 18%)" /><stop offset="1" stop-color="#0d1115" /></radialGradient></defs>
      <rect width="200" height="200" fill="url(#${id})" />${lines}
      <ellipse cx="100" cy="166" rx="56" ry="9" fill="hsl(${h} 90% 50%)" opacity=".25" />
      <path d="M100 40 150 68v64l-50 28-50-28V68z" fill="hsl(${h} 70% 42%)" />
      <path d="M100 40 150 68l-50 28-50-28z" fill="hsl(${h} 80% 62%)" />
      <path d="M100 96v64l50-28V68z" fill="hsl(${h} 75% 32%)" /></svg>`;
  }

  /* ---------- Košík (uložený v prohlížeči) ---------- */

  const KLIC_KOSIKU = "filara-kosik-v1";

  function nactiKosik() {
    try {
      const data = JSON.parse(localStorage.getItem(KLIC_KOSIKU) || "[]");
      return Array.isArray(data) ? data.filter((i) => i && najdiProdukt(i.id)) : [];
    } catch {
      return [];
    }
  }

  let kosik = nactiKosik();

  function ulozKosik() {
    try {
      localStorage.setItem(KLIC_KOSIKU, JSON.stringify(kosik));
    } catch {
      /* úložiště nedostupné – košík vydrží aspoň do zavření stránky */
    }
    aktualizujPocet();
  }

  function klicPolozky(i) {
    return `${i.id}|${i.barva || ""}|${(i.poznamka || "").trim()}`;
  }

  function pridejDoKosiku(polozka) {
    const klic = klicPolozky(polozka);
    const existujici = kosik.find((i) => klicPolozky(i) === klic);
    if (existujici) existujici.pocet = Math.min(MAX_KUSU, existujici.pocet + polozka.pocet);
    else kosik.push({ ...polozka, poznamka: polozka.poznamka.trim() });
    ulozKosik();
    const odznak = document.getElementById("pocet-v-kosiku");
    odznak.classList.remove("bump");
    void odznak.offsetWidth;
    odznak.classList.add("bump");
  }

  function pocetKusu() {
    return kosik.reduce((s, i) => s + i.pocet, 0);
  }

  function mezisoucet() {
    return kosik.reduce((s, i) => s + najdiProdukt(i.id).cena * i.pocet, 0);
  }

  function aktualizujPocet() {
    const el = document.getElementById("pocet-v-kosiku");
    const n = pocetKusu();
    el.textContent = n;
    el.hidden = n === 0;
    document.querySelector(".cart-link").setAttribute("aria-label", n ? `Košík, ${n} ks` : "Košík");
  }

  // Košík otevřený ve více záložkách zůstane stejný.
  window.addEventListener("storage", (e) => {
    if (e.key !== KLIC_KOSIKU) return;
    kosik = nactiKosik();
    aktualizujPocet();
    if (location.hash === "#kosik") zobraz();
  });

  let casovacToastu;
  function toast(html) {
    const el = document.getElementById("toast");
    el.innerHTML = html;
    el.hidden = false;
    clearTimeout(casovacToastu);
    casovacToastu = setTimeout(() => (el.hidden = true), 4000);
  }

  /* ---------- Karty a ikony ---------- */

  function kartaProduktu(p) {
    const i = PRODUKTY.indexOf(p);
    const barvy = barvyProduktu(p);
    const tecky = barvy
      .slice(0, 5)
      .map((b) => `<span style="background:${esc(b.hex)}" title="${esc(b.nazev)}"></span>`)
      .join("");
    return `<a href="#produkt/${encodeURIComponent(p.id)}" class="card product-card">
      <div class="thumb">${obrazek(p.obrazky && p.obrazky[0], p.nazev, i)}${p.rucneMalovano ? stitekMalovano() : ""}</div>
      <div class="product-card-body">
        <h3>${esc(p.nazev)}</h3>
        <div class="product-card-meta">
          <span class="price">${kc.format(p.cena)}</span>
          <span class="dots" aria-label="${barvy.length} barev">${tecky}${barvy.length > 5 ? `<small>+${barvy.length - 5}</small>` : ""}</span>
        </div>
      </div>
    </a>`;
  }

  const ikony = {
    vrstvy: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />',
    barvy: '<circle cx="8" cy="9" r="4" /><circle cx="16" cy="9" r="4" /><circle cx="12" cy="16" r="4" />',
    pero: '<path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" />',
    srdce: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />',
    stetec: '<path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L13 13.8 10.2 11zM10.2 11c-2.4-.2-4.4 1.6-4.6 4-.1 1.6-.9 2.9-2.6 3.6 2.7 2.1 7.4 2 9.3-.6.9-1.2 1-2.8.7-4.2" />',
    vyzvednuti: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" />',
  };

  function stitekMalovano() {
    return `<span class="tag-painted"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L13 13.8 10.2 11zM10.2 11c-2.4-.2-4.4 1.6-4.6 4-.1 1.6-.9 2.9-2.6 3.6 2.7 2.1 7.4 2 9.3-.6.9-1.2 1-2.8.7-4.2" /></svg>Ručně malováno</span>`;
  }

  function ikona(nazev) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ikony[nazev]}</svg>`;
  }

  /** Ilustrace v duchu loga: tisková tryska nad svítící podložkou. */
  function ilustrace() {
    let vrstvy = "";
    for (let i = 0; i < 14; i++) {
      const w = 120 - i * 4 + Math.sin(i / 2) * 10;
      vrstvy += `<rect x="${200 - w / 2}" y="${270 - i * 8}" width="${w}" height="6.5" rx="3" fill="url(#vrstva)" opacity="${0.55 + i * 0.03}" />`;
    }
    return `<svg viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <linearGradient id="chrom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" /><stop offset=".45" stop-color="#cfd6dc" /><stop offset=".6" stop-color="#7e8892" /><stop offset="1" stop-color="#e3e8ec" /></linearGradient>
        <linearGradient id="chromH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f7983" /><stop offset=".35" stop-color="#f4f6f8" /><stop offset=".6" stop-color="#aab3bb" /><stop offset="1" stop-color="#5d666f" /></linearGradient>
        <radialGradient id="cocka" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#9ff5e0" /><stop offset=".35" stop-color="#1fd1b4" /><stop offset=".7" stop-color="#1f7fd6" /><stop offset="1" stop-color="#0b2d5c" /></radialGradient>
        <linearGradient id="vrstva" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22e0b0" /><stop offset=".5" stop-color="#1fb3d6" /><stop offset="1" stop-color="#2f6fed" /></linearGradient>
      </defs>
      <circle cx="200" cy="200" r="186" fill="#0f1317" stroke="url(#chrom)" stroke-width="6" />
      <circle cx="200" cy="200" r="174" fill="none" stroke="#222a32" stroke-width="2" />
      <ellipse cx="200" cy="284" rx="132" ry="34" fill="url(#chromH)" />
      <ellipse cx="200" cy="280" rx="120" ry="28" fill="url(#cocka)" />
      <ellipse cx="170" cy="272" rx="40" ry="7" fill="#fff" opacity=".35" />
      ${vrstvy}
      <g>
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="${158 + i * 0}" y="${44 + i * 13}" width="84" height="8" rx="2" fill="url(#chromH)" />`).join("")}
        <rect x="176" y="108" width="48" height="26" rx="3" fill="url(#chromH)" />
        <path d="M184 134h32l-10 26h-12z" fill="url(#chromH)" />
        <path d="M194 160h12l-4 10h-4z" fill="#dfe5ea" />
        <circle cx="200" cy="172" r="4" fill="#9ff5e0" />
        <circle cx="200" cy="172" r="12" fill="#1fd1b4" opacity=".25" />
      </g>
    </svg>`;
  }

  /** Kruh se střídajícími se fotkami výrobků; bez fotek ilustrace tiskárny. */
  function uvodniFotky() {
    const fotky = typeof UVODNI_FOTKY !== "undefined" ? UVODNI_FOTKY : [];
    if (!fotky.length) return ilustrace();
    return `<div class="hero-foto">${fotky
      .map((src, i) => `<img src="${src}" alt="" class="${i === 0 ? "aktivni" : ""}" />`)
      .join("")}</div>`;
  }

  // Každé 4 s přepne fotku v kruhu na úvodu (když úvod není otevřený, nic nedělá).
  setInterval(() => {
    const fotky = document.querySelectorAll(".hero-foto img");
    if (fotky.length < 2) return;
    const i = [...fotky].findIndex((f) => f.classList.contains("aktivni"));
    fotky[i].classList.remove("aktivni");
    fotky[(i + 1) % fotky.length].classList.add("aktivni");
  }, 4000);

  /* ---------- Stránky ---------- */

  function uvod() {
    const doporucene = PRODUKTY.filter((p) => p.doporuceny);
    const vyhody = [
      ["srdce", "Rodinná výroba", "Každý výrobek ručně dočistíme a zkontrolujeme."],
      ["barvy", "Vyberte si barvu", "Barevné variace u každého výrobku."],
      ["stetec", "Ručně malováno", "Některé výrobky malujeme ručně akvarelem, a tak je každý kus originál."],
      ["vyzvednuti", "Osobní odběr", "Výrobky skladem si můžete vyzvednout v Salonu Clair v Úněticích."],
    ];
    return `
      <section class="hero">
        <div class="container hero-inner">
          <div>
            <h1><span class="chrome-text">Originální výrobky</span><br /><span class="accent-text">vrstvu po vrstvě</span></h1>
            <p>Zvířátka, dekorace, květiny i pomocníky do domácnosti tiskneme z PLA, ručně dočišťujeme a některé i malujeme akvarelem. Vyberte si, co vám udělá radost.</p>
            <div class="hero-actions">
              <a href="#nabidka" class="btn btn-primary">Prohlédnout nabídku</a>
              <a href="#o-nas" class="btn btn-secondary">Kdo jsme</a>
            </div>
          </div>
          <div class="hero-art">${uvodniFotky()}</div>
        </div>
      </section>
      <section class="container benefits">
        ${vyhody.map(([ik, t, d]) => `<div class="card benefit"><div class="benefit-icon">${ikona(ik)}</div><h3>${t}</h3><p>${d}</p></div>`).join("")}
      </section>
      ${
        doporucene.length
          ? `<section class="container section">
        <div class="section-head">
          <h2 class="chrome-text">Oblíbené výrobky</h2>
          <a href="#nabidka" class="link">Celá nabídka →</a>
        </div>
        <div class="grid" style="margin-top:0">${doporucene.map(kartaProduktu).join("")}</div>
      </section>`
          : ""
      }
      <section class="container section">
        <div class="card cta">
          <div><h2 class="chrome-text">Máte vlastní nápad?</h2><p>Rádi vytiskneme něco jen pro vás. Ozvěte se nám a domluvíme se.</p></div>
          <a href="#kontakt" class="btn btn-primary">Napište nám</a>
        </div>
      </section>`;
  }

  // Kategorie je součástí adresy (#nabidka/Zvířata), aby fungovalo tlačítko Zpět.
  // Náhodné pořadí se zamíchá při každém otevření celé nabídky a při přepínání kategorií zůstává stejné.
  const stavNabidky = { kategorie: "", razeni: "nahodne", poradi: [] };

  function zamichej() {
    const ids = PRODUKTY.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    stavNabidky.poradi = ids;
  }

  function adresaKategorie(k) {
    return k ? `#nabidka/${encodeURIComponent(k)}` : "#nabidka";
  }

  function nabidka(kategorie) {
    stavNabidky.kategorie = KATEGORIE.includes(kategorie) ? kategorie : "";
    if (!stavNabidky.kategorie || stavNabidky.poradi.length !== PRODUKTY.length) {
      zamichej();
      stavNabidky.razeni = "nahodne";
    }
    // Bez vybrané kategorie (klik na „Nabídka“) se ukáže vše; v seznamu jsou jen samotné kategorie.
    const odkazy = KATEGORIE
      .map((k) => {
        const pocet = PRODUKTY.filter((p) => kategorieProduktu(p).includes(k)).length;
        const aktivni = stavNabidky.kategorie === k;
        return `<li><a href="${adresaKategorie(k)}" ${aktivni ? 'aria-current="page"' : ""}><span>${esc(k)}</span><small>${pocet}</small></a></li>`;
      })
      .join("");
    return `
      <div class="container page">
        <div class="shop-layout">
          <aside class="sidebar" aria-label="Kategorie">
            <p class="sidebar-title">Kategorie</p>
            <ul>${odkazy}</ul>
          </aside>
          <div>
            <div class="list-head">
              <h1 class="chrome-text">${stavNabidky.kategorie ? esc(stavNabidky.kategorie) : "Nabídka"}</h1>
              <label class="sort">Řadit:
                <select id="razeni">
                  <option value="nahodne">Náhodně</option>
                  <option value="cena-vzestupne">Cena: od nejnižší</option>
                  <option value="cena-sestupne">Cena: od nejvyšší</option>
                  <option value="nazev">Název: A–Z</option>
                  <option value="nejnovejsi">Od nejnovějšího</option>
                </select>
              </label>
            </div>
            <div id="vypis"></div>
          </div>
        </div>
      </div>`;
  }

  function vypisNabidky() {
    let seznam = PRODUKTY.filter((p) => !stavNabidky.kategorie || kategorieProduktu(p).includes(stavNabidky.kategorie));
    const razeni = {
      "cena-vzestupne": (a, b) => a.cena - b.cena,
      "cena-sestupne": (a, b) => b.cena - a.cena,
      nazev: (a, b) => a.nazev.localeCompare(b.nazev, "cs"),
      // Nejnovější = výrobky přidané na konec seznamu v produkty.js.
      nejnovejsi: (a, b) => PRODUKTY.indexOf(b) - PRODUKTY.indexOf(a),
      nahodne: (a, b) => stavNabidky.poradi.indexOf(a.id) - stavNabidky.poradi.indexOf(b.id),
    };
    seznam.sort(razeni[stavNabidky.razeni] || razeni.nahodne);
    document.getElementById("vypis").innerHTML = seznam.length
      ? `<div class="grid">${seznam.map(kartaProduktu).join("")}</div>`
      : `<p class="empty">${PRODUKTY.length ? "V této kategorii zatím nic nemáme. Brzy přidáme!" : "Na nabídce právě pracujeme. Brzy tu najdete naše výrobky!"}</p>`;
  }

  function napojNabidku() {
    const select = document.getElementById("razeni");
    select.value = stavNabidky.razeni;
    select.addEventListener("change", () => {
      stavNabidky.razeni = select.value;
      vypisNabidky();
    });
    vypisNabidky();
  }

  function detail(id) {
    const p = najdiProdukt(id);
    if (!p) return nenalezeno();
    const i = PRODUKTY.indexOf(p);
    const fotky = p.obrazky || [];
    const barvy = barvyProduktu(p);
    const nahledy =
      fotky.length > 1
        ? `<div class="gallery-thumbs">${fotky
            .map((f, n) => `<button type="button" data-foto="${n}" aria-current="${n === 0}" aria-label="Obrázek ${n + 1}"><img src="${esc(f)}" alt="" /></button>`)
            .join("")}</div>`
        : "";
    const vyberBarvy = barvy.length
      ? `<p class="swatches-label">Barva: <strong id="nazev-barvy">${esc(barvy[0].nazev)}</strong></p>
         <div class="swatches" role="group" aria-label="Barva">${barvy
           .map(
             (b, n) =>
               `<button type="button" class="swatch" data-barva="${esc(b.nazev)}" aria-pressed="${n === 0}" aria-label="${esc(b.nazev)}" title="${esc(b.nazev)}" style="background:${esc(b.hex)}"></button>`,
           )
           .join("")}</div>`
      : "";
    // V drobečkové navigaci kategorie, ze které zákazník přišel (má-li výrobek víc kategorií).
    const kategorie = kategorieProduktu(p);
    const kat = kategorie.includes(stavNabidky.kategorie) ? stavNabidky.kategorie : kategorie[0];
    return `
      <div class="container page">
        <nav class="breadcrumb"><a href="#nabidka">Nabídka</a> / <a href="${adresaKategorie(kat)}">${esc(kat)}</a></nav>
        <div class="detail">
          <div>
            <div class="card gallery-main" id="hlavni-foto">${obrazek(fotky[0], p.nazev, i)}</div>
            ${nahledy}
          </div>
          <div>
            ${p.rucneMalovano ? stitekMalovano() : ""}
            <h1 class="chrome-text">${esc(p.nazev)}</h1>
            <p class="price">${kc.format(p.cena)}</p>
            <p class="detail-desc">${esc(p.popis)}</p>
            <dl class="specs">
              <div class="card"><dt>Materiál</dt><dd>${esc(p.material)}</dd></div>
              ${p.rozmery ? `<div class="card"><dt>Rozměry</dt><dd>${esc(p.rozmery)}</dd></div>` : ""}
              ${p.dobaVyroby ? `<div class="card"><dt>Doba výroby</dt><dd>${esc(p.dobaVyroby)}</dd></div>` : ""}
            </dl>
            <div class="card buy">
              ${vyberBarvy}
              <label class="field">
                <span>Poznámka / text na výrobek (nepovinné)</span>
                <textarea class="input" id="poznamka" maxlength="${MAX_POZNAMKA}" placeholder="Např. jméno na klíčenku, přání k úpravě…"></textarea>
              </label>
              <div class="buy-row">
                <div class="qty">
                  <button type="button" data-zmena="-1" aria-label="Méně">−</button>
                  <output id="pocet" aria-live="polite">1</output>
                  <button type="button" data-zmena="1" aria-label="Více">+</button>
                </div>
                <button type="button" class="btn btn-primary" id="pridat">Přidat do košíku</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function napojDetail(id) {
    const p = najdiProdukt(id);
    if (!p) return;
    document.title = `${p.nazev} | ${OBCHOD.nazev}`;

    app.querySelectorAll("[data-foto]").forEach((btn) =>
      btn.addEventListener("click", () => {
        document.getElementById("hlavni-foto").innerHTML = obrazek(p.obrazky[Number(btn.dataset.foto)], p.nazev, 0);
        app.querySelectorAll("[data-foto]").forEach((b) => b.setAttribute("aria-current", String(b === btn)));
      }),
    );

    let barva = barvyProduktu(p)[0]?.nazev || null;
    let pocet = 1;
    app.querySelectorAll("[data-barva]").forEach((btn) =>
      btn.addEventListener("click", () => {
        barva = btn.dataset.barva;
        document.getElementById("nazev-barvy").textContent = barva;
        app.querySelectorAll("[data-barva]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      }),
    );
    const vystupPoctu = document.getElementById("pocet");
    app.querySelectorAll("[data-zmena]").forEach((btn) =>
      btn.addEventListener("click", () => {
        pocet = Math.max(1, Math.min(MAX_KUSU, pocet + Number(btn.dataset.zmena)));
        vystupPoctu.textContent = pocet;
      }),
    );
    document.getElementById("pridat").addEventListener("click", () => {
      const poleP = document.getElementById("poznamka");
      pridejDoKosiku({ id: p.id, barva, pocet, poznamka: poleP.value.slice(0, MAX_POZNAMKA) });
      toast(`Přidáno do košíku: ${esc(p.nazev)}${barva ? ` (${esc(barva)})` : ""} × ${pocet} <a href="#kosik">Zobrazit košík →</a>`);
      poleP.value = "";
      pocet = 1;
      vystupPoctu.textContent = 1;
    });
  }

  /* ---------- Košík a objednávka ---------- */

  // Rozepsané údaje zákazníka – zůstanou vyplněné i po změně počtu kusů.
  const udaje = { jmeno: "", telefon: "", doprava: 0, misto: "", ulice: "", mesto: "", psc: "", poznamka: "" };

  function kosikStranka() {
    if (kosik.length === 0)
      return `
        <div class="container page" style="text-align:center">
          <h1 class="chrome-text">Košík je prázdný</h1>
          <p class="empty" style="margin:16px 0 32px">Vyberte si z naší nabídky.</p>
          <a href="#nabidka" class="btn btn-primary">Prohlédnout nabídku</a>
        </div>`;

    const dopravy = DOPRAVA.map(
      (d, n) => `<label class="radio"><span><input type="radio" name="doprava" value="${n}" ${udaje.doprava === n ? "checked" : ""} />${esc(d.nazev)}</span><strong>${d.cena ? kc.format(d.cena) : "Zdarma"}</strong></label>`,
    ).join("");

    return `
      <div class="container page">
        <h1 class="chrome-text">Košík</h1>
        <div class="cart-layout">
          <ul class="cart-items" id="polozky"></ul>
          <form class="card summary" id="objednavka" novalidate>
            <h2>Objednávka</h2>
            <div class="error-box" id="chyby" role="alert" hidden></div>
            <label class="field"><span>Jméno a příjmení</span><input class="input" name="jmeno" autocomplete="name" value="${esc(udaje.jmeno)}" /></label>
            <label class="field"><span>Telefon</span><input class="input" name="telefon" type="tel" autocomplete="tel" placeholder="+420 123 456 789" value="${esc(udaje.telefon)}" /></label>
            <fieldset class="radio-list" style="margin-top:16px"><legend>Doprava</legend>${dopravy}</fieldset>
            <div id="adresa"></div>
            <label class="field"><span>Poznámka k objednávce</span><textarea class="input" name="poznamka" maxlength="1000">${esc(udaje.poznamka)}</textarea></label>
            <div class="totals" id="soucty"></div>
            <button type="submit" class="btn btn-primary btn-block">Odeslat objednávku e-mailem</button>
            <p class="hint">Otevře se váš e-mailový program s připravenou objednávkou – stačí ji odeslat. Potvrzení a platební údaje vám pošleme zpět.</p>
            <div class="after-send" id="po-odeslani" hidden>
              Neotevřel se e-mail? Zkopírujte objednávku a pošlete ji na <a class="link" href="mailto:${esc(OBCHOD.email)}">${esc(OBCHOD.email)}</a>.
              <div class="actions">
                <button type="button" class="btn btn-secondary" id="kopirovat">Zkopírovat objednávku</button>
                <button type="button" class="btn btn-secondary" id="vyprazdnit">Objednávku jsem odeslal/a – vyprázdnit košík</button>
              </div>
            </div>
          </form>
        </div>
      </div>`;
  }

  function vykresliPolozky() {
    document.getElementById("polozky").innerHTML = kosik
      .map((pol, n) => {
        const p = najdiProdukt(pol.id);
        const b = barvaPodleNazvu.get(pol.barva);
        return `<li class="card cart-item">
          <a href="#produkt/${encodeURIComponent(p.id)}" class="cart-item-thumb">${obrazek(p.obrazky && p.obrazky[0], p.nazev, PRODUKTY.indexOf(p))}</a>
          <div class="cart-item-body">
            <div class="cart-item-top"><a href="#produkt/${encodeURIComponent(p.id)}">${esc(p.nazev)}</a><span>${kc.format(p.cena * pol.pocet)}</span></div>
            ${pol.barva ? `<div class="cart-item-meta"><i style="background:${esc(b ? b.hex : "#888")}"></i>${esc(pol.barva)}</div>` : ""}
            ${pol.poznamka ? `<div class="cart-item-note">„${esc(pol.poznamka)}“</div>` : ""}
            <div class="cart-item-actions">
              <div class="qty qty-small">
                <button type="button" data-polozka="${n}" data-zmena="-1" aria-label="Méně">−</button>
                <output>${pol.pocet}</output>
                <button type="button" data-polozka="${n}" data-zmena="1" aria-label="Více">+</button>
              </div>
              <button type="button" class="remove" data-odebrat="${n}">Odebrat</button>
            </div>
          </div>
        </li>`;
      })
      .join("");
  }

  function vykresliAdresu() {
    const typ = DOPRAVA[udaje.doprava].adresa;
    const el = document.getElementById("adresa");
    if (typ === "vydejni-misto")
      el.innerHTML = `<label class="field"><span>Výdejní místo Zásilkovny</span><input class="input" name="misto" value="${esc(udaje.misto)}" placeholder="Např. Praha 4, Budějovická 15 – Albert" /></label>
        <p class="hint" style="margin-bottom:14px">Výdejní místo najdete na <a class="link" href="https://www.zasilkovna.cz/pobocky" target="_blank" rel="noreferrer">zasilkovna.cz/pobocky</a>.</p>`;
    else if (typ === "dorucovaci")
      el.innerHTML = `<label class="field"><span>Ulice a číslo popisné</span><input class="input" name="ulice" autocomplete="street-address" value="${esc(udaje.ulice)}" /></label>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;margin:14px 0">
          <label class="field" style="margin:0"><span>Město</span><input class="input" name="mesto" autocomplete="address-level2" value="${esc(udaje.mesto)}" /></label>
          <label class="field" style="margin:0"><span>PSČ</span><input class="input" name="psc" autocomplete="postal-code" inputmode="numeric" value="${esc(udaje.psc)}" /></label>
        </div>`;
    else el.innerHTML = "";
    if (typ !== "dorucovaci") el.insertAdjacentHTML("beforeend", '<div style="height:14px"></div>');
  }

  function vykresliSoucty() {
    const zbozi = mezisoucet();
    const d = DOPRAVA[udaje.doprava];
    document.getElementById("soucty").innerHTML = `
      <div><span>Zboží (${pocetKusu()} ks)</span><span>${kc.format(zbozi)}</span></div>
      <div><span>${esc(d.nazev)}</span><span>${d.cena ? kc.format(d.cena) : "Zdarma"}</span></div>
      <div class="total"><span>Celkem</span><span>${kc.format(zbozi + d.cena)}</span></div>`;
  }

  function textObjednavky() {
    const d = DOPRAVA[udaje.doprava];
    const radky = kosik.map((pol, n) => {
      const p = najdiProdukt(pol.id);
      let r = `${n + 1}) ${p.nazev}${pol.barva ? ` – barva: ${pol.barva}` : ""} – ${pol.pocet} ks × ${kc.format(p.cena)} = ${kc.format(p.cena * pol.pocet)}`;
      if (pol.poznamka) r += `\n   Poznámka: ${pol.poznamka}`;
      return r;
    });
    let adresa = "";
    if (d.adresa === "vydejni-misto") adresa = `\nVýdejní místo: ${udaje.misto}`;
    if (d.adresa === "dorucovaci") adresa = `\nAdresa: ${udaje.ulice}, ${udaje.psc} ${udaje.mesto}`;
    return `Dobrý den,

posílám objednávku z webu ${OBCHOD.nazev}:

${radky.join("\n")}

Zboží: ${kc.format(mezisoucet())}
Doprava: ${d.nazev} – ${d.cena ? kc.format(d.cena) : "zdarma"}
Celkem: ${kc.format(mezisoucet() + d.cena)}

Jméno: ${udaje.jmeno}
Telefon: ${udaje.telefon}${adresa}${udaje.poznamka ? `\nPoznámka: ${udaje.poznamka}` : ""}

Prosím o potvrzení objednávky a platební údaje.
Děkuji`;
  }

  function zkontrolujUdaje(form) {
    const chyby = [];
    const pole = [];
    const typ = DOPRAVA[udaje.doprava].adresa;
    if (udaje.jmeno.trim().length < 3) chyby.push("Vyplňte jméno a příjmení."), pole.push("jmeno");
    if (!/^\+?[0-9 ]{9,16}$/.test(udaje.telefon.trim())) chyby.push("Zadejte platné telefonní číslo."), pole.push("telefon");
    if (typ === "vydejni-misto" && udaje.misto.trim().length < 3) chyby.push("Zadejte výdejní místo Zásilkovny."), pole.push("misto");
    if (typ === "dorucovaci") {
      if (udaje.ulice.trim().length < 3) chyby.push("Vyplňte ulici a číslo popisné."), pole.push("ulice");
      if (udaje.mesto.trim().length < 2) chyby.push("Vyplňte město."), pole.push("mesto");
      if (!/^\d{3} ?\d{2}$/.test(udaje.psc.trim())) chyby.push("Zadejte PSČ ve tvaru 123 45."), pole.push("psc");
    }
    form.querySelectorAll(".input").forEach((el) => el.setAttribute("aria-invalid", String(pole.includes(el.name))));
    const box = document.getElementById("chyby");
    box.innerHTML = chyby.map(esc).join("<br />");
    box.hidden = chyby.length === 0;
    if (pole.length) form.querySelector(`[name="${pole[0]}"]`).focus();
    return chyby.length === 0;
  }

  function napojKosik() {
    if (kosik.length === 0) return;
    const form = document.getElementById("objednavka");
    vykresliPolozky();
    vykresliAdresu();
    vykresliSoucty();

    document.getElementById("polozky").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.odebrat !== undefined) {
        kosik.splice(Number(btn.dataset.odebrat), 1);
        ulozKosik();
        if (kosik.length === 0) return zobraz();
      } else if (btn.dataset.zmena) {
        const pol = kosik[Number(btn.dataset.polozka)];
        pol.pocet = Math.max(1, Math.min(MAX_KUSU, pol.pocet + Number(btn.dataset.zmena)));
        ulozKosik();
      }
      vykresliPolozky();
      vykresliSoucty();
    });

    form.addEventListener("input", (e) => {
      if (e.target.name in udaje && e.target.name !== "doprava") udaje[e.target.name] = e.target.value;
    });
    form.addEventListener("change", (e) => {
      if (e.target.name !== "doprava") return;
      udaje.doprava = Number(e.target.value);
      vykresliAdresu();
      vykresliSoucty();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!zkontrolujUdaje(form)) return;
      const predmet = `Objednávka z webu ${OBCHOD.nazev} – ${udaje.jmeno.trim()}`;
      const odkaz = document.createElement("a");
      odkaz.href = `mailto:${OBCHOD.email}?subject=${encodeURIComponent(predmet)}&body=${encodeURIComponent(textObjednavky())}`;
      odkaz.click();
      document.getElementById("po-odeslani").hidden = false;
    });

    document.getElementById("kopirovat").addEventListener("click", async (e) => {
      const text = textObjednavky();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const t = document.createElement("textarea");
        t.value = text;
        document.body.append(t);
        t.select();
        document.execCommand("copy");
        t.remove();
      }
      e.target.textContent = "Zkopírováno ✓";
    });

    document.getElementById("vyprazdnit").addEventListener("click", () => {
      kosik = [];
      ulozKosik();
      toast("Děkujeme za objednávku! Ozveme se vám co nejdříve.");
      location.hash = "";
    });
  }

  function oNas() {
    return `
      <div class="container page prose">
        <h1 class="chrome-text">O nás</h1>
        <p>Jsme Klára a Filip Klaudy. Dlouho jsme přemýšleli, jak spojit naši vášeň pro moderní technologie a ruční práci. Výsledkem je FILARA – naše srdcová záležitost.</p>
        <p>Modely si sami nenavrhujeme. Podporujeme autory koupí jejich licence. To pravé kouzlo jim ale vdechujeme až u nás doma. Vyrábíme pro vás ty nejzajímavější modely, které s maximální pečlivostí tiskneme, ručně malujeme, sestavujeme a ladíme do posledního detailu.</p>
        <h2>Jak pracujeme</h2>
        <ul>
          <li>Tiskneme z PLA filamentu, materiálu vyrobeného z obnovitelných zdrojů, jako je kukuřičný škrob.</li>
          <li>Každý kus ručně dočistíme a zkontrolujeme.</li>
          <li>Některé modely dokreslujeme ručně akvarelem, a tak každý dostane svůj vlastní charakter.</li>
          <li>Výrobky, které máme skladem lze osobně vyzvednout v Salonu Clair (Rýznerova 177/10, Únětice, 252 62).</li>
        </ul>
      </div>`;
  }

  function kontakt() {
    return `
      <div class="container page prose">
        <h1 class="chrome-text">Kontakt</h1>
        <div class="card contact-grid">
          <div><small>E-mail</small><strong><a href="mailto:${esc(OBCHOD.email)}">${esc(OBCHOD.email)}</a></strong></div>
          <div><small>Telefon</small><strong>${esc(OBCHOD.telefon)}</strong></div>
          <div><small>Provozovatel</small><strong>${esc(OBCHOD.nazev)}</strong><br />${esc(OBCHOD.provozovatel)}<br />${esc(OBCHOD.adresa)}</div>
          <div><small>Osobní odběr</small>Salon Clair<br />Rýznerova 177/10, Únětice, 252 62</div>
        </div>
      </div>`;
  }

  function nenalezeno() {
    return `<div class="container page" style="text-align:center"><h1 class="chrome-text">Stránka nenalezena</h1><p class="empty" style="margin:16px 0 32px">Tahle stránka se asi ještě tiskne… nebo neexistuje.</p><a href="#nabidka" class="btn btn-primary">Zpět na nabídku</a></div>`;
  }

  /* ---------- Přepínání stránek ---------- */

  function zobraz() {
    const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [stranka, param] = hash.split("/");
    document.title = `${OBCHOD.nazev} – výrobky z 3D tiskárny`;

    if (!stranka) app.innerHTML = uvod();
    else if (stranka === "nabidka" || stranka === "produkty") {
      app.innerHTML = nabidka(param);
      napojNabidku();
    } else if (stranka === "produkt") {
      app.innerHTML = detail(param);
      napojDetail(param);
    } else if (stranka === "kosik") {
      app.innerHTML = kosikStranka();
      napojKosik();
    } else if (stranka === "o-nas") app.innerHTML = oNas();
    else if (stranka === "kontakt") app.innerHTML = kontakt();
    else app.innerHTML = nenalezeno();

    const aktivni = stranka === "produkt" || stranka === "produkty" ? "nabidka" : stranka;
    document.querySelectorAll(".nav a, .cart-link").forEach((a) => {
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

  // Klik na logo/název vždy vrátí na úvod – i když už na úvodu jsme (odroluje nahoru).
  document.querySelectorAll(".brand").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (location.hash) history.pushState(null, "", location.pathname + location.search);
      posledniAdresa = location.href;
      zobraz();
    }),
  );
  // Změna # vyvolá „popstate“ i „hashchange“ – vykreslíme jen jednou.
  let posledniAdresa = location.href;
  function priZmeneAdresy() {
    if (location.href === posledniAdresa) return;
    posledniAdresa = location.href;
    zobraz();
  }
  // Opakovaný klik na „Nabídka“ v liště, když už nabídku máme otevřenou, ji znovu zamíchá a zruší filtr.
  document.querySelector('.nav a[href="#nabidka"]').addEventListener("click", (e) => {
    if (location.hash !== "#nabidka") return;
    e.preventDefault();
    zobraz();
  });
  window.addEventListener("popstate", priZmeneAdresy);
  window.addEventListener("hashchange", priZmeneAdresy);
  aktualizujPocet();
  zobraz();
})();
