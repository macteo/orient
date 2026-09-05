// scripts/check-content.ts — `npm run check:content`.
//
// Validates every content/**.json against content/schema/<kind>.schema.json,
// diffs each deck's inventory of refs against the converted source text,
// verifies every artwork file exists and its checksum matches (filling
// isom.json's empty ones locally; failing instead in CI), checks the esempi
// count/triples, validates full description rows (content/righe/*.json, once
// they exist), and checks content/compatibilita.json (once it exists).
// Prints `OK <name>: …` or `BROKEN <name>: <detail> (<fonte> p. N)` per
// finding, `- skipped: <reason>` when a check's inputs do not exist yet, and
// exits 1 iff anything is BROKEN.
//
// Spec: akaaso/09-tasks/P1-CONTENUTI-TOOL-check-content.md
// Feature: akaaso/04-features/007-estrazione-contenuti.md

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

import type { Colonna, RigaGrezza } from './parse/parse-descrizioni.ts';
import {
  NOMI as NOMI_DESCRIZIONI,
  costruisciWhitelistDescrizioni,
  estraiRigheGrezze,
} from './parse/parse-descrizioni.ts';
import type { RigaConPagina, SimboloGrezzo } from './parse/parse-isom.ts';
import {
  CARTELLA_S5 as ISOM_CARTELLA_S5,
  SORGENTE_MD as ISOM_SORGENTE_MD,
  analizza as analizzaIsom,
  costruisciSimboli as costruisciSimboliIsom,
  righeConPagina,
} from './parse/parse-isom.ts';
import { leggiSorgente } from './parse/_text.ts';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const SCHEMA_DIR = join(RADICE, 'content', 'schema');

// ===========================================================================
// 0. Un piccolo validatore JSON Schema (draft 2020-12), sufficiente per gli
//    schemi di questo progetto: type, const, enum, required, properties,
//    additionalProperties (bool o schema), items (schema o false),
//    prefixItems, minItems, maxItems, minLength, maxLength, pattern,
//    format (email, uri), minimum, maximum, allOf, anyOf, $ref/$defs.
// ===========================================================================

type JsonSchema = Record<string, unknown> | boolean;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function ugualiJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const FORMATI: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uri: /^[a-zA-Z][a-zA-Z0-9+.-]*:\S+$/,
};

function risolviRef(root: Record<string, unknown>, ref: string): JsonSchema {
  if (!ref.startsWith('#/')) throw new Error(`$ref esterno non supportato: ${ref}`);
  const parti = ref
    .slice(2)
    .split('/')
    .map((p) => decodeURIComponent(p).replace(/~1/g, '/').replace(/~0/g, '~'));
  let corrente: unknown = root;
  for (const parte of parti) {
    if (!isPlainObject(corrente)) throw new Error(`$ref non risolvibile: ${ref}`);
    corrente = corrente[parte];
  }
  if (corrente === undefined) throw new Error(`$ref non risolvibile: ${ref}`);
  return corrente as JsonSchema;
}

function tipoOk(dato: unknown, tipo: string): boolean {
  switch (tipo) {
    case 'object':
      return isPlainObject(dato);
    case 'array':
      return Array.isArray(dato);
    case 'string':
      return typeof dato === 'string';
    case 'number':
      return typeof dato === 'number';
    case 'integer':
      return typeof dato === 'number' && Number.isInteger(dato);
    case 'boolean':
      return typeof dato === 'boolean';
    case 'null':
      return dato === null;
    default:
      return true;
  }
}

/** Valida `dato` contro `schema` (risolvendo i $ref rispetto a `root`), accumulando errori in `errori`. */
function validaSchema(
  schema: JsonSchema,
  dato: unknown,
  root: Record<string, unknown>,
  percorso: string,
  errori: string[],
): void {
  if (schema === true) return;
  if (schema === false) {
    errori.push(`${percorso}: valore non ammesso`);
    return;
  }
  if (!isPlainObject(schema)) return;

  if (typeof schema.$ref === 'string') {
    validaSchema(risolviRef(root, schema.$ref), dato, root, percorso, errori);
  }

  if ('const' in schema && !ugualiJson(dato, schema.const)) {
    errori.push(`${percorso}: atteso ${JSON.stringify(schema.const)}, trovato ${JSON.stringify(dato)}`);
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((v) => ugualiJson(v, dato))) {
    errori.push(`${percorso}: ${JSON.stringify(dato)} non è tra ${JSON.stringify(schema.enum)}`);
  }

  if (typeof schema.type === 'string' && !tipoOk(dato, schema.type)) {
    errori.push(`${percorso}: atteso tipo ${schema.type}, trovato ${JSON.stringify(dato)}`);
  }

  if (Array.isArray(schema.allOf)) {
    for (const sub of schema.allOf) validaSchema(sub as JsonSchema, dato, root, percorso, errori);
  }

  if (Array.isArray(schema.anyOf)) {
    const nessunoValido = !schema.anyOf.some((sub) => {
      const tentativo: string[] = [];
      validaSchema(sub as JsonSchema, dato, root, percorso, tentativo);
      return tentativo.length === 0;
    });
    if (nessunoValido) errori.push(`${percorso}: nessuna delle alternative anyOf valida`);
  }

  if (typeof dato === 'string') {
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(dato)) {
      errori.push(`${percorso}: "${dato}" non rispetta /${schema.pattern}/`);
    }
    if (typeof schema.minLength === 'number' && dato.length < schema.minLength) {
      errori.push(`${percorso}: stringa troppo corta (min ${schema.minLength})`);
    }
    if (typeof schema.maxLength === 'number' && dato.length > schema.maxLength) {
      errori.push(`${percorso}: stringa troppo lunga (max ${schema.maxLength})`);
    }
    if (typeof schema.format === 'string' && FORMATI[schema.format] && !FORMATI[schema.format].test(dato)) {
      errori.push(`${percorso}: "${dato}" non è un ${schema.format} valido`);
    }
  }

  if (typeof dato === 'number') {
    if (typeof schema.minimum === 'number' && dato < schema.minimum) {
      errori.push(`${percorso}: ${dato} < minimo ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && dato > schema.maximum) {
      errori.push(`${percorso}: ${dato} > massimo ${schema.maximum}`);
    }
  }

  if (Array.isArray(dato)) {
    if (typeof schema.minItems === 'number' && dato.length < schema.minItems) {
      errori.push(`${percorso}: ${dato.length} elementi, minimo ${schema.minItems}`);
    }
    if (typeof schema.maxItems === 'number' && dato.length > schema.maxItems) {
      errori.push(`${percorso}: ${dato.length} elementi, massimo ${schema.maxItems}`);
    }
    const prefix = Array.isArray(schema.prefixItems) ? schema.prefixItems : undefined;
    const nPrefix = prefix?.length ?? 0;
    if (prefix) {
      for (let i = 0; i < Math.min(prefix.length, dato.length); i += 1) {
        validaSchema(prefix[i] as JsonSchema, dato[i], root, `${percorso}[${i}]`, errori);
      }
    }
    if (schema.items === false) {
      if (dato.length > nPrefix) errori.push(`${percorso}: troppi elementi (oltre i ${nPrefix} previsti)`);
    } else if (schema.items !== undefined) {
      for (let i = nPrefix; i < dato.length; i += 1) {
        validaSchema(schema.items as JsonSchema, dato[i], root, `${percorso}[${i}]`, errori);
      }
    }
  }

  if (isPlainObject(dato)) {
    if (Array.isArray(schema.required)) {
      for (const nome of schema.required) {
        if (!(nome in dato)) errori.push(`${percorso}: manca la proprietà "${nome}"`);
      }
    }
    const proprieta = isPlainObject(schema.properties) ? schema.properties : {};
    for (const [chiave, sub] of Object.entries(proprieta)) {
      if (chiave in dato) validaSchema(sub as JsonSchema, dato[chiave], root, `${percorso}.${chiave}`, errori);
    }
    if (schema.additionalProperties !== undefined) {
      for (const chiave of Object.keys(dato)) {
        if (chiave in proprieta) continue;
        if (schema.additionalProperties === false) {
          errori.push(`${percorso}: proprietà non ammessa "${chiave}"`);
        } else {
          validaSchema(schema.additionalProperties as JsonSchema, dato[chiave], root, `${percorso}.${chiave}`, errori);
        }
      }
    }
  }
}

function validaDocumento(schema: Record<string, unknown>, dato: unknown): string[] {
  const errori: string[] = [];
  validaSchema(schema, dato, schema, '$', errori);
  return errori;
}

// ===========================================================================
// Helpers comuni
// ===========================================================================

type Risultato = { ok: string[]; broken: string[]; skipped: string[] };

function vuoto(): Risultato {
  return { ok: [], broken: [], skipped: [] };
}

function unisci(...risultati: Risultato[]): Risultato {
  return {
    ok: risultati.flatMap((r) => r.ok),
    broken: risultati.flatMap((r) => r.broken),
    skipped: risultati.flatMap((r) => r.skipped),
  };
}

function leggiJson(percorso: string): unknown {
  return JSON.parse(readFileSync(percorso, 'utf8'));
}

function scriviJson(percorso: string, dato: unknown): void {
  writeFileSync(percorso, `${JSON.stringify(dato, null, 2)}\n`, 'utf8');
}

function sha256File(percorso: string): string {
  return createHash('sha256').update(readFileSync(percorso)).digest('hex');
}

/**
 * `contentDir` è sempre una cartella chiamata `content` (quella reale, o una
 * cartella di fixture che ne imita la forma). Ogni `path` registrato nei
 * documenti (es. `content/artwork/isom/101.png`) è relativo alla cartella che
 * la contiene, quindi si risolve rispetto al genitore di `contentDir`.
 */
function risolviPercorsoContenuto(contentDir: string, percorsoRelativo: string): string {
  return join(dirname(contentDir), percorsoRelativo);
}

// ===========================================================================
// 1. Schema — ogni file content/**.json contro content/schema/<kind>.schema.json
// ===========================================================================

function trovaJsonFiles(dir: string, base: string): string[] {
  const risultati: string[] = [];
  for (const nome of readdirSync(dir)) {
    if (dir === base && (nome === 'schema' || nome === '_contact')) continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) {
      risultati.push(...trovaJsonFiles(p, base));
    } else if (nome.endsWith('.json')) {
      risultati.push(p);
    }
  }
  return risultati;
}

/** `content/simboli/isom.json` -> "simboli"; `content/fonti.json` -> "fonti". */
function kindDiFile(base: string, file: string): string {
  const segmenti = relative(base, file).split(sep);
  return segmenti.length > 1 ? segmenti[0] : basename(segmenti[0], '.json');
}

export function checkSchema(contentDir: string): Risultato {
  const r = vuoto();
  if (!existsSync(contentDir)) {
    r.skipped.push('- skipped: schema — content/ assente');
    return r;
  }
  const file = trovaJsonFiles(contentDir, contentDir).sort();
  const schemiCache = new Map<string, Record<string, unknown> | null>();
  let controllati = 0;

  for (const f of file) {
    const kind = kindDiFile(contentDir, f);
    const relPath = relative(dirname(contentDir), f);
    if (!schemiCache.has(kind)) {
      const percorsoSchema = join(SCHEMA_DIR, `${kind}.schema.json`);
      schemiCache.set(kind, existsSync(percorsoSchema) ? (leggiJson(percorsoSchema) as Record<string, unknown>) : null);
    }
    const schema = schemiCache.get(kind);
    if (!schema) {
      r.broken.push(`BROKEN schema: nessuno schema «${kind}.schema.json» per ${relPath}`);
      continue;
    }
    let dato: unknown;
    try {
      dato = leggiJson(f);
    } catch (e) {
      r.broken.push(`BROKEN schema: ${relPath} non è JSON valido (${(e as Error).message})`);
      continue;
    }
    const errori = validaDocumento(schema, dato);
    controllati += 1;
    if (errori.length > 0) {
      r.broken.push(`BROKEN schema: ${relPath} non valido — ${errori.join('; ')}`);
    }
  }

  if (r.broken.length === 0) {
    r.ok.push(`OK schema: ${controllati} file validati contro ${schemiCache.size} schemi`);
  }
  return r;
}

// ===========================================================================
// 2. Inventario descrizioni — refs in [S3] (whitelist del parser) meno
//    content/esclusi/descrizioni.json contro content/simboli/descrizioni-punti.json
// ===========================================================================

export function checkInventarioDescrizioni(contentDir: string): Risultato {
  const r = vuoto();
  const pSimboli = join(contentDir, 'simboli', 'descrizioni-punti.json');
  if (!existsSync(pSimboli)) {
    r.skipped.push('- skipped: inventario descrizioni — descrizioni-punti.json assente');
    return r;
  }
  const doc = leggiJson(pSimboli) as { simboli: { rif: string; pagina: number }[] };
  const pEsclusi = join(contentDir, 'esclusi', 'descrizioni.json');
  const esclusi = existsSync(pEsclusi) ? (leggiJson(pEsclusi) as { esclusi: { rif?: string }[] }).esclusi : [];
  const esclusiRefs = new Set(esclusi.map((e) => e.rif).filter((r): r is string => typeof r === 'string'));

  const whitelist = costruisciWhitelistDescrizioni();
  const righe: RigaGrezza[] = estraiRigheGrezze(whitelist);
  const primaOccorrenza = new Map<string, RigaGrezza>();
  for (const riga of righe) if (!primaOccorrenza.has(riga.rif)) primaOccorrenza.set(riga.rif, riga);

  const jsonRefs = new Map(doc.simboli.map((s) => [s.rif, s]));

  for (const [rif, riga] of primaOccorrenza) {
    if (jsonRefs.has(rif) || esclusiRefs.has(rif)) continue;
    const nome = NOMI_DESCRIZIONI[rif] ?? rif;
    r.broken.push(`BROKEN inventario descrizioni: manca ${rif} (${nome}), S3 p. ${riga.pagina}`);
  }
  for (const [rif, simbolo] of jsonRefs) {
    if (!primaOccorrenza.has(rif)) {
      r.broken.push(`BROKEN inventario descrizioni: ${rif} in descrizioni-punti.json non risulta nel testo S3, S3 p. ${simbolo.pagina}`);
    }
  }

  if (r.broken.length === 0) {
    r.ok.push(`OK inventario descrizioni: ${jsonRefs.size} rif`);
  }
  return r;
}

// ===========================================================================
// 3. Inventario isom — §3.1-3.5, 3.7 di [S1] contro content/simboli/isom.json
// ===========================================================================

export function checkInventarioIsom(contentDir: string): Risultato {
  const r = vuoto();
  const pSimboli = join(contentDir, 'simboli', 'isom.json');
  if (!existsSync(pSimboli)) {
    r.skipped.push('- skipped: inventario isom — isom.json assente');
    return r;
  }
  const doc = leggiJson(pSimboli) as { simboli: { rif: string; nome: string; pagina: number }[] };

  const testo = leggiSorgente(ISOM_SORGENTE_MD);
  const righe: RigaConPagina[] = righeConPagina(testo);
  const grezzi: SimboloGrezzo[] = analizzaIsom(righe);
  const elencoFileS5 = readdirSync(ISOM_CARTELLA_S5);
  const { inclusi } = costruisciSimboliIsom(grezzi, elencoFileS5);
  const attesi = new Map(inclusi.map((s) => [s.rif, s]));

  const jsonRefs = new Map(doc.simboli.map((s) => [s.rif, s]));

  for (const [rif, atteso] of attesi) {
    if (!jsonRefs.has(rif)) {
      r.broken.push(`BROKEN inventario isom: manca ${rif} (${atteso.nome}), S1 p. ${atteso.pagina}`);
    }
  }
  for (const [rif, simbolo] of jsonRefs) {
    if (!attesi.has(rif)) {
      r.broken.push(`BROKEN inventario isom: ${rif} in isom.json non atteso (§3.6, artwork mancante o fuori intervallo), S1 p. ${simbolo.pagina}`);
    }
  }

  if (r.broken.length === 0) {
    r.ok.push(`OK inventario isom: ${jsonRefs.size} rif`);
  }
  return r;
}

// ===========================================================================
// 4. Artwork — ogni artwork.path esiste e il suo sha256 combacia; per isom
//    (sha256 lasciato vuoto dal parser) lo calcola e lo scrive, in locale; in
//    CI (CI=1) fallisce invece di scrivere.
// ===========================================================================

type SimboloConArtwork = {
  rif: string;
  fonte: 'S1' | 'S3';
  pagina: number;
  artwork: { path: string; sha256: string };
};

function checkArtworkFile(
  contentDir: string,
  fileSimboli: string,
  fileEsclusi: string,
  ci: boolean,
  r: Risultato,
): void {
  if (!existsSync(fileSimboli)) return;
  const doc = leggiJson(fileSimboli) as { simboli: SimboloConArtwork[] };
  const esclusiRefs = new Set<string>();
  if (existsSync(fileEsclusi)) {
    const escl = leggiJson(fileEsclusi) as { esclusi: { rif?: string }[] };
    for (const e of escl.esclusi) if (typeof e.rif === 'string') esclusiRefs.add(e.rif);
  }

  let modificato = false;
  let controllati = 0;
  let calcolati = 0;
  const brokenPrima = r.broken.length;

  for (const simbolo of doc.simboli) {
    const assoluto = risolviPercorsoContenuto(contentDir, simbolo.artwork.path);
    const fonte = simbolo.fonte === 'S1' ? 'S1' : 'S3';
    if (!existsSync(assoluto)) {
      if (esclusiRefs.has(simbolo.rif)) continue; // gap noto e documentato (es. 12.3)
      r.broken.push(`BROKEN artwork: manca il file per ${simbolo.rif} (${simbolo.artwork.path}), ${fonte} p. ${simbolo.pagina}`);
      continue;
    }
    controllati += 1;
    const calcolato = sha256File(assoluto);
    if (simbolo.artwork.sha256 === '') {
      if (ci) {
        r.broken.push(`BROKEN artwork: checksum non calcolato per ${simbolo.rif} (${simbolo.artwork.path}), ${fonte} p. ${simbolo.pagina} — CI non scrive`);
      } else {
        simbolo.artwork.sha256 = calcolato;
        modificato = true;
        calcolati += 1;
      }
    } else if (simbolo.artwork.sha256 !== calcolato) {
      r.broken.push(
        `BROKEN artwork: checksum non corrispondente per ${simbolo.rif} (${simbolo.artwork.path}), ${fonte} p. ${simbolo.pagina} ` +
          `(atteso ${simbolo.artwork.sha256 || '(vuoto)'}, calcolato ${calcolato})`,
      );
    }
  }

  if (modificato && !ci) {
    scriviJson(fileSimboli, doc);
  }

  if (r.broken.length === brokenPrima && (controllati > 0 || doc.simboli.length > 0)) {
    r.ok.push(
      `OK artwork ${basename(fileSimboli)}: ${controllati}/${doc.simboli.length} file verificati` +
        (calcolati > 0 ? ` (${calcolati} sha256 calcolati e salvati)` : ''),
    );
  }
}

export function checkArtwork(contentDir: string, ci: boolean): Risultato {
  const r = vuoto();
  checkArtworkFile(
    contentDir,
    join(contentDir, 'simboli', 'descrizioni-punti.json'),
    join(contentDir, 'esclusi', 'descrizioni.json'),
    ci,
    r,
  );
  checkArtworkFile(contentDir, join(contentDir, 'simboli', 'isom.json'), join(contentDir, 'esclusi', 'isom.json'), ci, r);
  if (
    !existsSync(join(contentDir, 'simboli', 'descrizioni-punti.json')) &&
    !existsSync(join(contentDir, 'simboli', 'isom.json'))
  ) {
    r.skipped.push('- skipped: artwork — nessun file simboli/*.json');
  }
  return r;
}

// ===========================================================================
// 5. Esempi — conteggio per pagina (17-28) e le tre immagini per voce.
// ===========================================================================

// Conteggio delle stringhe "Descrizione con testo" per pagina, verificato a
// mano contro [S3] (vedi akaaso/09-tasks/_context.md e le note di
// extract-esempi): pagine 17-28, totale 107.
const CONTEGGIO_ESEMPI_PER_PAGINA: Record<number, number> = {
  17: 8,
  18: 9,
  19: 10,
  20: 9,
  21: 9,
  22: 10,
  23: 9,
  24: 9,
  25: 9,
  26: 9,
  27: 9,
  28: 7,
};

export function checkEsempi(contentDir: string): Risultato {
  const r = vuoto();
  const p = join(contentDir, 'esempi', 'esempi.json');
  if (!existsSync(p)) {
    r.skipped.push('- skipped: esempi — esempi.json assente');
    return r;
  }
  const doc = leggiJson(p) as {
    esempi: { codice: string; pagina: number; carta: string; terreno: string; riga: string }[];
  };

  const perPagina = new Map<number, number>();
  for (const e of doc.esempi) perPagina.set(e.pagina, (perPagina.get(e.pagina) ?? 0) + 1);

  for (const [pagina, atteso] of Object.entries(CONTEGGIO_ESEMPI_PER_PAGINA)) {
    const trovato = perPagina.get(Number(pagina)) ?? 0;
    if (trovato !== atteso) {
      r.broken.push(`BROKEN esempi: pagina ${pagina} ha ${trovato} esempi, attesi ${atteso}, S3 p. ${pagina}`);
    }
  }
  for (const pagina of perPagina.keys()) {
    if (!(pagina in CONTEGGIO_ESEMPI_PER_PAGINA)) {
      r.broken.push(`BROKEN esempi: pagina ${pagina} inattesa (fuori dall'intervallo 17-28), S3 p. ${pagina}`);
    }
  }

  for (const e of doc.esempi) {
    for (const campo of ['carta', 'terreno', 'riga'] as const) {
      const assoluto = risolviPercorsoContenuto(contentDir, e[campo]);
      if (!existsSync(assoluto)) {
        r.broken.push(`BROKEN esempi: manca ${campo} (${e[campo]}) per l'esempio ${e.codice}, S3 p. ${e.pagina}`);
      }
    }
  }

  if (r.broken.length === 0) {
    r.ok.push(`OK esempi: ${doc.esempi.length} esempi, 3 immagini ciascuno`);
  }
  return r;
}

// ===========================================================================
// 6. Righe — ogni cella cita un rif esistente nella colonna giusta; le nove
//    righe ufficiali portano il testo verbatim di [S3] p. 3; le righe generate
//    vengono ri-generate con il seed/count dell'intestazione e confrontate
//    byte per byte (finché lo scripts/lib del generatore non esiste, questo
//    ultimo confronto viene saltato con una riga "- skipped: …").
// ===========================================================================

type Cella = { rif: string };
type RigaDescrizione = {
  id: string;
  numero?: string;
  celle: Partial<Record<Colonna, Cella | string>>;
  testo: string;
  origine: 'ufficiale' | 'generata';
};

// Le nove frasi de [S3] p. 3 (Esempio di descrizione dei punti), verificate a
// mano contro il testo convertito (vedi
// akaaso/09-tasks/P1-CONTENUTI-DATA-righe-ufficiali.md): usate per
// confrontare `ufficiali.json` byte per byte sul campo `testo`.
const FRASI_UFFICIALI: Record<string, string> = {
  '1': 'Curva striscia di palude',
  '2': 'Sasso nord ovest, 1 m d’altezza, lato est',
  '3': 'Tra due boschetti fitti',
  '4': 'Depressione centrale, parte est',
  '5': 'Rovina più a est, parte ovest',
  '6': 'Muro di sassi, rovinato, angolo esterno sud-est',
  '7': 'Naso, piede nord-ovest',
  '8': 'Roccia superiore, 2 m d’altezza',
  '9': 'Incrocio sentieri',
};

/** Ogni cella di `riga` che è un riferimento (non una stringa F libera) deve esistere in `simboli` sotto la colonna giusta. */
function validaCelle(
  riga: RigaDescrizione,
  simboliPerColonna: Map<Colonna, Set<string>>,
  fonte: string,
  pagina: number | undefined,
  r: Risultato,
  nomeCheck: string,
): void {
  const luogo = pagina === undefined ? fonte : `${fonte} p. ${pagina}`;
  for (const [colonna, cella] of Object.entries(riga.celle) as [Colonna, Cella | string][]) {
    if (typeof cella === 'string') continue; // colonna F libera (dimensione), non un rif
    if (!cella || typeof cella.rif !== 'string') continue;
    const validi = simboliPerColonna.get(colonna);
    // S3 rule: with `tra` (11.15) or a combination (10.1/10.2) the second
    // column-D feature is written in column E — a D ref in E is then valid.
    const secondoOggetto =
      colonna === 'E' &&
      ((riga.celle.G as Cella | undefined)?.rif === '11.15' ||
        ['10.1', '10.2'].includes((riga.celle.F as Cella | undefined)?.rif ?? '')) &&
      (simboliPerColonna.get('D')?.has(cella.rif) ?? false);
    if (secondoOggetto) continue;
    if (!validi || !validi.has(cella.rif)) {
      r.broken.push(
        `BROKEN ${nomeCheck}: riga ${riga.id} cita ${cella.rif} in colonna ${colonna}, rif sconosciuto o colonna errata (${luogo})`,
      );
    }
  }
}

function mappaSimboliPerColonna(descrizioni: { rif: string; colonna?: Colonna }[]): Map<Colonna, Set<string>> {
  const mappa = new Map<Colonna, Set<string>>();
  for (const s of descrizioni) {
    if (!s.colonna) continue;
    if (!mappa.has(s.colonna)) mappa.set(s.colonna, new Set());
    mappa.get(s.colonna)!.add(s.rif);
  }
  return mappa;
}

function checkUfficiali(contentDir: string, simboliPerColonna: Map<Colonna, Set<string>>, r: Risultato): void {
  const p = join(contentDir, 'righe', 'ufficiali.json');
  if (!existsSync(p)) {
    r.skipped.push('- skipped: righe ufficiali — ufficiali.json assente');
    return;
  }
  const doc = leggiJson(p) as { pagina: number; righe: RigaDescrizione[] };
  if (doc.righe.length !== 9) {
    r.broken.push(`BROKEN righe: ufficiali.json ha ${doc.righe.length} righe, attese 9, S3 p. ${doc.pagina}`);
  }
  for (const riga of doc.righe) {
    validaCelle(riga, simboliPerColonna, 'S3', doc.pagina, r, 'righe ufficiali');
    const atteso = riga.numero ? FRASI_UFFICIALI[riga.numero] : undefined;
    if (atteso !== undefined && riga.testo !== atteso) {
      r.broken.push(
        `BROKEN righe: riga ${riga.id} testo "${riga.testo}" diverso dal verbatim di [S3] p. 3 "${atteso}"`,
      );
    }
  }
  if (r.broken.length === 0) r.ok.push(`OK righe ufficiali: ${doc.righe.length} righe`);
}

async function checkGenerate(contentDir: string, simboliPerColonna: Map<Colonna, Set<string>>, r: Risultato): Promise<void> {
  const p = join(contentDir, 'righe', 'generate.json');
  if (!existsSync(p)) {
    r.skipped.push('- skipped: righe generate — generate.json assente');
    return;
  }
  const doc = leggiJson(p) as {
    count: number;
    seed: number;
    righe: RigaDescrizione[];
  };
  const brokenPrima = r.broken.length;

  for (const riga of doc.righe) {
    validaCelle(riga, simboliPerColonna, 'generate.json', undefined, r, 'righe generate');
  }
  if (doc.righe.length !== doc.count) {
    r.broken.push(`BROKEN righe: generate.json ha ${doc.righe.length} righe, l'intestazione dichiara count=${doc.count}`);
  }

  // Punto di innesto per P1-CONTENUTI-TOOL-generate-righe: una volta che
  // scripts/lib/righe-regole.ts esporta un rigeneratore completo per
  // (count, seed), lo si importa qui, si rigenera in una cartella
  // temporanea e si confronta byte per byte con questo file; finché non
  // esiste, il confronto viene saltato (le celle sono comunque validate sopra).
  let rigenerazione: 'ok' | 'diversa' | undefined;
  const percorsoRegole = join(RADICE, 'scripts', 'lib', 'righe-regole.ts');
  if (!existsSync(percorsoRegole)) {
    r.skipped.push('- skipped: righe generate — rigenerazione byte-per-byte non disponibile (scripts/lib/righe-regole.ts assente)');
  } else {
    try {
      const modulo = (await import(pathToFileURL(percorsoRegole).href)) as {
        rigeneraTutte?: (count: number, seed: number) => unknown;
      };
      if (typeof modulo.rigeneraTutte !== 'function') {
        r.skipped.push('- skipped: righe generate — scripts/lib/righe-regole.ts non espone rigeneraTutte()');
      } else {
        const fresco = modulo.rigeneraTutte(doc.count, doc.seed);
        const testoFresco = `${JSON.stringify(fresco, null, 2)}\n`;
        const testoReale = readFileSync(p, 'utf8');
        if (testoFresco !== testoReale) {
          r.broken.push(`BROKEN righe: generate.json diverso dalla rigenerazione con count=${doc.count} seed=${doc.seed}`);
          rigenerazione = 'diversa';
        } else {
          rigenerazione = 'ok';
        }
      }
    } catch (e) {
      r.skipped.push(`- skipped: righe generate — rigenerazione non riuscita (${(e as Error).message})`);
    }
  }

  if (r.broken.length === brokenPrima) {
    r.ok.push(
      `OK righe generate: ${doc.righe.length} righe` +
        (rigenerazione === 'ok' ? ', rigenerazione byte-per-byte identica' : ''),
    );
  }
}

export async function checkRighe(contentDir: string): Promise<Risultato> {
  const r = vuoto();
  const pDescrizioni = join(contentDir, 'simboli', 'descrizioni-punti.json');
  if (!existsSync(pDescrizioni)) {
    r.skipped.push('- skipped: righe — descrizioni-punti.json assente (servono i rif per validare le celle)');
    return r;
  }
  const descrizioni = (leggiJson(pDescrizioni) as { simboli: { rif: string; colonna?: Colonna }[] }).simboli;
  const simboliPerColonna = mappaSimboliPerColonna(descrizioni);

  checkUfficiali(contentDir, simboliPerColonna, r);
  await checkGenerate(contentDir, simboliPerColonna, r);
  return r;
}

// ===========================================================================
// 7. Compatibilità — ogni rif citato in content/compatibilita.json esiste.
//    Non ancora presente nel contenuto reale (task a parte): salta finché non
//    esiste. Forma non ancora fissata: cerca genericamente ogni stringa a
//    forma di rif descrizioni (chiave o valore) e la confronta con l'elenco.
// ===========================================================================

const RIF_DESCRIZIONI_RE = /^\d{1,2}\.\d{1,2}$/;

function trovaRifPossibili(dato: unknown, percorso: string, trovati: [string, string][]): void {
  if (typeof dato === 'string' && RIF_DESCRIZIONI_RE.test(dato)) {
    trovati.push([dato, percorso]);
    return;
  }
  if (Array.isArray(dato)) {
    dato.forEach((v, i) => trovaRifPossibili(v, `${percorso}[${i}]`, trovati));
    return;
  }
  if (isPlainObject(dato)) {
    for (const [chiave, valore] of Object.entries(dato)) {
      // `valori` are dimension strings ("1.0", "5x5"), `note`/`tipo` are prose: not refs.
      if (CHIAVI_NON_RIF.has(chiave)) continue;
      if (RIF_DESCRIZIONI_RE.test(chiave)) trovati.push([chiave, `${percorso}.${chiave}`]);
      trovaRifPossibili(valore, `${percorso}.${chiave}`, trovati);
    }
  }
}
const CHIAVI_NON_RIF = new Set(['valori', 'note', 'tipo', 'v', 'sorgente']);

export function checkCompatibilita(contentDir: string): Risultato {
  const r = vuoto();
  const percorso = join(contentDir, 'compatibilita.json');
  if (!existsSync(percorso)) {
    r.skipped.push('- skipped: compatibilita — compatibilita.json assente');
    return r;
  }
  const pDescrizioni = join(contentDir, 'simboli', 'descrizioni-punti.json');
  if (!existsSync(pDescrizioni)) {
    r.skipped.push('- skipped: compatibilita — descrizioni-punti.json assente');
    return r;
  }
  const rifValidi = new Set(
    (leggiJson(pDescrizioni) as { simboli: { rif: string }[] }).simboli.map((s) => s.rif),
  );
  const dato = leggiJson(percorso);
  const trovati: [string, string][] = [];
  trovaRifPossibili(dato, '$', trovati);
  const sconosciuti = trovati.filter(([rif]) => !rifValidi.has(rif));
  for (const [rif, percorsoJson] of sconosciuti) {
    r.broken.push(`BROKEN compatibilita: rif sconosciuto ${rif} in ${percorsoJson}`);
  }
  if (r.broken.length === 0) {
    r.ok.push(`OK compatibilita: ${trovati.length} rif citati, tutti validi`);
  }
  return r;
}

// ===========================================================================
// Orchestratore
// ===========================================================================

export async function runChecks(contentDir: string, opts: { ci: boolean }): Promise<Risultato> {
  const risultati = [
    checkSchema(contentDir),
    checkInventarioDescrizioni(contentDir),
    checkInventarioIsom(contentDir),
    checkArtwork(contentDir, opts.ci),
    checkEsempi(contentDir),
    await checkRighe(contentDir),
    checkCompatibilita(contentDir),
  ];
  return unisci(...risultati);
}

if (import.meta.main) {
  const contentDir = join(RADICE, 'content');
  const ci = process.env.CI === '1';
  const { ok, broken, skipped } = await runChecks(contentDir, { ci });
  for (const linea of ok) console.log(linea);
  for (const linea of skipped) console.log(linea);
  for (const linea of broken) console.log(linea);
  process.exit(broken.length > 0 ? 1 : 0);
}
