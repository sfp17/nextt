import { test } from 'node:test';
import assert from 'node:assert/strict';
import { etb, etbCompact, when, relative, stamp } from '../src/lib/format.js';

const T = Date.parse('2026-10-13T22:35:00Z'); // 01:35 on 14 Oct in Addis Ababa (UTC+3)

test('etb', () => {
  assert.equal(etb(1050), '1,050 ETB');
  assert.equal(etb(1050, { unit: false }), '1,050');
  assert.equal(etbCompact(37090), '37.1K ETB');
  assert.equal(etbCompact(0), '0 ETB');
});

test('when and stamp use Addis Ababa time, whatever the machine is set to', () => {
  assert.equal(when(T), '14 Oct, 01:35');
  assert.equal(stamp(T), '2026-10-14 01:35');
});

test('relative', () => {
  assert.equal(relative(T, T + 3000), 'just now');
  assert.equal(relative(T, T + 5 * 60000), '5 minutes ago');
  assert.equal(relative(T + 2 * 60000, T), 'in 2 minutes');
  assert.equal(relative(T, T + 26 * 3600000), 'yesterday');
});
