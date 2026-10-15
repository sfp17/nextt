import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrderForOwner } from '@/lib/orders';
import { trackingSnapshot } from '@/lib/delivery';

// Live order status as Server-Sent Events (SSE).
//
// Why SSE and not polling (Day 41) or WebSockets: the data only flows one way
// (server → browser), so a plain HTTP response that stays open is enough.
// EventSource in the browser reconnects by itself, and it's ordinary HTTP, so
// cookies, the proxy and this route's own checks all still apply.
//
// SSE framing (what the browser parses):
//   retry: 3000\n\n                     how long to wait before reconnecting
//   event: status\n                     the event name (addEventListener('status', …))
//   id: 1760395000000\n                 sent back as Last-Event-ID on reconnect
//   data: {"status":"on_the_way",…}\n   ONE line; JSON.stringify never emits a raw newline
//   \n                                  a blank line ends the event
//   : keep-alive\n\n                    a comment line: ignored by the browser, keeps proxies from timing out

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Vercel: let the function stay open long enough

const TICK_MS = 1000; // check the order every second, but only SEND when something changed
const HEARTBEAT_MS = 15000; // comment line when nothing has changed for 15 s
const MAX_OPEN_MS = 4 * 60 * 1000; // close before platform limits; EventSource reconnects by itself

export async function GET(request, { params }) {
  const { id } = await params;

  // Same checks as GET /api/orders/[id]. A non-200 answer makes EventSource give up
  // instead of reconnecting, which is exactly right for 401 and 404.
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const userId = session.user.id;
  if (!(await getOrderForOwner(id, userId))) {
    return NextResponse.json({ error: `Order ${id} not found` }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const openedAt = Date.now();
  let timer = null;
  let closed = false;
  let busy = false;
  let lastKey = '';
  let lastSentAt = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const write = (text) => {
        if (closed) return;
        controller.enqueue(encoder.encode(text));
        lastSentAt = Date.now();
      };
      const send = (event, data) => write(`event: ${event}\nid: ${data.sentAt ?? Date.now()}\ndata: ${JSON.stringify(data)}\n\n`);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // already closed by the browser going away
        }
      };
      // The browser closed the tab, navigated away, or called es.close().
      request.signal.addEventListener('abort', close);

      const tick = async () => {
        if (busy || closed) return; // a slow Redis read must not overlap the next tick
        busy = true;
        try {
          const order = await getOrderForOwner(id, userId); // re-checked every time: still theirs?
          if (!order) {
            send('gone', { id, sentAt: Date.now() });
            return close();
          }
          const snap = trackingSnapshot(order);
          const key = `${snap.status}|${snap.courier.lat},${snap.courier.lng}`;
          if (key !== lastKey) {
            lastKey = key;
            send('status', snap);
          } else if (Date.now() - lastSentAt >= HEARTBEAT_MS) {
            write(': keep-alive\n\n');
          }
          if (snap.final) {
            // Tell the client it's over, so it calls es.close(). Without this,
            // EventSource treats the server closing as a dropped line and reconnects.
            send('done', { id, status: snap.status, sentAt: Date.now() });
            return close();
          }
          if (Date.now() - openedAt > MAX_OPEN_MS) close(); // client reconnects and gets a fresh snapshot
        } catch (err) {
          console.error('order stream', id, err);
          close(); // EventSource reconnects after `retry`
        } finally {
          busy = false;
        }
      };

      write('retry: 3000\n\n');
      await tick(); // current state immediately, no waiting for the first interval
      if (!closed) timer = setInterval(tick, TICK_MS);
    },
    cancel() {
      closed = true;
      clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      // no-transform: stops compression (which buffers) and proxies from holding events back
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx-style proxies: don't buffer
    },
  });
}
