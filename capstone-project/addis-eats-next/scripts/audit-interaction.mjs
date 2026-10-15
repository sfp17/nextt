// npm run audit:interaction  (BASE=https://your-app.vercel.app to audit a deployment)
// Needs Playwright: npx playwright install chromium  (it is not a project dependency).
// Interaction audit: clickable non-controls, touch targets < 44px, focus visibility.
import { chromium } from 'playwright';
const B = process.env.BASE || 'http://localhost:3000';
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
async function session(email, pw, w = 390, h = 844) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  if (email) { const p = await ctx.newPage(); await p.goto(B + '/signin'); await p.waitForTimeout(600); await p.fill('#email', email); await p.fill('#password', pw); await p.click('button[type=submit]'); await p.waitForURL((u) => u.pathname !== '/signin'); await p.close(); }
  return ctx;
}
const anon = await session(); const abebe = await session('abebe@addiseats.et', 'injera123'); const staff = await session('kitchen@addiseats.et', 'berbere99');
// put something in abebe's cart for /cart and /checkout
{ const p = await abebe.newPage(); await p.goto(B + '/menu'); await p.waitForLoadState('networkidle'); await p.locator('.dish-card button:visible').first().click(); await p.close(); }
const pages = [[anon, '/'], [anon, '/menu'], [anon, '/menu/1'], [anon, '/signin'], [abebe, '/cart'], [abebe, '/checkout'], [abebe, '/orders'], [abebe, '/orders/ORD-H0101'], [abebe, '/track/ORD-H0101'], [staff, '/kitchen'], [staff, '/dashboard'], [anon, '/nope']];
let problems = 0;
for (const [ctx, path] of pages) {
  const p = await ctx.newPage(); await p.goto(B + path); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const out = { clickable: [], small: [], hover: [] };
    const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
    const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    // 1. things that look clickable but aren't controls
    for (const el of document.querySelectorAll('body *')) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el);
      const ctl = el.closest('a,button,input,select,textarea,summary,label,[role=button],.leaflet-container');
      if (cs.cursor === 'pointer' && !ctl) out.clickable.push(el.tagName + '.' + el.className + ' "' + label(el) + '"');
      if (el.onclick && !['A', 'BUTTON'].includes(el.tagName) && !el.closest('.recharts-wrapper')) out.clickable.push('onclick on ' + el.tagName);
    }
    // 2. touch targets
    const ctrls = document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])');
    for (const el of ctrls) {
      if (!vis(el) || el.closest('[aria-hidden=true]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) out.small.push(`${el.tagName} "${label(el)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return out;
  });
  // 3. focus: tab through, every stop must change appearance
  const unseen = [];
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press('Tab');
    const f = await p.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none';
      return { ring, desc: el.tagName + ' "' + (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '"' };
    });
    if (!f) break;
    if (!f.ring) unseen.push(f.desc);
  }
  const n = r.clickable.length + r.small.length + unseen.length; problems += n;
  console.log(`\n${path}: ${n ? n + ' issue(s)' : 'OK'}`);
  for (const x of [...new Set(r.clickable)]) console.log('  NOT A CONTROL ', x);
  for (const x of [...new Set(r.small)]) console.log('  UNDER 44px    ', x);
  for (const x of [...new Set(unseen)]) console.log('  NO FOCUS RING ', x);
  await p.close();
}
console.log('\nTOTAL', problems); await b.close();
