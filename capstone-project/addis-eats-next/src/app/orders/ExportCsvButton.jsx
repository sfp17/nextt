'use client';

import { useState } from 'react';
import { toCsv, downloadCsv } from '@/lib/csv';
import { stamp } from '@/lib/format';

// The columns of the export. Values go through the same lib/format.js as the
// page, except Total, which stays a plain number so a spreadsheet can add it up.
const COLUMNS = [
  { header: 'Order', value: (o) => o.id },
  { header: 'Placed (Addis Ababa time)', value: (o) => stamp(o.createdAt) },
  { header: 'Status', value: (o) => o.statusLabel },
  { header: 'Neighbourhood', value: (o) => o.neighbourhood ?? '' },
  { header: 'Address', value: (o) => o.address }, // often contains commas: quoted by toCsv
  { header: 'Items', value: (o) => o.items }, // "Doro Wat × 1, Iced Latte × 1"
  { header: 'Total (ETB)', value: (o) => o.total },
];

/**
 * Exports the WHOLE history (every page, current sort ignored), not just the
 * ten rows on screen. `rows` comes from the server, already scoped to the
 * signed-in customer, and holds only the fields above.
 */
export default function ExportCsvButton({ rows }) {
  const [done, setDone] = useState('');

  const exportCsv = () => {
    const csv = toCsv(rows, COLUMNS);
    const today = stamp(Date.now()).slice(0, 10);
    downloadCsv(`addis-eats-orders-${today}.csv`, csv);
    setDone(`Downloaded ${rows.length} orders.`);
  };

  return (
    <div className="csv-row">
      <p className="sr-only" role="status">{done}</p>
      <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={rows.length === 0}>
        Export CSV ({rows.length} orders)
      </button>
    </div>
  );
}
