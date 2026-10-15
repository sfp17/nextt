#!/usr/bin/env node
// Post-deployment check. Run it against EVERY deployment, after it's live:
//
//   npm run check:deploy -- https://addis-eats.vercel.app
//   npm run check:deploy -- https://addis-eats-git-feature-you.vercel.app   (a preview)
//   npm run check:deploy -- http://localhost:3000                           (before deploying)
//
// Needs nothing but Node 20+ (uses fetch). Exits with code 1 if any check FAILS,
// so it can also run in CI. It only READS: it places no orders and signs no one in.
// The things only a person can check are listed at the end (README → "After deploying").

const BASE = (process.argv[2] || process.env.BASE || 'http://localhost:3000').replace(/\/$/, '');
const origin = new URL(BASE).origin;
const local = /localhost|127\.0\.0\.1/.test(origin);
let fails = 0, warns = 0;
const line = (tag, msg) => console.log(`${tag}  ${msg}`);
const pass = (m) => line('PASS', m);
const fail = (m) => { fails++; line('FAIL', m); };
const warn = (m) => { warns++; line('WARN', m); };
const check = (cond, m, soft = false) => (cond ? pass(m) : soft ? warn(m) : fail(m));
const get = (path, init = {}) => fetch(BASE + path, { redirect: 'manual', ...init });
const text = async (path) => (await get(path)).text();

console.log(`\nPost-deployment check for ${origin}\n`);

// 1. The deployment is configured for its environment
let health = {};
try {
  const r = await get('/api/health');
  health = await r.json();
  check(r.status === 200, `/api/health answers (environment: ${health.environment}, commit: ${health.commit ?? 'local'})`);
} catch (e) {
  fail(`/api/health unreachable: ${e.message}`);
}
check(health.store === 'redis', `shared store is Redis (got "${health.store}")${local ? ', fine locally' : ''}`, local);
const siteUrlOk = health.siteUrl === origin;
check(siteUrlOk, `site URL the app uses for links = this deployment (${health.siteUrl})`,
  health.environment === 'preview' || local); // previews may be reached via a branch alias

// 2. Pages respond, with real content
for (const [path, must] of [['/', 'Addis Eats'], ['/menu', 'Doro Wat'], ['/menu/1', 'Doro Wat'], ['/signin', 'Sign in']]) {
  const r = await get(path);
  const body = await r.text();
  check(r.status === 200 && body.includes(must), `${path} → ${r.status}, contains "${must}"`);
}
const missing = await get('/this-page-does-not-exist');
check(missing.status === 404, `unknown URL → ${missing.status} (want 404)`);

// 3. Discovery: absolute URLs on THIS origin, image reachable
const dish = await text('/menu/1');
const ogImage = dish.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
check(ogImage?.startsWith('http'), `og:image is absolute: ${ogImage}`);
check(ogImage && new URL(ogImage).origin === health.siteUrl, 'og:image is on the site URL', !siteUrlOk);
if (ogImage) {
  const u = new URL(ogImage);
  const img = await get(u.pathname + u.search); // fetched from THIS deployment, whatever origin the tag names
  check(img.status === 200 && img.headers.get('content-type')?.startsWith('image/'), `og:image loads (${img.status} ${img.headers.get('content-type')})`);
}
check(dish.includes('application/ld+json'), 'dish page has MenuItem JSON-LD');
const robots = await text('/robots.txt');
check(/Disallow: \/checkout/.test(robots) && /Sitemap: https?:\/\//.test(robots), 'robots.txt: private pages disallowed, sitemap linked');
const sitemap = await text('/sitemap.xml');
check((sitemap.match(/\/menu\/\d+</g) || []).length === 19, `sitemap lists 19 dishes (found ${(sitemap.match(/\/menu\/\d+</g) || []).length})`);

// 4. Protection still holds on the deployed build
const orders = await get('/orders');
check([307, 308].includes(orders.status) && orders.headers.get('location')?.includes('/signin'), `/orders signed out → ${orders.status} to sign-in`);
check((await get('/api/orders/ORD-DEMO')).status === 401, 'GET /api/orders/ORD-DEMO signed out → 401');
check((await get('/api/orders/ORD-DEMO/stream')).status === 401, 'order stream signed out → 401 (not an open stream)');
check((await get('/api/kitchen/orders')).status === 401, 'kitchen API signed out → 401');
const forged = await get('/dashboard', { headers: { cookie: 'ae_session=forged' } });
check([307, 308].includes(forged.status), `forged session cookie on /dashboard → ${forged.status} to sign-in`);

// 5. Headers
const home = await get('/');
for (const h of ['x-content-type-options', 'referrer-policy', 'x-frame-options', 'permissions-policy']) {
  check(home.headers.has(h), `header ${h}: ${home.headers.get(h)}`);
}
if (!local) check(origin.startsWith('https://'), 'served over HTTPS');

// 6. Performance plumbing
const menuHtml = await text('/menu');
const chunk = menuHtml.match(/\/_next\/static\/[^"]+\.js/)?.[0];
if (chunk) {
  const r = await get(chunk);
  check(/immutable/.test(r.headers.get('cache-control') ?? ''), `JS chunks cached as immutable (${r.headers.get('cache-control')})`);
}
const imgRes = await get('/_next/image?url=%2Fimages%2Fdishes%2F1.jpg&w=640&q=75', { headers: { accept: 'image/avif,image/webp,*/*' } });
check(imgRes.status === 200 && /avif|webp/.test(imgRes.headers.get('content-type') ?? ''), `next/image serves ${imgRes.headers.get('content-type')}`);
const t0 = performance.now();
await get('/');
const ms = Math.round(performance.now() - t0);
check(ms < 1500, `home page answered in ${ms} ms`, true);

console.log(`\n${fails ? 'FAILED' : 'OK'}: ${fails} failed, ${warns} warning(s).`);
console.log(`
Now check by hand (README → "After deploying"):
  [ ] Sign in as abebe; DevTools → Application → Cookies: ae_session is HttpOnly, Secure, SameSite=Lax
  [ ] Place an order from your PHONE; double-tap "Place order": one order in My orders
  [ ] Track it: the map shows, the pill says Live, then Finished after delivery
  [ ] The three attacks in AUTH.md fail on the deployed site
  [ ] Lighthouse (Mobile) on ${origin}/menu
  [ ] Paste ${origin}/menu/1 into a chat app: the card shows the photo, name and price
  [ ] Tab through one page with the mouse put away
`);
process.exit(fails ? 1 : 0);
