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
  freeSounds: 4,      // first N default pads are free
  freeUploads: 2,     // uploaded sound pads a free user can add
  freeRecordings: 2,  // recorded sound pads a free user can add (separate from uploads)
  recordMaxSec: 3,    // every recording stops automatically after this many seconds
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
    liveIdx: 0
  };
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(BIDA)); } catch (e) { /* storage full or blocked */ }
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
      if (!['plan', 'games', 'sounds', 'music'].includes(BIDA.tab)) BIDA.tab = 'plan';
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
}

/* ---------- In-app dialogs (never native confirm/prompt: they freeze the page and can pause music) ---------- */
function openDlg(msg, { input = null, yes = 'Oo', no = 'Huwag' } = {}) {
  return new Promise(resolve => {
    const wrap = $('#dlg-wrap'), inp = $('#dlg-input'), y = $('#dlg-yes'), n = $('#dlg-no');
    $('#dlg-msg').textContent = msg; y.textContent = yes; n.textContent = no;
    inp.hidden = input === null; if (input !== null) inp.value = input;
    wrap.hidden = false; (input !== null ? inp : y).focus();
    const done = v => { wrap.hidden = true; y.onclick = n.onclick = inp.onkeydown = wrap.onclick = null; resolve(v); };
    y.onclick = () => done(input !== null ? inp.value.trim() : true);
    n.onclick = () => done(input !== null ? null : false);
    inp.onkeydown = e => { if (e.key === 'Enter') y.onclick(); if (e.key === 'Escape') n.onclick(); };
    wrap.onclick = e => { if (e.target === wrap) n.onclick(); };
  });
}
const askConfirm = (msg, yes) => openDlg(msg, { yes });
const askText = (msg, def) => openDlg(msg, { input: def, yes: 'I-save', no: 'Kanselahin' });

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
const RENDER = { plan: renderPlan, games: renderGames, sounds: renderSounds, music: renderMusic };
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
  }
};
const SCENE_BG = { chairs: '', paper: 'gold', henyo: 'magenta', bringme: 'leaf', freeze: 'gold', relay: 'leaf', whisper: 'magenta', charades: 'gold', hephep: '', line: 'chili', balloon: 'magenta', jakenpoy: 'gold', feud: '', pass: 'chili', cupstack: 'leaf', tug: 'gold', cupgrab: 'magenta', coin: '', dice: 'chili', toss: 'leaf' };
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
      <p>Animated how-to, kailangang gamit at steps. Tap para makita, idagdag sa activities.</p></div></div>
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
    ${g.credit ? `<p class="muted game-credit">Laro mula kay <a href="${esc(g.credit.url)}" target="_blank" rel="noopener noreferrer">${esc(g.credit.by)}</a> (@digthegames sa TikTok) — panoorin doon ang original na video.</p>` : ''}
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
   SOUND PADS — 20 default sounds loaded from /sounds/*.mp3
   (see sounds/README.md for the exact file names) + uploads.
   Free: first BIDA_CONFIG.freeSounds defaults, freeUploads uploads.
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

// The file name is the contract: put exactly these files in /sounds.
const DEFAULT_SOUNDS = [
  { file: '01-boink.mp3',     name: 'Boink',        c: 'gold' },
  { file: '02-tawa.mp3',      name: 'Tawa',         c: 'magenta' },
  { file: '03-faah.mp3',      name: 'Faah',         c: 'chili' },
  { file: '04-drumroll.mp3',  name: 'Drumroll',     c: 'turq' },
  { file: '05-palakpak.mp3',  name: 'Palakpak',     c: 'leaf' },
  { file: '06-badumtss.mp3',  name: 'Ba-dum-tss',   c: 'gold' },
  { file: '07-airhorn.mp3',   name: 'Air horn',     c: 'chili' },
  { file: '08-tama.mp3',      name: 'Tama! (ding)', c: 'leaf' },
  { file: '09-mali.mp3',      name: 'Mali! (buzzer)', c: 'chili' },
  { file: '10-tada.mp3',      name: 'Ta-da!',       c: 'gold' },
  { file: '11-kuliglig.mp3',  name: 'Kuliglig',     c: 'leaf' },
  { file: '12-giggle.mp3',    name: 'Giggle',       c: 'magenta' },
  { file: '13-bruh.mp3',      name: 'Bruh',         c: 'paper' },
  { file: '14-wahwah.mp3',    name: 'Wah-wah',      c: 'turq' },
  { file: '15-wow.mp3',       name: 'Wow',          c: 'magenta' },
  { file: '16-dundun.mp3',    name: 'Dun dun DUN',  c: 'chili' },
  { file: '17-kaching.mp3',   name: 'Ka-ching',     c: 'gold' },
  { file: '18-whoosh.mp3',    name: 'Whoosh',       c: 'paper' },
  { file: '19-pop.mp3',       name: 'Pop',          c: 'turq' },
  { file: '20-countdown.mp3', name: 'Countdown',    c: 'leaf' }
].map((s, i) => ({ ...s, id: 'd' + (i + 1), n: i + 1 }));
const SOUND_DIR = 'sounds/';
const SND_OK = {};            // id → true (file exists) / false (missing)
const BUF_CACHE = {};
const PAD_KEYS = '1234567890qwertyuiopasdfghjkl'.split('');

async function probeDefaults() {
  await Promise.all(DEFAULT_SOUNDS.map(async s => {
    if (s.id in SND_OK) return;
    try {
      const r = await fetch(SOUND_DIR + s.file, { cache: 'no-cache' });   // revalidate: replaced files show up right away
      if (!r.ok) { SND_OK[s.id] = false; return; }
      const buf = await r.arrayBuffer();
      SND_OK[s.id] = true;
      ac().decodeAudioData(buf.slice(0)).then(b => { BUF_CACHE[s.id] = b; }).catch(() => { SND_OK[s.id] = false; });
    } catch (e) { SND_OK[s.id] = false; }
  }));
}

/* ---- custom sounds: IndexedDB ---- */
let DB;
function db() {
  if (DB) return Promise.resolve(DB);
  return new Promise((res, rej) => {
    const r = indexedDB.open('bidavibe_media', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('sounds', { keyPath: 'id' });
    r.onsuccess = () => { DB = r.result; res(DB); }; r.onerror = () => rej(r.error);
  });
}
function dbAll() { return db().then(d => new Promise(res => { const q = d.transaction('sounds').objectStore('sounds').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); })); }
function dbPut(o) { return db().then(d => new Promise(res => { const tx = d.transaction('sounds', 'readwrite'); tx.objectStore('sounds').put(o); tx.oncomplete = res; })); }
function dbDel(id) { return db().then(d => new Promise(res => { const tx = d.transaction('sounds', 'readwrite'); tx.objectStore('sounds').delete(id); tx.oncomplete = res; })); }
let CUSTOM = [];          // [{id,name,blob,c,created}]
async function loadCustom() {
  try {
    CUSTOM = (await dbAll()).filter(s => /^[ur][a-z0-9]{4,30}$/.test(String(s.id)) && s.blob instanceof Blob)
      .map(s => ({ ...s, name: String(s.name || 'Sound').slice(0, 20) }))
      .sort((a, b) => (a.created || 0) - (b.created || 0));
  } catch (e) { CUSTOM = []; }
}

function soundEntry(id) {
  const d = DEFAULT_SOUNDS.find(s => s.id === id);
  if (d) return { ...d, kind: 'default' };
  const c = CUSTOM.find(s => s.id === id); if (!c) return null;
  const type = isRec(c) ? 'rec' : 'up';
  return { ...c, kind: 'custom', type, idx: CUSTOM.filter(s => isRec(s) === (type === 'rec')).indexOf(c) };
}
const isRec = s => s.id[0] === 'r';
function canPlaySound(id) {
  if (BIDA.premium) return true;
  const s = soundEntry(id); if (!s) return false;
  if (s.kind === 'default') return s.n <= BIDA_CONFIG.freeSounds;
  return s.idx < (s.type === 'rec' ? BIDA_CONFIG.freeRecordings : BIDA_CONFIG.freeUploads);
}
async function playSound(id, padEl) {
  if (!canPlaySound(id)) { openPremium('Sound pads'); return; }
  if (padEl) { padEl.classList.add('hit'); setTimeout(() => padEl.classList.remove('hit'), 120); }
  const x = ac();
  try {
    if (!BUF_CACHE[id]) {
      const s = soundEntry(id);
      const ab = s.kind === 'default' ? await (await fetch(SOUND_DIR + s.file)).arrayBuffer() : await s.blob.arrayBuffer();
      BUF_CACHE[id] = await x.decodeAudioData(ab);
    }
    const src = x.createBufferSource(); src.buffer = BUF_CACHE[id]; src.connect(SFX_BUS); src.start();
  } catch (e) { toast('Hindi ma-play ang sound na ito'); }
}
function padList() {
  const defs = DEFAULT_SOUNDS.filter(s => SND_OK[s.id]).map(s => ({ id: s.id, name: s.name, c: s.c, kind: 'default' }));
  const cust = CUSTOM.map(s => ({ id: s.id, name: s.name, c: s.c || 'paper', kind: 'custom' }));
  return [...defs, ...cust];
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
function uploadsLeft() { return BIDA.premium ? Infinity : Math.max(0, BIDA_CONFIG.freeUploads - CUSTOM.filter(s => !isRec(s)).length); }
function recordingsLeft() { return BIDA.premium ? Infinity : Math.max(0, BIDA_CONFIG.freeRecordings - CUSTOM.filter(isRec).length); }
const leftLabel = (n, more) => n === Infinity ? more : n ? `${n} libre pa` : 'Premium';
async function renderSounds() {
  const missing = DEFAULT_SOUNDS.filter(s => SND_OK[s.id] === false);
  const max = BIDA_CONFIG.recordMaxSec;
  $('#panel-sounds').innerHTML = `
    <div class="panel-head"><div><h2>Sound pads</h2>
      <p>${BIDA.premium ? 'Lahat ng sounds naka-unlock.' : `Libre ang unang ${BIDA_CONFIG.freeSounds} sounds, ${BIDA_CONFIG.freeUploads} upload at ${BIDA_CONFIG.freeRecordings} recording (max ${max}s bawat isa).`}</p></div>
      ${BIDA.premium ? '' : `<button class="btn btn--gold btn--sm" onclick="openPremium('Sound pads')">${ic('lock')}I-unlock lahat</button>`}</div>
    <div class="pads" id="pads">${padsHTML()}
      <button class="pad pad--add" onclick="addSoundClick()">${ic('upload')}<span class="pad-name">Upload</span>
        <small>${leftLabel(uploadsLeft(), 'mp3 · m4a · wav')}</small></button>
      <button class="pad pad--add" id="rec-btn" onclick="recordClick()">${ic('rec')}<span class="pad-name">Record</span>
        <small>${leftLabel(recordingsLeft(), `max ${max}s`)}${recordingsLeft() !== Infinity && recordingsLeft() ? ` · max ${max}s` : ''}</small></button></div>
    <input type="file" id="snd-file" accept="audio/*" multiple hidden onchange="uploadSounds(this.files);this.value=''">
    ${isAdmin() && missing.length ? `<div class="note" style="margin-top:18px"><b>Admin:</b> ${missing.length} default sound${missing.length > 1 ? 's' : ''} wala pa sa <code>sounds/</code> folder: ${missing.map(s => `<code>${s.file}</code>`).join(' ')}</div>` : ''}`;
}
function addSoundClick() {
  if (!uploadsLeft()) { openPremium('Dagdag sounds'); return; }
  $('#snd-file').click();
}
async function uploadSounds(files) {
  let added = 0;
  for (const f of files) {
    if (!uploadsLeft()) { openPremium('Dagdag sounds'); break; }
    if (f.size > 8 * 1024 * 1024) { toast(`${f.name}: masyadong malaki (max 8MB)`); continue; }
    const s = { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: f.name.replace(/\.[^.]+$/, '').slice(0, 20), blob: f, c: ['magenta', 'turq', 'gold', 'leaf', 'chili'][CUSTOM.length % 5], created: Date.now() };
    await dbPut(s); CUSTOM.push(s); added++;
  }
  renderSounds(); if (added) toast(added > 1 ? `${added} sounds nadagdag!` : 'Nadagdag ang sound!');
}
async function delSound(id) {
  if (!await askConfirm('Tanggalin ang sound na ito?', 'Tanggalin')) return;
  await dbDel(id); CUSTOM = CUSTOM.filter(s => s.id !== id); delete BUF_CACHE[id]; renderSounds();
}
/* ---- Microphone permission help: explains how to turn it on for THIS phone/browser, then retry ---- */
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
    steps = ['I-tap ang ⋮ o … sa itaas na kanan.', `Piliin ang "Open in browser" / "Buksan sa ${ios ? 'Safari' : 'Chrome'}".`, 'Doon pindutin ulit ang Record.'];
  } else if (ios && !iosOther) {
    steps = ['I-tap ang "aA" sa address bar ng Safari.', 'Piliin ang "Website Settings".', 'Microphone → Allow.', 'Bumalik dito at pindutin ang "Subukan ulit".',
      'Kung wala: buksan ang Settings app → Safari (o Apps → Safari) → Microphone → Ask o Allow.'];
  } else if (ios) {
    steps = ['Buksan ang Settings app ng iPhone.', `Hanapin ang ${brave ? 'Brave' : 'browser mo (hal. Chrome)'} → i-ON ang Microphone.`, 'Bumalik dito, i-reload ang page, at pindutin ulit ang Record.'];
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
let recorder, recChunks = [];
function recordClick() {
  if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
  if (!recordingsLeft()) { openPremium('Dagdag recordings'); return; }
  toggleRecord();
}
async function toggleRecord() {
  const btn = $('#rec-btn'), max = BIDA_CONFIG.recordMaxSec;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast('Hindi kayang mag-record ng browser na ito — subukan sa Chrome o Safari'); return; }
  if (await micDenied()) { micHelp({ name: 'NotAllowedError' }, toggleRecord); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recChunks = []; recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => e.data.size && recChunks.push(e.data);
    let tick;
    recorder.onstop = async () => {
      clearInterval(tick);
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' });
      const name = String(await askText('Pangalan ng sound?', 'Recording ' + (CUSTOM.filter(isRec).length + 1)) || 'Recording').slice(0, 20);
      const s = { id: 'r' + Date.now().toString(36), name, blob, c: 'magenta', created: Date.now() };
      await dbPut(s); CUSTOM.push(s); renderSounds(); toast('Na-save ang recording!');
    };
    recorder.start();
    // Hard stop at max seconds, with a visible countdown on the pad
    const t0 = Date.now(), label = btn.querySelector('.pad-name'), sub = btn.querySelector('small');
    btn.classList.add('rec-on'); label.textContent = 'Stop';
    const show = () => { sub.textContent = Math.max(0, max - (Date.now() - t0) / 1000).toFixed(1) + 's'; };
    show(); tick = setInterval(show, 100);
    setTimeout(() => recorder?.state === 'recording' && recorder.stop(), max * 1000);
  } catch (e) { micHelp(e, toggleRecord); }
}

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
    <p class="muted ar-hint">${m.mode === 'hold' ? 'Pindutin nang matagal ang Talk; babalik ang music pag binitawan.' : 'Tap ang Talk para humina; tap ulit para bumalik.'} Pareho ang bilis ng paghina at pagbalik.</p>`;
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
  $$('.ar-hint').forEach(p => p.textContent = (on ? 'Pindutin nang matagal ang Talk; babalik ang music pag binitawan.' : 'Tap ang Talk para humina; tap ulit para bumalik.') + ' Pareho ang bilis ng paghina at pagbalik.');
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
  if (!links.length) return '<p class="muted">Wala pang naka-save. I-paste ang link sa itaas.</p>';
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
      <p>Pumili ng music dito. Ang controls — play, next, fade at Talk — ay nasa music bar sa ibaba, kahit anong tab.</p></div></div>
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
        <p class="note" style="margin-top:14px"><b>Tip:</b> Buksan ang Bida-Vibe sa <b>Brave browser</b> — kadalasang hinaharangan ng Brave Shields ang YouTube ads, kaya hindi maiistorbo ang party.</p>
      </div>
      <div ${m.src === 'spotify' ? '' : 'hidden'}>
        ${BIDA_CONFIG.spotifyClientId ? `
        <div class="field"><label for="sp-url">Spotify playlist / album link</label>
          <input class="input" id="sp-url" placeholder="https://open.spotify.com/playlist/…" value="${esc(m.spUrl)}"></div>
        <button class="btn btn--leaf btn--block" style="margin-top:12px" onclick="spPlay()">${ic('play')}${spToken() ? 'I-load' : 'Connect at i-load'}</button>
        <p class="note" style="margin-top:12px">Kailangan ng <b>Spotify Premium</b>. ${isMobileUA ? 'Sa phone/tablet: buksan muna ang Spotify app — ito ang kokontrolin, kasama ang fade.' : 'Sa computer: tutugtog dito mismo.'}</p>` : `
        <p class="note">Hindi pa naka-setup ang Spotify (kailangan ng Client ID ng developer).</p>`}
      </div>
      <div ${m.src === 'local' ? '' : 'hidden'}>
        <button class="btn btn--turq btn--block" onclick="${BIDA.premium ? `$('#local-files').click()` : `openPremium('Music player')`}">${ic('upload')}Pumili ng music files</button>
        <input type="file" id="local-files" accept="audio/*" multiple hidden onchange="loadLocal(this.files);this.value=''">
        <p class="muted" style="margin-top:8px">Mp3 o m4a sa device mo. Hindi ina-upload kahit saan.</p>
      </div>
      <div ${m.src === 'link' ? '' : 'hidden'}>
        <div class="field"><label for="ext-url">Apple Music, Deezer, SoundCloud…</label>
          <input class="input" id="ext-url" placeholder="I-paste ang link" value="${esc(m.link)}" onchange="BIDA.music.link=this.value;saveState()"></div>
        <button class="btn btn--ink btn--block" style="margin-top:12px" onclick="openExt()">Buksan sa app ${ic('arrow')}</button>
        <p class="note" style="margin-top:12px">Walang fade dito — hindi pinapayagan ng mga app na ito ang volume control mula sa ibang website.</p>
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
      } else {
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
      <p class="muted" style="margin-top:10px;text-align:center">Kailangan ng account para naka-save ang Premium mo — gagana sa phone, tablet at computer.</p>`;
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
  const probing = probeDefaults().then(() => { if (BIDA.tab === 'sounds' && !$('#app').hidden) renderSounds(); if (!$('#live').hidden) renderLive(); });
  const startTab = new URLSearchParams(location.search).get('tab');
  if (BIDA.seenLanding || startTab) enterApp(startTab || BIDA.tab);
  else { $('#landing').hidden = false; requestAnimationFrame(renderAllBunting); }
  updateBar();
  if (BIDA.music.autoDuck) { BIDA.music.autoDuck = false; saveState(); } // mic needs a fresh user gesture
  await probing;
});

/* ---------- exports for inline handlers ---------- */
Object.assign(window, {
  BIDA_CONFIG, $, enterApp, showLanding, goTab, setEv, pickEventType,
  moveSeg, resetProgram, editSeg, saveSeg, deleteSeg, pickKind, pickMin, toggleDone,
  setGameFilter, openGame, playSteps, checkMat, addGameToProgram,
  playSound, uploadSounds, delSound, addSoundClick, recordClick, micRetryNow,
  addYouTube, playYouTube, delYouTube, togglePlaylist, loadLocal, playLocal, spPlay, spLogin, musicToggle, musicSkip, setMaster, setDuck, fadeTo, fadeToggle, duckDown, duckUp,
  toggleBar, barInfoClick, setTalkSpeed, setAutoReturn, setAutoDuck, setMusicSrc, openExt,
  openPremium, openAccount, redeem, signIn, signOut, startCheckout, openLive, closeLive, liveStep, liveTimerToggle,
  openSheet, closeSheet, saveState
});
Object.defineProperty(window, 'BIDA', { get: () => BIDA });
Object.defineProperty(window, 'M', { get: () => M });
})();
