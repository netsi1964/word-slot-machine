# Word Slot Machine

A playful, responsive, four-language word-invention game built in SvelteKit and TypeScript. It combines a beginning, a root and an ending from the supplied static word lists. No AI, account or backend required for the MVP.

## Run locally

```sh
npm install
npm run validate:data
npm run check
npm run dev
```

Use `npm run build` to generate a static site in `build/`. Deploy that folder to any static host.

The source dataset stays at the repository root (`word-parts.json`) and is imported directly at build time without modifying it. The PRD is `PRD-Word-Slot-Machine.md`.

The randomizer uses rejection sampling with `crypto.getRandomValues` for unbiased indexing. Spin animations are staggered, with a reduced-motion fallback. Language selection is saved only in the browser.
