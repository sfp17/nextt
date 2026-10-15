# AUTH.md: who may see what, and what each layer proves

## Accounts

| Email | Password | Role |
|-------|----------|------|
| abebe@addiseats.et | `injera123` | customer (owns `ORD-DEMO`) |
| sara@addiseats.et | `buna1234` | customer |
| kitchen@addiseats.et | `berbere99` | staff |

Plus **any account created at `/signup`** (Day 49). Passwords are stored only as salted **scrypt** hashes
(`src/lib/users.js`). A wrong email takes as long as a wrong password, and both give the same message, so the sign-in
form doesn't reveal which accounts exist.

### Sign-up (Day 49)
- **Always a customer.** The role is not a form field; `createUser` sets `role: 'customer'`. Nobody can sign up as staff.
- **One account per email, even under a race.** The email is claimed with an atomic `SET NX` before the account is
  written, so two sign-ups for the same address at the same moment, on two servers, can't both succeed. The three demo
  emails can't be registered.
- **Password rules** (`signUpSchema`): 8–128 characters, at least one letter and one number. Checked on the server; the
  form only shows the message.
- **Signed in straight away**, with the same `createSession` as sign-in, and sent to `safeNext(next)`.
- **Rate limits** (`src/lib/rateLimit.js`, counted in the shared store so every server instance agrees):
  sign-in, **8 wrong passwords per email per 15 minutes** (then even the right password waits); sign-up, **5 accounts per
  IP address per hour**. Tested: the 9th wrong password gets "Too many attempts for this account. Try again in 15 minutes."
- Sign-up must say "this email already has an account" (otherwise you can't fix it). That reveals that an address is
  registered, which the rate limit slows down; the sign-in form still never reveals it.

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
| `/checkout` | Any signed-in user | **Proxy → page**; the write checks the rest | proxy: *a cookie exists* · page `requireUser` (`checkout/page.js:16`): *the session is real* · `placeOrder` (`actions.js:14`, `:50`): *still signed in at the moment of writing, and the owner comes from the session* |
| `/orders` | The owner | **Proxy → layout → page → scoped query** | proxy: *a cookie exists* · `orders/layout.js`: *session verified before the skeleton streams* · page (`orders/page.js:22`): *session verified* · `listOrdersForOwner(user.id)` (`lib/orders.js:160`): *only their own records, by construction* |
| `/orders/[id]` | The owner | **Proxy → page → scoped query** | proxy: *a cookie exists* · page (`orders/[id]/page.js:22`): *session verified* · `getOrderForOwner(id, user.id)` (`lib/orders.js:149`): *this record is theirs*; anyone else gets **404**, the same as a missing order |
| `/kitchen` | Staff only | **Proxy → page + role → role in every action** | proxy: *a cookie exists* · page (`kitchen/page.js:14`, `:18`): *signed in **and** staff*, else 403 · `markOrderDelivered` (`actions.js:85`): *role re-checked on the write* |
| `/dashboard` | Staff only | **Proxy → layout → page + role** | proxy: *a cookie exists* · `dashboard/layout.js`: *session verified*, before the skeleton streams · page: *signed in **and** staff*, else 403, and the data is only loaded after that check |
| `/track/[id]` | The owner | **Proxy → page → scoped query**; the stream checks for itself | proxy: *a cookie exists* · page `requireUser` + `getOrderForOwner`: *this order is theirs*, else 404 · `GET /api/orders/[id]/stream`: 401 / 404 before opening, ownership re-checked on every tick |
| `/signup` | Everyone (signed-in users are sent on) | `safeNext()`, schema, rate limit, atomic email claim | the account is a customer; the email is unique; the redirect stays on this site |
| `/signin` | Everyone | `safeNext()` on the way in **and** in the action | the redirect target is a path on this site, never another site |

> "Protected by middleware" is not an answer: the proxy (`src/proxy.js`, Next 16's name for middleware) only proves
> **a cookie exists** (`proxy.js:18`). A forged `ae_session=anything` passes it and is rejected one layer down
> (tested below).

### Why `/orders` and `/dashboard` now check in a layout too (Day 46)
`loading.js` wraps the page in a Suspense boundary, so the skeleton is sent (status 200) **before** the page runs. A
redirect from the page then happens in the browser, after the skeleton. `orders/layout.js` and `dashboard/layout.js`
run before that boundary, so a forged or expired session gets a real **307** to `/signin` and not even the skeleton
(tested with `ae_session=forged`). The proxy passes the requested path in an `x-return-to` header so the sign-in
page still returns you to, say, `/orders/ORD-DEMO`. The page checks remain: layouts don't re-run on every navigation.

## Every action and API route (the writes)

Server actions and route handlers are **public POST/GET endpoints**: anyone can call them with a hand-written
request. So each one checks for itself and never trusts an id it was handed.

```
placeOrder          session (actions.js:14) -> owner = session.user.id (actions.js:51), never a form field; at most one order per idempotency key (lib/orders.js placeOrderOnce)
cancelOrder         session (actions.js:63) -> getOrderForOwner(id, session.user.id) (actions.js:68) -> 404 if not theirs (:70)
markOrderDelivered  session (actions.js:84) -> role === 'staff' (actions.js:85) -> 403 otherwise
signUp              rate limit (IP) -> signUpSchema -> createUser: role fixed to customer, email claimed atomically -> createSession
signIn              rate limit (email) -> safeNext(formData.next) (signin/actions.js:11), same message for wrong email and wrong password
signOutAction       deletes the session from the store, then the cookie
GET  /api/orders/[id]     401 without session (:13) -> getOrderForOwner (:17) -> 404 if not theirs (:18)
POST /api/orders          401 without session (:11) -> owner = session.user.id (:31)
GET  /api/orders/[id]/stream  401 without session -> getOrderForOwner -> 404 if not theirs (then re-checked every second)
GET  /api/kitchen/orders  401 without session (:11) -> 403 unless staff (:12)
POST /api/orders          (also) neighbourhood must be one of the 8 delivery areas, else 422; optional Idempotency-Key header: a repeat returns the first order (200), not a second one
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
| 1 | Signed out: `await cancelOrder("ord_812")` | `{"success":false,"status":401,"error":"Please sign in."}`, refused, not a crash | `src/app/actions.js:63`: `if (!session)` |
| 2 | Signed in as **Sara**: `await cancelOrder("ORD-DEMO")` (Abebe's order) | `{"success":false,"status":404,"error":"Order not found"}`, refused **on ownership**, not on session | `src/lib/orders.js:149`: `order.ownerId !== ownerId`, reached from `actions.js:68` |
| 3 | `/signin?next=https://example.com` | Signs in and lands on **`/`**, not example.com | `src/lib/session.js:77`: `if (!next.startsWith('/')) return '/'` (re-applied in `signin/actions.js:11`) |

Also verified:
- **Changing the URL:** Sara opens `/orders/ORD-DEMO` and gets "Order not found"; `GET /api/orders/ORD-DEMO` returns **404**.
  Afterwards Abebe's order is untouched ("Order placed").
- **Role:** Sara runs `await markOrderDelivered("ORD-DEMO")` and gets `{"status":403,"error":"Staff only."}` (`actions.js:85`).
- **More crafted links:** `//example.com` and `/\example.com` also land on `/` (`session.js:78`).
- **Forged cookie:** `/checkout` with `ae_session=forged` gets past the proxy and is sent to `/signin?next=%2Fcheckout`
  by the page check (`checkout/page.js:16`). Before Day 45 this page had no page-level check; filling in this table
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

## A changed id in a private URL (Day 49, as a brand-new account)
Signed in as a brand-new account (`/signup`), with no orders of its own, every private URL was opened with someone
else's id:

| URL typed | Result | Refused by |
|-----------|--------|------------|
| `/orders/ORD-DEMO` (Abebe's live order) | "Order not found" | `getOrderForOwner` (`lib/orders.js:149`) |
| `/track/ORD-DEMO` | "Order not found" | same query, from `track/[id]/page.js` |
| `/orders/ORD-H0101` (Abebe's past order) | "Order not found" | same query: generated history is owner-checked too |
| `GET /api/orders/ORD-DEMO` | **404** | `api/orders/[id]/route.js` → `getOrderForOwner` |
| `/api/orders/ORD-DEMO/stream` | **404**, no stream opened | stream route, before opening |
| `/dashboard`, `/kitchen` | "Staff only (403)" | the page's role check |

"Not found" and not "forbidden": another customer's order looks exactly like an order that doesn't exist, so ids can't
be probed.

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
Done on Day 49: sign-up and rate limiting. Still to do (FUTURE.md): password reset and email verification; rotating
the session id when a role changes; removing the attack console before a real launch.
