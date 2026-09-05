import { existsSync, globSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const generatedPagesDir = '.generated/pages';

const generatedInputs = existsSync(generatedPagesDir)
  ? globSync(`${generatedPagesDir}/**/index.html`).sort()
  : [];

/**
 * Vite nomina ogni HTML emesso con il suo percorso relativo alla root del
 * progetto, non con la chiave dell'input: le dodici pagine di serie e la
 * pagina fonti finirebbero in `dist/.generated/pages/…`. Questo plugin (dopo
 * `vite:build-html`, da cui `enforce: 'post'`) toglie quel prefisso, così le
 * pagine escono ai percorsi del registro rotte: `dist/<mazzo>/quiz/index.html`,
 * `dist/fonti/index.html`. Gli URL degli asset dentro l'HTML non cambiano
 * perché `base` è sempre assoluto (`/` o `/orient/`), quindi indipendente
 * dalla profondità della pagina.
 */
function paginePiatte(): Plugin {
  const prefisso = `${generatedPagesDir}/`;
  return {
    name: 'orient:pagine-piatte',
    enforce: 'post',
    generateBundle(_opzioni, bundle) {
      for (const [chiave, file] of Object.entries(bundle)) {
        if (!chiave.startsWith(prefisso)) continue;
        const nuovo = chiave.slice(prefisso.length);
        if (bundle[nuovo]) {
          throw new Error(`vite: due pagine emesse collidono su ${nuovo}`);
        }
        file.fileName = nuovo;
        delete bundle[chiave];
        bundle[nuovo] = file;
      }
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  publicDir: 'public',
  plugins: [tailwindcss(), paginePiatte()],
  define: {
    'import.meta.env.VITE_TEST_SEED': JSON.stringify(process.env.VITE_TEST_SEED ?? ''),
  },
  build: {
    rollupOptions: {
      input: ['index.html', ...generatedInputs],
    },
  },
});
