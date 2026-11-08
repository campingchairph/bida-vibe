/* ============================================================
   Bida-Vibe payments — Cloudflare Worker
   Holds the PayMongo secret key (never in the browser), creates
   Checkout Sessions, verifies PayMongo webhooks, and stores who
   has Premium in Cloudflare KV.

   Bindings (Worker → Settings):
     KV namespace   PREMIUM                  (Variables → KV Namespace Bindings)
     Secret         PAYMONGO_SECRET_KEY      sk_test_… / sk_live_…
     Secret         PAYMONGO_WEBHOOK_SECRET  whsk_…  (from the webhook you create)
     Variable       FIREBASE_PROJECT_ID      e.g. bidavibe-12345
     Variable       APP_URL                  e.g. https://campingchairph.github.io/bida-vibe/
     Variable       ALLOWED_ORIGINS          comma list, e.g. https://campingchairph.github.io,http://localhost:8102
     Variable       PRICE_CENTAVOS           14900  (₱149.00)
     Variable       ADMIN_EMAILS             morphiicreate@gmail.com  (free full access; comma list)

   Routes:
     GET  /status    (Authorization: Bearer <Firebase ID token>) → { premium, paidAt }
     POST /checkout  (Authorization: Bearer <Firebase ID token>) → { url }
     POST /webhook   (from PayMongo, signed)                      → 200
   ============================================================ */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      if (url.pathname === '/webhook' && req.method === 'POST') return await handleWebhook(req, env);
      if (url.pathname === '/status' && req.method === 'GET') return await handleStatus(req, env, cors);
      if (url.pathname === '/checkout' && req.method === 'POST') return await handleCheckout(req, env, cors);
      return json({ error: 'not_found' }, 404, cors);
    } catch (e) {
      const status = e.status || 500;
      return json({ error: e.code || 'server_error' }, status, cors);
    }
  }
};

/* ---------- routes ---------- */
async function handleStatus(req, env, cors) {
  const user = await requireUser(req, env);
  if (isAdmin(user, env)) return json({ premium: true, admin: true, paidAt: null }, 200, cors);
  const rec = await env.PREMIUM.get('pro:' + user.uid, 'json');
  return json({ premium: !!rec, admin: false, paidAt: rec?.paidAt || null }, 200, cors);
}
// Admin = Google-verified email listed in ADMIN_EMAILS (comma list). Checked against the signed token, not the browser.
function isAdmin(user, env) {
  const list = String(env.ADMIN_EMAILS || 'morphiicreate@gmail.com').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  return !!(user.emailVerified && user.email && list.includes(user.email.toLowerCase()));
}

async function handleCheckout(req, env, cors) {
  const user = await requireUser(req, env);
  if (isAdmin(user, env) || await env.PREMIUM.get('pro:' + user.uid)) return json({ already: true }, 200, cors);

  const amount = parseInt(env.PRICE_CENTAVOS || '14900', 10);
  const appUrl = env.APP_URL;
  const body = {
    data: {
      attributes: {
        line_items: [{ name: 'Bida-Vibe Premium (lifetime)', amount, currency: 'PHP', quantity: 1 }],
        payment_method_types: ['gcash', 'paymaya', 'card'],
        description: 'Sound Lab, music playlists at Talk fader — one-time unlock',
        reference_number: user.uid.slice(0, 20) + '-' + Date.now().toString(36),
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        success_url: appUrl + '?paid=1',
        cancel_url: appUrl + '?paid=0',
        metadata: { uid: user.uid, email: user.email || '' }
      }
    }
  };
  const r = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Basic ' + btoa(env.PAYMONGO_SECRET_KEY + ':')
    },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) { console.log('paymongo error', JSON.stringify(j)); throw err(502, 'paymongo_error'); }
  const s = j.data;
  await env.PREMIUM.put('session:' + s.id, JSON.stringify({ uid: user.uid, created: Date.now() }), { expirationTtl: 60 * 60 * 24 * 3 });
  return json({ url: s.attributes.checkout_url }, 200, cors);
}

async function handleWebhook(req, env) {
  const raw = await req.text();
  const sigHeader = req.headers.get('Paymongo-Signature') || '';
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=').map(s => s.trim())));
  const live = String(env.PAYMONGO_SECRET_KEY || '').startsWith('sk_live');
  const given = live ? parts.li : parts.te;
  if (!parts.t || !given) return new Response('bad signature', { status: 401 });
  const expected = await hmacHex(env.PAYMONGO_WEBHOOK_SECRET, `${parts.t}.${raw}`);
  if (!timingSafeEqual(expected, given)) return new Response('bad signature', { status: 401 });
  // No timestamp-age check: PayMongo retries failed deliveries, and re-applying a
  // genuine "paid" event is harmless (it only re-marks the same buyer as Premium).

  const evt = JSON.parse(raw);
  const type = evt?.data?.attributes?.type;
  if (type !== 'checkout_session.payment.paid') return new Response('ignored', { status: 200 });

  const session = evt.data.attributes.data;              // checkout_session resource
  const attrs = session?.attributes || {};
  let uid = attrs.metadata?.uid;
  if (!uid && session?.id) uid = (await env.PREMIUM.get('session:' + session.id, 'json'))?.uid;
  if (!uid) return new Response('no uid', { status: 200 });

  const paid = (attrs.payments || [])[0]?.attributes || {};
  const expected_amount = parseInt(env.PRICE_CENTAVOS || '14900', 10);
  const amount = paid.amount ?? attrs.line_items?.[0]?.amount ?? 0;
  if (amount < expected_amount) return new Response('amount mismatch', { status: 200 });

  await env.PREMIUM.put('pro:' + uid, JSON.stringify({
    paidAt: new Date().toISOString(), sessionId: session.id, amount,
    method: attrs.payment_method_used || paid.source?.type || '', email: attrs.metadata?.email || ''
  }));
  return new Response('ok', { status: 200 });
}

/* ---------- Firebase ID token verification ---------- */
const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let jwkCache = { keys: null, exp: 0 };
async function firebaseKeys() {
  if (jwkCache.keys && Date.now() < jwkCache.exp) return jwkCache.keys;
  const r = await fetch(JWK_URL);
  const j = await r.json();
  const maxAge = /max-age=(\d+)/.exec(r.headers.get('Cache-Control') || '');
  jwkCache = { keys: j.keys, exp: Date.now() + (maxAge ? +maxAge[1] * 1000 : 3600e3) };
  return j.keys;
}
async function requireUser(req, env) {
  const m = /^Bearer (.+)$/.exec(req.headers.get('Authorization') || '');
  if (!m) throw err(401, 'no_token');
  const [h, p, s] = m[1].split('.');
  if (!h || !p || !s) throw err(401, 'bad_token');
  const header = JSON.parse(b64urlText(h)), payload = JSON.parse(b64urlText(p));
  if (header.alg !== 'RS256') throw err(401, 'bad_alg');
  const jwk = (await firebaseKeys()).find(k => k.kid === header.kid);
  if (!jwk) throw err(401, 'unknown_kid');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw err(401, 'bad_signature');
  const now = Math.floor(Date.now() / 1000), pid = env.FIREBASE_PROJECT_ID;
  if (payload.exp < now || payload.iat > now + 60) throw err(401, 'expired');
  if (payload.aud !== pid || payload.iss !== 'https://securetoken.google.com/' + pid) throw err(401, 'wrong_project');
  if (!payload.sub) throw err(401, 'no_sub');
  return { uid: payload.sub, email: payload.email, emailVerified: payload.email_verified === true };
}

/* ---------- utils ---------- */
function corsHeaders(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function json(obj, status, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}
function err(status, code) { const e = new Error(code); e.status = status; e.code = code; return e; }
function b64urlBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function b64urlText(s) { return new TextDecoder().decode(b64urlBytes(s)); }
async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
