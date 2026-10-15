// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv, csvCell } from '../src/lib/csv.js';

// A tiny, strict RFC 4180 reader, so the test checks the ROUND TRIP: what a
// spreadsheet would read back is exactly what we put in.
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', i = 0, quoted = false;
  while (i < text.length) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { quoted = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { quoted = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r' && text[i + 1] === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 2; continue; }
    field += c; i++;
  }
  return rows;
}

const columns = [
  { header: 'Order', value: (r) => r.id },
  { header: 'Address', value: (r) => r.address },
  { header: 'Total (ETB)', value: (r) => r.total },
];

test('clean data passes through untouched', () => {
  assert.equal(toCsv([{ id: 'ORD-1', address: 'Bole', total: 350 }], columns), 'Order,Address,Total (ETB)\r\nORD-1,Bole,350\r\n');
});

test('a value containing a comma stays one column', () => {
  const csv = toCsv([{ id: 'ORD-2', address: 'Bole Medhanialem, Building A', total: 470 }], columns);
  assert.equal(csv.split('\r\n')[1], 'ORD-2,"Bole Medhanialem, Building A",470');
  assert.deepEqual(parseCsv(csv)[1], ['ORD-2', 'Bole Medhanialem, Building A', '470']);
});

test('a value containing a quotation mark is escaped by doubling it', () => {
  const csv = toCsv([{ id: 'ORD-3', address: 'House "Blue Gate"', total: 120 }], columns);
  assert.equal(csv.split('\r\n')[1], 'ORD-3,"House ""Blue Gate""",120');
  assert.deepEqual(parseCsv(csv)[1], ['ORD-3', 'House "Blue Gate"', '120']);
});

test('comma + quote + line break together round-trip exactly', () => {
  const nasty = 'Kazanchis, "Lucy" building,\nfloor 3';
  const rows = parseCsv(toCsv([{ id: 'ORD-4', address: nasty, total: 1 }], columns));
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], ['ORD-4', nasty, '1']);
});

test('formula-looking text is neutralised, numbers are not', () => {
  assert.equal(csvCell('=HYPERLINK("http://x")'), `"'=HYPERLINK(""http://x"")"`);
  assert.equal(csvCell('-5 Bole'), "'-5 Bole");
  assert.equal(csvCell(-5), '-5');
});

test('empty and missing values become empty cells', () => {
  assert.equal(toCsv([{ id: 'ORD-5', address: null, total: undefined }], columns).split('\r\n')[1], 'ORD-5,,');
});
