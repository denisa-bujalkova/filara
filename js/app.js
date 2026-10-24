/* Web bez serveru: stránky se přepínají podle části adresy za # (např. index.html#produkt/ohebny-drak).
   Košík se ukládá v prohlížeči (localStorage) a objednávka se odesílá e-mailem přes zákazníkův e-mailový program. */
(function () {
  "use strict";

  const app = document.getElementById("app");
  const kc = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const barvaPodleNazvu = new Map(BARVY.map((b) => [b.nazev, b]));
  const MAX_KUSU = 99;

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

  /** Sklad je v produkty.js buď jedno číslo (skladem: 3), nebo počet pro každou barvu (skladem: { "Bílá": 2 }). */
  function skladPodleBarev(p) {
    return typeof p.skladem === "object" && p.skladem !== null;
  }

  /** Kolik kusů máme skladem. Infinity = řádek skladem u výrobku chybí, počet se nehlídá. */
  function skladem(p, barva) {
    if (p.skladem === undefined || p.skladem === null || p.skladem === "") return Infinity;
    const n = skladPodleBarev(p) ? p.skladem[barva] : p.skladem;
    return Math.max(0, Math.floor(Number(n)) || 0);
  }

  /** Výrobek je celý vyprodaný – skladem: 0, nebo u počtu podle barev nemá kus v žádné barvě. */
  function vyprodano(p) {
    if (!skladPodleBarev(p)) return skladem(p) === 0;
    const barvy = p.barvy && p.barvy.length ? p.barvy : Object.keys(p.skladem);
    return barvy.every((b) => skladem(p, b) === 0);
  }

  /** Velikosti výrobku z produkty.js, např. velikosti: [{ nazev: "S", cena: 290 }, { nazev: "M", cena: 390 }]. */
  function velikostiProduktu(p) {
    return (Array.isArray(p.velikosti) ? p.velikosti : []).filter((v) => v && v.nazev);
  }

  /** Cena ve zvolené velikosti; výrobek bez velikostí má jednu cenu (cena: 150). */
  function cenaProduktu(p, velikost) {
    const vel = velikostiProduktu(p);
    if (!vel.length) return Number(p.cena) || 0;
    return Number((vel.find((v) => v.nazev === velikost) || vel[0]).cena) || 0;
  }

  /** Nejnižší cena – podle ní se řadí a u výrobku s víc velikostmi se ukazuje „od …“. */
  function nejnizsiCena(p) {
    const vel = velikostiProduktu(p);
    return vel.length ? Math.min(...vel.map((v) => Number(v.cena) || 0)) : Number(p.cena) || 0;
  }

  /** Cena (u víc velikostí „od …“), nebo červené „Vyprodáno“ u vyprodaného výrobku. */
  function cenaNeboVyprodano(p) {
    if (vyprodano(p)) return `<span class="sold-out">Vyprodáno</span>`;
    const ruzneCeny = new Set(velikostiProduktu(p).map((v) => Number(v.cena) || 0)).size > 1;
    return (ruzneCeny ? "od " : "") + kc.format(nejnizsiCena(p));
  }

  /** Popis z produkty.js: prázdný řádek = nový odstavec, řádky začínající „- “ = odrážky (text před dvojtečkou
      je tučně), samostatný řádek končící dvojtečkou = mezititulek. */
  function popisHtml(text) {
    const sNazvem = (r) => {
      const m = r.match(/^([^:]{1,40}):\s(.+)$/);
      return m ? `<strong>${esc(m[1])}:</strong> ${esc(m[2])}` : esc(r);
    };
    return String(text || "")
      .trim()
      .split(/\n\s*\n/)
      .map((blok) => {
        const radky = blok.split("\n").map((r) => r.trim()).filter(Boolean);
        if (radky.every((r) => r.startsWith("- "))) return `<ul>${radky.map((r) => `<li>${sNazvem(r.slice(2))}</li>`).join("")}</ul>`;
        if (radky.length === 1 && radky[0].endsWith(":")) return `<h3>${esc(radky[0])}</h3>`;
        if (radky.length === 1) return `<p>${sNazvem(radky[0])}</p>`;
        return `<p>${radky.map(esc).join("<br />")}</p>`;
      })
      .join("");
  }

  /** Kolik kusů ještě jde dát do košíku – odečte kusy, které už v košíku jsou (kromě položky „krome“). */
  function lzePridat(p, barva, krome) {
    const vKosiku = kosik
      .filter((i) => i !== krome && i.id === p.id && (!skladPodleBarev(p) || i.barva === barva))
      .reduce((s, i) => s + i.pocet, 0);
    return Math.max(0, Math.min(MAX_KUSU, skladem(p, barva) - vKosiku));
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

  function platnaVelikost(p, velikost) {
    const vel = velikostiProduktu(p);
    return vel.length ? vel.some((v) => v.nazev === velikost) : !velikost;
  }

  function nactiKosik() {
    try {
      const data = JSON.parse(localStorage.getItem(KLIC_KOSIKU) || "[]");
      return Array.isArray(data) ? data.filter((i) => i && najdiProdukt(i.id) && platnaVelikost(najdiProdukt(i.id), i.velikost)) : [];
    } catch {
      return [];
    }
  }

  let kosik = nactiKosik();

  /** Když v produkty.js ubude kusů skladem, uberou se i z košíku. Vrací true, pokud se košík změnil. */
  function orizniKosik() {
    let zmena = false;
    kosik = kosik.filter((pol) => {
      const max = lzePridat(najdiProdukt(pol.id), pol.barva, pol);
      if (pol.pocet <= max) return true;
      zmena = true;
      pol.pocet = max;
      return max > 0;
    });
    return zmena;
  }

  function ulozKosik() {
    try {
      localStorage.setItem(KLIC_KOSIKU, JSON.stringify(kosik));
    } catch {
      /* úložiště nedostupné – košík vydrží aspoň do zavření stránky */
    }
    aktualizujPocet();
  }

  function klicPolozky(i) {
    return `${i.id}|${i.velikost || ""}|${i.barva || ""}|${(i.poznamka || "").trim()}`;
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
    return kosik.reduce((s, i) => s + cenaProduktu(najdiProdukt(i.id), i.velikost) * i.pocet, 0);
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
          <span class="price">${cenaNeboVyprodano(p)}</span>
          ${barvy.length ? `<span class="dots" aria-label="Barvy: ${barvy.length}">${tecky}${barvy.length > 5 ? `<small>+${barvy.length - 5}</small>` : ""}</span>` : ""}
        </div>
      </div>
    </a>`;
  }

  const ikony = {
    barvy: '<circle cx="8" cy="9" r="4" /><circle cx="16" cy="9" r="4" /><circle cx="12" cy="16" r="4" />',
    srdce: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />',
    stetec: '<path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L13 13.8 10.2 11zM10.2 11c-2.4-.2-4.4 1.6-4.6 4-.1 1.6-.9 2.9-2.6 3.6 2.7 2.1 7.4 2 9.3-.6.9-1.2 1-2.8.7-4.2" />',
    vyzvednuti: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" />',
    kalendar: '<rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />',
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
      .map((src, i) => `<img src="${esc(src)}" alt="" class="${i === 0 ? "aktivni" : ""}" />`)
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

  /** Poslední den trhu („14. 12. 2026“ i „28.–29. 11. 2026“) jako Date (konec dne), nebo null, když jde o jiný zápis. */
  function datumTrhu(text) {
    const m = [...String(text || "").matchAll(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g)].pop();
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 23, 59) : null;
  }

  /** Trhy, kde nás lidé potkají – proběhlé termíny se samy skryjí. */
  function sekceTrhy() {
    const trhy = (typeof TRHY !== "undefined" ? TRHY : []).filter((t) => {
      const d = datumTrhu(t.datum);
      return !d || d >= new Date();
    });
    // Bez nadcházejícího trhu se pruh vůbec neukáže.
    if (!trhy.length) return "";
    return `<section class="container markets-section">
        <div class="card market-banner">
          <div class="market-banner-head">
            <span class="market-banner-icon">${ikona("kalendar")}</span>
            <div><strong>Potkejte nás na trzích</strong><span>Výrobky si u nás můžete prohlédnout a rovnou koupit.</span></div>
          </div>
          <ul class="market-list">${trhy
            .map(
              (t) => `<li>
                <div><strong>${esc(t.nazev)}</strong><span>${[t.datum, t.cas, t.misto].filter(Boolean).map(esc).join(" · ")}</span></div>
                ${t.odkaz ? `<a class="link" href="${esc(t.odkaz)}" target="_blank" rel="noreferrer">Více o akci →</a>` : ""}
              </li>`,
            )
            .join("")}</ul>
        </div>
      </section>`;
  }

  /* ---------- Stránky ---------- */

  function uvod() {
    const doporucene = PRODUKTY.filter((p) => p.doporuceny);
    const vyhody = [
      ["srdce", "Rodinná výroba", "Každý výrobek ručně dočistíme a zkontrolujeme."],
      ["barvy", "Barevné variace", "Většina výrobků k dispozici v několika barvách."],
      ["stetec", "Ruční práce", "Některé výrobky malujeme ručně akvarelem, a tak je každý kus originál."],
      ["vyzvednuti", "Osobní odběr", "Výrobky skladem si můžete vyzvednout v Salonu Clair v Úněticích."],
    ];
    return `
      <section class="hero">
        <div class="container hero-inner">
          <div>
            <h1><span class="chrome-text">Originální 3D výrobky</span><br /><span class="accent-text">vrstvu po vrstvě</span></h1>
            <p>Zvířátka, dekorace, květiny i pomocníky do domácnosti tiskneme na 3D tiskárně z PLA, ručně dočišťujeme a některé i malujeme akvarelem. Koupíte je u nás online s osobním odběrem v Úněticích nebo na trzích. Vyberte si, co vám udělá radost.</p>
          </div>
          <div class="hero-art">${uvodniFotky()}</div>
        </div>
      </section>
      ${sekceTrhy()}
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
      }`;
  }

  // Kategorie je součástí adresy (#nabidka/Zvířata), aby fungovalo tlačítko Zpět.
  // Celá nabídka se při každém otevření zamíchá (Náhodně), kategorie se otevírá seřazená Od nejnovějšího.
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
    if (!stavNabidky.kategorie || stavNabidky.poradi.length !== PRODUKTY.length) zamichej();
    stavNabidky.razeni = stavNabidky.kategorie ? "nejnovejsi" : "nahodne";
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
      "cena-vzestupne": (a, b) => nejnizsiCena(a) - nejnizsiCena(b),
      "cena-sestupne": (a, b) => nejnizsiCena(b) - nejnizsiCena(a),
      nazev: (a, b) => a.nazev.localeCompare(b.nazev, "cs"),
      // Nejnovější = výrobky přidané na konec seznamu v produkty.js.
      nejnovejsi: (a, b) => PRODUKTY.indexOf(b) - PRODUKTY.indexOf(a),
      nahodne: (a, b) => stavNabidky.poradi.indexOf(a.id) - stavNabidky.poradi.indexOf(b.id),
    };
    // Vyprodané výrobky jsou vždy na konci, ať je zvolené jakékoli řazení.
    const podleRazeni = razeni[stavNabidky.razeni] || razeni.nahodne;
    seznam.sort((a, b) => vyprodano(a) - vyprodano(b) || podleRazeni(a, b));
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
    // Vyprodaná barva je přeškrtnutá; předem se vybere první barva, která je skladem.
    const vychozi = barvy.find((b) => skladem(p, b.nazev) > 0) || barvy[0];
    const vyberBarvy = barvy.length
      ? `<p class="swatches-label">Barva: <strong id="nazev-barvy">${esc(vychozi.nazev)}</strong></p>
         <div class="swatches" role="group" aria-label="Barva">${barvy
           .map((b) => {
             const nic = skladem(p, b.nazev) === 0;
             const popis = nic ? `${b.nazev} – vyprodáno` : b.nazev;
             return `<button type="button" class="swatch${nic ? " swatch-vyprodano" : ""}" data-barva="${esc(b.nazev)}" aria-pressed="${b === vychozi}" aria-label="${esc(popis)}" title="${esc(popis)}" style="background:${esc(b.hex)}"></button>`;
           })
           .join("")}</div>`
      : "";
    const velikosti = velikostiProduktu(p);
    const vyberVelikosti = velikosti.length > 1
      ? `<p class="swatches-label">Velikost</p>
         <div class="sizes" role="group" aria-label="Velikost">${velikosti
           .map((v, n) => `<button type="button" class="size" data-velikost="${esc(v.nazev)}" aria-pressed="${n === 0}"><span>${esc(v.nazev)}</span><small>${kc.format(Number(v.cena) || 0)}</small></button>`)
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
            <p class="price" id="cena">${velikosti.length && !vyprodano(p) ? kc.format(cenaProduktu(p)) : cenaNeboVyprodano(p)}</p>
            <dl class="specs">
              <div class="card"><dt>Materiál</dt><dd>${esc(p.material)}</dd></div>
              ${p.rozmery ? `<div class="card"><dt>Rozměry</dt><dd>${esc(p.rozmery)}</dd></div>` : ""}
              ${p.dobaVyroby ? `<div class="card"><dt>Doba výroby</dt><dd>${esc(p.dobaVyroby)}</dd></div>` : ""}
            </dl>
            <div class="card buy">
              ${vyberVelikosti}
              ${vyberBarvy}
              <div class="buy-row">
                <div class="qty">
                  <button type="button" data-zmena="-1" aria-label="Méně">−</button>
                  <output id="pocet" aria-live="polite">1</output>
                  <button type="button" data-zmena="1" aria-label="Více">+</button>
                </div>
                <button type="button" class="btn btn-primary" id="pridat">Přidat do košíku</button>
              </div>
              <p class="hint" id="sklad-info" aria-live="polite" hidden></p>
            </div>
            ${p.popis ? `<div class="detail-desc">${popisHtml(p.popis)}</div>` : ""}
          </div>
        </div>
      </div>`;
  }

  function napojDetail(id) {
    const p = najdiProdukt(id);
    if (!p) return;
    document.title = `${p.nazev} – 3D tisk | ${OBCHOD.nazev}`;

    app.querySelectorAll("[data-foto]").forEach((btn) =>
      btn.addEventListener("click", () => {
        document.getElementById("hlavni-foto").innerHTML = obrazek(p.obrazky[Number(btn.dataset.foto)], p.nazev, 0);
        app.querySelectorAll("[data-foto]").forEach((b) => b.setAttribute("aria-current", String(b === btn)));
      }),
    );

    let barva = app.querySelector('[data-barva][aria-pressed="true"]')?.dataset.barva || null;
    let velikost = velikostiProduktu(p)[0]?.nazev;
    let pocet = 1;
    const vystupPoctu = document.getElementById("pocet");
    const tlacitko = document.getElementById("pridat");
    const info = document.getElementById("sklad-info");

    // Počet kusů nepustí nad zásobu skladem (počítají se i kusy, které už jsou v košíku).
    function obnovPocet() {
      const max = lzePridat(p, barva);
      const malo = pocet > max && skladem(p, barva) < Infinity;
      pocet = Math.max(1, Math.min(max, pocet));
      vystupPoctu.textContent = max ? pocet : 0;
      tlacitko.disabled = max === 0;
      if (max === 0) info.textContent = skladem(p, barva) === 0 ? "Momentálně vyprodáno." : "Všechny kusy, které máme skladem, už máte v košíku.";
      else info.textContent = "Víc kusů teď skladem nemáme.";
      info.hidden = max > 0 && !malo;
    }

    app.querySelectorAll("[data-barva]").forEach((btn) =>
      btn.addEventListener("click", () => {
        barva = btn.dataset.barva;
        document.getElementById("nazev-barvy").textContent = barva;
        app.querySelectorAll("[data-barva]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        obnovPocet();
      }),
    );
    app.querySelectorAll("[data-velikost]").forEach((btn) =>
      btn.addEventListener("click", () => {
        velikost = btn.dataset.velikost;
        app.querySelectorAll("[data-velikost]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        if (!vyprodano(p)) document.getElementById("cena").textContent = kc.format(cenaProduktu(p, velikost));
      }),
    );
    app.querySelectorAll("[data-zmena]").forEach((btn) =>
      btn.addEventListener("click", () => {
        pocet += Number(btn.dataset.zmena);
        obnovPocet();
      }),
    );
    tlacitko.addEventListener("click", () => {
      if (!lzePridat(p, barva)) return obnovPocet();
      pridejDoKosiku({ id: p.id, velikost, barva, pocet, poznamka: "" });
      const upresneni = [velikost, barva].filter(Boolean).join(", ");
      toast(`Přidáno do košíku: ${esc(p.nazev)}${upresneni ? ` (${esc(upresneni)})` : ""} × ${pocet} <a href="#kosik">Zobrazit košík →</a>`);
      pocet = 1;
      obnovPocet();
    });
    obnovPocet();
  }

  /* ---------- Košík a objednávka ---------- */

  // Rozepsané údaje zákazníka – zůstanou vyplněné i po změně počtu kusů.
  const udaje = { jmeno: "", email: "", telefon: "", doprava: 0, misto: "", ulice: "", mesto: "", psc: "", poznamka: "" };

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
            <p class="hint" style="margin:0 0 12px">Údaje označené <span class="povinne">*</span> jsou povinné.</p>
            <label class="field"><span>Jméno a příjmení <span class="povinne">*</span></span><input class="input" name="jmeno" autocomplete="name" value="${esc(udaje.jmeno)}" /></label>
            <label class="field"><span>E-mail <span class="povinne">*</span></span><input class="input" name="email" type="email" autocomplete="email" placeholder="vas@email.cz" value="${esc(udaje.email)}" /></label>
            <label class="field"><span>Telefon <span class="povinne">*</span></span><input class="input" name="telefon" type="tel" autocomplete="tel" placeholder="+420 123 456 789" value="${esc(udaje.telefon)}" /></label>
            <fieldset class="radio-list" style="margin-top:16px"><legend>Doprava <span class="povinne">*</span></legend>${dopravy}</fieldset>
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
            <div class="cart-item-top"><a href="#produkt/${encodeURIComponent(p.id)}">${esc(p.nazev)}</a><span>${kc.format(cenaProduktu(p, pol.velikost) * pol.pocet)}</span></div>
            ${pol.velikost ? `<div class="cart-item-meta">Velikost: ${esc(pol.velikost)}</div>` : ""}
            ${pol.barva ? `<div class="cart-item-meta"><i style="background:${esc(b ? b.hex : "#888")}"></i>${esc(pol.barva)}</div>` : ""}
            ${pol.poznamka ? `<div class="cart-item-note">„${esc(pol.poznamka)}“</div>` : ""}
            <div class="cart-item-actions">
              <div class="qty qty-small">
                <button type="button" data-polozka="${n}" data-zmena="-1" aria-label="Méně">−</button>
                <output>${pol.pocet}</output>
                <button type="button" data-polozka="${n}" data-zmena="1" aria-label="Více" ${pol.pocet >= lzePridat(p, pol.barva, pol) ? 'disabled title="Víc kusů skladem nemáme"' : ""}>+</button>
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
      el.innerHTML = `<label class="field"><span>Výdejní místo Zásilkovny <span class="povinne">*</span></span><input class="input" name="misto" value="${esc(udaje.misto)}" placeholder="Např. Praha 4, Budějovická 15 – Albert" /></label>
        <p class="hint" style="margin-bottom:14px">Výdejní místo najdete na <a class="link" href="https://www.zasilkovna.cz/pobocky" target="_blank" rel="noreferrer">zasilkovna.cz/pobocky</a>.</p>`;
    else if (typ === "dorucovaci")
      el.innerHTML = `<label class="field"><span>Ulice a číslo popisné <span class="povinne">*</span></span><input class="input" name="ulice" autocomplete="street-address" value="${esc(udaje.ulice)}" /></label>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;margin:14px 0">
          <label class="field" style="margin:0"><span>Město <span class="povinne">*</span></span><input class="input" name="mesto" autocomplete="address-level2" value="${esc(udaje.mesto)}" /></label>
          <label class="field" style="margin:0"><span>PSČ <span class="povinne">*</span></span><input class="input" name="psc" autocomplete="postal-code" inputmode="numeric" value="${esc(udaje.psc)}" /></label>
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
      const cena = cenaProduktu(p, pol.velikost);
      let r = `${n + 1}) ${p.nazev}${pol.velikost ? ` – velikost: ${pol.velikost}` : ""}${pol.barva ? ` – barva: ${pol.barva}` : ""} – ${pol.pocet} ks × ${kc.format(cena)} = ${kc.format(cena * pol.pocet)}`;
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
E-mail: ${udaje.email}
Telefon: ${udaje.telefon}${adresa}${udaje.poznamka ? `\nPoznámka: ${udaje.poznamka}` : ""}

Prosím o potvrzení objednávky a platební údaje.
Děkuji`;
  }

  function zkontrolujUdaje(form) {
    const chyby = [];
    const pole = [];
    const typ = DOPRAVA[udaje.doprava].adresa;
    if (udaje.jmeno.trim().length < 3) chyby.push("Vyplňte jméno a příjmení."), pole.push("jmeno");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(udaje.email.trim())) chyby.push("Zadejte platný e-mail."), pole.push("email");
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
        pol.pocet = Math.max(1, Math.min(lzePridat(najdiProdukt(pol.id), pol.barva, pol), pol.pocet + Number(btn.dataset.zmena)));
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
        <div class="o-nas">
          <div class="o-nas-foto"><img src="obrazky/o-nas.jpg" alt="Klára a Filip z dílny FILARA s rodinou" /></div>
          <div class="o-nas-text">
            <p>Jsme malá česká značka, která vznikla z nadšení pro 3D tisk a touhy přenášet do bězných dnů trochu radosti, hravosti a stylové elegance.</p>
            <p>Každý kousek, který u nás najdete od roztomilých flexibilních zvířátek přes svítící dekorace až po minimalistické doplňky, prochází našima rukama. Záleží nám na tom, aby naše výrobky nebyly jen obyčejnými plastovými předměty. Proto si dáváme záležet s výběrem materiálů, dolaďujeme detaily a u mnoha modelů osobně ručně malujeme oči i drobné prvky, aby měl každou kousek svou vlastní duši a charakter.</p>
            <p>Záleží nám i na přírodě, proto tiskneme výhradně z ekologického PLA plastu, který se vyrábí z obnovitelných zdrojů, jako je kukuřičný škrob. Je lehký, pevný a šetrný k životnímu prostředí.</p>
            <p>Filara je náš srdeční projekt a největší odměnou pro nás je, když náš výrobek vykouzlí úsměv na tváři vám nebo někomu, komu ho darujete.</p>
            <p>Děkujeme, že jste součástí našeho příběhu! ✨</p>
          </div>
        </div>
      </div>`;
  }

  /** Odkaz na Instagram – jen bílá ikonka (jméno účtu je v popisku pro myš a čtečky); v produkty.js stačí jméno účtu (s @ i bez, nebo celá adresa). */
  function odkazInstagram() {
    const ucet = String(OBCHOD.instagram || "")
      .trim()
      .replace(/^@/, "")
      .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
      .replace(/\/.*$/, "");
    return `<a class="instagram" aria-label="Instagram @${esc(ucet)}" title="Instagram @${esc(ucet)}" href="https://www.instagram.com/${encodeURIComponent(ucet)}/" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg></a>`;
  }

  function kontakt() {
    const adresaMapy = encodeURIComponent("Salon Clair, " + OBCHOD.adresa);
    // Na mobilu se po klepnutí na číslo rovnou volá.
    const telefonOdkaz = "tel:" + String(OBCHOD.telefon).replace(/[^\d+]/g, "");
    return `
      <div class="container page prose">
        <h1 class="chrome-text">Kontakt</h1>
        <div class="card kontakt">
          <div class="kontakt-udaje">
            <div><strong>Filara 3D print</strong><br />${esc(OBCHOD.adresa)}</div>
            <div><strong>Telefon</strong><br /><a href="${telefonOdkaz}">${esc(String(OBCHOD.telefon).replace(/^\+420\s*/, ""))}</a></div>
            <div><strong>E-mail</strong><br /><a href="mailto:${esc(OBCHOD.email)}">${esc(OBCHOD.email)}</a></div>
            ${OBCHOD.instagram ? `<div><strong>Instagram</strong><br />${odkazInstagram()}</div>` : ""}
          </div>
          <div class="mapa">
            <iframe src="https://maps.google.com/maps?q=${adresaMapy}&output=embed" title="Mapa – Salon Clair, ${esc(OBCHOD.adresa)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>`;
  }

  function nenalezeno() {
    return `<div class="container page" style="text-align:center"><h1 class="chrome-text">Stránka nenalezena</h1><p class="empty" style="margin:16px 0 32px">Tahle stránka se asi ještě tiskne… nebo neexistuje.</p><a href="#nabidka" class="btn btn-primary">Zpět na nabídku</a></div>`;
  }

  /* ---------- Přepínání stránek ---------- */

  function zobraz() {
    // Poškozená adresa (např. ručně přepsané %) nesmí shodit celý web – ukáže se „Stránka nenalezena“.
    let hash;
    try {
      hash = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    } catch {
      hash = "nenalezeno";
    }
    const [stranka, param] = hash.split("/");
    document.title = `${OBCHOD.nazev} – 3D tisk Únětice | dekorace, zvířátka a dárky z 3D tiskárny`;
    if (orizniKosik()) {
      ulozKosik();
      toast("Některé kusy už nemáme skladem, proto jsme je z košíku ubrali.");
    }

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
  document.querySelectorAll("[data-shop-instagram]").forEach((el) => {
    el.hidden = !OBCHOD.instagram;
    if (OBCHOD.instagram) el.innerHTML = odkazInstagram();
  });
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
