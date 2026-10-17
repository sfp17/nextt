# DATA.md: where every piece of data is fetched, and why

**Rule: on the server, unless a person triggers it.** That decides most rows. The exceptions are what a person
types into, or what must keep refreshing on its own. Where a client query is unavoidable, the **server renders the
first result and seeds the client query with it**, so nobody watches a spinner for data we already had.

## Decision two: where data is fetched

| Data | Where | Why |
|------|-------|-----|
| Menu and dishes | **Server**: `/menu` is ISR (`revalidate = 3600`); `/menu/[id]` is pre-rendered for all 19 dishes | Public, indexable, cacheable. Crawlers and social previews get full HTML |
| Order history (`/orders`) | **Server**: `listOrdersForOwner(session.user.id)` in a server component, rendered by `OrderTable` | Private and scoped to the session. No client fetch, no API to attack |
| Delivery tracking (`/track/[id]`) | **Server first, then server-sent events** | `page.js` renders the first snapshot; `EventSource` on `/api/orders/[id]/stream` pushes each change. One-way data, so SSE instead of WebSockets; pushed, so the courier moves every second without 60 requests a minute |
| CSV export (`/orders`) | **Server gives the rows, the browser builds the file** | The server passes the customer's own orders (only the 7 exported fields); `lib/csv.js` turns them into a file with no extra request |
| Order status (`/orders/[id]`) | **Server first, then polled on the client** | Server renders the order (scoped to the owner) and passes it as `fallbackData`; SWR then polls for changes |
| Kitchen board (`/kitchen`) | **Server first, then polled on the client** | Same pattern; the role is checked on the page **and** in the API it polls. Shows orders placed in the app, not the 30-day history |
| Dashboard (`/dashboard`) | **Server: aggregated in `page.js`**, then only the totals are passed to the client chart | Hundreds of orders with names, phones and addresses stay on the server; `RevenueChart` gets 8 + 30 numbers. Smaller payload, and no customer data in the browser. Not polled: it's a 30-day view |
| Order table sort and page | **URL** (`?sort=&dir=&page=`), read from `searchParams` on the server | Shareable, bookmarkable, works with Back; plain links, so no client state. Unknown values fall back to the default (date, newest first), and a page past the end shows the last page |
| Menu search | **Client**: triggered by typing, debounced | Depends on what the person types, so it can't be rendered ahead of time |
| Cart | **Client store** (`localStorage` via `useSyncExternalStore`) | It never leaves the browser until checkout; prices are re-checked on the server there |
| Accounts (`/signup`, Day 49) | **Server action** writes to the shared store | Passwords never leave the server; the email is claimed atomically so it can't be taken twice |
| Welcome / signed-out message | **One-time cookie** set by the server action, read once by `Toaster.jsx` | A redirect can't carry a message; only a fixed code travels, the text is chosen in the browser |
| Who is signed in (header) | **Client**: `/api/session` | Keeps `/`, `/menu` and dish pages static. Reading cookies in the root layout would make every page dynamic |

All client queries use **SWR** and **one shared fetcher** (`src/lib/fetcher.js`), which throws on non-2xx so failures land
in `error`, not in `data`.

> **"staleTime":** SWR's name for it is `dedupingInterval`: for that long after a request, other requests for the same
> key are served from cache instead of the network.

## Every client query

| # | Component | SWR key | Seeded from the server? | Refresh rule | staleTime (`dedupingInterval`) | Reasoning |
|---|-----------|---------|-------------------------|--------------|-------------------------------|-----------|
| 1 | `app/orders/[id]/OrderStatus.jsx` | `/api/orders/{id}` | **Yes**, `fallbackData` from the server component | Polls every **5 s**; stops at `delivered`/`cancelled`; revalidates on focus; no polling in background tabs; `mutate()` right after Cancel | 2 s (default) | Status changes every ~15 s, so 5 s shows a change quickly without hammering the server; a finished order never changes again |
| 2 | `app/kitchen/KitchenBoard.jsx` | `/api/kitchen/orders` | **Yes**, `fallbackData` from the server component | Polls every **5 s**; `mutate()` after "Mark delivered" | 2 s (default) | New orders must appear without reloading |
| 3 | `app/menu/PagedDishes.jsx` | `/api/dishes?page={n}&limit=6&category={cat}` | **Yes**, page 1 / All via `<SWRConfig fallback>` for that **exact key** | None; no revalidate on focus; `keepPreviousData` | **5 min** | The menu changes when the kitchen edits it, not every few seconds. The page number is in the key, so every page is its own cache entry |
| 4 | `app/menu/SearchBox.jsx` | `/api/dishes?q={term}&category={cat}&page=1&limit=50`, or **`null`** when the box is empty | Its empty state **is** the seeded menu (row 3): no request until there is a term | **Debounced 300 ms**; no revalidate on focus; `keepPreviousData` | **60 s** | One request per pause, not per keystroke. The null key means an empty box sends nothing. SWR caches per key, so a slow "d" response can't overwrite "doro" |
| 5 | `app/AuthStatus.jsx` | `/api/session` | No (the header shows "Sign in" until it answers) | Re-checked after every navigation and on focus | 2 s (default) | Sign-in and sign-out change the cookie on the server; the header has to notice |

## The stream (`/api/orders/[id]/stream`, Day 47)
| Rule | Value | Why |
|------|-------|-----|
| Checks | Session (401) and ownership (404) before the stream opens, and ownership again on every tick | A non-200 answer makes EventSource stop instead of retrying forever |
| Framing | `retry: 3000`, then `event: status` / `id:` / one `data:` line of JSON / blank line | JSON is always one line, so each event is one `data:` line |
| When it sends | Checks every 1 s, **sends only when the status or courier position changed**; a `: keep-alive` comment after 15 s of silence | No duplicate events; proxies don't time out a quiet connection |
| When it closes | On delivery or cancellation (`event: done`, then the server closes); when the browser leaves (`request.signal` abort); after 4 min (the client reconnects and gets a fresh snapshot) | `done` tells the client to call `es.close()`. Otherwise EventSource would see a closed connection as a drop and reconnect |
| Headers | `text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no` | `no-transform` stops compression and proxies from buffering events |

Verified: a new order streamed 16 courier positions and all four statuses; after "Delivered" the indicator read
"Finished" and no new request followed; leaving the page aborted the stream (`net::ERR_ABORTED`); an already-delivered
order opens no stream at all.

## How to verify (DevTools → Network, filter "Fetch/XHR")
1. **Debounce:** on `/menu`, type `doro` quickly. You see **one** request, `?q=doro`. One per keystroke would mean the debounce isn't wired up.
2. **Null key:** clear the box and **zero** requests are sent.
3. **No flash:** press Next, and the old cards stay (dimmed) until page 2 arrives.
4. **Seeding:** open `/orders/ORD-DEMO` (as abebe). The order is in the **HTML**, with no spinner. The first `/api/orders/ORD-DEMO`
   request comes from polling, after paint.
5. **Polling:** about one request every 5 s, which stops at "Delivered".

Verified on the final build: typing `doro` sent exactly one request; clearing sent zero; after Next, 6 cards were visible
within 80 ms; a fresh order polled at 0.0 s, 5.1 s and 10.1 s.

## Server-side storage (not client queries, but where the data lives)
Sessions and orders are in `src/lib/store.js`: **memory** locally, **Upstash Redis** when deployed, so every Vercel
instance sees the same data (AUTH.md → "Why Redis"). Order keys: `order:<id>`, plus the per-owner index
`orders:owner:<userId>`. Because the index itself is per-owner, "my orders" can't return anyone else's. Orders are
read with one `MGET` (one round-trip for the whole list) instead of one `GET` per order.

**30-day history (Day 46):** `src/lib/orderHistory.js` generates past orders from a fixed seed instead of storing them,
so every instance agrees without writing hundreds of records. They're merged into `listOrdersForOwner` (filtered by
owner, so the same rule holds) and `listAllOrders` (staff only).

### How the dashboard aggregates (`src/app/dashboard/page.js`, `summarise()`)
| Figure | Rule |
|--------|------|
| Range | The last 30 calendar days in **Addis Ababa time** (UTC+3), including today so far |
| Revenue by neighbourhood | Sum of `price × quantity` for orders in range, **excluding cancelled**; every neighbourhood listed even at 0; sorted high to low |
| Orders per day | Count of orders placed each day, **including cancelled** (it measures demand) |
| Average order | Revenue ÷ non-cancelled orders |

## Every key in the store (Day 49)
| Key | Holds | Expires |
|-----|-------|---------|
| `session:<sha256 of cookie>` | `{ userId }` | 7 days |
| `user:id:<id>` | account from `/signup`: name, email, role (always customer), scrypt hash | never |
| `user:email:<email>` | the account id (claimed with `SET NX`) | never |
| `order:<id>` | the order (`adminStatus` + `statusChangedAt` when an admin set the status by hand) | never |
| `orders:owner:<userId>`, `orders:all` | lists of order ids, newest first | never |
| `menu:dishes` | the whole menu, once an admin has changed it (else `lib/dishes.js` is used) | never |
| `users:all` | ids of accounts created in the app (for Admin → Users) | never |
| `idem:<userId>:<key>` | `pending`, then the order id (double-submit guard) | 10 min / 24 h |
| `rl:signin:<email>`, `rl:signup:<ip>` | `{ count, resetAt }` | end of the window |

The 30 days of past orders are generated (`orderHistory.js`), not stored.
