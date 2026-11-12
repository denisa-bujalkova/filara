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
    const aktivni = { objednavka: "objednavky", vyrobek: "vyrobky" }[str] || str || "platby";
    menu.querySelectorAll("a").forEach((a) => (a.getAttribute("href") === `#${aktivni}` ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    if (str === "objednavky") return seznamObjednavek();
    if (str === "objednavka") return detailObjednavky(Number(param));
    if (str === "sklad") return sklad();
    if (str === "vyrobky") return seznamVyrobku();
    if (str === "vyrobek") return formularVyrobku(decodeURIComponent(param || ""));
    if (str === "ciselniky") return ciselniky();
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

  /* =====================================================================
     Výrobky: seznam, formulář, fotky
     ===================================================================== */

  const BUCKET = "fotky";
  const MAX_STRANA_FOTKY = 1200;
  // Typy doplňků „Materiál a péče“ – texty jsou v data/produkty.js (PECE), tady jen popisky.
  const POPISKY_PECE = { ohebne: "Ohebné (pohyblivé klouby)", led: "Pro LED svíčku", vaza: "Váza (jen suché dekorace)", miska: "Miska na potraviny", podtacky: "Podtácky", zavesne: "Závěsná ozdoba" };
  const typyPece = () => Object.keys(typeof PECE === "object" && PECE ? PECE : POPISKY_PECE);

  /** Popis výrobku – stejná pravidla jako na webu (js/app.js): prázdný řádek = odstavec, „- “ = odrážka
      (text před dvojtečkou tučně), samostatný řádek končící dvojtečkou = mezititulek. */
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
        if (!radky.length) return "";
        if (radky.every((r) => r.startsWith("- "))) return `<ul>${radky.map((r) => `<li>${sNazvem(r.slice(2))}</li>`).join("")}</ul>`;
        if (radky.length === 1 && radky[0].endsWith(":")) return `<h3>${esc(radky[0])}</h3>`;
        if (radky.length === 1) return `<p>${sNazvem(radky[0])}</p>`;
        return `<p>${radky.map(esc).join("<br />")}</p>`;
      })
      .join("");
  }

  /** Číselníky (barvy, kategorie) pro formulář a seznam. */
  async function nactiCiselniky() {
    const [barvy, kategorie] = await Promise.all([
      dotaz(sb.from("barvy").select("id,nazev,hex,poradi").order("poradi", { ascending: true })),
      dotaz(sb.from("kategorie").select("id,nazev,poradi").order("poradi", { ascending: true })),
    ]);
    return { barvy, kategorie, barva: new Map(barvy.map((b) => [b.id, b])) };
  }

  /* ---------- Seznam výrobků ---------- */

  const filtrVyrobku = { hledat: "", kategorie: "" };

  async function seznamVyrobku() {
    stranka(`<h1 class="chrome-text">Výrobky</h1><p class="admin-prazdne">Načítám…</p>`);
    let c, produkty, pk, moznosti, fotky;
    try {
      [c, produkty, pk, moznosti, fotky] = await Promise.all([
        nactiCiselniky(),
        dotaz(sb.from("produkty").select("id,nazev,cena,aktivni,poradi")),
        dotaz(sb.from("produkt_kategorie").select("produkt_id,kategorie_id")),
        dotaz(sb.from("moznosti").select("produkt_id,cena,aktivni")),
        dotaz(sb.from("fotky").select("produkt_id,url,poradi").order("poradi", { ascending: true })),
      ]);
    } catch {
      return;
    }
    produkty.sort((a, b) => b.poradi - a.poradi);
    const nazevKat = new Map(c.kategorie.map((k) => [k.id, k.nazev]));
    const cena = (p) => {
      const ceny = moznosti.filter((m) => m.produkt_id === p.id && m.aktivni).map((m) => m.cena);
      if (!ceny.length) return p.cena == null ? "bez ceny" : kc.format(p.cena);
      const min = Math.min(...ceny);
      return (new Set(ceny).size > 1 ? "od " : "") + kc.format(min);
    };
    stranka(`
      <div class="admin-karta-hlavicka" style="margin-bottom:16px"><h1 class="chrome-text" style="margin:0">Výrobky</h1>
        <a class="btn btn-primary" href="#vyrobek/novy">Přidat výrobek</a></div>
      <div class="admin-filtr">
        <input class="input" id="hledat-vyrobek" type="search" placeholder="Hledat výrobek" value="${esc(filtrVyrobku.hledat)}" aria-label="Hledat výrobek" />
        <select class="input" id="filtr-kategorie" aria-label="Kategorie">
          <option value="">Všechny kategorie</option>
          ${c.kategorie.map((k) => `<option value="${k.id}" ${String(k.id) === filtrVyrobku.kategorie ? "selected" : ""}>${esc(k.nazev)}</option>`).join("")}
        </select>
      </div>
      <ul class="admin-seznam" id="seznam-vyrobku">${produkty
        .map((p) => {
          const kat = pk.filter((x) => x.produkt_id === p.id).map((x) => x.kategorie_id);
          const foto = fotky.find((f) => f.produkt_id === p.id);
          return `<li class="card admin-karta admin-vyrobek" data-hledat="${esc(p.nazev.toLocaleLowerCase("cs"))}" data-kategorie=",${kat.join(",")},">
            <div class="admin-vyrobek-foto">${foto ? `<img src="${esc(foto.url)}" alt="" loading="lazy" />` : ""}</div>
            <div class="admin-vyrobek-telo">
              <div class="admin-karta-hlavicka"><h2>${esc(p.nazev)}</h2>${p.aktivni ? "" : `<span class="admin-skryty">na webu skrytý</span>`}</div>
              <p class="admin-meta">${esc(cena(p))} · ${esc(kat.map((k) => nazevKat.get(k)).filter(Boolean).join(", ") || "bez kategorie")}</p>
              <div class="admin-akce">
                <a class="btn btn-secondary" href="#vyrobek/${encodeURIComponent(p.id)}">Upravit</a>
                <button type="button" class="btn btn-secondary" data-aktivni="${esc(p.id)}" data-zobrazit="${p.aktivni ? 0 : 1}">${p.aktivni ? "Skrýt z webu" : "Zobrazit na webu"}</button>
              </div>
            </div>
          </li>`;
        })
        .join("")}</ul>`);
    const filtruj = () => {
      const h = filtrVyrobku.hledat.toLocaleLowerCase("cs");
      el.querySelectorAll("#seznam-vyrobku > li").forEach((li) => {
        li.hidden = (h && !li.dataset.hledat.includes(h)) || (filtrVyrobku.kategorie && !li.dataset.kategorie.includes(`,${filtrVyrobku.kategorie},`));
      });
    };
    document.getElementById("hledat-vyrobek").addEventListener("input", (e) => ((filtrVyrobku.hledat = e.target.value.trim()), filtruj()));
    document.getElementById("filtr-kategorie").addEventListener("change", (e) => ((filtrVyrobku.kategorie = e.target.value), filtruj()));
    filtruj();
    el.querySelectorAll("[data-aktivni]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const zobrazit = btn.dataset.zobrazit === "1";
        btn.disabled = true;
        try {
          await dotaz(sb.from("produkty").update({ aktivni: zobrazit }).eq("id", btn.dataset.aktivni).select("id"));
          toast(zobrazit ? "Výrobek je na webu vidět." : "Výrobek je z webu skrytý.");
        } catch {
          btn.disabled = false;
          return;
        }
        seznamVyrobku();
      }),
    );
  }

  /* ---------- Formulář výrobku ---------- */

  let f = null; // rozpracovaný výrobek
  let ciselnikyFormulare = null;
  let dalsiKlic = 1;
  const novyKlic = () => `n${dalsiKlic++}`;
  const prazdnaSada = () => ({ typ: "zadna", pocet: 3, kusy: [{ nazev: "", barvy: [] }, { nazev: "", barvy: [] }] });

  function sadaZDatabaze(kusy, barvyKusu, stejne) {
    if (!kusy.length) return prazdnaSada();
    if (stejne) return { ...prazdnaSada(), typ: "stejne", pocet: kusy.length };
    return { ...prazdnaSada(), typ: "kusy", kusy: kusy.map((k) => ({ nazev: k.nazev, barvy: barvyKusu.filter((b) => b.kus_id === k.id).map((b) => b.barva_id) })) };
  }

  async function nactiVyrobek(id) {
    const [p, pk, pb, moz, mb, kusy, kb, fot] = await Promise.all([
      dotaz(sb.from("produkty").select("*").eq("id", id).limit(1)).then((x) => x[0]),
      dotaz(sb.from("produkt_kategorie").select("kategorie_id").eq("produkt_id", id)),
      dotaz(sb.from("produkt_barvy").select("barva_id,poradi").eq("produkt_id", id).order("poradi", { ascending: true })),
      dotaz(sb.from("moznosti").select("id,nazev,cena,poradi,aktivni,sada_stejne_kusy").eq("produkt_id", id).order("poradi", { ascending: true })),
      dotaz(sb.from("moznost_barvy").select("moznost_id,barva_id")),
      dotaz(sb.from("sada_kusy").select("id,moznost_id,poradi,nazev").eq("produkt_id", id).order("poradi", { ascending: true })),
      dotaz(sb.from("sada_kus_barvy").select("kus_id,barva_id")),
      dotaz(sb.from("fotky").select("id,url,barva_id,moznost_id,poradi").eq("produkt_id", id).order("poradi", { ascending: true })),
    ]);
    if (!p) return null;
    const klic = (mid) => `m${mid}`;
    return {
      id: p.id,
      nazev: p.nazev,
      popis: p.popis,
      material: p.material,
      rozmery: p.rozmery,
      doba_vyroby: p.doba_vyroby,
      autor: p.autor,
      rucne_malovano: p.rucne_malovano,
      doporuceny: p.doporuceny,
      aktivni: p.aktivni,
      poradi: p.poradi,
      pece: p.pece || [],
      kategorie: pk.map((x) => x.kategorie_id),
      barvy: pb.map((x) => x.barva_id),
      typ: moz.length ? p.typ_moznosti : "cena",
      cena: p.cena,
      moznosti: moz.map((m) => ({
        id: m.id,
        klic: klic(m.id),
        nazev: m.nazev,
        cena: m.cena,
        aktivni: m.aktivni,
        barvy: mb.filter((x) => x.moznost_id === m.id).map((x) => x.barva_id),
        sada: sadaZDatabaze(kusy.filter((k) => k.moznost_id === m.id), kb, m.sada_stejne_kusy),
      })),
      sada: sadaZDatabaze(kusy.filter((k) => k.moznost_id == null), kb, p.sada_stejne_kusy),
      fotky: fot.map((x) => ({ id: x.id, url: x.url, barva_id: x.barva_id, moznost_klic: x.moznost_id ? klic(x.moznost_id) : null })),
      smazaneFotky: [],
    };
  }

  function novyVyrobek() {
    return {
      id: null, nazev: "", popis: "", material: "PLA", rozmery: "", doba_vyroby: "", autor: "",
      rucne_malovano: false, doporuceny: false, aktivni: true, poradi: null, pece: [],
      kategorie: [], barvy: [], typ: "cena", cena: null, moznosti: [], sada: prazdnaSada(), fotky: [], smazaneFotky: [],
    };
  }

  async function formularVyrobku(id) {
    stranka(`<p class="admin-prazdne">Načítám…</p>`);
    try {
      ciselnikyFormulare = await nactiCiselniky();
      f = id === "novy" || !id ? novyVyrobek() : await nactiVyrobek(id);
    } catch {
      return;
    }
    if (!f) return stranka(`<p class="admin-prazdne">Výrobek neexistuje.</p><p style="text-align:center"><a class="link" href="#vyrobky">← Výrobky</a></p>`);
    vykresliFormular();
  }

  const zaskrt = (cesta, ano, popisek) => `<label class="admin-prepinac"><input type="checkbox" data-cesta="${cesta}" data-typ="bool" ${ano ? "checked" : ""} />${popisek}</label>`;
  const pole = (cesta, popisek, hodnota, extra = "") => `<label class="field"><span>${popisek}</span><input class="input" data-cesta="${cesta}" value="${esc(hodnota ?? "")}" ${extra} /></label>`;
  const posun = (akce, i, n) => `<span class="admin-posun">
      <button type="button" class="admin-mini" data-akce="${akce}" data-i="${i}" data-smer="-1" ${i === 0 ? "disabled" : ""} aria-label="Posunout výš">↑</button>
      <button type="button" class="admin-mini" data-akce="${akce}" data-i="${i}" data-smer="1" ${i === n - 1 ? "disabled" : ""} aria-label="Posunout níž">↓</button>
    </span>`;

  /** Výběr barev ze seznamu barev výrobku (pro omezení varianty nebo kus sady). */
  function vyberBarevHtml(cesta, vybrane, popisek) {
    const c = ciselnikyFormulare;
    if (!f.barvy.length) return "";
    return `<fieldset class="admin-barvy-mini"><legend>${popisek}</legend>${f.barvy
      .map((b) => {
        const x = c.barva.get(b);
        return `<label><input type="checkbox" data-seznam="${cesta}" value="${b}" ${vybrane.includes(b) ? "checked" : ""} /><i style="background:${esc(x?.hex)}"></i>${esc(x?.nazev)}</label>`;
      })
      .join("")}</fieldset>`;
  }

  function sadaHtml(cesta, s, sBarvamiKusu) {
    return `<div class="admin-sada">
      <label class="field"><span>Sada (zákazník volí barvu každého kusu)</span>
        <select class="input" data-cesta="${cesta}.typ" data-prekreslit="1">
          <option value="zadna" ${s.typ === "zadna" ? "selected" : ""}>Bez sady</option>
          <option value="stejne" ${s.typ === "stejne" ? "selected" : ""}>Sada stejných kusů (1. kus, 2. kus…)</option>
          <option value="kusy" ${s.typ === "kusy" ? "selected" : ""}>Sada různých kusů (např. S, M, L nebo podtácky + miska)</option>
        </select></label>
      ${s.typ === "stejne" ? pole(`${cesta}.pocet`, "Počet kusů v sadě", s.pocet, 'type="number" min="2" max="20" inputmode="numeric" data-typ="cislo"') : ""}
      ${
        s.typ === "kusy"
          ? `${s.kusy
              .map(
                (k, j) => `<div class="admin-kus">
                ${pole(`${cesta}.kusy.${j}.nazev`, `Kus ${j + 1} – název`, k.nazev, 'maxlength="80"')}
                ${sBarvamiKusu ? vyberBarevHtml(`${cesta}.kusy.${j}.barvy`, k.barvy, "Jen v barvách (nic = všechny barvy výrobku)") : ""}
                <button type="button" class="link-button" data-akce="odebrat-kus" data-cesta-sady="${cesta}" data-i="${j}">Odebrat kus</button>
              </div>`,
              )
              .join("")}
             <button type="button" class="btn btn-secondary" data-akce="pridat-kus" data-cesta-sady="${cesta}">Přidat kus</button>`
          : ""
      }
    </div>`;
  }

  function vykresliFormular(chyby = []) {
    const c = ciselnikyFormulare;
    const vNazev = f.typ === "varianta" ? "Varianta" : "Velikost";
    const nevybrane = c.barvy.filter((b) => !f.barvy.includes(b.id));
    stranka(`
      <p><a class="link" href="#vyrobky">← Výrobky</a></p>
      <h1 class="chrome-text">${f.id ? `Upravit: ${esc(f.nazev)}` : "Nový výrobek"}</h1>
      <form id="vyrobek-form" class="admin-formular" novalidate>
        <div class="error-box" id="vyrobek-chyby" role="alert" ${chyby.length ? "" : "hidden"}>${chyby.map((x) => esc(x.text)).join("<br />")}</div>

        <section class="card">
          <h2>Základní údaje</h2>
          ${pole("nazev", 'Název <span class="povinne">*</span>', f.nazev, 'maxlength="120" required')}
          <label class="field"><span>Popis</span><textarea class="input admin-popis" data-cesta="popis" data-nahled="1">${esc(f.popis)}</textarea></label>
          <p class="hint">Prázdný řádek = nový odstavec. Řádek začínající „- “ = odrážka (text před dvojtečkou bude tučně). Samostatný řádek končící dvojtečkou = mezititulek.</p>
          <details class="admin-nahled"><summary>Náhled popisu</summary><div class="detail-desc" id="nahled-popisu">${popisHtml(f.popis)}</div></details>
          <div class="admin-dva">
            ${pole("material", "Materiál", f.material, 'maxlength="60"')}
            ${pole("autor", "Autor modelu", f.autor, 'maxlength="80" placeholder="např. KOGI3D"')}
            ${pole("rozmery", "Rozměry", f.rozmery, 'maxlength="80" placeholder="např. 12 × 6 × 8 cm"')}
            ${pole("doba_vyroby", "Doba výroby", f.doba_vyroby, 'maxlength="80" placeholder="např. cca 3 pracovní dny"')}
          </div>
          ${zaskrt("rucne_malovano", f.rucne_malovano, "Ručně malováno (štítek u výrobku)")}
          ${zaskrt("doporuceny", f.doporuceny, "Doporučený (ukáže se na úvodní stránce)")}
          ${zaskrt("aktivni", f.aktivni, "Zobrazit na webu")}
          ${pole("poradi", "Pořadí", f.poradi, 'type="number" inputmode="numeric" data-typ="cislo" placeholder="nový výrobek dostane nejvyšší"')}
          <p class="hint">Vyšší číslo = novější (řazení „Od nejnovějšího“ v nabídce).</p>
        </section>

        <section class="card">
          <h2>Kategorie <span class="povinne">*</span></h2>
          <div class="admin-zaskrtavaci">${c.kategorie
            .map((k) => `<label class="admin-prepinac"><input type="checkbox" data-seznam="kategorie" value="${k.id}" ${f.kategorie.includes(k.id) ? "checked" : ""} />${esc(k.nazev)}</label>`)
            .join("")}</div>
        </section>

        <section class="card">
          <h2>Materiál a péče</h2>
          <p class="hint" style="margin-top:0">K společnému bloku „Materiál a péče“ se přidají řádky pro vybrané typy (texty jsou v data/produkty.js).</p>
          <div class="admin-zaskrtavaci">${typyPece()
            .map((t) => `<label class="admin-prepinac"><input type="checkbox" data-seznam="pece" data-hodnota="text" value="${esc(t)}" ${f.pece.includes(t) ? "checked" : ""} />${esc(POPISKY_PECE[t] || t)}</label>`)
            .join("")}</div>
        </section>

        <section class="card">
          <h2>Barvy</h2>
          <p class="hint" style="margin-top:0">Pořadí je pořadí na webu; první barva je předvybraná.</p>
          <ul class="admin-seznam-barev">${f.barvy
            .map((b, i) => {
              const x = c.barva.get(b);
              return `<li><i style="background:${esc(x?.hex)}"></i><span>${esc(x?.nazev || "?")}</span>${posun("posun-barvu", i, f.barvy.length)}
                <button type="button" class="admin-mini" data-akce="odebrat-barvu" data-i="${i}" aria-label="Odebrat barvu ${esc(x?.nazev)}">✕</button></li>`;
            })
            .join("")}</ul>
          ${
            nevybrane.length
              ? `<label class="field"><span>Přidat barvu</span><select class="input" id="pridat-barvu"><option value="">Vyberte barvu…</option>${nevybrane
                  .map((b) => `<option value="${b.id}">${esc(b.nazev)}</option>`)
                  .join("")}</select></label>`
              : ""
          }
          ${f.barvy.length ? "" : `<p class="hint">Bez barev: zákazník barvu nevybírá.</p>`}
        </section>

        <section class="card">
          <h2>Cena</h2>
          <div class="admin-zaskrtavaci">
            ${[["cena", "Jedna cena"], ["velikost", "Velikosti s vlastní cenou"], ["varianta", "Varianty s vlastní cenou a fotkami"]]
              .map(([v, t]) => `<label class="admin-prepinac"><input type="radio" name="typ" data-cesta="typ" data-prekreslit="1" value="${v}" ${f.typ === v ? "checked" : ""} />${t}</label>`)
              .join("")}
          </div>
          ${
            f.typ === "cena"
              ? `${pole("cena", 'Cena v Kč <span class="povinne">*</span>', f.cena, 'type="number" min="0" step="1" inputmode="numeric" data-typ="cislo"')}
                 ${sadaHtml("sada", f.sada, true)}`
              : `${f.moznosti
                  .map(
                    (m, i) => `<div class="admin-moznost">
                  <div class="admin-karta-hlavicka"><h3>${vNazev} ${i + 1}</h3><span>${posun("posun-moznost", i, f.moznosti.length)}
                    <button type="button" class="admin-mini" data-akce="odebrat-moznost" data-i="${i}" aria-label="Odebrat">✕</button></span></div>
                  <div class="admin-dva">
                    ${pole(`moznosti.${i}.nazev`, 'Název <span class="povinne">*</span>', m.nazev, 'maxlength="80" placeholder="např. S nebo Varianta 1"')}
                    ${pole(`moznosti.${i}.cena`, 'Cena v Kč <span class="povinne">*</span>', m.cena, 'type="number" min="0" step="1" inputmode="numeric" data-typ="cislo"')}
                  </div>
                  ${zaskrt(`moznosti.${i}.aktivni`, m.aktivni, "Nabízet na webu")}
                  ${vyberBarevHtml(`moznosti.${i}.barvy`, m.barvy, "Jen v barvách (nic = všechny barvy výrobku)")}
                  ${sadaHtml(`moznosti.${i}.sada`, m.sada, false)}
                </div>`,
                  )
                  .join("")}
                 <button type="button" class="btn btn-secondary" data-akce="pridat-moznost">Přidat ${vNazev.toLowerCase()}</button>`
          }
        </section>

        <section class="card">
          <h2>Fotky</h2>
          <p class="hint" style="margin-top:0">První fotka je hlavní. Fotky se před nahráním zmenší (nejvýš ${MAX_STRANA_FOTKY} px) a uloží jako JPG.</p>
          <ul class="admin-fotky">${f.fotky
            .map(
              (x, i) => `<li class="card">
              <img src="${esc(x.nahled || x.url)}" alt="" />
              ${i === 0 ? `<strong class="admin-hlavni">Hlavní fotka</strong>` : ""}
              ${
                f.barvy.length
                  ? `<label class="field"><span>Barva</span><select class="input" data-cesta="fotky.${i}.barva_id" data-typ="cislo-null"><option value="">Všechny barvy</option>${f.barvy
                      .map((b) => `<option value="${b}" ${x.barva_id === b ? "selected" : ""}>${esc(c.barva.get(b)?.nazev)}</option>`)
                      .join("")}</select></label>`
                  : ""
              }
              ${
                f.typ === "varianta" && f.moznosti.length
                  ? `<label class="field"><span>Varianta</span><select class="input" data-cesta="fotky.${i}.moznost_klic" data-typ="text-null"><option value="">Všechny varianty</option>${f.moznosti
                      .map((m) => `<option value="${esc(m.klic)}" ${x.moznost_klic === m.klic ? "selected" : ""}>${esc(m.nazev || "(bez názvu)")}</option>`)
                      .join("")}</select></label>`
                  : ""
              }
              <div class="admin-akce">${posun("posun-fotku", i, f.fotky.length)}
                <button type="button" class="link-button" data-akce="odebrat-fotku" data-i="${i}">Odebrat</button></div>
            </li>`,
            )
            .join("")}</ul>
          <label class="btn btn-secondary admin-nahrat">Přidat fotky<input type="file" id="nove-fotky" accept="image/*" multiple hidden /></label>
          <p class="hint" id="fotky-stav" aria-live="polite"></p>
        </section>

        <div class="admin-akce admin-ulozit">
          <button type="submit" class="btn btn-primary" id="ulozit-vyrobek">Uložit výrobek</button>
          <a class="btn btn-secondary" href="#vyrobky">Zpět bez uložení</a>
          ${f.id ? `<button type="button" class="link-button admin-smazat" id="smazat-vyrobek">Smazat výrobek</button>` : ""}
        </div>
      </form>`);
    napojFormular();
    if (chyby.length) {
      document.getElementById("vyrobek-chyby").scrollIntoView({ behavior: "smooth", block: "start" });
      const prvni = chyby.find((x) => x.cesta);
      if (prvni) el.querySelector(`[data-cesta="${prvni.cesta}"]`)?.setAttribute("aria-invalid", "true");
    }
  }

  function dle(cesta) {
    return cesta.split(".").reduce((o, k) => (o == null ? o : o[k]), f);
  }
  function nastav(cesta, hodnota) {
    const casti = cesta.split(".");
    const posledni = casti.pop();
    const cil = casti.reduce((o, k) => o[k], f);
    cil[posledni] = hodnota;
  }
  function presun(seznam, i, smer) {
    const j = i + smer;
    if (j < 0 || j >= seznam.length) return;
    [seznam[i], seznam[j]] = [seznam[j], seznam[i]];
  }

  function napojFormular() {
    const form = document.getElementById("vyrobek-form");
    const hodnota = (input) => {
      const t = input.dataset.typ;
      if (t === "bool") return input.checked;
      if (t === "cislo") return input.value.trim() === "" ? null : Number(input.value);
      if (t === "cislo-null") return input.value === "" ? null : Number(input.value);
      if (t === "text-null") return input.value === "" ? null : input.value;
      return input.value;
    };
    const zmena = (e) => {
      const t = e.target;
      if (t.dataset.cesta) {
        if (t.type === "radio" && !t.checked) return;
        nastav(t.dataset.cesta, hodnota(t));
        t.removeAttribute("aria-invalid");
        if (t.dataset.nahled) document.getElementById("nahled-popisu").innerHTML = popisHtml(f.popis);
        if (t.dataset.prekreslit && e.type === "change") {
          if (t.dataset.cesta === "typ" && f.typ !== "cena" && !f.moznosti.length) f.moznosti.push({ id: null, klic: novyKlic(), nazev: "", cena: null, aktivni: true, barvy: [], sada: prazdnaSada() });
          vykresliFormular();
        }
      } else if (t.dataset.seznam) {
        const seznam = dle(t.dataset.seznam);
        const v = t.dataset.hodnota === "text" ? t.value : Number(t.value);
        const i = seznam.indexOf(v);
        if (t.checked && i < 0) seznam.push(v);
        if (!t.checked && i >= 0) seznam.splice(i, 1);
      }
    };
    form.addEventListener("input", zmena);
    form.addEventListener("change", zmena);

    document.getElementById("pridat-barvu")?.addEventListener("change", (e) => {
      if (!e.target.value) return;
      f.barvy.push(Number(e.target.value));
      vykresliFormular();
    });

    form.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-akce]");
      if (!btn) return;
      const i = Number(btn.dataset.i);
      const smer = Number(btn.dataset.smer);
      switch (btn.dataset.akce) {
        case "posun-barvu": presun(f.barvy, i, smer); break;
        case "odebrat-barvu": {
          const b = f.barvy.splice(i, 1)[0];
          // Barva zmizí i z omezení variant, kusů sad a fotek.
          f.moznosti.forEach((m) => {
            m.barvy = m.barvy.filter((x) => x !== b);
            m.sada.kusy.forEach((k) => (k.barvy = k.barvy.filter((x) => x !== b)));
          });
          f.sada.kusy.forEach((k) => (k.barvy = k.barvy.filter((x) => x !== b)));
          f.fotky.forEach((x) => x.barva_id === b && (x.barva_id = null));
          break;
        }
        case "pridat-moznost": f.moznosti.push({ id: null, klic: novyKlic(), nazev: "", cena: null, aktivni: true, barvy: [], sada: prazdnaSada() }); break;
        case "posun-moznost": presun(f.moznosti, i, smer); break;
        case "odebrat-moznost": {
          const m = f.moznosti.splice(i, 1)[0];
          f.fotky.forEach((x) => x.moznost_klic === m.klic && (x.moznost_klic = null));
          break;
        }
        case "pridat-kus": dle(btn.dataset.cestaSady).kusy.push({ nazev: "", barvy: [] }); break;
        case "odebrat-kus": dle(btn.dataset.cestaSady).kusy.splice(i, 1); break;
        case "posun-fotku": presun(f.fotky, i, smer); break;
        case "odebrat-fotku": {
          const x = f.fotky.splice(i, 1)[0];
          if (x.id) f.smazaneFotky.push(x.url);
          if (x.nahled) URL.revokeObjectURL(x.nahled);
          break;
        }
        default: return;
      }
      vykresliFormular();
    });

    document.getElementById("nove-fotky").addEventListener("change", async (e) => {
      const soubory = [...e.target.files];
      if (!soubory.length) return;
      const stav = document.getElementById("fotky-stav");
      stav.textContent = `Zpracovávám ${soubory.length} ${soubory.length === 1 ? "fotku" : soubory.length < 5 ? "fotky" : "fotek"}…`;
      for (const soubor of soubory) {
        try {
          const blob = await zmensiFotku(soubor);
          f.fotky.push({ id: null, url: null, blob, nahled: URL.createObjectURL(blob), barva_id: null, moznost_klic: null });
        } catch {
          toast(`Fotku „${soubor.name}“ se nepodařilo načíst. Zkuste prosím jiný soubor (JPG nebo PNG).`);
        }
      }
      vykresliFormular();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      ulozVyrobek();
    });
    document.getElementById("smazat-vyrobek")?.addEventListener("click", smazVyrobek);
  }

  /** Zmenší fotku v prohlížeči na nejvýš 1200 px na delší straně a převede na JPG. */
  async function zmensiFotku(soubor) {
    const obr = await new Promise((ok, chyba) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = chyba;
      img.src = URL.createObjectURL(soubor);
    });
    const meritko = Math.min(1, MAX_STRANA_FOTKY / Math.max(obr.naturalWidth, obr.naturalHeight));
    const platno = document.createElement("canvas");
    platno.width = Math.max(1, Math.round(obr.naturalWidth * meritko));
    platno.height = Math.max(1, Math.round(obr.naturalHeight * meritko));
    const ctx = platno.getContext("2d");
    ctx.fillStyle = "#fff"; // průhledné PNG dostane bílé pozadí
    ctx.fillRect(0, 0, platno.width, platno.height);
    ctx.drawImage(obr, 0, 0, platno.width, platno.height);
    URL.revokeObjectURL(obr.src);
    const blob = await new Promise((ok) => platno.toBlob(ok, "image/jpeg", 0.85));
    if (!blob) throw new Error("převod se nepovedl");
    return blob;
  }

  function zkontrolujVyrobek() {
    const chyby = [];
    const pridej = (text, cesta) => chyby.push({ text, cesta });
    if (!f.nazev.trim()) pridej("Vyplňte název výrobku.", "nazev");
    if (!f.kategorie.length) pridej("Vyberte aspoň jednu kategorii.");
    const celeCislo = (n) => Number.isInteger(n) && n >= 0;
    if (f.poradi != null && !Number.isInteger(f.poradi)) pridej("Pořadí musí být celé číslo.", "poradi");
    const kontrolaSady = (s, kde, cesta) => {
      if (s.typ === "stejne" && !(Number.isInteger(s.pocet) && s.pocet >= 2 && s.pocet <= 20)) pridej(`${kde}: sada stejných kusů musí mít 2 až 20 kusů.`, `${cesta}.pocet`);
      if (s.typ === "kusy") {
        if (s.kusy.length < 2) pridej(`${kde}: sada musí mít aspoň 2 kusy.`);
        s.kusy.forEach((k, j) => !k.nazev.trim() && pridej(`${kde}: vyplňte název ${j + 1}. kusu sady.`, `${cesta}.kusy.${j}.nazev`));
      }
      if (s.typ !== "zadna" && !f.barvy.length && !(s.typ === "kusy" && s.kusy.every((k) => k.barvy.length)))
        pridej(`${kde}: u sady si zákazník volí barvu každého kusu – vyberte výrobku aspoň jednu barvu.`);
    };
    if (f.typ === "cena") {
      if (!celeCislo(f.cena)) pridej("Zadejte cenu v celých korunách (0 nebo víc).", "cena");
      kontrolaSady(f.sada, "Sada", "sada");
    } else {
      const druh = f.typ === "varianta" ? "Varianta" : "Velikost";
      if (!f.moznosti.length) pridej(`Přidejte aspoň jednu ${druh.toLowerCase()}, nebo zvolte jednu cenu.`);
      const nazvy = new Set();
      f.moznosti.forEach((m, i) => {
        const kde = `${druh} ${i + 1}`;
        if (!m.nazev.trim()) pridej(`${kde}: vyplňte název.`, `moznosti.${i}.nazev`);
        else if (nazvy.has(m.nazev.trim())) pridej(`${kde}: název „${m.nazev.trim()}“ už má jiná ${druh.toLowerCase()}.`, `moznosti.${i}.nazev`);
        nazvy.add(m.nazev.trim());
        if (!celeCislo(m.cena)) pridej(`${kde}: zadejte cenu v celých korunách (0 nebo víc).`, `moznosti.${i}.cena`);
        kontrolaSady(m.sada, kde, `moznosti.${i}.sada`);
      });
      if (f.moznosti.length && !f.moznosti.some((m) => m.aktivni)) pridej(`Aspoň jedna ${druh.toLowerCase()} musí být nabízená na webu.`);
    }
    return chyby;
  }

  const sadaProDatabazi = (s) => (s.typ === "stejne" ? { stejne: s.pocet } : s.typ === "kusy" ? { kusy: s.kusy.map((k) => ({ nazev: k.nazev.trim(), barvy: k.barvy })) } : null);
  const cestaVeStorage = (url) => {
    const m = String(url || "").match(new RegExp(`/storage/v1/object/public/${BUCKET}/(.+)$`));
    return m ? decodeURIComponent(m[1]) : null;
  };
  const uuid = () =>
    window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  async function ulozVyrobek() {
    const chyby = zkontrolujVyrobek();
    if (chyby.length) return vykresliFormular(chyby);
    const btn = document.getElementById("ulozit-vyrobek");
    btn.disabled = true;
    btn.textContent = "Ukládám…";
    const nahrane = [];
    try {
      // 1. Nové fotky do Storage
      for (const x of f.fotky.filter((x) => x.blob)) {
        const cesta = `vyrobky/${uuid()}.jpg`;
        const { error } = await sb.storage.from(BUCKET).upload(cesta, x.blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw Object.assign(new Error(error.message), { hint: "Fotku se nepodařilo nahrát. Zkuste to prosím znovu." });
        nahrane.push(cesta);
        x.url = sb.storage.from(BUCKET).getPublicUrl(cesta).data.publicUrl;
      }
      // 2. Celý výrobek jednou funkcí v databázi
      const id = await dotaz(
        sb.rpc("uloz_vyrobek", {
          v: {
            id: f.id, nazev: f.nazev.trim(), popis: f.popis, material: f.material, rozmery: f.rozmery, doba_vyroby: f.doba_vyroby, autor: f.autor,
            rucne_malovano: f.rucne_malovano, doporuceny: f.doporuceny, aktivni: f.aktivni, poradi: f.poradi,
            pece: f.pece, kategorie: f.kategorie, barvy: f.barvy,
            typ_moznosti: f.typ === "varianta" ? "varianta" : "velikost",
            cena: f.typ === "cena" ? f.cena : null,
            moznosti: f.typ === "cena" ? [] : f.moznosti.map((m) => ({ id: m.id, klic: m.klic, nazev: m.nazev.trim(), cena: m.cena, aktivni: m.aktivni, barvy: m.barvy, sada: sadaProDatabazi(m.sada) })),
            sada: f.typ === "cena" ? sadaProDatabazi(f.sada) : null,
            fotky: f.fotky.map((x) => ({ id: x.id, url: x.url, barva_id: x.barva_id, moznost_klic: f.typ === "varianta" ? x.moznost_klic : null })),
          },
        }),
      );
      // 3. Odebrané fotky z našeho bucketu smazat (fotky ze složky obrazky/ zůstávají v repu)
      const smazat = f.smazaneFotky.map(cestaVeStorage).filter(Boolean);
      if (smazat.length) await sb.storage.from(BUCKET).remove(smazat);
      toast("Výrobek je uložený.");
      if (location.hash === `#vyrobek/${encodeURIComponent(id)}`) formularVyrobku(id);
      else location.hash = `#vyrobek/${encodeURIComponent(id)}`;
    } catch (chyba) {
      if (nahrane.length) await sb.storage.from(BUCKET).remove(nahrane);
      f.fotky.forEach((x) => x.blob && (x.url = null));
      btn.disabled = false;
      btn.textContent = "Uložit výrobek";
      if (chyba.hint) vykresliFormular([{ text: chyba.hint }]);
    }
  }

  async function smazVyrobek() {
    if (!confirm(`Opravdu smazat výrobek „${f.nazev}“? Smazání nejde vrátit. Pokud ho chcete jen dočasně schovat, použijte „Skrýt z webu“.`)) return;
    try {
      await dotaz(sb.from("produkty").delete().eq("id", f.id).select("id"));
    } catch (chyba) {
      if (chyba.hint) vykresliFormular([{ text: chyba.hint }]);
      return;
    }
    const smazat = [...f.fotky.map((x) => x.url), ...f.smazaneFotky].map(cestaVeStorage).filter(Boolean);
    if (smazat.length) await sb.storage.from(BUCKET).remove(smazat);
    toast("Výrobek je smazaný.");
    location.hash = "#vyrobky";
  }

  /* =====================================================================
     Barvy a kategorie
     ===================================================================== */

  // Odstín: #RRGGBB, nebo CSS přechod (přelévavé barvy). Nic jiného (žádné url(…) ani středníky).
  const platnyOdstin = (h) => /^#[0-9a-f]{6}$/i.test(h) || (/^(linear|radial)-gradient\(/i.test(h) && /^[#0-9a-z%,.\s()-]+$/i.test(h) && !/url\s*\(/i.test(h) && h.length <= 1000);

  async function ciselniky() {
    stranka(`<h1 class="chrome-text">Barvy a kategorie</h1><p class="admin-prazdne">Načítám…</p>`);
    let c;
    try {
      c = await nactiCiselniky();
    } catch {
      return;
    }
    const radekBarvy = (b) => `<li class="card admin-karta">
        <form class="admin-ciselnik" data-barva="${b ? b.id : ""}">
          <i class="admin-odstin" style="background:${esc(b ? b.hex : "#cccccc")}"></i>
          <label class="field"><span>Název</span><input class="input" name="nazev" value="${esc(b ? b.nazev : "")}" maxlength="60" required /></label>
          <label class="field"><span>Odstín</span><span class="admin-odstin-pole">
            <input type="color" name="vyber" value="${/^#[0-9a-f]{6}$/i.test(b ? b.hex : "") ? b.hex : "#cccccc"}" aria-label="Vybrat odstín" />
            <input class="input" name="hex" value="${esc(b ? b.hex : "#cccccc")}" maxlength="1000" spellcheck="false" /></span></label>
          <div class="admin-akce">
            <button type="submit" class="btn btn-secondary">${b ? "Uložit" : "Přidat barvu"}</button>
            ${b ? `<button type="button" class="link-button admin-smazat" data-smazat-barvu="${b.id}">Smazat</button>` : ""}
          </div>
        </form></li>`;
    const radekKategorie = (k) => `<li class="card admin-karta">
        <form class="admin-ciselnik" data-kategorie="${k ? k.id : ""}">
          <label class="field"><span>Název</span><input class="input" name="nazev" value="${esc(k ? k.nazev : "")}" maxlength="60" required /></label>
          <div class="admin-akce">
            <button type="submit" class="btn btn-secondary">${k ? "Uložit" : "Přidat kategorii"}</button>
            ${k ? `<button type="button" class="link-button admin-smazat" data-smazat-kategorii="${k.id}">Smazat</button>` : ""}
          </div>
        </form></li>`;
    stranka(`
      <h1 class="chrome-text">Barvy a kategorie</h1>
      <p class="hint" style="margin:-8px 0 16px">Barvu nebo kategorii, kterou používá nějaký výrobek, nejde smazat. Odstín je kód #RRGGBB, u přelévavé barvy CSS přechod, např. linear-gradient(135deg, #2563EB, #C084FC).</p>
      <div class="admin-detail">
        <section><h2>Barvy</h2><ul class="admin-seznam">${c.barvy.map(radekBarvy).join("")}${radekBarvy(null)}</ul></section>
        <section><h2>Kategorie</h2><ul class="admin-seznam">${c.kategorie.map(radekKategorie).join("")}${radekKategorie(null)}</ul></section>
      </div>`);

    el.querySelectorAll("form[data-barva]").forEach((form) => {
      const odstin = form.querySelector(".admin-odstin");
      form.elements.vyber.addEventListener("input", () => {
        form.elements.hex.value = form.elements.vyber.value;
        odstin.style.background = form.elements.vyber.value;
      });
      form.elements.hex.addEventListener("input", () => platnyOdstin(form.elements.hex.value.trim()) && (odstin.style.background = form.elements.hex.value.trim()));
    });
    el.firstElementChild.addEventListener("submit", async (e) => {
      const form = e.target;
      if (!form.matches(".admin-ciselnik")) return;
      e.preventDefault();
      const nazev = form.elements.nazev.value.trim();
      if (!nazev) return toast("Vyplňte prosím název.");
      const jeBarva = form.dataset.barva !== undefined;
      const id = jeBarva ? form.dataset.barva : form.dataset.kategorie;
      const zaznam = { nazev };
      if (jeBarva) {
        zaznam.hex = form.elements.hex.value.trim();
        if (!platnyOdstin(zaznam.hex)) return toast("Odstín zadejte jako #RRGGBB (např. #2563EB), nebo jako CSS přechod.");
      }
      const seznam = jeBarva ? c.barvy : c.kategorie;
      if (seznam.some((x) => x.nazev.toLocaleLowerCase("cs") === nazev.toLocaleLowerCase("cs") && String(x.id) !== id))
        return toast(`${jeBarva ? "Barva" : "Kategorie"} „${nazev}“ už existuje.`);
      const tabulka = jeBarva ? "barvy" : "kategorie";
      try {
        if (id) await dotaz(sb.from(tabulka).update(zaznam).eq("id", Number(id)).select("id"));
        else await dotaz(sb.from(tabulka).insert({ ...zaznam, poradi: Math.max(0, ...seznam.map((x) => x.poradi)) + 1 }).select("id"));
      } catch {
        return;
      }
      toast(id ? "Uloženo." : jeBarva ? "Barva přidána." : "Kategorie přidána.");
      ciselniky();
    });
    el.querySelectorAll("[data-smazat-barvu], [data-smazat-kategorii]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const jeBarva = !!btn.dataset.smazatBarvu;
        const nazev = btn.closest("form").elements.nazev.value;
        if (!confirm(`Smazat ${jeBarva ? "barvu" : "kategorii"} „${nazev}“?`)) return;
        try {
          await dotaz(sb.from(jeBarva ? "barvy" : "kategorie").delete().eq("id", Number(btn.dataset.smazatBarvu || btn.dataset.smazatKategorii)).select("id"));
        } catch {
          return;
        }
        toast("Smazáno.");
        ciselniky();
      }),
    );
  }

  start();
})();
