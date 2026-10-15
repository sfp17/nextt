# Addis Eats

**Order Ethiopian food in Addis Ababa and watch it come to your door.** Browse the menu, create an account, check out
in a minute, then follow the courier live on a map until the food arrives. Kitchen staff get a live order board and a
30-day sales dashboard.

Capstone project, IBT College CodeOps, Module 3 (React and Next.js). Built with Next.js 16 (App Router), React 19,
SWR, Leaflet, Recharts and Upstash Redis.

## Live URL
**https://YOUR-PROJECT.vercel.app** ← replace with your production URL after [deploying](#deploy-to-vercel), then commit.

| Environment | URL | Store | Post-deployment check |
|-------------|-----|-------|-----------------------|
| Production | `https://YOUR-PROJECT.vercel.app` | Upstash Redis (production database) | paste the `OK: …` line from `npm run check:deploy -- <url>` |
| Preview | `https://YOUR-PROJECT-git-<branch>-<you>.vercel.app` | Upstash Redis (preview database) | |
| Local | `http://localhost:3000` | memory | `OK: 0 failed, 1 warning` (memory store, expected locally) |

## The main flow
| Step | Page | What happens |
|------|------|--------------|
| 1. Browse | `/menu` | 19 dishes with photos and prices; filter by category, search as you type (Escape clears) |
| 2. Choose | `/menu/1` … | Dish page; **Add to order**. On a phone, a cart bar appears at the bottom |
| 3. Account | `/signup` or `/signin` | Create an account (signed in straight away) or sign in; you come back to where you were |
| 4. Check out | `/checkout` | Name filled in from your account; phone, neighbourhood, address; **one order even if you double-tap** |
| 5. Track | `/track/ORD-…` | Live map (courier and your address) and the same details in text, updated by server-sent events |
| 6. History | `/orders` | Your orders in a sortable, paged table; **Export CSV** |
| Staff | `/kitchen`, `/dashboard` | Live order board; revenue by neighbourhood and orders per day |

A new order goes *placed → preparing (15 s) → on the way (30 s) → delivered (45 s)*, so a whole delivery fits in a demo.

### Accounts
Create your own at `/signup`, or use the demo accounts:

| Email | Password | Role |
|-------|----------|------|
| abebe@addiseats.et | `injera123` | customer, owns `ORD-DEMO` and about 58 past orders |
| sara@addiseats.et | `buna1234` | customer, no orders (shows the empty states) |
| kitchen@addiseats.et | `berbere99` | staff (`/kitchen`, `/dashboard`) |

## Run it from a fresh clone
Needs **Node.js 20.9 or newer**.
```bash
git clone https://github.com/<you>/<your-repo>.git
cd <your-repo>/module-03-react-nextjs/Days/Day_49/addis-eats   # or wherever this folder is
npm ci                 # exact versions from package-lock.json
npm run dev            # http://localhost:3000 while developing
```
For anything you measure (Lighthouse, timing), use the production build. Dev mode is slow on purpose:
```bash
npm run build && npm start      # http://localhost:3000
npm test                        # CSV quoting and formatters
npm run check:deploy -- http://localhost:3000
```
**No environment variables are needed locally.** Sessions, accounts and orders are kept in memory, so restarting the
server clears them (the demo accounts always exist).

## Environment variables
Full details, with dummy values, in [`.env.example`](.env.example). Set them in Vercel under
*Settings → Environment Variables*, per environment:

| Variable | Production | Preview | Local |
|----------|-----------|---------|-------|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **required**: production database | **required**: a second database | empty (memory) |
| `NEXT_PUBLIC_SITE_URL` | only for a custom domain | not set | empty |
| `NEXT_PUBLIC_GA_ID` | optional (analytics) | empty | empty |
| `NEXT_PUBLIC_CHAT_WIDGET_SRC` | optional (support chat) | optional | empty |

Vercel sets `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_GIT_COMMIT_SHA` itself.

## Deploy to Vercel
1. Before deploying: `npm run build`, `npm start`, and `npm run check:deploy -- http://localhost:3000`.
2. Push to GitHub. **vercel.com → Add New → Project**, import the repository. Set **Root Directory** to the folder that
   contains this README's `package.json` (e.g. `module-03-react-nextjs/Days/Day_49/addis-eats`). Keep the defaults otherwise.
3. **Storage → Upstash → Redis (free)**: create `addis-eats-prod` and connect it to **Production**; create
   `addis-eats-preview` and connect it to **Preview**. Without Redis, each server instance has its own memory and users
   get signed out at random (AUTH.md → "Why Redis").
4. **Deployments → ⋯ → Redeploy**, so the new variables are used.
5. Run the post-deployment check (next section), then put the URL in [Live URL](#live-url) and commit.

Vercel protects *preview* deployments with a login by default; chat apps can't fetch `og:image` from them. Test link
previews on the production URL.

## After deploying
```bash
npm run check:deploy -- https://YOUR-PROJECT.vercel.app
```
It checks (without placing orders): `/api/health` says **Redis** and the right site URL; every main page loads; 404s
are 404; `og:image` is absolute and loads; sitemap and robots; signed-out and forged-cookie requests are refused;
security headers; HTTPS; cached JavaScript; AVIF images. Then the hand checks it prints: double-tap on a phone,
live tracking, cookie flags, the three attacks, Lighthouse, a link card in a chat app.

## Verified: the full battery
Run on the final production build (`npm run build && npm start`), Day 49.

| Check | Result |
|-------|--------|
| **Brand-new account, on a phone (390 px), end to end**: sign up → welcome → empty states → add 2 dishes → cart bar → checkout (name prefilled) → double-tap Place order → track live → delivered → My orders → CSV → sign out → sign in again | ✅ all steps; **one** order despite the double tap |
| **Authentication**: the three attacks + a changed id in a private URL (`/orders/ORD-DEMO`, `/track/ORD-DEMO`, `/orders/ORD-H0101` as another user) | ✅ 401 / 404 / lands on `/`; changed ids show "Order not found", API 404. [AUTH.md](AUTH.md) |
| Sign-up rules | weak password refused with the reason; same email twice refused; demo emails can't be re-registered; new accounts are always customers |
| Rate limit | 9th wrong password for one account → "Too many attempts… 15 minutes", even with the right password |
| Every state | loading / empty / error / loaded on `/orders` and `/dashboard`, forced with `?demo=slow|empty|error`; empty states seen naturally by a new account |
| **Keyboard only** | 33 steps through every function, mouse unused (Tab, Enter, Space, Escape, arrows) |
| **Hamburger menu** | opens/closes with tap, Enter, Escape (focus returns to the button), tap outside, and after following a link; links still visible without JavaScript |
| Touch targets | 0 controls under 44 px on 12 pages (`npm run audit:interaction`) |
| **Lighthouse** (mobile) | see the table below and [PERF.md](PERF.md) |
| Live data | search: 1 request per pause; tracking: 16 courier positions, stream closes on delivery |
| Two servers sharing Redis | sign-in, orders, sign-out and the double-submit key all hold across instances |
| Post-deployment check (locally) | `OK: 0 failed, 1 warning` |
| Unit tests | 9 / 9 |

### Lighthouse, mobile, production build (median of 5)
| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|------|:-----------:|:-------------:|:--------------:|:---:|:---:|:---:|
| `/` | 95 | **100** | 100 | 100 | **2.02 s** | 0 |
| `/menu` | 94 | **100** | 100 | 100 | **2.26 s** | 0 |
| `/menu/1` | 97 | **100** | 100 | 100 | 2.28 s | 0 |
| `/signup` | 95 | **100** | 100 | 63 † | 2.02 s | 0 |
| `/orders` (signed in) | 91 | **100** | 100 | 63 † | 2.50 s | 0 |
| `/track/…` (signed in) | 90 | **100** | 96 ‡ | 63 † | 2.49 s | 0 |

LCP for `/` and `/menu` with applied throttling (stable to ±40 ms across runs); the other pages with Lighthouse's
default simulated throttling, which swings 1.3–3.3 s from run to run on the same build (PERF.md).
† private pages are `noindex` on purpose, which Lighthouse's SEO score counts against them.
‡ the test machine couldn't reach the map tile server; on a normal connection that console error doesn't occur.

## Present it: 8 minutes
Rehearse with a timer. Open these tabs **before** you start: the live URL signed out, a second private window, the
deployed `/menu/1` link ready to paste, AUTH.md and PERF.md.

| Clock | Show | Say (one line) |
|-------|------|----------------|
| 0:00–0:45 | Home on your **phone** (or DevTools phone size): hamburger, menu, search "doro" | "Addis Eats: order Ethiopian food in Addis and watch it arrive." |
| 0:45–2:15 | **Create a new account** live → welcome → add 2 dishes → cart bar → checkout → **double-tap** Place order | "A brand-new customer, start to finish. The double tap still makes one order: the button, a submit guard, and a key the server checks." |
| 2:15–3:30 | Track: the map, the **Live** pill, the courier moving; point at the text panel | "Server-sent events: the server pushes changes. Everything on the map is also written out for people who can't see it." |
| 3:30–5:00 | AUTH.md route table, then the **three attacks** in the console + change the id in the URL | "The proxy only checks a cookie exists. The page checks the session; the query checks the owner. Here's each attack failing, and the line that stopped it." |
| 5:00–6:15 | PERF.md: before → after, and the one miss | "LCP from 9.3 to about 2 seconds: images, fonts and a chat facade. The JavaScript budget is missed, and here's why." |
| 6:15–7:15 | Kitchen dashboard (sign in as staff), then paste `/menu/1` in a chat app | "Aggregated on the server, only totals reach the chart. And a shared dish shows its photo and price." |
| 7:15–8:00 | FUTURE.md: what was cut and why | "Payments, password reset and real GPS: cut on purpose; here's what each would take." |

**If something fails live:** the network is down → run it on `npm start` locally (same code); the stream is slow →
use `ORD-DEMO` as abebe (it restarts by itself); the chat card doesn't show → open the page source and point at `og:image`.

| Rehearsal | Time | What ran long | Change |
|-----------|------|---------------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**The tip from the slide:** hand your phone to the person beside you, with no instructions, and watch them order.
Write down every place they hesitate; each is a bug report.

## Documents
| File | What's in it |
|------|--------------|
| [AUTH.md](AUTH.md) | Every route, the layers protecting it and what each proves; the three attacks and a changed id |
| [DATA.md](DATA.md) | Where every piece of data is fetched and why; every client query; the stream; storage keys |
| [PERF.md](PERF.md) | The budget, before and after, with causes; Lighthouse on the final build |
| [SEO.md](SEO.md) | Titles, descriptions, Open Graph cards, JSON-LD, sitemap, robots |
| [PREFLIGHT.md](PREFLIGHT.md) | The checklist before deploying, and what it found |
| [FUTURE.md](FUTURE.md) | Must / Should / Could, and what was cut and why |
| [COURSE-LOG.md](COURSE-LOG.md) | Days 46–48 exercises, step by step |

## Project map
```
src/proxy.js                     first gate: cookie present? (narrow matcher, private pages only)
src/lib/session.js               getSession / requireUser / safeNext, cookie flags
src/lib/users.js                 demo accounts + accounts from /signup (scrypt hashes, email claimed atomically)
src/lib/rateLimit.js             sign-in and sign-up limits, shared across servers
src/lib/store.js                 memory locally, Upstash Redis when deployed
src/lib/orders.js                owner-scoped queries; placeOrderOnce (idempotency)
src/lib/orderHistory.js          30 days of generated past orders (Addis Ababa days)
src/lib/delivery.js              map coordinates and the courier's position
src/lib/format.js, csv.js        etb / when / relative; CSV with proper quoting
src/app/layout.js                header (HeaderNav = hamburger on phones), MobileCartBar, Toaster
src/app/menu/                    ISR menu, debounced search, filters, DishCard (next/image)
src/app/signup/, signin/         accounts; PasswordField.jsx (Show / Hide)
src/app/checkout/OrderForm.jsx   onSubmit guard, type="tel", disabled while pending, idempotency key
src/app/track/[id]/              TrackLive (EventSource) + DeliveryMap (Leaflet, ssr:false)
src/app/api/orders/[id]/stream/  server-sent events
src/app/orders/                  OrderTable (sort/page in the URL), CSV export, loading/error states
src/app/kitchen/, dashboard/     staff board (polled) and charts (aggregated on the server)
src/app/api/health/              which store / site URL / commit this deployment uses
scripts/postdeploy.mjs           npm run check:deploy -- <url>
scripts/audit-interaction.mjs    npm run audit:interaction
tests/                           npm test
```
