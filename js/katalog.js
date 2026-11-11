/* Katalog z databáze (Supabase): výrobky, barvy, kategorie, velikosti/varianty, sady, fotky, zásoby a veřejné nastavení.
   Data se převedou do stejné podoby, jakou měly výrobky v data/produkty.js, takže zbytek webu (js/app.js) se skoro nemění.
   Navíc má každý výrobek:
     zasoba        { rezim: "bez_hlidani" | "celkem" | "po_barvach", celkem: počet, poBarvach: { "Bílá": počet } }
     vyprodanoRucne, nabidnoutVyrobu    ruční „Momentálně vyprodáno“ u výrobku a jestli nabídnout „Objednat do výroby“
     barvyRucne    { "Zelená": { nabidnout: false } }  ručně vyprodané barvy
   Interní poznámka admina k vyprodání je v tabulce, kterou web vůbec nečte. */
(function () {
  "use strict";

  // Tabulka → sloupce, které web potřebuje.
  const TABULKY = {
    barvy: "id,nazev,hex,poradi",
    kategorie: "id,nazev,poradi",
    produkty:
      "id,nazev,popis,material,pece,autor,rozmery,doba_vyroby,doporuceny,rucne_malovano,cena,typ_moznosti,sada_stejne_kusy,rezim_zasob,vyprodano_rucne,vyprodano_nabidnout_vyrobu,poradi",
    produkt_kategorie: "produkt_id,kategorie_id",
    produkt_barvy: "produkt_id,barva_id,poradi,vyprodano_rucne,vyprodano_nabidnout_vyrobu",
    moznosti: "id,produkt_id,nazev,cena,poradi,aktivni,sada_stejne_kusy",
    moznost_barvy: "moznost_id,barva_id",
    sada_kusy: "id,produkt_id,moznost_id,poradi,nazev",
    sada_kus_barvy: "kus_id,barva_id",
    fotky: "id,produkt_id,barva_id,moznost_id,url,poradi",
    zasoby: "produkt_id,barva_id,pocet",
  };
  // Řazení, aby pořadí odpovídalo pořadí v administraci (a dřív v produkty.js).
  const RAZENI = {
    barvy: ["poradi", "id"],
    kategorie: ["poradi", "id"],
    produkty: ["poradi", "id"],
    produkt_barvy: ["poradi", "barva_id"],
    moznosti: ["poradi", "id"],
    sada_kusy: ["poradi", "id"],
    fotky: ["poradi", "id"],
  };
  // Při obnovení zásob (otevření košíku) stačí tohle.
  const ZASOBY = {
    produkty: "id,rezim_zasob,vyprodano_rucne,vyprodano_nabidnout_vyrobu",
    produkt_barvy: "produkt_id,barva_id,vyprodano_rucne,vyprodano_nabidnout_vyrobu",
    zasoby: TABULKY.zasoby,
  };
  const CEKANI_MS = 15000; // déle na odpověď databáze nečekáme, pak se ukáže hláška

  let klient = null;
  let barvaPodleId = new Map();

  function db() {
    if (klient) return klient;
    const c = window.FILARA_CONFIG || {};
    if (!window.supabase || typeof window.supabase.createClient !== "function")
      throw new Error("Knihovna supabase-js se nenačetla (CDN nedostupné?).");
    if (!c.supabaseUrl || !c.supabaseKey || /DOPLNIT/.test(c.supabaseUrl + c.supabaseKey))
      throw new Error("V js/config.js chybí adresa nebo veřejný klíč Supabase.");
    klient = window.supabase.createClient(c.supabaseUrl, c.supabaseKey, {
      // Veřejný web nikoho nepřihlašuje – nic si neukládá do prohlížeče.
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (url, volby = {}) => {
          const casovac = typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(CEKANI_MS) : undefined;
          return fetch(url, { ...volby, signal: volby.signal || casovac });
        },
      },
    });
    return klient;
  }

  async function tabulka(nazev, sloupce) {
    let dotaz = db().from(nazev).select(sloupce);
    for (const s of RAZENI[nazev] || []) dotaz = dotaz.order(s);
    const { data, error } = await dotaz;
    if (error) throw new Error(`Tabulka ${nazev}: ${error.message}`);
    return data || [];
  }

  async function nactiTabulky(seznam) {
    const nazvy = Object.keys(seznam);
    const data = await Promise.all(nazvy.map((n) => tabulka(n, seznam[n])));
    return Object.fromEntries(nazvy.map((n, i) => [n, data[i]]));
  }

  async function verejneNastaveni() {
    const { data, error } = await db().rpc("verejne_nastaveni");
    if (error) throw new Error(`Nastavení: ${error.message}`);
    return data || {};
  }

  function podle(seznam, klic) {
    const m = new Map();
    for (const x of seznam) {
      if (!m.has(x[klic])) m.set(x[klic], []);
      m.get(x[klic]).push(x);
    }
    return m;
  }

  /** Doplní k výrobkům zásoby a ruční „vyprodáno“ (při načtení i při obnovení v košíku). */
  function prevezmiZasoby(produkty, r) {
    const radkyProduktu = new Map(r.produkty.map((p) => [p.id, p]));
    const barvy = podle(r.produkt_barvy, "produkt_id");
    const zasoby = podle(r.zasoby, "produkt_id");
    for (const o of produkty) {
      const f = radkyProduktu.get(o.id);
      if (!f) {
        // Výrobek mezitím zmizel z nabídky – chová se jako vyprodaný.
        o.vyprodanoRucne = true;
        o.nabidnoutVyrobu = false;
        continue;
      }
      o.vyprodanoRucne = !!f.vyprodano_rucne;
      o.nabidnoutVyrobu = f.vyprodano_nabidnout_vyrobu !== false;
      o.barvyRucne = {};
      for (const b of barvy.get(o.id) || [])
        if (b.vyprodano_rucne && barvaPodleId.has(b.barva_id))
          o.barvyRucne[barvaPodleId.get(b.barva_id)] = { nabidnout: b.vyprodano_nabidnout_vyrobu !== false };
      const radky = zasoby.get(o.id) || [];
      const poBarvach = {};
      for (const z of radky) if (z.barva_id != null && barvaPodleId.has(z.barva_id)) poBarvach[barvaPodleId.get(z.barva_id)] = z.pocet;
      o.zasoba = { rezim: f.rezim_zasob, celkem: radky.find((z) => z.barva_id == null)?.pocet ?? 0, poBarvach };
    }
  }

  /** Řádky z databáze → výrobky ve tvaru z data/produkty.js. */
  function sestav(r) {
    barvaPodleId = new Map(r.barvy.map((b) => [b.id, b.nazev]));
    const poradiKategorie = new Map(r.kategorie.map((k, i) => [k.id, i]));
    const nazevKategorie = new Map(r.kategorie.map((k) => [k.id, k.nazev]));
    const kategorie = podle(r.produkt_kategorie, "produkt_id");
    const barvy = podle(r.produkt_barvy, "produkt_id");
    const moznosti = podle(r.moznosti.filter((m) => m.aktivni), "produkt_id");
    const barvyMoznosti = podle(r.moznost_barvy, "moznost_id");
    const kusy = podle(r.sada_kusy, "produkt_id");
    const barvyKusu = podle(r.sada_kus_barvy, "kus_id");
    const fotky = podle(r.fotky, "produkt_id");
    const nazvyBarev = (radky) => (radky || []).map((x) => barvaPodleId.get(x.barva_id)).filter(Boolean);

    // Sada: stejné kusy → počet (sada: 3), jinak seznam kusů (sada: [{ nazev: "S" }, { nazev: "Miska", barvy: [...] }]).
    const sada = (kusySady, stejne) => {
      if (!kusySady.length) return undefined;
      if (stejne) return kusySady.length;
      return kusySady.map((k) => {
        const b = nazvyBarev(barvyKusu.get(k.id));
        return b.length ? { nazev: k.nazev, barvy: b } : { nazev: k.nazev };
      });
    };

    const produkty = r.produkty.map((p) => {
      const kusyVyrobku = kusy.get(p.id) || [];
      const moz = (moznosti.get(p.id) || []).map((m) => {
        const v = { id: m.id, nazev: m.nazev, cena: m.cena };
        const b = nazvyBarev(barvyMoznosti.get(m.id));
        if (b.length) v.barvy = b;
        const s = sada(kusyVyrobku.filter((k) => k.moznost_id === m.id), m.sada_stejne_kusy);
        if (s !== undefined) v.sada = s;
        return v;
      });
      const o = {
        id: p.id,
        nazev: p.nazev,
        kategorie: (kategorie.get(p.id) || [])
          .slice()
          .sort((a, b) => poradiKategorie.get(a.kategorie_id) - poradiKategorie.get(b.kategorie_id))
          .map((k) => nazevKategorie.get(k.kategorie_id))
          .filter(Boolean),
        material: p.material,
        pece: p.pece || [],
        autor: p.autor,
        rozmery: p.rozmery,
        dobaVyroby: p.doba_vyroby,
        doporuceny: !!p.doporuceny,
        rucneMalovano: !!p.rucne_malovano,
        popis: p.popis,
        barvy: nazvyBarev(barvy.get(p.id)),
      };
      if (moz.length) o[p.typ_moznosti === "varianta" ? "varianty" : "velikosti"] = moz;
      else o.cena = p.cena;
      const s = sada(kusyVyrobku.filter((k) => k.moznost_id == null), p.sada_stejne_kusy);
      if (s !== undefined) o.sada = s;

      // Fotky: bez barvy → seznam; s barvou → { "Barva": [...] }; u variant → { "Barva, Varianta": [...] }.
      const f = fotky.get(p.id) || [];
      if (f.some((x) => x.barva_id != null)) {
        o.obrazky = {};
        for (const x of f) {
          const barva = barvaPodleId.get(x.barva_id) || "";
          const varianta = x.moznost_id != null ? moz.find((v) => v.id === x.moznost_id)?.nazev : null;
          const klic = o.varianty && varianta ? `${barva}, ${varianta}` : barva;
          (o.obrazky[klic] = o.obrazky[klic] || []).push(x.url);
        }
      } else o.obrazky = f.map((x) => x.url);
      return o;
    });
    prevezmiZasoby(produkty, r);

    return {
      barvy: r.barvy.map((b) => ({ id: b.id, nazev: b.nazev, hex: b.hex })),
      kategorie: r.kategorie.map((k) => k.nazev),
      produkty,
      nastaveni: r.nastaveni || {},
    };
  }

  window.FilaraKatalog = {
    /** Celý katalog a veřejné nastavení. Při chybě vyhodí výjimku. */
    async nacti() {
      const [radky, nastaveni] = await Promise.all([nactiTabulky(TABULKY), verejneNastaveni()]);
      radky.nastaveni = nastaveni;
      return sestav(radky);
    },
    /** Čerstvé zásoby a ruční „vyprodáno“ – zapíše je rovnou do předaných výrobků. */
    async obnovZasoby(produkty) {
      prevezmiZasoby(produkty, await nactiTabulky(ZASOBY));
    },
    sestav, // pro testy
  };
})();
