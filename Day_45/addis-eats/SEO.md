# SEO.md: Making Addis Eats findable (Day 44)

## Where each piece lives

| File | What it does |
|------|--------------|
| `src/app/layout.js` | `metadataBase`, title template `%s \| Addis Eats`, default title and description, Open Graph and Twitter defaults |
| `src/lib/site.js` | Site name, the public URL (`NEXT_PUBLIC_SITE_URL`, else Vercel's production/preview URL, else localhost), and shared `baseOpenGraph` / `baseTwitter` |
| `src/app/menu/[id]/page.js` | `generateMetadata` (name, price, summary from the dish) and MenuItem JSON-LD from the same dish object |
| `src/lib/dishSeo.js` | `dishSummary()`, `menuItemJsonLd()`, and a safe JSON-LD serializer |
| `src/app/opengraph-image.jsx` | Site-wide preview image, 1200×630 |
| `src/app/menu/[id]/opengraph-image.jsx` | One generated preview per dish (`ImageResponse`, 1200×630), with its own alt text |
| `src/app/sitemap.js` | Built from the real dish records, each with its own `lastModified`. No private routes |
| `src/app/robots.js` | Disallows `/cart`, `/checkout`, `/orders`, `/kitchen`, `/signin`, `/api/`, and points to the sitemap |

## Every route's title and description

| Route | `<title>` | Indexed? |
|-------|-----------|----------|
| `/` | Addis Eats — Authentic Ethiopian Food Delivered in Addis Ababa *(layout default)* | yes |
| `/menu` | Menu \| Addis Eats | yes |
| `/menu/1` … `/menu/12` | Doro Wat — 350 ETB \| Addis Eats *(from the data)* | yes |
| `/cart` | Your Cart \| Addis Eats | `noindex` |
| `/checkout` | Checkout \| Addis Eats | `noindex` |
| `/signin` | Sign in \| Addis Eats | `noindex` |
| `/orders`, `/orders/[id]` | My Orders / Order ORD-… \| Addis Eats | `noindex` |
| `/kitchen` | Kitchen \| Addis Eats | `noindex` |
| 404s | Page not found / Dish not found \| Addis Eats | `noindex` |

Each page sets only the short part, like `title: 'Menu'`, and the layout's template adds `| Addis Eats`.
Descriptions are written for a person deciding whether to click, not as a list of keywords.

`/cart` and `/checkout` were client components, which can't export `metadata`. Their UI moved to
`CartView.jsx` and `CheckoutForm.jsx`, and `page.js` became a small server file that exports metadata.

## Decisions worth knowing
- **Absolute URLs come from `metadataBase`** (`src/lib/site.js`). In order: `NEXT_PUBLIC_SITE_URL` if set; on Vercel
  production, the project's production domain; on a Vercel preview, that deployment's own URL; locally
  `http://localhost:3000`. So a deployment gets correct `og:image` and canonical URLs with no manual setting.
- **Nested metadata is replaced, not merged.** When a dish page set its own `openGraph` object, it lost
  the layout's `og:type`, `og:locale` and the large Twitter card. I found this in the page source, not in
  the code. Pages now spread the shared `baseOpenGraph` and `baseTwitter` defaults.
- **JSON-LD can't disagree with the page:** `menuItemJsonLd(dish)` uses the same `dish` object the page
  renders, so the price and name are always identical. `<` is escaped so a description can never close the
  `<script>` tag.
- **Private routes have two layers.** `robots.txt` asks crawlers not to visit them. A `noindex` meta tag
  covers the case where a crawler reaches one anyway, for example through a shared link. They're also
  missing from the sitemap.
- **Social preview images:** `ImageResponse` can't read `.woff2`, so `src/assets/og/` holds `.woff`
  copies of the same DM Sans font. The dish photo is embedded as a data URL, so no HTTP request is made
  while drawing.
- **Next.js 16 naming:** because the dish image uses `generateImageMetadata` for per-dish alt text, its URL is
  `/menu/1/opengraph-image/card`. Next.js adds it to the page's `og:image` tag automatically.

## Verified in the page source (production build, `NEXT_PUBLIC_SITE_URL=https://addis-eats.example.com`)
- Every page has a unique `<title>` and `<meta name="description">`.
- `/menu/1`: `<title>Doro Wat — 350 ETB | Addis Eats</title>`,
  `og:image = https://addis-eats.example.com/menu/1/opengraph-image/card?…`,
  `og:image:alt = "Doro Wat, 350 ETB at Addis Eats — …"`, `og:url`, `og:type`, and `twitter:card = summary_large_image`.
- `/menu/1` JSON-LD parses as valid JSON: `MenuItem`, "Doro Wat", price `350.00`, currency `ETB`, absolute image URL.
  A dish marked `vegan: true` in `src/lib/dishes.js` also gets `suitableForDiet: VeganDiet`.
- **No relative URLs** in any `og:` or `twitter:` tag.
- Preview images return `200 image/png`, 1200×630.
- `/robots.txt` disallows the private routes and links the absolute sitemap URL.
- `/sitemap.xml` has 14 URLs (home, menu and 12 dishes), with no private route among them.

## Verify it yourself: on the deployment (Day 45)
The brief says to verify from the **deployed** page source, because absolute URLs and previews only behave for real there.
1. Open `https://<your-deployment>/menu/1`, press **Ctrl+U** (View Source), and search with Ctrl+F for `<title>`, `og:image`
   and `application/ld+json`. Every URL must start with `https://<your-deployment>`, not localhost.
2. Open `/robots.txt` and `/sitemap.xml` on the deployment: 19 dishes listed, private routes absent.
3. Open the `og:image` URL in a new tab to see the dish card (photo, name, price).
4. Paste `https://<your-deployment>/menu/1` into WhatsApp or Telegram. It should show a card, not blue text. If it shows
   blue text on a **preview** URL, that's Vercel's Deployment Protection blocking the crawler (README → Deploy); use the
   production URL.

Locally the same checks work at `http://localhost:3000` after `npm run build && npm start`.
