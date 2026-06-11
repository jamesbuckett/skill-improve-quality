#!/usr/bin/env node
// Runs the audit scripts in scripts/audits/ against the planted-issues fixture
// and asserts each catches what the answer key says it must (S1-S6, N4).
//
// Requires the `playwright` npm package to be resolvable. Run from any
// directory whose node_modules contains playwright, or set PLAYWRIGHT_PKG to
// a directory that has it. Set PLAYWRIGHT_CHROMIUM to a chromium binary if
// the package's bundled browser download is missing.
//
// Usage: node evals/run-browser-audits.mjs
import { createRequire } from 'module';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const SKILL_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = 'file://' + join(SKILL_DIR, 'evals', 'fixtures', 'index.html');
// Strip the header comments and wrap as an IIFE: page.evaluate(string) treats
// the string as an expression and does not auto-invoke function expressions.
const audit = (name) => {
  const src = readFileSync(join(SKILL_DIR, 'scripts', 'audits', name), 'utf8');
  return `(${src.slice(src.indexOf('() =>'))})()`;
};

function resolvePlaywright() {
  for (const base of [process.env.PLAYWRIGHT_PKG, process.cwd()].filter(Boolean)) {
    try {
      return createRequire(join(base, 'package.json'))('playwright');
    } catch { /* try next */ }
  }
  console.error('playwright not resolvable — run from a project with playwright installed, or set PLAYWRIGHT_PKG');
  process.exit(2);
}

function findChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  const cache = join(os.homedir(), '.cache', 'ms-playwright');
  if (!existsSync(cache)) return undefined;
  const builds = readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const b of builds) {
    const bin = join(cache, b, 'chrome-linux', 'chrome');
    if (existsSync(bin)) return bin;
  }
  return undefined;
}

const { chromium } = resolvePlaywright();
const browser = await chromium.launch({ headless: true, executablePath: findChromium() }).catch(async () =>
  chromium.launch({ headless: true }));
const page = await browser.newPage();
await page.goto(FIXTURE);

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures += 1;
};

// Emoji audit must catch the text emoji (S2) AND the pseudo-element emoji (S3)
const emoji = await page.evaluate(audit('emoji-audit.js'));
check('emoji audit catches text emoji 🔐 (S2)', emoji.some(e => e.codepoint === '1f510' && e.via === 'text'));
check('emoji audit catches ::before emoji ⚡ (S3)', emoji.some(e => e.codepoint === '26a1' && e.via === '::before'),
  JSON.stringify(emoji));

// Accent audit must report exactly two accent clusters (blue family + purple, S1)
// while ignoring neutrals and folding tints into their family (N4)
const accent = await page.evaluate(audit('accent-audit.js'));
check('accent audit reports 2 accent clusters (S1)', accent.accentClusters === 2, JSON.stringify(accent.accents));
check('accent audit excludes neutrals from accents', accent.neutralsIgnored > 0);
const purple = accent.accents.find(a => a.hueRange[0] >= 240 && a.hueRange[1] <= 280);
check('purple family identified as separate accent', !!purple, JSON.stringify(accent.accents.map(a => a.hueRange)));

// Switcher audit: snapshot, click, snapshot — counts must be unchanged (S5 detected)
const snapA = await page.evaluate(audit('visibility-snapshot.js'));
await page.click('#audience-toggle');
const snapB = await page.evaluate(audit('visibility-snapshot.js'));
check('switcher audit detects non-toggling switcher (S5)', JSON.stringify(snapA) === JSON.stringify(snapB));

// Dark-mode audit: data-theme must flip but bodyBg must NOT change (S6 detected)
const themeA = await page.evaluate(audit('theme-snapshot.js'));
await page.click('#theme-toggle');
const themeB = await page.evaluate(audit('theme-snapshot.js'));
check('dark-mode audit detects inert background (S6)',
  themeA.htmlDataTheme !== themeB.htmlDataTheme && themeA.bodyBg === themeB.bodyBg,
  JSON.stringify({ before: themeA, after: themeB }));

await browser.close();
console.log(failures === 0 ? '\nAll browser-audit expectations met.' : `\n${failures} expectation(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
