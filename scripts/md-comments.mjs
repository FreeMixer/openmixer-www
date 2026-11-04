// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
//
// A project's markdown can hold HTML comments (a generated file's "do not edit" note, an SPDX line). The renderer
// escapes HTML, so a comment would show as text on the page: drop each one before rendering. A comment inside a
// fenced code block is text the page shows on purpose, and stays.

/** The markdown without its HTML comments, outside fenced code blocks. */
export function stripHtmlComments(md) {
  const parts = md.split(/^(```[^\n]*\n[\s\S]*?^```[ \t]*$)/m);
  return parts
    .map((part, i) => (i % 2 ? part : part.replace(/<!--[\s\S]*?-->[ \t]*\n?/g, '')))
    .join('');
}
