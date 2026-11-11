/* Správa obchodu FILARA (admin.html): přihlášení s dvoufázovým ověřením, objednávky, „Čeká na platbu“, sklad.
   Data chrání databáze: tabulky objednávek a nastavení čte jen admin zapsaný v tabulce admini
   a přihlášený s druhým faktorem (je_admin() kontroluje aal2). Tato stránka jen ukazuje, co databáze pustí. */
(function () {
  "use strict";

  const el = document.getElementById("admin");
  const menu = document.getElementById("admin-menu");
  const odhlasit = document.getElementById("odhlasit");
  const kc = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

  const STAVY = {
    nova: "Nová – čeká na platbu",
    zaplacena: "Zaplacená",
    ve_vyrobe: "Ve výrobě",
    odeslana: "Odeslaná",
    vyrizena: "Vyřízená",
    zrusena: "Zrušená",
  };
  const STAVY_KRATCE = { ...STAVY, nova: "Čeká na platbu" };

  function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  /** Datum a čas po česku v pražském čase. */
  function kdy(iso, sCasem = true) {
    if (!iso) return "";
    const d = new Date(iso);
    const den = d.toLocaleDateString("cs-CZ", { timeZone: "Europe/Prague", day: "numeric", month: "numeric", year: "numeric" });
    return sCasem ? `${den} ${d.toLocaleTimeString("cs-CZ", { timeZone: "Europe/Prague", hour: "2-digit", minute: "2-digit" })}` : den;
  }

  let casovacToastu;
  function toast(text) {
    const t = document.getElementById("toast");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(casovacToastu);
    casovacToastu = setTimeout(() => (t.hidden = true), 4000);
  }

  /** Srozumitelná věta k chybě z databáze nebo spojení. */
  function chybaText(e) {
    if (!e) return "";
    if (e.hint) return e.hint;
    if (/permission denied|JWT|not authorized|row-level/i.test(e.message || "")) return "Na tuto akci nemáte oprávnění. Přihlaste se prosím znovu.";
    if (!e.code) return "Spojení s databází teď nefunguje. Zkuste to prosím za chvíli znovu.";
    return `Akce se nepodařila (${e.message}).`;
  }

  /* ---------- Připojení ---------- */

  let sb = null;
  try {
    const c = window.FILARA_CONFIG || {};
    if (!window.supabase || !c.supabaseUrl || !c.supabaseKey || /DOPLNIT/.test(c.supabaseUrl + c.supabaseKey)) throw new Error("chybí připojení");
    // Admin se přihlašuje, takže přihlášení si pamatuje (zvlášť od veřejného webu).
    sb = window.supabase.createClient(c.supabaseUrl, c.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "filara-admin-prihlaseni" },
    });
  } catch {
    el.innerHTML = `<div class="container page"><div class="card admin-prihlaseni"><h1 class="chrome-text">Správa obchodu</h1>
      <p class="error-box">Chybí připojení k databázi (soubor js/config.js) nebo se nenačetla knihovna Supabase.</p></div></div>`;
    return;
  }

  /** Dotaz do databáze; při chybě ukáže hlášku a vyhodí výjimku. */
  async function dotaz(slib) {
    const { data, error } = await slib;
    if (error) {
      toast(chybaText(error));
      throw error;
    }
    return data;
  }

  /* ---------- Přihlášení a dvoufázové ověření ---------- */

  let jeAdmin = false;

  function stranka(obsah) {
    el.innerHTML = `<div class="container page">${obsah}</div>`;
  }

  function ukazMenu(ano) {
    menu.hidden = !ano;
    odhlasit.hidden = !ano && !jePrihlasen;
  }
  let jePrihlasen = false;

  async function start() {
    jeAdmin = false;
    const { data } = await sb.auth.getSession();
    jePrihlasen = !!data.session;
    if (!data.session) return prihlaseni();
    return druhyFaktor();
  }

  function prihlaseni(chyba = "") {
    jePrihlasen = false;
    ukazMenu(false);
    stranka(`
      <form class="card admin-prihlaseni" id="prihlaseni" novalidate>
        <h1 class="chrome-text">Správa obchodu</h1>
        ${chyba ? `<p class="error-box" role="alert">${esc(chyba)}</p>` : ""}
        <label class="field"><span>E-mail</span><input class="input" name="email" type="email" autocomplete="username" required /></label>
        <label class="field"><span>Heslo</span><input class="input" name="heslo" type="password" autocomplete="current-password" required /></label>
        <button type="submit" class="btn btn-primary btn-block">Přihlásit</button>
        <p class="hint">Účty zakládá jen správce v Supabase, registrace tu není.</p>
      </form>`);
    const form = document.getElementById("prihlaseni");
    form.elements.email.focus();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email: form.elements.email.value.trim(), password: form.elements.heslo.value });
      btn.disabled = false;
      if (error) return prihlaseni(error.code ? "Nesprávný e-mail nebo heslo." : "Spojení s databází teď nefunguje. Zkuste to prosím znovu.");
      jePrihlasen = true;
      druhyFaktor();
    });
  }

  async function druhyFaktor() {
    ukazMenu(false);
    odhlasit.hidden = false;
    const uroven = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (uroven.data?.currentLevel === "aal2") return overAdmina();
    const faktory = await sb.auth.mfa.listFactors();
    if (faktory.error) return prihlaseni("Přihlášení vypršelo. Přihlaste se prosím znovu.");
    const overene = faktory.data.totp || [];
    if (overene.length) return zadejKod(overene[0].id);
    return nastavFaktor(faktory.data.all || []);
  }

  function formularKodu(nadpis, uvod, factorId, extra = "") {
    stranka(`
      <form class="card admin-prihlaseni" id="kod-form" novalidate>
        <h1 class="chrome-text">${nadpis}</h1>
        <p>${uvod}</p>
        ${extra}
        <p class="error-box" id="kod-chyba" role="alert" hidden></p>
        <label class="field"><span>Šestimístný kód z aplikace</span>
          <input class="input admin-kod" name="kod" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required /></label>
        <button type="submit" class="btn btn-primary btn-block">Ověřit</button>
      </form>`);
    const form = document.getElementById("kod-form");
    form.elements.kod.focus();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const kod = form.elements.kod.value.replace(/\D/g, "");
      const chyba = document.getElementById("kod-chyba");
      if (kod.length !== 6) {
        chyba.textContent = "Zadejte prosím šest číslic z aplikace.";
        chyba.hidden = false;
        return;
      }
      const btn = form.querySelector("button");
      btn.disabled = true;
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: kod });
      btn.disabled = false;
      if (error) {
        chyba.textContent = error.code ? "Kód nesouhlasí nebo už vypršel. Zadejte prosím aktuální kód z aplikace." : "Spojení s databází teď nefunguje. Zkuste to prosím znovu.";
        chyba.hidden = false;
        form.elements.kod.value = "";
        form.elements.kod.focus();
        return;
      }
      overAdmina();
    });
  }

  function zadejKod(factorId) {
    formularKodu("Dvoufázové ověření", "Otevřete v telefonu ověřovací aplikaci (např. Google Authenticator) a opište kód pro FILARA.", factorId);
  }

  async function nastavFaktor(vsechny) {
    // Nedokončené nastavení z minula zahodit, jinak by nové nešlo založit.
    for (const f of vsechny.filter((f) => f.factor_type === "totp" && f.status !== "verified")) await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `FILARA ${new Date().toISOString().slice(0, 16)}` });
    if (error) return prihlaseni("Dvoufázové ověření se nepodařilo nastavit. Zkuste to prosím znovu, případně ověřte, že je v Supabase zapnuté (Authentication → Multi-Factor).");
    formularKodu(
      "Nastavení dvoufázového ověření",
      "Bez druhého faktoru do správy nejde. Nainstalujte si do telefonu ověřovací aplikaci (Google Authenticator, Microsoft Authenticator…), naskenujte v ní tento QR kód a opište kód, který aplikace ukáže.",
      data.id,
      `<img class="admin-qr" src="${esc(data.totp.qr_code)}" alt="QR kód pro ověřovací aplikaci" />
       <p class="hint">Nejde QR kód naskenovat? Zadejte do aplikace ručně tento klíč:</p>
       <code class="admin-tajny-kod">${esc(data.totp.secret)}</code>`,
    );
  }

  async function overAdmina() {
    const { data, error } = await sb.rpc("je_admin");
    if (error) return prihlaseni(chybaText(error));
    if (data !== true) {
      ukazMenu(false);
      odhlasit.hidden = false;
      return stranka(`<div class="card admin-prihlaseni"><h1 class="chrome-text">Správa obchodu</h1>
        <p class="error-box">Tento účet nemá oprávnění ke správě obchodu.</p>
        <p class="hint">Oprávnění přiděluje správce zápisem do tabulky admini v Supabase.</p></div>`);
    }
    jeAdmin = true;
    jePrihlasen = true;
    ukazMenu(true);
    zobraz();
  }

  odhlasit.addEventListener("click", async () => {
    await sb.auth.signOut();
    jeAdmin = false;
    location.hash = "";
    prihlaseni();
  });

  sb.auth.onAuthStateChange((udalost) => {
    if (udalost === "SIGNED_OUT" && jeAdmin) {
      jeAdmin = false;
      prihlaseni("Byli jste odhlášeni. Přihlaste se prosím znovu.");
    }
  });

  /* ---------- Přepínání stránek ---------- */

  function zobraz() {
    if (!jeAdmin) return;
    const [str, param] = location.hash.replace(/^#\/?/, "").split("/");
    const aktivni = str === "objednavka" ? "objednavky" : str || "platby";
    menu.querySelectorAll("a").forEach((a) => (a.getAttribute("href") === `#${aktivni}` ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    if (str === "objednavky") return seznamObjednavek();
    if (str === "objednavka") return detailObjednavky(Number(param));
    if (str === "sklad") return sklad();
    return cekaNaPlatbu();
  }
  window.addEventListener("hashchange", zobraz);

  function stavHtml(stav) {
    return `<span class="stav stav-${esc(stav)}">${esc(STAVY_KRATCE[stav] || stav)}</span>`;
  }

  function poSplatnosti(o) {
    return o.stav === "nova" && new Date(o.splatnost) < new Date();
  }

  /* ---------- Čeká na platbu ---------- */

  async function cekaNaPlatbu() {
    stranka(`<h1 class="chrome-text">Čeká na platbu</h1><p class="admin-prazdne">Načítám…</p>`);
    let seznam;
    try {
      seznam = await dotaz(
        sb.from("objednavky").select("cislo,stav,vytvoreno,splatnost,jmeno,email,telefon,cena_celkem").eq("stav", "nova").order("vytvoreno", { ascending: true }),
      );
    } catch {
      return;
    }
    stranka(`
      <h1 class="chrome-text">Čeká na platbu</h1>
      <p class="hint" style="margin:-8px 0 16px">Nezaplacené objednávky od nejstarší. Platbu poznáte podle variabilního symbolu (= číslo objednávky) a částky.</p>
      ${
        seznam.length
          ? `<ul class="admin-seznam">${seznam
              .map(
                (o) => `<li class="card admin-karta">
              <a class="admin-karta-odkaz" href="#objednavka/${o.cislo}">
                <div class="admin-karta-hlavicka"><h2>Objednávka ${o.cislo}</h2><strong>${kc.format(o.cena_celkem)}</strong></div>
                <p class="admin-meta">${esc(o.jmeno)} · ${esc(o.email)}${o.telefon ? ` · ${esc(o.telefon)}` : ""}</p>
                <p class="admin-meta">Objednáno ${kdy(o.vytvoreno)} · splatnost <span class="${poSplatnosti(o) ? "po-splatnosti" : ""}">${kdy(o.splatnost, false)}${poSplatnosti(o) ? " – po splatnosti" : ""}</span></p>
              </a>
              <div class="admin-akce"><button type="button" class="btn btn-primary" data-zaplaceno="${o.cislo}" data-castka="${o.cena_celkem}">Označit jako zaplaceno</button></div>
            </li>`,
              )
              .join("")}</ul>`
          : `<p class="admin-prazdne">Žádná objednávka nečeká na platbu.</p>`
      }`);
    el.querySelectorAll("[data-zaplaceno]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const cislo = Number(btn.dataset.zaplaceno);
        if (!confirm(`Označit objednávku ${cislo} (${kc.format(Number(btn.dataset.castka))}) jako zaplacenou?`)) return;
        btn.disabled = true;
        try {
          await zmenStav(cislo, "zaplacena");
          toast(`Objednávka ${cislo} je zaplacená.`);
        } catch {
          btn.disabled = false;
          return;
        }
        cekaNaPlatbu();
      }),
    );
  }

  async function zmenStav(cislo, stav) {
    const data = await dotaz(sb.from("objednavky").update({ stav }).eq("cislo", cislo).select("cislo,stav"));
    if (!data || !data.length) {
      toast("Objednávku se nepodařilo změnit. Obnovte prosím stránku.");
      throw new Error("nezměněno");
    }
    return data[0];
  }

  /* ---------- Objednávky ---------- */

  const filtr = { stav: "", hledat: "" };

  async function seznamObjednavek() {
    stranka(`
      <h1 class="chrome-text">Objednávky</h1>
      <form class="admin-filtr" id="filtr" role="search">
        <select class="input" name="stav" aria-label="Stav">
          <option value="">Všechny stavy</option>
          ${Object.entries(STAVY).map(([k, v]) => `<option value="${k}" ${filtr.stav === k ? "selected" : ""}>${esc(v)}</option>`).join("")}
        </select>
        <input class="input" name="hledat" type="search" placeholder="Číslo, jméno nebo e-mail" value="${esc(filtr.hledat)}" aria-label="Hledat" />
        <button type="submit" class="btn btn-secondary">Hledat</button>
      </form>
      <div id="vysledky"><p class="admin-prazdne">Načítám…</p></div>`);
    const form = document.getElementById("filtr");
    form.elements.stav.addEventListener("change", () => form.requestSubmit());
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      filtr.stav = form.elements.stav.value;
      filtr.hledat = form.elements.hledat.value.trim();
      nactiSeznam();
    });
    nactiSeznam();
  }

  async function nactiSeznam() {
    let d = sb.from("objednavky").select("cislo,stav,vytvoreno,splatnost,jmeno,email,cena_celkem");
    if (filtr.stav) d = d.eq("stav", filtr.stav);
    // Znaky, které mají ve filtru zvláštní význam, se z hledaného textu vynechají.
    const h = filtr.hledat.replace(/[,()*\\%:"]/g, " ").trim();
    if (/^\d{1,10}$/.test(h)) d = d.or(`cislo.eq.${h},telefon.ilike.*${h}*`);
    else if (h) d = d.or(`jmeno.ilike.*${h}*,email.ilike.*${h}*`);
    d = d.order("vytvoreno", { ascending: false }).limit(200);
    let seznam;
    try {
      seznam = await dotaz(d);
    } catch {
      return;
    }
    const cil = document.getElementById("vysledky");
    if (!cil) return;
    cil.innerHTML = seznam.length
      ? `<ul class="admin-seznam">${seznam
          .map(
            (o) => `<li class="card admin-karta"><a class="admin-karta-odkaz" href="#objednavka/${o.cislo}">
            <div class="admin-karta-hlavicka"><h2>Objednávka ${o.cislo}</h2>${stavHtml(o.stav)}</div>
            <p class="admin-meta">${esc(o.jmeno)} · ${esc(o.email)} · <strong>${kc.format(o.cena_celkem)}</strong></p>
            <p class="admin-meta">Objednáno ${kdy(o.vytvoreno)}${poSplatnosti(o) ? ` · <span class="po-splatnosti">po splatnosti</span>` : ""}</p>
          </a></li>`,
          )
          .join("")}</ul>${seznam.length === 200 ? `<p class="hint">Ukazujeme 200 nejnovějších. Pro starší upřesněte hledání.</p>` : ""}`
      : `<p class="admin-prazdne">Žádná objednávka neodpovídá.</p>`;
  }

  async function detailObjednavky(cislo) {
    stranka(`<p class="admin-prazdne">Načítám…</p>`);
    let o, polozky;
    try {
      [o, polozky] = await Promise.all([
        dotaz(sb.from("objednavky").select("*").eq("cislo", cislo).limit(1)).then((x) => x[0]),
        dotaz(sb.from("polozky_objednavky").select("*").eq("cislo", cislo).order("poradi", { ascending: true })),
      ]);
    } catch {
      return;
    }
    if (!o) return stranka(`<p class="admin-prazdne">Objednávka ${esc(cislo)} neexistuje.</p><p style="text-align:center"><a class="link" href="#objednavky">← Zpět na objednávky</a></p>`);
    const zrusena = o.stav === "zrusena";
    stranka(`
      <p><a class="link" href="#objednavky">← Objednávky</a></p>
      <div class="admin-karta-hlavicka" style="margin-bottom:16px"><h1 class="chrome-text" style="margin:0">Objednávka ${o.cislo}</h1>${stavHtml(o.stav)}</div>
      <div class="admin-detail">
        <section class="card">
          <h2>Položky</h2>
          <ul class="admin-polozky">${polozky
            .map((p) => {
              const upr = [
                p.nazev_moznosti ? `${p.typ_moznosti || "Velikost"}: ${p.nazev_moznosti}` : "",
                p.nazev_barvy ? `barva: ${p.nazev_barvy}` : "",
                (p.sada || []).length ? `barvy: ${p.sada.map((k) => `${k.kus}: ${k.barva}`).join(", ")}` : "",
              ].filter(Boolean);
              return `<li><div><strong>${esc(p.nazev_produktu)}</strong>${upr.length ? `<span>${esc(upr.join(", "))}</span>` : ""}${p.poznamka ? `<span>„${esc(p.poznamka)}“</span>` : ""}</div>
                <div style="text-align:right;flex-shrink:0"><span>${p.pocet} × ${kc.format(p.cena_za_kus)}</span><strong>${kc.format(p.cena_celkem)}</strong></div></li>`;
            })
            .join("")}</ul>
          <dl class="admin-udaje" style="margin-top:12px">
            <div><dt>Zboží</dt><dd>${kc.format(o.cena_zbozi)}</dd></div>
            <div><dt>${esc(o.doprava_nazev)}</dt><dd>${o.doprava_cena ? kc.format(o.doprava_cena) : "Zdarma"}</dd></div>
            <div><dt>Celkem</dt><dd>${kc.format(o.cena_celkem)}</dd></div>
          </dl>
        </section>

        <section class="card">
          <h2>Stav</h2>
          ${
            zrusena
              ? `<p>Objednávka je zrušená.${o.zasoby_vraceny ? " Kusy se vrátily do prodeje." : ""} Zrušení nejde vrátit zpět.</p>`
              : `<label class="field"><span>Změnit stav</span><select class="input" id="novy-stav">${Object.entries(STAVY)
                  .map(([k, v]) => `<option value="${k}" ${o.stav === k ? "selected" : ""}>${esc(v)}</option>`)
                  .join("")}</select></label>
                 <div class="admin-akce"><button type="button" class="btn btn-primary" id="ulozit-stav">Uložit stav</button></div>
                 <p class="hint">Při zrušení se odečtené kusy vrátí do prodeje. Zrušení nejde vrátit zpět.</p>`
          }
          <dl class="admin-udaje" style="margin-top:14px">
            <div><dt>Objednáno</dt><dd>${kdy(o.vytvoreno)}</dd></div>
            ${o.zaplaceno ? `<div><dt>Zaplaceno</dt><dd>${kdy(o.zaplaceno)}</dd></div>` : ""}
          </dl>
        </section>

        <section class="card">
          <h2>Platba</h2>
          <dl class="admin-udaje">
            <div><dt>Částka</dt><dd>${kc.format(o.cena_celkem)}</dd></div>
            <div><dt>Variabilní symbol</dt><dd>${o.cislo}</dd></div>
            <div><dt>Účet</dt><dd>${esc(o.cislo_uctu)}</dd></div>
            <div><dt>Splatnost</dt><dd class="${poSplatnosti(o) ? "po-splatnosti" : ""}">${kdy(o.splatnost)}${poSplatnosti(o) ? " – po splatnosti" : ""}</dd></div>
          </dl>
          ${
            o.stav === "nova"
              ? `<div class="admin-akce">
                  <button type="button" class="btn btn-secondary" data-prodlouzit="1">Prodloužit o 1 pracovní den</button>
                  <button type="button" class="btn btn-secondary" data-prodlouzit="3">o 3 pracovní dny</button>
                </div>`
              : ""
          }
        </section>

        <section class="card">
          <h2>Zákazník</h2>
          <dl class="admin-udaje">
            <div><dt>Jméno</dt><dd>${esc(o.jmeno)}</dd></div>
            <div><dt>E-mail</dt><dd><a class="link" href="mailto:${esc(o.email)}">${esc(o.email)}</a></dd></div>
            ${o.telefon ? `<div><dt>Telefon</dt><dd><a class="link" href="tel:${esc(String(o.telefon).replace(/[^\d+]/g, ""))}">${esc(o.telefon)}</a></dd></div>` : ""}
            <div><dt>Doprava</dt><dd>${esc(o.doprava_nazev)}</dd></div>
            ${o.zasilkovna_nazev ? `<div><dt>Výdejní místo</dt><dd>${esc(o.zasilkovna_nazev)}</dd></div>` : ""}
          </dl>
          ${o.poznamka_zakaznika ? `<p class="hint" style="margin-top:12px">Poznámka zákazníka:</p><p class="admin-poznamka">${esc(o.poznamka_zakaznika)}</p>` : ""}
        </section>

        <section class="card">
          <h2>Interní poznámka</h2>
          <label class="field"><span>Vidíte ji jen vy, zákazník ne.</span><textarea class="input" id="poznamka-admin" maxlength="2000">${esc(o.poznamka_admin)}</textarea></label>
          <div class="admin-akce"><button type="button" class="btn btn-secondary" id="ulozit-poznamku">Uložit poznámku</button></div>
        </section>
      </div>`);

    document.getElementById("ulozit-stav")?.addEventListener("click", async (e) => {
      const stav = document.getElementById("novy-stav").value;
      if (stav === o.stav) return toast("Stav je beze změny.");
      if (stav === "zrusena" && !confirm(`Opravdu zrušit objednávku ${o.cislo}? Kusy se vrátí do prodeje a zrušení nejde vrátit zpět.`)) return;
      e.target.disabled = true;
      try {
        await zmenStav(o.cislo, stav);
        toast(`Stav změněn: ${STAVY[stav]}.`);
      } catch {
        e.target.disabled = false;
        return;
      }
      detailObjednavky(o.cislo);
    });
    el.querySelectorAll("[data-prodlouzit]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          const nova = await dotaz(sb.rpc("prodluz_splatnost", { p_cislo: o.cislo, p_pracovni_dny: Number(btn.dataset.prodlouzit) }));
          toast(`Nová splatnost: ${kdy(nova)}.`);
        } catch {
          btn.disabled = false;
          return;
        }
        detailObjednavky(o.cislo);
      }),
    );
    document.getElementById("ulozit-poznamku").addEventListener("click", async (e) => {
      e.target.disabled = true;
      try {
        await dotaz(sb.from("objednavky").update({ poznamka_admin: document.getElementById("poznamka-admin").value }).eq("cislo", o.cislo).select("cislo"));
        toast("Poznámka uložena.");
      } catch {
        /* hláška už je venku */
      }
      e.target.disabled = false;
    });
  }

  /* ---------- Sklad ---------- */

  let hledatSklad = "";

  async function sklad() {
    const posun = window.scrollY;
    if (!document.getElementById("sklad-seznam")) stranka(`<h1 class="chrome-text">Sklad</h1><p class="admin-prazdne">Načítám…</p>`);
    let produkty, barvy, pb, zasoby, poznamky, kusy, kusBarvy;
    try {
      [produkty, barvy, pb, zasoby, poznamky, kusy, kusBarvy] = await Promise.all([
        dotaz(sb.from("produkty").select("id,nazev,rezim_zasob,vyprodano_rucne,vyprodano_nabidnout_vyrobu,aktivni")),
        dotaz(sb.from("barvy").select("id,nazev,hex,poradi").order("poradi", { ascending: true })),
        dotaz(sb.from("produkt_barvy").select("produkt_id,barva_id,poradi,vyprodano_rucne,vyprodano_nabidnout_vyrobu").order("poradi", { ascending: true })),
        dotaz(sb.from("zasoby").select("produkt_id,barva_id,pocet")),
        dotaz(sb.from("vyprodano_poznamky").select("produkt_id,barva_id,poznamka")),
        dotaz(sb.from("sada_kusy").select("id,produkt_id")),
        dotaz(sb.from("sada_kus_barvy").select("kus_id,barva_id")),
      ]);
    } catch {
      return;
    }
    const barva = new Map(barvy.map((b) => [b.id, b]));
    const pocet = (p, b) => zasoby.find((z) => z.produkt_id === p && (z.barva_id ?? null) === (b ?? null))?.pocet ?? 0;
    const poznamka = (p, b) => poznamky.find((z) => z.produkt_id === p && (z.barva_id ?? null) === (b ?? null))?.poznamka ?? "";
    produkty.sort((a, b) => a.nazev.localeCompare(b.nazev, "cs"));

    const radek = (p, b, nazev, hex) => {
      const n = pocet(p.id, b);
      return `<div class="sklad-radek">
        <span class="sklad-nazev">${hex ? `<i style="background:${esc(hex)}"></i>` : ""}${esc(nazev)}</span>
        <button type="button" class="sklad-tlacitko" data-zmena="-1" data-produkt="${esc(p.id)}" data-barva="${b ?? ""}" aria-label="${esc(nazev)}: o kus méně">−1</button>
        <output class="sklad-pocet${n === 0 ? " nula" : ""}" data-pocet="${esc(p.id)}|${b ?? ""}">${n}</output>
        <button type="button" class="sklad-tlacitko" data-zmena="1" data-produkt="${esc(p.id)}" data-barva="${b ?? ""}" aria-label="${esc(nazev)}: o kus víc">+1</button>
      </div>`;
    };

    const vyprodanoHtml = (p, b, nazev, vyprodano, nabidnout) => `
      <details class="admin-vyprodano">
        <summary>Ručně vyprodáno${b ? `: ${esc(nazev)}` : ""}${vyprodano ? `<span class="sold-out">ano</span>` : ""}</summary>
        <form data-vyprodano="${esc(p.id)}|${b ?? ""}">
          <label class="admin-prepinac"><input type="checkbox" name="vyprodano" ${vyprodano ? "checked" : ""} />Momentálně vyprodáno${b ? ` (jen ${esc(nazev)})` : ""}</label>
          <label class="admin-prepinac"><input type="checkbox" name="nabidnout" ${nabidnout ? "checked" : ""} />Nabízet „Objednat do výroby“</label>
          <textarea class="input" name="poznamka" maxlength="1000" placeholder="Interní poznámka, např. došel filament (zákazník ji neuvidí)">${esc(poznamka(p.id, b))}</textarea>
          <div class="admin-akce"><button type="submit" class="btn btn-secondary">Uložit</button></div>
        </form>
      </details>`;

    const karty = produkty.map((p) => {
      const barvyVyrobku = pb.filter((x) => x.produkt_id === p.id);
      // Barvy pro sklad: barvy výrobku + barvy, které mají jen kusy sady (např. černá miska).
      const idKusu = new Set(kusy.filter((k) => k.produkt_id === p.id).map((k) => k.id));
      const navic = [...new Set(kusBarvy.filter((k) => idKusu.has(k.kus_id)).map((k) => k.barva_id))].filter((b) => !barvyVyrobku.some((x) => x.barva_id === b));
      const hlidat = p.rezim_zasob !== "bez_hlidani";
      let pocty = "";
      if (p.rezim_zasob === "celkem") pocty = radek(p, null, "Kusů skladem", null);
      else if (p.rezim_zasob === "po_barvach")
        pocty = [...barvyVyrobku.map((x) => x.barva_id), ...navic].map((b) => radek(p, b, barva.get(b)?.nazev || "?", barva.get(b)?.hex)).join("");
      else pocty = `<p class="admin-meta">Tiskne se na objednávku – počet kusů se nehlídá.</p>`;
      return `<li class="card admin-karta" data-hledat="${esc(p.nazev.toLocaleLowerCase("cs"))}">
        <div class="admin-karta-hlavicka"><h3>${esc(p.nazev)}</h3>${p.aktivni ? "" : `<span class="admin-skryty">na webu skrytý</span>`}</div>
        <label class="admin-prepinac"><input type="checkbox" data-hlidat="${esc(p.id)}" data-ma-barvy="${barvyVyrobku.length ? 1 : 0}" ${hlidat ? "checked" : ""} />Hlídat zásoby (vypnuto = bez hlídání, tiskne se na objednávku)</label>
        ${pocty}
        ${vyprodanoHtml(p, null, p.nazev, p.vyprodano_rucne, p.vyprodano_nabidnout_vyrobu)}
        ${barvyVyrobku.map((x) => vyprodanoHtml(p, x.barva_id, barva.get(x.barva_id)?.nazev || "?", x.vyprodano_rucne, x.vyprodano_nabidnout_vyrobu)).join("")}
      </li>`;
    });

    stranka(`
      <h1 class="chrome-text">Sklad</h1>
      <div class="admin-filtr"><input class="input" id="hledat-sklad" type="search" placeholder="Hledat výrobek" value="${esc(hledatSklad)}" aria-label="Hledat výrobek" /></div>
      <ul class="admin-seznam" id="sklad-seznam">${karty.join("")}</ul>`);
    const hledej = () => {
      const h = hledatSklad.toLocaleLowerCase("cs");
      el.querySelectorAll("#sklad-seznam > li").forEach((li) => (li.hidden = !!h && !li.dataset.hledat.includes(h)));
    };
    document.getElementById("hledat-sklad").addEventListener("input", (e) => {
      hledatSklad = e.target.value.trim();
      hledej();
    });
    hledej();
    window.scrollTo(0, posun);

    const seznam = document.getElementById("sklad-seznam");
    seznam.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-zmena]");
      if (!btn) return;
      const radekEl = btn.closest(".sklad-radek");
      const tlacitka = radekEl.querySelectorAll("button");
      tlacitka.forEach((b) => (b.disabled = true));
      try {
        const n = await dotaz(sb.rpc("zmen_zasobu", { p_produkt_id: btn.dataset.produkt, p_barva_id: btn.dataset.barva ? Number(btn.dataset.barva) : null, p_zmena: Number(btn.dataset.zmena) }));
        const vystup = radekEl.querySelector("output");
        vystup.textContent = n;
        vystup.classList.toggle("nula", n === 0);
      } catch {
        /* hláška už je venku */
      }
      tlacitka.forEach((b) => (b.disabled = false));
    });
    seznam.addEventListener("change", async (e) => {
      const ch = e.target.closest("[data-hlidat]");
      if (!ch) return;
      const rezim = ch.checked ? (ch.dataset.maBarvy === "1" ? "po_barvach" : "celkem") : "bez_hlidani";
      ch.disabled = true;
      try {
        await dotaz(sb.from("produkty").update({ rezim_zasob: rezim }).eq("id", ch.dataset.hlidat).select("id"));
        toast(ch.checked ? "Zásoby se hlídají." : "Bez hlídání zásob – tiskne se na objednávku.");
      } catch {
        ch.checked = !ch.checked;
        ch.disabled = false;
        return;
      }
      sklad();
    });
    seznam.addEventListener("submit", async (e) => {
      const form = e.target.closest("[data-vyprodano]");
      if (!form) return;
      e.preventDefault();
      const [produkt, b] = form.dataset.vyprodano.split("|");
      const btn = form.querySelector("button");
      btn.disabled = true;
      try {
        await dotaz(
          sb.rpc("nastav_vyprodano", {
            p_produkt_id: produkt,
            p_barva_id: b ? Number(b) : null,
            p_vyprodano: form.elements.vyprodano.checked,
            p_nabidnout_vyrobu: form.elements.nabidnout.checked,
            p_poznamka: form.elements.poznamka.value,
          }),
        );
        toast("Uloženo.");
      } catch {
        btn.disabled = false;
        return;
      }
      sklad();
    });
  }

  start();
})();
