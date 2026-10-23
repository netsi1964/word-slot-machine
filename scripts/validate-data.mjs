import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../word-parts.json', import.meta.url), 'utf8'));
const languages = ['en', 'da', 'es', 'zh-Hans'];
const issues = [];
if (data.schemaVersion !== 1) issues.push('Expected schemaVersion 1');
if (data.defaultLanguage !== 'en') issues.push('Expected en as defaultLanguage');
for (const lang of languages) {
  const section = data.languages?.[lang];
  if (!section) { issues.push('Missing language ' + lang); continue; }
  for (const key of ['prefixes', 'roots', 'suffixes']) {
    const values = section[key];
    if (!Array.isArray(values) || !values.length || values.some(v => typeof v !== 'string')) {
      issues.push(lang + '.' + key + ' must be a nonempty string array'); continue;
    }
    if (key === 'roots' && values.includes('')) issues.push(lang + '.roots cannot include an empty value');
    if (new Set(values).size !== values.length) issues.push(lang + '.' + key + ' has duplicates');
  }
}
if (issues.length) { console.error(issues.join('\n')); process.exit(1); }
console.log('Word list validation passed for ' + languages.join(', '));
