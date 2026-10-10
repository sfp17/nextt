# PERF.md: the performance budget (Day 45)

**Baseline = the finished application before optimising** (as the brief requires: features complete, then measure).
It is today's exact code (auth, Redis store, live data, metadata, redesign) with only the image, font and script
optimisations taken out: plain `<img>` of the original photos, fonts from a third-party `<link>`, the chat widget
as a blocking `<script>` in `<head>`, the default Turbopack build, the 26 kB default favicon, and the original cart and
filter code. **After = this repository.** Both were run side by side, same machine, runs alternating, **5 runs each, median**.
Both load the same chat widget; "after" loads it on click.

## The budget: `/menu`, Lighthouse Mobile

| Measure | Target | Before | After | Met? |
|---------|--------|-------:|------:|:----:|
| LCP, throttled (applied throttling) | under 2.5 s | 9.34 s | **2.27 s** | ✅ |
| LCP, throttled (simulated, Lighthouse default) | under 2.5 s | 7.19 s | **2.05 s** | ✅ |
| CLS | under 0.1 | 0 * | **0** | ✅ |
| First Load JS, `/menu` (gzip / brotli) | under 120 kB | 144.1 / 124.6 kB | **150.1 / 126.7 kB** | ❌ (see below) |
| Largest image | under 150 kB | 285 kB | **46 kB** | ✅ |
| Lighthouse performance (applied / simulated) | 90 or better | 59 / 58 | **94 / 98** | ✅ |

Supporting numbers for `/menu`: page weight 2,061 → **485 kB**; all images 1,654 → **226 kB**;
FCP 4.98 s → **1.60 s**; TBT 203 → 235 ms (applied) and 516 → **138 ms** (simulated).

**Home page (`/`):** score 59 → **95** (applied) / 67 → **93** (simulated); LCP 7.44 s → **2.03 s** (applied) /
4.72 s → 3.01 s (simulated, see "Misses"); largest image 285 → **46 kB**; page weight 1,419 → **413 kB**.

Per-run LCP (ms), `/menu`. Applied: before 9372 9360 9340 9307 9299; after 2280 2269 2314 2273 2225.
Simulated: before 7163 7210 7188 7225 7194; after 2415 2196 1681 2053 1433.
Home, simulated: before 4720 4388 4761 4691 4732; after 3011 2999 3045 2522 3040.

\* **The "before" CLS of 0 is not a good result.** A layout-shift probe shows why: the blocking script and font
stylesheet hold back the **first paint until about 5 s**, and by then the first photos have already downloaded, so nothing
visibly moves because nothing was visible yet. The optimised page paints at about 1.6 s and reserves every image's 4:3 box
from its real `width`/`height`, so it is at 0 by design, not by delay.

## What caused each change
| Change | Where | What it moved |
|--------|-------|---------------|
| `<img>` → **`next/image`** with real dimensions and measured `sizes`, `preload` on the one LCP image per page | `DishCard.jsx`, `page.js`, `menu/[id]/page.js` | **Largest image 285 → 46 kB**; all images on `/menu` 1,654 → 226 kB. The biggest single cause of the LCP drop |
| **AVIF** first, WebP fallback | `next.config.mjs` | The 46 kB photo is AVIF; the WebP version was 92 kB |
| Font `<link>` → self-hosted **`next/font/local`** (heading font trimmed to Latin + weights 600–800) | `layout.js`, `app/fonts/` | Removes a render-blocking cross-origin stylesheet and its font requests. **FCP 4.98 → 1.60 s**, together with the next row |
| Blocking `<script>` in `<head>` → **chat facade**: our own "Chat with us" button, real widget only on click | `ChatLauncher.jsx` | Nothing blocks the first paint. Measured with `lazyOnload` instead: TBT 442 ms, score 87. With the facade: **235 ms, score 94**. Visitors who never chat never download 120 kB |
| **`srcset` trimmed** to the widths this layout uses (`deviceSizes: [640, 750, 828, 1080, 1280]`, `imageSizes: [384]`) | `next.config.mjs` | 15 → 6 URLs per image; `/menu` HTML 36 → 30 KB. That size drop also stops React 19 from **streaming the menu after the shell** (it outlines large Suspense boundaries). Before, 1 in 4 loads briefly showed `/menu`'s loading skeleton. Now the cards are in the HTML on arrival (6/6 loads). Simulated `/menu` LCP 3.08 → 2.05 s |
| Default 26 kB favicon → 0.3 kB SVG | `app/icon.svg` | −26 kB that was downloaded at *High* priority, competing with the LCP image |
| Webpack build (`next build --webpack`) | `package.json` | `/menu` First Load JS 151.2 → 150.1 kB gzip, **130.9 → 126.7 kB brotli** (Vercel serves brotli), same code |
| **INP:** cart actions in their own context; filter grid deferred with `useDeferredValue` | `providers.jsx`, `FilterShell.jsx` | Category switch **128 → 56 ms**, worst interaction **144 → 112 ms** (CPU slowed 6×, below) |

## Misses, explained (the brief: "a documented failure you understand")

**First Load JS: 150.1 kB gzip after, against a 120 kB target, and slightly worse than before (144.1 kB).**
- **The framework floor is above the target.** A bare Next.js 16 app with one empty page, built and measured the same
  way, ships **127.4 kB gzip / 106.5 kB brotli** before any of our code. No change to our code can bring `/menu` under
  120 kB gzip.
- **The rest is mostly required components:** SWR (Day 41's live data) is about 4.9 kB brotli, and Next's image component
  (Day 43) about 4.8 kB. Our own components add about 11 kB brotli on top.
- **Why "after" is a bit bigger than "before":** the optimisations themselves are client code. On the same
  (Turbopack) build, `next/image`, the script loader and the chat facade take `/menu` from 144.1 to 151.2 kB gzip. The
  Webpack build wins back 1.1 kB gzip (4.2 kB brotli). We trade about 6 kB of JS for about **1.4 MB less image data** and
  LCP 9.3 → 2.3 s. Worth it, and the reason this row is red.
- **Tried and measured, no gain:** importing `ThirdPartyScripts` only when an env var is set. It came out the same size
  (126.6 kB), because the loader lives in Next's shared runtime. Reverted.
- **Next step if this must be met:** render dish images with `getImageProps()` and a plain `<img>`, which keeps the same
  optimised `srcset` without the client component. Not done, because Day 43 asks for the `Image` component itself.

**Simulated LCP on the home page: 3.01 s** (`/menu` itself passes in both modes). Lighthouse's simulator estimates LCP
from a dependency graph and swings between clusters for the *same build*: in the previous full run the home page measured 2.15 s
simulated, this run 3.01 s, while applied throttling is steady at 2.03 s (runs within 100 ms). The real waterfall shows the hero
photo as a 32 kB AVIF that starts in the first round-trip. Both numbers are reported so the reader can judge; the stable
applied-throttling figure is the one the budget is judged on.

## INP (interaction to next paint)
Measured per interaction with the Event Timing API (what INP uses), CPU slowed 6×, 3 runs each (ms):
```
before:
add       worst event duration, median   88 ms   runs: 88 48 120 56 112 64
category  worst event duration, median  128 ms   runs: 104 128 96 144 104 144
type      worst event duration, median   56 ms   runs: 56 64 56
INP-style (worst of all): 144 ms
after:
add       worst event duration, median   88 ms   runs: 104 56 112 32 88 40
category  worst event duration, median   56 ms   runs: 56 56 80 32 56 32
type      worst event duration, median   56 ms   runs: 72 56 56
INP-style (worst of all): 112 ms
```
A Lighthouse *Timespan* run (type in search, add twice) gives about 60–80 ms. Anything under 200 ms counts as good.
If you measure ~380 ms on your machine, check it's `npm start`, not `npm run dev`: dev mode adds a lot of per-render
work.

## How it was measured (re-run it yourself)
- `npm run build && npm start`, never `npm run dev`.
- Lighthouse 13.5, **Mobile**, Performance only. "Applied" = `throttlingMethod: devtools` (Chrome really slows the network and
  CPU); "simulated" = Lighthouse's default. In Chrome DevTools: Lighthouse tab → ⚙️ → untick *Simulated throttling* for applied.
- First Load JS = the `<script src>` files the page's HTML references (not prefetches), compressed with gzip -9 and brotli 11.
- Largest image = the biggest image *transfer* during the Lighthouse load.
- No internet here, so the third-party font host and chat widget were stood in by a local server on another origin
  with 250 ms added latency (a 120 kB widget doing about 200 ms of main-thread work). On your machine the absolute numbers
  will differ; the before/after direction won't.

---

# Day 43: Making Addis Eats fast (original record)

## Results (median of 3 Lighthouse runs, production build)

| Page | Metric | Before | After | Change |
|------|--------|-------:|------:|--------|
| `/` | Performance score | 61 | **84** | +23 |
| `/` | LCP | 4.69 s | **1.82 s** | −61% |
| `/` | FCP | 2.74 s | **0.77 s** | −72% |
| `/` | CLS | 0.155 | **0** | fixed |
| `/` | Page weight | 2,565 KB | **439 KB** | −83% |
| `/menu` | Performance score | 61 | **86** | +25 |
| `/menu` | LCP | 4.68 s | **2.49 s** | −47% |
| `/menu` | FCP | 2.74 s | **0.78 s** | −72% |
| `/menu` | CLS | 0.157 | **0** | fixed |
| `/menu` | Page weight | 3,049 KB | **439 KB** | −86% |
| `/menu` | INP (search + add to cart) | 63 ms | 63 ms | already good |
| both | TBT (lab proxy for INP) | 441–453 ms | 523–526 ms | see "What did NOT improve" |

LCP and CLS go down as the "good" thresholds require: LCP ≤ 2.5 s and CLS ≤ 0.1. INP should stay
≤ 200 ms.

## How it was measured
- `npm run build && npm start`: always a **production build**. Dev mode is unoptimized and its numbers mean nothing.
- Lighthouse 13.5 (Next.js 16.3.6), **mobile preset with default throttling**: simulated slow 4G and 4× CPU slowdown.
- **3 runs per page; the median is reported.** Single runs varied by up to ±0.8 s LCP. Every run's raw
  numbers are listed at the end, so you can see the spread.
- **INP:** a Lighthouse navigation run can't measure INP, because nobody clicks anything. It's measured with a
  Lighthouse **timespan** (user flow) on `/menu`: type "doro" in search, then press "Add to Order" twice.
  TBT from the navigation run is the lab stand-in for it.
- Each fix was applied **one at a time and re-measured**, so every change below is credited to the step
  that caused it, not lumped together.

> **Note on third parties:** my test machine has no internet access. The "before" font stylesheet and
> chat-widget script were served by a **local stand-in on a second origin (`localhost:4100`) with 250 ms
> added latency**. The widget was a ~120 KB script doing ~200 ms of main-thread work, like a typical
> chat or analytics bundle. On your machine with the real Google Fonts and a real widget, the absolute numbers
> will differ. **Re-run Lighthouse yourself and record your own before and after**, as the slide's Tip says.

## What caused each change

### Step 1: every `<img>` to `next/image` (`src/app/menu/DishCard.jsx`)
| | Before | After step 1 |
|--|--:|--:|
| `/` LCP | 4.69 s | 3.27 s |
| `/` weight | 2,565 KB | 437 KB |
| `/menu` weight | 3,049 KB | 438 KB |

- **Why:** the old `<img>` tags downloaded the full 1600×1200 (≈500 KB) originals, and the 2400×1200 hero
  (≈750 KB), even into a 335 px card on a phone. `next/image` resizes them, converts to WebP, and the
  `sizes` attribute lets the browser choose the smallest file that's still sharp. On a 390 px phone a
  card now gets the 640 px version.
- **Real dimensions:** `width={1600} height={1200}` are the files' true size. They give the browser the
  4:3 shape up front. CSS `width:100%; height:auto` scales it.
- **Honest `sizes`:** worked out from the real layout (sidebar 220 px + gap, max container 1100 px,
  grid `minmax(280px, 1fr)`). For example, on `/menu`: one column under 884 px, then two columns of
  `(100vw − 324px) / 2`, capped at about 390 px.
- **`preload` on exactly one image per page:** the home hero, the first card on menu page 1, and the photo on a dish's
  detail page. Each is that page's largest above-the-fold image (its LCP element). Every other image
  is lazy-loaded. **Next.js 16 renamed `priority` to `preload`**; it's the same feature.
- **Every image has a real `alt`** that describes the dish (in `src/lib/dishes.js`), not "image" or the filename.
- CLS did **not** change in this step. Lighthouse's layout-shift audit named the cause: **"Web font
  loaded"**. That's step 2.

### Step 2: font `<link>` to `next/font` (`src/app/layout.js`)
| | After step 1 | After step 2 |
|--|--:|--:|
| `/` CLS | 0.155 | **0** |
| `/menu` CLS | 0.157 | **0** |

- **Why:** with a `<link>` to a font stylesheet, text first renders in a system font. When DM Sans
  arrives (`font-display: swap`), every line changes width and the whole `<main>` moves.
- `next/font/local` **self-hosts** the font: `src/app/fonts/DMSans-Variable.woff2` is served from our
  own domain, with no extra connection to a font host. It also generates a **size-adjusted fallback**
  (`"dmSans Fallback"`), which is Arial stretched to DM Sans's measurements. The swap is still there, but nothing moves.
- Applied to the root `<html>` element via `className={dmSans.variable}`. The CSS uses
  `var(--font-sans)`.
- One variable-weight file (`weight: '100 1000'`) covers every weight on the site.
- LCP moved 3.27 s → 3.56 s in this step. That's within the run-to-run spread, not a real
  regression. The still-blocking widget script dominated LCP at this point.

### Step 3: third-party script to `next/script` with `lazyOnload` (`src/app/ThirdPartyScripts.jsx`)
| | After step 2 | After step 3 |
|--|--:|--:|
| `/` FCP | 2.64 s | **0.77 s** |
| `/` LCP | 3.56 s | **1.82 s** |
| `/` score | 71 | **84** |

- **Why:** a plain `<script src>` in `<head>` is **render-blocking**. The browser stops building the
  page until a script from another origin downloads and runs. Nothing could paint until then.
- `strategy="lazyOnload"` fetches it only after the page's `load` event, when the browser is idle.
  Verified: the load event fired at 722 ms and the widget was requested at 742 ms.
- Both third-party scripts (support chat, Google Analytics) are **off unless their env variable is set**.
  Without a `.env.local`, the app makes zero requests to other origins (verified).

### Environment setup
- **`.env.example`** lists every variable the app reads, with dummy values, and is committed.
- **Bug fixed:** `.gitignore` had `.env*`, which would have **ignored `.env.example` too**. Added
  `!.env.example`. Checked with `git check-ignore`: `.env`, `.env.local`, `.env.development.local` and
  `.env.production.local` are all ignored, and `.env.example` is committed.

## What did NOT improve (and why)
- **TBT stayed around 450–640 ms.** Lighthouse's breakdown shows one **820 ms task from the chat widget
  itself**, plus the app's own React startup (~400 ms under 4× CPU slowdown). `lazyOnload` moved the widget
  out of the way of the first paint, which is why FCP and LCP improved so much, but the script costs the same
  to run. It still runs inside Lighthouse's measurement window.
  **Next fix:** a *facade*. Render a lightweight "Chat" button ourselves, and load the real widget only
  when someone clicks it. Its 820 ms then never happens for visitors who don't chat.
- **INP stayed around 63 ms:** it was already well under the 200 ms "good" line, because search is
  debounced and SWR caches results (Day 41). The interactions themselves weren't the problem.

## Raw runs (score / LCP / CLS)
| Stage | `/` | `/menu` |
|------|-----|---------|
| Before | 61/4692/0.155 · 68/4686/0.000 · 61/4783/0.155 | 60/4760/0.157 · 61/4679/0.157 · 63/4386/0.157 |
| Step 1: images | 66/3265/0.155 · 70/3738/0.000 · 69/2860/0.155 | 66/3261/0.157 · 62/3701/0.157 · 69/3136/0.157 |
| Step 2: font | 71/3563/0 · 72/3542/0 · 71/3609/0 | 69/3681/0 · 70/3769/0 · 69/3792/0 |
| Step 3: scripts | 84/1804/0 · 84/2601/0 · 86/1823/0 | 83/2572/0 · 86/2492/0 · 87/1300/0 |

INP timespan runs (ms): before 99, 63, 58 · step 1: 75, 72, 61 · step 2: 71, 68, 70 · step 3: 82, 55, 63.

## Re-run it yourself
```bash
npm run build
npm start
```
Then in Chrome: open `http://localhost:3000` in an **Incognito window** (extensions skew results),
open DevTools → **Lighthouse** → Mode *Navigation*, Device *Mobile*, Category *Performance* → *Analyze*.
Do it 3 times per page and record the median.

## Images
The numbers above were measured with the original 1600×1200 placeholder illustrations. Since then, all
19 dishes use real photos, center-cropped to **1200×900 (4:3)** so every card has the same real
dimensions (`DISH_IMAGE_WIDTH` / `DISH_IMAGE_HEIGHT` in `src/lib/dishes.js`). The home hero is now a
1280×853 street photo used as a **background** (`next/image` with `fill`, `object-fit: cover`, and
`preload`, as the page's only preloaded image). Its `alt` is empty because it's decorative; the hero text carries the meaning.
To add a dish, save its photo as `public/images/dishes/<id>.jpg` at 1200×900 and add a row to `src/lib/dishes.js`.

---

# Redesign (after Day 44): did it stay fast? (original record)

The whole site got a new look (see README). Before changing anything, I measured the old design, then ran the
**old and new builds side by side** (ports 3200 and 3100, same machine, runs alternating), so both got the same conditions.

**Applied throttling (Chrome really slows the network and CPU)**, median of 5 alternating runs per version:

| Page | Metric | Old design | New design |
|------|--------|-----------:|-----------:|
| `/` | Performance score | 90 | 96 |
| `/` | LCP | 2.30 s | 1.88 s |
| `/` | FCP | 1.51 s | 1.64 s |
| `/` | CLS | 0.155 | 0 |
| `/` | TBT | 139 ms | 172 ms |
| `/` | Page weight | 567 KB | 419 KB |
| `/menu` | Performance score | 88 | 96 |
| `/menu` | LCP | 2.68 s | 1.99 s |
| `/menu` | FCP | 1.44 s | 1.60 s |
| `/menu` | CLS | 0.157 | 0 |
| `/menu` | TBT | 151 ms | 185 ms |
| `/menu` | Page weight | 571 KB | 492 KB |

LCP per run (ms). Home, old: 2322 2290 2302 2275 2330; new: 1882 1889 1871 1832 1923. Menu, old: 2709 2670 2684 2684 2712; new: 1999 1986 1985 2021 1955.

**Simulated throttling (Lighthouse default)**, median of 5 alternating runs per version:

| Page | Metric | Old design | New design |
|------|--------|-----------:|-----------:|
| `/` | Performance score | 93 | 94 |
| `/` | LCP | 3.15 s | 3.04 s |
| `/` | FCP | 0.77 s | 0.77 s |
| `/` | CLS | 0 | 0 |
| `/` | TBT | 74 ms | 99 ms |
| `/` | Page weight | 568 KB | 419 KB |
| `/menu` | Performance score | 99 | 92 |
| `/menu` | LCP | 1.97 s | 3.30 s |
| `/menu` | FCP | 0.76 s | 0.77 s |
| `/menu` | CLS | 0 | 0 |
| `/menu` | TBT | 82 ms | 90 ms |
| `/menu` | Page weight | 510 KB | 429 KB |

LCP per run (ms). Home, old: 3148 2455 2381 3496 3486; new: 2883 3083 3038 3087 2782. Menu, old: 1971 1302 3269 3242 1293; new: 3644 3338 1592 3250 3298.

**Reading the two tables honestly.** With applied throttling the runs are very stable (within about 50 ms of each other), and
the new design is faster on every page: higher score, lower LCP, smaller pages. With simulated throttling the runs swing
between about 1.3 s and 3.6 s *for the same build*. Home comes out about even, and the menu often lands in the slow cluster,
even though the real waterfall shows its LCP image arriving sooner (59 ms vs 97 ms) and at half the size (46 KB vs 92 KB).
The trade-offs that remain: FCP is about 0.1 s later and TBT about 30 ms higher, because there are now two fonts instead of one.

## What changed, and what each change did
| Change | Why | Effect |
|--------|-----|--------|
| `images.formats: ['image/avif', 'image/webp']` (`next.config.mjs`) | AVIF is much smaller than WebP for photos | Hero 63 KB → 32 KB, first menu photo 92 KB → 46 KB; home 568 KB → 419 KB in total |
| Heading font **Bricolage Grotesque**, self-hosted with `next/font/local` | Personality for headings | +41 KB at first, so… |
| …trimmed with fonttools: Latin only, weights 600–800 | Headings never use other weights or scripts | 41 KB → **29 KB** |
| Favicon: default 26 KB `favicon.ico` → 0.3 KB `app/icon.svg` | It downloaded at *High* priority during page load | −26 KB competing with the LCP image, and it's now the Addis Eats mark |
| Menu sidebar removed, 3-column grid with fixed breakpoints | The sidebar repeated the header links | `sizes` recomputed from the CSS (see `DishCard.jsx`), so images stay the right size |
| Page size 4 → 6 | 4 left a lone card in a 3-column grid | Two full rows per page |
| Fixed: `/menu` lost its `og:image` | A page that sets `openGraph` stops inheriting the root's preview image | `app/menu/opengraph-image.jsx` re-exports the site-wide image |

## Tried, measured, and reverted
- **`fetchPriority="high"` instead of `preload`.** The Next.js 16 docs recommend it, and it did make the browser report the LCP
  image as *High* priority. But it was **slower** here (simulated menu LCP 2.20 s → 3.60 s in a 5-run A/B), because without the
  `<link rel="preload">` in `<head>` the browser only discovers the image when it parses that far into the body. Reverted to `preload`.
- **Not preloading the heading font** (`preload: false`). Home LCP went up (median 3.9 s), because the big hero headline
  repainted when the font arrived late. Reverted, so the font stays preloaded.

## Correction to Day 43
The Day 43 tables above say CLS went to **0**. That's true with simulated throttling, which is all Day 43 measured. With
**applied** throttling, the old design still shifted by **0.155**, and Lighthouse named the cause: "Web font loaded" on `<main>`.
The redesign measures **CLS 0 in both modes**.

## Still true from Day 43
`next/image` everywhere with real dimensions and measured `sizes`, `preload` on exactly one image per page, self-hosted fonts via
`next/font`, third-party scripts via `next/script` with `lazyOnload`, and `.env.example` committed.
