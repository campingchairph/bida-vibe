/* ============================================================
   Bida-Vibe payments — Cloudflare Worker
   Holds the PayMongo secret key (never in the browser), creates
   Checkout Sessions, verifies PayMongo webhooks, and stores who
   has an active Premium pass in Cloudflare KV.

   Premium = a 30-day pass (₱50). Paying again adds 30 days.
   No auto-charge.

   Bindings (Worker → Settings):
     KV namespace   PREMIUM                  (Variables → KV Namespace Bindings)
     Secret         PAYMONGO_SECRET_KEY      sk_test_… / sk_live_…
     Secret         PAYMONGO_WEBHOOK_SECRET  whsk_…  (from the webhook you create)
     Variable       FIREBASE_PROJECT_ID      bidavibe
     Variable       APP_URL                  https://campingchairph.github.io/bida-vibe/
     Variable       ALLOWED_ORIGINS          comma list, e.g. https://campingchairph.github.io,http://localhost:8102
     Variable       PRICE_CENTAVOS           5000  (₱50.00)
     Variable       PASS_DAYS                30

   Admin test accounts live in Firestore: collection "admins", document ID = the
   Google email in lowercase. The Worker asks Firestore *as the signed-in user*;
   the Firestore rules only let a verified user read their own admin document,
   so nobody can claim admin from the browser.

   Routes:
     GET  /status    (Authorization: Bearer <Firebase ID token>) → { premium, admin, until }
     POST /checkout  (Authorization: Bearer <Firebase ID token>) → { url }
     POST /webhook   (from PayMongo, signed)                      → 200
   ============================================================ */

const DAY = 86400000;
// Admin test account fingerprint (SHA-256 of the lowercase Google email). Override with ADMIN_EMAIL_HASHES.
const DEFAULT_ADMIN_HASHES = '291b86481ed2c63b356ae7c2bf0649292169d535f061785fc88a829d26cb50bd';

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
  if (await isAdmin(user, env)) return json({ premium: true, admin: true, until: null }, 200, cors);
  const rec = await env.PREMIUM.get('pro:' + user.uid, 'json');
  const until = rec?.until || 0;
  return json({ premium: until > Date.now(), admin: false, until: until || null }, 200, cors);
}

// Admin = verified Google email with a document at admins/{email} in Firestore.
// Read with the user's own ID token, so Firestore security rules decide.
async function isAdmin(user, env) {
  if (!user.emailVerified || !user.email) return false;
  const email = user.email.trim().toLowerCase();
  // 1) SHA-256 fingerprint of the email (ADMIN_EMAIL_HASHES, comma list) — no email stored anywhere
  const hashes = String(env.ADMIN_EMAIL_HASHES || DEFAULT_ADMIN_HASHES).split(',').map(s => s.trim()).filter(Boolean);
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email)))].map(b => b.toString(16).padStart(2, '0')).join('');
  if (hashes.includes(digest)) return true;
  // 2) or a Firestore admins/{email} document
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/admins/${encodeURIComponent(email)}`;
  try {
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + user.token } });
    return r.status === 200;
  } catch (e) { return false; }
}

async function handleCheckout(req, env, cors) {
  const user = await requireUser(req, env);
  if (await isAdmin(user, env)) return json({ already: true, admin: true }, 200, cors);

  const amount = parseInt(env.PRICE_CENTAVOS || '5000', 10);
  const days = parseInt(env.PASS_DAYS || '30', 10);
  const appUrl = env.APP_URL;
  const body = {
    data: {
      attributes: {
        line_items: [{ name: `Bida-Vibe Premium — ${days} araw`, amount, currency: 'PHP', quantity: 1 }],
        payment_method_types: ['gcash', 'paymaya', 'card'],
        description: `Lahat ng sound pads, music bar, Talk at Fade sa loob ng ${days} araw. Walang auto-charge.`,
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

  const evt = JSON.parse(raw);
  const type = evt?.data?.attributes?.type;
  if (type !== 'checkout_session.payment.paid') return new Response('ignored', { status: 200 });

  const session = evt.data.attributes.data;              // checkout_session resource
  const attrs = session?.attributes || {};
  if (!session?.id) return new Response('no session', { status: 200 });
  // PayMongo retries deliveries: each checkout session may add days only once
  if (await env.PREMIUM.get('paid:' + session.id)) return new Response('already processed', { status: 200 });

  let uid = attrs.metadata?.uid;
  if (!uid) uid = (await env.PREMIUM.get('session:' + session.id, 'json'))?.uid;
  if (!uid) return new Response('no uid', { status: 200 });

  const paid = (attrs.payments || [])[0]?.attributes || {};
  const expectedAmount = parseInt(env.PRICE_CENTAVOS || '5000', 10);
  const amount = paid.amount ?? attrs.line_items?.[0]?.amount ?? 0;
  if (amount < expectedAmount) return new Response('amount mismatch', { status: 200 });

  // Extend from today, or from the current end date if the pass is still active
  const days = parseInt(env.PASS_DAYS || '30', 10);
  const prev = await env.PREMIUM.get('pro:' + uid, 'json');
  const start = Math.max(Date.now(), prev?.until || 0);
  const until = start + days * DAY;
  await env.PREMIUM.put('pro:' + uid, JSON.stringify({
    until, lastPaidAt: new Date().toISOString(), sessionId: session.id, amount,
    method: attrs.payment_method_used || paid.source?.type || '', email: attrs.metadata?.email || '',
    payments: (prev?.payments || 0) + 1
  }));
  await env.PREMIUM.put('paid:' + session.id, '1', { expirationTtl: 60 * 60 * 24 * 90 });
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
  return { uid: payload.sub, email: payload.email, emailVerified: payload.email_verified === true, token: m[1] };
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
