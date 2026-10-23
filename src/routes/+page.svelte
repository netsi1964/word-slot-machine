<script lang="ts">
  import { onMount } from 'svelte';
  import raw from '../../word-parts.json';
  import { copy as translations } from '$lib/i18n';
  import { generate, isLanguage, type Dataset, type Language, type Word } from '$lib/word-generator';

  const data = raw as Dataset;
  let language: Language = 'en';
  let word: Word | null = null;
  let spinning = false;
  let visible = ['', '', ''];
  let stopped = [true, true, true];
  let copied = false;
  let reducedMotion = false;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let intervals: ReturnType<typeof setInterval>[] = [];
  let copiedTimer: ReturnType<typeof setTimeout> | undefined;

  $: labels = translations[language];
  $: parts = data.languages[language];
  $: documentLanguage = language === 'zh-Hans' ? 'zh-Hans' : language;

  const columns = ['prefixes', 'roots', 'suffixes'] as const;

  function cancelAnimations() {
    timers.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    timers = [];
    intervals = [];
    spinning = false;
    stopped = [true, true, true];
  }

  function reset() {
    cancelAnimations();
    word = null;
    visible = [
      parts.prefixes.find(Boolean) ?? '',
      parts.roots[0],
      parts.suffixes.find(Boolean) ?? ''
    ];
    copied = false;
  }

  function chooseLanguage(event: Event) {
    const candidate = (event.currentTarget as HTMLSelectElement).value;
    if (!isLanguage(candidate)) return;
    language = candidate;
    try { localStorage.setItem('word-slot-machine:language', candidate); } catch { /* storage disabled */ }
    document.documentElement.lang = documentLanguage;
    reset();
  }

  function spin() {
    if (spinning) return;
    cancelAnimations();
    copied = false;
    const next = generate(parts);
    const selected = [next.prefix, next.root, next.suffix];
    word = null;
    spinning = true;
    stopped = [false, false, false];
    if (reducedMotion) {
      visible = selected;
      stopped = [true, true, true];
      word = next;
      spinning = false;
      return;
    }
    columns.forEach((column, index) => {
      const options = parts[column];
      const interval = setInterval(() => {
        visible = visible.map((value, at) =>
          at === index ? options[Math.floor(Math.random() * options.length)] : value
        );
      }, 70 + index * 12);
      intervals.push(interval);
      const timer = setTimeout(() => {
        clearInterval(interval);
        visible = visible.map((value, at) => at === index ? selected[index] : value);
        stopped = stopped.map((value, at) => at === index ? true : value);
        if (index === 2) {
          spinning = false;
          word = next;
        }
      }, 950 + index * 360);
      timers.push(timer);
    });
  }

  async function copyWord() {
    if (!word) return;
    try {
      await navigator.clipboard.writeText(word.value);
      copied = true;
      if (copiedTimer) clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => copied = false, 2000);
    } catch {
      copied = false;
    }
  }

  onMount(() => {
    const saved = (() => { try { return localStorage.getItem('word-slot-machine:language'); } catch { return null; } })();
    language = saved && isLanguage(saved) ? saved : 'en';
    document.documentElement.lang = language;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reducedMotion = media.matches; if (reducedMotion && spinning) reset(); };
    update();
    media.addEventListener('change', update);
    reset();
    return () => {
      cancelAnimations();
      media.removeEventListener('change', update);
      if (copiedTimer) clearTimeout(copiedTimer);
    };
  });
</script>

<svelte:head>
  <title>{labels.title} — The Word Lab</title>
  <meta name="description" content={labels.subtitle} />
</svelte:head>

<div class="scene">
  <div class="orb orb-left" aria-hidden="true"></div>
  <div class="orb orb-right" aria-hidden="true"></div>
  <div class="letter letter-a" aria-hidden="true">A</div>
  <div class="letter letter-b" aria-hidden="true">B</div>
  <div class="letter letter-c" aria-hidden="true">文</div>
  <main class="machine">
    <header class="header">
      <span class="eyebrow">✦ {labels.eyebrow} ✦</span>
      <div class="language-control">
        <label for="language">{labels.language}</label>
        <select id="language" aria-label={labels.language} value={language} on:change={chooseLanguage}>
          {#each Object.entries(data.languages) as [code, entry]}
            <option value={code}>{entry.label}</option>
          {/each}
        </select>
      </div>
    </header>

    <div class="intro">
      <h1>{labels.title}</h1>
      <p>{labels.subtitle}</p>
    </div>

    <section class="slot-machine" aria-label={labels.title}>
      <div class="slot-top"><span class="slot-light"></span><span class="slot-light"></span><span class="slot-light"></span><span class="slot-light"></span><span class="slot-light"></span><span class="slot-light"></span><span class="slot-light"></span></div>
      <div class="reels">
        {#each columns as column, i}
          <div class="reel-column">
            <span class="reel-label">{[labels.beginning, labels.core, labels.ending][i]}</span>
            <div class:rolling={spinning && !stopped[i]} class="reel" aria-label={[labels.beginning, labels.core, labels.ending][i]}>
              <span class="reel-text" lang={language}>{visible[i] || labels.blank}</span>
            </div>
          </div>
        {/each}
      </div>
      <div class="slot-base"><span>✦</span><span>✦</span><span>✦</span></div>
    </section>

    <button type="button" class="spin-button" on:click={spin} disabled={spinning} aria-busy={spinning}>
      <span aria-hidden="true">↻</span> {spinning ? labels.spinning : labels.spin}
    </button>

    <section class="result" aria-live="polite" aria-atomic="true">
      <span class="result-label">{word ? labels.result : labels.waiting}</span>
      {#if word}
        <div class="invented-word" lang={language}>{word.value}</div>
        <div class="breakdown" lang={language}><span>{word.prefix || '∅'}</span><b>+</b><span>{word.root}</span><b>+</b><span>{word.suffix || '∅'}</span></div>
        <button type="button" class="copy-button" on:click={copyWord}>{copied ? '✓ ' + labels.copied : '⧉ ' + labels.copy}</button>
      {:else}
        <div class="placeholder" aria-hidden="true">✦ · ✦ · ✦</div>
      {/if}
    </section>
    <footer><p>{labels.hint}</p><small>{labels.credits}</small></footer>
  </main>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html) { min-width: 320px; background: #151d3a; }
  :global(body) { margin: 0; font-family: ui-rounded, 'Avenir Next', 'Nunito', system-ui, -apple-system, sans-serif; color: #21294e; }
  :global(button), :global(select) { font: inherit; }
  :global(button:focus-visible), :global(select:focus-visible) { outline: 4px solid #5c56ce; outline-offset: 4px; }
  .scene { min-height: 100svh; display: grid; place-items: center; padding: clamp(16px, 5vw, 64px); overflow: hidden; position: relative; isolation: isolate; background: radial-gradient(ellipse at 85% 18%, #ffdaad 0, transparent 38%), radial-gradient(ellipse at 10% 10%, #91d9ed 0, transparent 46%), linear-gradient(145deg, #8acde3, #eff1dd 55%, #f6b697); }
  .scene::before { content: ''; position: absolute; inset: auto -10% -18% -10%; height: 33%; background: linear-gradient(140deg, #227d9b, #469caf 45%, #366487 70%, #1c567c); border-radius: 50% 50% 0 0; z-index: -1; }
  .orb { position: absolute; border-radius: 100%; filter: blur(.2px); z-index: -1; box-shadow: inset -14px -14px 22px #ab518044, 8px 15px 25px #1a355d24; }
  .orb-left { width: 115px; height: 115px; top: 11%; left: 4%; background: linear-gradient(135deg,#ffca60,#ff6b9d); }
  .orb-right { width: 80px; height: 80px; top: 22%; right: 5%; background: linear-gradient(125deg,#a8b2ff,#6854d6); }
  .letter { position: absolute; z-index: -1; font-size: clamp(60px, 8vw, 120px); font-weight: 1000; text-shadow: 5px 10px 0 #173c6024; }
  .letter-a { top: 35%; left: 3%; color: #ffbd54; transform: rotate(-18deg); }
  .letter-b { bottom: 20%; right: 3%; color: #6c69d5; transform: rotate(14deg); }
  .letter-c { top: 5%; right: 10%; color: #ed866d; transform: rotate(15deg); }
  .machine { width: min(100%, 860px); background: #ffffffd9; border: 1px solid #ffffffd9; box-shadow: 0 25px 90px #253d6880, inset 0 2px 0 #fff; backdrop-filter: blur(25px); border-radius: 32px; padding: clamp(20px, 4vw, 48px); text-align: center; }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .eyebrow { font-size: .72rem; letter-spacing: .19em; font-weight: 900; color: #695cb4; }
  .language-control { display: flex; align-items: center; gap: 8px; font-size: .8rem; font-weight: 700; }
  select { min-height: 44px; max-width: 146px; padding: 0 12px; border: 1px solid #c2c8e4; border-radius: 12px; background: white; color: #293153; cursor: pointer; }
  .intro { margin: 30px auto 28px; }
  h1 { font-size: clamp(2rem, 5.8vw, 3.65rem); line-height: 1.06; letter-spacing: -.045em; margin: 0 0 14px; font-weight: 900; }
  .intro p { margin: 0; color: #636b83; font-size: clamp(.9rem, 2.5vw, 1.1rem); }
  .slot-machine { border: 8px solid #363e75; border-radius: 25px; background: #363e75; box-shadow: 0 12px 0 #22284e, 0 20px 32px #20275535; overflow: hidden; }
  .slot-top,.slot-base { height: 26px; display: flex; align-items: center; justify-content: space-around; }
  .slot-light { width: 9px; height: 9px; border-radius: 50%; background: #ffcc80; box-shadow: 0 0 9px #ffcb8a; }
  .slot-base { color: #b7b7eb; }
  .reels { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; }
  .reel-column { min-width: 0; }
  .reel-label { display: block; background: #c2c7e8; color: #3f456e; text-transform: uppercase; font-size: .67rem; letter-spacing: .12em; font-weight: 900; padding: 10px 2px; }
  .reel { display: flex; justify-content: center; align-items: center; min-height: clamp(112px, 18vw, 170px); background: linear-gradient(#d9dce8,#fff 23%,#fff 75%,#d3d7e5); padding: 12px 6px; border-inline: 1px solid #9da5c9; overflow: hidden; }
  .reel-text { display: block; font-size: clamp(1.12rem, 3.2vw, 2.2rem); line-height: 1.2; font-weight: 900; overflow-wrap: anywhere; word-break: break-word; }
  .rolling .reel-text { animation: jitter .12s infinite alternate ease-in-out; filter: blur(1px); }
  @keyframes jitter { from { transform: translateY(-14px); opacity: .65; } to { transform: translateY(14px); opacity: 1; } }
  .spin-button { width: min(100%, 320px); min-height: 62px; margin: 36px auto 24px; padding: 12px 25px; border: 0; border-radius: 100px; background: linear-gradient(135deg,#ff865e,#ef427a); color: white; font-weight: 900; font-size: 1.16rem; box-shadow: 0 7px 0 #ad315f, 0 14px 24px #e6657840; cursor: pointer; transition: transform .15s, box-shadow .15s; }
  .spin-button:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 9px 0 #ad315f,0 16px 24px #e6657840; }
  .spin-button:disabled { opacity: .72; cursor: wait; }
  .spin-button span { font-size: 1.6rem; vertical-align: middle; margin-right: 7px; }
  .result { background: #f4f1ff; border: 1px solid #ded8fa; border-radius: 21px; padding: 23px 16px; min-height: 166px; }
  .result-label { display: block; text-transform: uppercase; letter-spacing: .12em; font-size: .73rem; font-weight: 900; color: #77709b; margin-bottom: 13px; }
  .invented-word { font-size: clamp(1.4rem,5vw,2.8rem); font-weight: 900; color: #443b89; overflow-wrap: anywhere; }
  .breakdown { display: flex; justify-content: center; gap: 9px; align-items: center; flex-wrap: wrap; margin: 9px 0 16px; color: #68628c; font-size: .85rem; }
  .breakdown b { color: #b0a9d2; }
  .copy-button { min-height: 44px; border: 1px solid #aea5df; background: white; color: #4a418c; border-radius: 999px; padding: 9px 20px; font-weight: 800; cursor: pointer; }
  .placeholder { color: #bcb6df; font-size: 2rem; padding: 13px; }
  footer { margin-top: 26px; color: #73798f; font-size: .81rem; }
  footer p { margin: 0 0 8px; }
  footer small { opacity: .72; }
  @media (max-width: 580px) {
    .scene { padding: 12px; }
    .machine { border-radius: 24px; padding: 18px 13px 26px; }
    .header { align-items: flex-start; }
    .eyebrow { max-width: 115px; text-align: left; line-height: 1.8; }
    .language-control label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .intro { margin: 21px 0 25px; }
    .slot-machine { border-width: 5px; border-radius: 18px; }
    .reels { gap: 4px; }
    .reel-label { font-size: .59rem; letter-spacing: .03em; }
    .spin-button { margin-top: 31px; }
    .letter { opacity: .25; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  }
</style>
