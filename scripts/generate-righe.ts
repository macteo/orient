// scripts/generate-righe.ts — `npm run generate:righe -- --count N --seed S`
// (defaults 200 / 20260905). Writes the prefix-stable `content/righe/
// generate.json` (3.004, F-008) via `scripts/lib/righe-regole.ts`'s
// `rigeneraTutte`, and a contact sheet at `content/_contact/righe.html`
// (git-ignored) for a human to eyeball after growing the deck. All the rules
// live in scripts/lib/righe-regole.ts; this file is just argv + I/O, so that
// `scripts/check-content.ts` can import the exact same `rigeneraTutte` it
// diffs against.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Cella, Celle, DocumentoGenerate, RigaDescrizione } from './lib/righe-regole.ts';
import { rigeneraTutte } from './lib/righe-regole.ts';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');

const CONTEGGIO_DEFAULT = 200;
const SEED_DEFAULT = 20260905;

function leggiArgomenti(argv: string[]): { count: number; seed: number } {
  let count = CONTEGGIO_DEFAULT;
  let seed = SEED_DEFAULT;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--count' && argv[i + 1] !== undefined) {
      count = Number(argv[i + 1]);
      i += 1;
    } else if (argv[i] === '--seed' && argv[i + 1] !== undefined) {
      seed = Number(argv[i + 1]);
      i += 1;
    }
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`--count deve essere un intero positivo, ricevuto ${JSON.stringify(count)}`);
  }
  if (!Number.isInteger(seed)) {
    throw new Error(`--seed deve essere un intero, ricevuto ${JSON.stringify(seed)}`);
  }
  return { count, seed };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function testoCella(valore: Cella | string | undefined): string {
  if (valore === undefined) return '';
  if (typeof valore === 'string') return escapeHtml(valore);
  return escapeHtml(valore.direzione ? `${valore.rif}${valore.direzione}` : valore.rif);
}

function rigaContatto(riga: RigaDescrizione): string {
  const celle: (keyof Celle)[] = ['C', 'D', 'E', 'F', 'G', 'H'];
  const td = celle.map((c) => `<td>${testoCella(riga.celle[c])}</td>`).join('');
  return `<tr><td>${escapeHtml(riga.id)}</td><td>${escapeHtml(riga.codice)}</td>${td}<td>${escapeHtml(riga.testo)}</td></tr>`;
}

function scriviContatto(documento: DocumentoGenerate, percorso: string): void {
  mkdirSync(dirname(percorso), { recursive: true });
  const righeHtml = documento.righe.map(rigaContatto).join('\n');
  const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>content/righe/generate.json — foglio di contatto</title>
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 16px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; white-space: nowrap; }
  td:last-child { white-space: normal; }
  caption { text-align: left; margin-bottom: 8px; font-weight: 600; }
</style>
</head>
<body>
<table>
<caption>content/righe/generate.json — count=${documento.count} seed=${documento.seed} versioneRegole=${documento.versioneRegole} (${documento.righe.length} righe, la più recente in fondo)</caption>
<thead><tr><th>id</th><th>codice</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th><th>frase</th></tr></thead>
<tbody>
${righeHtml}
</tbody>
</table>
</body>
</html>
`;
  writeFileSync(percorso, html, 'utf8');
}

function main(): void {
  const { count, seed } = leggiArgomenti(process.argv.slice(2));
  const documento = rigeneraTutte(count, seed);
  const percorsoOut = join(RADICE, 'content', 'righe', 'generate.json');
  writeFileSync(percorsoOut, `${JSON.stringify(documento, null, 2)}\n`, 'utf8');
  scriviContatto(documento, join(RADICE, 'content', '_contact', 'righe.html'));
  console.log(
    `generate-righe: ${documento.righe.length} righe scritte in content/righe/generate.json ` +
      `(count=${count} seed=${seed}), contatto in content/_contact/righe.html`,
  );
}

if (import.meta.main) {
  main();
}
