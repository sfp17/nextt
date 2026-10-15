# PREFLIGHT.md: the checklist before deploying, and what it found

Run on Day 48, on the finished app, before the first deployment. **Found** is what the check turned up;
**Fixed** is what was changed because of it. Re-run it before every release.

| # | Check | How | Found | Fixed / result |
|---|-------|-----|-------|----------------|
| 1 | Production build passes | `npm run build` | Passes | ✅ Next.js 16.4.0 (webpack), no warnings |
| 2 | Lint is clean | `npm run lint` | 0 problems | ✅ |
| 3 | Unit tests pass | `npm test` | 9 / 9 (CSV quoting, formatters) | ✅ |
| 4 | Works from a **fresh clone** | `git clone` into an empty folder → `npm ci` → lint → test → build → `npm start` | All pass; nothing depended on files outside git | ✅ |
| 5 | No known vulnerabilities in what ships | `npm audit --omit=dev` | **2 high**: `next` 16.3.6 (cache poisoning, SSRF in image optimisation, …) and `source-map-js` | ✅ Upgraded to `next@16.4.0` (+ `eslint-config-next@16.4.0`), `npm audit fix` → **0 vulnerabilities**. Every test re-run on 16.4.0 |
| 5b | Dev-only tools | `npm audit` | `braces` via `eslint-config-next`'s file globbing | Accepted: lint tooling only, never deployed. The only "fix" offered downgrades to the Next 14 lint config |
| 6 | No secrets in git | `git ls-files`, search for key/token patterns | Only `.env.example` (dummy values); `.env*` is gitignored | ✅ |
| 7 | Every variable the code reads is documented | search for `process.env.` | 5 you set + 5 Vercel sets | ✅ `.env.example` lists all 10, with a per-environment table that matches Vercel's settings page |
| 8 | Node version pinned | `package.json` | Not pinned | ✅ `"engines": { "node": ">=20.9.0" }`: Vercel uses it |
| 9 | Shared store in production | `/api/health` | Memory store on Vercel would sign people out at random | ✅ The app warns at start-up; `npm run check:deploy` **fails** a deployment without Redis |
| 10 | Security headers | response headers | None | ✅ `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `Permissions-Policy` (`next.config.mjs`) |
| 11 | Cookies | `src/lib/session.js` | `httpOnly`, `sameSite=lax`, `secure` everywhere except `http://localhost` | ✅ (checked again after deploying, by hand) |
| 12 | Error and not-found pages | `/does-not-exist`, `?demo=error` | 404 page answers **404**; error states for orders and dashboard | ✅ |
| 13 | Absolute URLs follow the deployment | `src/lib/site.js`, `/api/health` | Production domain on production, the preview's own URL on previews | ✅ The check compares them to the URL it's run against |
| 14 | No console errors | Playwright on 12 pages | None (the forced-error demo logs its error on purpose) | ✅ |
| 15 | Touch targets ≥ 44 px, no clickable divs | `npm run audit:interaction` (390 px phone) | **203** targets under 44 px; 1 disabled pager `<span>` styled as clickable | ✅ **0** |
| 16 | Visible focus | same audit, Tab through every page | Ring present but amber on white ≈ 2:1 | ✅ berbere-dark ≈ 8:1; skip link added |
| 17 | Keyboard only | Tab / Enter / Space / Escape / arrows through every function | Escape didn't clear search in Firefox | ✅ every function reachable; 33 steps pass |
| 18 | Double submit | double-click, double tap, 3 submits in one tick, same key on 2 servers | 3 submits in one tick → **3 orders** (with `disabled` only) | ✅ 1 order in every case (`onSubmit` guard + idempotency key) |
| 19 | Forms keep input after an error | submit with a bad phone number, then fix it | The neighbourhood **emptied** itself (React 19 form reset), so the fixed form was blocked | ✅ select re-mounts with the submitted value |
| 20 | JavaScript budget | First Load JS on `/menu` | 153.3 kB gzip on Day 48 (was 151.3: Next 16.4 framework +2.0 kB); 154.8 kB after Day 49 | Over the 150 kB goal (see PERF.md); the framework alone is ~129 kB |
| 21 | Long-lived responses fit the platform | order stream | Vercel stops functions after their max duration | ✅ `maxDuration = 300`; the stream closes itself after 4 min and the browser reconnects |
| 22 | Teaching-only code | `AttackConsole.jsx` | Puts two server actions on `window` for the class demo | Kept on purpose (grants nothing a crafted POST couldn't). **Remove before a real launch** |
| 23 | Post-deployment check passes locally | `npm start`, `npm run check:deploy -- http://localhost:3000` | — | ✅ `OK: 0 failed, 1 warning` (memory store, expected locally) |

## After each deployment
`npm run check:deploy -- https://<deployment-url>`, then the hand checks it prints (README → "After deploying").
Write the result in the README's Live URL table.
