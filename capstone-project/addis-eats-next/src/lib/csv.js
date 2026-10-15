// CSV the way spreadsheets expect it (RFC 4180), with no library.
//
//   - A field is wrapped in double quotes when it contains a comma, a double
//     quote, a line break, or leading/trailing spaces.
//   - A double quote inside a field is written twice:  He said "hi"  →  "He said ""hi"""
//   - Rows end with CRLF.
//   - A text cell that starts with = + - @ (or tab / CR) is prefixed with ' so Excel
//     and Sheets show it as text instead of running it as a formula
//     ("CSV injection": a customer could type =HYPERLINK(...) as their address).
//
// Clean test data (Bole, 350, Doro Wat) passes with or without any of this. The
// quoting only shows up on real data, e.g. the address
//     Bole Medhanialem, Building A, House "Blue Gate"
// which without it splits into three columns and breaks every column after it.

const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
  if (value == null) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let s = String(value);
  if (FORMULA_START.test(s)) s = `'${s}`;
  return NEEDS_QUOTES.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * toCsv(rows, columns)
 *   rows:    array of objects
 *   columns: [{ header: 'Total (ETB)', value: (row) => row.total }, …]
 * Returns the whole file as a string: header row, then one line per row.
 */
export function toCsv(rows, columns) {
  const lines = [columns.map((c) => csvCell(c.header))];
  for (const row of rows) lines.push(columns.map((c) => csvCell(c.value(row))));
  return lines.map((cells) => cells.join(',')).join('\r\n') + '\r\n';
}

/**
 * Browser only: hand the CSV to the user as a file download.
 * The BOM (﻿) makes Excel read it as UTF-8, so "Beyaynetu" and "—" survive.
 */
export function downloadCsv(filename, csv) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0); // after the click has been handled
}
