# FUTURE.md: what was cut, and why

On Day 49 every remaining idea was sorted into **Must** (the capstone fails without it), **Should** (makes it
clearly better, fits in the day) and **Could** (worth doing, not now). Musts and Shoulds were built; the Coulds
are below, each with the reason it waited. Cutting them was a decision, not something forgotten.

## The triage

| | Item | Why it's in this column | Status |
|---|------|-------------------------|--------|
| **Must** | Main flow end to end: menu → cart → **sign up / sign in** → checkout → live tracking → order history → sign out | It *is* the product | ✅ Done; tested as a brand-new account |
| **Must** | **Sign-up** | The slide asks to "create a brand-new account"; until Day 49 only the three demo accounts existed | ✅ Built (`/signup`) |
| **Must** | Authentication verified by the three attacks + a changed id in a private URL | Rubric | ✅ AUTH.md |
| **Must** | Every state written (loading, empty, error, loaded) and right for a new account | Rubric; a new account sees the empty states first | ✅ Checked as a new account |
| **Must** | Lighthouse, keyboard pass, phone; numbers recorded | Rubric | ✅ PERF.md |
| **Must** | README, AUTH.md, DATA.md, PERF.md, rehearsed 8 minutes | Rubric | ✅ |
| **Should** | **Hamburger menu** on phones | The header took three lines of a phone screen | ✅ |
| **Should** | Rate limit on sign-in and sign-up | AUTH.md listed it as a to-do since Day 42; sign-up makes it urgent | ✅ |
| **Should** | Cart bar on phones, welcome message, name filled in at checkout | Small, and each removes a hesitation seen in testing | ✅ |
| **Could** | Everything below | Not needed for the main flow, and each one is bigger than it looks | ➡ cut |

## Cut (the Coulds)

| Idea | Why it waited | What it would take |
|------|---------------|--------------------|
| **Real payments** (Telebirr, Chapa, card) | Needs a merchant account, webhooks and refunds; a half-done payment is worse than none | A payment-provider integration, an order state "paid", webhook signature checks |
| **Password reset and email verification** | Needs a mail provider and signed, expiring links | Resend/Postmark, a token store with TTL, two new pages |
| **Real courier tracking** | The courier position is simulated from the timeline; real GPS needs a courier app | A courier app posting positions; the stream route already pushes whatever is stored |
| **SMS / push notifications** ("your rider is outside") | Needs a provider and consent | Africa's Talking or web push; a "notify me" preference |
| **Amharic (አማርኛ) translation** | Every string would need translating and checking by a fluent speaker | `next-intl`, translated messages, `lang="am"` routes |
| **Dark mode** | Every colour, the charts and the map would need a second, checked palette | Colour tokens per scheme, the chart validator run on the dark surface |
| **Menu editing for staff** | Dishes are a code file; editing needs an admin UI and image uploads | A `dishes` store, an admin form, image storage |
| **Saved addresses and reorder** | Nice for repeat customers, not needed for the first order | An `addresses:<userId>` list; "order again" button on past orders |
| **Kitchen board over SSE** | The kitchen still polls every 5 s, which works; the customer side was the priority | Reuse the Day 47 stream route for all live orders |
| **Offline / installable app (PWA)** | Ordering food needs the network anyway | Manifest, service worker for the menu |
| **Full Content-Security-Policy** | The map tiles and optional analytics need careful allow-lists; a wrong CSP breaks pages silently | A nonce-based CSP via the proxy, tested page by page |
| **Remove the attack console** | Kept on purpose for the class demo | Delete `AttackConsole.jsx` and its import before a real launch |
| **End-to-end tests in CI** | The Playwright checks run locally; not wired to GitHub Actions | A workflow running `npm test`, the build and `check:deploy` on every push |
