# Addis Eats: Day 45, Next.js Advanced Project

Ethiopian food ordering for Addis Ababa: browse the menu, sign in, place an order, and watch it live from the kitchen to
your door. Built with Next.js 16 (App Router), React 19 and SWR.

**Deployed URL:** `https://<your-project>.vercel.app` *(add yours here after deploying; see [Deploy](#deploy-to-vercel))*

## The six requirement areas: where each is, and how it's proven

| Area | What's built | Proven by | Details |
|------|--------------|-----------|---------|
| **Accounts** | Sign in, sign out, session in an `httpOnly` / `secure` / `sameSite` cookie | Cookie flags in DevTools → Application; sign-out kills the session server-side | [AUTH.md](AUTH.md) |
| **Protection** | Proxy (middleware) + page check + a check inside every action | **Three attacks, all fail**, each with the line that refused it | [AUTH.md](AUTH.md) |
| **Ownership** | Every order query takes the owner from the session, never from a sent id | Sara can't read or cancel Abebe's order (404) | [AUTH.md](AUTH.md) |
| **Live data** | Polled order status (5 s) and debounced menu search, both seeded from the server | Network tab: one request per pause; the order is in the HTML, no spinner | [DATA.md](DATA.md) |
| **Performance** | Images, fonts and scripts optimised, measured before and after on the finished app | Budget table, both columns filled, with causes | [PERF.md](PERF.md) |
| **Discovery** | Title + description on every route, Open Graph cards with image and price, MenuItem JSON-LD, sitemap, robots | View source on the deployed page; `/sitemap.xml`, `/robots.txt` | [SEO.md](SEO.md) |

## Run it from a fresh clone
Requires **Node.js 20.9+** (Next.js 16).
```bash
git clone <your-repo-url>
cd addis-eats
npm install
npm run dev            # http://localhost:3000, for developing
```
To test **performance**, always use the production build. Dev mode is unoptimised and its numbers mean nothing:
```bash
npm run build          # uses webpack: measured smaller JS than Turbopack (PERF.md)
npm start              # http://localhost:3000
```
No environment variables are needed locally. Sessions and orders are kept in memory, so restarting the server
clears them. To change anything, copy `.env.example` to `.env.local`.

### Demo accounts
| Email | Password | Role |
|-------|----------|------|
| abebe@addiseats.et | `injera123` | customer, owns the demo order `ORD-DEMO` |
| sara@addiseats.et | `buna1234` | customer |
| kitchen@addiseats.et | `berbere99` | staff (`/kitchen`) |

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. On **vercel.com → Add New → Project**, import the repository. Framework: Next.js. Keep the default build command
   (it runs `npm run build`).
3. **Add Redis (required):** in the project, go to **Storage → Upstash → Redis** (free tier) and connect it to the
   project. That sets `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_*`) automatically.
   *Why:* on Vercel each request can run on a different server instance. Without a shared store, users get randomly
   signed out and orders "disappear" (tested, see AUTH.md → "Why Redis").
4. **Redeploy** after connecting Redis, so the new variables are picked up.
5. The site URL is detected automatically (production domain, or the preview's own URL). Set `NEXT_PUBLIC_SITE_URL`
   only for a custom domain.
6. Put the URL at the top of this README.

**Social previews and deployment protection:** Vercel protects *preview* deployments with a login by default. That stops
WhatsApp, Telegram and LinkedIn from fetching your `og:image`, so the shared link shows as plain text. Test link previews on
the **production** URL, or turn off *Settings → Deployment Protection* for previews.

## Verify it (tools, not opinions)
| Check | How | What you want to see |
|-------|-----|----------------------|
| Protection | The three attacks in [AUTH.md](AUTH.md), from the browser console | `401`, `404` (ownership), and landing on `/` |
| Live data | Network tab while typing in the menu search | One request per pause, not per keystroke |
| Seeding | Open `/orders/ORD-DEMO` as abebe; View Source | The order is in the HTML; no spinner |
| Performance | Lighthouse, Mobile, on `npm start` or the deployment | Numbers in [PERF.md](PERF.md) |
| Metadata | View Source on `/menu/1` | Absolute `og:image` URL, a description specific to that dish, `application/ld+json` |
| Discovery | `/sitemap.xml` and `/robots.txt` | 19 dishes listed; `/cart`, `/checkout`, `/orders`, `/kitchen`, `/signin` absent |

## Presenting it (8 minutes, from the deployed URL)
| Minutes | What to show |
|---------|--------------|
| 0–1 | The deployed app: sign in as abebe, add two dishes, check out, land on the live order page |
| 1–3 | AUTH.md's route table, then run the three attacks live in the console (copy-paste block in AUTH.md) |
| 3–5 | Network tab while typing "doro" (one request), then View Source on the order page (seeded, no spinner) |
| 5–7 | PERF.md: the budget before and after, and what caused each change |
| 7–8 | Paste `https://<your-deployment>/menu/1` into a chat and show the card (photo, name, price), then questions |

## Project map
```
src/proxy.js                 middleware (Next 16 name): cookie check + redirect, narrow matcher
src/lib/session.js           getSession / requireUser / safeNext, cookie flags
src/lib/store.js             memory locally, Upstash Redis when deployed
src/lib/orders.js            owner-scoped order queries
src/app/actions.js           server actions, each re-checks session / ownership / role
src/app/orders/[id]/         server-seeded, polled order status
src/app/menu/SearchBox.jsx   debounced search, null key when empty
src/app/menu/DishCard.jsx    next/image with measured `sizes`
src/app/layout.js            metadataBase, title template, next/font
src/app/sitemap.js, robots.js, opengraph-image.jsx, menu/[id]/opengraph-image.jsx
```

## Week 9 history
Day 41 (SWR), 42 (auth), 43 (performance) and 44 (metadata) each have their notes in DATA.md, AUTH.md, PERF.md and
SEO.md, which are now kept up to date for the finished application.
