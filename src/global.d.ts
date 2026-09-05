// Project-wide ambient declarations.
//
// Preline 5's `global.d.ts` (ambient `Window.HSStaticMethods`) is not wired
// into the package's published type exports, so plain `import 'preline'`
// does not bring the ambient declaration in under strict TypeScript. This
// file supplies the minimal typing `src/sito/preline.ts` needs.
//
// Kept at `src/` top level, not next to `preline.ts`: a `.d.ts` file sharing
// a basename with a `.ts` file in the same directory is silently dropped by
// tsc (treated as that file's own stale declaration output).
export {};

declare global {
  interface Window {
    HSStaticMethods?: {
      autoInit: (collection?: string) => void;
    };
  }
}
