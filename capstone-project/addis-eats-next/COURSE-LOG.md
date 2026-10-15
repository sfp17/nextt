# COURSE-LOG.md: how the capstone was built, day by day

The README describes the finished app. This file keeps each day's exercise: what the slide asked, where it is, and
how it was checked. Days 41–44 are in DATA.md, AUTH.md, PERF.md and SEO.md; Day 45's six-area table is in AUTH.md,
DATA.md, PERF.md and SEO.md too.

## Day 49: finish, verify, rehearse
| Slide step | Where |
|------------|-------|
| Triage Must / Should / Could; Coulds to FUTURE.md | [FUTURE.md](FUTURE.md) |
| Fix anything broken; main flow end to end | Fixed: `/menu` streamed again after the Next 16.4 upgrade (PERF.md); small-text contrast; heading order. Main flow tested on a phone as a new account (README → Verified) |
| Authentication: three attacks + a changed id in a private URL | AUTH.md → "The three attacks" and "A changed id in a private URL" |
| A brand-new account through the app, fixing empty states | New: `/signup`; name prefilled at checkout; welcome message; empty states checked |
| Lighthouse, keyboard pass, real phone | README → "Verified" and PERF.md → "Final numbers"; phone: the hand checks after deploying |
| The three documents and the README; rehearse 8 minutes | README → "Present it: 8 minutes" with a rehearsal log |
| Modern touches (asked for) | Hamburger menu on phones, cart bar, toasts, Show/Hide password, rate limits |

## Day 48: harden the interaction, then deploy

| Slide step | What was found | What changed | Proof |
|------------|----------------|--------------|-------|
| Replace clickable divs with buttons or links; restore visible focus | No clickable divs. The focus ring was amber on white (about **2:1**), hard to follow; inputs had `outline: none` with a pale glow | Ring is now berbere-dark (**~8:1**), amber only on the dark footer and hero; inputs get a real 3 px ring; **"Skip to main content"** is the first Tab stop | `scripts/audit-interaction.mjs`: every Tab stop on 12 pages shows a ring |
| Every function with Tab, Enter and Escape | Escape didn't clear the search in Firefox | Escape clears the menu search everywhere | Keyboard-only run, mouse untouched: search → filter → add (Enter and Space) → page 2 → cart → sign in → checkout (arrows in the area list) → place → track → cancel (Escape dismisses, Enter confirms) → map zoom → sort table → sign out → dashboard table. **33/33 passed** |
| Disable submit while pending; a double tap places one order | `disabled` alone stopped a double-click, but **three submits in the same instant placed 3 orders** (measured with the guards removed) | `OrderForm.jsx`: an `onSubmit` guard, `disabled` + "Placing order…" while pending, and a **server idempotency key** (atomic Redis `SET NX`) | Double-click: 1 order. Double tap on a phone: 1. Three submits in one tick: 1. Same key sent to **two servers** at once: 1 order |
| Every touch target ≥ 44 px; nothing behind hover | **203** controls under 44 px on a 390 px phone (nav links 37 px, cart ± 34 px, map zoom 30 px, footer links 20 px, sort headers 24 px…) | Min 44 × 44 px for every control, without changing how text links look; no `:hover` rule hides or reveals anything | Audit: **203 → 0** |
| `npm run build` + pre-flight checklist | Next.js 16.3.6 and source-map-js had **high-severity advisories**; a validation error silently **emptied the neighbourhood**, so the corrected form couldn't be sent; no security headers | Next.js **16.4.0**; select keeps its value; security headers; Node version pinned | [PREFLIGHT.md](PREFLIGHT.md): every item with its result |
| Deploy, variables per environment, post-deployment check | n/a | `.env.example` lists every variable per environment; `/api/health`; `npm run check:deploy -- <url>` | Below: [Deploy to Vercel](#deploy-to-vercel) and [After deploying](#after-deploying) |

**DishCard** (slide's file): the whole card is a real `<article>` of links and a `<button>`; nothing listens for clicks on
the card itself, so no `stopPropagation` is needed anywhere. The "Add to order" button sits *beside* the links,
never inside one (a button inside a link is invalid HTML and would need `stopPropagation`).

## Day 47: track an Addis Eats delivery

Sign in as **abebe@addiseats.et / `injera123`**, add a dish, check out, then press **Track my order** and
**See it on the map →** (`/track/ORD-…`). A new order goes *placed → preparing (15 s) → on the way (30 s) → delivered (45 s)*,
so you can watch the whole delivery in under a minute.

| Slide step | Where | How to check |
|------------|-------|--------------|
| Map as a dynamic client component with `ssr:false` and a sized placeholder | `app/track/[id]/TrackLive.jsx` (`dynamic(() => import('./DeliveryMap'), { ssr: false, loading })`) | View Source: the HTML has "Loading map…" in a 420 px box; the map replaces it at the same size |
| Leaflet, stylesheet imported, explicit height | `app/track/[id]/DeliveryMap.jsx` (`import 'leaflet/dist/leaflet.css'`), `.delivery-map { height: 420px }` | Without the CSS the tiles scramble; without the height the map is blank |
| Courier marker + delivery marker, view fitted to both | `DeliveryMap.jsx`: two labelled markers, `fitBounds([courier, destination])` | The courier moves along the dashed route; the view only re-fits if it leaves the screen |
| The same information as text beside the map | "Delivery details" panel in `TrackLive.jsx` | Status, where the courier is, distance left, expected time, address, placed time, total |
| Stream route handler, consumed with EventSource | `app/api/orders/[id]/stream/route.js`; `new EventSource(...)` in `TrackLive.jsx` | DevTools → Network → `stream` → **EventStream** tab: one `status` event per change |
| Connection indicator; close on unmount and on delivery | The pill next to "Delivery details": Connecting… / **Live** / Reconnecting… / **Finished** | After "Delivered" the request ends and is not retried; leaving the page cancels it |
| `lib/format.js` (etb, when, relative) and a CSV export | `src/lib/format.js`, `src/lib/csv.js`; **Export CSV** on `/orders` | Every price and time on the site now comes from `format.js`; the CSV opens cleanly in Excel or Sheets |

**Seeded from the server:** `page.js` renders the first snapshot into the HTML, so the details are there before any
JavaScript runs. The stream sends the current state straight away when it connects, then only when something changes.

**The tip (comma and quotation mark):** the address `Bole Medhanialem, House "Blue Gate", 2nd floor` is written
as `"Bole Medhanialem, House ""Blue Gate"", 2nd floor"` and reads back as exactly one cell. Try it at checkout, then
export. `npm test` runs these cases (`tests/csv.test.mjs`) plus the formatter tests.

**Maps need internet:** the map tiles come from openstreetmap.org. Offline, the markers and route still show on a grey
background, and every detail is in the text panel.

## Day 46: the Addis Eats dashboard

Sign in as **kitchen@addiseats.et / `berbere99`** and open **Dashboard** in the header (`/dashboard`).

| Slide step | Where | How to check |
|------------|-------|--------------|
| Aggregate in a server component, pass only the summary | `src/app/dashboard/page.js` → `summarise()` | View Source: the chart receives 8 `{area, revenue}` and 30 `{day, orders}` objects. No names, phones, addresses or order ids are sent to the chart |
| Revenue bar chart, fixed-height container, ETB ticks | `src/app/dashboard/RevenueChart.jsx` → `RevenueChart` | Ticks read `0 ETB · 10K ETB · 20K ETB …`; the box is 308 px tall before the chart draws (no layout shift) |
| Orders-per-day line with a heading naming range and unit | same file → `OrdersLineChart` | Heading: "Orders per day, 15 Sept – 14 Oct"; y-axis unit "orders" |
| The same data in a table beneath each chart | `page.js`, the two `<details>` | "Show the data as a table": real `<table>`, `<caption>`, `<th scope>` |
| Order table: real markup, sort in the URL, links for paging | `src/app/orders/OrderTable.jsx` (used on `/orders` and `/dashboard`) | Click a header → `?sort=total&dir=desc`; click again → `asc`; Next → `&page=2`. `aria-sort` sits on the sorted header. Reload or share the URL: same view |
| Skeleton, empty and error states, each forced | `orders/loading.js`, `orders/error.js`, `dashboard/loading.js`, `dashboard/error.js` | See the table below |

`RevenueChart.jsx` is the only `"use client"` file the dashboard renders (`error.js` is a client file too, by Next.js rule, but only
runs when something fails). Recharts adds ~110 kB gzip to `/dashboard` only; `/menu` is unchanged at 150.1 kB (PERF.md).

### The four states, and how to force each one
| State | `/orders` (as abebe) | `/dashboard` (as kitchen) |
|-------|----------------------|---------------------------|
| Loading (skeleton) | `/orders?demo=slow`: five skeleton table rows for 3 s | `/dashboard?demo=slow`: tiles, both chart boxes at their real heights, rows |
| Empty | `/orders?demo=empty`, or sign in as **sara** (she has no orders) | `/dashboard?demo=empty` |
| Error | `/orders?demo=error`: "Try again" and "Reload without the forced error" | `/dashboard?demo=error` |
| Loaded | `/orders`: 58 orders, 6 pages | `/dashboard`: 217 orders, 22 pages |

`?demo=` only changes what you see; it never touches stored data, and the session and role are checked first (`src/lib/demoState.js`).

### Where the 30 days of orders come from
`src/lib/orderHistory.js` generates them from a fixed seed, so every server (and every reload) shows the same
numbers without a database. They always cover the last 30 days in Addis Ababa time, are all finished, and belong to
abebe (about a quarter) and eight sample customers. Orders you place at checkout are added on top. Checkout now asks for
the **neighbourhood** (a required select), because revenue is grouped by it.
