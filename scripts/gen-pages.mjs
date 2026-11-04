#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Renders the site's markdown pages to the data the app reads:
//
//   content/technical-notes/<slug>.<lang>.md     -> app/data/notes/<slug>.json, notes-index.json        the technical notes, /notes/<slug>
//   content/projects/<repo>/...        -> app/data/projects/<repo>.json, projects-index.json  each project's documents, /projects/<repo>/<page>
//
// A note is written here, in English and in Catalan: the two files of a slug must both be there, carry a
// title and a summary, and hold the same headings at the same levels. A note states its method, its numbers and
// the date of the measurement; it names no issue or pull request (`#123`, `repo#123`), no commit and no branch.
//
// A project's documents are NOT written here: they are the project's own files, copied at the commit that
// content/projects/projects.json names for it (`--sync` writes them, `--verify` compares them with that commit on
// GitHub). A link between two published documents of a project becomes a link to the other page; a link to any
// other file of the repository goes to that file on GitHub at the same commit.
//
// Usage:
//   node scripts/gen-pages.mjs                 render; exit 1 on a refused note or a missing document
//   node scripts/gen-pages.mjs --sync <repo> <commit>   copy that project's documents at <commit>, record it
//   node scripts/gen-pages.mjs --verify        every copied document equals its file at the recorded commit
//   node scripts/gen-pages.mjs --self-test     the note rules, each refusal red

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import { stripHtmlComments } from './md-comments.mjs';
import { catalanStyle } from './catalan-style.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NOTES = join(root, 'content/technical-notes');
const PROJECTS = join(root, 'content/projects');
const PROJECTS_LIST = join(PROJECTS, 'projects.json');
export const LANGS = ['en', 'ca'];
const GITHUB = 'https://github.com/FreeMixer';
const RAW = 'https://raw.githubusercontent.com/FreeMixer';

/** What a note may not carry: process references that mean nothing to a reader. */
export const NOTE_REFUSALS = [
  { name: 'an issue or pull request number', re: /(^|[\s(\[,;])([A-Za-z0-9._-]+)?#\d+\b/ },
  { name: 'a commit hash', re: /\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{7,40}\b/ },
  { name: 'a status line', re: /^\s*\**status:?\**:/im },
  { name: 'a working branch', re: /\b(?:lane|wip|batch|dedupe|checkpoint)\/[A-Za-z0-9._-]+/ },
];

/** Front matter `key: value` lines between `---` fences, then the body. */
export function parseNote(text, where) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`${where}: no front matter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  for (const k of ['title', 'summary', 'measured']) if (!meta[k]) throw new Error(`${where}: no ${k}`);
  return { meta, body: m[2] };
}

/** The headings of a markdown body, as their levels: the shape the two languages must share. */
export function headingShape(body) {
  return body
    .split('\n')
    .filter((l) => /^#{2,4} /.test(l))
    .map((l) => l.indexOf(' '));
}

/** A note's prose for the style checks: no code, no link targets. */
const proseOf = (body) => body.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, 'X').replace(/\]\([^)]*\)/g, '] ');

/** Every refusal a note's text hits, as names. */
export function noteRefusals(text) {
  const out = [];
  const prose = text.replace(/```[\s\S]*?```/g, '');
  for (const { name, re } of NOTE_REFUSALS) if (re.test(prose)) out.push(name);
  return out;
}

function md() {
  const m = new MarkdownIt({ html: false, linkify: false, typographer: false });
  const slugs = new Map();
  m.core.ruler.push('anchors', (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
      const t = state.tokens[i];
      if (t.type !== 'heading_open') continue;
      const text = state.tokens[i + 1].content;
      let base = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const n = slugs.get(base) ?? 0;
      slugs.set(base, n + 1);
      if (n) base = `${base}-${n}`;
      t.attrSet('id', base);
    }
  });
  m.resetSlugs = () => slugs.clear();
  return m;
}

/** Headings of level 2 as a table of contents. */
function toc(m, body) {
  m.resetSlugs();
  const tokens = m.parse(body, {});
  m.resetSlugs();
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open' && tokens[i].tag === 'h2') out.push({ id: tokens[i].attrGet('id'), title: tokens[i + 1].content });
  }
  return out;
}

function renderNotes() {
  const files = existsSync(NOTES) ? readdirSync(NOTES).filter((f) => f.endsWith('.md')).sort() : [];
  const bySlug = new Map();
  const errors = [];
  for (const f of files) {
    const m = /^([a-z0-9-]+)\.([a-z]{2})\.md$/.exec(f);
    if (!m || !LANGS.includes(m[2])) {
      errors.push(`content/technical-notes/${f}: not <slug>.<${LANGS.join('|')}>.md`);
      continue;
    }
    const text = readFileSync(join(NOTES, f), 'utf8');
    try {
      const note = parseNote(text, `content/technical-notes/${f}`);
      for (const r of noteRefusals(text)) errors.push(`content/technical-notes/${f}: carries ${r}`);
      if (m[2] === 'ca') for (const s of catalanStyle(proseOf(`${note.meta.title}\n${note.meta.summary}\n${note.body}`))) errors.push(`content/technical-notes/${f}: ${s}`);
      if (!bySlug.has(m[1])) bySlug.set(m[1], {});
      bySlug.get(m[1])[m[2]] = note;
    } catch (e) {
      errors.push(e.message);
    }
  }
  const out = Object.fromEntries(LANGS.map((l) => [l, []]));
  const m = md();
  for (const [slug, byLang] of bySlug) {
    const missing = LANGS.filter((l) => !byLang[l]);
    if (missing.length) {
      errors.push(`note ${slug}: no ${missing.join(', ')} text`);
      continue;
    }
    const shape = JSON.stringify(headingShape(byLang.en.body));
    for (const l of LANGS.slice(1)) {
      if (JSON.stringify(headingShape(byLang[l].body)) !== shape) errors.push(`note ${slug}: the ${l} headings are not the en headings`);
    }
    for (const l of LANGS) {
      const { meta, body } = byLang[l];
      m.resetSlugs();
      const html = m.render(body);
      m.resetSlugs();
      out[l].push({ slug, order: Number(meta.order ?? 99), title: meta.title, summary: meta.summary, measured: meta.measured, topic: meta.topic ?? '', toc: toc(m, body), html });
    }
  }
  for (const l of LANGS) out[l].sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  return { notes: out, errors };
}

function readProjects() {
  if (!existsSync(PROJECTS_LIST)) return [];
  return JSON.parse(readFileSync(PROJECTS_LIST, 'utf8')).projects;
}

/** The page slug of a document: README.md is the project's own page, the others their file name. */
const pageSlug = (src) => (src === 'README.md' ? '' : posix.basename(src, '.md').toLowerCase());

function renderProjects() {
  const errors = [];
  const out = [];
  for (const p of readProjects()) {
    const published = new Map(p.pages.map((pg) => [pg.src, pageSlug(pg.src)]));
    const pages = [];
    for (const pg of p.pages) {
      const file = join(PROJECTS, p.repo, pg.src);
      if (!existsSync(file)) {
        errors.push(`content/projects/${p.repo}/${pg.src}: missing (node scripts/gen-pages.mjs --sync ${p.repo} ${p.commit})`);
        continue;
      }
      const m = md();
      const dir = posix.dirname(pg.src);
      const rewrite = (href, image) => {
        if (/^[a-z]+:|^#|^\/\//i.test(href)) return href;
        const [path, hash = ''] = href.split('#');
        const target = posix.normalize(posix.join(dir, path)).replace(/^\.\//, '');
        const suffix = hash ? `#${hash}` : '';
        if (!image && published.has(target)) {
          const s = published.get(target);
          return `/projects/${p.repo}${s ? `/${s}` : ''}${suffix}`;
        }
        return image ? `${RAW}/${p.repo}/${p.commit}/${target}` : `${GITHUB}/${p.repo}/blob/${p.commit}/${target}${suffix}`;
      };
      const defaultLink = m.renderer.rules.link_open ?? ((t, i, o, e, s) => s.renderToken(t, i, o));
      m.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
        const t = tokens[idx];
        t.attrSet('href', rewrite(t.attrGet('href'), false));
        return defaultLink(tokens, idx, opts, env, self);
      };
      const defaultImage = m.renderer.rules.image;
      m.renderer.rules.image = (tokens, idx, opts, env, self) => {
        const t = tokens[idx];
        t.attrSet('src', rewrite(t.attrGet('src'), true));
        return defaultImage(tokens, idx, opts, env, self);
      };
      const body = stripHtmlComments(readFileSync(file, 'utf8'));
      const title = (/^# (.+)$/m.exec(body)?.[1] ?? pg.title ?? pg.src).trim();
      pages.push({ slug: pageSlug(pg.src), src: pg.src, title: pg.title ?? title, source: `${GITHUB}/${p.repo}/blob/${p.commit}/${pg.src}`, toc: toc(m, body), html: m.render(body) });
    }
    out.push({ repo: p.repo, commit: p.commit, pages });
  }
  return { projects: out, errors };
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
}

async function sync(repo, commit) {
  const list = JSON.parse(readFileSync(PROJECTS_LIST, 'utf8'));
  const p = list.projects.find((x) => x.repo === repo);
  if (!p) throw new Error(`${repo}: not in content/projects/projects.json`);
  for (const pg of p.pages) {
    const text = await fetchText(`${RAW}/${repo}/${commit}/${pg.src}`);
    const file = join(PROJECTS, repo, pg.src);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  p.commit = commit;
  writeFileSync(PROJECTS_LIST, `${JSON.stringify(list, null, 2)}\n`);
  console.log(`[gen-pages] ${repo}: ${p.pages.length} documents at ${commit}`);
}

async function verify() {
  let bad = 0;
  for (const p of readProjects()) {
    for (const pg of p.pages) {
      const want = await fetchText(`${RAW}/${p.repo}/${p.commit}/${pg.src}`);
      const file = join(PROJECTS, p.repo, pg.src);
      if (!existsSync(file) || readFileSync(file, 'utf8') !== want) {
        console.error(`[gen-pages] content/projects/${p.repo}/${pg.src} is not ${p.repo}'s file at ${p.commit}`);
        bad = 1;
      }
    }
  }
  if (!bad) console.log('[gen-pages] every project document is its file at the recorded commit');
  return bad;
}

function selfTest() {
  const cases = [
    ['a plain note passes', 'Measured on a Pi 5 with 256 frames.', []],
    ['an issue number is refused', 'Fixed in #124.', ['an issue or pull request number']],
    ['a repo issue is refused', 'see plugin-hostd#218.', ['an issue or pull request number']],
    ['a commit is refused', 'at commit 3a144bd1 the host', ['a commit hash']],
    ['a status line is refused', 'Status: proposed\n', ['a status line']],
    ['a branch is refused', 'on lane/foo-bar', ['a working branch']],
    ['a heading anchor is no issue', 'see [the table](#the-table)', []],
    ['a number in code is not read', '```\nissue #12\n```', []],
  ];
  let fail = 0;
  for (const [what, text, want] of cases) {
    const got = noteRefusals(text);
    if (JSON.stringify(got) === JSON.stringify(want)) console.log(`ok   ${what}`);
    else {
      console.log(`FAIL ${what}: ${JSON.stringify(got)}`);
      fail = 1;
    }
  }
  const a = headingShape('## A\n### B\n## C');
  const b = headingShape('## A\n## C');
  if (JSON.stringify(a) === JSON.stringify(b)) {
    console.log('FAIL two languages with different headings read alike');
    fail = 1;
  } else console.log('ok   two languages with different headings differ');
  return fail;
}

const args = process.argv.slice(2);
if (args[0] === '--self-test') process.exit(selfTest());
if (args[0] === '--sync') {
  if (args.length !== 3) {
    console.error('usage: gen-pages.mjs --sync <repo> <commit>');
    process.exit(2);
  }
  await sync(args[1], args[2]);
  process.exit(0);
}
if (args[0] === '--verify') process.exit(await verify());

const { notes, errors: e1 } = renderNotes();
const { projects, errors: e2 } = renderProjects();
const errors = [...e1, ...e2];
// every link a note or a document makes to a note or a project page names one that is published
const pagesKnown = new Set([
  ...notes.en.map((n) => `/notes/${n.slug}`),
  '/notes',
  '/projects',
  ...projects.flatMap((p) => p.pages.map((pg) => `/projects/${p.repo}${pg.slug ? `/${pg.slug}` : ''}`)),
]);
const linked = [
  ...LANGS.flatMap((l) => notes[l].map((n) => [`content/technical-notes/${n.slug}.${l}.md`, n.html])),
  ...projects.flatMap((p) => p.pages.map((pg) => [`content/projects/${p.repo}/${pg.src}`, pg.html])),
];
for (const [where, html] of linked) {
  for (const [, href] of html.matchAll(/href="((?:\/ca)?\/(?:notes|projects)[^"#]*)/g)) {
    if (!pagesKnown.has(href.replace(/^\/ca(?=\/)/, '').replace(/\/$/, ''))) errors.push(`${where}: links ${href}, which is no page`);
  }
}
if (errors.length) {
  for (const e of errors) console.error(`[gen-pages] ${e}`);
  process.exit(1);
}
// one file per note and per project, so a page loads its own text and no other's; the indexes carry no body
const write = (dir, name, data) => {
  mkdirSync(join(root, 'app/data', dir), { recursive: true });
  writeFileSync(join(root, 'app/data', dir, `${name}.json`), `${JSON.stringify(data)}\n`);
};
rmSync(join(root, 'app/data/notes'), { recursive: true, force: true });
rmSync(join(root, 'app/data/projects'), { recursive: true, force: true });
for (const n of notes.en) write('notes', n.slug, Object.fromEntries(LANGS.map((l) => [l, notes[l].find((x) => x.slug === n.slug)])));
for (const p of projects) write('projects', p.repo, p);
writeFileSync(
  join(root, 'app/data/notes-index.json'),
  `${JSON.stringify(Object.fromEntries(LANGS.map((l) => [l, notes[l].map(({ html, toc: _t, ...rest }) => rest)])), null, 1)}\n`,
);
writeFileSync(
  join(root, 'app/data/projects-index.json'),
  `${JSON.stringify(projects.map((p) => ({ repo: p.repo, commit: p.commit, pages: p.pages.map((pg) => ({ slug: pg.slug, src: pg.src, title: pg.title })) })), null, 1)}\n`,
);
console.log(`[gen-pages] ${notes.en.length} notes in ${LANGS.length} languages, ${projects.reduce((n, p) => n + p.pages.length, 0)} documents of ${projects.length} projects`);
