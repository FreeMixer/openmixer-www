// SPDX-License-Identifier: GPL-3.0-or-later
//
// The Catalan style rules of the site's text, in one place: read by scripts/check-i18n.mjs for the message files and
// by scripts/gen-pages.mjs for the notes. No comma before "i" or "o", and none of the translations the glossary
// (i18n/glossary.json) refuses.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const glossary = JSON.parse(readFileSync(join(root, 'i18n/glossary.json'), 'utf8'));

/** Every form the glossary refuses, with the rule that refuses it. */
export const REFUSED = [...glossary.keep, ...glossary.use].flatMap((g) => g.refuse.map((form) => ({ form, rule: g.term ?? `${g.en} -> ${g.ca}` })));

/** Each style finding of a Catalan text (markup already taken out), as a message. */
export function catalanStyle(text) {
  const out = [];
  if (/,\s+[io]\s/u.test(text)) out.push(`comma before "i"/"o": "${text.match(/.{0,30},\s+[io]\s.{0,20}/u)?.[0]}"`);
  for (const { form, rule } of REFUSED) {
    if (new RegExp(`(?<![\\p{L}])${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu').test(text)) {
      out.push(`"${form}" is refused by the glossary (${rule})`);
    }
  }
  return out;
}
