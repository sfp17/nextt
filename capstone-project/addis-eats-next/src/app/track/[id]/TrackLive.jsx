'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { etb, relative, time, when } from '@/lib/format';

// Leaflet touches `window` the moment it's imported, so the map can't render on
// the server. ssr:false loads it only in the browser; `loading` is a placeholder
// with the map's exact size, so nothing below it jumps when the map arrives.
// (ssr:false is only allowed inside a client component, which is why this
// import lives here and not in page.js.)
const DeliveryMap = dynamic(() => import('./DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="delivery-map map-placeholder" role="img" aria-label="Map loading">
      <span>Loading map…</span>
    </div>
  ),
});

const CONNECTION = {
  connecting: { label: 'Connecting…', tone: 'wait' },
  live: { label: 'Live', tone: 'ok' },
  reconnecting: { label: 'Connection lost, reconnecting…', tone: 'wait' },
  closed: { label: 'Finished: no more updates', tone: 'off' },
  failed: { label: 'Disconnected. Reload to try again', tone: 'bad' },
};

/** A clock that starts at the SERVER's time (so the first render matches the HTML), then ticks. */
function useNow(start) {
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function TrackLive({ initial, kitchen }) {
  const [snap, setSnap] = useState(initial);
  const [connection, setConnection] = useState(initial.final ? 'closed' : 'connecting');
  const now = useNow(initial.sentAt);

  useEffect(() => {
    if (initial.final) return; // a finished order never changes: don't open a stream at all

    const es = new EventSource(`/api/orders/${encodeURIComponent(initial.id)}/stream`);
    es.onopen = () => setConnection('live');
    es.addEventListener('status', (e) => {
      const next = JSON.parse(e.data);
      setSnap(next);
      setConnection('live');
      if (next.final) {
        es.close(); // delivered or cancelled: close on our side straight away
        setConnection('closed');
      }
    });
    es.addEventListener('done', () => {
      es.close(); // without this, EventSource would treat the server closing as a drop and reconnect
      setConnection('closed');
    });
    es.addEventListener('gone', () => {
      es.close();
      setConnection('failed');
    });
    // Fires on every drop. EventSource retries by itself (CONNECTING); if the server
    // answered with an error status (401/404) it gives up (CLOSED).
    es.onerror = () => setConnection(es.readyState === EventSource.CLOSED ? 'failed' : 'reconnecting');

    return () => es.close(); // leaving the page closes the stream
  }, [initial.id, initial.final]);

  const conn = CONNECTION[connection];
  // "Kazanchis, Bole Medhanialem…" but not "Mexico, Mexico, house 232"
  const area = snap.neighbourhood && !snap.address.startsWith(snap.neighbourhood) ? `${snap.neighbourhood}, ` : '';

  return (
    <div className="track-layout">
      <div className="track-map-col">
        <DeliveryMap
          courier={snap.courier}
          destination={snap.destination}
          kitchen={kitchen}
          final={snap.final}
        />
        <p className="map-note">
          Everything on the map is also written out in the delivery details. Map data{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OpenStreetMap contributors
          </a>
        </p>
      </div>

      <section className="card track-details" aria-labelledby="track-details-heading">
        <div className="track-details-head">
          <h2 id="track-details-heading">Delivery details</h2>
          <p className={`conn conn-${conn.tone}`} role="status" aria-live="polite">
            <span className="conn-dot" aria-hidden="true" />
            {conn.label}
          </p>
        </div>

        <p className="track-status" aria-live="polite">
          <span className={`status-pill ${snap.status}`}>{snap.statusLabel}</span>
        </p>

        <dl className="track-facts">
          <div>
            <dt>Courier</dt>
            <dd>{snap.courierText}</dd>
          </div>
          {!snap.final && (
            <>
              <div>
                <dt>Distance left</dt>
                <dd>{snap.remainingKm} km</dd>
              </div>
              <div>
                <dt>Expected</dt>
                <dd>
                  {time(snap.etaAt)} <span className="muted">({relative(snap.etaAt, now)})</span>
                </dd>
              </div>
            </>
          )}
          {snap.deliveredAt && (
            <div>
              <dt>Delivered</dt>
              <dd>
                {when(snap.deliveredAt)} <span className="muted">({relative(snap.deliveredAt, now)})</span>
              </dd>
            </div>
          )}
          <div>
            <dt>Delivering to</dt>
            <dd>
              {area}
              {snap.address}
            </dd>
          </div>
          <div>
            <dt>Placed</dt>
            <dd>
              {when(snap.createdAt)} <span className="muted">({relative(snap.createdAt, now)})</span>
            </dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{etb(snap.total)}</dd>
          </div>
        </dl>

        <div className="track-progress" aria-hidden="true">
          <span style={{ width: `${Math.round(snap.progress * 100)}%` }} />
        </div>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Route {Math.round(snap.progress * 100)}% complete
        </p>
      </section>
    </div>
  );
}
