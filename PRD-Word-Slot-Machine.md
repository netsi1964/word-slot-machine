# PRD — Word Slot Machine

**Version:** 1.1 · **Status:** Draft · **Date:** 23 October 2026  
**Product type:** Playful multilingual word generator · **Default language:** English

## 1. Product vision
Create a playful web application inspired by a slot machine and a three-part face mixer. Three vertically animated reels combine linguistic building blocks to invent surprising words. The experience should be immediate, visually satisfying and usable without a language-model API. An optional future AI feature can propose definitions and example sentences.

## 2. Goals and non-goals
**Goals (MVP)**
- Generate novel word combinations by spinning three independently animated reels.
- Support **English (default), Danish, Spanish and Chinese (Simplified, zh-Hans)** from launch.
- Use the supplied static `word-parts.json` dataset; no word-list generation is required during implementation.
- Require no user account, backend or inference API for core functionality.
- Work well on phone, tablet and desktop; respect reduced-motion preferences.

**Non-goals (MVP)**
- Linguistically valid dictionary words every time.
- Real-time AI-generated definitions, sentences or translations.
- Accounts, social features, payments, collaborative editing or a public dictionary.

## 3. Target users and core experience
For curious language enthusiasts and people who enjoy playful word invention.

1. User opens the website; interface loads in English unless they have previously selected another language.
2. User selects the language of the **generated words** using a selector: English, Dansk, Español, 简体中文.
3. User sees three reels and presses **Spin** (or taps a central action button).
4. Reels spin with a staggered stop, showing the selected three parts.
5. The composed result appears prominently below, with its components visible.
6. User can spin again immediately; optionally copy the result.

Interface translations and linguistic datasets use the same selected language in MVP. The implementation should keep them separate internally so they can be decoupled later.

## 4. Linguistic model and content
### Reel roles
- **Reel A — Beginning:** prefix or prefix-like fragment.
- **Reel B — Core:** recognizable root or stem.
- **Reel C — Ending:** suffix or suffix-like fragment.

The linguistic role names describe the creative mechanism, not a claim that every language forms words identically.

### Supplied dataset (implementation input)
- **Source file:** `word-parts.json` — delivered alongside this PRD. This is the authoritative ready-to-use starter data, not a specification for data to be generated.
- JSON shape: `schemaVersion`, `defaultLanguage`, and `languages` keyed by `en`, `da`, `es`, `zh-Hans`; each language contains `label`, `prefixes`, `roots`, and `suffixes` as arrays of strings.
- Load these arrays directly into the three reels. The empty string is included in `prefixes` and `suffixes` to allow an empty first/third reel; `roots` never contains an empty string.
- Counts differ by language; **200 entries per reel is an optional future expansion target, not an MVP requirement**. Do not generate more entries automatically.
- Data is intentionally playful and includes fragments that are not productive linguistic affixes. Outputs are invented combinations, not verified dictionary words.
- **Joining:** default is direct concatenation with no spaces. Optional language-specific adjustments can be implemented later; do not mutate the JSON dataset.
- **Simplified Chinese:** treat the three reels as beginning / semantic core / ending components of creative compounds, rather than claiming European-style prefix/suffix grammar.

## 5. MVP functional requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Language selector: en, da, es, zh-Hans; English on first visit | Must |
| FR-02 | Three independently animated, vertically scrolling reels | Must |
| FR-03 | Spin randomly selects one entry from each language-specific dataset | Must |
| FR-04 | Reels stop sequentially; completed word is rendered after final stop | Must |
| FR-05 | Blank beginning/ending options; core always populated | Must |
| FR-06 | Accessible controls, keyboard support and reduced-motion fallback | Must |
| FR-07 | Copy invented word to clipboard | Should |
| FR-08 | Persist selected language locally | Should |
| FR-09 | Optional individual reel lock / re-spin | Could |
| FR-10 | Optional last 10 generated words, stored locally | Could |

## 6. User interface and motion
- Central three-column reel display, clearly showing selected parts, with a strong **Spin** button.
- Display final combined word and optionally a small breakdown of its three pieces.
- Reels animate for roughly 1–2 seconds with successive stop offsets; avoid motion that induces nausea. Exact timing adjusted during usability testing.
- Mobile-first responsive design. Touch targets at least 44 × 44 CSS pixels.
- Respect `prefers-reduced-motion`: replace spinning with an immediate or subtle fade transition.
- Support Chinese font fallback and varying word-part widths; layout must not rely on equal character counts.

## 7. Proposed technical architecture
**Frontend:** SvelteKit + TypeScript. Core works client-side; static deployment is sufficient for MVP.

**Supplied files (same folder):** `PRD-Word-Slot-Machine.md`, `word-parts.json`.

**Suggested project layout:**
```text
static/data/word-parts.json       # copy the supplied file unchanged
src/lib/word-generator.ts
src/lib/components/SlotReel.svelte
src/lib/i18n/                  # UI translations
src/routes/+page.svelte
```

**Example JSON structure (the actual file is already provided):**
```json
{
  "schemaVersion": 1,
  "defaultLanguage": "en",
  "languages": {
    "en": { "label": "English", "prefixes": ["", "super"], "roots": ["dream"], "suffixes": ["", "ish"] }
  }
}
```

**Generator pipeline:** Select language → choose three entries → apply language-specific compatibility/joining rules → display parts → animate → show final word. Selection should use unbiased array indexing; optional weights can be added later. Set a maximum retry count for incompatible combinations so generation never hangs.

**Privacy:** No login and no server-side collection of generated words in MVP. Local storage only for preferences/history, if enabled.

## 8. AI enhancements (phase 2, not MVP)
- **What does it mean?** sends the invented word, language and components to a model that returns a **clearly fictional** definition and example sentence.
- AI calls run server-side to protect credentials, with rate limits, budget limits, input validation and output moderation.
- Cache results by `(language, word, datasetVersion, promptVersion)` to avoid paying for repeated generations.
- A deterministic fallback template can supply a simple interpretation without AI, but should not be presented as a trustworthy linguistic definition.

## 9. Acceptance criteria
1. First-time visitor sees the UI in **English**.
2. Switching among **English, Danish, Spanish and Simplified Chinese** changes both interface strings and active word-part dataset without page errors.
3. Repeated spins complete without backend requests or LLM calls.
4. Each reel independently animates and stops; final word corresponds exactly to selected components and language joining rules.
5. Blank prefix and suffix slots can occur, but root never is blank.
6. Works on modern mobile Safari and desktop Chromium/Firefox; touch and keyboard controls work.
7. With reduced motion enabled, no long reel-spin animation runs.
8. Build-time validation checks required language keys, nonempty root arrays, arrays of strings and duplicate entries.
9. The product distinguishes invented output from established dictionary words.

## 10. Risks and decisions
- **Morphology:** English, Danish, Spanish and Chinese cannot all be treated as identical prefix–root–suffix systems. Solve with language-specific data, slot labels and joining rules.
- **Dataset quality:** Use the supplied starter word lists without generating replacements. Expansion toward 200 per slot can be considered later.
- **Combinatorics:** With exactly 200 entries per slot there are mathematically 8,000,000 raw triples **per language**, before blanks, compatibility filters and duplicate resulting spellings.
- **Meaning:** Randomly concatenated morphemes often produce nonsense. This is part of the game; do not promise meaningful words on every spin.
- **Phase-2 AI cost and safety:** Keep separate from the simple static MVP.

## 11. Delivery sequence
**Milestone 1 — Mechanical prototype:** Three working reels, supplied `word-parts.json`, English UI, spin animation, completed word.  
**Milestone 2 — Multilingual MVP:** Use the four datasets already in `word-parts.json`; add language selector, i18n, joining rules, mobile layout, accessibility and QA.  
**Milestone 3 — Optional AI feature:** Fictional definitions and example sentences, backend proxy, caching and cost controls.

## 12. Success measures
- 100% of test spins yield a renderable output without client errors.
- First spin requires a single obvious action.
- Language switching and reduced-motion behaviour pass acceptance tests.
- Informal playtesting: people understand how the three slots combine and voluntarily spin repeatedly.
