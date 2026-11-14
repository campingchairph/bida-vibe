/* ============================================================
   Bida-Vibe — app logic
   State lives in one global BIDA object. Every mutation is
   followed by saveState() and a targeted render*() call.
   ============================================================ */
(function () {
'use strict';

/* ---------- Config (edit before launch) ---------- */
const BIDA_CONFIG = {
  price: '₱50',
  passDays: 30,       // Premium is a pass: ₱50 for 30 days, no auto-charge. Paying again adds 30 days.
  // Payments (see PAYMENTS.md): URL of the deployed Cloudflare Worker, e.g. 'https://bida-pay.yourname.workers.dev'
  workerUrl: '',
  // Firebase web config (Project settings → Your apps → Web app). Used for Google sign-in (buyers + admin).
  firebase: {
    apiKey: 'AIzaSyCkgq_rS5ZlTO40PsoKhvG0ZwwefhjNeWE',
    authDomain: 'bidavibe.firebaseapp.com',
    projectId: 'bidavibe',
    storageBucket: 'bidavibe.firebasestorage.app',
    messagingSenderId: '596965053196',
    appId: '1:596965053196:web:cb32617798b800f4276f29'
  },
  // Admin test accounts: SHA-256 fingerprints of the Google email (lowercase), never the email itself.
  // Only someone who signs in with Google as that verified account matches. To add/change an admin,
  // hash the new email (e.g. `printf '%s' you@gmail.com | sha256sum`) and replace/add it here.
  // (Firestore admins/{email} documents also still work, if you ever add them.)
  adminHashes: ['291b86481ed2c63b356ae7c2bf0649292169d535f061785fc88a829d26cb50bd'],
  // Free tier limits
  freeUploads: 2,     // uploaded sound pads a free user can add
  freeYtLinks: 5,     // saved YouTube links a free user can play; more needs Premium
  // Test unlock — only works on localhost, never on the live site.
  devUnlockCode: 'BIDATEST',
  // Spotify: create an app at developer.spotify.com, add this page's URL as a Redirect URI, paste the Client ID.
  spotifyClientId: ''
};

const STORE_KEY = 'bidavibe_data';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (id, cls = 'ic') => `<svg class="${cls}"><use href="#i-${id}"/></svg>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- State ---------- */
let BIDA = defaultState();
function defaultState() {
  return {
    v: 4,
    event: { type: 'reunion', name: '', date: '', start: '15:00' },
    program: [],
    nextId: 1,
    premium: false,
    premiumUid: '',   // Google account the Premium unlock belongs to (cached for offline use)
    premiumUntil: 0,  // end of the paid pass (ms); 0 = none
    proKind: '',      // 'admin' | 'pass' | '' — cached so the venue works offline
    devPro: false,    // localhost-only test unlock
    // duck = how low Talk takes the music · fade = Talk speed (same down and back up)
    // mode 'hold' = music returns by itself after talking · 'toggle' = tap Talk again to bring it back
    // ytLinks = saved YouTube links [{ v, list, title, thumb }] — 5 free, more with Premium
    music: { master: 0.8, duck: 0.2, fade: 500, mode: 'hold', src: 'youtube', ytLinks: [], ytIdx: -1, spUrl: '', link: '', autoDuck: false, sens: 0.5 },
    seenLanding: false,
    tab: 'plan',
    gameChecks: {},
    liveIdx: 0,
    card: null,       // invitation card: { theme, size, intro, title, sub, date, time, venue, msg, rsvp }
    vk: null,         // videoke: { queue, mine, score, lastSinger, room }
    remote: null      // host remote link: { id, owner, exp }
  };
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(BIDA)); } catch (e) { /* storage full or blocked */ }
  try { rmtPublish(); } catch (e) { }   // keep the host's phone remote in sync
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw), def = defaultState();
      BIDA = Object.assign(def, d);
      BIDA.event = Object.assign(def.event, d.event || {});
      BIDA.music = Object.assign(def.music, d.music || {});
      // Any missing / broken number falls back to its default (never NaN in the sliders)
      for (const k of ['master', 'duck', 'fade', 'sens']) {
        if (!Number.isFinite(BIDA.music[k])) BIDA.music[k] = defaultState().music[k];
      }
      delete BIDA.music.fadeUp; delete BIDA.music.delay; delete BIDA.music.fadeBtn;
      // YouTube links: keep only well-formed entries (ids are YouTube's own [A-Za-z0-9_-] format)
      const okId = s => typeof s === 'string' && /^[\w-]{0,64}$/.test(s);
      BIDA.music.ytLinks = (Array.isArray(BIDA.music.ytLinks) ? BIDA.music.ytLinks : [])
        .filter(l => l && okId(l.v) && okId(l.list) && (l.v || l.list))
        .map(l => ({ v: l.v, list: l.list, title: String(l.title || '').slice(0, 120), thumb: /^https:\/\/i\.ytimg\.com\//.test(l.thumb) ? l.thumb : '' }));
      // carry over the single link from the old version
      if (d.music?.ytUrl && !BIDA.music.ytLinks.length) { const p = parseYouTube(d.music.ytUrl); if (p) BIDA.music.ytLinks.push({ v: p.id, list: p.list, title: '', thumb: p.id ? `https://i.ytimg.com/vi/${p.id}/mqdefault.jpg` : '' }); }
      delete BIDA.music.ytUrl;
      if (!Number.isInteger(BIDA.music.ytIdx) || BIDA.music.ytIdx >= BIDA.music.ytLinks.length) BIDA.music.ytIdx = -1;
      // v3: scripts/guide removed, tabs simplified
      delete BIDA.scriptEdits; delete BIDA.tones; delete BIDA.rulesOpen;
      if (!['plan', 'card', 'games', 'videoke', 'sounds', 'music'].includes(BIDA.tab)) BIDA.tab = 'plan';
      // v4: Premium became a 30-day pass — drop any old lifetime unlock
      if ((d.v || 1) < 4) { BIDA.proKind = ''; BIDA.premiumUntil = 0; BIDA.premiumUid = ''; BIDA.premium = false; }
      BIDA.v = 4;
    }
  } catch (e) { BIDA = defaultState(); }
  // Treat stored data as untrusted: keep only well-formed activities (numbers are numbers, ids are known)
  BIDA.program = (Array.isArray(BIDA.program) ? BIDA.program : []).filter(s => s && Number.isInteger(s.id) && BIDA_KINDS[s.kind])
    .map(s => ({ id: s.id, kind: s.kind, title: String(s.title || '').slice(0, 80), min: clamp(parseInt(s.min, 10) || 5, 1, 300), game: gameById(s.game) ? s.game : '',
      note: String(s.note || '').slice(0, 300), done: s.done === true }));
  BIDA.nextId = Math.max(Number.isInteger(BIDA.nextId) ? BIDA.nextId : 1, ...BIDA.program.map(s => s.id + 1));
  if (!BIDA_EVENTS.some(e => e.id === BIDA.event.type)) BIDA.event.type = 'reunion';
  if (!/^\d{2}:\d{2}$/.test(BIDA.event.start)) BIDA.event.start = '15:00';
  if (!BIDA.program.length) buildProgram(BIDA.event.type);
  const r = BIDA.remote;
  BIDA.remote = r && /^[A-Za-z0-9]{24}$/.test(r.id) && typeof r.owner === 'string' && r.exp > Date.now() ? { id: r.id, owner: r.owner.slice(0, 128), exp: +r.exp } : null;
}

/* ---------- In-app dialogs (never native confirm/prompt: they freeze the page and can pause music) ---------- */
function openDlg(msg, { input = null, yes = 'Oo', no = 'Huwag', max = 40 } = {}) {
  return new Promise(resolve => {
    const wrap = $('#dlg-wrap'), inp = $('#dlg-input'), y = $('#dlg-yes'), n = $('#dlg-no');
    $('#dlg-msg').textContent = msg; y.textContent = yes; n.textContent = no;
    inp.hidden = input === null; inp.maxLength = max; if (input !== null) inp.value = String(input).slice(0, max);
    wrap.hidden = false; (input !== null ? inp : y).focus();
    const done = v => { wrap.hidden = true; y.onclick = n.onclick = inp.onkeydown = wrap.onclick = null; resolve(v); };
    y.onclick = () => done(input !== null ? inp.value.trim() : true);
    n.onclick = () => done(input !== null ? null : false);
    inp.onkeydown = e => { if (e.key === 'Enter') y.onclick(); if (e.key === 'Escape') n.onclick(); };
    wrap.onclick = e => { if (e.target === wrap) n.onclick(); };
  });
}
const askConfirm = (msg, yes) => openDlg(msg, { yes });
// max = how many characters the box accepts (links need far more than names)
const askText = (msg, def, max = 40) => openDlg(msg, { input: def, yes: 'I-save', no: 'Kanselahin', max });

/* ---------- Helpers ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}
function eventType(id = BIDA.event.type) { return BIDA_EVENTS.find(e => e.id === id) || BIDA_EVENTS[0]; }
function gameById(id) { return BIDA_GAMES.find(g => g.id === id); }
function toMin(hhmm) { const [h, m] = (hhmm || '15:00').split(':').map(Number); return h * 60 + (m || 0); }
function fmtTime(min) {
  min = ((min % 1440) + 1440) % 1440;
  let h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
function segTimes() {
  let t = toMin(BIDA.event.start);
  return BIDA.program.map(s => { const st = t; t += Number(s.min) || 0; return st; });
}
function totalMin() { return BIDA.program.reduce((a, s) => a + (Number(s.min) || 0), 0); }
function fmtDur(m) { return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m}m`; }

/* ---------- Program ---------- */
function buildProgram(typeId) {
  const et = eventType(typeId);
  BIDA.program = et.program.map(([kind, title, min, game]) => ({ id: BIDA.nextId++, kind, title, min, game: game || '', note: '', done: false }));
  BIDA.liveIdx = 0;
}

/* ---------- Bunting (papel picado) ---------- */
const FLAG_COLORS = ['#E2367A', '#F6B21B', '#0FA3A3', '#E4452B', '#3E9B4F'];
function flagPath(w, h, variant) {
  // outer: square top, zigzag bottom; cut-outs via evenodd
  const z = 6, teeth = 4, tw = w / teeth;
  let d = `M0 0H${w}V${h - z}`;
  for (let i = teeth; i > 0; i--) d += `L${(i - .5) * tw} ${h}L${(i - 1) * tw} ${h - z}`;
  d += 'Z';
  const cx = w / 2, cy = h * .45, r = w * .17;
  if (variant % 3 === 0) d += `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  else if (variant % 3 === 1) d += `M${cx} ${cy - r * 1.3}L${cx + r} ${cy}L${cx} ${cy + r * 1.3}L${cx - r} ${cy}Z`;
  else {
    const s = r * .75; d += `M${cx - s * 1.6} ${cy - s}h${s}v${s}h${-s}ZM${cx + s * .6} ${cy - s}h${s}v${s}h${-s}ZM${cx - s / 2} ${cy + s * .4}h${s}v${s}h${-s}Z`;
  }
  d += `M${w * .2} ${h * .14}h3v3h-3ZM${w * .8 - 3} ${h * .14}h3v3h-3Z`;
  return d;
}
function renderBunting(el) {
  const W = Math.max(320, el.clientWidth || window.innerWidth), H = el.clientHeight || 54;
  const fh = Math.round(H * .78), fw = Math.round(fh * .78), gap = Math.round(fw * .28);
  const n = Math.ceil(W / (fw + gap)) + 1;
  let flags = '';
  for (let i = 0; i < n; i++) {
    const x = i * (fw + gap) + gap / 2;
    const sag = Math.sin((x / W) * Math.PI * 2) * 2.5 + 3;
    const delay = (-(i * .37) % 3.2).toFixed(2);
    flags += `<g transform="translate(${x.toFixed(1)} ${sag.toFixed(1)})"><path class="flag" style="animation-delay:${delay}s" d="${flagPath(fw, fh, i)}" fill="${FLAG_COLORS[i % 5]}" fill-rule="evenodd" stroke="#1E1A16" stroke-width="1.5" stroke-linejoin="round"/></g>`;
  }
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 3Q${W / 4} 7 ${W / 2} 3T${W} 3" fill="none" stroke="#1E1A16" stroke-width="2"/>${flags}</svg>`;
}
function renderAllBunting() { $$('.bunting').forEach(el => { if (el.offsetParent !== null || el.closest('#landing')) renderBunting(el); }); }

/* ---------- Landing / app ---------- */
function enterApp(tab) {
  BIDA.seenLanding = true; saveState();
  $('#landing').hidden = true; $('#app').hidden = false; document.body.classList.add('in-app');
  goTab(tab || BIDA.tab || 'plan');
  requestAnimationFrame(renderAllBunting);
}
function showLanding() {
  $('#landing').hidden = false; $('#app').hidden = true; document.body.classList.remove('in-app');
  requestAnimationFrame(renderAllBunting);
}

/* ---------- Tabs ---------- */
const RENDER = { plan: renderPlan, card: renderCard, games: renderGames, videoke: renderVideoke, sounds: renderSounds, music: renderMusic };
function goTab(name) {
  if (!RENDER[name]) name = 'plan';
  BIDA.tab = name; saveState();
  $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
  RENDER[name]();
  renderHead();
  document.body.classList.toggle('on-music', name === 'music');   // the Music tab already lists the links
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
function renderHead() {
  const e = BIDA.event, et = eventType();
  $('#head-event').innerHTML = `<b>${esc(e.name || et.label)}</b>${e.date ? ' · ' + esc(fmtDate(e.date)) : ''} · ${fmtTime(toMin(e.start))}`;
  const acct = $('#acct-btn');
  if (acct) acct.classList.toggle('is-pro', !!BIDA.premium);
}
function fmtDate(d) {
  try { return new Date(d + 'T00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }); } catch (e) { return d; }
}

/* ============================================================
   PLAN PANEL — pick the event, get a simple activity list
   ============================================================ */
const QUICK_ADD = ['opening', 'prayer', 'meal', 'game', 'raffle', 'gifts', 'speech', 'awards', 'cake', 'photo', 'toast', 'videoke', 'closing'];
function renderPlan() {
  const e = BIDA.event, times = segTimes(), end = toMin(e.start) + totalMin();
  $('#panel-plan').innerHTML = `
    <div class="plan-top">
      <div class="field"><label for="ev-name">Event</label>
        <input class="input" id="ev-name" placeholder="${esc(eventType().label)}" value="${esc(e.name)}" oninput="setEv('name',this.value)"></div>
      <div class="field"><label for="ev-date">Petsa</label>
        <input class="input" id="ev-date" type="date" value="${esc(e.date)}" oninput="setEv('date',this.value)"></div>
      <div class="field"><label for="ev-start">Simula</label>
        <input class="input" id="ev-start" type="time" value="${esc(e.start)}" onchange="setEv('start',this.value)"></div>
    </div>
    <div class="type-strip" role="radiogroup" aria-label="Uri ng event">${BIDA_EVENTS.map(t => `
      <button class="type-chip ${t.id === e.type ? 'on' : ''}" role="radio" aria-checked="${t.id === e.type}" onclick="pickEventType('${t.id}')">${esc(t.label)}</button>`).join('')}</div>
    <div class="plan-head">
      <div><h2>Activities</h2><p class="muted">${BIDA.program.filter(s => s.done).length}/${BIDA.program.length} tapos · ${fmtTime(toMin(e.start))} – ${fmtTime(end)} · ${fmtDur(totalMin())}</p></div>
      <button class="btn btn--chili plan-live" onclick="openLive()">${ic('live')}Simulan</button>
    </div>
    <ol class="act-list">${BIDA.program.map((s, i) => {
      const k = BIDA_KINDS[s.kind] || BIDA_KINDS.opening, g = s.game && gameById(s.game), isNext = i === nextIdx();
      return `<li class="act k-${k.color} ${s.done ? 'is-done' : ''} ${isNext ? 'is-next' : ''}">
        <button class="act-check" role="checkbox" aria-checked="${!!s.done}" onclick="toggleDone(${s.id})" aria-label="${s.done ? 'Hindi pa tapos' : 'Tapos na'}: ${esc(s.title)}">${s.done ? ic('check') : ''}</button>
        <button class="act-main" onclick="editSeg(${s.id})" aria-label="Edit ${esc(s.title)}">
          ${isNext ? '<span class="act-next-tag">Susunod</span>' : ''}
          <span class="act-time">${fmtTime(times[i])}</span>
          <span class="act-title">${esc(s.title)}</span>
          <span class="act-min">${s.min} min${g ? ' · laro' : ''}</span>
          ${s.note ? `<span class="act-note">${ic('edit')}${esc(s.note)}</span>` : ''}
        </button>
        ${g ? `<button class="act-game" onclick="openGame('${g.id}')" aria-label="How to play ${esc(g.name)}">${ic('games')}</button>` : ''}
        <span class="act-move">
          <button onclick="moveSeg(${i},-1)" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${ic('up')}</button>
          <button onclick="moveSeg(${i},1)" aria-label="Move down" ${i === BIDA.program.length - 1 ? 'disabled' : ''}>${ic('down')}</button>
        </span></li>`;
    }).join('')}</ol>
    <div class="plan-foot">
      <button class="btn btn--ink" onclick="editSeg()">${ic('plus')}Dagdag activity</button>
      <button class="btn btn--ghost" onclick="resetProgram()">I-reset</button>
    </div>`;
}
// The next activity = the first one not checked as done
function nextIdx() { return BIDA.program.findIndex(s => !s.done); }
function toggleDone(id) {
  const s = BIDA.program.find(x => x.id === id); if (!s) return;
  s.done = !s.done; saveState(); renderPlan();
  if (s.done) { const n = BIDA.program[nextIdx()]; toast(n ? `Susunod: ${n.title}` : 'Tapos na lahat — palakpakan!'); }
}
function setEv(k, v) {
  BIDA.event[k] = v; saveState(); renderHead();
  if (k === 'start') renderPlan();
}
async function pickEventType(id) {
  if (id === BIDA.event.type) return;
  if (!await askConfirm(`Palitan ang activities ng suggested para sa ${eventType(id).label}?`, 'Palitan')) return;
  BIDA.event.type = id; buildProgram(id); saveState(); renderPlan(); renderHead();
  toast(`Activities para sa ${eventType().label} — handa na!`);
}
function moveSeg(i, d) {
  const j = i + d; if (j < 0 || j >= BIDA.program.length) return;
  const p = BIDA.program;[p[i], p[j]] = [p[j], p[i]]; saveState(); renderPlan();
}
async function resetProgram() {
  if (!await askConfirm('I-reset sa suggested activities ng ' + eventType().label + '? Mabubura ang notes at checks.', 'I-reset')) return;
  buildProgram(BIDA.event.type); saveState(); renderPlan(); toast('Na-reset');
}
let segDraft = null;
function editSeg(id) {
  const s = id ? BIDA.program.find(x => x.id === id) : null;
  segDraft = s ? { ...s } : { kind: 'game', title: '', min: 15, game: '', note: '' };
  openSheet(`
    <div class="sheet-head"><h3>${id ? 'I-edit' : 'Dagdag activity'}</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    ${id ? '' : `<span class="field-label">Pumili</span>
    <div class="chips" style="margin:8px 0 16px">${QUICK_ADD.map(k => `<button class="chip ${k === segDraft.kind ? 'on' : ''}" onclick="pickKind('${k}',this)">${esc(BIDA_KINDS[k].label)}</button>`).join('')}</div>`}
    <div class="stack">
      <div class="field"><label for="sg-title">Pangalan</label><input class="input" id="sg-title" value="${esc(segDraft.title)}" placeholder="hal. Raffle ni Tito Boy"></div>
      <div class="field"><label for="sg-min">Ilang minuto</label>
        <div class="min-row">${[5, 10, 15, 20, 30, 45, 60].map(m => `<button class="chip ${+segDraft.min === m ? 'on' : ''}" onclick="pickMin(${m},this)">${m}</button>`).join('')}
        <input class="input" id="sg-min" type="number" min="1" max="300" value="${segDraft.min}" aria-label="Minuto"></div></div>
      <div class="field" id="sg-game-wrap" ${segDraft.kind === 'game' || segDraft.kind === 'icebreak' ? '' : 'hidden'}><label for="sg-game">Laro</label>
        <select class="input" id="sg-game" onchange="if(this.value&&!$('#sg-title').value)$('#sg-title').value=this.options[this.selectedIndex].text">
          <option value="">— Sariling laro —</option>
          ${BIDA_GAMES.map(g => `<option value="${g.id}" ${g.id === segDraft.game ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="sg-note">Note</label>
        <textarea class="input" id="sg-note" rows="3" maxlength="300" placeholder="hal. Si Tito Ben ang magdadala ng premyo · Banggitin ang galing Dubai">${esc(segDraft.note || '')}</textarea></div>
      ${id ? `<label class="toggle"><input type="checkbox" id="sg-done" ${segDraft.done ? 'checked' : ''}>Tapos na ang activity na ito</label>` : ''}
    </div>
    <div class="sheet-actions">
      ${id ? `<button class="btn btn--ghost" onclick="deleteSeg(${id})">${ic('trash')}Tanggalin</button>` : ''}
      <button class="btn btn--ink" onclick="saveSeg(${id || 0})">I-save</button>
    </div>`);
  setTimeout(() => $('#sg-title')?.focus(), 60);
}
function pickKind(k, el) {
  segDraft.kind = k;
  $$('#sheet .chips .chip').forEach(c => c.classList.toggle('on', c === el));
  $('#sg-game-wrap').hidden = !(k === 'game' || k === 'icebreak');
  const t = $('#sg-title'); if (!t.value || QUICK_ADD.some(q => BIDA_KINDS[q].label === t.value)) t.value = k === 'game' ? '' : BIDA_KINDS[k].label;
}
function pickMin(m, el) {
  $('#sg-min').value = m;
  $$('#sheet .min-row .chip').forEach(c => c.classList.toggle('on', c === el));
}
function saveSeg(id) {
  const kind = segDraft.kind, game = (kind === 'game' || kind === 'icebreak') ? $('#sg-game').value : '';
  let title = $('#sg-title').value.trim();
  if (!title) title = game ? gameById(game).name : BIDA_KINDS[kind].label;
  const min = clamp(parseInt($('#sg-min').value, 10) || 5, 1, 300);
  const note = $('#sg-note').value.trim().slice(0, 300);
  title = title.slice(0, 80);
  if (id) Object.assign(BIDA.program.find(x => x.id === id), { kind, title, min, game, note, done: !!$('#sg-done')?.checked });
  else BIDA.program.push({ id: BIDA.nextId++, kind, title, min, game, note, done: false });
  saveState(); closeSheet(); renderPlan(); toast('Na-save!');
}
function deleteSeg(id) {
  BIDA.program = BIDA.program.filter(s => s.id !== id);
  saveState(); closeSheet(); renderPlan(); toast('Natanggal');
}

/* ============================================================
   CARD — the event's key details as an invitation card.
   Drawn on a <canvas> so it downloads as a PNG (or shares straight to Messenger etc.).
   Themes are matched to the event type; all themes are available for any event.
   ============================================================ */
const CARD_SIZES = { post: [1080, 1350, 'Post 4:5'], story: [1080, 1920, 'Story 9:16'] };
const CARD_FONT = '"Bricolage Grotesque", "Nunito", sans-serif', BODY_FONT = '"Nunito", sans-serif';
// tiny seeded random so decorations look the same every time the card is redrawn
const seeded = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
function starPath(ctx, x, y, r, n = 5, inner = .45, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * inner : r, a = rot + i * Math.PI / n; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath();
}
function parol(ctx, x, y, r, col, tail) {
  starPath(ctx, x, y, r, 5, .5); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = r * .08; ctx.strokeStyle = '#1E1A16'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * .28, 0, 7); ctx.fillStyle = '#FFF6E5'; ctx.fill(); ctx.stroke();
  ctx.lineWidth = r * .06; ctx.strokeStyle = tail;
  [-.25, 0, .25].forEach(o => { ctx.beginPath(); ctx.moveTo(x + o * r, y + r * .4); ctx.quadraticCurveTo(x + o * r * 2, y + r * 1.3, x + o * r * 1.2, y + r * 1.9); ctx.stroke(); });
}
function balloon(ctx, x, y, r, col) {
  ctx.strokeStyle = '#1E1A16'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y + r * 1.2); ctx.quadraticCurveTo(x + r * .5, y + r * 2.2, x - r * .2, y + r * 3.2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y, r * .85, r * 1.1, 0, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - r * .3, y - r * .4, r * .15, r * .25, -.5, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill();
}
function picadoRow(ctx, W, y, h, cols) {
  ctx.strokeStyle = '#1E1A16'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + 30, W, y); ctx.stroke();
  const fw = h * .78, gap = fw * .25, n = Math.ceil(W / (fw + gap)) + 1;
  for (let i = 0; i < n; i++) {
    const x = i * (fw + gap) + gap / 2, sag = Math.sin((x / W) * Math.PI) * 26;
    ctx.save(); ctx.translate(x, y + sag); ctx.rotate((i % 2 ? 1 : -1) * .04);
    const p = new Path2D(flagPath(fw, h, i)); ctx.fillStyle = cols[i % cols.length]; ctx.fill(p, 'evenodd'); ctx.lineWidth = 3; ctx.stroke(p); ctx.restore();
  }
}
function confetti(ctx, W, H, cols, n, seed, avoid) {
  const rnd = seeded(seed);
  for (let i = 0; i < n; i++) {
    const x = rnd() * W, y = rnd() * H; if (avoid && x > avoid[0] && x < avoid[2] && y > avoid[1] && y < avoid[3]) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rnd() * 6.3); ctx.fillStyle = cols[i % cols.length];
    if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 9 + rnd() * 8, 0, 7); ctx.fill(); } else ctx.fillRect(-14, -6, 28 + rnd() * 10, 12);
    ctx.restore();
  }
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// Each theme: colours + a decoration painter + where the text panel sits. `for` = event types it suits.
const CARD_THEMES = [
  { id: 'parol', name: 'Parol', for: ['xmas'], area: [.27, .95], bg: '#1F5A3A', fg: '#FFF6E5', accent: '#F6B21B', panel: '#FFF6E5', panelFg: '#1E1A16',
    deco(ctx, W, H) { [[W * .18, H * .1, 95, '#E4452B'], [W * .5, H * .07, 70, '#F6B21B'], [W * .82, H * .11, 100, '#E2367A']].forEach(([x, y, r, c]) => parol(ctx, x, y, r, c, '#F6B21B'));
      confetti(ctx, W, H, ['rgba(255,246,229,.35)'], 60, 7, [0, H * .2, W, H * .95]); } },
  { id: 'noche', name: 'Noche Buena', for: ['xmas', 'office'], area: [.07, .8], bg: '#B3262E', fg: '#FFF6E5', accent: '#F6B21B', panel: '#FFF6E5', panelFg: '#1E1A16',
    deco(ctx, W, H) { const rnd = seeded(3); for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 4 + rnd() * 7, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); }
      [[W * .14, H * .9], [W * .86, H * .9]].forEach(([x, y]) => { starPath(ctx, x, y, 70); ctx.fillStyle = '#F6B21B'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#1E1A16'; ctx.stroke(); }); } },
  { id: 'banderitas', name: 'Banderitas', for: ['reunion', 'fiesta', 'custom', 'despedida'], area: [.18, .83], bg: '#FFF6E5', fg: '#1E1A16', accent: '#E2367A', panel: null,
    deco(ctx, W, H) { picadoRow(ctx, W, 8, 150, ['#E2367A', '#F6B21B', '#0FA3A3', '#E4452B', '#3E9B4F']); picadoRow(ctx, W, H - 150, 130, ['#0FA3A3', '#E4452B', '#3E9B4F', '#E2367A', '#F6B21B']); } },
  { id: 'pamilya', name: 'Pamilya', for: ['reunion', 'binyag'], area: [.07, .93], bg: '#C8553D', fg: '#FFF6E5', accent: '#FFE08A', panel: '#FFF6E5', panelFg: '#1E1A16',
    deco(ctx, W, H) { const rnd = seeded(11);
      for (let i = 0; i < 26; i++) { const x = (i % 2 ? W - 60 : 60) + (rnd() - .5) * 120, y = rnd() * H; ctx.beginPath(); ctx.ellipse(x, y, 34, 18, rnd() * 3, 0, 7); ctx.fillStyle = i % 3 ? '#3E9B4F' : '#F6B21B'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1E1A16'; ctx.stroke(); } } },
  { id: 'confetti', name: 'Confetti', for: ['birthday', 'barkada', 'office', 'custom'], area: [.16, .86], bg: '#FFFDF8', fg: '#1E1A16', accent: '#E2367A', panel: null,
    deco(ctx, W, H) { confetti(ctx, W, H, ['#E2367A', '#F6B21B', '#0FA3A3', '#E4452B', '#3E9B4F'], 140, 5, [W * .08, H * .18, W * .92, H * .86]); } },
  { id: 'lobo', name: 'Lobo', for: ['birthday', 'binyag'], area: [.27, .78], bg: '#BDE7F2', fg: '#1E1A16', accent: '#E2367A', panel: '#FFFDF8', panelFg: '#1E1A16',
    deco(ctx, W, H) { [[W * .12, H * .1, 70, '#E2367A'], [W * .27, H * .06, 55, '#F6B21B'], [W * .78, H * .07, 62, '#0FA3A3'], [W * .9, H * .12, 50, '#E4452B'], [W * .1, H * .82, 52, '#3E9B4F'], [W * .9, H * .8, 66, '#E2367A']].forEach(([x, y, r, c]) => balloon(ctx, x, y, r, c)); } },
  { id: 'gabi', name: 'Barkada Night', for: ['barkada', 'birthday'], area: [.2, .8], bg: '#1E1A16', fg: '#FFF6E5', accent: '#F6B21B', panel: null,
    deco(ctx, W, H) { ctx.fillStyle = '#E2367A'; ctx.fillRect(0, 0, W, 26); ctx.fillStyle = '#0FA3A3'; ctx.fillRect(0, H - 26, W, 26);
      const rnd = seeded(9); for (let i = 0; i < 40; i++) { starPath(ctx, rnd() * W, rnd() * H * .2 + 40, 6 + rnd() * 10, 4, .35); ctx.fillStyle = i % 2 ? '#F6B21B' : '#FFF6E5'; ctx.fill(); }
      for (let i = 0; i < 30; i++) { starPath(ctx, rnd() * W, H - 60 - rnd() * H * .12, 6 + rnd() * 9, 4, .35); ctx.fillStyle = i % 2 ? '#E2367A' : '#0FA3A3'; ctx.fill(); } } },
  { id: 'opisina', name: 'Gold Classic', for: ['office', 'xmas', 'despedida'], area: [.1, .9], bg: '#13243A', fg: '#FFF6E5', accent: '#E8C26A', panel: null,
    deco(ctx, W, H) { ctx.strokeStyle = '#E8C26A'; ctx.lineWidth = 6; ctx.strokeRect(44, 44, W - 88, H - 88); ctx.lineWidth = 2; ctx.strokeRect(68, 68, W - 136, H - 136);
      [[68, 68], [W - 68, 68], [68, H - 68], [W - 68, H - 68]].forEach(([x, y]) => { starPath(ctx, x, y, 22, 4, .3); ctx.fillStyle = '#E8C26A'; ctx.fill(); }); } },
  { id: 'binyag', name: 'Binyag', for: ['binyag'], area: [.17, .82], bg: '#EAF3FB', fg: '#1F3B5C', accent: '#6FA8DC', panel: null,
    deco(ctx, W, H) { const cloud = (x, y, s) => { ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#1F3B5C'; ctx.lineWidth = 3; ctx.beginPath(); [[0, 0, 40], [38, -14, 46], [80, 0, 38]].forEach(([dx, dy, r]) => ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7)); ctx.fill(); ctx.stroke(); };
      cloud(80, 150, 1.2); cloud(W - 260, 110, 1); cloud(120, H - 160, 1); cloud(W - 300, H - 200, 1.3);
      ctx.strokeStyle = '#6FA8DC'; ctx.lineWidth = 3; ctx.setLineDash([10, 14]); ctx.strokeRect(54, 54, W - 108, H - 108); ctx.setLineDash([]); } },
  { id: 'byahe', name: 'Byahe', for: ['despedida'], area: [.22, .76], bg: '#F7E1C8', fg: '#1E1A16', accent: '#E4452B', panel: '#FFFDF8', panelFg: '#1E1A16',
    deco(ctx, W, H) { [['#F6B21B', .78], ['#E4452B', .84], ['#C8553D', .9], ['#1F5A3A', .96]].forEach(([c, y]) => { ctx.fillStyle = c; ctx.fillRect(0, H * y, W, H * .07); });
      ctx.beginPath(); ctx.arc(W * .8, H * .78, 110, Math.PI, 0); ctx.fillStyle = '#F6B21B'; ctx.fill();
      ctx.strokeStyle = '#1E1A16'; ctx.lineWidth = 4; ctx.setLineDash([16, 14]); ctx.beginPath(); ctx.moveTo(60, H * .2); ctx.quadraticCurveTo(W * .5, 40, W - 140, H * .12); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(W - 120, H * .11); ctx.rotate(.15); ctx.fillStyle = '#0FA3A3'; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(50, -8); ctx.lineTo(70, 0); ctx.lineTo(50, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, -44); ctx.lineTo(10, -4); ctx.moveTo(0, 0); ctx.lineTo(-20, 44); ctx.lineTo(10, 4); ctx.fill(); ctx.stroke(); ctx.restore(); } },
  { id: 'pista', name: 'Pista', for: ['fiesta', 'reunion', 'birthday'], area: [.21, .95], bg: '#E2367A', fg: '#FFF6E5', accent: '#F6B21B', panel: '#FFF6E5', panelFg: '#1E1A16',
    deco(ctx, W, H) { picadoRow(ctx, W, 8, 170, ['#F6B21B', '#0FA3A3', '#FFF6E5', '#3E9B4F', '#E4452B']);
      confetti(ctx, W, H, ['#F6B21B', '#0FA3A3', '#FFF6E5'], 70, 13, [0, 0, W, H * .9]); } }
];
/* The host's own photo as the card background. Kept only on this device (IndexedDB), never uploaded. */
const CARD_BG = { img: null, url: '', loaded: false };
const OWN_THEME = { id: 'own', name: 'Sarili mong background', area: [.1, .92], bg: '#1E1A16', fg: '#FFF6E5', accent: '#F6B21B', panel: '#FFF6E5', panelFg: '#1E1A16',
  deco(ctx, W, H) {
    const im = CARD_BG.img; if (!im) return;
    const k = Math.max(W / im.width, H / im.height), w = im.width * k, h = im.height * k;   // fill the card, crop the edges
    ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  } };
const CARD_UI = { more: false };
function cardTheme() {
  if (BIDA.card.theme === 'own' && CARD_BG.img) return { ...OWN_THEME, panel: BIDA.card.ownPanel === '0' ? null : OWN_THEME.panel };
  return CARD_THEMES.find(t => t.id === BIDA.card.theme) || CARD_THEMES[0];
}
async function loadCardBg() {
  if (CARD_BG.loaded) return;
  CARD_BG.loaded = true;
  try {
    const rec = await idb('images', 'readonly', s => s.get('cardbg'));
    if (rec && rec.blob instanceof Blob) await setCardBgBlob(rec.blob);
  } catch (e) { }
}
function setCardBgBlob(blob) {
  return new Promise(res => {
    if (CARD_BG.url) URL.revokeObjectURL(CARD_BG.url);
    const url = URL.createObjectURL(blob), im = new Image();
    im.onload = () => { CARD_BG.img = im; CARD_BG.url = url; res(true); };
    im.onerror = () => { URL.revokeObjectURL(url); res(false); };
    im.src = url;
  });
}
// Shrink big phone photos (max 1920px) so the card stays fast; saved as JPEG on this device only
async function cardUploadBg(input) {
  const file = input.files && input.files[0]; input.value = '';
  if (!file) return;
  if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.type)) { toast('Picture lang pwede (JPG, PNG o WebP)'); return; }
  if (file.size > 25e6) { toast('Masyadong malaki ang picture (max 25 MB)'); return; }
  let bmp; try { bmp = await createImageBitmap(file); } catch (e) { toast('Hindi mabuksan ang picture na yan. Subukan ang JPG o PNG.'); return; }
  const k = Math.min(1, 1920 / Math.max(bmp.width, bmp.height)), cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close?.();
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .86));
  if (!blob) { toast('Hindi ma-save ang picture'); return; }
  await idb('images', 'readwrite', s => s.put({ id: 'cardbg', blob }));
  await setCardBgBlob(blob); CARD_BG.loaded = true;
  ensureCard(); BIDA.card.theme = 'own'; saveState(); renderCard(); toast('Naka-set na ang background mo!');
}
async function cardRemoveBg() {
  if (!await askConfirm('Alisin ang sarili mong background?', 'Alisin')) return;
  await idb('images', 'readwrite', s => s.delete('cardbg'));
  if (CARD_BG.url) URL.revokeObjectURL(CARD_BG.url);
  Object.assign(CARD_BG, { img: null, url: '' });
  if (BIDA.card.theme === 'own') BIDA.card.theme = cardDefaults().theme;
  saveState(); renderCard();
}
function cardOwnHTML() {
  const on = BIDA.card.theme === 'own' && CARD_BG.img;
  return `<span class="field-label">Sariling background</span>
    ${CARD_BG.img ? `<div class="own-bg">
        <button class="theme-chip ${on ? 'on' : ''}" onclick="setCard('theme','own')" aria-pressed="${!!on}"><span class="theme-sw own-sw" style="background-image:url('${CARD_BG.url}')"></span>Picture mo</button>
        <label class="btn btn--ghost btn--sm">${ic('upload')}Palitan<input type="file" accept="image/*" hidden onchange="cardUploadBg(this)"></label>
        <button class="btn btn--ghost btn--sm" onclick="cardRemoveBg()">${ic('trash')}Alisin</button></div>
      ${on ? `<label class="toggle" style="margin-top:10px"><input type="checkbox" ${BIDA.card.ownPanel === '0' ? '' : 'checked'} onchange="setCard('ownPanel', this.checked ? '1' : '0')">Lagyan ng box ang text para mabasa</label>` : ''}`
    : `<label class="btn btn--ghost btn--sm own-up">${ic('upload')}Mag-upload ng picture<input type="file" accept="image/*" hidden onchange="cardUploadBg(this)"></label>
       <p class="muted" style="margin-top:6px">Sa device mo lang naka-save ang picture. Hindi namin ina-upload.</p>`}`;
}
function cardDefaults() {
  const e = BIDA.event, et = eventType();
  const theme = (CARD_THEMES.find(t => t.for.includes(e.type)) || CARD_THEMES[2]).id;
  return { theme, size: 'post', ownPanel: '1', intro: 'Inaanyayahan ka sa', title: e.name || et.label, sub: '', date: e.date || '', time: e.start || '', venue: '', msg: 'Kain, laro at kwentuhan — kumpleto ang saya kapag nandiyan ka!', rsvp: '' };
}
function ensureCard() {
  const d = cardDefaults(), c = BIDA.card && typeof BIDA.card === 'object' ? BIDA.card : {};
  const out = {};
  for (const k of Object.keys(d)) out[k] = typeof c[k] === 'string' ? c[k].slice(0, k === 'msg' ? 220 : 90) : d[k];
  if (out.theme !== 'own' && !CARD_THEMES.some(t => t.id === out.theme)) out.theme = d.theme;
  if (!CARD_SIZES[out.size]) out.size = 'post';
  BIDA.card = out;
}
function fmtCardDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00'); if (isNaN(dt)) return d;
  try { return dt.toLocaleDateString('fil-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  catch (e) { return dt.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
}
function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean), lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}
// Paints the whole card. Text is measured so long titles shrink to fit instead of overflowing.
function drawCard(canvas) {
  const c = BIDA.card, th = cardTheme(), [W, H] = CARD_SIZES[c.size];
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  ctx.save(); th.deco(ctx, W, H); ctx.restore();
  const story = c.size === 'story', px = th.panel ? 150 : 120, maxW = W - px * 2;
  // each theme keeps its decorations visible: text only goes inside its safe area
  const [aTop, aBot] = th.area || [.2, .86], pad = th.panel ? 44 : 0;
  const top = H * aTop + pad + (story ? H * .03 : 0), bottom = H * aBot - pad - (story ? H * .03 : 0);
  const fg = th.panel ? th.panelFg : th.fg, dateCol = th.panel ? '#E2367A' : th.accent;
  const when = [fmtCardDate(c.date), c.time ? fmtTime(toMin(c.time)) : ''].filter(Boolean).join(' · ');
  // build the text blocks at scale s; shrink everything until it fits the safe area
  const build = s => {
    const blocks = [], z = n => Math.round(n * s * (story ? 1.1 : 1));
    const add = (txt, font, color, gap, maxLines = 4) => { if (!txt) return; ctx.font = font; const lines = wrapLines(ctx, txt, maxW).slice(0, maxLines); blocks.push({ lines, font, color, gap: gap * s, lh: parseInt(font.match(/(\d+)px/)[1], 10) * 1.12 }); };
    add(c.intro, `700 ${z(40)}px ${BODY_FONT}`, fg, 0);
    let ts = z(124); ctx.font = `800 ${ts}px ${CARD_FONT}`;
    while (ts > 56 && wrapLines(ctx, c.title || ' ', maxW).length > 3) { ts -= 6; ctx.font = `800 ${ts}px ${CARD_FONT}`; }
    add(c.title, `800 ${ts}px ${CARD_FONT}`, fg, 16, 3);
    add(c.sub, `700 ${z(42)}px ${BODY_FONT}`, fg, 12, 2);
    add(when, `800 ${z(44)}px ${CARD_FONT}`, dateCol, 34, 2);
    add(c.venue, `700 ${z(38)}px ${BODY_FONT}`, fg, 10, 3);
    add(c.msg, `italic 600 ${z(34)}px ${BODY_FONT}`, fg, 32, 4);
    add(c.rsvp ? 'RSVP: ' + c.rsvp : '', `800 ${z(34)}px ${BODY_FONT}`, fg, 32, 2);
    return { blocks, total: blocks.reduce((sum, b) => sum + b.gap + b.lines.length * b.lh, 0) };
  };
  let s = 1, L = build(s);
  while (L.total > bottom - top && s > .62) { s -= .04; L = build(s); }
  const { blocks, total } = L;
  let y = top + Math.max(0, (bottom - top - total) / 2);
  if (th.panel) {   // a solid card behind the text keeps it readable on busy themes
    ctx.fillStyle = th.panel; roundRect(ctx, px - pad, y - pad, maxW + pad * 2, total + pad * 2, 36); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#1E1A16'; ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const b of blocks) {
    y += b.gap; ctx.font = b.font; ctx.fillStyle = b.color;
    for (const l of b.lines) { ctx.fillText(l, W / 2, y); y += b.lh; }
  }
  ctx.font = `800 24px ${CARD_FONT}`; ctx.fillStyle = th.panel ? th.fg : fg; ctx.globalAlpha = .55; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('ginawa sa Bida-Vibe', W - 40, H - 34); ctx.globalAlpha = 1;
}
let cardRAF = 0, cardFontsReady = false;
function redrawCard() {
  cancelAnimationFrame(cardRAF);
  cardRAF = requestAnimationFrame(() => { const cv = $('#card-canvas'); if (cv) drawCard(cv); });
}
function renderCard() {
  ensureCard();
  const c = BIDA.card, type = BIDA.event.type;
  const fit = CARD_THEMES.filter(t => t.for.includes(type)), rest = CARD_THEMES.filter(t => !t.for.includes(type));
  const chip = t => `<button class="theme-chip ${t.id === c.theme ? 'on' : ''}" onclick="setCard('theme','${t.id}')" aria-pressed="${t.id === c.theme}">
      <span class="theme-sw" style="background:${t.bg};color:${t.accent}"><span style="background:${t.accent}"></span></span>${esc(t.name)}</button>`;
  const field = (k, label, ph, type = 'text') => `<div class="field"><label for="cd-${k}">${label}</label>${type === 'area'
    ? `<textarea class="input" id="cd-${k}" rows="3" maxlength="220" placeholder="${esc(ph)}" oninput="setCard('${k}',this.value)">${esc(c[k])}</textarea>`
    : `<input class="input" id="cd-${k}" type="${type}" maxlength="90" placeholder="${esc(ph)}" value="${esc(c[k])}" oninput="setCard('${k}',this.value)">`}</div>`;
  $('#panel-card').innerHTML = `
    <div class="panel-head"><div><h2>Invitation card</h2>
      <p>Lahat ng details ng event sa isang card. Pili ng theme, tapos i-download o i-share.</p></div></div>
    <div class="card-layout">
      <div class="card-preview-wrap">
        <canvas id="card-canvas" class="card-canvas card-canvas--${c.size}" aria-label="Preview ng invitation card"></canvas>
        <div class="card-actions">
          <button class="btn btn--magenta" onclick="downloadCard()">${ic('upload')}I-download</button>
          ${navigator.share ? `<button class="btn btn--ink" onclick="shareCard()">${ic('arrow')}I-share</button>` : ''}
        </div>
      </div>
      <div class="card-form">
        <span class="field-label">Theme — bagay sa ${esc(eventType().label)}</span>
        <div class="theme-chips">${fit.map(chip).join('')}</div>
        <details class="more-themes" ${CARD_UI.more ? 'open' : ''} ontoggle="CARD_UI_more(this.open)"><summary>Iba pang themes</summary><div class="theme-chips">${rest.map(chip).join('')}</div></details>
        <div id="own-bg-wrap" style="margin-top:14px">${cardOwnHTML()}</div>
        <div class="seg-ctrl seg-ctrl--light" role="group" aria-label="Laki ng card" style="margin:14px 0 4px">
          ${Object.entries(CARD_SIZES).map(([k, v]) => `<button class="${c.size === k ? 'on' : ''}" onclick="setCard('size','${k}')">${v[2]}</button>`).join('')}</div>
        <div class="stack" style="margin-top:12px">
          ${field('intro', 'Pambungad', 'Inaanyayahan ka sa')}
          ${field('title', 'Pangalan ng event', eventType().label)}
          ${field('sub', 'Mula kay / ng', 'hal. Pamilya Santos')}
          <div class="grid-2">${field('date', 'Petsa', '', 'date')}${field('time', 'Oras', '', 'time')}</div>
          ${field('venue', 'Saan', 'hal. Bahay ni Lola, Brgy. San Jose, Batangas')}
          ${field('msg', 'Mensahe', 'Maikling paanyaya', 'area')}
          ${field('rsvp', 'RSVP / contact', 'hal. Tita Bing · 0917 123 4567')}
          <button class="btn btn--ghost btn--sm" onclick="resetCard()">Kunin ulit ang detalye mula sa Plan</button>
        </div>
      </div>
    </div>`;
  const draw = () => { const cv = $('#card-canvas'); if (cv) drawCard(cv); };
  draw();
  if (!CARD_BG.loaded) loadCardBg().then(() => { if (BIDA.tab === 'card' && CARD_BG.img) renderCard(); });
  if (!cardFontsReady && document.fonts) Promise.all([document.fonts.load(`800 80px "Bricolage Grotesque"`), document.fonts.load(`700 40px "Nunito"`), document.fonts.load(`italic 600 40px "Nunito"`)])
    .then(() => { cardFontsReady = true; draw(); }).catch(() => { });
}
function setCard(k, v) {
  ensureCard(); BIDA.card[k] = String(v).slice(0, k === 'msg' ? 220 : 90); saveState();
  if (k === 'theme') {     // update the chips in place so open/closed sections stay as they are
    $$('.theme-chip').forEach(b => { const on = b.getAttribute('onclick') === `setCard('theme','${v}')`; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const w = $('#own-bg-wrap'); if (w) w.innerHTML = cardOwnHTML();
    redrawCard();
  } else if (k === 'size') renderCard(); else redrawCard();
}
async function resetCard() {
  if (!await askConfirm('Palitan ng detalye mula sa Plan ang pangalan, petsa at oras?', 'Palitan')) return;
  const d = cardDefaults(); Object.assign(BIDA.card, { title: d.title, date: d.date, time: d.time }); saveState(); renderCard();
}
function cardBlob() {
  const cv = document.createElement('canvas'); drawCard(cv);
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
const cardFileName = () => (String(BIDA.card.title || 'invitation').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'invitation') + '-bida-vibe.png';
async function downloadCard() {
  const blob = await cardBlob(); if (!blob) { toast('Hindi ma-save ang card'); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = cardFileName();
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Na-download ang card!');
}
async function shareCard() {
  const blob = await cardBlob(); if (!blob) return;
  const file = new File([blob], cardFileName(), { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: BIDA.card.title });
    else downloadCard();
  } catch (e) { if (e.name !== 'AbortError') downloadCard(); }
}

/* ============================================================
   GAME SCENES (animated SVG how-tos, SMIL — no libraries)
   ============================================================ */
const SKIN = ['#E8B48A', '#C98B5F', '#A86F48', '#F0C49C'];
const SHIRT = ['#E2367A', '#0FA3A3', '#F6B21B', '#E4452B', '#3E9B4F', '#FFFDF8'];
const INK = '#1E1A16';
function person(i, opts = {}) {
  const s = SKIN[i % 4], c = opts.c || SHIRT[i % 6], arms = opts.arms || 'down';
  const armPath = arms === 'up' ? 'M-10 -20L-17 -36M10 -20L17 -36' : arms === 'out' ? 'M-10 -18L-22 -22M10 -18L22 -22' : 'M-10 -18L-14 -6M10 -18L14 -6';
  return `<g>
    <path d="M-5 0V-6M5 0V-6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path class="arms" d="${armPath}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <rect x="-10" y="-26" width="20" height="22" rx="8" fill="${c}" stroke="${INK}" stroke-width="2"/>
    <circle cx="0" cy="-34" r="8.5" fill="${s}" stroke="${INK}" stroke-width="2"/>
    <path d="M-8 -37a8 8 0 0 1 16 0" fill="${INK}"/>
    ${opts.extra || ''}</g>`;
}
function bubble(x, y, text, cls = '', w) {
  w = w || Math.max(46, text.length * 7.6 + 18);
  return `<g transform="translate(${x} ${y})" class="${cls}">
    <rect x="${-w / 2}" y="-14" width="${w}" height="26" rx="13" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <path d="M-4 12l2 7 6-7" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="-5" y="9" width="10" height="4" fill="#fff"/>
    <text x="0" y="4" text-anchor="middle" font-size="12" fill="${INK}">${esc(text)}</text></g>`;
}
const vis = (vals, dur, kt) => `<animate attributeName="opacity" values="${vals}" ${kt ? `keyTimes="${kt}"` : ''} dur="${dur}s" repeatCount="indefinite" calcMode="discrete"/>`;
const note = (x, y, d) => `<g transform="translate(${x} ${y})"><g><path d="M0 0v-14l9-3v14" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="-3" cy="0" r="3.5" fill="${INK}"/><circle cx="6" cy="-3" r="3.5" fill="${INK}"/>
  <animateTransform attributeName="transform" type="translate" values="0 6;0 -10" dur="1.6s" begin="${d}s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0;1;0" dur="1.6s" begin="${d}s" repeatCount="indefinite"/></g></g>`;
const ground = `<path d="M0 150H320" stroke="${INK}" stroke-width="2"/>`;

const SCENES = {
  chairs() {
    const chairs = [120, 160, 200].map(x => `<g transform="translate(${x} 128)"><rect x="-12" y="-4" width="24" height="6" rx="2" fill="#F6B21B" stroke="${INK}" stroke-width="2"/><path d="M-9 2v20M9 2v20M-12 -4v-18" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></g>`).join('');
    const path = 'M160 104 a110 34 0 1 0 0.1 0';
    const ppl = [0, 1, 2, 3].map(i => `<g>${person(i)}<animateMotion path="${path}" dur="7s" begin="${-i * 1.75}s" repeatCount="indefinite"/></g>`).join('');
    return `${ground}${chairs}${ppl}${note(40, 50, 0)}${note(270, 46, .8)}
      <g opacity="0">${bubble(160, 30, 'STOP! Upo na!')}${vis('0;1;0', 7, '0;.82;.97')}</g>`;
  },
  paper() {
    return `${ground}
      <rect x="100" y="146" width="120" height="8" fill="#fff" stroke="${INK}" stroke-width="2">
        <animate attributeName="width" values="120;120;70;70;40;40" keyTimes="0;.3;.33;.63;.66;1" dur="8s" repeatCount="indefinite" calcMode="discrete"/>
        <animate attributeName="x" values="100;100;125;125;140;140" keyTimes="0;.3;.33;.63;.66;1" dur="8s" repeatCount="indefinite" calcMode="discrete"/></rect>
      <g><g transform="translate(130 146)">${person(0)}</g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0;14 0;14 -4;14 0;22 0;22 -22;22 -22" keyTimes="0;.1;.3;.36;.5;.63;.68;.75;1" dur="8s" repeatCount="indefinite"/></g>
      <g><g transform="translate(190 146)">${person(1)}</g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0;-14 0;-14 -4;-14 0;-24 0;-24 0" keyTimes="0;.15;.3;.36;.55;.63;.68;1" dur="8s" repeatCount="indefinite"/></g>
      ${note(60, 70, 0)}${note(260, 60, .6)}
      <g opacity="0">${bubble(160, 40, 'Tiklop!')}${vis('0;1;0;1;0', 8, '0;.3;.4;.63;.73')}</g>`;
  },
  henyo() {
    return `${ground}
      <g transform="translate(110 148)">${person(0, { extra: `<rect x="-22" y="-62" width="44" height="16" rx="3" fill="#fff" stroke="${INK}" stroke-width="2"/><text x="0" y="-50" text-anchor="middle" font-size="11" fill="${INK}">ADOBO</text>` })}</g>
      <g transform="translate(210 148)">${person(1)}</g>
      <g opacity="0">${bubble(80, 60, 'Pagkain ba?')}${vis('1;0', 6, '0;.25')}</g>
      <g opacity="0">${bubble(240, 60, 'Oo!')}${vis('0;1;0', 6, '0;.15;.33')}</g>
      <g opacity="0">${bubble(80, 60, 'Ulam?')}${vis('0;1;0', 6, '0;.35;.55')}</g>
      <g opacity="0">${bubble(240, 60, 'Pwede!')}${vis('0;1;0', 6, '0;.45;.65')}</g>
      <g opacity="0">${bubble(80, 60, 'Adobo!')}${vis('0;1;0', 6, '0;.7;.95')}</g>
      <g opacity="0">${bubble(240, 60, 'TAMA!')}${vis('0;1;0', 6, '0;.78;.97')}</g>
      <g transform="translate(160 40)"><circle r="16" fill="#fff" stroke="${INK}" stroke-width="2"/>
        <circle r="10" fill="none" stroke="#E4452B" stroke-width="5" stroke-dasharray="63" transform="rotate(-90)">
          <animate attributeName="stroke-dashoffset" values="0;63" dur="6s" repeatCount="indefinite"/></circle></g>`;
  },
  bringme() {
    return `${ground}
      <g transform="translate(262 148)">${person(2, { arms: 'out' })}</g>
      ${bubble(236, 48, 'Bring me… tsinelas!', '', 136)}
      <rect x="226" y="120" width="46" height="8" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <g><g transform="translate(40 148)">${person(0)}
        <g transform="translate(14 -14)"><ellipse rx="9" ry="4" fill="#E4452B" stroke="${INK}" stroke-width="2"/>${vis('0;1;1', 5, '0;.35;1')}</g></g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 0;-10 0;0 0;180 0;180 0" keyTimes="0;.05;.35;.4;.8;1" dur="5s" repeatCount="indefinite"/></g>
      <g><g transform="translate(20 148)">${person(3)}</g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 0;130 0;130 0" keyTimes="0;.4;.85;1" dur="5s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(160, 90, '+1 puntos!')}${vis('0;1;0', 5, '0;.82;1')}</g>`;
  },
  freeze() {
    const kt = '0;.08;.16;.24;.32;.4;.48;.56;1';
    const bob = '0 0;0 -7;0 0;0 -7;0 0;0 -7;0 0;0 0;0 0';
    const ppl = [70, 130, 190, 250].map((x, i) => `<g><g transform="translate(${x} 148)">${person(i, { arms: i % 2 ? 'up' : 'out' })}</g>
      <animateTransform attributeName="transform" type="translate" values="${i === 2 ? bob.replace(/0 0;0 0$/, '3 0;-3 0') : bob}" keyTimes="${kt}" dur="5s" begin="${i * .06}s" repeatCount="indefinite"/></g>`).join('');
    return `${ground}${ppl}${note(30, 60, 0)}${note(290, 56, .5)}
      <g opacity="0">${bubble(160, 34, 'STOP! Freeze!')}${vis('0;1;0', 5, '0;.56;.98')}</g>
      <g opacity="0" transform="translate(190 92)"><path d="M-8 -8l16 16M8 -8l-16 16" stroke="#E4452B" stroke-width="5" stroke-linecap="round"/>${vis('0;1;0', 5, '0;.8;.98')}</g>`;
  },
  relay() {
    const runner = (lane, i, dur) => `<g><g transform="translate(30 ${lane})">${person(i, {
      extra: `<path d="M8 -32h18" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/><circle cx="26" cy="-36" r="5" fill="#3E9B4F" stroke="${INK}" stroke-width="2"/>` })}</g>
      <animateTransform attributeName="transform" type="translate" values="0 0;230 0;230 0" keyTimes="0;.85;1" dur="${dur}s" repeatCount="indefinite"/></g>`;
    return `<path d="M0 110H320M0 150H320" stroke="${INK}" stroke-width="2"/>
      <path d="M290 150V70" stroke="${INK}" stroke-width="2.5"/><path d="M290 70h22l-6 8 6 8h-22" fill="#E4452B" stroke="${INK}" stroke-width="2"/>
      <path d="M20 112V150" stroke="${INK}" stroke-width="2" stroke-dasharray="4 4"/>
      ${runner(108, 1, 6)}${runner(148, 4, 4.6)}
      <g opacity="0">${bubble(150, 40, 'Dahan-dahan…')}${vis('0;1;0', 6, '0;.2;.6')}</g>`;
  },
  whisper() {
    const xs = [50, 120, 190, 260];
    const ppl = xs.map((x, i) => `<g transform="translate(${x} 148)">${person(i)}</g>`).join('');
    const hops = xs.slice(0, 3).map((x, i) => `<g opacity="0">${bubble(x + 35, 84, 'psst…', '', 52)}${vis('0;1;0', 6, `0;${(i * .22).toFixed(2)};${(i * .22 + .2).toFixed(2)}`)}</g>`).join('');
    return `${ground}${ppl}${hops}
      <g opacity="0">${bubble(160, 34, '“Pitong puting pating”')}${vis('1;0', 6, '0;.25')}</g>
      <g opacity="0">${bubble(230, 40, 'Pitong… pusit?!', '', 112)}${vis('0;1;0', 6, '0;.7;.98')}</g>`;
  },
  charades() {
    return `${ground}
      <g transform="translate(110 148)"><g>${person(0, { arms: 'up' })}
        <animateTransform attributeName="transform" type="rotate" values="0;-8;8;0" dur="1.2s" repeatCount="indefinite"/></g></g>
      ${[200, 240, 280].map((x, i) => `<g transform="translate(${x} 148)">${person(i + 1)}</g>`).join('')}
      <g opacity="0">${bubble(220, 74, 'Manok?')}${vis('0;1;0', 6, '0;.1;.35')}</g>
      <g opacity="0">${bubble(260, 74, 'Eroplano?')}${vis('0;1;0', 6, '0;.38;.62')}</g>
      <g opacity="0">${bubble(240, 74, 'DARNA!')}${vis('0;1;0', 6, '0;.7;.98')}</g>
      <rect x="20" y="20" width="120" height="10" rx="5" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <rect x="22" y="22" width="116" height="6" rx="3" fill="#F6B21B"><animate attributeName="width" values="116;0" dur="6s" repeatCount="indefinite"/></rect>`;
  },
  hephep() {
    const xs = [50, 105, 215, 270];
    return `${ground}
      ${xs.map((x, i) => `<g transform="translate(${x} 148)">${person(i + 1, { arms: 'up' })}</g>`).join('')}
      <g transform="translate(160 148)">${person(0, { extra: `<path d="M10 -18L28 -24" stroke="${INK}" stroke-width="3" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="0;0;-150 0 -18;-150 0 -18" keyTimes="0;.5;.52;1" dur="3s" repeatCount="indefinite" calcMode="discrete"/></path>` })}</g>
      <g opacity="0">${bubble(205, 70, 'Hep hep!')}${vis('0;1;0', 3, '0;.05;.45')}</g>
      <g opacity="0">${bubble(110, 70, 'Hooray!')}${vis('0;1;0', 3, '0;.55;.95')}</g>`;
  },
  line() {
    return `${ground}
      <g transform="translate(26 120)">${person(0)}</g><g transform="translate(26 160)" opacity=".001"></g>
      <path d="M44 112H44" stroke="#E2367A" stroke-width="8" stroke-dasharray="14 5" stroke-linecap="butt">
        <animate attributeName="d" values="M44 112H44;M44 112H300;M44 112H300" keyTimes="0;.8;1" dur="6s" repeatCount="indefinite"/></path>
      <g transform="translate(26 158)" ><g transform="translate(0 -10)">${person(1)}</g></g>
      <path d="M44 140H44" stroke="#0FA3A3" stroke-width="8" stroke-dasharray="10 6">
        <animate attributeName="d" values="M44 140H44;M44 140H250;M44 140H250" keyTimes="0;.8;1" dur="6s" repeatCount="indefinite"/></path>
      <g opacity="0">${bubble(200, 40, 'Panalo ang pink!')}${vis('0;1;0', 6, '0;.82;.98')}</g>`;
  },
  balloon() {
    return `${ground}
      <g transform="translate(130 148)">${person(0)}</g>
      <g transform="translate(152 136)"><path d="M-17 10q8 -2 10 -8" fill="none" stroke="${INK}" stroke-width="1.5"/>
        <g><circle r="11" fill="#E2367A" stroke="${INK}" stroke-width="2"/>
          <animateTransform attributeName="transform" type="scale" values="1;1;0;0" keyTimes="0;.55;.57;1" dur="4s" repeatCount="indefinite" calcMode="discrete"/></g>
        <g opacity="0"><path d="M0 -18L4 -6 16 -10 8 0 18 8 4 6 0 18 -4 6 -18 8 -8 0 -16 -10 -4 -6Z" fill="#F6B21B" stroke="${INK}" stroke-width="2"/>${vis('0;1;0', 4, '0;.56;.85')}</g></g>
      <g><g transform="translate(210 148)">${person(1, { arms: 'out' })}</g>
        <animateTransform attributeName="transform" type="translate" values="0 0;-30 0;-34 -8;-34 0;0 0" keyTimes="0;.4;.5;.56;1" dur="4s" repeatCount="indefinite"/></g>
      <g transform="translate(260 140)"><path d="M-8 10l6 -4" stroke="${INK}" stroke-width="1.5"/><circle r="10" fill="#0FA3A3" stroke="${INK}" stroke-width="2"/></g>
      <g opacity="0">${bubble(160, 50, 'POP!')}${vis('0;1;0', 4, '0;.56;.85')}</g>`;
  },
  jakenpoy() {
    const rock = `<circle r="18" fill="#F0C49C" stroke="${INK}" stroke-width="2.5"/>`;
    const paper = `<rect x="-20" y="-22" width="40" height="44" rx="10" fill="#F0C49C" stroke="${INK}" stroke-width="2.5"/><path d="M-10 -22v-6M0 -22v-8M10 -22v-6" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
    const shake = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -18;0 0;0 -18;0 0;0 -18;0 0;0 0" keyTimes="0;.08;.16;.24;.32;.4;.48;1" dur="5s" repeatCount="indefinite"/>`;
    return `${ground}
      <g transform="translate(100 100)"><g>${rock}${vis('1;0', 5, '0;.48')}</g><g opacity="0">${paper}${vis('0;1', 5, '0;.48')}</g>${shake}</g>
      <g transform="translate(220 100)"><g>${rock}</g>${shake}</g>
      <g opacity="0">${bubble(160, 40, 'Bato… bato… PIK!', '', 130)}${vis('1;0', 5, '0;.55')}</g>
      <g opacity="0" transform="translate(100 56)"><path d="M-16 8l4 -16 8 9 4 -12 4 12 8 -9 4 16z" fill="#F6B21B" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${vis('0;1;0', 5, '0;.6;.98')}</g>`;
  },
  feud() {
    const rows = ['Lechon', 'Hamon', 'Spaghetti', 'Leche flan', 'Queso de bola'];
    return `<rect x="70" y="18" width="180" height="138" rx="12" fill="${INK}"/>
      ${rows.map((r, i) => {
        const y = 28 + i * 25, t0 = (.12 + i * .15).toFixed(2), t1 = (+t0 + .02).toFixed(2);
        return `<rect x="82" y="${y}" width="156" height="20" rx="5" fill="#0FA3A3" stroke="#FFF6E5" stroke-width="1.5">
          <animate attributeName="fill" values="#0FA3A3;#F6B21B" keyTimes="0;${t0}" dur="6s" repeatCount="indefinite" calcMode="discrete"/></rect>
          <text x="92" y="${y + 14}" font-size="11" fill="${INK}" opacity="0">${i + 1}. ${r}${vis('0;1', 6, `0;${t1}`)}</text>
          <text x="228" y="${y + 14}" font-size="11" text-anchor="end" fill="${INK}" opacity="0">${[38, 24, 17, 12, 9][i]}${vis('0;1', 6, `0;${t1}`)}</text>`;
      }).join('')}
      <g transform="translate(36 120)"><circle r="16" fill="#E4452B" stroke="${INK}" stroke-width="2.5"><animate attributeName="r" values="16;13;16" dur="1.2s" repeatCount="indefinite"/></circle></g>
      <g transform="translate(284 120)"><circle r="16" fill="#E2367A" stroke="${INK}" stroke-width="2.5"/></g>`;
  },
  pass() {
    const N = 6, pos = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2; return [160 + Math.cos(a) * 100, 112 + Math.sin(a) * 30];
    });
    const ppl = pos.slice().sort((a, b) => a[1] - b[1]).map((p, i) => `<g transform="translate(${p[0].toFixed(0)} ${(p[1] + 30).toFixed(0)})">${person(i)}</g>`).join('');
    return `${ppl}
      <g><circle r="7" fill="#E4452B" stroke="${INK}" stroke-width="2"/>
        <animateMotion path="M160 92 a100 30 0 1 1 -0.1 0" dur="7s" repeatCount="indefinite" keyPoints="0;.85;.85" keyTimes="0;.8;1" calcMode="linear"/></g>
      ${note(20, 40, 0)}${note(300, 40, .7)}
      <g opacity="0">${bubble(160, 26, 'STOP! Sino may hawak?', '', 160)}${vis('0;1;0', 7, '0;.8;.98')}</g>`;
  },
  cupstack() {
    // three tied players walk to a table, cups appear one by one as a pyramid
    const cup = (x, y, t) => `<g transform="translate(${x} ${y})" opacity="0"><path d="M-7 0h14l-2 -14h-10z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${vis('0;1', 6, `0;${t}`)}</g>`;
    const rows = [[4, 0], [3, 1], [2, 2], [1, 3]]; let cups = '', k = 0;
    rows.forEach(([n, r]) => { for (let i = 0; i < n; i++) cups += cup(230 + (i - (n - 1) / 2) * 16, 116 - r * 15, (.35 + (k++) * .055).toFixed(2)); });
    return `${ground}<rect x="190" y="118" width="80" height="6" fill="#F6B21B" stroke="${INK}" stroke-width="2"/><path d="M196 124v26M264 124v26" stroke="${INK}" stroke-width="2.5"/>
      ${cups}
      <g><g transform="translate(40 148)">${person(0)}</g><g transform="translate(62 148)">${person(1)}</g><g transform="translate(84 148)">${person(2)}</g>
        <path d="M30 128h64" stroke="#E2367A" stroke-width="4" stroke-dasharray="6 3"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;80 0;80 0;0 0" keyTimes="0;.3;.92;1" dur="6s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(230, 40, '4-3-2-1!')}${vis('0;1;0', 6, '0;.9;.99')}</g>`;
  },
  tug() {
    return `${ground}
      <g><g transform="translate(110 148)">${person(0, { arms: 'out' })}</g>
        <animateTransform attributeName="transform" type="translate" values="0 0;-6 0;0 0;-6 0;-14 0" keyTimes="0;.25;.5;.75;1" dur="4s" repeatCount="indefinite"/></g>
      <g><g transform="translate(210 148)">${person(1, { arms: 'out' })}</g>
        <animateTransform attributeName="transform" type="translate" values="0 0;6 0;0 0;6 0;14 0" keyTimes="0;.25;.5;.75;1" dur="4s" repeatCount="indefinite"/></g>
      <rect x="132" y="122" width="56" height="10" fill="#fff" stroke="${INK}" stroke-width="2"><animate attributeName="opacity" values="1;1;0" keyTimes="0;.8;.81" dur="4s" repeatCount="indefinite"/></rect>
      <g opacity="0"><rect x="126" y="122" width="24" height="10" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M150 122l-4 5 4 5" fill="none" stroke="${INK}" stroke-width="2"/>${vis('0;1;0', 4, '0;.81;.99')}</g>
      <g opacity="0">${bubble(160, 60, 'Rrrip!')}${vis('0;1;0', 4, '0;.8;.97')}</g>`;
  },
  cupgrab() {
    return `${ground}
      <g transform="translate(115 148)"><g>${person(0, { arms: 'up' })}${vis('1;0;1', 5, '0;.6;.98')}</g><g opacity="0">${person(0, { arms: 'out' })}${vis('0;1;0', 5, '0;.6;.98')}</g></g>
      <g transform="translate(205 148)">${person(1, { arms: 'up' })}</g>
      <g transform="translate(160 146)"><path d="M-8 0h16l-2 -16h-12z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <animateTransform attributeName="transform" type="translate" values="160 146;160 146;138 126;138 126" keyTimes="0;.6;.66;1" dur="5s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(160, 40, 'Ulo! Balikat!')}${vis('1;0', 5, '0;.3')}</g>
      <g opacity="0">${bubble(160, 40, 'Tuhod!')}${vis('0;1;0', 5, '0;.32;.58')}</g>
      <g opacity="0">${bubble(160, 40, 'CUP!')}${vis('0;1;0', 5, '0;.58;.98')}</g>`;
  },
  coin() {
    const ppl = [60, 110, 210, 260].map((x, i) => `<g transform="translate(${x} 148)"><g>${person(i + 1, { arms: i % 2 ? 'up' : 'down' })}
      ${i % 2 ? '' : `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 14;0 14" keyTimes="0;.6;.66;1" dur="5s" repeatCount="indefinite"/>`}</g></g>`).join('');
    return `${ground}${ppl}<g transform="translate(160 148)">${person(0, { arms: 'up' })}</g>
      <g transform="translate(176 100)"><ellipse rx="9" ry="9" fill="#F6B21B" stroke="${INK}" stroke-width="2"><animate attributeName="rx" values="9;1;9;1;9;1;9" dur="1s" repeatCount="indefinite"/></ellipse>
        <animateTransform attributeName="transform" type="translate" values="176 100;176 30;176 100;176 100" keyTimes="0;.25;.5;1" dur="5s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(160, 40, 'HEADS!')}${vis('0;1;0', 5, '0;.55;.95')}</g>`;
  },
  dice() {
    const die = (x, pips) => `<g transform="translate(${x} 96)"><rect x="-16" y="-16" width="32" height="32" rx="7" fill="#fff" stroke="${INK}" stroke-width="2.5"/>${pips.map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3.5" fill="${INK}"/>`).join('')}
      <animateTransform attributeName="transform" type="rotate" values="0;360;360" keyTimes="0;.3;1" dur="5s" additive="sum" repeatCount="indefinite"/></g>`;
    return `<rect x="40" y="130" width="240" height="10" fill="#F6B21B" stroke="${INK}" stroke-width="2"/>
      ${die(130, [[-8, -8], [0, 0], [8, 8]])}${die(180, [[-8, -8], [8, -8], [-8, 8], [8, 8]])}
      <g transform="translate(250 112)"><rect x="-24" y="-30" width="44" height="54" fill="#fff" stroke="${INK}" stroke-width="2"/>
        <text x="-2" y="-12" text-anchor="middle" font-size="10" fill="${INK}">1 2 3</text><text x="-2" y="2" text-anchor="middle" font-size="10" fill="${INK}" opacity="0">4 5 6${vis('0;1', 5, '0;.5')}</text></g>
      <g opacity="0">${bubble(150, 40, 'SEVEN! Akin ang ballpen!', '', 170)}${vis('0;1;0', 5, '0;.32;.9')}</g>`;
  },
  toss() {
    let grid = ''; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) grid += `<rect x="${170 + c * 34}" y="${82 + r * 22}" width="34" height="22" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
    const mark = (c, r, t, ch, col) => `<text x="${187 + c * 34}" y="${98 + r * 22}" text-anchor="middle" font-size="15" fill="${col}" opacity="0">${ch}${vis('0;1', 6, `0;${t}`)}</text>`;
    return `${ground}<g transform="translate(60 148)">${person(0, { arms: 'out' })}</g>${grid}
      ${mark(0, 0, .2, 'X', '#E2367A')}${mark(1, 1, .45, 'X', '#E2367A')}${mark(2, 0, .35, 'O', '#0FA3A3')}${mark(2, 2, .7, 'X', '#E2367A')}
      <g><rect x="-6" y="-5" width="12" height="10" rx="3" fill="#E4452B" stroke="${INK}" stroke-width="1.5"/>
        <animateMotion path="M80 112 Q140 30 238 136" dur="2s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(150, 30, 'Tatlo sa linya!', '', 120)}${vis('0;1;0', 6, '0;.78;.98')}</g>`;
  },
  hoops() {
    const hoop = x => `<ellipse cx="${x}" cy="96" rx="15" ry="24" fill="none" stroke="#E2367A" stroke-width="4"/>`;
    return `${ground}${[120, 180, 240].map((x, i) => `<g transform="translate(${x + 18} 148)">${person(i + 1, { arms: 'out' })}</g>${hoop(x)}`).join('')}
      <g transform="translate(50 148)">${person(0, { arms: 'up' })}</g>
      <circle r="10" fill="#F6B21B" stroke="${INK}" stroke-width="2"><animateMotion path="M60 90 Q90 60 120 96 Q150 70 180 96 Q210 70 240 96 Q262 80 285 70" dur="4s" repeatCount="indefinite"/></circle>
      <g opacity="0">${bubble(160, 34, 'Lusot lahat!', '', 110)}${vis('0;1;0', 4, '0;.85;.99')}</g>`;
  },
  flatten() {
    return `${ground}<rect x="80" y="122" width="160" height="8" fill="#F6B21B" stroke="${INK}" stroke-width="2"/>
      <g transform="translate(120 148)">${person(0, { arms: 'out' })}</g><g transform="translate(200 148)">${person(1, { arms: 'out' })}</g>
      <g transform="translate(160 112)">
        <g><path d="M-10 -6l6 -6 8 4 6 -4 2 10 -6 6 -10 2z" fill="#fff" stroke="${INK}" stroke-width="2"/>${vis('1;0', 5, '0;.5')}</g>
        <g opacity="0"><rect x="-22" y="-4" width="44" height="6" fill="#fff" stroke="${INK}" stroke-width="2"/>${vis('0;1', 5, '0;.5')}</g></g>
      <g opacity="0">${bubble(160, 46, 'Kanan + kaliwa!', '', 120)}${vis('1;0', 5, '0;.45')}</g>
      <g opacity="0">${bubble(160, 46, 'Plantsado!')}${vis('0;1;0', 5, '0;.55;.98')}</g>`;
  },
  donut() {
    return `${ground}<path d="M60 40H260" stroke="${INK}" stroke-width="4"/><path d="M80 40V150M240 40V150" stroke="${INK}" stroke-width="3"/>
      <g transform="translate(150 148)">${person(0)}</g>
      <g><path d="M150 40V70" stroke="${INK}" stroke-width="1.5"/><circle cx="150" cy="80" r="9" fill="#E2367A" stroke="${INK}" stroke-width="2"/><circle cx="150" cy="80" r="3" fill="#FFF6E5"/>
        <animateTransform attributeName="transform" type="translate" values="0 -10;0 14;0 -10" dur="2.4s" repeatCount="indefinite"/></g>
      <path d="M150 40Q186 60 172 150" fill="none" stroke="${INK}" stroke-width="1.5"/>
      <g transform="translate(172 150)"><rect x="-6" y="-8" width="12" height="8" rx="3" fill="#E8B48A" stroke="${INK}" stroke-width="1.5">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -22;0 0" dur="2.4s" repeatCount="indefinite"/></rect></g>
      <g opacity="0">${bubble(230, 70, 'Konti na lang!', '', 110)}${vis('0;1;0', 2.4, '0;.4;.6')}</g>`;
  },
  mirror() {
    return `${ground}<rect x="210" y="70" width="40" height="60" rx="4" fill="#C9EEEC" stroke="${INK}" stroke-width="2.5"/><path d="M218 78l10 -4M222 92l14 -6" stroke="#fff" stroke-width="3"/>
      <g transform="translate(170 148)">${person(0, { arms: 'out' })}</g>
      <g transform="translate(90 148)"><path d="M-7 0V-26q0 -6 7 -6t7 6V0z" fill="#fff" stroke="${INK}" stroke-width="2"/><rect x="-3" y="-36" width="6" height="5" fill="${INK}"/></g>
      <g><path d="M150 118L124 96" stroke="#E4452B" stroke-width="3" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;-18 4;-6 -6;-30 10;-30 10" keyTimes="0;.25;.5;.75;1" dur="4s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(150, 40, 'Bawal lumingon!', '', 120)}${vis('1;0', 4, '0;.7')}</g>
      <g opacity="0">${bubble(150, 40, 'Pasok!')}${vis('0;1;0', 4, '0;.75;.98')}</g>`;
  },
  stick() {
    const ball = (x, y, c, t) => `<g opacity="0"><circle cx="${x}" cy="${y}" r="11" fill="${c}" stroke="${INK}" stroke-width="2"/><path d="M${x} ${y + 11}l-2 5h4z" fill="${c}" stroke="${INK}" stroke-width="1.5"/>${vis('0;1;1', 5, `0;${t};1`)}</g>`;
    return `${ground}<rect x="150" y="20" width="150" height="130" fill="#FFF6E5" stroke="${INK}" stroke-width="2"/>
      <g transform="translate(90 148)">${person(0, { arms: 'up' })}</g>
      ${ball(180, 50, '#E2367A', .15)}${ball(215, 70, '#0FA3A3', .3)}${ball(255, 48, '#F6B21B', .45)}${ball(195, 100, '#3E9B4F', .6)}${ball(245, 105, '#E4452B', .75)}
      <g opacity="0">${bubble(225, 136, 'Lima!')}${vis('0;1;0', 5, '0;.85;.99')}</g>`;
  },
  numbers() {
    let cells = '', n = [7, 3, 12, 5, 9, 1, 15, 4, 8, 2, 11, 6];
    n.forEach((v, i) => { const x = 170 + (i % 4) * 30, y = 44 + Math.floor(i / 4) * 30; cells += `<text x="${x}" y="${y}" text-anchor="middle" font-size="15" fill="${INK}">${v}</text>`; });
    return `${ground}<rect x="150" y="22" width="130" height="96" fill="#fff" stroke="${INK}" stroke-width="2.5"/>${cells}
      <circle cx="230" cy="69" r="12" fill="none" stroke="#E2367A" stroke-width="3" opacity="0">${vis('0;1;0', 5, '0;.55;.98')}</circle>
      <g><g transform="translate(40 148)">${person(0)}</g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;150 0;150 0;0 0" keyTimes="0;.2;.5;.8;1" dur="5s" repeatCount="indefinite"/></g>
      <g><g transform="translate(20 148)">${person(1)}</g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;120 0;120 0;0 0" keyTimes="0;.2;.55;.8;1" dur="5s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(80, 40, 'Numero 12!', '', 96)}${vis('1;0', 5, '0;.3')}</g>`;
  },
  duel() {
    return `${ground}
      <g><g transform="translate(120 148)">${person(0, { arms: 'out', extra: `<path d="M-10 -42q10 -12 20 0z" fill="#E2367A" stroke="${INK}" stroke-width="2"/>` })}</g>
        <animateTransform attributeName="transform" type="translate" values="0 0;10 0;-4 0;0 0" dur="2s" repeatCount="indefinite"/></g>
      <g><g transform="translate(200 148)">${person(1, { arms: 'out' })}</g>
        <animateTransform attributeName="transform" type="translate" values="0 0;-12 0;4 0;0 0" dur="2s" repeatCount="indefinite"/></g>
      <g transform="translate(200 106)"><g><path d="M-10 0q10 -12 20 0z" fill="#0FA3A3" stroke="${INK}" stroke-width="2"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 0;-60 -10;-60 -10" keyTimes="0;.6;.7;1" dur="4s" repeatCount="indefinite"/></g></g>
      <g opacity="0">${bubble(160, 40, 'Naagaw!')}${vis('0;1;0', 4, '0;.7;.98')}</g>`;
  },
  noodles() {
    // Two players, each with TWO pool noodles: one held upright with a cup on top, one to swing
    const noodle = (x1, y1, x2, y2, col) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col}" stroke-width="6" stroke-linecap="round"/>`;
    const cup = (x, y) => `<path d="M${x - 8} ${y}h16l-2.5 -15h-11z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    return `${ground}
      <g transform="translate(112 148)">${person(0, { arms: 'out' })}</g>
      <g transform="translate(208 148)">${person(1, { arms: 'out' })}</g>
      ${noodle(90, 140, 90, 72, '#3E9B4F')}
      <g>${cup(90, 72)}
        <animateTransform attributeName="transform" type="translate" values="0 0;0 0;-26 -14;-44 72;-44 72" keyTimes="0;.52;.6;.72;1" dur="4s" repeatCount="indefinite"/></g>
      ${noodle(134, 126, 152, 94, '#F6B21B')}
      ${noodle(230, 140, 230, 72, '#0FA3A3')}${cup(230, 72)}
      <g>${noodle(186, 126, 154, 80, '#E2367A')}
        <animateTransform attributeName="transform" type="rotate" values="0 186 126;0 186 126;-34 186 126;8 186 126;0 186 126" keyTimes="0;.35;.55;.7;1" dur="4s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(160, 34, 'Patumbahin ang cup!', '', 140)}${vis('1;0', 4, '0;.5')}</g>
      <g opacity="0">${bubble(160, 34, 'Out! Nahulog ang cup!', '', 150)}${vis('0;1;0', 4, '0;.62;.97')}</g>`;
  },
  flip() {
    let cups = '';
    [[60, 0], [100, 1], [140, 0], [180, 1], [220, 0], [260, 1]].forEach(([x, up], i) => {
      const t = (.2 + i * .1).toFixed(2), down = `M${x - 8} 150h16l-2 -14h-12z`, upp = `M${x - 6} 150h12l2 -14h-16z`;
      cups += `<path d="${up ? upp : down}" fill="#fff" stroke="${INK}" stroke-width="2"><animate attributeName="d" values="${up ? upp : down};${up ? down : upp}" keyTimes="0;${t}" dur="5s" repeatCount="indefinite" calcMode="discrete"/></path>`;
    });
    return `${ground}${cups}
      <g><g transform="translate(70 128)">${person(0)}</g><animateTransform attributeName="transform" type="translate" values="0 0;180 0;0 0" dur="5s" repeatCount="indefinite"/></g>
      <g opacity="0">${bubble(110, 40, 'UP!')}${vis('0;1;0', 5, '0;.1;.5')}</g>
      <g opacity="0">${bubble(210, 40, 'DOWN!')}${vis('0;1;0', 5, '0;.5;.95')}</g>`;
  }
};
const SCENE_BG = { chairs: '', paper: 'gold', henyo: 'magenta', bringme: 'leaf', freeze: 'gold', relay: 'leaf', whisper: 'magenta', charades: 'gold', hephep: '', line: 'chili', balloon: 'magenta', jakenpoy: 'gold', feud: '', pass: 'chili', cupstack: 'leaf', tug: 'gold', cupgrab: 'magenta', coin: '', dice: 'chili', toss: 'leaf', hoops: 'gold', flatten: 'leaf', donut: 'magenta', mirror: 'gold', stick: 'turq', numbers: 'leaf', duel: 'chili', flip: 'gold', noodles: 'leaf' };
function sceneHTML(game) {
  const fn = SCENES[game.anim] || SCENES.chairs, bg = SCENE_BG[game.anim];
  return `<div class="scene ${bg ? 'scene--' + bg : ''}" role="img" aria-label="Animated how-to: ${esc(game.name)}">
    <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">${fn()}</svg></div>`;
}
// Pause off-screen scenes to keep phones cool
const sceneObserver = 'IntersectionObserver' in window ? new IntersectionObserver(ents => {
  ents.forEach(e => { const s = e.target; try { e.isIntersecting ? s.unpauseAnimations() : s.pauseAnimations(); } catch (x) { } });
}, { threshold: .05 }) : null;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function watchScenes(root) {
  $$('.scene svg', root).forEach(svg => {
    if (reduceMotion) { try { svg.pauseAnimations(); svg.setCurrentTime(4.5); } catch (e) { } return; }
    sceneObserver?.observe(svg);
  });
}

/* ============================================================
   GAMES PANEL
   ============================================================ */
let gameFilter = 'all';
const GAME_FILTERS = [
  ['all', 'Lahat'], ['kids', 'Pang-bata'], ['icebreak', 'Icebreaker'], ['high', 'Mataas ang energy'], ['nomat', 'Walang kailangang gamit'], ['indoor', 'Pang-indoor']
];
function gameMatch(g) {
  switch (gameFilter) {
    case 'kids': return /Lahat|bata/i.test(g.age);
    case 'icebreak': return ['hephep', 'whisper', 'charades', 'longestline', 'jakenpoy'].includes(g.id);
    case 'high': return g.energy >= 3;
    case 'nomat': return /^Wala/.test(g.materials[0]) || g.materials.length <= 2;
    case 'indoor': return /Indoor|Kahit saan/i.test(g.place);
    default: return true;
  }
}
function renderGames() {
  const list = BIDA_GAMES.filter(gameMatch);
  $('#panel-games').innerHTML = `
    <div class="panel-head"><div><h2>Mga Laro</h2>
      <p>May animation, gamit at steps bawat laro. I-tap para makita, tapos i-add sa activities.</p></div></div>
    <div class="game-filters">${GAME_FILTERS.map(([id, l]) => `<button class="chip ${gameFilter === id ? 'on' : ''}" onclick="setGameFilter('${id}')">${l}</button>`).join('')}</div>
    <div class="game-grid">${list.map(g => `
      <button class="gcard" onclick="openGame('${g.id}')">
        ${sceneHTML(g)}
        <div class="gcard-body"><b>${esc(g.name)}</b>
          <div class="gcard-meta"><span>${ic('people', 'ic')} ${esc(g.players)}</span><span>${esc(g.time)}</span>
            <span class="energy" aria-label="Energy ${g.energy} of 3">${[1, 2, 3].map(n => `<i class="${n <= g.energy ? 'on' : ''}"></i>`).join('')}</span></div>
        </div></button>`).join('')}</div>`;
  $$('#panel-games .gcard-meta .ic').forEach(i => { i.style.width = '13px'; i.style.height = '13px'; i.style.verticalAlign = '-2px'; });
  watchScenes($('#panel-games'));
}
function setGameFilter(id) { gameFilter = id; renderGames(); }
let stepTimer;
function openGame(id) {
  const g = gameById(id); if (!g) return;
  const checks = BIDA.gameChecks[id] || [];
  openSheet(`
    <div class="sheet-head"><div><span class="kicker">${esc(g.alias || 'Party game')}</span><h3>${esc(g.name)}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <div class="gd-scene">${sceneHTML(g)}</div>
    <div class="gcard-meta" style="margin-top:12px"><span>${esc(g.players)} players</span><span>${esc(g.time)}</span><span>${esc(g.age)}</span><span>${esc(g.place)}</span></div>
    <div class="sec-title">${ic('box')}Kailangang gamit</div>
    <ul class="mat-list">${g.materials.map((m, i) => `<li><input type="checkbox" id="m-${i}" ${checks.includes(i) ? 'checked' : ''} onchange="checkMat('${id}',${i},this.checked)"><label for="m-${i}">${esc(m)}</label></li>`).join('')}</ul>
    <div class="sec-title" style="justify-content:space-between"><span style="display:flex;gap:8px;align-items:center">${ic('program')}Paano laruin</span>
      <button class="btn btn--gold btn--sm" id="step-play" onclick="playSteps()">${ic('play')}Play steps</button></div>
    <ol class="gd-steps" id="gd-steps">${g.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${g.tips?.length ? `<div class="sec-title">${ic('star')}Tips</div><ul class="mat-list">${g.tips.map(t => `<li>• ${esc(t)}</li>`).join('')}</ul>` : ''}
    ${g.credit ? `<p class="muted game-credit">Galing kay <a href="${esc(g.credit.url)}" target="_blank" rel="noopener noreferrer">${esc(g.credit.by)}</a> (@digthegames sa TikTok). Nandun ang original na video.</p>` : ''}
    <div class="sheet-actions"><button class="btn btn--magenta" onclick="addGameToProgram('${id}')">${ic('plus')}Idagdag sa activities</button></div>`);
  watchScenes($('#sheet'));
}
function playSteps() {
  const lis = $$('#gd-steps li'); let i = 0;
  clearInterval(stepTimer);
  const tick = () => {
    lis.forEach((l, j) => l.classList.toggle('now', j === i));
    lis[i]?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    i++; if (i > lis.length) { clearInterval(stepTimer); lis.forEach(l => l.classList.remove('now')); }
  };
  tick(); stepTimer = setInterval(tick, 3200);
}
function checkMat(id, i, on) {
  const a = new Set(BIDA.gameChecks[id] || []); on ? a.add(i) : a.delete(i);
  BIDA.gameChecks[id] = [...a]; saveState();
}
function addGameToProgram(id) {
  const g = gameById(id), m = parseInt(g.time, 10) || 15;
  // insert before closing/videoke if present
  let at = BIDA.program.findIndex(s => s.kind === 'closing' || s.kind === 'videoke' || s.kind === 'photo');
  if (at < 0) at = BIDA.program.length;
  BIDA.program.splice(at, 0, { id: BIDA.nextId++, kind: 'game', title: g.name, min: Math.max(m, 10), game: id });
  saveState(); closeSheet(); toast(`${g.name} — nadagdag sa activities!`);
}


/* ============================================================
   SOUND PADS
   - Pads are uploaded by the admin in the app and stored on the server (Worker).
     Free pads (max 8) play for everyone; Premium pads are only SENT by the server
     to a signed-in account with an active pass (or admin) — editing the page can't
     get them. Until the Worker is set up, free pads can also come from sounds/free/.
   - Users can also add their own sounds on their device (2 free).
   ============================================================ */
let AC = null, SFX_BUS = null, MUSIC_BUS = null;
function ac() {
  if (!AC) {
    // Pads must play ON TOP of the music, never duck or pause it: mix with other audio where the browser supports it
    try { if (navigator.audioSession && M.kind !== 'local') navigator.audioSession.type = 'ambient'; } catch (e) { }
    AC = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    // Pads go through a limiter with extra gain so they cut through the music without distorting
    const lim = AC.createDynamicsCompressor();
    lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = .002; lim.release.value = .12;
    SFX_BUS = AC.createGain(); SFX_BUS.gain.value = 1.8; SFX_BUS.connect(lim).connect(AC.destination);
    MUSIC_BUS = AC.createGain(); MUSIC_BUS.gain.value = BIDA.music.master; MUSIC_BUS.connect(AC.destination);
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
const BUF_CACHE = {};
const PAD_KEYS = '1234567890qwertyuiopasdfghjkl'.split('');
const PAD_COLORS = ['gold', 'magenta', 'turq', 'leaf', 'chili', 'paper'];
const workerBase = () => BIDA_CONFIG.workerUrl.replace(/\/$/, '');

/* ---- local storage for the user's own sounds + an offline copy of server pads (IndexedDB) ---- */
let DB;
function db() {
  if (DB) return Promise.resolve(DB);
  return new Promise((res, rej) => {
    const r = indexedDB.open('bidavibe_media', 3);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains('sounds')) r.result.createObjectStore('sounds', { keyPath: 'id' });
      if (!r.result.objectStoreNames.contains('padcache')) r.result.createObjectStore('padcache', { keyPath: 'id' });
      if (!r.result.objectStoreNames.contains('images')) r.result.createObjectStore('images', { keyPath: 'id' });   // card background (this device only)
    };
    r.onsuccess = () => { DB = r.result; res(DB); }; r.onerror = () => rej(r.error);
  });
}
const idb = (store, mode, fn) => db().then(d => new Promise(res => { const tx = d.transaction(store, mode); const out = fn(tx.objectStore(store)); tx.oncomplete = () => res(out?.result); tx.onerror = () => res(null); }));
const dbAll = () => idb('sounds', 'readonly', s => s.getAll()).then(r => r || []);
const dbPut = o => idb('sounds', 'readwrite', s => s.put(o));
const dbDel = id => idb('sounds', 'readwrite', s => s.delete(id));
const cacheGet = id => idb('padcache', 'readonly', s => s.get(id));
const cachePut = o => idb('padcache', 'readwrite', s => s.put(o));
// Premium audio cached on this device only for the account that has the pass; removed when it ends
async function purgePremiumCache() {
  const all = (await idb('padcache', 'readonly', s => s.getAll())) || [];
  for (const c of all) if (c.tier === 'premium' && (!BIDA.premium || c.uid !== AUTH.user?.uid)) { await idb('padcache', 'readwrite', s => s.delete(c.id)); delete BUF_CACHE[c.id]; }
}

let CUSTOM = [];          // the user's own sounds [{id,name,blob,c,created}]
async function loadCustom() {
  try {
    CUSTOM = (await dbAll()).filter(s => /^[ur][a-z0-9]{4,30}$/.test(String(s.id)) && s.blob instanceof Blob)
      .map(s => ({ ...s, name: String(s.name || 'Sound').slice(0, 20) }))
      .sort((a, b) => (a.created || 0) - (b.created || 0));
  } catch (e) { CUSTOM = []; }
}

/* ---- server pads ---- */
let PADS = [];            // [{id,name,tier,v,src:'server'|'folder',file?}]
const cleanPad = p => ({ id: String(p.id), name: String(p.name || 'Sound').slice(0, 24), tier: p.tier === 'premium' ? 'premium' : 'free', v: Number(p.v) || 0, src: 'server' });
async function loadPads() {
  if (BIDA_CONFIG.workerUrl) {
    try {
      const r = await fetch(workerBase() + '/pads', { cache: 'no-cache' });
      if (!r.ok) throw new Error();
      PADS = ((await r.json()).pads || []).filter(p => /^p[a-f0-9]{12}$/.test(p.id)).map(cleanPad);
      try { localStorage.setItem('bidavibe_pads', JSON.stringify(PADS)); } catch (e) { }
    } catch (e) { try { PADS = (JSON.parse(localStorage.getItem('bidavibe_pads') || '[]') || []).map(cleanPad); } catch (x) { PADS = []; } }
  } else {
    PADS = await loadFolderPads();
  }
  purgePremiumCache();
}
// Fallback before the Worker exists: free pads from the sounds/free/ folder (named after the file)
const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|oga|webm)$/i;
function padNameFromFile(f) {
  let n = f; try { n = decodeURIComponent(f); } catch (e) { }
  return n.replace(AUDIO_EXT, '').replace(/^\d{1,3}[\s._-]+/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 22) || 'Sound';
}
async function loadFolderPads() {
  let files = [];
  try { const r = await fetch('sounds/free/list.json', { cache: 'no-cache' }); if (r.ok) files = (await r.json()).map(String); } catch (e) { }
  if (!files.length && IS_LOCAL) { try { files = [...(await (await fetch('sounds/free/', { cache: 'no-cache' })).text()).matchAll(/href="([^"?#/]+)"/g)].map(m => m[1]); } catch (e) { } }
  if (!files.length) {
    const gh = location.hostname.match(/^([\w-]+)\.github\.io$/), repo = location.pathname.split('/')[1], KEY = 'bidavibe_freepads';
    if (gh && repo) {
      try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && Date.now() - c.at < 6e5) files = c.files || []; } catch (e) { }
      if (!files.length) try {
        const r = await fetch(`https://api.github.com/repos/${gh[1]}/${encodeURIComponent(repo)}/contents/sounds/free`);
        if (r.ok) { files = (await r.json()).filter(x => x && x.type === 'file' && x.size < 3e6).map(x => String(x.name)); localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), files })); }
      } catch (e) { }
    }
  }
  return files.filter(f => AUDIO_EXT.test(f) && f.length < 120).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).slice(0, 8)
    .map((file, i) => ({ id: 'f' + (i + 1), name: padNameFromFile(file), tier: 'free', v: 0, src: 'folder', file }));
}

function soundEntry(id) {
  const p = PADS.find(s => s.id === id); if (p) return { ...p, kind: 'pad' };
  const ci = CUSTOM.findIndex(s => s.id === id);
  return ci >= 0 ? { ...CUSTOM[ci], kind: 'custom', idx: ci } : null;
}
// What the BUTTONS show. The real lock for premium pads is the server, which won't send the audio.
function canPlaySound(id) {
  const s = soundEntry(id); if (!s) return false;
  if (s.kind === 'pad') return s.tier === 'free' || BIDA.premium;
  return BIDA.premium || s.idx < BIDA_CONFIG.freeUploads;
}
async function padBytes(s) {
  if (s.kind === 'custom') return s.blob.arrayBuffer();
  if (s.src === 'folder') {
    // GitHub Pages takes ~1 min to publish a new upload; until then, read it straight from the repo
    let r = await fetch('sounds/free/' + encodeURIComponent(s.file));
    if (!r.ok) { const { owner, repo } = ghRepo(); r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/sounds/free/${encodeURIComponent(s.file)}`); }
    if (!r.ok) throw new Error('pad ' + r.status);
    return r.arrayBuffer();
  }
  const c = await cacheGet(s.id);
  if (c && c.v === s.v && c.buf && (s.tier === 'free' || c.uid === AUTH.user?.uid)) return c.buf;
  const headers = {};
  if (s.tier === 'premium') { if (!AUTH.user) throw Object.assign(new Error(), { code: 403 }); headers.Authorization = 'Bearer ' + await AUTH.user.getIdToken(); }
  const r = await fetch(`${workerBase()}/pads/${s.id}`, { headers });
  if (r.status === 403) throw Object.assign(new Error(), { code: 403 });
  if (!r.ok) throw new Error('pad ' + r.status);
  const buf = await r.arrayBuffer();
  cachePut({ id: s.id, v: s.v, tier: s.tier, uid: AUTH.user?.uid || '', buf: buf.slice(0) });
  return buf;
}
/* ---- Zero-delay playback ----
   1) every playable pad is downloaded + decoded ahead of time (preloadPads), so a tap never waits on the network
   2) silence at the start of a file is cut off, so the sound starts the instant the pad is hit
   3) the audio engine is woken up on the first touch anywhere, so the first pad isn't slow either */
const DECODING = {};
const MAX_SOUND_SEC = 3, MAX_SOUND_BYTES = 500 * 1024;
function trimSilence(buf) {
  const ch = [...Array(buf.numberOfChannels)].map((_, i) => buf.getChannelData(i));
  let start = 0;
  outer: for (; start < buf.length; start++) for (const d of ch) if (Math.abs(d[start]) > 0.01) break outer;
  start = Math.max(0, start - Math.round(buf.sampleRate * 0.004));      // keep 4 ms so the attack isn't clipped
  if (start < buf.sampleRate * 0.01 || start >= buf.length) return buf;  // nothing worth trimming
  const out = ac().createBuffer(buf.numberOfChannels, buf.length - start, buf.sampleRate);
  ch.forEach((d, i) => out.copyToChannel(d.subarray(start), i));
  return out;
}
function decodePad(id) {
  if (BUF_CACHE[id]) return Promise.resolve(BUF_CACHE[id]);
  if (!DECODING[id]) DECODING[id] = (async () => {
    const raw = await ac().decodeAudioData(await padBytes(soundEntry(id)));
    return (BUF_CACHE[id] = trimSilence(raw));
  })().finally(() => { delete DECODING[id]; });
  return DECODING[id];
}
let preloadRun = 0;
async function preloadPads() {
  const run = ++preloadRun;
  for (const p of padList()) {
    if (run !== preloadRun) return;                 // a newer preload started (list changed)
    if (canPlaySound(p.id) && !BUF_CACHE[p.id]) { try { await decodePad(p.id); } catch (e) { } }
  }
}
// Wake the audio engine on the first touch/click anywhere (iPhone needs this inside a user gesture)
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, function wake() {
  const x = ac();
  try { const b = x.createBuffer(1, 1, 22050), s = x.createBufferSource(); s.buffer = b; s.connect(x.destination); s.start(0); } catch (e) { }
  document.removeEventListener(ev, wake, true);
}, { capture: true, once: true }));

/* ---- One pad at a time: a new pad stops the one still playing (10 ms fade, no click) ---- */
let CUR_PAD = null;
function playBuffer(buf) {
  const x = ac(), now = x.currentTime;
  if (CUR_PAD) { try { CUR_PAD.g.gain.setTargetAtTime(0, now, 0.004); CUR_PAD.src.stop(now + 0.03); } catch (e) { } }
  const g = x.createGain(); g.connect(SFX_BUS);
  const src = x.createBufferSource(); src.buffer = buf; src.connect(g); src.start(now);
  const me = CUR_PAD = { src, g };
  src.onended = () => { if (CUR_PAD === me) CUR_PAD = null; };
}
function playSound(id, padEl) {
  if (!canPlaySound(id)) { openPremium('Sound pads'); return; }
  if (padEl) { padEl.classList.add('hit'); setTimeout(() => padEl.classList.remove('hit'), 120); }
  if (BUF_CACHE[id]) { playBuffer(BUF_CACHE[id]); return; }    // the normal, instant path
  decodePad(id).then(playBuffer).catch(e => {
    if (e.code === 403) openPremium('Sound pads'); else toast('Hindi ma-play ang sound na ito');
  });
}
function padList() {
  return [...PADS.map((s, i) => ({ id: s.id, name: s.name, c: PAD_COLORS[i % PAD_COLORS.length], kind: 'pad' })),
    ...CUSTOM.map(s => ({ id: s.id, name: s.name, c: s.c || 'paper', kind: 'custom' }))];
}
function padsHTML(limit) {
  const list = limit ? padList().slice(0, limit) : padList();
  return list.map((s, i) => {
    const ok = canPlaySound(s.id);
    return `<button class="pad pc-${s.c} ${ok ? '' : 'disabled'}" data-sid="${s.id}" onpointerdown="event.preventDefault();playSound('${s.id}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();playSound('${s.id}',this)}">
      ${PAD_KEYS[i] ? `<span class="pad-key">${PAD_KEYS[i].toUpperCase()}</span>` : ''}
      ${ok ? '' : `<svg class="ic pad-lock"><use href="#i-lock"/></svg>`}
      ${s.kind === 'custom' ? `<span class="pad-del" role="button" aria-label="Delete ${esc(s.name)}" onpointerdown="event.stopPropagation();event.preventDefault();delSound('${s.id}')">${ic('trash')}</span>` : ''}
      <span class="pad-name">${esc(s.name)}</span></button>`;
  }).join('');
}
function uploadsLeft() { return BIDA.premium ? Infinity : Math.max(0, BIDA_CONFIG.freeUploads - CUSTOM.length); }
const leftLabel = (n, more) => n === Infinity ? more : n ? `${n} libre pa` : 'Premium';
function renderSounds() {
  const freeN = PADS.filter(p => p.tier === 'free').length;
  $('#panel-sounds').innerHTML = `
    <div class="panel-head"><div><h2>Sound pads</h2>
      <p>${BIDA.premium ? 'Lahat ng sounds naka-unlock.' : `Libre ang ${freeN ? freeN + ' sound pads' : 'mga libreng pads'} at ${BIDA_CONFIG.freeUploads} sariling upload.`}</p></div>
      ${BIDA.premium ? '' : `<button class="btn btn--gold btn--sm" onclick="openPremium('Sound pads')">${ic('lock')}I-unlock lahat</button>`}</div>
    <div class="pads" id="pads">${padsHTML()}
      <button class="pad pad--add" onclick="addSoundClick()">${ic('upload')}<span class="pad-name">Upload</span>
        <small>${leftLabel(uploadsLeft(), 'max 3 seg')}</small></button></div>
    <input type="file" id="snd-file" accept="audio/*" multiple hidden onchange="uploadSounds(this.files);this.value=''">
    ${isAdmin() ? adminSoundsHTML() : ''}`;
}
function addSoundClick() {
  if (!uploadsLeft()) { openPremium('Dagdag sounds'); return; }
  $('#snd-file').click();
}
// Checks a sound file: max 500 KB and max 3 seconds (after the silent start is cut). Returns the decoded buffer.
async function checkSoundFile(f) {
  if (f.size > MAX_SOUND_BYTES) throw new Error(`${f.name}: masyadong malaki — max 500 KB`);
  let buf;
  try { buf = trimSilence(await ac().decodeAudioData(await f.arrayBuffer())); }
  catch (e) { throw new Error(`${f.name}: hindi ma-play ang file na ito`); }
  if (buf.duration > MAX_SOUND_SEC + 0.05) throw new Error(`${f.name}: ${buf.duration.toFixed(1)} segundo — hanggang ${MAX_SOUND_SEC} segundo lang`);
  return buf;
}
// The user's own sounds are saved ONLY on this device (browser storage / IndexedDB) — never uploaded anywhere.
async function uploadSounds(files) {
  let added = 0;
  for (const f of files) {
    if (!uploadsLeft()) { openPremium('Dagdag sounds'); break; }
    let buf;
    try { buf = await checkSoundFile(f); } catch (e) { toast(e.message); continue; }
    const s = { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: f.name.replace(/\.[^.]+$/, '').slice(0, 20), blob: f, c: ['magenta', 'turq', 'gold', 'leaf', 'chili'][CUSTOM.length % 5], created: Date.now() };
    await dbPut(s); CUSTOM.push(s); BUF_CACHE[s.id] = buf; added++;
  }
  renderSounds(); if (added) toast(added > 1 ? `${added} sounds nadagdag!` : 'Nadagdag ang sound!');
}
async function delSound(id) {
  if (!await askConfirm('Tanggalin ang sound na ito?', 'Tanggalin')) return;
  await dbDel(id); CUSTOM = CUSTOM.filter(s => s.id !== id); delete BUF_CACHE[id]; renderSounds();
}

/* ---- Admin: Sound manager ----
   Without the Worker: Morphii-style — files are committed to sounds/free/ in the GitHub repo using a
   GitHub token that lives in Firestore bida_secrets/github, which the Firestore rules let ONLY the
   verified admin read. With the Worker: pads live on the Worker and can be Free or Premium. */
let ADMIN_TIER = 'free';
function adminSoundsHTML() { return BIDA_CONFIG.workerUrl ? adminWorkerHTML() : adminGitHubHTML(); }

const GH = { state: '', token: null, files: [], busy: false, msg: '' };
function ghRepo() {
  const gh = location.hostname.match(/^([\w-]+)\.github\.io$/), repo = location.pathname.split('/')[1];
  return gh && repo ? { owner: gh[1], repo } : { owner: 'campingchairph', repo: 'bida-vibe' };
}
const secretUrl = () => `https://firestore.googleapis.com/v1/projects/${BIDA_CONFIG.firebase.projectId}/databases/(default)/documents/bida_secrets/github`;
async function fsAuth() { return { Authorization: 'Bearer ' + await AUTH.user.getIdToken() }; }
// Token comes from Firestore (rules: admin only). Kept in memory only — never saved in this browser.
async function ghLoadToken() {
  const r = await fetch(secretUrl(), { headers: await fsAuth() });
  if (r.status === 404) return null;
  if (r.status === 403) throw new Error('rules');
  if (!r.ok) throw new Error('fs_' + r.status);
  return (await r.json()).fields?.token?.stringValue || null;
}
async function ghSaveToken() {
  const t = ($('#gh-token')?.value || '').trim();
  if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(t)) { toast('Hindi mukhang GitHub token ito'); return; }
  try {
    const r = await fetch(secretUrl() + '?updateMask.fieldPaths=token', { method: 'PATCH', headers: { ...(await fsAuth()), 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { token: { stringValue: t } } }) });
    if (r.status === 403) throw new Error('rules');
    if (!r.ok) throw new Error('fs_' + r.status);
    GH.token = t; GH.state = ''; toast('Na-save ang token'); adminInit();
  } catch (e) { GH.state = e.message === 'rules' ? 'rules' : 'error'; GH.msg = e.message; renderSounds(); }
}
function ghChangeToken() { GH.token = null; GH.state = 'need-token'; renderSounds(); }
async function ghApi(path, opts = {}) {
  const { owner, repo } = ghRepo();
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/${path}`, { ...opts, headers: { Authorization: 'Bearer ' + GH.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) } });
  if (r.status === 401) throw new Error('gh_token');
  if (r.status === 403 || (r.status === 404 && opts.method && opts.method !== 'GET')) throw new Error('gh_perm');
  return r;
}
async function ghRefresh() {
  const r = await ghApi('contents/sounds/free');
  const list = r.status === 404 ? [] : await r.json();
  GH.files = list.filter(f => f.type === 'file' && AUDIO_EXT.test(f.name)).map(f => ({ name: f.name, sha: f.sha, size: f.size }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  try { localStorage.removeItem('bidavibe_freepads'); } catch (e) { }
  PADS = GH.files.slice(0, 8).map((f, i) => ({ id: 'f' + (i + 1), name: padNameFromFile(f.name), tier: 'free', v: 0, src: 'folder', file: f.name }));
  Object.keys(BUF_CACHE).filter(k => /^f\d+$/.test(k)).forEach(k => delete BUF_CACHE[k]);
}
async function adminInit() {
  if (!isAdmin() || BIDA_CONFIG.workerUrl || GH.busy) return;
  GH.state = 'loading'; renderSounds();
  try {
    if (!GH.token) GH.token = await ghLoadToken();
    if (!GH.token) { GH.state = 'need-token'; renderSounds(); return; }
    await ghRefresh(); GH.state = 'ready';
  } catch (e) {
    GH.state = e.message === 'rules' ? 'rules' : e.message === 'gh_token' ? 'bad-token' : 'error'; GH.msg = e.message;
    if (GH.state === 'bad-token') GH.token = null;
  }
  renderSounds();
}
const b64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
function sniffAudio(b) {
  const s = (i, n) => String.fromCharCode(...b.slice(i, i + n));
  if (s(0, 3) === 'ID3' || (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0)) return 'mp3';
  if (s(0, 4) === 'RIFF' && s(8, 4) === 'WAVE') return 'wav';
  if (s(0, 4) === 'OggS') return 'ogg';
  if (s(4, 4) === 'ftyp') return 'm4a';
  if (b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) return 'webm';
  return '';
}
// File names in the public folder: letters, numbers, spaces and a few symbols only; audio extension forced
const safeBase = s => String(s).replace(AUDIO_EXT, '').replace(/[^\p{L}\p{N} ._()'!&-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'Sound';
async function ghPut(path, contentB64, message, sha) {
  const r = await ghApi('contents/' + path.split('/').map(encodeURIComponent).join('/'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, content: contentB64, ...(sha ? { sha } : {}) }) });
  if (!r.ok) throw new Error('gh_' + r.status);
  return r.json();
}
async function ghDel(path, sha, message) {
  const r = await ghApi('contents/' + path.split('/').map(encodeURIComponent).join('/'), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, sha }) });
  if (!r.ok) throw new Error('gh_' + r.status);
}
const GH_ERR = { gh_token: 'Hindi tanggap ng GitHub ang token (expired o mali). Palitan ang token.', gh_perm: 'Walang permiso ang token na mag-edit ng bida-vibe repo (kailangan: Contents → Read and write).', rules: 'Hindi pa naka-publish ang Firestore rules (firestore.rules).' };
async function ghWork(fn, okMsg) {
  if (GH.busy) return; GH.busy = true; renderSounds();
  try { await fn(); await ghRefresh(); preloadPads(); if (okMsg) toast(okMsg); }
  catch (e) { toast(GH_ERR[e.message] || 'Hindi natuloy — subukan ulit'); if (e.message === 'gh_token') { GH.token = null; GH.state = 'bad-token'; } }
  finally { GH.busy = false; renderSounds(); }
}
function ghUpload(files) {
  return ghWork(async () => {
    for (const f of files) {
      if (GH.files.length >= 8) { toast('Puno na ang 8 libreng pads — magtanggal muna'); break; }
      try { await checkSoundFile(f); } catch (e) { toast(e.message); continue; }
      const buf = await f.arrayBuffer(), ext = sniffAudio(new Uint8Array(buf.slice(0, 16)));
      if (!ext) { toast(`${f.name}: hindi audio file`); continue; }
      const next = String(GH.files.length + 1).padStart(2, '0');
      let name = `${next}-${safeBase(f.name)}.${ext}`;
      if (GH.files.some(x => x.name.toLowerCase() === name.toLowerCase())) name = `${next}-${safeBase(f.name)} ${Date.now() % 1000}.${ext}`;
      await ghPut('sounds/free/' + name, b64(buf), `Add sound pad: ${padNameFromFile(name)}`);
      GH.files.push({ name, sha: '', size: f.size });
    }
  }, 'Na-upload! Lalabas sa lahat ng users sa loob ng 1–2 minuto.');
}
async function ghRenameFile(f, newName, why) {
  if (f.name === newName) return;
  const r = await ghApi('contents/sounds/free/' + encodeURIComponent(f.name));
  const j = await r.json();
  await ghPut('sounds/free/' + newName, String(j.content || '').replace(/\s/g, ''), why);
  await ghDel('sounds/free/' + f.name, j.sha, why);
}
async function ghRename(i) {
  const f = GH.files[i]; if (!f) return;
  const nn = await askText('Bagong pangalan ng pad', padNameFromFile(f.name), 24); if (!nn) return;
  const prefix = (f.name.match(/^\d{1,3}[\s._-]+/) || [''])[0], ext = f.name.match(AUDIO_EXT)[0];
  ghWork(() => ghRenameFile(f, `${prefix}${safeBase(nn)}${ext}`, `Rename sound pad: ${safeBase(nn)}`), 'Napalitan ang pangalan');
}
function ghMove(i, d) {
  const j = i + d, a = GH.files[i], b = GH.files[j]; if (!a || !b) return;
  // Order = the number at the front of the file name; swap the two numbers
  const base = f => f.name.replace(/^\d{1,3}[\s._-]+/, '');
  ghWork(async () => {
    await ghRenameFile(a, `${String(j + 1).padStart(2, '0')}-${base(a)}`, 'Reorder sound pads');
    await ghRenameFile(b, `${String(i + 1).padStart(2, '0')}-${base(b)}`, 'Reorder sound pads');
  });
}
async function ghDelete(i) {
  const f = GH.files[i]; if (!f) return;
  if (!await askConfirm(`Tanggalin ang "${padNameFromFile(f.name)}" para sa lahat ng users?`, 'Tanggalin')) return;
  ghWork(() => ghDel('sounds/free/' + f.name, f.sha, `Remove sound pad: ${padNameFromFile(f.name)}`), 'Natanggal');
}
function adminGitHubHTML() {
  if (!GH.state && !GH.busy) setTimeout(adminInit, 0);
  const head = `<h3>${ic('lock')}Admin: Sound manager</h3><p class="muted">Ikaw lang ang nakakakita nito. Libre sa lahat ang i-a-upload mo dito (max 8).</p>`;
  let body = '';
  if (GH.state === 'loading' || !GH.state) body = '<p class="muted" style="margin-top:12px">Kinukuha…</p>';
  else if (GH.state === 'rules') body = `<p class="note" style="margin-top:12px">Hindi pa naka-publish ang Firestore rules. Firebase Console → Databases &amp; Storage → Firestore → <b>Rules</b> → i-paste ang laman ng <code>firestore.rules</code> → Publish. Tapos i-refresh ito.</p>`;
  else if (GH.state === 'need-token' || GH.state === 'bad-token') body = `
    ${GH.state === 'bad-token' ? '<p class="note" style="margin-top:12px">Hindi na gumagana ang dating token (expired o binura). Maglagay ng bago.</p>' : ''}
    <p style="margin-top:12px;font-weight:700">Isang beses lang: ilagay ang GitHub token para makapag-upload.</p>
    <ol class="mic-steps"><li>Sa github.com → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token.</li>
      <li>Repository access: <b>Only select repositories → bida-vibe</b>. Permissions: <b>Contents → Read and write</b>. Expiration: 90 days.</li>
      <li>I-copy ang token at i-paste dito.</li></ol>
    <div class="yt-add" style="margin-top:10px"><input class="input" id="gh-token" type="password" autocomplete="off" placeholder="github_pat_…"><button class="btn btn--ink" onclick="ghSaveToken()">I-save</button></div>
    <p class="muted" style="margin-top:6px">Naka-save sa Firestore at ikaw lang ang makakabasa. Wala sa browser na 'to.</p>`;
  else if (GH.state === 'ready') body = `
    <div class="admin-up"><button class="btn btn--ink" ${GH.busy || GH.files.length >= 8 ? 'disabled' : ''} onclick="$('#gh-snd').click()">${ic('upload')}${GH.busy ? 'Sandali…' : 'Mag-upload'}</button>
      <span class="muted"><b>${GH.files.length}/8</b> · max 3 segundo at 500 KB · pangalan ng pad = pangalan ng file</span></div>
    <input type="file" id="gh-snd" accept="audio/*" multiple hidden onchange="ghUpload([...this.files]);this.value=''">
    ${GH.files.length ? `<ul class="admin-list">${GH.files.map((f, i) => `<li><span class="admin-n">${i + 1}</span><b>${esc(padNameFromFile(f.name))}</b>
      <span class="admin-act">
        <button class="icon-btn icon-btn--plain" onclick="ghMove(${i},-1)" aria-label="Taas" ${i === 0 || GH.busy ? 'disabled' : ''}>${ic('up')}</button>
        <button class="icon-btn icon-btn--plain" onclick="ghMove(${i},1)" aria-label="Baba" ${i === GH.files.length - 1 || GH.busy ? 'disabled' : ''}>${ic('down')}</button>
        <button class="icon-btn icon-btn--plain" onclick="ghRename(${i})" aria-label="Palitan ang pangalan" ${GH.busy ? 'disabled' : ''}>${ic('edit')}</button>
        <button class="icon-btn icon-btn--plain" onclick="ghDelete(${i})" aria-label="Tanggalin" ${GH.busy ? 'disabled' : ''}>${ic('trash')}</button></span></li>`).join('')}</ul>` : '<p class="muted" style="margin-top:12px">Wala pang naka-upload.</p>'}
    <p class="muted" style="margin-top:10px">Makikita ng lahat in 1–2 minutes. <button class="btn btn--ghost btn--sm" style="min-height:30px" onclick="ghChangeToken()">Palitan ang token</button></p>`;
  else body = `<p class="note" style="margin-top:12px">May problema: ${esc(GH.msg || '')}. <button class="btn btn--ghost btn--sm" onclick="GH_retry()">Subukan ulit</button></p>`;
  return `<div class="card admin-card" style="margin-top:20px">${head}${body}</div>`;
}
function GH_retry() { GH.state = ''; adminInit(); }
function adminWorkerHTML() {
  const freeN = PADS.filter(p => p.tier === 'free').length;
  return `<div class="card admin-card" style="margin-top:20px">
    <h3>${ic('lock')}Admin: Sound manager</h3>
    <p class="muted">Ikaw lang ang nakakakita nito. Libre: <b>${freeN}/8</b> · Premium: <b>${PADS.length - freeN}</b> · max 3 seconds at 500 KB bawat sound.</p>
    <div class="admin-up">
      <div class="seg-ctrl seg-ctrl--light" role="group" aria-label="Para kanino">
        <button class="${ADMIN_TIER === 'free' ? 'on' : ''}" onclick="adminTier('free')">Libre sa lahat</button>
        <button class="${ADMIN_TIER === 'premium' ? 'on' : ''}" onclick="adminTier('premium')">Premium lang</button></div>
      <button class="btn btn--ink" onclick="$('#admin-snd').click()">${ic('upload')}Mag-upload</button>
      <input type="file" id="admin-snd" accept="audio/*" multiple hidden onchange="adminUpload(this.files);this.value=''">
    </div>
    <p class="muted" style="margin-top:8px">Yung file name ang magiging pangalan ng pad. Pwede mo palitan after.</p>
    ${PADS.length ? `<ul class="admin-list">${PADS.map((p, i) => `<li>
      <span class="admin-n">${i + 1}</span><b>${esc(p.name)}</b>
      <button class="pill ${p.tier === 'premium' ? 'pill--pro' : ''}" onclick="adminPatch('${p.id}',{tier:'${p.tier === 'free' ? 'premium' : 'free'}'})">${p.tier === 'free' ? 'Libre' : 'Premium'}</button>
      <span class="admin-act">
        <button class="icon-btn icon-btn--plain" onclick="adminPatch('${p.id}',{move:-1})" aria-label="Taas" ${i === 0 ? 'disabled' : ''}>${ic('up')}</button>
        <button class="icon-btn icon-btn--plain" onclick="adminPatch('${p.id}',{move:1})" aria-label="Baba" ${i === PADS.length - 1 ? 'disabled' : ''}>${ic('down')}</button>
        <button class="icon-btn icon-btn--plain" onclick="adminRename('${p.id}')" aria-label="Palitan ang pangalan">${ic('edit')}</button>
        <button class="icon-btn icon-btn--plain" onclick="adminDelete('${p.id}')" aria-label="Tanggalin">${ic('trash')}</button></span></li>`).join('')}</ul>`
      : '<p class="muted" style="margin-top:12px">Wala pang naka-upload.</p>'}
  </div>`;
}
const ADMIN_ERR = { too_big: 'Masyadong malaki — max 500 KB', not_audio: 'Hindi audio file ito', free_full: 'Puno na ang 8 libreng pads — gawing Premium o magtanggal muna', too_many: 'Umabot na sa 40 pads', admin_only: 'Admin lang ang pwede dito', no_token: 'Mag-sign in muna' };
async function adminReq(path, method, body, type) {
  if (!AUTH.user) throw new Error('no_token');
  const r = await fetch(workerBase() + path, { method, body, headers: { Authorization: 'Bearer ' + await AUTH.user.getIdToken(), ...(type ? { 'Content-Type': type } : {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'http_' + r.status);
  return j;
}
const adminFail = e => toast(ADMIN_ERR[e.message] || 'Hindi natuloy — subukan ulit');
function adminTier(t) { ADMIN_TIER = t; renderSounds(); }
async function adminUpload(files) {
  let ok = 0;
  for (const f of files) {
    try { await checkSoundFile(f); } catch (e) { toast(e.message); continue; }
    try { await adminReq(`/pads?tier=${ADMIN_TIER}&name=${encodeURIComponent(padNameFromFile(f.name))}`, 'POST', f, f.type || 'application/octet-stream'); ok++; }
    catch (e) { adminFail(e); if (e.message === 'free_full' || e.message === 'admin_only') break; }
  }
  await loadPads(); renderSounds(); preloadPads(); if (ok) toast(ok > 1 ? `${ok} sounds na-upload!` : 'Na-upload!');
}
async function adminPatch(id, body) {
  try { await adminReq('/pads/' + id, 'PATCH', JSON.stringify(body), 'application/json'); delete BUF_CACHE[id]; await loadPads(); renderSounds(); } catch (e) { adminFail(e); }
}
async function adminRename(id) {
  const p = PADS.find(x => x.id === id); if (!p) return;
  const name = await askText('Bagong pangalan ng pad', p.name, 24); if (!name) return;
  adminPatch(id, { name });
}
async function adminDelete(id) {
  const p = PADS.find(x => x.id === id); if (!p) return;
  if (!await askConfirm(`Tanggalin ang "${p.name}" para sa lahat ng users?`, 'Tanggalin')) return;
  try { await adminReq('/pads/' + id, 'DELETE'); delete BUF_CACHE[id]; await loadPads(); renderSounds(); toast('Natanggal'); } catch (e) { adminFail(e); }
}

/* ---- Microphone permission help (for mic auto-fade): how to allow it on THIS phone/browser, then retry ---- */
let micRetry = null;
async function micDenied() {
  try { return (await navigator.permissions?.query({ name: 'microphone' }))?.state === 'denied'; } catch (e) { return false; }
}
function micHelp(err, retry) {
  micRetry = retry || null;
  const ua = navigator.userAgent;
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|TikTok|musical_ly|Snapchat|GSA\//i.test(ua);
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const iosOther = ios && /CriOS|FxiOS|EdgiOS|Brave/i.test(ua);
  const android = /Android/i.test(ua), brave = !!navigator.brave;
  const name = err && err.name;
  let why = 'Naka-block ang mic para sa Bida-Vibe sa browser na ito.', steps = [];
  if (!window.isSecureContext) why = 'Gumagana lang ang mic sa https:// na link.';
  else if (name === 'NotFoundError') why = 'Walang nakitang mic sa device na ito.';
  else if (name === 'NotReadableError') why = 'Ginagamit ng ibang app ang mic (hal. tawag o video call). Isara muna iyon.';
  if (inApp) {
    why = 'Binuksan mo ang Bida-Vibe sa loob ng Facebook, Messenger, TikTok o ibang app — hindi nila pinapayagan ang mic.';
    steps = ['I-tap ang ⋮ o … sa itaas na kanan.', `Piliin ang "Open in browser" / "Buksan sa ${ios ? 'Safari' : 'Chrome'}".`, 'Doon subukan ulit.'];
  } else if (ios && !iosOther) {
    steps = ['I-tap ang "aA" sa address bar ng Safari.', 'Piliin ang "Website Settings".', 'Microphone → Allow.', 'Bumalik dito at pindutin ang "Subukan ulit".',
      'Kung wala: buksan ang Settings app → Safari (o Apps → Safari) → Microphone → Ask o Allow.'];
  } else if (ios) {
    steps = ['Buksan ang Settings app ng iPhone.', `Hanapin ang ${brave ? 'Brave' : 'browser mo (hal. Chrome)'} → i-ON ang Microphone.`, 'Bumalik dito, i-reload ang page, at subukan ulit.'];
  } else if (android) {
    steps = ['I-tap ang icon sa kaliwa ng address bar (lock o settings icon).', `Piliin ang "Permissions" o "Site settings".`, 'Microphone → Allow.', 'Pindutin ang "Subukan ulit".',
      `Kung naka-block pa rin: Settings ng phone → Apps → ${brave ? 'Brave' : 'Chrome'} → Permissions → Microphone → Allow.`];
  } else {
    steps = ['I-click ang icon sa kaliwa ng address bar.', 'Microphone → Allow.', 'I-reload ang page kung kailangan, tapos pindutin ang "Subukan ulit".'];
  }
  openSheet(`
    <div class="sheet-head"><h3>Kailangan ng mic</h3><button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <div class="card"><p style="font-weight:700">${esc(why)}</p>
      ${steps.length ? `<span class="field-label" style="display:block;margin-top:14px">Paano i-on</span><ol class="mic-steps">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}</div>
    <div class="sheet-actions">
      <button class="btn btn--ghost" onclick="closeSheet()">Isara</button>
      ${micRetry ? `<button class="btn btn--ink" onclick="closeSheet();micRetryNow()">${ic('mic')}Subukan ulit</button>` : ''}
    </div>`);
}
function micRetryNow() { const f = micRetry; micRetry = null; f?.(); }

/* ============================================================
   MUSIC — sources, fade/duck engine, and the always-on music bar.
   The Music tab is only setup; playback controls live in #mbar.
   ============================================================ */
const M = { wantPlay: false, resumeT: 0, duckT: 0, kind: null, playing: false, title: '', current: .8, ducked: false, faded: false, raf: 0, fadeT: 0, yt: null, ytReady: false, sp: null, spDevice: null, spMode: null, audio: null, mediaSrc: null, queue: [], qi: 0, lastSpSet: 0, upNext: [], pos: '' };

function liveTarget() { return M.faded ? 0 : M.ducked ? BIDA.music.master * BIDA.music.duck : BIDA.music.master; }
function applyVolume(v) {
  M.current = v;
  if (M.kind === 'youtube' && M.yt && M.ytReady) { try { M.yt.setVolume(Math.round(v * 100)); } catch (e) { } }
  else if (M.kind === 'local' && MUSIC_BUS) MUSIC_BUS.gain.value = v;
  else if (M.kind === 'spotify') spotifySetVolume(v);
  $$('.vol-now').forEach(b => b.style.width = Math.round(v * 100) + '%');
}
// Timer-based (not rAF) so fades still finish if the page is in the background,
// e.g. when the host switches to the Spotify app on their phone.
function fadeTo(target, ms, done) {
  clearInterval(M.raf);
  const from = M.current, t0 = performance.now();
  if (ms <= 0 || Math.abs(from - target) < .005) { applyVolume(target); done?.(); return; }
  M.raf = setInterval(() => {
    const k = clamp((performance.now() - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3);
    applyVolume(from + (target - from) * e);
    if (k >= 1) { clearInterval(M.raf); done?.(); }
  }, 30);
}
function needPro(feature) { if (BIDA.premium) return false; openPremium(feature); return true; }
function needSource() {
  if (M.kind) return false;
  if (ytLinks().length) { playYouTube(Math.max(0, BIDA.music.ytIdx)); return true; }   // play the saved list
  goTab('music'); if (!$('#live').hidden) closeLive();
  toast('Pumili muna ng music dito'); return true;
}
/* Talk = quick duck while speaking */
function duckDown() {
  if (needPro('Talk fader')) return;
  clearTimeout(M.duckT);                       // speaking again during the wait: stay down
  M.ducked = true; if (!M.faded) fadeTo(liveTarget(), BIDA.music.fade);
  $$('.talk-btn').forEach(b => { b.classList.add('on'); b.classList.remove('waiting'); });
}
function duckUp() {
  if (!M.ducked) return;
  M.ducked = false; clearTimeout(M.duckT);
  $$('.talk-btn').forEach(b => b.classList.remove('on'));
  // Music comes back at the same speed it went down
  if (!M.faded) fadeTo(liveTarget(), BIDA.music.fade);
}
function bindTalk(btn) {
  if (!btn || btn._bound) return; btn._bound = true;
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (BIDA.music.mode === 'hold') { duckDown(); try { btn.setPointerCapture(e.pointerId); } catch (x) { } }
    else (M.ducked ? duckUp() : duckDown());
  });
  const up = () => { if (BIDA.music.mode === 'hold') duckUp(); };
  btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up);
  btn.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); BIDA.music.mode === 'hold' ? duckDown() : (M.ducked ? duckUp() : duckDown()); } });
  btn.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') up(); });
  btn.addEventListener('contextmenu', e => e.preventDefault());
}
/* Fade = smooth stop / smooth start (fixed length) */
const FADE_BTN_MS = 1500;
function fadeToggle() {
  if (needPro('Fade in / out') || needSource()) return;
  clearTimeout(M.fadeT);
  if (M.faded || !M.playing) {
    M.faded = false;
    if (!M.playing) { applyVolume(0); musicPlay(); }
    fadeTo(liveTarget(), FADE_BTN_MS);
  } else {
    M.faded = true;
    fadeTo(0, FADE_BTN_MS, () => { if (M.faded) musicPause(); });
  }
  updateBar();
}
function setMaster(v) {
  BIDA.music.master = v; saveState();
  clearInterval(M.raf); applyVolume(liveTarget());
  $$('.mb-vol').forEach(r => { if (+r.value !== v) r.value = v; });
}
function setDuck(v) {
  BIDA.music.duck = v; saveState();
  if (M.ducked && !M.faded) fadeTo(liveTarget(), 120);
  $$('.o-duck').forEach(o => o.textContent = Math.round(v * 100) + '%');
  $$('input.duck-r').forEach(r => { if (+r.value !== v) r.value = v; });
}
/* Talk settings — only three, same controls in the Music tab and the music bar panel:
   how low, how fast (down AND back up), and whether the music comes back by itself. */
function talkControls(where) {
  const m = BIDA.music;
  return `
    <div class="slider-row"><label for="duck-${where}">Hihina ang volume hanggang</label><output class="o-duck">${Math.round(m.duck * 100)}%</output>
      <input type="range" class="duck-r" id="duck-${where}" min="0" max="0.6" step="0.01" value="${m.duck}" oninput="setDuck(+this.value)"></div>
    <div class="slider-row"><label for="spd-${where}">Bilis ng paghina</label><output class="o-spd">${(m.fade / 1000).toFixed(1)}s</output>
      <input type="range" class="spd-r" id="spd-${where}" min="100" max="3000" step="100" value="${m.fade}" oninput="setTalkSpeed(+this.value)"></div>
    <label class="toggle"><input type="checkbox" class="ar-cb" ${m.mode === 'hold' ? 'checked' : ''} onchange="setAutoReturn(this.checked)">
      Babalik ang music pagkatapos magsalita</label>
    <p class="muted ar-hint">${m.mode === 'hold' ? 'I-hold ang Talk habang nagsasalita, babalik ang music pag binitawan.' : 'I-tap ang Talk para humina, i-tap ulit para bumalik.'} Same bilis pababa at pabalik.</p>`;
}
function setTalkSpeed(ms) {
  BIDA.music.fade = ms; saveState();
  $$('.o-spd').forEach(o => o.textContent = (ms / 1000).toFixed(1) + 's');
  $$('input.spd-r').forEach(r => { if (+r.value !== ms) r.value = ms; });
}
function setAutoReturn(on) {
  BIDA.music.mode = on ? 'hold' : 'toggle'; saveState();
  if (on && M.ducked) duckUp();
  $$('input.ar-cb').forEach(c => c.checked = on);
  $$('.ar-hint').forEach(p => p.textContent = (on ? 'I-hold ang Talk habang nagsasalita, babalik ang music pag binitawan.' : 'I-tap ang Talk para humina, i-tap ulit para bumalik.') + ' Same bilis pababa at pabalik.');
}

/* ---- YouTube (IFrame API: full volume control) ---- */
function parseYouTube(url) {
  try {
    const u = new URL(url.trim());
    const list = u.searchParams.get('list') || '';
    let id = u.searchParams.get('v') || '';
    if (/youtu\.be$/.test(u.hostname)) id = u.pathname.slice(1);
    const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/); if (m) id = m[2];
    if (!id && !list) return null;
    return { id, list };
  } catch (e) { return null; }
}
let ytApiP;
function ytApi() {
  if (window.YT && YT.Player) return Promise.resolve();
  if (!ytApiP) ytApiP = new Promise(res => {
    window.onYouTubeIframeAPIReady = res;
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  });
  return ytApiP;
}
/* Saved YouTube links: 5 free, more with Premium. With 2+ links a floating playlist panel appears. */
function ytLinks() { return BIDA.music.ytLinks; }
function ytCanUse(i) { return BIDA.premium || i < BIDA_CONFIG.freeYtLinks; }
function ytLabel(l, i) { return l.title || (l.list ? `YouTube playlist ${i + 1}` : `YouTube video ${i + 1}`); }
async function addYouTube() {
  const inp = $('#yt-url'), p = parseYouTube(inp.value || '');
  if (!p || !/^[\w-]{0,64}$/.test(p.id) || !/^[\w-]{0,64}$/.test(p.list)) { toast('Hindi valid ang YouTube link'); return; }
  const links = ytLinks();
  const dup = links.findIndex(l => l.v === p.id && l.list === p.list);
  if (dup >= 0) { inp.value = ''; playYouTube(dup); return; }
  if (!BIDA.premium && links.length >= BIDA_CONFIG.freeYtLinks) { openPremium(`Higit sa ${BIDA_CONFIG.freeYtLinks} YouTube links`); return; }
  const link = { v: p.id, list: p.list, title: '', thumb: p.id ? `https://i.ytimg.com/vi/${p.id}/mqdefault.jpg` : '' };
  links.push(link); inp.value = ''; saveState();
  fetchYtInfo(link);
  renderMusic(); renderPlaylist();
  playYouTube(links.length - 1);
}
// Title + thumbnail from YouTube's public oEmbed endpoint (no key). Falls back quietly if blocked.
async function fetchYtInfo(link) {
  try {
    const u = link.list && !link.v ? `https://www.youtube.com/playlist?list=${link.list}` : `https://www.youtube.com/watch?v=${link.v}`;
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(u));
    if (!r.ok) return;
    const j = await r.json();
    if (j.title) link.title = String(j.title).slice(0, 120);
    if (/^https:\/\/i\.ytimg\.com\//.test(j.thumbnail_url || '')) link.thumb = j.thumbnail_url;
    saveState(); if (BIDA.tab === 'music' && !$('#app').hidden) renderMusic(); renderPlaylist();
  } catch (e) { }
}
async function delYouTube(i) {
  const l = ytLinks()[i]; if (!l) return;
  if (!await askConfirm(`Tanggalin ang "${ytLabel(l, i)}"?`, 'Tanggalin')) return;
  ytLinks().splice(i, 1);
  if (BIDA.music.ytIdx === i) BIDA.music.ytIdx = -1; else if (BIDA.music.ytIdx > i) BIDA.music.ytIdx--;
  saveState(); renderMusic(); renderPlaylist();
}
async function playYouTube(i) {
  const l = ytLinks()[i]; if (!l) return;
  if (!ytCanUse(i)) { openPremium(`Higit sa ${BIDA_CONFIG.freeYtLinks} YouTube links`); return; }
  BIDA.music.ytIdx = i; saveState();
  stopOtherSources('youtube');
  await ytApi();
  try { M.yt?.destroy?.(); } catch (e) { }
  // The player lives in the music bar's preview area so it keeps playing on every tab
  $('#yt-dock').innerHTML = '<div id="yt-player"></div>';
  M.ytReady = false; M.kind = 'youtube'; M.faded = false; M.title = ytLabel(l, i);
  // controls:0 — play/pause only from the music bar, so a stray tap on the preview can't stop the party
  const vars = { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1 };
  if (l.list) { vars.listType = 'playlist'; vars.list = l.list; }
  M.yt = new YT.Player('yt-player', {
    videoId: l.v || undefined, playerVars: vars,
    events: {
      onReady: e => { M.ytReady = true; M.wantPlay = true; applyVolume(liveTarget()); e.target.playVideo(); },
      onStateChange: e => {
        M.playing = e.data === YT.PlayerState.PLAYING;
        if (e.data === YT.PlayerState.PAUSED) guardResume('youtube');
        if (e.data === YT.PlayerState.ENDED && M.wantPlay) ytAdvance();
        if (M.playing) setMediaSession();
        try { M.title = M.yt.getVideoData().title || ytLabel(l, i); } catch (x) { }
        if (M.playing && !l.title && !l.list && M.title) { l.title = M.title.slice(0, 120); saveState(); renderPlaylist(); }
        try { const pl = M.yt.getPlaylist(); M.pos = pl ? `${M.yt.getPlaylistIndex() + 1} / ${pl.length}` : ''; } catch (x) { M.pos = ''; }
        M.upNext = [];
        updateBar(); renderPlaylist();
      }
    }
  });
  updateBar('YouTube'); renderPlaylist();
  if (BIDA.tab === 'music' && !$('#app').hidden) renderMusic();
}
// A single video ended (or a playlist finished): continue with the next saved link the user can use
function ytAdvance(dir = 1) {
  const n = ytLinks().length; if (n < 2) return false;
  for (let s = 1; s < n; s++) {
    const j = (BIDA.music.ytIdx + dir * s + n) % n;
    if (ytCanUse(j)) { playYouTube(j); return true; }
  }
  return false;
}
function ytListHTML() {
  const links = ytLinks();
  if (!links.length) return '<p class="muted">Wala pang naka-save. I-paste ang link sa taas.</p>';
  return `<ul class="yt-list">${links.map((l, i) => {
    const now = i === BIDA.music.ytIdx && M.kind === 'youtube', ok = ytCanUse(i);
    return `<li class="${now ? 'now' : ''} ${ok ? '' : 'locked'}">
      <button class="yt-play" onclick="playYouTube(${i})" aria-label="I-play ${esc(ytLabel(l, i))}">
        ${l.thumb ? `<img src="${esc(l.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="yt-ph">${ic('music')}</span>`}
        <span class="yt-t"><b>${esc(ytLabel(l, i))}</b><small>${l.list ? 'Playlist' : 'Video'}${now ? (M.playing ? ' · tumutugtog' : ' · naka-pause') : ''}${ok ? '' : ' · Premium'}</small></span>
        ${ok ? ic(now && M.playing ? 'pause' : 'play') : ic('lock')}
      </button>
      <button class="icon-btn icon-btn--plain yt-del" onclick="delYouTube(${i})" aria-label="Tanggalin">${ic('trash')}</button></li>`;
  }).join('')}</ul>`;
}
/* Floating playlist panel (shows when 2+ links are saved) */
function renderPlaylist() {
  const fab = $('#pl-fab'), panel = $('#pl-panel'); if (!fab) return;
  const n = ytLinks().length;
  fab.hidden = n < 2;
  $('#pl-count').textContent = n;
  if (n < 2) { panel.hidden = true; return; }
  if (!panel.hidden) $('#pl-list').innerHTML = ytListHTML();
}
function togglePlaylist(force) {
  const panel = $('#pl-panel'), open = force ?? panel.hidden;
  panel.hidden = !open;
  $('#pl-fab').setAttribute('aria-expanded', open);
  if (open) { toggleBar(false); $('#pl-list').innerHTML = ytListHTML(); }
}

/* ---- Local files (Web Audio gain) ---- */
function loadLocal(files) {
  if (needPro('Music player')) return;
  const arr = Array.from(files).filter(f => /^audio\//.test(f.type) || /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f.name));
  if (!arr.length) return;
  stopOtherSources('local');
  M.queue.forEach(q => URL.revokeObjectURL(q.url));
  M.queue = arr.map(f => ({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f) }));
  M.kind = 'local'; M.faded = false; playLocal(0);
}
function ensureAudio() {
  if (M.audio) return M.audio;
  const a = new Audio(); a.preload = 'auto';
  a.addEventListener('ended', () => playLocal(M.qi + 1));
  a.addEventListener('play', () => { M.playing = true; setMediaSession(); updateBar(); });
  a.addEventListener('pause', () => { M.playing = false; updateBar(); if (!a.ended) guardResume('local'); });
  M.audio = a; ac();
  M.mediaSrc = AC.createMediaElementSource(a); M.mediaSrc.connect(MUSIC_BUS);
  return a;
}
function playLocal(i) {
  if (!M.queue.length) return;
  M.qi = (i + M.queue.length) % M.queue.length;
  const a = ensureAudio(); a.src = M.queue[M.qi].url; M.title = M.queue[M.qi].name;
  M.pos = `${M.qi + 1} / ${M.queue.length}`;
  M.upNext = M.queue.slice(M.qi + 1, M.qi + 4).map(q => q.name);
  applyVolume(liveTarget());
  M.wantPlay = true; a.play().catch(() => { }); updateBar('Sariling files');
}

/* ---- Spotify (Web Playback SDK on desktop · Connect control on mobile) ---- */
const SP_SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state';
function spRedirect() { return location.origin + location.pathname; }
function spToken() {
  try { const t = JSON.parse(localStorage.getItem('bidavibe_sp') || 'null'); return t && t.exp > Date.now() + 30000 ? t : null; } catch (e) { return null; }
}
async function spLogin() {
  if (needPro('Spotify')) return;
  if (!BIDA_CONFIG.spotifyClientId) { toast('Kailangan munang i-setup ang Spotify Client ID'); return; }
  const v = Array.from(crypto.getRandomValues(new Uint8Array(48)), b => ('0' + b.toString(16)).slice(-2)).join('');
  const dig = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  const ch = btoa(String.fromCharCode(...new Uint8Array(dig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  sessionStorage.setItem('bidavibe_sp_v', v);
  const q = new URLSearchParams({ client_id: BIDA_CONFIG.spotifyClientId, response_type: 'code', redirect_uri: spRedirect(), scope: SP_SCOPES, code_challenge_method: 'S256', code_challenge: ch });
  location.href = 'https://accounts.spotify.com/authorize?' + q;
}
async function spHandleRedirect() {
  const p = new URLSearchParams(location.search), code = p.get('code');
  if (!code || !BIDA_CONFIG.spotifyClientId) return;
  history.replaceState(null, '', spRedirect());
  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: BIDA_CONFIG.spotifyClientId, grant_type: 'authorization_code', code, redirect_uri: spRedirect(), code_verifier: sessionStorage.getItem('bidavibe_sp_v') || '' })
    });
    const j = await r.json(); if (!j.access_token) throw new Error(j.error || 'token');
    localStorage.setItem('bidavibe_sp', JSON.stringify({ at: j.access_token, exp: Date.now() + j.expires_in * 1000 }));
    BIDA.music.src = 'spotify'; saveState(); toast('Connected sa Spotify!');
  } catch (e) { toast('Hindi naka-connect sa Spotify'); }
}
function spApi(path, opts = {}) {
  const t = spToken(); if (!t) return Promise.reject(new Error('no token'));
  return fetch('https://api.spotify.com/v1' + path, Object.assign({ headers: { Authorization: 'Bearer ' + t.at, 'Content-Type': 'application/json' } }, opts));
}
const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
function spInitSDK() {
  return new Promise(res => {
    if (window.Spotify) return res();
    window.onSpotifyWebPlaybackSDKReady = res;
    const s = document.createElement('script'); s.src = 'https://sdk.scdn.co/spotify-player.js'; document.head.appendChild(s);
  });
}
function parseSpotify(url) {
  const m = String(url).match(/(playlist|album|track|artist)[/:]([A-Za-z0-9]{10,})/);
  return m ? { type: m[1], id: m[2], uri: `spotify:${m[1]}:${m[2]}` } : null;
}
async function spPlay() {
  if (needPro('Spotify')) return;
  const p = parseSpotify($('#sp-url').value);
  if (!p) { toast('I-paste ang Spotify playlist link'); return; }
  BIDA.music.spUrl = $('#sp-url').value; saveState();
  if (!spToken()) { spLogin(); return; }
  stopOtherSources('spotify'); M.kind = 'spotify'; M.faded = false;
  const body = p.type === 'track' ? { uris: [p.uri] } : { context_uri: p.uri };
  try {
    if (!isMobileUA) {
      await spInitSDK();
      if (!M.sp) {
        M.sp = new Spotify.Player({ name: 'Bida-Vibe', getOAuthToken: cb => cb(spToken()?.at), volume: BIDA.music.master });
        M.sp.addListener('ready', ({ device_id }) => { M.spDevice = device_id; });
        M.sp.addListener('player_state_changed', s => {
          if (!s) return; M.playing = !s.paused; M.title = s.track_window?.current_track?.name || 'Spotify';
          if (s.paused) guardResume('spotify');
          M.upNext = (s.track_window?.next_tracks || []).map(t => t.name); updateBar();
        });
        M.sp.addListener('account_error', () => toast('Spotify Premium ang kailangan para dito'));
        await M.sp.connect();
        for (let i = 0; i < 30 && !M.spDevice; i++) await new Promise(r => setTimeout(r, 200));
      }
      M.spMode = 'sdk';
      await spApi('/me/player/play?device_id=' + M.spDevice, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      // Mobile: control the Spotify app that's already open on this phone (Spotify Connect)
      M.spMode = 'connect';
      const r = await spApi('/me/player/play', { method: 'PUT', body: JSON.stringify(body) });
      if (r.status === 404) { toast('Buksan muna ang Spotify app at mag-play ng kahit ano, tapos subukan ulit'); return; }
      M.playing = true; M.title = 'Spotify';
    }
    M.wantPlay = true; updateBar('Spotify');
  } catch (e) { toast('May problema sa Spotify — i-connect ulit'); }
}
let spVolT;
function spotifySetVolume(v) {
  if (M.spMode === 'sdk' && M.sp) { M.sp.setVolume(v).catch(() => { }); return; }
  const now = Date.now(); clearTimeout(spVolT);
  const send = () => { M.lastSpSet = Date.now(); spApi('/me/player/volume?volume_percent=' + Math.round(v * 100), { method: 'PUT' }).catch(() => { }); };
  if (now - M.lastSpSet > 160) send(); else spVolT = setTimeout(send, 160);
}

function stopOtherSources(keep) {
  if (keep !== 'youtube' && M.yt) { try { M.yt.pauseVideo(); } catch (e) { } }
  if (keep !== 'local' && M.audio) M.audio.pause();
  if (keep !== 'spotify' && M.sp) M.sp.pause().catch(() => { });
  if (keep !== 'spotify' && M.spMode === 'connect') spApi('/me/player/pause', { method: 'PUT' }).catch(() => { });
}
/* Music keeps playing unless the host presses Pause or Fade out.
   M.wantPlay = what the host asked for. If anything else pauses the player (a dialog, a file
   picker, a re-render, the phone briefly backgrounding the page), we quietly resume it. */
function guardResume(src) {
  if (!M.wantPlay || M.faded || M.kind !== src) return;
  clearTimeout(M.resumeT);
  M.resumeT = setTimeout(() => { if (M.wantPlay && !M.faded && !M.playing && M.kind === src) { applyVolume(liveTarget()); musicPlay(); } }, 350);
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && M.wantPlay && !M.faded && !M.playing && M.kind) { if (AC?.state === 'suspended') AC.resume(); musicPlay(); }
});
function setMediaSession() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: M.title || 'Bida-Vibe', artist: 'Bida-Vibe', album: BIDA.event.name || eventType().label });
    navigator.mediaSession.setActionHandler('play', () => { M.wantPlay = true; musicPlay(); });
    navigator.mediaSession.setActionHandler('pause', () => musicPause());
    navigator.mediaSession.setActionHandler('nexttrack', () => musicSkip(1));
    navigator.mediaSession.setActionHandler('previoustrack', () => musicSkip(-1));
  } catch (e) { }
}
function musicPlay() {
  M.wantPlay = true;
  if (M.kind === 'youtube' && M.yt) M.yt.playVideo();
  else if (M.kind === 'local' && M.audio) M.audio.play().catch(() => { });
  else if (M.kind === 'spotify') { if (M.spMode === 'sdk' && M.sp) M.sp.resume(); else { spApi('/me/player/play', { method: 'PUT' }).catch(() => { }); M.playing = true; updateBar(); } }
}
function musicPause() {
  M.wantPlay = false; clearTimeout(M.resumeT);
  if (M.kind === 'youtube' && M.yt) M.yt.pauseVideo();
  else if (M.kind === 'local' && M.audio) M.audio.pause();
  else if (M.kind === 'spotify') { if (M.spMode === 'sdk' && M.sp) M.sp.pause(); else { spApi('/me/player/pause', { method: 'PUT' }).catch(() => { }); M.playing = false; updateBar(); } }
}
// YouTube (up to 5 links) is free; Spotify and local files can only be loaded with Premium in the first place
function musicToggle() {
  if (needSource()) return;
  if (M.playing) musicPause();
  else { if (M.faded) { M.faded = false; applyVolume(liveTarget()); } musicPlay(); }
}
function musicSkip(d) {
  if (needSource()) return;
  if (M.kind === 'youtube' && M.yt) {
    const cur = ytLinks()[BIDA.music.ytIdx];
    // A single video: next/previous moves through the saved links. A playlist: through its videos.
    if (!cur || !cur.list) { if (!ytAdvance(d)) { try { M.yt.seekTo(0); } catch (e) { } } return; }
    try { d > 0 ? M.yt.nextVideo() : M.yt.previousVideo(); } catch (e) { }
  }
  else if (M.kind === 'local') playLocal(M.qi + d);
  else if (M.kind === 'spotify') {
    if (M.spMode === 'sdk' && M.sp) d > 0 ? M.sp.nextTrack() : M.sp.previousTrack();
    else spApi('/me/player/' + (d > 0 ? 'next' : 'previous'), { method: 'POST' }).catch(() => { });
  }
}

/* ---- The music bar ---- */
let barSrc = '';
function updateBar(src) {
  if (src) barSrc = src;
  rmtPublish();
  const has = !!M.kind;
  $('#mb-title').textContent = has ? (M.title || barSrc) : 'Walang tumutugtog';
  $('#mb-sub').textContent = has ? [barSrc, M.pos, M.faded ? 'faded out' : ''].filter(Boolean).join(' · ') : (ytLinks().length ? 'Tap para i-play ang naka-save' : 'Tap para pumili ng music');
  $$('.mb-play-ic').forEach(u => u.setAttribute('href', M.playing ? '#i-pause' : '#i-play'));
  $$('.mb-fade').forEach(b => { b.classList.toggle('on', M.faded); b.querySelector('span').textContent = M.faded || (has && !M.playing) ? 'Fade in' : 'Fade out'; });
  $$('.mb-vol').forEach(r => r.value = BIDA.music.master);
  $$('.o-duck').forEach(o => o.textContent = Math.round(BIDA.music.duck * 100) + '%');
  const up = $('#mb-upnext');
  if (up) up.innerHTML = has
    ? (M.kind === 'local' ? M.queue.map((t, i) => `<li class="${i === M.qi ? 'now' : ''}" onclick="playLocal(${i})">${ic(i === M.qi && M.playing ? 'pause' : 'play')}<span>${esc(t.name)}</span></li>`).join('')
      : M.upNext.length ? M.upNext.map(n => `<li>${ic('next')}<span>${esc(n)}</span></li>`).join('')
        : `<li class="empty">${M.pos ? 'Playlist: ' + esc(M.pos) : 'Isang track lang ang naka-load'}</li>`)
    : `<li class="empty"><button class="btn btn--sm btn--ink" onclick="goTab('music');toggleBar(false)">Pumili ng music</button></li>`;
  $('#mbar').classList.toggle('has-music', has);
  $('#mbar').classList.toggle('playing', M.playing);
}
function toggleBar(force) {
  const b = $('#mbar'), open = force ?? !b.classList.contains('open');
  b.classList.toggle('open', open);
  $('#mb-more').setAttribute('aria-expanded', open);
}
function openBar(v) { toggleBar(v); }
function barInfoClick() {
  if (!M.kind) {
    if (ytLinks().length) { playYouTube(Math.max(0, BIDA.music.ytIdx)); return; }
    goTab('music'); if (!$('#live').hidden) closeLive(); return;
  }
  toggleBar();
}

/* ---- Auto-duck via microphone ---- */
const MIC = { stream: null, an: null, raf: 0, above: 0, below: 0, auto: false };
async function setAutoDuck(on) {
  if (on && needPro('Auto-fade')) { renderMusic(); return; }
  BIDA.music.autoDuck = on; saveState();
  if (!on) { cancelAnimationFrame(MIC.raf); MIC.stream?.getTracks().forEach(t => t.stop()); MIC.stream = null; renderMusic(); return; }
  try {
    MIC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
    const x = ac(), src = x.createMediaStreamSource(MIC.stream); MIC.an = x.createAnalyser(); MIC.an.fftSize = 1024; src.connect(MIC.an);
    const buf = new Float32Array(MIC.an.fftSize); let last = performance.now();
    const loop = now => {
      MIC.an.getFloatTimeDomainData(buf);
      let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const lvl = clamp(Math.sqrt(s / buf.length) * 8, 0, 1);
      const thr = .9 - BIDA.music.sens * .8, dt = now - last; last = now;
      $$('.vu i').forEach(v => v.style.width = Math.round(lvl * 100) + '%');
      if (lvl > thr) { MIC.above += dt; MIC.below = 0; if (MIC.above > 120 && !M.ducked) { duckDown(); MIC.auto = true; } }
      else { MIC.below += dt; MIC.above = 0; if (MIC.below > 1200 && M.ducked && MIC.auto) { duckUp(); MIC.auto = false; } }
      MIC.raf = requestAnimationFrame(loop);
    };
    MIC.raf = requestAnimationFrame(loop);
    renderMusic(); toast('Auto-fade ON — hihina ang music pag nagsalita ka');
  } catch (e) { BIDA.music.autoDuck = false; saveState(); renderMusic(); micHelp(e, () => setAutoDuck(true)); }
}

/* ---- Music tab: setup only ---- */
function renderMusic() {
  const m = BIDA.music;
  $('#panel-music').innerHTML = `
    <div class="panel-head"><div><h2>Music setup</h2>
      <p>Dito ka pipili ng music. Yung play, next, fade at Talk, nasa music bar sa baba kahit anong tab ka.</p></div></div>
    <div class="src-tabs" role="tablist">
      ${[['youtube', 'YouTube', BIDA.premium ? 'Walang limit' : `${BIDA_CONFIG.freeYtLinks} libre`], ['spotify', 'Spotify', 'Premium'], ['local', 'Sariling files', 'Premium'], ['link', 'Iba pa', 'Link lang']].map(([id, l, s]) =>
        `<button class="src-tab ${m.src === id ? 'on' : ''}" role="tab" aria-selected="${m.src === id}" onclick="setMusicSrc('${id}')">${l}<small>${s}</small></button>`).join('')}
    </div>
    <div class="card stack">
      <div ${m.src === 'youtube' ? '' : 'hidden'}>
        <div class="field"><label for="yt-url">YouTube o YouTube Music link (video o playlist)</label>
          <div class="yt-add"><input class="input" id="yt-url" placeholder="https://www.youtube.com/…" onkeydown="if(event.key==='Enter')addYouTube()">
          <button class="btn btn--chili" onclick="addYouTube()">${ic('plus')}Idagdag</button></div></div>
        <div class="yt-head"><span class="field-label">Naka-save</span><small class="muted">${m.ytLinks.length}${BIDA.premium ? '' : ` / ${BIDA_CONFIG.freeYtLinks} libre`}</small></div>
        ${ytListHTML()}
        ${braveTipHTML()}
      </div>
      <div ${m.src === 'spotify' ? '' : 'hidden'}>
        ${BIDA_CONFIG.spotifyClientId ? `
        <div class="field"><label for="sp-url">Spotify playlist / album link</label>
          <input class="input" id="sp-url" placeholder="https://open.spotify.com/playlist/…" value="${esc(m.spUrl)}"></div>
        <button class="btn btn--leaf btn--block" style="margin-top:12px" onclick="spPlay()">${ic('play')}${spToken() ? 'I-load' : 'Connect at i-load'}</button>
        <p class="note" style="margin-top:12px">Kailangan ng <b>Spotify Premium</b>. ${isMobileUA ? 'Sa phone o tablet, buksan muna ang Spotify app. Yun ang kokontrolin, pati fade.' : 'Sa computer, dito mismo tutugtog.'}</p>` : `
        <p class="note">Hindi pa naka-setup ang Spotify (kailangan ng Client ID ng developer).</p>`}
      </div>
      <div ${m.src === 'local' ? '' : 'hidden'}>
        <button class="btn btn--turq btn--block" onclick="${BIDA.premium ? `$('#local-files').click()` : `openPremium('Music player')`}">${ic('upload')}Pumili ng music files</button>
        <input type="file" id="local-files" accept="audio/*" multiple hidden onchange="loadLocal(this.files);this.value=''">
        <p class="muted" style="margin-top:8px">Mp3 o m4a galing sa device mo. Hindi 'to ina-upload kahit saan.</p>
      </div>
      <div ${m.src === 'link' ? '' : 'hidden'}>
        <div class="field"><label for="ext-url">Apple Music, Deezer, SoundCloud…</label>
          <input class="input" id="ext-url" placeholder="I-paste ang link" value="${esc(m.link)}" onchange="BIDA.music.link=this.value;saveState()"></div>
        <button class="btn btn--ink btn--block" style="margin-top:12px" onclick="openExt()">Buksan sa app ${ic('arrow')}</button>
        <p class="note" style="margin-top:12px">Walang fade dito kasi hindi pinapa-control ng mga app na 'to ang volume sa ibang website.</p>
      </div>
    </div>
    <div class="card stack">
      <h3>Talk</h3>
      ${talkControls('tab')}
      <label class="toggle"><input type="checkbox" ${m.autoDuck ? 'checked' : ''} onchange="setAutoDuck(this.checked)">Auto-fade gamit ang mic (beta)</label>
      ${m.autoDuck ? `<div class="vu"><i></i></div>
      <div class="slider-row"><label for="sl-sens">Mic sensitivity</label><output id="o-sens">${Math.round(m.sens * 100)}%</output>
        <input type="range" id="sl-sens" min="0.05" max="1" step="0.05" value="${m.sens}" oninput="BIDA.music.sens=+this.value;saveState();$('#o-sens').textContent=Math.round(this.value*100)+'%'"></div>` : ''}
    </div>`;
}
function setMusicSrc(id) { BIDA.music.src = id; saveState(); renderMusic(); }
function openExt() {
  const u = ($('#ext-url').value || '').trim(); if (!/^https?:\/\//.test(u)) { toast('I-paste muna ang link'); return; }
  BIDA.music.link = u; saveState(); window.open(u, '_blank', 'noopener');
}

/* ============================================================
   VIDEOKE — Pinoy-style: every song has a number code.
   Library = karaoke/library.json in the repo (admin curates it in the app,
   saved through the same GitHub token as the sound pads). Each song is a
   YouTube karaoke video, so nothing copyrighted is hosted here.
   Hosts can also add their own songs — saved only on their device.
   ============================================================ */
const VK_LIB_PATH = 'karaoke/library.json';
const VK = { lib: [], loaded: false, input: '', q: '', genre: '', yt: null, cur: null, scoreT: 0, admin: { busy: false, q: '', page: 0, msg: '', dup: false }, letter: '', artist: '' };
const vkNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
function vkCleanSong(s) {
  const c = parseInt(s && s.c, 10), y = String(s && s.y || '');
  if (!(c >= 1 && c <= 99999) || !/^[\w-]{11}$/.test(y)) return null;
  return { c, y, t: String(s.t || 'Kanta').slice(0, 80), a: String(s.a || '').slice(0, 60), g: String(s.g || '').slice(0, 20) };
}
let vkChecked = null;   // the BIDA.vk object we've already validated (saved data is untrusted, so check it once)
function vkState() {
  if (BIDA.vk && BIDA.vk === vkChecked) return BIDA.vk;
  const v = BIDA.vk && typeof BIDA.vk === 'object' ? BIDA.vk : {};
  vkChecked = BIDA.vk = {
    queue: (Array.isArray(v.queue) ? v.queue : []).filter(q => q && Number.isInteger(q.c)).slice(0, 100).map(q => ({ id: String(q.id || Math.random().toString(36).slice(2, 9)).slice(0, 12), c: q.c, singer: String(q.singer || '').slice(0, 30),
      av: /^[a-z]{2,10}$/.test(q.av) ? q.av : '', src: q.src === 'guest' ? 'guest' : '' })),
    mine: (Array.isArray(v.mine) ? v.mine : []).map(vkCleanSong).filter(Boolean).slice(0, 200),
    score: v.score !== false, lastSinger: String(v.lastSinger || '').slice(0, 30),
    room: v.room && /^[A-Za-z0-9]{24}$/.test(v.room.id) && typeof v.room.owner === 'string' && v.room.exp > Date.now()
      ? { id: v.room.id, owner: v.room.owner.slice(0, 128), exp: +v.room.exp } : null
  };
  return BIDA.vk;
}
async function loadVkLibrary(force) {
  if (VK.loaded && !force) return;
  try {
    const r = await fetch(VK_LIB_PATH + '?t=' + Math.floor(Date.now() / 6e5), { cache: 'no-cache' });
    const j = r.ok ? await r.json() : { songs: [] };
    VK.lib = (j.songs || []).map(vkCleanSong).filter(Boolean);
  } catch (e) { VK.lib = []; }
  VK.loaded = true;
}
const vkAll = () => [...VK.lib, ...vkState().mine];
const vkSong = c => vkAll().find(s => s.c === c);
// First letter of a title, for the A–Z filter ("#" for numbers and symbols)
const vkFirst = t => { const ch = vkNorm(t).charAt(0); return /[a-z]/.test(ch) ? ch.toUpperCase() : '#'; };
function vkArtists() {
  const m = new Map();
  vkAll().forEach(s => { const k = vkNorm(s.a); if (k && !m.has(k)) m.set(k, s.a); });
  return [...m].sort((a, b) => a[1].localeCompare(b[1]));
}
function vkSearch() {
  const q = vkNorm(VK.q);
  let list = vkAll();
  if (VK.letter) list = list.filter(s => vkFirst(s.t) === VK.letter);
  if (VK.artist) list = list.filter(s => vkNorm(s.a) === VK.artist);
  if (q) list = list.filter(s => String(s.c).startsWith(q) || vkNorm(s.t).includes(q) || vkNorm(s.a).includes(q));
  return list.sort((a, b) => vkNorm(a.t).localeCompare(vkNorm(b.t)) || a.c - b.c);
}

/* ---- Videoke tab ---- */
function renderVideoke() {
  const v = vkState();
  if (!VK.loaded) { loadVkLibrary().then(() => { if (BIDA.tab === 'videoke') renderVideoke(); }); }
  const typed = VK.input, match = typed.length === 5 ? vkSong(+typed) : null;
  const letters = [...new Set(vkAll().map(s => vkFirst(s.t)))].sort((a, b) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b));
  const artists = vkArtists();
  if (VK.letter && !letters.includes(VK.letter)) VK.letter = '';
  if (VK.artist && !artists.some(([k]) => k === VK.artist)) VK.artist = '';
  const res = vkSearch(), shown = res.slice(0, 90);
  const now = VK.cur && vkSong(VK.cur.c);
  $('#panel-videoke').innerHTML = `
    <div class="panel-head"><div><h2>Videoke</h2>
      <p>I-type ang code o hanapin ang kanta, i-reserve, tapos kanta na. ${vkAll().length} songs sa library.</p></div>
      <button class="btn btn--chili" onclick="vkStart()" ${v.queue.length || VK.cur ? '' : 'disabled'}>${ic('play')}${VK.cur ? 'Buksan ang screen' : 'Simulan'}</button></div>
    <div class="vk-top">
      <div class="vk-remote card">
        <div class="vk-display" aria-live="polite">
          <div class="vk-code">${(typed || '').padEnd(5, '–').split('').map(ch => `<span>${ch}</span>`).join('')}</div>
          <div class="vk-title">${typed.length === 5 ? (match ? `${esc(match.t)}<small>${esc(match.a)}</small>` : 'Walang kantang ganyan ang code') : 'I-type ang 5-digit code'}</div>
        </div>
        <div class="vk-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button onclick="vkKey('${n}')">${n}</button>`).join('')}
          <button class="vk-k-clr" onclick="vkKey('C')">Clear</button><button onclick="vkKey('0')">0</button>
          <button class="vk-k-res" onclick="vkReserveTyped()" ${match ? '' : 'disabled'}>Reserve</button></div>
      </div>
      <div class="vk-queue card">
        <h3>Reserved <small class="muted">(${v.queue.length})</small></h3>
        ${now ? `<div class="vk-now">${ic('mic')}<div><b>${esc(now.t)}</b><small>Kumakanta: ${esc(VK.cur.singer || '—')} · ${now.c}</small></div></div>` : ''}
        ${v.queue.length ? `<ol class="vk-q">${v.queue.map((q, i) => { const s = vkSong(q.c); return `<li><span class="vk-qav">${vkAvatar(q.av || vkAvatarFor(q.singer), 34)}</span>
          <div><b>${esc(s ? s.t : 'Code ' + q.c)}</b><small>${i + 1}. ${q.singer ? esc(q.singer) : 'Bisita'} · ${q.c}${q.src === 'guest' ? ' · via link' : ''}</small></div>
          <span class="admin-act"><button class="icon-btn icon-btn--plain" onclick="vkQMove(${i},-1)" ${i ? '' : 'disabled'} aria-label="Taas">${ic('up')}</button>
          <button class="icon-btn icon-btn--plain" onclick="vkQDel(${i})" aria-label="Alisin">${ic('x')}</button></span></li>`; }).join('')}</ol>`
          : '<p class="muted" style="margin-top:10px">Wala pang nakapila. I-type ang code o pumili sa list.</p>'}
      </div>
    </div>
    ${vkRoomHTML()}
    ${braveTipHTML()}
    <div class="card" style="margin-top:16px">
      <div class="vk-search">
        <div class="vk-find"><input class="input" id="vk-q" placeholder="Hanapin: kanta, artist o code" value="${esc(VK.q)}" oninput="vkFind(this.value)" autocomplete="off">
          <button class="vk-find-x" id="vk-q-x" ${VK.q ? '' : 'hidden'} onclick="vkFind('');$('#vk-q').value='';$('#vk-q').focus()" aria-label="Burahin ang search">${ic('x')}</button></div>
        <button class="vk-art-btn ${VK.artist ? 'on' : ''}" onclick="vkPickArtist()" aria-haspopup="dialog">${ic('people')}<span>${VK.artist ? esc((artists.find(([k]) => k === VK.artist) || [, 'Artist'])[1]) : 'Artist'}</span>${ic('down')}</button>
        <label class="toggle" style="margin:0"><input type="checkbox" ${v.score ? 'checked' : ''} onchange="vkScoreToggle(this.checked)">Score</label></div>
      ${letters.length > 1 ? `<div class="vk-letters" role="group" aria-label="Unang letra ng kanta">${letters.map(l => `<button class="${VK.letter === l ? 'on' : ''}" aria-pressed="${VK.letter === l}" onclick="vkSetLetter('${l}')">${l}</button>`).join('')}</div>` : ''}
      <div id="vk-fbar">${vkFilterBar(res.length)}</div>
      <div id="vk-results">${vkResultsHTML(shown, res.length)}</div>
      <button class="btn btn--ghost btn--sm" style="margin-top:12px" onclick="vkAddMine()">${ic('plus')}Idagdag ang sariling kanta (YouTube link)</button>
    </div>
    ${isAdmin() ? vkAdminHTML() : ''}`;
}
// The family link card in the Videoke tab
function vkRoomHTML() {
  const on = vkRoomValid();
  const left = on ? Math.max(1, Math.round((BIDA.vk.room.exp - Date.now()) / 36e5)) : 0;
  return `<div class="card vk-room" style="margin-top:16px">
    <div class="vk-room-ic">${ic('share')}</div>
    <div class="vk-room-tx"><h3>Link para sa mga gustong kumanta</h3>
      <p class="muted">${on ? `Bukas pa ng ${left} oras. Ilalagay lang nila ang pangalan nila, pili ng avatar, tapos pili ng kanta. Diretso na sa pila.`
        : 'Gawa ka ng link para sa event na \'to at i-send sa GC. Pang-reserve lang ng kanta ang makikita nila, wala nang iba.'}</p></div>
    <div class="vk-room-btns">${on
      ? `<button class="btn btn--chili btn--sm" onclick="vkShowQR()">${ic('qr')}QR code</button>
         <button class="btn btn--ink btn--sm" onclick="vkShareRoom()">${ic('share')}I-share ang link</button>
         <button class="btn btn--ghost btn--sm" onclick="vkCloseRoom()">Isara ang link</button>`
      : `<button class="btn btn--chili btn--sm" onclick="vkMakeRoom()">${ic('plus')}${AUTH.user ? 'Gawa ng link' : 'Mag-sign in para makagawa ng link'}</button>`}</div>
  </div>`;
}
// Brave blocks YouTube ads with Shields on. Shown in Videoke and Music.
function braveTipHTML() {
  if (navigator.brave) return `<p class="note brave-tip brave-on" style="margin-top:16px">${ic('check')}<span><b>Naka-Brave ka.</b> Basta naka-ON ang Shields (yung leon sa address bar), walang YouTube ads.</span></p>`;
  return `<p class="note brave-tip" style="margin-top:16px"><span><b>Ayaw ng ads habang kumakanta?</b> Gamitin ang <a href="https://brave.com/download/" target="_blank" rel="noopener noreferrer">Brave browser</a>, auto-block ang YouTube ads. Kung may YouTube Premium ka, dapat naka-sign in yun sa YouTube sa parehong browser at device.</span></p>`;
}
function vkResultsHTML(shown, total) {
  if (!vkAll().length) return `<p class="muted" style="margin-top:12px">${VK.loaded ? 'Wala pang kanta sa library.' : 'Kinukuha ang library…'}</p>`;
  if (!shown.length) return '<p class="muted" style="margin-top:12px">Walang nahanap.</p>';
  return `<ul class="vk-list">${shown.map(s => `<li><span class="vk-c">${s.c}</span><div><b>${esc(s.t)}</b><small>${esc(s.a)}${s.c >= 90000 ? ' · sarili mo' : ''}</small></div>
    <button class="vk-add" onclick="vkReserve(${s.c})" aria-label="Reserve ${esc(s.t)}" title="Reserve">${ic('plus')}</button></li>`).join('')}</ul>
    ${total > shown.length ? `<p class="muted" style="margin-top:8px">+${total - shown.length} pa. Mag-type o gamitin ang filter para lumiit.</p>` : ''}`;
}
function vkFind(q) {
  VK.q = q; const res = vkSearch();
  $('#vk-results').innerHTML = vkResultsHTML(res.slice(0, 90), res.length);
  $('#vk-fbar').innerHTML = vkFilterBar(res.length);
  const x = $('#vk-q-x'); if (x) x.hidden = !q;
}
// "12 kanta · B · Ben&Ben  [Clear filter]" — shows only when something is filtered
function vkFilterBar(n) {
  if (!VK.q && !VK.letter && !VK.artist) return '';
  const art = VK.artist && (vkArtists().find(([k]) => k === VK.artist) || [, ''])[1];
  const tags = [VK.letter && `Letra ${VK.letter}`, art, VK.q && `“${VK.q}”`].filter(Boolean).map(s => `<span class="vk-tag">${esc(s)}</span>`).join('');
  return `<div class="vk-fbar"><span class="vk-fcount"><b>${n}</b> kanta</span>${tags}<button class="btn btn--ghost btn--sm vk-clear" onclick="vkClearFilter()">${ic('x')}Clear filter</button></div>`;
}
function vkSetLetter(l) { VK.letter = VK.letter === l ? '' : l; renderVideoke(); }       // tap again to turn it off
function vkSetArtist(a) { VK.artist = a; if (a) VK.letter = ''; closeSheet(); renderVideoke(); }   // letter + artist together is usually 0 songs
function vkClearFilter() { VK.q = ''; VK.letter = ''; VK.artist = ''; renderVideoke(); }
// Artist picker: a sheet with its own search and how many songs each artist has
function vkPickArtist() {
  const counts = new Map(); vkAll().forEach(s => { const k = vkNorm(s.a); if (k) counts.set(k, (counts.get(k) || 0) + 1); });
  VK.artistList = vkArtists().map(([k, name]) => ({ k, name, n: counts.get(k) || 0 }));
  openSheet(`<div class="sheet-head"><h3>Pili ng artist</h3><button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <input class="input" id="art-q" placeholder="Hanapin ang artist" autocomplete="off" oninput="vkArtistList(this.value)">
    <ul class="art-list" id="art-list"></ul>`);
  vkArtistList('');
  setTimeout(() => $('#art-q')?.focus(), 50);
}
function vkArtistList(q) {
  const k = vkNorm(q), list = VK.artistList.map((a, i) => ({ ...a, i })).filter(a => !k || vkNorm(a.name).includes(k));
  $('#art-list').innerHTML = `${!k ? `<li><button class="${VK.artist ? '' : 'on'}" onclick="vkSetArtist('')"><b>Lahat ng artist</b></button></li>` : ''}`
    + list.map(a => `<li><button class="${VK.artist === a.k ? 'on' : ''}" onclick="vkSetArtistIdx(${a.i})"><b>${esc(a.name)}</b><small>${a.n} kanta</small></button></li>`).join('')
    + (list.length ? '' : '<li class="muted" style="padding:12px 4px">Walang ganyang artist.</li>');
}
function vkSetArtistIdx(i) { const a = VK.artistList[i]; if (a) vkSetArtist(a.k); }
function vkKey(k) {
  if (k === 'C') VK.input = ''; else if (VK.input.length < 5) VK.input += k;
  renderVideoke();
}
function vkReserveTyped() { if (VK.input.length === 5 && vkSong(+VK.input)) { vkReserve(+VK.input); VK.input = ''; renderVideoke(); } }
async function vkReserve(c) {
  const s = vkSong(c); if (!s) return;
  const v = vkState();
  const singer = await askText(`Sino ang kakanta ng "${s.t}"?`, v.lastSinger || '', 30);
  if (singer === null) return;
  v.lastSinger = String(singer).slice(0, 30);
  v.queue.push({ id: Math.random().toString(36).slice(2, 9), c, singer: v.lastSinger, av: vkAvatarFor(v.lastSinger), src: '' });
  saveState(); toast(`Na-reserve: ${c} · ${s.t}${v.lastSinger ? ' — ' + v.lastSinger : ''}`);
  if (BIDA.tab === 'videoke') renderVideoke();
  if (!$('#vk-stage').hidden) { vkStageInfo(); if (!VK.cur) vkNext(); }
  vkPublish();
}
function vkQMove(i, d) { const q = vkState().queue, j = i + d; if (j < 0 || j >= q.length) return; [q[i], q[j]] = [q[j], q[i]]; saveState(); renderVideoke(); vkPublish(); }
function vkQDel(i) { vkState().queue.splice(i, 1); saveState(); renderVideoke(); if (!$('#vk-stage').hidden) vkStageInfo(); vkPublish(); }
function vkScoreToggle(on) { vkState().score = on; saveState(); }

/* ---- The big screen (cast / connect this to the TV) ---- */
async function vkStart() {
  const stage = $('#vk-stage');
  stage.hidden = false; document.body.classList.add('in-vk'); document.body.style.overflow = 'hidden';
  if (M.playing) musicPause();                         // party music stops while someone sings
  try { navigator.wakeLock?.request('screen').then(l => VK.lock = l).catch(() => { }); } catch (e) { }
  if (!VK.cur) vkNext(); else vkStageInfo();
  // the QR on the right lets guests add songs; make the link now if the host hasn't yet
  if (!vkRoomValid() && AUTH.user) vkMakeRoom(true); else vkStageQR();
}
function vkClose() {
  $('#vk-stage').hidden = true; document.body.classList.remove('in-vk'); document.body.style.overflow = ''; rmtPublish();
  try { VK.yt?.pauseVideo(); } catch (e) { }
  clearTimeout(VK.introT); $('#vk-intro').hidden = true;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
  VK.lock?.release?.(); VK.lock = null;
  if (BIDA.tab === 'videoke') renderVideoke();
}
function vkFullscreen() { const s = $('#vk-stage'); (s.requestFullscreen ? s.requestFullscreen() : Promise.reject()).catch(() => toast('Hindi suportado ng browser na ito ang full screen')); }
async function vkNext() {
  clearTimeout(VK.scoreT); clearTimeout(VK.introT); $('#vk-score').hidden = true; $('#vk-intro').hidden = true;
  const q = vkState().queue;
  if (!q.length) { VK.cur = null; saveState(); vkStageInfo(); vkPublish(); try { VK.yt?.stopVideo(); } catch (e) { } return; }
  VK.cur = q.shift(); saveState();
  const s = vkSong(VK.cur.c); if (!s) { vkNext(); return; }
  vkStageInfo(); vkPublish();
  await ytApi();
  VK.introDone = false; VK.ready2play = false;
  const go = () => { if (VK.introDone && VK.ready2play) { try { VK.yt.setVolume(100); VK.yt.playVideo(); } catch (e) { } } };
  if (VK.yt && VK.ytReady) { VK.yt.cueVideoById(s.y); VK.ready2play = true; }
  else {
    $('#vk-player').innerHTML = '<div id="vk-yt"></div>';
    VK.ytReady = false;
    VK.yt = new YT.Player('vk-yt', {
      videoId: s.y, playerVars: { playsinline: 1, rel: 0, modestbranding: 1, autoplay: 0 },
      events: {
        onReady: () => { VK.ytReady = true; VK.ready2play = true; go(); },
        onStateChange: e => { if (e.data === YT.PlayerState.ENDED) vkSongEnded(); },
        onError: () => { toast('Ayaw mag-play ng video na \'to dito. Next na.'); setTimeout(vkNext, 1500); }
      }
    });
  }
  vkIntro(VK.cur, s, () => { VK.introDone = true; go(); });
}
/* The queue on the left, no panel behind it. Only the current and the next singer get a box;
   the rest are plain text that fades out down the list. Never below 3/4 of the screen (lyrics). */
function vkStageInfo() {
  const cur = VK.cur && vkSong(VK.cur.c), q = vkState().queue;
  $('#vk-now').innerHTML = cur ? `<span class="vk-c">${cur.c}</span><div><b>${esc(cur.t)}</b><small>${esc(cur.a)}</small></div>`
    : '<div><b>Wala pang nakapila</b><small>Mag-reserve sa Videoke tab o sa link</small></div>';
  const box = (it, s, i, now) => `<li class="vk-box ${now ? 'now' : ''}" style="--i:${i}">
      <span class="vk-av">${vkAvatar(it.av || vkAvatarFor(it.singer), now ? 58 : 44)}</span>
      <span class="vk-bt"><small>${now ? 'Kumakanta' : 'Next'}</small><b>${esc(it.singer || 'Bisita')}</b><em>${esc(s ? s.t : 'Code ' + it.c)}</em></span></li>`;
  const line = (it, s, n, k) => `<li class="vk-tx" style="--i:${k + 2};--o:${Math.max(.22, .9 - k * .14).toFixed(2)}"><span>${n}</span><b>${esc(it.singer || 'Bisita')}</b> <em>${esc(s ? s.t : 'Code ' + it.c)}</em></li>`;
  const all = (cur ? [[VK.cur, cur]] : []).concat(q.map(it => [it, vkSong(it.c)]));
  const items = all.slice(0, 8).map(([it, s], i) => i === 0 ? box(it, s, 0, !!cur) : i === 1 ? box(it, s, 1, false) : line(it, s, cur ? i : i + 1, i - 2));
  rmtPublish();
  $('#vk-side').innerHTML = items.join('') + (all.length > 8 ? `<li class="vk-tx" style="--o:.22">+${all.length - 8} pa</li>` : '');
}
/* "Susunod na kakanta" — a big, fun intro before each song, then the video starts */
function vkIntro(it, s, done) {
  const el = $('#vk-intro'), name = it.singer || 'Ikaw na!';
  const conf = [...Array(36)].map((_, i) => `<i style="--x:${(i * 37) % 100};--d:${(i % 9) * .12}s;--c:${['#E2367A', '#F6B21B', '#0FA3A3', '#E4452B', '#3E9B4F', '#FFF6E5'][i % 6]};--r:${(i * 53) % 360}deg"></i>`).join('');
  el.innerHTML = `<div class="vki-rays"></div><div class="vki-conf">${conf}</div>
    <div class="vki-card">
      <div class="vki-tag">Susunod na kakanta!</div>
      <div class="vki-av">${vkAvatar(it.av || vkAvatarFor(it.singer), 180)}</div>
      <div class="vki-name">${[...name].map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</div>
      <div class="vki-song"><span class="vk-c">${s.c}</span>${esc(s.t)}${s.a ? ` <small>· ${esc(s.a)}</small>` : ''}</div>
      <div class="vki-count" id="vki-count">3</div>
    </div>`;
  el.hidden = false; el.classList.remove('out');
  vkPlayPad(/drum/i);
  const cnt = $('#vki-count'); let n = 3;
  const step = () => {
    n--;
    if (n > 0) { cnt.textContent = n; cnt.classList.remove('pop'); void cnt.offsetWidth; cnt.classList.add('pop'); VK.introT = setTimeout(step, 900); }
    else {
      cnt.textContent = 'Kanta na!'; cnt.classList.add('go'); vkPlayPad(/palakpak|applause|clap|ta-?da/i);
      VK.introT = setTimeout(() => { el.classList.add('out'); VK.introT = setTimeout(() => { el.hidden = true; done(); }, 450); }, 900);
    }
  };
  VK.introT = setTimeout(() => { cnt.classList.add('pop'); VK.introT = setTimeout(step, 900); }, 1700);
}
function vkPlayPad(re) { const p = PADS.find(x => re.test(x.name) && canPlaySound(x.id)); if (p) playSound(p.id); }
function vkSongEnded() {
  if (!vkState().score) { setTimeout(vkNext, 1500); return; }
  // Pinoy videoke-style score: just for fun (it doesn't really judge the singing)
  const r = Math.random(), score = r < .08 ? 100 : r < .7 ? 88 + Math.floor(Math.random() * 12) : 75 + Math.floor(Math.random() * 13);
  const label = score === 100 ? 'PERFECT!' : score >= 92 ? 'Ang galing!' : score >= 85 ? 'Pwede na!' : 'Kanta pa!';
  const el = $('#vk-score'); el.innerHTML = `<small>Score</small><b>0</b><span>${label}</span>`; el.hidden = false;
  vkPlayPad(/drum/i);
  const n = el.querySelector('b'), t0 = performance.now();
  const iv = setInterval(() => {   // timer, not rAF, so it still counts on a cast / background screen
    const k = Math.min(1, (performance.now() - t0) / 1800); n.textContent = Math.round(score * k);
    if (k >= 1) { clearInterval(iv); vkPlayPad(/palakpak|applause|clap|ta-?da/i); }
  }, 40);
  VK.scoreT = setTimeout(vkNext, 6500);
}

/* ---- Guest link: a room in Firestore that guests can add songs to ----
   The room belongs to the signed-in host and this event. Guests open sing.html?r=<room>,
   type their name, pick an avatar and add songs; requests land here and join the queue. */
const VKR = { unsub: null, pubT: 0, seen: new Set() };
const ROOM_HOURS = 48;
function vkFs() { return window.firebase && firebase.firestore ? firebase.firestore() : null; }
function vkRoomUrl(id) { return new URL('sing.html?r=' + id, location.href).href; }
function vkRoomValid() {
  const r = BIDA.vk && BIDA.vk.room;
  return !!(r && /^[A-Za-z0-9]{24}$/.test(r.id) && r.owner === AUTH.user?.uid && r.exp > Date.now());
}
async function vkMakeRoom(silent) {
  if (!authReady()) { if (!silent) toast('Hindi pa bukas ang sign-in'); return; }
  if (!AUTH.user) { if (silent) return; await signIn(); if (!AUTH.user) return; }
  const fs = vkFs(); if (!fs) { toast('Hindi ma-load ang link. I-refresh mo.'); return; }
  const old = BIDA.vk.room;
  if (old && old.owner === AUTH.user.uid) fs.collection('vk_rooms').doc(old.id).update({ open: false }).catch(() => { });
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const id = [...crypto.getRandomValues(new Uint8Array(24))].map(b => abc[b % abc.length]).join('');
  const exp = Date.now() + ROOM_HOURS * 36e5;
  try {
    await fs.collection('vk_rooms').doc(id).set({ owner: AUTH.user.uid, title: String(BIDA.event.name || eventType().label).slice(0, 90), open: true,
      expires: firebase.firestore.Timestamp.fromMillis(exp), queue: [], now: null, updated: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (e) { toast(/permission/i.test(e.message) ? 'Hindi pa naka-publish ang bagong Firestore rules' : 'Hindi nagawa ang link. Try ulit.'); return; }
  vkState().room = { id, owner: AUTH.user.uid, exp }; saveState();
  vkListen(); vkPublish(); if (BIDA.tab === 'videoke') renderVideoke(); if (!silent) vkShowQR(); if (!$('#vk-stage').hidden) vkStageQR();
}
async function vkShareRoom() {
  if (!vkRoomValid()) return;
  const url = vkRoomUrl(BIDA.vk.room.id), text = `Pili na ng kakantahin mo sa videoke ng ${BIDA.event.name || eventType().label}!`;
  try { if (navigator.share) { await navigator.share({ title: 'Bida-Vibe Videoke', text, url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('Na-copy na. I-paste mo sa GC.'); } catch (e) { askText('I-copy ang link na ito', url, 600); }
}
/* ---- QR code for the link (scan from the TV or from the host's phone) ----
   qrcode-generator is loaded only when needed, pinned with SRI like the Firebase scripts. */
const QR_SRC = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
const QR_SRI = 'sha384-8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k';
let qrLoading = null;
function qrLib() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  return qrLoading || (qrLoading = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = QR_SRC; s.integrity = QR_SRI; s.crossOrigin = 'anonymous';
    s.onload = () => window.qrcode ? res(window.qrcode) : rej(new Error('qr')); s.onerror = () => { qrLoading = null; rej(new Error('qr')); };
    document.head.appendChild(s);
  }));
}
// Draws the QR (dark squares on white, with the required white border) into a canvas
async function qrCanvas(text, px) {
  const q = (await qrLib())(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), quiet = 4, cell = Math.max(2, Math.floor(px / (n + quiet * 2))), size = cell * (n + quiet * 2);
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, size, size); x.fillStyle = '#1E1A16';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + quiet) * cell, (r + quiet) * cell, cell, cell);
  return c;
}
async function vkShowQR() {
  if (!vkRoomValid()) return;
  const url = vkRoomUrl(BIDA.vk.room.id);
  openSheet(`<div class="sheet-head"><h3>I-scan para kumanta</h3><button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <div class="qr-box" id="qr-box"><p class="muted">Ginagawa ang QR…</p></div>
    <p class="muted qr-note">Ipa-scan sa camera ng phone nila. Diretso na sa page kung saan sila pipili ng kanta.</p>
    <div class="qr-btns"><button class="btn btn--chili" onclick="vkShareRoom()">${ic('share')}I-share ang link</button>
      <button class="btn btn--ghost" onclick="vkDownloadQR()">${ic('upload')}I-download ang QR</button></div>`);
  try { const c = await qrCanvas(url, 520); c.className = 'qr-img'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'QR code ng videoke link'); const b = $('#qr-box'); if (b) { b.innerHTML = ''; b.appendChild(c); } }
  catch (e) { const b = $('#qr-box'); if (b) b.innerHTML = '<p class="muted">Hindi ma-load ang QR. I-check ang internet, o i-share na lang ang link.</p>'; }
}
// A printable/postable QR card: event name on top, big QR, short instruction
async function vkDownloadQR() {
  if (!vkRoomValid()) return;
  let qr; try { qr = await qrCanvas(vkRoomUrl(BIDA.vk.room.id), 760); } catch (e) { toast('Hindi ma-load ang QR'); return; }
  const W = 900, H = 1200, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#E2367A'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#FFF6E5'; x.strokeStyle = '#1E1A16'; x.lineWidth = 8;
  x.beginPath(); if (x.roundRect) x.roundRect(50, 50, W - 100, H - 100, 40); else x.rect(50, 50, W - 100, H - 100); x.fill(); x.stroke();
  x.fillStyle = '#1E1A16'; x.textAlign = 'center'; x.textBaseline = 'top';
  x.font = '800 34px Nunito, sans-serif'; x.fillText('VIDEOKE', W / 2, 100);
  let fs = 64; const title = String(BIDA.event.name || eventType().label);
  do { x.font = `800 ${fs}px "Bricolage Grotesque", sans-serif`; fs -= 4; } while (x.measureText(title).width > W - 180 && fs > 30);
  x.fillStyle = '#E4452B'; x.fillText(title, W / 2, 150);
  const qs = 640; x.drawImage(qr, (W - qs) / 2, 270, qs, qs);
  x.strokeStyle = '#1E1A16'; x.lineWidth = 6; x.strokeRect((W - qs) / 2, 270, qs, qs);
  x.fillStyle = '#1E1A16'; x.font = '800 44px "Bricolage Grotesque", sans-serif'; x.fillText('I-scan para kumanta!', W / 2, 950);
  x.font = '700 28px Nunito, sans-serif'; x.fillStyle = '#7A7067'; x.fillText('Ilagay ang pangalan, pili ng kanta, tapos hintayin ang turn mo.', W / 2, 1020);
  c.toBlob(b => {
    if (!b) { toast('Hindi ma-save ang QR'); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'videoke-qr.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Na-download ang QR!');
  }, 'image/png');
}
// Small "scan me" QR in the TV corner while the link is open
async function vkStageQR() {
  const el = $('#vk-qr'); if (!el) return;
  if (!vkRoomValid()) { el.hidden = true; el.innerHTML = ''; return; }
  const url = vkRoomUrl(BIDA.vk.room.id);
  if (el.dataset.url === url && !el.hidden) return;
  try { const c = await qrCanvas(url, 360); el.innerHTML = '<b>Gusto mong kumanta?</b><small>I-scan para mag-add ng kanta</small>'; el.prepend(c); el.dataset.url = url; el.hidden = false; }
  catch (e) { el.hidden = true; }
}
async function vkCloseRoom() {
  if (!BIDA.vk.room) return;
  if (!await askConfirm('Isara ang link? Hindi na sila makakapag-reserve.', 'Isara')) return;
  const fs = vkFs(); if (fs && vkRoomValid()) fs.collection('vk_rooms').doc(BIDA.vk.room.id).update({ open: false }).catch(() => { });
  VKR.unsub?.(); VKR.unsub = null; BIDA.vk.room = null; saveState(); renderVideoke(); vkStageQR();
}
// Live: pick up guests' requests as they arrive. Only songs that are really in the library are accepted.
async function vkListen() {
  VKR.unsub?.(); VKR.unsub = null;
  const fs = vkFs(); if (!fs || !vkRoomValid()) return;
  await loadVkLibrary();                                               // need the library to check requests
  if (!vkRoomValid() || VKR.unsub) return;
  const room = BIDA.vk.room.id;
  VKR.unsub = fs.collection('vk_rooms').doc(room).collection('requests').orderBy('at').onSnapshot(snap => {
    snap.docChanges().forEach(ch => {
      if (ch.type !== 'added' || VKR.seen.has(ch.doc.id)) return;
      VKR.seen.add(ch.doc.id);
      const d = ch.doc.data(), s = VK.lib.find(x => x.c === d.c && x.y === d.y);
      ch.doc.ref.delete().catch(() => { });
      if (!s) return;                                                      // not from our library: ignored
      const singer = String(d.name || 'Bisita').slice(0, 24), av = VK_AVATARS.some(a => a.id === d.av) ? d.av : vkAvatarFor(singer);
      vkState().queue.push({ id: ch.doc.id.slice(0, 9), c: s.c, singer, av, src: 'guest' });
      saveState(); toast(`${singer} nag-reserve: ${s.t}`);
      if (BIDA.tab === 'videoke' && !$('#app').hidden) renderVideoke();
      if (!$('#vk-stage').hidden) { vkStageInfo(); if (!VK.cur) vkNext(); }
      vkPublish();
    });
  }, () => { /* rules not published yet, or the room closed */ });
}
// Guests see the queue on their page: keep the room's copy in sync (names, avatars, titles only)
function vkPublish() {
  clearTimeout(VKR.pubT);
  VKR.pubT = setTimeout(() => {
    const fs = vkFs(); if (!fs || !vkRoomValid()) return;
    const item = it => { const s = vkSong(it.c); return { n: String(it.singer || 'Bisita').slice(0, 24), av: it.av || vkAvatarFor(it.singer), t: s ? s.t : 'Kanta', c: it.c }; };
    fs.collection('vk_rooms').doc(BIDA.vk.room.id).update({
      queue: vkState().queue.slice(0, 40).map(item), now: VK.cur ? item(VK.cur) : null,
      title: String(BIDA.event.name || eventType().label).slice(0, 90), updated: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(() => { });
  }, 700);
}

/* ============================================================
   HOST REMOTE — control the TV laptop/tablet from your phone.
   The app on the TV keeps a Firestore doc vk_remotes/{24 random chars} up to date
   (plan, sound pads, videoke queue, music). remote.html?k=<id> shows it and sends
   small commands back; the TV checks each command and runs it.
   The link is the key: only share it with co-hosts. It ends after 24 hours.
   ============================================================ */
const RMT = { unsub: null, pubT: 0, seen: new Set(), last: '' };
const REMOTE_HOURS = 24;
function rmtValid() {
  const r = BIDA.remote;
  return !!(r && /^[A-Za-z0-9]{24}$/.test(r.id) && r.owner === AUTH.user?.uid && r.exp > Date.now());
}
function rmtUrl() { return new URL('remote.html?k=' + BIDA.remote.id, location.href).href; }
function rmtSheet() {
  const on = rmtValid();
  openSheet(`<div class="sheet-head"><h3>Remote para sa host</h3><button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <p class="muted">Naka-connect ba sa TV ang laptop o tablet na 'to? I-scan ang QR gamit ang phone mo para ma-control ang sounds, videoke, music at makita ang plan nang hindi hinahawakan ang device na 'to.</p>
    ${on ? `<div class="qr-box" id="rmt-qr"><p class="muted">Ginagawa ang QR…</p></div>
      <p class="note" style="margin-top:12px"><b>Para sa co-host lang 'to.</b> Kahit sino ang may hawak ng link, pwedeng mag-control. Huwag i-send sa GC. Mag-e-expire in ${Math.max(1, Math.round((BIDA.remote.exp - Date.now()) / 36e5))} oras.</p>
      <div class="qr-btns"><button class="btn btn--ink" onclick="rmtCopy()">${ic('share')}I-copy ang link</button>
        <button class="btn btn--ghost" onclick="rmtStop()">Isara ang remote</button></div>
      <p class="muted" style="margin-top:12px;text-align:center">Tip: mag-tap muna kahit isang beses sa device na 'to para payagan ng browser ang sounds. Huwag i-minimize ang app sa TV.</p>`
    : `<button class="btn btn--chili btn--block" style="margin-top:14px" onclick="rmtStart()">${ic('qr')}${AUTH.user ? 'Gawa ng remote link' : 'Mag-sign in para makagawa'}</button>`}`);
  if (on) qrCanvas(rmtUrl(), 520).then(c => { c.className = 'qr-img'; const b = $('#rmt-qr'); if (b) { b.innerHTML = ''; b.appendChild(c); } })
    .catch(() => { const b = $('#rmt-qr'); if (b) b.innerHTML = '<p class="muted">Hindi ma-load ang QR. I-copy na lang ang link.</p>'; });
}
async function rmtStart() {
  if (!authReady()) { toast('Hindi pa bukas ang sign-in'); return; }
  if (!AUTH.user) { await signIn(); if (!AUTH.user) return; }
  const fs = vkFs(); if (!fs) { toast('Hindi ma-load ang remote. I-refresh mo.'); return; }
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const id = [...crypto.getRandomValues(new Uint8Array(24))].map(b => abc[b % abc.length]).join('');
  const exp = Date.now() + REMOTE_HOURS * 36e5;
  try {
    await fs.collection('vk_remotes').doc(id).set({ owner: AUTH.user.uid, open: true, expires: firebase.firestore.Timestamp.fromMillis(exp),
      state: rmtState(), updated: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (e) { toast(/permission/i.test(e.message) ? 'Hindi pa naka-publish ang bagong Firestore rules' : 'Hindi nagawa ang remote. Try ulit.'); return; }
  BIDA.remote = { id, owner: AUTH.user.uid, exp }; saveState();
  rmtListen(); rmtSheet();
}
async function rmtCopy() {
  if (!rmtValid()) return;
  try { await navigator.clipboard.writeText(rmtUrl()); toast('Na-copy ang remote link'); } catch (e) { askText('I-copy ang link na ito', rmtUrl(), 600); }
}
async function rmtStop() {
  if (!await askConfirm('Isara ang remote? Hindi na gagana ang link sa phone.', 'Isara')) return;
  const fs = vkFs(); if (fs && rmtValid()) fs.collection('vk_remotes').doc(BIDA.remote.id).update({ open: false }).catch(() => { });
  RMT.unsub?.(); RMT.unsub = null; BIDA.remote = null; saveState(); closeSheet(); toast('Sarado na ang remote');
}
// What the phone sees. Names and titles only: no account details, no links.
function rmtState() {
  const nxt = nextIdx();
  const song = it => { const s = vkSong(it.c); return { n: String(it.singer || 'Bisita').slice(0, 24), av: it.av || vkAvatarFor(it.singer), t: s ? s.t.slice(0, 80) : 'Code ' + it.c, a: s ? s.a.slice(0, 60) : '', c: it.c }; };
  return {
    ev: String(BIDA.event.name || eventType().label).slice(0, 90),
    plan: BIDA.program.slice(0, 60).map((p, i) => ({ id: p.id, t: String(p.title || '').slice(0, 80), min: p.min, done: !!p.done, next: i === nxt, note: String(p.note || '').slice(0, 200) })),
    pads: padList().filter(p => canPlaySound(p.id)).slice(0, 40).map(p => ({ id: p.id, n: p.name.slice(0, 24), c: p.c })),
    music: { has: !!M.kind, on: !!M.playing, t: String(M.title || '').slice(0, 90), duck: !!M.ducked, faded: !!M.faded, pro: !!BIDA.premium },
    vk: { stage: !$('#vk-stage').hidden, now: VK.cur ? song(VK.cur) : null, q: vkState().queue.slice(0, 30).map(song) }
  };
}
// Keep the phone's copy fresh (only writes when something actually changed)
function rmtPublish() {
  if (!BIDA.remote) return;
  clearTimeout(RMT.pubT);
  RMT.pubT = setTimeout(() => {
    const fs = vkFs(); if (!fs || !rmtValid()) return;
    const st = rmtState(), key = JSON.stringify(st);
    if (key === RMT.last) return; RMT.last = key;
    fs.collection('vk_remotes').doc(BIDA.remote.id).update({ state: st, updated: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => { });
  }, 500);
}
function rmtListen() {
  RMT.unsub?.(); RMT.unsub = null;
  const fs = vkFs(); if (!fs || !rmtValid()) return;
  RMT.last = ''; rmtPublish(); setTimeout(rmtPublish, 4000);   // again once the sound pads have loaded
  RMT.unsub = fs.collection('vk_remotes').doc(BIDA.remote.id).collection('cmds').orderBy('at').onSnapshot(snap => {
    snap.docChanges().forEach(ch => {
      if (ch.type !== 'added' || RMT.seen.has(ch.doc.id)) return;
      RMT.seen.add(ch.doc.id);
      const d = ch.doc.data() || {}, at = d.at && d.at.toMillis ? d.at.toMillis() : Date.now();
      ch.doc.ref.delete().catch(() => { });
      if (Date.now() - at > 20000) return;            // old command (TV was offline): don't fire it late
      try { rmtRun(d); } catch (e) { }
      rmtPublish();
    });
  }, () => { });
}
// Every command is checked here; the phone can't do anything the host's own buttons can't.
function rmtRun(d) {
  const v = String(d.v || ''), n = Number(d.n);
  switch (d.k) {
    case 'pad': if (soundEntry(v) && canPlaySound(v)) playSound(v); break;
    case 'stop': if (CUR_PAD) { try { CUR_PAD.src.stop(); } catch (e) { } } break;
    case 'music':
      if (!M.kind) { toast('Remote: wala pang music na naka-set'); break; }
      if (v === 'toggle') musicToggle();
      else if (v === 'next') musicSkip(1);
      else if (v === 'prev') musicSkip(-1);
      else if (v === 'fade' && BIDA.premium) fadeToggle();
      else if (v === 'talk' && BIDA.premium) (M.ducked ? duckUp() : duckDown());
      break;
    case 'plan': if (v === 'done' && BIDA.program.some(p => p.id === n)) { toggleDone(n); if (BIDA.tab === 'plan') renderPlan(); } break;
    case 'vk':
      if (v === 'start') vkStart();
      else if (v === 'close') { if (!$('#vk-stage').hidden) vkClose(); }
      else if (v === 'skip') { if (!$('#vk-stage').hidden) vkNext(); }
      else if (v === 'reserve') {
        const s = vkSong(n); if (!s) break;
        const singer = String(d.s || '').replace(/\s+/g, ' ').trim().slice(0, 24) || 'Bisita';
        const av = VK_AVATARS.some(a => a.id === d.av) ? d.av : vkAvatarFor(singer);
        vkState().queue.push({ id: Math.random().toString(36).slice(2, 9), c: s.c, singer, av, src: '' });
        saveState(); toast(`Remote: ${singer} · ${s.t}`);
        if (BIDA.tab === 'videoke' && !$('#app').hidden) renderVideoke();
        if (!$('#vk-stage').hidden) { vkStageInfo(); if (!VK.cur) vkNext(); }
        vkPublish();
      } else if (v === 'del' && Number.isInteger(n)) { const q = vkState().queue; if (q[n]) { q.splice(n, 1); saveState(); if (!$('#vk-stage').hidden) vkStageInfo(); if (BIDA.tab === 'videoke') renderVideoke(); vkPublish(); } }
      break;
  }
}

/* ---- Hosts' own songs (saved only on this device) ---- */
function vkParseTitle(raw) {
  let t = String(raw || '').replace(/\[[^\]]*\]|\([^)]*(karaoke|videoke|lyrics?|instrumental|minus ?one|hd|4k|version|official|remaster|video|audio|m\/v)[^)]*\)/gi, '')
    .replace(/\b(karaoke|videoke|minus ?one|instrumental|with lyrics|lyrics|hd|4k|m\/v|official (music )?video)\b/gi, '')
    .replace(/\(\s*\)/g, '').replace(/[|｜].*$/, '').replace(/\s{2,}/g, ' ').trim();
  const m = t.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (!m) return { a: '', t: t.slice(0, 80) || 'Kanta' };
  let a = m[1].trim(), s = m[2].trim();
  // Most channels write "Artist - Song", but some write "SONG - Artist" with the song in capitals
  const caps = x => /[A-Z]/.test(x) && x === x.toUpperCase();
  if (caps(a) && !caps(s)) [a, s] = [s, a];
  return { a: a.slice(0, 60), t: s.slice(0, 80) };
}
async function vkOembed(id) {
  const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id));
  if (r.status === 401 || r.status === 403) throw new Error('no_embed');   // the owner doesn't allow playing it on other sites
  if (!r.ok) throw new Error('not_found');
  return r.json();
}
async function vkAddMine() {
  const link = await askText('I-paste ang YouTube karaoke link', '', 600); if (!link) return;
  const p = parseYouTube(link); if (!p || !p.id) { toast('Hindi valid ang YouTube video link'); return; }
  let info; try { info = await vkOembed(p.id); } catch (e) { toast(e.message === 'no_embed' ? 'Hindi pwedeng i-play sa ibang site ang video na ito — pumili ng iba' : 'Hindi mahanap ang video'); return; }
  const v = vkState(); if (vkAll().some(s => s.y === p.id)) { toast('Nasa library na ito'); return; }
  const parsed = vkParseTitle(info.title);
  const c = Math.max(90000, ...v.mine.map(s => s.c)) + 1;
  v.mine.push({ c, y: p.id, t: parsed.t, a: parsed.a || String(info.author_name || '').slice(0, 60), g: 'Sarili' });
  saveState(); toast(`Naidagdag: ${c} · ${parsed.t}`); renderVideoke();
}

/* ---- Admin: the shared library (saved to karaoke/library.json via the admin's GitHub token) ---- */
const VK_MAX = 3000;          // keeps library.json around 400 KB, so it loads fast on phone data
const VK_PER = 120;           // songs per admin page
// Same song = same video, or same title + artist once words like "karaoke", "lyrics", "HD" are ignored
const VK_NOISE = /\b(karaoke|videoke|minus ?one|instrumental|lyrics?|with lyrics|hd|hq|4k|official|version|cover|backing track|sing ?along|audio|video)\b/g;
const vkKeyPart = s => vkNorm(s).replace(VK_NOISE, ' ').replace(/\s+/g, ' ').trim();
const vkDupKey = s => vkKeyPart(s.t) + '|' + vkKeyPart(s.a);
function vkDupSet(songs) {
  const by = new Map(), dup = new Set();
  const put = (k, s) => { const g = by.get(k); if (g) { g.forEach(x => dup.add(x.c)); dup.add(s.c); g.push(s); } else by.set(k, [s]); };
  songs.forEach(s => { put('y:' + s.y, s); if (vkKeyPart(s.t)) put('k:' + vkDupKey(s), s); });
  return dup;
}
function vkFindDup(songs, cand) {
  const k = vkKeyPart(cand.t) ? vkDupKey(cand) : '';
  return songs.find(s => s.y === cand.y || (k && vkDupKey(s) === k));
}
function vkAdminHTML() {
  const a = VK.admin, q = vkNorm(a.q), dups = vkDupSet(VK.lib), full = VK.lib.length >= VK_MAX;
  let list = VK.lib.filter(s => !q || String(s.c).startsWith(q) || vkNorm(s.t).includes(q) || vkNorm(s.a).includes(q));
  if (a.dup) list = list.filter(s => dups.has(s.c)).sort((x, y) => vkDupKey(x).localeCompare(vkDupKey(y)) || x.c - y.c);
  const pages = Math.max(1, Math.ceil(list.length / VK_PER)); a.page = Math.min(a.page, pages - 1);
  const page = list.slice(a.page * VK_PER, a.page * VK_PER + VK_PER);
  const dis = a.busy ? 'disabled' : '';
  return `<div class="card admin-card" style="margin-top:20px">
    <div class="adm-head"><h3>${ic('lock')}Admin: Videoke library</h3><span class="adm-count ${full ? 'full' : ''}">${VK.lib.length} / ${VK_MAX}</span></div>
    <p class="muted">Lahat ng host at bisita, makikita 'to. May code agad ang bagong kanta (simula 10001).</p>
    <div class="admin-up">
      <button class="btn btn--ink btn--sm" ${dis} ${full ? 'disabled' : ''} onclick="vkAdminAdd()">${ic('plus')}Add song</button>
      <button class="btn btn--ghost btn--sm" ${dis} ${full ? 'disabled' : ''} onclick="vkAdminImport()">${ic('upload')}Import playlist</button>
      ${dups.size ? `<button class="btn btn--sm ${a.dup ? 'btn--chili' : 'btn--ghost'}" onclick="vkAdminDup()">${a.dup ? 'Ipakita lahat' : `May doble: ${dups.size}`}</button>` : ''}
    </div>
    ${full ? '<p class="note" style="margin-top:10px">Puno na (3,000). Magbura muna bago magdagdag.</p>' : ''}
    ${a.msg ? `<p class="note adm-msg" style="margin-top:10px">${esc(a.msg)}</p>` : ''}
    ${VK.lib.length ? `<input class="input adm-find" style="margin-top:12px" placeholder="Hanapin: title, artist o code" value="${esc(a.q)}" oninput="vkAdminFind(this.value)">
    ${a.dup ? '<p class="muted" style="margin-top:8px">Magkatabi ang magkaparehong kanta. Burahin lang ang sobra.</p>' : ''}
    <ul class="adm-list">${page.map(s => `<li class="${dups.has(s.c) ? 'dup' : ''}"><span class="adm-c">${s.c}</span>
      <span class="adm-t"><b>${esc(s.t)}</b><small>${esc(s.a) || '—'}</small></span>
      <button class="adm-ic" onclick="vkAdminEdit(${s.c})" aria-label="I-edit ang ${s.c}" ${dis}>${ic('edit')}</button>
      <button class="adm-ic adm-del" onclick="vkAdminDelete(${s.c})" aria-label="Burahin ang ${s.c}" ${dis}>${ic('trash')}</button></li>`).join('')}</ul>
    ${!page.length ? '<p class="muted" style="margin-top:10px">Walang lumabas.</p>' : ''}
    ${pages > 1 ? `<div class="admin-up"><button class="btn btn--ghost btn--sm" ${a.page ? '' : 'disabled'} onclick="vkAdminPage(-1)">Back</button><span class="muted">${a.page + 1} / ${pages}</span><button class="btn btn--ghost btn--sm" ${a.page + 1 < pages ? '' : 'disabled'} onclick="vkAdminPage(1)">Next</button></div>` : ''}` : ''}
  </div>`;
}
function vkAdminFind(q) { VK.admin.q = q; VK.admin.page = 0; renderVideoke(); setTimeout(() => { const i = $('.adm-find'); if (i) { i.focus(); i.setSelectionRange(q.length, q.length); } }, 0); }
function vkAdminPage(d) { VK.admin.page = Math.max(0, VK.admin.page + d); renderVideoke(); }
function vkAdminDup() { VK.admin.dup = !VK.admin.dup; VK.admin.page = 0; renderVideoke(); }
async function vkGhReady() {
  if (!isAdmin()) throw new Error('admin_only');
  if (!GH.token) GH.token = await ghLoadToken();
  if (!GH.token) throw new Error('no_gh_token');
}
// Read the library straight from GitHub. Big files (over 1 MB) come back without content from the
// contents API, so fall back to the blob API. If it still can't be read, STOP: saving would wipe it.
async function vkReadLib() {
  const r = await ghApi('contents/' + VK_LIB_PATH);
  if (r.status === 404) return { sha: '', songs: [] };
  if (!r.ok) throw new Error('lib_read');
  const j = await r.json();
  let raw = j.content;
  if (!raw || j.encoding !== 'base64') {
    const b = await ghApi('git/blobs/' + j.sha);
    if (!b.ok) throw new Error('lib_read');
    raw = (await b.json()).content;
  }
  let data;
  try { const bin = atob(String(raw || '').replace(/\s/g, '')); data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0)))); }
  catch (e) { throw new Error('lib_read'); }
  if (!data || !Array.isArray(data.songs)) throw new Error('lib_read');
  return { sha: j.sha, songs: data.songs.map(vkCleanSong).filter(Boolean) };
}
// Re-read right before saving so two edits never overwrite each other
async function vkSaveLib(mutate, message) {
  await vkGhReady();
  const { sha, songs } = await vkReadLib();
  const before = songs.length;
  const out = mutate(songs) || songs;
  if (out.length > VK_MAX && out.length > before) throw new Error('lib_full');
  if (out.length < before - 1) throw new Error('lib_read');      // a save should never lose more than the one song being deleted
  out.sort((a, b) => a.c - b.c);
  // One song per line: small file, and GitHub shows clean diffs
  const json = '{"v":1,"updated":' + JSON.stringify(new Date().toISOString()) + ',"songs":[\n'
    + out.map(s => JSON.stringify({ c: s.c, y: s.y, t: s.t, a: s.a, g: s.g || '' })).join(',\n') + '\n]}\n';
  await ghPut(VK_LIB_PATH, b64(new TextEncoder().encode(json)), message, sha || undefined);
  VK.lib = out; VK.loaded = true;
}
const VK_ERR = {
  no_gh_token: 'Ilagay muna ang GitHub token sa Sounds → Admin: Sound manager.',
  gh_token: 'Ayaw tanggapin ng GitHub ang token, baka expired na. Palitan sa Sound manager.',
  gh_perm: 'Walang permiso ang token na mag-edit ng repo.',
  rules: 'Hindi pa naka-publish ang Firestore rules.',
  admin_only: 'Admin lang pwede dito.',
  lib_read: 'Hindi mabasa nang buo ang library sa GitHub kaya hindi muna ni-save, para walang mabura. Subukan ulit mamaya.',
  lib_full: 'Puno na ang library (3,000 kanta). Magbura muna bago magdagdag.'
};
async function vkAdminWork(fn) {
  if (VK.admin.busy) return; VK.admin.busy = true; VK.admin.msg = ''; renderVideoke();
  try { await fn(); } catch (e) { VK.admin.msg = VK_ERR[e.message] || ('Hindi natuloy: ' + e.message); }
  finally { VK.admin.busy = false; renderVideoke(); }
}
const vkNextCode = songs => Math.max(10000, ...songs.map(s => s.c).filter(c => c < 90000)) + 1;
async function vkAdminAdd() {
  if (VK.lib.length >= VK_MAX) { toast(VK_ERR.lib_full); return; }
  const link = await askText('I-paste ang YouTube karaoke link', '', 600); if (!link) return;
  const p = parseYouTube(link); if (!p || !p.id) { toast('Hindi YouTube video link yan'); return; }
  const same = VK.lib.find(s => s.y === p.id);
  if (same) { toast(`Nasa library na yan: ${same.c} · ${same.t}`); return; }
  let info; try { info = await vkOembed(p.id); } catch (e) { toast(e.message === 'no_embed' ? 'Ayaw i-play ng YouTube ang video na yan sa ibang site. Iba na lang.' : 'Hindi mahanap ang video'); return; }
  const parsed = vkParseTitle(info.title), cand = { y: p.id, t: parsed.t, a: parsed.a || String(info.author_name || '').slice(0, 60) };
  const twin = vkFindDup(VK.lib, cand);
  if (twin && !await askConfirm(`Parang meron na nito: ${twin.c} · ${twin.t}${twin.a ? ' – ' + twin.a : ''}. Idagdag pa rin?`, 'Idagdag pa rin')) return;
  vkAdminWork(async () => {
    let code = 0;
    await vkSaveLib(songs => {
      if (songs.some(s => s.y === p.id)) throw new Error('Nasa library na ang video na yan.');
      code = vkNextCode(songs);
      songs.push({ c: code, ...cand, g: '' });
      return songs;
    }, `Videoke: add ${parsed.t}`);
    VK.admin.msg = `Added: ${code} · ${parsed.t}. Pakicheck kung tama ang title at artist.`;
  });
}
// Bulk import: load the playlist in a hidden YouTube player to read its video list (no API key needed)
function vkPlaylistIds(list) {
  return ytApi().then(() => new Promise((res, rej) => {
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-9999px;width:200px;height:200px'; host.innerHTML = '<div id="vk-pl"></div>'; document.body.appendChild(host);
    let done = false; const finish = (v, e) => { if (done) return; done = true; try { p.destroy(); } catch (x) { } host.remove(); e ? rej(e) : res(v); };
    const p = new YT.Player('vk-pl', { playerVars: { listType: 'playlist', list, autoplay: 0 }, events: {
      onReady: () => { const t0 = Date.now(); (function poll() { const ids = p.getPlaylist && p.getPlaylist(); if (ids && ids.length) finish(ids); else if (Date.now() - t0 > 12000) finish(null, new Error('Hindi mabasa ang playlist. Private ba o walang laman?')); else setTimeout(poll, 400); })(); },
      onError: () => finish(null, new Error('Hindi mabasa ang playlist')) } });
    setTimeout(() => finish(null, new Error('Hindi mabasa ang playlist')), 20000);
  }));
}
async function vkAdminImport() {
  const room = VK_MAX - VK.lib.length;
  if (room <= 0) { toast(VK_ERR.lib_full); return; }
  const link = await askText(`I-paste ang YouTube playlist link (max ${Math.min(200, room)} kanta bawat import)`, '', 600); if (!link) return;
  const p = parseYouTube(link); if (!p || !p.list) { toast('Hindi playlist link yan'); return; }
  vkAdminWork(async () => {
    const ids = (await vkPlaylistIds(p.list)).filter(id => /^[\w-]{11}$/.test(id)).slice(0, 200);
    const fresh = [], cap = Math.min(200, room);
    let skipped = 0, doubles = 0;
    for (let i = 0; i < ids.length && fresh.length < cap; i++) {
      if (VK.lib.some(s => s.y === ids[i]) || fresh.some(f => f.y === ids[i])) { doubles++; continue; }
      VK.admin.msg = `Binabasa ang mga kanta… ${i + 1}/${ids.length}`; const m = $('.adm-msg'); if (m) m.textContent = VK.admin.msg;
      try {
        const info = await vkOembed(ids[i]), pt = vkParseTitle(info.title);
        const cand = { y: ids[i], t: pt.t, a: pt.a || String(info.author_name || '').slice(0, 60), g: '' };
        if (vkFindDup(VK.lib, cand) || vkFindDup(fresh, cand)) { doubles++; continue; }
        fresh.push(cand);
      } catch (e) { skipped++; }   // private, deleted, or not allowed on other sites
    }
    let added = 0;
    await vkSaveLib(songs => {
      let code = vkNextCode(songs) - 1;
      for (const f of fresh) {
        if (songs.length >= VK_MAX) break;
        if (vkFindDup(songs, f)) { doubles++; continue; }
        songs.push({ c: ++code, ...f }); added++;
      }
      return songs;
    }, `Videoke: import ${fresh.length} songs`);
    VK.admin.msg = `Na-import: ${added} kanta`
      + (doubles ? ` · ${doubles} hindi sinama kasi meron na` : '')
      + (skipped ? ` · ${skipped} hindi pwede (private, wala na, o ayaw i-play sa ibang site)` : '') + '.';
  });
}
async function vkAdminEdit(c) {
  const s = VK.lib.find(x => x.c === c); if (!s) return;
  const t = await askText(`Title (code ${c})`, s.t, 80); if (t === null) return;
  const a = await askText('Artist', s.a, 60); if (a === null) return;
  vkAdminWork(() => vkSaveLib(songs => songs.map(x => x.c === c ? { ...x, t: (t || x.t).slice(0, 80), a: a.slice(0, 60) } : x), `Videoke: edit ${c}`));
}
async function vkAdminDelete(c) {
  const s = VK.lib.find(x => x.c === c); if (!s) return;
  if (!await askConfirm(`Burahin ang ${c} · "${s.t}"?`, 'Burahin')) return;
  vkAdminWork(() => vkSaveLib(songs => songs.filter(x => x.c !== c), `Videoke: remove ${c}`));
}

/* ============================================================
   ACCOUNT · PREMIUM PASS · ADMIN
   - Everyone must sign in with Google to subscribe.
   - Premium = ₱50 pass for 30 days (no auto-charge); paying again adds 30 days.
   - Admin test accounts = Google-verified email with a document at
     Firestore admins/{email}. firestore.rules only lets a user read their
     own document; the Worker re-checks it server-side.
   ============================================================ */
const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const AUTH = { user: null, ready: false, busy: false, admin: false };
function authReady() { return !!(BIDA_CONFIG.firebase && window.firebase); }
function paymentsReady() { return !!(authReady() && BIDA_CONFIG.workerUrl); }
function isAdmin() { return !!AUTH.admin; }
function fmtDay(ms) { return new Date(ms).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
function passActive() { return BIDA.premiumUntil > Date.now(); }
// Nothing saved in the browser can grant access on its own:
//  - admin only from THIS session's verified Google sign-in (AUTH.admin), never from storage
//  - a cached pass counts only if the signed-in Google account is the one that paid
function applyEntitlement() {
  const u = AUTH.user;
  const ownPass = !!(u && BIDA.premiumUid === u.uid && passActive());
  BIDA.premium = !!AUTH.admin || ownPass || (IS_LOCAL && !!BIDA.devPro);
}
function initAuth() {
  if (!authReady()) { AUTH.ready = true; return; }
  try {
    firebase.initializeApp(BIDA_CONFIG.firebase);
    firebase.auth().getRedirectResult().catch(() => { });
    firebase.auth().onAuthStateChanged(async u => {
      AUTH.user = u; AUTH.ready = true;
      if (u) {
        // A different Google account on this device must not inherit the last user's unlock
        if (BIDA.premiumUid && BIDA.premiumUid !== u.uid) { BIDA.proKind = ''; BIDA.premiumUntil = 0; BIDA.premiumUid = ''; applyEntitlement(); }
        await refreshPremium();
        vkState(); vkListen(); rmtListen();   // pick up guest songs and remote commands again after a reload
      } else {
        VKR.unsub?.(); VKR.unsub = null; RMT.unsub?.(); RMT.unsub = null;
        AUTH.admin = false;
        BIDA.proKind = ''; BIDA.premiumUntil = 0; BIDA.premiumUid = '';
        applyEntitlement(); saveState(); rerenderPremiumViews();
      }
      if (!$('#sheet-wrap').hidden && $('#sheet [data-acct]')) openAccount();
      if (!$('#sheet-wrap').hidden && $('#sheet .pro-hero')) openPremium(PRO_FEATURE);
    });
  } catch (e) { AUTH.ready = true; }
}
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// Admin = Google-verified email whose fingerprint is in adminHashes, or with a Firestore admins/{email} doc.
async function checkAdmin(u) {
  if (!u || !u.emailVerified || !u.email) return false;
  // Must be a real Google sign-in (not some other provider claiming the same email)
  if (!(u.providerData || []).some(p => p && p.providerId === 'google.com')) return false;
  if ((BIDA_CONFIG.adminHashes || []).includes(await sha256Hex(u.email.trim().toLowerCase()))) return true;
  try { return await checkAdminDoc(u); } catch (e) { return false; }
}
// Ask Firestore (as this user) whether admins/{email} exists. Rules decide; 200 = admin.
async function checkAdminDoc(u) {
  if (!u || !u.emailVerified || !u.email) return false;
  const id = encodeURIComponent(u.email.toLowerCase());
  const url = `https://firestore.googleapis.com/v1/projects/${BIDA_CONFIG.firebase.projectId}/databases/(default)/documents/admins/${id}`;
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + await u.getIdToken() } });
  if (r.status === 200) return true;
  if (r.status === 404 || r.status === 403) return false;
  throw new Error('firestore_' + r.status);
}
async function workerFetch(path, opts = {}) {
  const token = await AUTH.user.getIdToken();
  const r = await fetch(BIDA_CONFIG.workerUrl.replace(/\/$/, '') + path, Object.assign({}, opts, { headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'http_' + r.status);
  return j;
}
async function refreshPremium() {
  const u = AUTH.user; if (!u) return false;
  // Admin comes from the verified Google account in this session (works offline: the check is local)
  AUTH.admin = await checkAdmin(u).catch(() => false);
  try {
    if (paymentsReady()) {
      const j = await workerFetch('/status');
      if (j.admin) AUTH.admin = true;
      BIDA.premiumUntil = j.until || 0;
      BIDA.premiumUid = BIDA.premiumUntil ? u.uid : '';
    }
  } catch (e) { /* offline at the venue: keep this account's cached pass until its end date */ }
  BIDA.proKind = AUTH.admin ? 'admin' : passActive() && BIDA.premiumUid === u.uid ? 'pass' : '';
  applyEntitlement(); saveState(); rerenderPremiumViews();
  return BIDA.premium;
}
function rerenderPremiumViews() {
  rmtPublish();
  purgePremiumCache();   // premium audio leaves this device when the pass ends or another account signs in
  if (!isAdmin()) { GH.token = null; GH.state = ''; GH.files = []; }   // the GitHub token never outlives the admin's sign-in
  setTimeout(preloadPads, 0);                                          // newly unlocked pads get ready to play instantly
  if (!$('#app').hidden && RENDER[BIDA.tab]) RENDER[BIDA.tab]();
  if (!$('#live').hidden) renderLive();
  renderHead(); updateBar();
}
async function signIn() {
  if (!authReady()) { toast('Hindi pa bukas ang sign-in'); return; }
  const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
  try { await firebase.auth().signInWithPopup(p); }
  catch (e) {
    if (/popup-blocked|operation-not-supported/.test(e.code || '')) firebase.auth().signInWithRedirect(p);
    else if (!/popup-closed|cancelled-popup/.test(e.code || '')) toast('Hindi naka-sign in — subukan ulit');
  }
}
function signOut() { firebase.auth().signOut(); toast('Naka-sign out na'); }
async function startCheckout() {
  if (!AUTH.user) { await signIn(); return; }       // sign-in is required before paying
  if (!paymentsReady()) { toast('Hindi pa bukas ang payments — malapit na!'); return; }
  if (AUTH.busy) return; AUTH.busy = true;
  const b = $('#pay-btn'); if (b) { b.disabled = true; b.querySelector('span').textContent = 'Binubuksan ang PayMongo…'; }
  try {
    const j = await workerFetch('/checkout', { method: 'POST', body: '{}' });
    if (j.already) { await refreshPremium(); closeSheet(); toast('Admin account — lahat naka-unlock'); return; }
    saveState();
    location.href = j.url;
  } catch (e) {
    toast('Hindi mabuksan ang bayaran — subukan ulit');
    if (b) { b.disabled = false; b.querySelector('span').textContent = 'Bayaran'; }
  } finally { AUTH.busy = false; }
}
async function handlePaidReturn() {
  const p = new URLSearchParams(location.search).get('paid');
  if (p == null) return;
  history.replaceState(null, '', location.pathname);
  if (p !== '1') { toast('Hindi natuloy ang bayad — pwede mong subukan ulit'); return; }
  toast('Kinukumpirma ang bayad…');
  const before = BIDA.premiumUntil;
  for (let i = 0; i < 30 && !AUTH.ready; i++) await new Promise(r => setTimeout(r, 300));
  for (let i = 0; i < 15; i++) {
    if (AUTH.user) { await refreshPremium(); if (BIDA.premiumUntil > before) { toast(`Premium hanggang ${fmtDay(BIDA.premiumUntil)}. Party na!`); return; } }
    await new Promise(r => setTimeout(r, 2000));
  }
  toast('Natanggap na ang bayad pero hindi pa nag-a-unlock. I-refresh ang page mamaya.');
}

function passLine() {
  if (isAdmin()) return '<span class="badge-pro">Admin</span> Test account — lahat naka-unlock';
  if (passActive()) return `<span class="badge-pro">Premium</span> Hanggang <b>${esc(fmtDay(BIDA.premiumUntil))}</b>`;
  if (BIDA.premiumUntil) return `Natapos ang Premium noong ${esc(fmtDay(BIDA.premiumUntil))}`;
  return '';
}
let PRO_FEATURE = '';
function openPremium(feature) {
  PRO_FEATURE = feature || PRO_FEATURE;
  const u = AUTH.user, admin = isAdmin(), days = BIDA_CONFIG.passDays;
  let action;
  if (admin) action = `<div class="note" style="background:var(--leaf-soft)">${passLine()}</div>`;
  else if (!u) action = `<button class="btn btn--ink btn--lg btn--block" onclick="signIn()">${googleG()}Mag-sign in with Google para mag-subscribe</button>
      <p class="muted" style="margin-top:10px;text-align:center">Mag-sign in para naka-save ang Premium mo. Gagana sa phone, tablet o computer.</p>`;
  else action = `${passActive() ? `<div class="note" style="background:var(--leaf-soft);margin-bottom:12px">${passLine()}</div>` : ''}
      <button class="btn btn--magenta btn--lg btn--block" id="pay-btn" onclick="startCheckout()"><span>${passActive() ? `Dagdag ${days} araw` : 'Bayaran'} · ${esc(BIDA_CONFIG.price)}</span>${ic('arrow')}</button>
      <p class="muted" style="margin-top:10px;text-align:center">GCash · Maya · Card — secure checkout sa PayMongo</p>`;
  openSheet(`
    <div class="sheet-head"><h3>Bida-Vibe Premium</h3><button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <div class="pro-hero">
      ${PRO_FEATURE ? `<span class="kicker" style="color:var(--ink)">${esc(PRO_FEATURE)}</span>` : ''}
      <h4>Para sa handaan mo ngayong buwan.</h4>
      <ul class="pro-list">
        <li>${ic('star')}Lahat ng 20 sound pads + walang limit na sariling upload at recording</li>
        <li>${ic('star')}Walang limit na YouTube links, Spotify at sariling music files</li>
        <li>${ic('star')}Talk + Fade in/out kahit anong tab</li>
      </ul>
      <p style="margin-top:14px;font:800 30px/1 var(--f2);letter-spacing:-.03em">${esc(BIDA_CONFIG.price)} <small style="font:700 14px/1 var(--f)">/ ${days} araw · walang auto-charge</small></p>
    </div>
    <div style="margin-top:18px">${action}</div>
    ${u ? `<p class="muted" style="margin-top:14px;text-align:center">Naka-sign in: ${esc(u.email || '')} · <button class="btn btn--ghost btn--sm" style="min-height:30px" onclick="signOut()">Sign out</button></p>` : ''}
    ${IS_LOCAL && !BIDA.premium ? `<div class="field" style="margin-top:20px"><label for="pro-code">Test code (localhost lang)</label>
      <div style="display:flex;gap:8px"><input class="input" id="pro-code" placeholder="CODE" autocapitalize="characters">
      <button class="btn btn--ink" onclick="redeem()">Gamitin</button></div></div>` : ''}`);
}
function openAccount() {
  const u = AUTH.user, line = passLine();
  openSheet(`
    <div class="sheet-head" data-acct><h3>Account</h3><button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <div class="card stack">
      ${u ? `<div><b>${esc(u.displayName || u.email)}</b><p class="muted">${esc(u.email || '')}</p></div>` : ''}
      ${u && line ? `<p>${line}</p>` : ''}
      ${!authReady() ? '<p class="note">Hindi pa bukas ang Google sign-in — malapit na!</p>'
        : u ? `<button class="btn btn--ghost" onclick="signOut()">Sign out</button>`
          : `<button class="btn btn--ink btn--block" onclick="signIn()">${googleG()}Mag-sign in with Google</button>`}
      ${!isAdmin() ? `<button class="btn btn--magenta btn--block" onclick="openPremium()">${passActive() ? `Dagdag ${BIDA_CONFIG.passDays} araw` : 'Mag-subscribe'} · ${esc(BIDA_CONFIG.price)} / ${BIDA_CONFIG.passDays} araw</button>` : ''}
    </div>`);
}
function googleG() {
  return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#fff" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" opacity=".8"/><path fill="#fff" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z" opacity=".6"/><path fill="#fff" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z" opacity=".9"/></svg>`;
}
function redeem() {
  const c = ($('#pro-code')?.value || '').trim().toUpperCase();
  if (IS_LOCAL && c && c === BIDA_CONFIG.devUnlockCode) {
    BIDA.premium = true; BIDA.devPro = true; saveState(); closeSheet(); toast('Premium unlocked (test)!');
    rerenderPremiumViews();
  } else toast('Hindi tama ang code');
}

/* ============================================================
   LIVE MODE — current activity, timer, what's next, sound pads
   ============================================================ */
const LIVE = { timerStart: 0, running: false, elapsed: 0, iv: 0 };
function openLive() {
  if (!BIDA.program.length) { toast('Wala pang activities'); return; }
  // Open on the next activity that isn't done yet
  BIDA.liveIdx = nextIdx() >= 0 ? nextIdx() : clamp(BIDA.liveIdx || 0, 0, BIDA.program.length - 1);
  $('#live').hidden = false; document.body.style.overflow = 'hidden'; document.body.classList.add('in-live');
  requestAnimationFrame(renderAllBunting);
  renderLive(); clearInterval(LIVE.iv); LIVE.iv = setInterval(tickLive, 500); tickLive();
  try { navigator.wakeLock?.request('screen').then(l => LIVE.lock = l).catch(() => { }); } catch (e) { }
}
function closeLive() {
  $('#live').hidden = true; document.body.style.overflow = ''; document.body.classList.remove('in-live'); clearInterval(LIVE.iv);
  LIVE.lock?.release?.(); LIVE.lock = null;
}
function renderLive() {
  const i = BIDA.liveIdx, s = BIDA.program[i], k = BIDA_KINDS[s.kind] || BIDA_KINDS.opening, times = segTimes();
  const g = s.game && gameById(s.game);
  $('#live-count').textContent = `${i + 1} / ${BIDA.program.length}`;
  $('#live-now').className = 'live-now ks-' + k.color;
  $('#live-now').innerHTML = `<div class="ln-kind">${esc(k.label)} · ${fmtTime(times[i])}</div><h2>${esc(s.title)}</h2>
    <div class="ln-meta"><span class="ln-timer" id="ln-timer">${s.min}:00</span><span class="pill">${s.min} min</span>
      <button class="pill ${s.done ? 'pill--done' : ''}" onclick="toggleDone(${s.id});renderLive()">${s.done ? ic('check') + 'Tapos na' : 'Markahang tapos'}</button></div>
    ${s.note ? `<p class="ln-note">${ic('edit')}${esc(s.note)}</p>` : ''}`;
  const upcoming = BIDA.program.slice(i + 1, i + 4);
  $('#live-script').innerHTML = (g ? `
    <div class="lg-head"><b>${esc(g.name)}</b><button class="btn btn--gold btn--sm" onclick="openGame('${g.id}')">${ic('play')}Animated how-to</button></div>
    <div class="sec-title" style="margin-top:12px">${ic('box')}Kailangan</div>
    <ul class="mat-list">${g.materials.map(m => `<li>• ${esc(m)}</li>`).join('')}</ul>
    <div class="sec-title">${ic('program')}Paano laruin</div>
    <ol class="gd-steps">${g.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : '') + `
    <div class="sec-title" ${g ? '' : 'style="margin-top:0"'}>${ic('clock')}Susunod</div>
    ${upcoming.length ? `<ol class="up-list">${upcoming.map((u, j) => `<li><span>${fmtTime(times[i + 1 + j])}</span><b>${esc(u.title)}</b><small>${u.min} min</small></li>`).join('')}</ol>` : '<p class="muted">Huling activity na — palakpakan!</p>'}`;
  $('#live-pads').innerHTML = `<div class="sec-title" style="margin-top:0">${ic('sound')}Sound pads</div><div class="pads">${padsHTML()}</div>`;
  LIVE.running = false; LIVE.elapsed = 0; updateTimerBtn();
}
function liveStep(d) {
  if (d > 0) { const cur = BIDA.program[BIDA.liveIdx]; if (cur) cur.done = true; }   // Next = this one is done
  const n = clamp(BIDA.liveIdx + d, 0, BIDA.program.length - 1);
  if (d > 0 && n === BIDA.liveIdx) saveState();
  if (n === BIDA.liveIdx) { if (d > 0) toast('Tapos na ang program — palakpakan!'); return; }
  BIDA.liveIdx = n; saveState(); renderLive();
  $('.live-body').scrollTop = 0;
}
function liveTimerToggle() {
  if (LIVE.running) { LIVE.elapsed += Date.now() - LIVE.timerStart; LIVE.running = false; }
  else { LIVE.timerStart = Date.now(); LIVE.running = true; }
  updateTimerBtn(); tickLive();
}
function updateTimerBtn() {
  const b = $('#live-timer-btn'); if (!b) return;
  b.querySelector('span').textContent = LIVE.running ? 'Pause' : (LIVE.elapsed ? 'Ituloy' : 'Start timer');
}
function tickLive() {
  $('#live-clock').textContent = new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const s = BIDA.program[BIDA.liveIdx]; if (!s) return;
  const el = LIVE.elapsed + (LIVE.running ? Date.now() - LIVE.timerStart : 0);
  const rem = s.min * 60 - Math.floor(el / 1000), a = Math.abs(rem);
  const t = $('#ln-timer'); if (!t) return;
  t.textContent = (rem < 0 ? '+' : '') + Math.floor(a / 60) + ':' + String(a % 60).padStart(2, '0');
  t.classList.toggle('over', rem < 0);
}

/* ============================================================
   SHEET
   ============================================================ */
let lastFocus;
function openSheet(html) {
  lastFocus = document.activeElement;
  $('#sheet').innerHTML = '<div class="sheet-grip"></div>' + html;
  $('#sheet-wrap').hidden = false; document.body.style.overflow = 'hidden';
  $('#sheet').scrollTop = 0;
}
function closeSheet() {
  clearInterval(stepTimer);
  $('#sheet-wrap').hidden = true;
  if ($('#live').hidden) document.body.style.overflow = '';
  lastFocus?.focus?.();
}

/* ============================================================
   KEYBOARD — Space = Talk (anywhere), 1–0/Q–P = pads
   ============================================================ */
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (e.key === 'Escape') { if (!$('#sheet-wrap').hidden) closeSheet(); else if (!$('#live').hidden) closeLive(); return; }
  if (!$('#sheet-wrap').hidden || !$('#landing').hidden) return;
  const live = !$('#live').hidden;
  if (e.code === 'Space' && !e.repeat && !e.target.closest('button')) {
    e.preventDefault(); BIDA.music.mode === 'hold' ? duckDown() : (M.ducked ? duckUp() : duckDown()); return;
  }
  if (live && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { liveStep(e.key === 'ArrowRight' ? 1 : -1); return; }
  if ((live || BIDA.tab === 'sounds') && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const idx = PAD_KEYS.indexOf(e.key.toLowerCase());
    if (idx >= 0) {
      const pads = $$(live ? '#live-pads .pad[data-sid]' : '#pads .pad[data-sid]');
      if (pads[idx]) playSound(pads[idx].dataset.sid, pads[idx]);
    }
  }
});
document.addEventListener('keyup', e => {
  if (e.code === 'Space' && BIDA.music.mode === 'hold' && M.ducked && !MIC.auto) duckUp();
});

/* ============================================================
   BOOT
   ============================================================ */
let resizeT;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(renderAllBunting, 150); });
document.addEventListener('DOMContentLoaded', async () => {
  loadState();
  // A test unlock from localhost must never carry over to the live site
  if (!IS_LOCAL) BIDA.devPro = false;
  applyEntitlement(); saveState();   // a 30-day pass locks again on its end date, even offline
  M.current = BIDA.music.master;
  bindTalk($('#talk-bar'));
  $('#mb-talk').innerHTML = talkControls('bar');
  renderPlaylist();
  initAuth();
  handlePaidReturn();
  await spHandleRedirect();
  await loadCustom();
  const probing = loadPads().then(() => { preloadPads(); return null; }).then(() => { if (BIDA.tab === 'sounds' && !$('#app').hidden) renderSounds(); if (!$('#live').hidden) renderLive(); });
  const startTab = new URLSearchParams(location.search).get('tab');
  if (BIDA.seenLanding || startTab) enterApp(startTab || BIDA.tab);
  else { $('#landing').hidden = false; requestAnimationFrame(renderAllBunting); }
  updateBar();
  if (BIDA.music.autoDuck) { BIDA.music.autoDuck = false; saveState(); } // mic needs a fresh user gesture
  await probing;
});

/* ---------- exports for inline handlers ---------- */
Object.assign(window, { rmtSheet, rmtStart, rmtCopy, rmtStop, cardUploadBg, cardRemoveBg, CARD_UI_more: open => { CARD_UI.more = open; },
  BIDA_CONFIG, $, enterApp, showLanding, goTab, setEv, pickEventType,
  moveSeg, resetProgram, editSeg, saveSeg, deleteSeg, pickKind, pickMin, toggleDone,
  setCard, resetCard, downloadCard, shareCard,
  vkKey, vkReserveTyped, vkReserve, vkQMove, vkQDel, vkScoreToggle, vkFind, vkStart, vkClose, vkNext, vkFullscreen, vkAddMine,
  vkAdminAdd, vkAdminImport, vkAdminEdit, vkAdminDelete, vkAdminFind, vkAdminPage, vkAdminDup, vkSetLetter, vkSetArtist, vkClearFilter, vkPickArtist, vkArtistList, vkSetArtistIdx, vkMakeRoom, vkShareRoom, vkCloseRoom, vkShowQR, vkDownloadQR,
  setGameFilter, openGame, playSteps, checkMat, addGameToProgram,
  playSound, uploadSounds, delSound, addSoundClick, micRetryNow, adminTier, adminUpload, adminPatch, adminRename, adminDelete, ghSaveToken, ghChangeToken, ghUpload, ghRename, ghMove, ghDelete, GH_retry,
  addYouTube, playYouTube, delYouTube, togglePlaylist, loadLocal, playLocal, spPlay, spLogin, musicToggle, musicSkip, setMaster, setDuck, fadeTo, fadeToggle, duckDown, duckUp,
  toggleBar, barInfoClick, setTalkSpeed, setAutoReturn, setAutoDuck, setMusicSrc, openExt,
  openPremium, openAccount, redeem, signIn, signOut, startCheckout, openLive, closeLive, liveStep, liveTimerToggle,
  openSheet, closeSheet, saveState
});
Object.defineProperty(window, 'BIDA', { get: () => BIDA });
Object.defineProperty(window, 'M', { get: () => M });
})();
