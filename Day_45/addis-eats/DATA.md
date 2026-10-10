# DATA.md: where every piece of data is fetched, and why

**Rule: on the server, unless a person triggers it.** That decides most rows. The exceptions are what a person
types into, or what must keep refreshing on its own. Where a client query is unavoidable, the **server renders the
first result and seeds the client query with it**, so nobody watches a spinner for data we already had.

## Decision two: where data is fetched

| Data | Where | Why |
|------|-------|-----|
| Menu and dishes | **Server**: `/menu` is ISR (`revalidate = 3600`); `/menu/[id]` is pre-rendered for all 19 dishes | Public, indexable, cacheable. Crawlers and social previews get full HTML |
| Order history (`/orders`) | **Server**: `listOrdersForOwner(session.user.id)` in a server component | Private and scoped to the session. No client fetch, no API to attack |
| Order status (`/orders/[id]`) | **Server first, then polled on the client** | Server renders the order (scoped to the owner) and passes it as `fallbackData`; SWR then polls for changes |
| Kitchen board (`/kitchen`) | **Server first, then polled on the client** | Same pattern; the role is checked on the page **and** in the API it polls |
| Menu search | **Client**: triggered by typing, debounced | Depends on what the person types, so it can't be rendered ahead of time |
| Cart | **Client store** (`localStorage` via `useSyncExternalStore`) | It never leaves the browser until checkout; prices are re-checked on the server there |
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
`orders:owner:<userId>`. Because the index itself is per-owner, "my orders" can't return anyone else's.
