# Premium setup — PayMongo (GCash · Maya · Card)

**Plans:** ₱49 for 30 days, or ₱149 lifetime. Both are tied to the buyer's Google account, with no auto-charge. Buying 30 days again adds 30 days to the time left; a 30-day buyer can upgrade to lifetime; a lifetime owner can't be charged again (the Worker refuses). Users **must sign in with Google** to pay. Premium works on every device they sign in on, and offline at the venue until its end date.

**Referral:** 3 new Google accounts that sign in through someone's link (`?ref=<uid>`, from Account → Copy link ko, or the credit on the guest videoke page) give that person 7 days of Premium, up to 2 times. Judged by the Worker (`/referral`); only works once the Worker is live.

```
Buyer signs in with Google → picks "30 days · ₱49" or "Lifetime · ₱149"
  → app asks the Worker for a checkout for that plan (only the plan name is sent, never a price)
  → Worker creates a PayMongo Checkout Session (price + secret key stay on the Worker)
  → buyer pays with GCash / Maya / card on PayMongo's page
  → PayMongo sends "checkout_session.payment.paid" to the Worker's /webhook
  → Worker checks the signature + amount (at least the price of the plan it stored for that session), then adds 30 days or unlocks lifetime (once per payment)
  → buyer lands back on the app (?paid=1), app polls /status and unlocks
```

All three services have free tiers that cover this. PayMongo charges a per-transaction fee on each sale; check their pricing page.

---

## 1. Firebase (done ✓) + admin test account
Google sign-in is connected (project `bidavibe`). The admin test account is set by fingerprint in `BIDA_CONFIG.adminHashes` — nothing to do in Firebase for it. It gets everything free, even before PayMongo is set up.

To change the admin: hash the new Gmail (lowercase) with SHA-256 and replace the value in `adminHashes` (and `DEFAULT_ADMIN_HASHES` in the Worker), or just ask for it to be updated.

*(Menu names checked against Cloudflare's and PayMongo's docs on 2026-11-15. If a label looks different, the screenshot tells me where things moved.)*

## 2. PayMongo
1. Sign up at **dashboard.paymongo.com**. Test keys work right away, before any approval.
2. **Settings → Product Settings → Developers**: copy the **test secret key** (`sk_test_…`). Never put it in the app's code.
3. **For real money (live keys):** PayMongo only gives live keys to a **registered business type**: Sole Proprietor (DTI), Partnership, One Person Corporation or Corporation. An *Individual* account only sees test keys ("Live keys need a registered business type"). Upgrade under **Settings → Business information**; live keys appear once PayMongo approves it.

## 3. Cloudflare Worker (free plan, no card needed)
1. dash.cloudflare.com → **Workers & Pages → Create application → Start with Hello World! → Get started** → name it `bida-pay` → **Deploy**.
2. Open the Worker → **Edit Code** → replace everything in `worker.js` with the contents of [`worker/bida-pay-worker.js`](worker/bida-pay-worker.js) → **Deploy**. Note the URL, e.g. `https://bida-pay.<you>.workers.dev`.
3. **Workers KV → Create instance** → name it `bida-premium` → **Create**.
4. Back to the Worker → **Bindings** tab → **Add binding → KV namespace → Add binding**: Variable name **`PREMIUM`**, namespace `bida-premium` → **Add binding**.
5. Worker → **Settings → Variables and Secrets → Add** (Type: *Text*), then **Deploy**:

   | Name | Value |
   |---|---|
   | `FIREBASE_PROJECT_ID` | `bidavibe` |
   | `APP_URL` | `https://bida.vows-and-petals.com/` (keep the trailing `/`) |
   | `ALLOWED_ORIGINS` | `https://bida.vows-and-petals.com,https://campingchairph.github.io,http://localhost:8102` |
   | `PRICE_MONTH_CENTAVOS` | `4900` (₱49.00 for 30 days; optional, this is the default) |
   | `PRICE_LIFE_CENTAVOS` | `14900` (₱149.00 lifetime; optional, this is the default) |

   If you had added `PASS_DAYS` or `PRICE_CENTAVOS` before, you can delete them: they aren't used anymore.

   And as Type *Secret*: `PAYMONGO_SECRET_KEY` = your `sk_test_…` key.

## 4. PayMongo webhook (tells the Worker "this person paid")
1. In the PayMongo dashboard open **Webhooks → Create Webhook**. Make sure the top bar says **Test Mode**.
2. **URL endpoint:** `https://bida-pay.<you>.workers.dev/webhook` · **Event:** `checkout_session.payment.paid` → **Create**.
3. Copy the webhook's secret key (starts with `whsk_`) and add it to the Worker as a *Secret* named **`PAYMONGO_WEBHOOK_SECRET`** → **Deploy**.

If the dashboard doesn't show a `whsk_` key, create the webhook with this one command in Git Bash instead; the reply contains `"secret_key": "whsk_…"`:

```bash
curl https://api.paymongo.com/v1/webhooks -u "sk_test_YOURKEY:" -H "Content-Type: application/json" -d '{"data":{"attributes":{"url":"https://bida-pay.YOU.workers.dev/webhook","events":["checkout_session.payment.paid"]}}}'
```

## 5. Connect the app
In `bida-app.js`, set `BIDA_CONFIG.workerUrl: 'https://bida-pay.YOU.workers.dev'` and push.

## 6. Test, then go live
1. On the live site: sign in with a **non-admin** Google account → Account → **Premium** → **30 days · Piliin** → on PayMongo's test checkout pick GCash and authorize → you're sent back, the receipt opens and Premium shows the end date. Then try **Gawing lifetime** the same way.
2. When PayMongo approves your business and live keys appear:
   - Swap `PAYMONGO_SECRET_KEY` to `sk_live_…`.
   - Create the webhook again with the top bar on **Live Mode** (same URL and event).
   - Replace `PAYMONGO_WEBHOOK_SECRET` with the new live `whsk_…`.

   The Worker picks the live or test signature automatically based on the key.

## Notes
- **Who's paid:** Cloudflare → KV → `bida-premium`. Each `pro:<uid>` entry has `until` (9999-12-31 for lifetime), `plan` (`month`/`life`), the last payment date, amount, method and email, and `refRewards` if they earned referral days. Referral keys: `seen:<uid>`, `refby:<uid>`, `refn:<uid>`. To refund/revoke, delete the entry or set `until` to 0.
- **Free without an account:** activities, all games and game tools, the first sound pads, 2 sound uploads, 8 free songs from the music library, 5 own music files (saved on the device only) and 20 videoke songs (unlimited plays). The Premium page lists them in a short Free vs Premium comparison. Emcee pads: Drumroll, Ta-da, Ding and Buzzer are free; the other 6 are Premium. Everything else unlocks with either plan.
- **Test code:** `BIDATEST` only works on `localhost`.
- Security details and console settings: [SECURITY.md](SECURITY.md).
