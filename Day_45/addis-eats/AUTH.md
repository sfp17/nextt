# AUTH.md: who may see what, and what each layer proves

## Accounts

| Email | Password | Role |
|-------|----------|------|
| abebe@addiseats.et | `injera123` | customer (owns `ORD-DEMO`) |
| sara@addiseats.et | `buna1234` | customer |
| kitchen@addiseats.et | `berbere99` | staff |

Passwords are stored only as salted **scrypt** hashes (`src/lib/users.js`). A wrong email takes as long as a
wrong password, and both give the same message, so the sign-in form doesn't reveal which accounts exist.

## The session
- **Cookie `ae_session`:** a random 256-bit id with `httpOnly`, `secure` (on HTTPS, and everywhere except
  `http://localhost`) and `sameSite: 'lax'` (`src/lib/session.js`).
- **Server side:** the store keeps `{ userId }` under a **SHA-256 hash** of that id, with a 7-day expiry. Even someone who
  could read the store couldn't use its contents as a cookie.
- **Sign-out deletes the session on the server.** A copied cookie stops working everywhere (verified, see below).
- **Where the store lives:** memory locally; **Redis (Upstash) when deployed**, so every Vercel instance sees the same
  sessions (`src/lib/store.js`, and see "Why Redis" at the end).

## Decision one: who may see what (pages)

| Route | Who | Protected by | What each layer proves |
|-------|-----|--------------|------------------------|
| `/`, `/menu`, `/menu/[id]` | Everyone | Nothing | Public and indexable: in the sitemap, not behind the proxy |
| `/cart` | Everyone | Nothing (the cart never leaves the browser) | Nothing private is stored on the server |
| `/checkout` | Any signed-in user | **Proxy → page**; the write checks the rest | proxy: *a cookie exists* · page `requireUser` (`checkout/page.js:15`): *the session is real* · `placeOrder` (`actions.js:13`, `:46`): *still signed in at the moment of writing, and the owner comes from the session* |
| `/orders` | The owner | **Proxy → page → scoped query** | proxy: *a cookie exists* · page (`orders/page.js:13`): *session verified* · `listOrdersForOwner(user.id)` (`lib/orders.js:119`): *only their own records, by construction* |
| `/orders/[id]` | The owner | **Proxy → page → scoped query** | proxy: *a cookie exists* · page (`orders/[id]/page.js:22`): *session verified* · `getOrderForOwner(id, user.id)` (`lib/orders.js:106`): *this record is theirs*; anyone else gets **404**, the same as a missing order |
| `/kitchen` | Staff only | **Proxy → page + role → role in every action** | proxy: *a cookie exists* · page (`kitchen/page.js:14`, `:18`): *signed in **and** staff*, else 403 · `markOrderDelivered` (`actions.js:75`): *role re-checked on the write* |
| `/signin` | Everyone | `safeNext()` on the way in **and** in the action | the redirect target is a path on this site, never another site |

> "Protected by middleware" is not an answer: the proxy (`src/proxy.js`, Next 16's name for middleware) only proves
> **a cookie exists** (`proxy.js:18`). A forged `ae_session=anything` passes it and is rejected one layer down
> (tested below).

## Every action and API route (the writes)

Server actions and route handlers are **public POST/GET endpoints**: anyone can call them with a hand-written
request. So each one checks for itself and never trusts an id it was handed.

```
placeOrder          session (actions.js:13) -> owner = session.user.id (actions.js:46), never a form field
cancelOrder         session (actions.js:53) -> getOrderForOwner(id, session.user.id) (actions.js:58) -> 404 if not theirs (:59)
markOrderDelivered  session (actions.js:74) -> role === 'staff' (actions.js:75) -> 403 otherwise
signIn              safeNext(formData.next) (signin/actions.js:10), same message for wrong email and wrong password
signOutAction       deletes the session from the store, then the cookie
GET  /api/orders/[id]     401 without session (:13) -> getOrderForOwner (:17) -> 404 if not theirs (:18)
POST /api/orders          401 without session (:11) -> owner = session.user.id (:31)
GET  /api/kitchen/orders  401 without session (:11) -> 403 unless staff (:12)
GET  /api/session         returns only { name, role } of the caller, or null
```

Why the API routes aren't in the proxy matcher: an API caller should get `401` JSON, not an HTML redirect.
Why the proxy lets server-action POSTs through (`proxy.js:14`): redirecting them would crash the form. The
action checks the session itself and returns "Your session has expired. Please sign in again."

## The three attacks: and the line that stopped each

Run them from the **browser console** on the deployed site. `cancelOrder` and `markOrderDelivered` are placed on
`window` by `src/app/AttackConsole.jsx`. That grants nothing new: a server action is already callable by anyone
with a crafted POST. That's the point of the exercise.

| # | Attack (as on the slide) | Result (recorded) | Line that refused it |
|---|--------------------------|-------------------|----------------------|
| 1 | Signed out: `await cancelOrder("ord_812")` | `{"success":false,"status":401,"error":"Please sign in."}`, refused, not a crash | `src/app/actions.js:53`: `if (!session)` |
| 2 | Signed in as **Sara**: `await cancelOrder("ORD-DEMO")` (Abebe's order) | `{"success":false,"status":404,"error":"Order not found"}`, refused **on ownership**, not on session | `src/lib/orders.js:106`: `order.ownerId !== ownerId`, reached from `actions.js:58` |
| 3 | `/signin?next=https://example.com` | Signs in and lands on **`/`**, not example.com | `src/lib/session.js:77`: `if (!next.startsWith('/')) return '/'` (re-applied in `signin/actions.js:10`) |

Also verified:
- **Changing the URL:** Sara opens `/orders/ORD-DEMO` and gets "Order not found"; `GET /api/orders/ORD-DEMO` returns **404**.
  Afterwards Abebe's order is untouched ("Order placed").
- **Role:** Sara runs `await markOrderDelivered("ORD-DEMO")` and gets `{"status":403,"error":"Staff only."}` (`actions.js:75`).
- **More crafted links:** `//example.com` and `/\example.com` also land on `/` (`session.js:78`).
- **Forged cookie:** `/checkout` with `ae_session=forged` gets past the proxy and is sent to `/signin?next=%2Fcheckout`
  by the page check (`checkout/page.js:15`). Before Day 45 this page had no page-level check; filling in this table
  is how the gap was found.
- **Real sign-out:** after signing out, the old cookie value replayed against the API gets **401**, on the same instance
  and on a different instance (with Redis).

### Copy-paste for the live demo
```js
// 1. In a signed-out tab, on /menu:
await cancelOrder("ord_812")
// 2. Signed in as sara@addiseats.et / buna1234:
await cancelOrder("ORD-DEMO")
await markOrderDelivered("ORD-DEMO")
// 3. In the address bar:
//    https://<your-deployment>/signin?next=https://example.com
```

## Why Redis when deployed
On Vercel each request may run on a **different server instance**, and memory isn't shared between them. Tested
with two app servers side by side:

| | Memory store | Redis store |
|-|-------------|-------------|
| Sign in on A; does B know you? | **No** | Yes |
| Order placed on A, `GET` from B | **401** | 200 |
| "My orders" served by B | **sent to sign-in** | shows the order |
| Sign out on B, replay the old cookie on A | (n/a) | **401** |

So the store is memory when no Redis env vars are set (local development, zero setup), and Upstash Redis when they
are (README → Deploy). On Vercel without Redis, the app logs a warning at start-up.

## Not done (production to-do)
Rate-limiting sign-in attempts; sign-up and password reset; rotating the session id when a role changes.
