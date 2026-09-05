// scripts/check-dist.ts — `npm run check:dist`.
//
// Scansiona l'output costruito in `dist/` per tre cose:
//
// 1. Link — ogni `href`/`src` di `<a>`, `<link>`, `<script>`, `<img>` nelle
//    pagine HTML risolve a un file reale dentro `dist/` dopo aver tolto la
//    base, oppure è `mailto:`, `tel:`, `#…`, `data:`, o un `<a href>`
//    esterno (una pagina di navigazione può uscire dal sito; una risorsa
//    no). Nessun percorso assoluto `/…` che non inizi con la base.
// 2. Origin — nessun caricamento di risorsa da un'altra origine in HTML,
//    CSS o JS: `<script src>`, `<link href>`, `<img src>` (mai `<a>`, che
//    è navigazione, non un caricamento), `@import`, `url()`, `fetch(`,
//    `XMLHttpRequest`, `WebSocket`, `sendBeacon` verso `http(s)://` (o
//    `//` senza schema, o `ws(s)://`) un altro host.
// 3. Token — nessun colore esadecimale (`#abc`…`#aabbccdd`) e nessun
//    `font-family` estraneo a Inter / JetBrains Mono / `var(--font-…)` nel
//    CSS emesso, tranne quanto proviene dai design token vendorizzati
//    (`design-system/tokens/*.css`, letti qui per costruire una lista di
//    colori ammessi — anche le loro forme `rgb()/rgba()` una volta
//    convertite in esadecimale dal minificatore) e dal framework
//    (Tailwind/Preline): i suoi blocchi `@layer …{…}`, `@font-face{…}` e
//    `@property …{…}` vengono tolti dal testo prima di cercare violazioni,
//    perché lì dentro Tailwind concatena tema, preflight e i token stessi
//    senza lasciare un marcatore che sopravviva alla minificazione (i
//    commenti sì, tranne quelli con `/*!`).
//
// Ogni riga stampata è `OK <nome>: …` oppure
// `BROKEN <link|origin|token> <file>:<riga>: <dettaglio>`; esce 1 se c'è
// almeno un BROKEN. `VITE_BASE` (se impostata) fissa la base della build;
// altrimenti viene dedotta da `dist/index.html`.
//
// Spec: akaaso/09-tasks/P1-SITO-CONFIG-ci-deploy.md
// Feature: akaaso/04-features/009-ci-e-deploy.md

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const TOKEN_DIR = join(RADICE, 'design-system', 'tokens');

export type Risultato = { ok: string[]; broken: string[] };

function vuoto(): Risultato {
  return { ok: [], broken: [] };
}

function unisci(...risultati: Risultato[]): Risultato {
  return {
    ok: risultati.flatMap((r) => r.ok),
    broken: risultati.flatMap((r) => r.broken),
  };
}

// ===========================================================================
// Filesystem
// ===========================================================================

function elencaFile(dir: string, estensioni: string[]): string[] {
  const acc: string[] = [];
  const cammina = (d: string) => {
    for (const nome of readdirSync(d).sort()) {
      const p = join(d, nome);
      const s = statSync(p);
      if (s.isDirectory()) cammina(p);
      else if (estensioni.some((e) => nome.endsWith(e))) acc.push(p);
    }
  };
  if (existsSync(dir)) cammina(dir);
  return acc;
}

function relDist(distDir: string, file: string): string {
  return relative(distDir, file).split(sep).join('/');
}

function numeroRiga(testo: string, indice: number): number {
  let n = 1;
  for (let i = 0; i < indice && i < testo.length; i++) {
    if (testo.charCodeAt(i) === 10) n++;
  }
  return n;
}

// ===========================================================================
// Base della build
// ===========================================================================

/** `VITE_BASE` se impostata (normalizzata con `/` iniziale e finale);
 * altrimenti dedotta dal primo `href`/`src` di `dist/index.html` che punta
 * a `.../assets/…`; altrimenti `/`. */
export function rilevaBase(distDir: string): string {
  const daEnv = process.env.VITE_BASE;
  if (daEnv) {
    let b = daEnv.startsWith('/') ? daEnv : `/${daEnv}`;
    if (!b.endsWith('/')) b += '/';
    return b;
  }
  const indexPath = join(distDir, 'index.html');
  if (existsSync(indexPath)) {
    const testo = readFileSync(indexPath, 'utf8');
    const m = testo.match(/(?:href|src)="(\/[^"]*?)\/assets\//);
    if (m) return `${m[1]}/`;
  }
  return '/';
}

// ===========================================================================
// 1. Link — solo HTML: è lì che vivono le pagine navigabili.
// ===========================================================================

const TAG_ATTR_RE = /<(a|link|script|img)\b[^>]*?\s(href|src)\s*=\s*(["'])(.*?)\3/gis;

function contienePlaceholder(v: string): boolean {
  return v.includes('${') || v.includes('{{');
}

function eSchemaDaSaltare(v: string): boolean {
  return v === '' || v.startsWith('#') || v.startsWith('mailto:') || v.startsWith('tel:') || v.startsWith('data:');
}

function eEsterno(v: string): boolean {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(v.trim());
}

type Risoluzione = { tipo: 'ok'; percorso: string } | { tipo: 'fuori-base' } | { tipo: 'fuori-dist' };

/** Risolve un href/src interno (relativo o assoluto-con-base) a un percorso
 * dentro `dist/`. Un valore che termina con `/` (o è vuoto) è una cartella:
 * si aggiunge `index.html`, come farebbe un server statico. */
function risolviInterno(base: string, cartella: string, valoreGrezzo: string): Risoluzione {
  const senzaSuffisso = valoreGrezzo.split(/[?#]/)[0];
  const eDirectory = senzaSuffisso === '' || senzaSuffisso.endsWith('/');
  let percorso: string;
  if (senzaSuffisso.startsWith('/')) {
    if (!senzaSuffisso.startsWith(base)) return { tipo: 'fuori-base' };
    percorso = senzaSuffisso.slice(base.length);
  } else {
    const unito = posix.normalize(posix.join(cartella, senzaSuffisso));
    if (unito === '..' || unito.startsWith('../')) return { tipo: 'fuori-dist' };
    percorso = unito === '.' ? '' : unito;
  }
  if (eDirectory) percorso = percorso === '' ? 'index.html' : `${percorso}/index.html`;
  return { tipo: 'ok', percorso };
}

export function checkLinks(distDir: string, base: string): Risultato {
  const r = vuoto();
  const file = elencaFile(distDir, ['.html']);
  let controllati = 0;
  for (const percorsoFile of file) {
    const relFile = relDist(distDir, percorsoFile);
    const cartellaGrezza = posix.dirname(relFile);
    const cartella = cartellaGrezza === '.' ? '' : cartellaGrezza;
    const testo = readFileSync(percorsoFile, 'utf8');
    for (const m of testo.matchAll(TAG_ATTR_RE)) {
      const tag = m[1].toLowerCase();
      const attr = m[2].toLowerCase();
      const valore = m[4];
      if (contienePlaceholder(valore) || eSchemaDaSaltare(valore)) continue;
      if (eEsterno(valore)) {
        // Un <a> può uscire dal sito (pagina fonti → licenze). Le altre tre
        // sono caricamenti di risorsa: se ne occupa checkOrigin.
        continue;
      }
      controllati++;
      const riga = numeroRiga(testo, m.index ?? 0);
      const risoluzione = risolviInterno(base, cartella, valore);
      if (risoluzione.tipo === 'fuori-base') {
        r.broken.push(
          `BROKEN link ${relFile}:${riga}: percorso assoluto "${valore}" fuori dalla base "${base}" (<${tag} ${attr}>)`,
        );
      } else if (risoluzione.tipo === 'fuori-dist') {
        r.broken.push(`BROKEN link ${relFile}:${riga}: "${valore}" esce dalla cartella dist/ (<${tag} ${attr}>)`);
      } else if (!existsSync(join(distDir, risoluzione.percorso))) {
        r.broken.push(
          `BROKEN link ${relFile}:${riga}: "${valore}" non risolve a un file in dist/ (<${tag} ${attr}>)`,
        );
      }
    }
  }
  if (r.broken.length === 0) {
    r.ok.push(`OK link: ${controllati} riferimenti interni risolti in ${file.length} pagine`);
  }
  return r;
}

// ===========================================================================
// 2. Origin — HTML, CSS e JS: qualunque caricamento di risorsa verso
//    un'altra origine, mai una semplice navigazione (<a> escluso).
// ===========================================================================

function eOffOrigin(v: string): boolean {
  return /^((https?|wss?):)?\/\//i.test(v.trim());
}

export function checkOrigin(distDir: string): Risultato {
  const r = vuoto();
  const file = elencaFile(distDir, ['.html', '.css', '.js']);
  let trovati = 0;
  for (const percorsoFile of file) {
    const relFile = relDist(distDir, percorsoFile);
    const testo = readFileSync(percorsoFile, 'utf8');

    for (const m of testo.matchAll(/<(link|script|img)\b[^>]*?\s(href|src)\s*=\s*(["'])(.*?)\3/gis)) {
      const valore = m[4];
      if (contienePlaceholder(valore) || !eOffOrigin(valore)) continue;
      trovati++;
      r.broken.push(
        `BROKEN origin ${relFile}:${numeroRiga(testo, m.index ?? 0)}: caricamento di risorsa da altra origine "${valore}" (<${m[1].toLowerCase()} ${m[2].toLowerCase()}>)`,
      );
    }

    for (const m of testo.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi)) {
      const valore = m[1];
      if (!eOffOrigin(valore)) continue;
      trovati++;
      r.broken.push(`BROKEN origin ${relFile}:${numeroRiga(testo, m.index ?? 0)}: @import da altra origine "${valore}"`);
    }

    for (const m of testo.matchAll(/\burl\(\s*(["']?)([^)'"]+)\1\s*\)/gi)) {
      const valore = m[2];
      if (!eOffOrigin(valore)) continue;
      trovati++;
      r.broken.push(`BROKEN origin ${relFile}:${numeroRiga(testo, m.index ?? 0)}: url() da altra origine "${valore}"`);
    }

    for (const m of testo.matchAll(/\b(fetch|sendBeacon|WebSocket)\s*\(\s*(["'])((?:https?|wss?):\/\/[^"']+)\2/gi)) {
      trovati++;
      r.broken.push(
        `BROKEN origin ${relFile}:${numeroRiga(testo, m.index ?? 0)}: ${m[1]}(...) verso altra origine "${m[3]}"`,
      );
    }

    for (const m of testo.matchAll(/XMLHttpRequest[\s\S]{0,200}?\.open\(\s*["'][A-Za-z]+["']\s*,\s*(["'])(https?:\/\/[^"']+)\1/g)) {
      trovati++;
      r.broken.push(`BROKEN origin ${relFile}:${numeroRiga(testo, m.index ?? 0)}: XMLHttpRequest verso altra origine "${m[2]}"`);
    }
  }
  if (r.broken.length === 0) {
    r.ok.push(`OK origin: nessun caricamento di risorsa da altra origine (${file.length} file)`);
  }
  return r;
}

// ===========================================================================
// 3. Token — solo CSS: colori esadecimali e font-family estranei ai token.
// ===========================================================================

function canale(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');
}

/** Le forme esadecimali (piena e, se possibile, abbreviata a 3/4 cifre) che
 * un minificatore CSS produce da un rgb()/rgba() con questi componenti —
 * è così che i token vendorizzati (scritti in rgb()) riappaiono nel CSS
 * costruito: `rgb(255,255,255)` → `#ffffff` → `#fff`. */
function formeEsadecimali(r: number, g: number, b: number, a?: number): string[] {
  let hex = `#${canale(r)}${canale(g)}${canale(b)}`;
  if (a !== undefined && a < 1) hex += canale(a * 255);
  const forme = [hex.toLowerCase()];
  const cifre = hex.slice(1);
  if (cifre.length % 2 === 0) {
    let corta = '';
    let abbreviabile = true;
    for (let i = 0; i < cifre.length; i += 2) {
      if (cifre[i] !== cifre[i + 1]) {
        abbreviabile = false;
        break;
      }
      corta += cifre[i];
    }
    if (abbreviabile) forme.push(`#${corta}`.toLowerCase());
  }
  return forme;
}

/** Legge design-system/tokens/*.css (vendorizzati, non toccati da questo
 * task) e costruisce l'insieme di colori ammessi: sia gli esadecimali
 * scritti lì alla lettera (es. `--tint: #f5771e`), sia le forme
 * esadecimali equivalenti di ogni rgb()/rgba() (es. `--gray-50:
 * rgb(248, 250, 252)` → `#f8fafc`), perché è così che il minificatore di
 * Tailwind li riscrive nell'output. */
function costruisciAllowlistToken(): Set<string> {
  const set = new Set<string>();
  if (!existsSync(TOKEN_DIR)) return set;
  for (const nome of readdirSync(TOKEN_DIR).filter((f) => f.endsWith('.css'))) {
    const testo = readFileSync(join(TOKEN_DIR, nome), 'utf8');
    for (const m of testo.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) set.add(m[0].toLowerCase());
    for (const m of testo.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/gi)) {
      const r = Number(m[1]);
      const g = Number(m[2]);
      const b = Number(m[3]);
      const a = m[4] !== undefined ? Number(m[4]) : undefined;
      for (const forma of formeEsadecimali(r, g, b, a)) set.add(forma);
    }
  }
  return set;
}

/** Toglie dal testo ogni blocco che apre con `apertura` (che deve
 * includere la graffa d'apertura), contando le graffe per trovarne la
 * chiusura — necessario perché `@layer`/`@supports` annidano altre
 * regole. Il blocco tolto è sostituito da altrettanti a-capo, così i
 * numeri di riga di quel che resta non cambiano. */
function rimuoviBlocchi(testo: string, apertura: RegExp): string {
  const flags = apertura.flags.includes('g') ? apertura.flags : `${apertura.flags}g`;
  const re = new RegExp(apertura.source, flags);
  let risultato = '';
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(testo))) {
    const inizio = m.index;
    let i = re.lastIndex;
    let profondita = 1;
    for (; i < testo.length && profondita > 0; i++) {
      if (testo[i] === '{') profondita++;
      else if (testo[i] === '}') profondita--;
    }
    risultato += testo.slice(ultimo, inizio);
    const rimosso = testo.slice(inizio, i);
    risultato += '\n'.repeat((rimosso.match(/\n/g) ?? []).length);
    ultimo = i;
    re.lastIndex = i;
  }
  risultato += testo.slice(ultimo);
  return risultato;
}

/** Il CSS emesso mischia in un solo file il framework (Tailwind/Preline: i
 * suoi `@layer theme|base|components|utilities{…}`, le sue `@property
 * --tw-…{…}` per il polyfill, i `@font-face` di fontsource) e i token
 * vendorizzati e il CSS scritto a mano (entrambi non incapsulati in
 * nessuna `@layer`). Non c'è un marcatore testuale che sopravviva alla
 * minificazione per separarli — i commenti sì, tranne quelli con `/*!` —
 * quindi si tolgono i blocchi di framework per struttura (parentesi
 * bilanciate dopo l'at-rule) e si confrontano i colori superstiti con
 * l'allowlist dei token invece di fidarsi di un marcatore. */
function contenutoDaControllare(testo: string): string {
  let t = rimuoviBlocchi(testo, /@font-face\s*\{/gi);
  t = rimuoviBlocchi(t, /@layer\s+[a-zA-Z0-9_,\s-]+\{/gi);
  t = rimuoviBlocchi(t, /@property\s+[^{]+\{/gi);
  return t;
}

function fontConsentito(valore: string): boolean {
  const v = valore.trim();
  return v.toLowerCase().startsWith('var(--font-') || /inter/i.test(v) || /jetbrains mono/i.test(v);
}

export function checkTokens(distDir: string): Risultato {
  const r = vuoto();
  const allow = costruisciAllowlistToken();
  const file = elencaFile(distDir, ['.css']);
  for (const percorsoFile of file) {
    const relFile = relDist(distDir, percorsoFile);
    const testo = contenutoDaControllare(readFileSync(percorsoFile, 'utf8'));

    for (const m of testo.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      const valore = m[0];
      if (allow.has(valore.toLowerCase())) continue;
      r.broken.push(
        `BROKEN token ${relFile}:${numeroRiga(testo, m.index ?? 0)}: colore esadecimale non consentito "${valore}" (usa i design token)`,
      );
    }

    for (const m of testo.matchAll(/font-family\s*:\s*([^;{}]+)/gi)) {
      const valore = m[1];
      if (fontConsentito(valore)) continue;
      r.broken.push(
        `BROKEN token ${relFile}:${numeroRiga(testo, m.index ?? 0)}: font-family non consentito "${valore.trim()}" (usa Inter, JetBrains Mono o un token --font-*)`,
      );
    }
  }
  if (r.broken.length === 0) {
    r.ok.push(`OK token: nessun colore esadecimale o font-family estraneo in ${file.length} file CSS`);
  }
  return r;
}

// ===========================================================================
// Orchestratore
// ===========================================================================

export function runChecks(distDir: string, opts: { base?: string } = {}): Risultato {
  const base = opts.base ?? rilevaBase(distDir);
  return unisci(checkLinks(distDir, base), checkOrigin(distDir), checkTokens(distDir));
}

if (import.meta.main) {
  const distDir = join(RADICE, 'dist');
  if (!existsSync(distDir)) {
    console.log('BROKEN dist: la cartella dist/ non esiste — esegui prima `npm run build`');
    process.exit(1);
  }
  const { ok, broken } = runChecks(distDir);
  for (const linea of ok) console.log(linea);
  for (const linea of broken) console.log(linea);
  process.exit(broken.length > 0 ? 1 : 0);
}
