/* ============================================================
   Bida-Vibe — app logic
   State lives in one global BIDA object. Every mutation is
   followed by saveState() and a targeted render*() call.
   ============================================================ */
(function () {
'use strict';

/* ---------- Config (edit before launch) ---------- */
const BIDA_CONFIG = {
  // Premium: paste your payment link (PayMongo / GCash / Maya / Stripe link) here.
  paymentUrl: '',
  priceLabel: '',                 // e.g. '₱149 one-time' — left blank until you set a price
  // Client-side unlock codes for testing / promo. Not secure — replace with a server check later.
  unlockCodes: ['BIDATEST'],
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
    v: 1,
    event: { type: 'reunion', name: '', group: '', host: '', date: '', start: '15:00' },
    tones: ['friendly', 'jolly'],
    program: [],
    scriptEdits: {},
    nextId: 1,
    premium: false,
    music: { master: 0.8, duck: 0.2, fade: 500, mode: 'hold', src: 'youtube', ytUrl: '', spUrl: '', link: '', autoDuck: false, sens: 0.5 },
    seenLanding: false,
    tab: 'event',
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
    }
  } catch (e) { BIDA = defaultState(); }
  if (!BIDA.program.length) buildProgram(BIDA.event.type);
}

/* ---------- Helpers ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
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
function dayPart() {
  const h = Math.floor(toMin(BIDA.event.start) / 60);
  return h < 12 ? 'umaga' : h < 18 ? 'hapon' : 'gabi';
}
function fillVars(str, extra = {}) {
  const e = BIDA.event, et = eventType();
  const vars = Object.assign({
    event: e.name || et.label, group: e.group || 'mga kapamilya', host: e.host || 'inyong host',
    time: dayPart()
  }, extra);
  return String(str).replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

/* ---------- Program ---------- */
function buildProgram(typeId) {
  const et = eventType(typeId);
  BIDA.program = et.program.map(([kind, title, min, game]) => ({ id: BIDA.nextId++, kind, title, min, game: game || '' }));
  BIDA.scriptEdits = {};
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
  // tiny dots near top
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
  $('#landing').hidden = true; $('#app').hidden = false;
  goTab(tab || BIDA.tab || 'event');
  requestAnimationFrame(renderAllBunting);
}
function showLanding() {
  $('#landing').hidden = false; $('#app').hidden = true;
  requestAnimationFrame(renderAllBunting);
}

/* ---------- Tabs ---------- */
const RENDER = {
  event: renderEvent, program: renderProgram, script: renderScript,
  games: renderGames, sounds: renderSounds, music: renderMusic
};
function goTab(name) {
  if (!RENDER[name]) name = 'event';
  BIDA.tab = name; saveState();
  $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
  RENDER[name]();
  renderHead();
  $('#app').classList.toggle('on-music', name === 'music');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
function renderHead() {
  const e = BIDA.event, et = eventType();
  $('#head-event').innerHTML = `<b>${esc(e.name || et.label)}</b>${e.date ? ' · ' + esc(fmtDate(e.date)) : ''} · ${fmtTime(toMin(e.start))}`;
}
function fmtDate(d) {
  try { return new Date(d + 'T00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }); } catch (e) { return d; }
}

/* ============================================================
   EVENT PANEL
   ============================================================ */
function renderEvent() {
  const e = BIDA.event;
  $('#panel-event').innerHTML = `
    <div class="panel-head"><div><span class="kicker">Step 1</span><h2>Anong handaan?</h2>
      <p>Pumili ng event type — gagawa agad kami ng suggested program. Pwede mo itong baguhin pagkatapos.</p></div></div>
    <div class="card stack">
      <div class="etypes">${BIDA_EVENTS.map(t => `
        <button class="etype ${t.id === e.type ? 'on' : ''}" onclick="pickEventType('${t.id}')" aria-pressed="${t.id === e.type}">
          <b>${esc(t.label)}</b><span>${esc(t.tag)}</span></button>`).join('')}</div>
    </div>
    <div class="card stack">
      <h3>Mga detalye</h3>
      <div class="grid-2">
        <div class="field"><label for="ev-name">Pangalan ng event</label>
          <input class="input" id="ev-name" placeholder="hal. Reunion ng Angkang Santos 2026" value="${esc(e.name)}" oninput="setEv('name',this.value)"></div>
        <div class="field"><label for="ev-group">Pamilya / grupo</label>
          <input class="input" id="ev-group" placeholder="hal. Pamilya Santos" value="${esc(e.group)}" oninput="setEv('group',this.value)"></div>
        <div class="field"><label for="ev-host">Pangalan ng host</label>
          <input class="input" id="ev-host" placeholder="hal. Tita Bing" value="${esc(e.host)}" oninput="setEv('host',this.value)"></div>
        <div class="field"><label for="ev-date">Petsa</label>
          <input class="input" id="ev-date" type="date" value="${esc(e.date)}" oninput="setEv('date',this.value)"></div>
        <div class="field"><label for="ev-start">Simula ng program</label>
          <input class="input" id="ev-start" type="time" value="${esc(e.start)}" oninput="setEv('start',this.value)"></div>
      </div>
    </div>
    <div class="card" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
      <div><h3>${BIDA.program.length} segments · ${Math.floor(totalMin() / 60)}h ${totalMin() % 60}m</h3>
      <p class="muted">Matatapos ng mga ${fmtTime(toMin(e.start) + totalMin())}</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn--ghost" onclick="goTab('program')">Tingnan ang program</button>
        <button class="btn btn--magenta" onclick="goTab('script')">Gawin ang host script ${ic('arrow')}</button>
      </div>
    </div>`;
}
function setEv(k, v) {
  BIDA.event[k] = v; saveState(); renderHead();
  if (k === 'start') renderEventSummaryOnly();
}
function renderEventSummaryOnly() { /* keep focus: only refresh end-time text lazily */
  const p = $('#panel-event .card:last-child .muted');
  if (p) p.textContent = 'Matatapos ng mga ' + fmtTime(toMin(BIDA.event.start) + totalMin());
}
function pickEventType(id) {
  if (id === BIDA.event.type) return;
  const edited = Object.keys(BIDA.scriptEdits).length > 0;
  if (edited && !confirm('Papalitan nito ang program at ang mga in-edit mong script. Ituloy?')) return;
  BIDA.event.type = id; buildProgram(id); saveState(); renderEvent(); renderHead();
  toast(`Program para sa ${eventType().label} — handa na!`);
}

/* ============================================================
   PROGRAM PANEL
   ============================================================ */
function renderProgram() {
  const times = segTimes();
  $('#panel-program').innerHTML = `
    <div class="panel-head"><div><span class="kicker">Run of show</span><h2>Program</h2>
      <p>Suggested para sa <b>${esc(eventType().label)}</b>. I-edit, ayusin ang pagkakasunod, o magdagdag.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn--ghost btn--sm" onclick="resetProgram()">I-reset</button>
        <button class="btn btn--ink btn--sm" onclick="editSeg()">${ic('plus')}Dagdag</button></div></div>
    <div class="prog-summary">
      <span class="pill">${ic('clock')}${fmtTime(toMin(BIDA.event.start))} – ${fmtTime(toMin(BIDA.event.start) + totalMin())}</span>
      <span class="pill">${BIDA.program.length} segments</span>
      <span class="pill">${BIDA.program.filter(s => s.kind === 'game').length} games</span>
    </div>
    <ol class="prog-list">${BIDA.program.map((s, i) => {
      const k = BIDA_KINDS[s.kind] || BIDA_KINDS.opening, g = s.game && gameById(s.game);
      return `<li class="seg k-${k.color}">
        <div class="seg-time">${fmtTime(times[i]).replace(' ', '<br><small>') }</small></div>
        <div class="seg-main"><span>${esc(k.label)} · ${s.min} min</span><b>${esc(s.title)}</b>
          ${g ? `<button class="game-link" onclick="openGame('${g.id}')">${esc(g.name)} — how to play</button>` : ''}</div>
        <div class="seg-actions">
          <button class="icon-btn icon-btn--plain" onclick="moveSeg(${i},-1)" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${ic('up')}</button>
          <button class="icon-btn icon-btn--plain" onclick="moveSeg(${i},1)" aria-label="Move down" ${i === BIDA.program.length - 1 ? 'disabled' : ''}>${ic('down')}</button>
          <button class="icon-btn" onclick="editSeg(${s.id})" aria-label="Edit">${ic('edit')}</button>
        </div></li>`;
    }).join('')}</ol>
    <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn--chili" onclick="openLive()">${ic('live')}Simulan ang Live Host Mode</button>
    </div>`;
}
function moveSeg(i, d) {
  const j = i + d; if (j < 0 || j >= BIDA.program.length) return;
  const p = BIDA.program;[p[i], p[j]] = [p[j], p[i]]; saveState(); renderProgram();
}
function resetProgram() {
  if (!confirm('I-reset ang program sa suggested ng ' + eventType().label + '?')) return;
  buildProgram(BIDA.event.type); saveState(); renderProgram(); toast('Na-reset ang program');
}
function editSeg(id) {
  const s = id ? BIDA.program.find(x => x.id === id) : { kind: 'game', title: '', min: 15, game: '' };
  openSheet(`
    <div class="sheet-head"><h3>${id ? 'I-edit ang segment' : 'Bagong segment'}</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <div class="stack">
      <div class="field"><label for="sg-title">Pamagat</label><input class="input" id="sg-title" value="${esc(s.title)}" placeholder="hal. Pa-raffle ni Tito Boy"></div>
      <div class="grid-2">
        <div class="field"><label for="sg-kind">Uri</label><select class="input" id="sg-kind" onchange="$('#sg-game-wrap').hidden=this.value!=='game'&&this.value!=='icebreak'">
          ${Object.entries(BIDA_KINDS).map(([k, v]) => `<option value="${k}" ${k === s.kind ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select></div>
        <div class="field"><label for="sg-min">Minuto</label><input class="input" id="sg-min" type="number" min="1" max="300" value="${s.min}"></div>
      </div>
      <div class="field" id="sg-game-wrap" ${s.kind === 'game' || s.kind === 'icebreak' ? '' : 'hidden'}><label for="sg-game">Laro</label>
        <select class="input" id="sg-game"><option value="">— Wala / sariling laro —</option>
        ${BIDA_GAMES.map(g => `<option value="${g.id}" ${g.id === s.game ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
    </div>
    <div class="sheet-actions">
      ${id ? `<button class="btn btn--ghost" onclick="deleteSeg(${id})">${ic('trash')}Tanggalin</button>` : ''}
      <button class="btn btn--ink" onclick="saveSeg(${id || 0})">I-save</button>
    </div>`);
  setTimeout(() => $('#sg-title')?.focus(), 50);
}
function saveSeg(id) {
  const kind = $('#sg-kind').value, game = (kind === 'game' || kind === 'icebreak') ? $('#sg-game').value : '';
  let title = $('#sg-title').value.trim();
  if (!title) title = game ? gameById(game).name : BIDA_KINDS[kind].label;
  const min = clamp(parseInt($('#sg-min').value, 10) || 5, 1, 300);
  if (id) {
    const s = BIDA.program.find(x => x.id === id);
    if (s.kind !== kind || s.game !== game) delete BIDA.scriptEdits[id];
    Object.assign(s, { kind, title, min, game });
  } else BIDA.program.push({ id: BIDA.nextId++, kind, title, min, game });
  saveState(); closeSheet(); renderProgram(); toast('Na-save!');
}
function deleteSeg(id) {
  BIDA.program = BIDA.program.filter(s => s.id !== id); delete BIDA.scriptEdits[id];
  saveState(); closeSheet(); renderProgram(); toast('Natanggal ang segment');
}

/* ============================================================
   SCRIPT PANEL
   ============================================================ */
const TONE_ORDER = ['formal', 'serious', 'friendly', 'jolly'];
function genScript(seg, i) {
  const tones = TONE_ORDER.filter(t => BIDA.tones.includes(t));
  if (!tones.length) tones.push('friendly');
  const main = tones[0];
  const lib = BIDA_SCRIPTS[seg.kind] || BIDA_SCRIPTS.opening;
  const next = BIDA.program[i + 1];
  const vars = { title: seg.title, next: next ? next.title : 'ang pagtatapos' };
  const out = [];
  if (i > 0) out.push(fillVars(BIDA_SEGUES[main], { next: seg.title }));
  out.push(fillVars(lib[main][0], vars));
  if (tones.includes('serious') && main !== 'serious' && lib.serious) out.push(fillVars(lib.serious[0], vars));
  if (tones.includes('jolly') && main !== 'jolly' && lib.jolly) out.push('Hirit: ' + fillVars(lib.jolly[0], vars));
  const g = seg.game && gameById(seg.game);
  if (g) {
    out.push(g.script.intro);
    out.push('Mechanics: ' + g.script.rules);
    out.push('Habang naglalaro: ' + g.script.during);
    out.push('Pagkatapos: ' + g.script.end);
  }
  return out.join('\n\n');
}
function scriptFor(seg, i) { return BIDA.scriptEdits[seg.id] ?? genScript(seg, i); }
function renderScript() {
  const times = segTimes();
  $('#panel-script').innerHTML = `
    <div class="panel-head"><div><span class="kicker">Taglish host script</span><h2>Ano ang vibe?</h2>
      <p>Piliin ang tono — pwede marami. Ang script ay nag-a-adjust agad. Pindutin ang kahit anong linya para i-edit.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn--ghost btn--sm" onclick="copyScript()">${ic('copy')}Copy lahat</button>
        <button class="btn btn--ghost btn--sm" onclick="regenScripts()">I-regenerate</button></div></div>
    <div class="card" style="margin-bottom:18px">
      <span class="field-label" style="display:block;margin-bottom:10px">Tono ng host</span>
      <div class="chips">${BIDA_TONES.map(t => `
        <label class="chip ${BIDA.tones.includes(t.id) ? 'on' : ''}" title="${esc(t.hint)}">
          <input type="checkbox" ${BIDA.tones.includes(t.id) ? 'checked' : ''} onchange="toggleTone('${t.id}',this.checked)">
          <span class="tick"></span>${esc(t.label)}</label>`).join('')}</div>
      <p class="muted" style="margin-top:10px">${toneSummary()}</p>
    </div>
    <div id="script-list">${BIDA.program.map((s, i) => {
      const k = BIDA_KINDS[s.kind] || BIDA_KINDS.opening;
      return `<article class="script-seg ks-${k.color} ${BIDA.scriptEdits[s.id] != null ? 'edited' : ''}" data-id="${s.id}">
        <header><b>${i + 1}. ${esc(s.title)}</b><small>${fmtTime(times[i])}</small></header>
        <div class="script-body" contenteditable="true" spellcheck="false" oninput="editScript(${s.id},this)">${esc(scriptFor(s, i))}</div>
      </article>`;
    }).join('')}</div>`;
}
function toneSummary() {
  const t = TONE_ORDER.filter(x => BIDA.tones.includes(x));
  if (!t.length) return 'Walang napili — Friendly ang gagamitin.';
  const names = t.map(x => BIDA_TONES.find(y => y.id === x).label);
  return `Main voice: <b>${names[0]}</b>${names.length > 1 ? ` · may halong ${names.slice(1).join(', ')}` : ''}.`;
}
function toggleTone(id, on) {
  BIDA.tones = on ? [...new Set([...BIDA.tones, id])] : BIDA.tones.filter(t => t !== id);
  saveState(); renderScript();
}
let editT;
function editScript(id, el) {
  BIDA.scriptEdits[id] = el.innerText;
  el.closest('.script-seg').classList.add('edited');
  clearTimeout(editT); editT = setTimeout(saveState, 400);
}
function regenScripts() {
  if (Object.keys(BIDA.scriptEdits).length && !confirm('Mabubura ang mga in-edit mong linya. Ituloy?')) return;
  BIDA.scriptEdits = {}; saveState(); renderScript(); toast('Bagong script!');
}
function copyScript() {
  const times = segTimes();
  const txt = BIDA.program.map((s, i) => `${fmtTime(times[i])} — ${s.title}\n${scriptFor(s, i)}`).join('\n\n———\n\n');
  navigator.clipboard?.writeText(txt).then(() => toast('Na-copy ang buong script'), () => toast('Hindi ma-copy — i-select na lang'));
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
  }
};
const SCENE_BG = { chairs: '', paper: 'gold', henyo: 'magenta', bringme: 'leaf', freeze: 'gold', relay: 'leaf', whisper: 'magenta', charades: 'gold', hephep: '', line: 'chili', balloon: 'magenta', jakenpoy: 'gold', feud: '', pass: 'chili' };
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
    <div class="panel-head"><div><span class="kicker">Games library</span><h2>Mga Laro</h2>
      <p>Bawat laro ay may animated how-to, kailangang gamit, steps at linya para sa host.</p></div></div>
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
    <div class="sec-title">${ic('mic')}Host script</div>
    <div class="host-lines">
      <div class="host-line"><small>Pagtawag</small>${esc(g.script.intro)}</div>
      <div class="host-line"><small>Mechanics</small>${esc(g.script.rules)}</div>
      <div class="host-line"><small>Habang naglalaro</small>${esc(g.script.during)}</div>
      <div class="host-line"><small>Pagtatapos</small>${esc(g.script.end)}</div>
    </div>
    ${g.tips?.length ? `<div class="sec-title">${ic('star')}Tips</div><ul class="mat-list">${g.tips.map(t => `<li>• ${esc(t)}</li>`).join('')}</ul>` : ''}
    <div class="sheet-actions"><button class="btn btn--magenta" onclick="addGameToProgram('${id}')">${ic('plus')}Idagdag sa program</button></div>`);
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
  saveState(); closeSheet(); toast(`${g.name} — nadagdag sa program!`);
}

/* ============================================================
   SOUND ENGINE (Web Audio — built-in sounds are synthesized,
   so there are no copyrighted clips)
   ============================================================ */
let AC = null, SFX_BUS = null, MUSIC_BUS = null;
function ac() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    SFX_BUS = AC.createGain(); SFX_BUS.gain.value = .9; SFX_BUS.connect(AC.destination);
    MUSIC_BUS = AC.createGain(); MUSIC_BUS.gain.value = BIDA.music.master; MUSIC_BUS.connect(AC.destination);
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function noiseBuf(sec = 1) {
  const a = ac(), b = a.createBuffer(1, a.sampleRate * sec, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
let NOISE;
function noise(t, dur, { type = 'bandpass', f = 1000, q = 1, g = .5, a = .005, out } = {}) {
  const x = ac(); NOISE = NOISE || noiseBuf(2);
  const src = x.createBufferSource(); src.buffer = NOISE; src.loop = true;
  const fl = x.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const gn = x.createGain(); gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + a); gn.gain.exponentialRampToValueAtTime(.0008, t + dur);
  src.connect(fl).connect(gn).connect(out || SFX_BUS); src.start(t, Math.random()); src.stop(t + dur + .05);
  return { src, fl, gn };
}
function tone(t, dur, { type = 'sine', f = 440, f2, g = .4, a = .005, out, curve = 'exp' } = {}) {
  const x = ac(), o = x.createOscillator(), gn = x.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) curve === 'lin' ? o.frequency.linearRampToValueAtTime(f2, t + dur) : o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + a); gn.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(gn).connect(out || SFX_BUS); o.start(t); o.stop(t + dur + .05);
  return { o, gn };
}
function voice(t, dur, { f = 220, f2, formants = [[800, 6], [1150, 8], [2900, 10]], g = .5, vib = 0, breath = .08, env } = {}) {
  const x = ac(), o = x.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  if (vib) { const l = x.createOscillator(), lg = x.createGain(); l.frequency.value = 5.5; lg.gain.value = vib; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + .05); }
  const mix = x.createGain(); mix.gain.value = 1;
  const gn = x.createGain(); gn.gain.setValueAtTime(0, t);
  (env || [[.02, g], [dur * .6, g * .8], [dur, .0008]]).forEach(([tt, v]) => v > .001 ? gn.gain.linearRampToValueAtTime(v, t + tt) : gn.gain.exponentialRampToValueAtTime(v, t + tt));
  formants.forEach(([ff, q], i) => {
    const bp = x.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = q;
    const fg = x.createGain(); fg.gain.value = [1, .6, .25][i] || .2; o.connect(bp).connect(fg).connect(mix);
  });
  mix.connect(gn).connect(SFX_BUS); o.start(t); o.stop(t + dur + .05);
  if (breath) noise(t, dur * .7, { f: 1500, q: .6, g: breath, a: .02 });
}

const SYNTHS = {
  boink(t) {
    const x = ac(), o = x.createOscillator(), g = x.createGain(), l = x.createOscillator(), lg = x.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(520, t + .08); o.frequency.exponentialRampToValueAtTime(220, t + .55);
    l.frequency.setValueAtTime(28, t); l.frequency.linearRampToValueAtTime(10, t + .55); lg.gain.setValueAtTime(70, t); lg.gain.linearRampToValueAtTime(10, t + .55);
    l.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .6);
    o.connect(g).connect(SFX_BUS); o.start(t); l.start(t); o.stop(t + .65); l.stop(t + .65);
  },
  drumroll(t) {
    for (let i = 0; i < 64; i++) { const tt = t + i * .028; noise(tt, .05, { f: 900 + i * 6, q: 1.2, g: .08 + i * .006 }); }
    tone(t + 1.82, .4, { f: 110, f2: 45, g: .8 }); noise(t + 1.82, 1.4, { type: 'highpass', f: 5000, g: .35 });
  },
  badum(t) {
    tone(t, .18, { f: 200, f2: 120, g: .7 }); noise(t, .06, { f: 2000, g: .2 });
    tone(t + .2, .2, { f: 150, f2: 90, g: .7 }); noise(t + .2, .06, { f: 1800, g: .2 });
    noise(t + .48, 1, { type: 'highpass', f: 6000, g: .4 }); tone(t + .48, .12, { f: 60, f2: 40, g: .7 });
  },
  airhorn(t) {
    const x = ac(), lp = x.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(SFX_BUS);
    [[0, .22], [.28, .22], [.56, 1]].forEach(([s, d]) => [466, 470, 233, 699].forEach((f, i) =>
      tone(t + s, d, { type: 'sawtooth', f, f2: f * .97, g: [.16, .16, .12, .05][i], a: .015, out: lp })));
  },
  ding(t) {
    [[0, 1318.5], [.22, 1661.2]].forEach(([s, f]) => { tone(t + s, 1.1, { f, g: .4 }); tone(t + s, .8, { f: f * 2.01, g: .1 }); tone(t + s, .5, { f: f * 3, g: .04 }); });
  },
  buzzer(t) {
    const x = ac(), lp = x.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(SFX_BUS);
    tone(t, .75, { type: 'square', f: 98, g: .28, a: .01, out: lp }); tone(t, .75, { type: 'sawtooth', f: 104, g: .2, a: .01, out: lp });
  },
  tada(t) {
    const x = ac(), lp = x.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1200, t); lp.frequency.linearRampToValueAtTime(4200, t + .3); lp.connect(SFX_BUS);
    [392, 493.9].forEach(f => tone(t, .14, { type: 'sawtooth', f, g: .12, out: lp }));
    [523.3, 659.3, 784, 1046.5].forEach(f => tone(t + .16, 1.3, { type: 'sawtooth', f, g: .1, a: .02, out: lp }));
    noise(t + .16, .9, { type: 'highpass', f: 7000, g: .12 });
  },
  crickets(t) {
    for (let c = 0; c < 4; c++) for (let p = 0; p < 3; p++) tone(t + c * .55 + p * .06, .045, { f: 4400, g: .12, a: .004 });
  },
  slideup(t) { tone(t, .65, { type: 'triangle', f: 380, f2: 1800, g: .35, a: .03 }); },
  slidedown(t) { tone(t, .75, { type: 'triangle', f: 1700, f2: 300, g: .35, a: .03 }); },
  pop(t) { tone(t, .08, { f: 900, f2: 120, g: .6 }); noise(t, .03, { f: 3000, g: .3 }); },
  whoosh(t) {
    const n = noise(t, 1, { f: 300, q: 2.5, g: .5, a: .3 });
    n.fl.frequency.setValueAtTime(300, t); n.fl.frequency.exponentialRampToValueAtTime(3500, t + .45); n.fl.frequency.exponentialRampToValueAtTime(500, t + 1);
  },
  applause(t) {
    for (let i = 0; i < 110; i++) {
      const tt = t + Math.random() * 2.6, sw = Math.min(1, (tt - t) / .5) * (tt - t > 2 ? Math.max(0, 1 - (tt - t - 2) / .6) : 1);
      noise(tt, .035, { f: 1200 + Math.random() * 1800, q: 1.4, g: .25 * sw + .02, a: .001 });
    }
  },
  laugh(t) {
    for (let i = 0; i < 7; i++) voice(t + i * .17, .14, { f: 330 - i * 14, f2: 290 - i * 14, formants: [[750, 5], [1250, 7], [2700, 9]], g: .5 - i * .04, breath: .1, env: [[.012, .5 - i * .04], [.14, .0008]] });
  },
  giggle(t) {
    for (let i = 0; i < 9; i++) voice(t + i * .1, .085, { f: 560 + (i % 2) * 40, f2: 520, formants: [[320, 6], [2300, 10], [3000, 12]], g: .4, breath: .07, env: [[.008, .4], [.085, .0008]] });
  },
  faah(t) {
    noise(t, .2, { type: 'highpass', f: 2800, g: .22, a: .04 });
    voice(t + .14, 1.25, { f: 250, f2: 150, vib: 6, formants: [[820, 6], [1180, 8], [2800, 10]], g: .55, breath: .06, env: [[.08, .55], [.6, .5], [1.25, .0008]] });
  },
  kaching(t) {
    noise(t, .05, { f: 4000, g: .3 }); [2093, 2637, 3136].forEach((f, i) => tone(t + .06 + i * .03, .9, { f, g: .12 }));
    tone(t + .02, .05, { type: 'square', f: 300, g: .1 });
  },
  dundun(t) {
    const x = ac(), lp = x.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(SFX_BUS);
    [[0, .3, 146.8], [.38, .3, 146.8], [.76, 1.6, 138.6]].forEach(([s, d, f]) => [f, f * 2, f * 1.5].forEach((ff, i) =>
      tone(t + s, d, { type: 'sawtooth', f: ff, g: [.28, .1, .08][i], a: .01, out: lp })));
    tone(t + .76, 1.6, { f: 55, g: .4 });
  },
  countdown(t) {
    [0, 1, 2].forEach(i => tone(t + i * .9, .18, { type: 'square', f: 880, g: .14 }));
    tone(t + 2.7, .7, { type: 'square', f: 1760, g: .14 });
  }
};
const BUILTIN_SOUNDS = [
  { id: 'boink', name: 'Boink', tag: 'Boing!', c: 'gold', free: true },
  { id: 'laugh', name: 'Tawa', tag: 'Ha-ha-ha', c: 'magenta' },
  { id: 'giggle', name: 'Giggle', tag: 'Hi-hi-hi', c: 'magenta' },
  { id: 'faah', name: 'Faah', tag: 'Dramatic', c: 'chili' },
  { id: 'drumroll', name: 'Drumroll', tag: 'Raffle!', c: 'turq' },
  { id: 'badum', name: 'Ba-dum-tss', tag: 'Joke', c: 'gold' },
  { id: 'airhorn', name: 'Air horn', tag: 'Hype', c: 'chili' },
  { id: 'ding', name: 'Ding ding', tag: 'Tama!', c: 'leaf', free: true },
  { id: 'buzzer', name: 'Buzzer', tag: 'Mali!', c: 'chili', free: true },
  { id: 'tada', name: 'Ta-da!', tag: 'Winner', c: 'gold' },
  { id: 'crickets', name: 'Kuliglig', tag: 'Awkward…', c: 'leaf' },
  { id: 'applause', name: 'Palakpak', tag: 'Applause', c: 'turq' },
  { id: 'slideup', name: 'Slide up', tag: 'Wheee', c: 'turq' },
  { id: 'slidedown', name: 'Slide down', tag: 'Fail', c: 'magenta' },
  { id: 'pop', name: 'Pop', tag: 'Lobo', c: 'paper' },
  { id: 'whoosh', name: 'Whoosh', tag: 'Transition', c: 'paper' },
  { id: 'kaching', name: 'Ka-ching', tag: 'Premyo', c: 'gold' },
  { id: 'dundun', name: 'Dun dun DUN', tag: 'Suspense', c: 'chili' },
  { id: 'countdown', name: 'Countdown', tag: '3-2-1', c: 'leaf' }
];
const PAD_KEYS = '1234567890qwertyuiopasdfghjkl'.split('');

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
let CUSTOM = [];          // [{id,name,blob,c}]
const BUF_CACHE = {};
async function loadCustom() { try { CUSTOM = await dbAll(); } catch (e) { CUSTOM = []; } }
async function playCustom(s) {
  const x = ac();
  if (!BUF_CACHE[s.id]) BUF_CACHE[s.id] = await x.decodeAudioData(await s.blob.arrayBuffer());
  const src = x.createBufferSource(); src.buffer = BUF_CACHE[s.id]; src.connect(SFX_BUS); src.start();
}
function canPlaySound(id) {
  if (BIDA.premium) return true;
  const b = BUILTIN_SOUNDS.find(s => s.id === id); return !!(b && b.free);
}
function playSound(id, padEl) {
  if (!canPlaySound(id)) { openPremium('Sound Lab'); return; }
  const x = ac();
  if (SYNTHS[id]) SYNTHS[id](x.currentTime + .01);
  else { const c = CUSTOM.find(s => s.id === id); if (c) playCustom(c).catch(() => toast('Hindi ma-play ang file')); }
  if (padEl) { padEl.classList.add('hit'); setTimeout(() => padEl.classList.remove('hit'), 120); }
}
function padsHTML(limit) {
  const all = [...BUILTIN_SOUNDS.map(s => ({ ...s, builtin: true })), ...CUSTOM.map(s => ({ id: s.id, name: s.name, tag: 'Sarili mo', c: s.c || 'paper' }))];
  const list = limit ? all.slice(0, limit) : all;
  return list.map((s, i) => `<button class="pad pc-${s.c} ${canPlaySound(s.id) ? '' : 'disabled'}" data-sid="${s.id}" onpointerdown="event.preventDefault();playSound('${s.id}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();playSound('${s.id}',this)}">
      ${PAD_KEYS[i] ? `<span class="pad-key">${PAD_KEYS[i].toUpperCase()}</span>` : ''}
      ${!canPlaySound(s.id) ? `<svg class="ic" style="width:16px;height:16px;position:absolute;top:6px;right:8px"><use href="#i-lock"/></svg>` : ''}
      ${s.builtin ? '' : `<span class="pad-del" role="button" aria-label="Delete ${esc(s.name)}" onpointerdown="event.stopPropagation();event.preventDefault();delSound('${s.id}')">${ic('trash')}</span>`}
      ${esc(s.name)}<small>${esc(s.tag)}</small></button>`).join('');
}
function renderSounds() {
  $('#panel-sounds').innerHTML = `
    <div class="panel-head"><div><span class="kicker">Sound Lab <span class="badge-pro">${ic('star')}Premium</span></span><h2>Sound effects</h2>
      <p>Pindutin para tumunog — o gamitin ang keyboard (1–0, Q–P). Ang mga built-in ay ginawa ng app mismo, kaya walang copyright issue.</p></div></div>
    ${BIDA.premium ? '' : lockBanner('Sound Lab', 'Libre ang Boink, Ding at Buzzer. I-unlock ang lahat + sariling sounds.')}
    <div class="pads" id="pads">${padsHTML()}
      <button class="pad pad--add" onclick="${BIDA.premium ? `$('#snd-file').click()` : `openPremium('Sound Lab')`}">${ic('upload')}Upload<small>mp3 · wav · m4a</small></button></div>
    <input type="file" id="snd-file" accept="audio/*" multiple hidden onchange="uploadSounds(this.files);this.value=''">
    <div class="card" style="margin-top:20px">
      <h3>Mag-record ng sariling sound</h3>
      <p class="muted" style="margin-bottom:12px">Gayahin ang paborito mong TikTok sound gamit ang sarili mong boses — o i-record si Lolo na nagsasabing “Ay, susmaryosep!”</p>
      <div class="rec-row">
        <input class="input" id="rec-name" placeholder="Pangalan ng sound" style="max-width:260px">
        <button class="btn btn--chili" id="rec-btn" onclick="${BIDA.premium ? 'toggleRecord()' : `openPremium('Sound Lab')`}">${ic('rec')}<span>Record</span></button>
      </div>
      <p class="note" style="margin-top:14px">Tip: ang mga TikTok sounds (tulad ng orihinal na “Fahh” o mga sikat na tawa) ay may sariling may-ari. Ang built-in na Tawa, Giggle at Faah dito ay synthesized na bersyon. Para sa eksaktong sound, i-upload ang file na may karapatan kang gamitin.</p>
    </div>`;
}
async function uploadSounds(files) {
  for (const f of files) {
    if (f.size > 8 * 1024 * 1024) { toast(`${f.name}: masyadong malaki (max 8MB)`); continue; }
    const s = { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: f.name.replace(/\.[^.]+$/, '').slice(0, 22), blob: f, c: ['magenta', 'turq', 'gold', 'leaf', 'chili'][CUSTOM.length % 5] };
    await dbPut(s); CUSTOM.push(s);
  }
  renderSounds(); toast('Na-upload!');
}
async function delSound(id) {
  if (!confirm('Tanggalin ang sound na ito?')) return;
  await dbDel(id); CUSTOM = CUSTOM.filter(s => s.id !== id); delete BUF_CACHE[id]; renderSounds();
}
let recorder, recChunks = [];
async function toggleRecord() {
  const btn = $('#rec-btn');
  if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recChunks = []; recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => e.data.size && recChunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' });
      const name = ($('#rec-name')?.value || 'Recording ' + (CUSTOM.length + 1)).slice(0, 22);
      const s = { id: 'r' + Date.now().toString(36), name, blob, c: 'magenta' };
      await dbPut(s); CUSTOM.push(s); renderSounds(); toast('Na-save ang recording!');
    };
    recorder.start(); btn.classList.add('rec-on'); btn.querySelector('span').textContent = 'Stop';
    setTimeout(() => recorder?.state === 'recording' && recorder.stop(), 10000);
  } catch (e) { toast('Kailangan ng mic permission'); }
}

/* ============================================================
   MUSIC — sources + fade/duck controller
   ============================================================ */
const M = { kind: null, playing: false, title: '', current: BIDA?.music?.master ?? .8, ducked: false, raf: 0, yt: null, ytReady: false, sp: null, spDevice: null, spMode: null, audio: null, mediaSrc: null, queue: [], qi: 0, lastSpSet: 0 };

function applyVolume(v) {
  M.current = v;
  if (M.kind === 'youtube' && M.yt && M.ytReady) { try { M.yt.setVolume(Math.round(v * 100)); } catch (e) { } }
  else if (M.kind === 'local' && MUSIC_BUS) MUSIC_BUS.gain.value = v;
  else if (M.kind === 'spotify') spotifySetVolume(v);
  const bars = $$('.vol-now'); bars.forEach(b => b.style.width = Math.round(v * 100) + '%');
  const outs = $$('.vol-pct'); outs.forEach(o => o.textContent = Math.round(v * 100) + '%');
}
// Timer-based (not rAF) so fades still finish if the page is in the background,
// e.g. when the host switches to the Spotify app on their phone.
function fadeTo(target, ms) {
  clearInterval(M.raf);
  const from = M.current, t0 = performance.now();
  if (ms <= 0 || Math.abs(from - target) < .005) { applyVolume(target); return; }
  M.raf = setInterval(() => {
    const k = clamp((performance.now() - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3);
    applyVolume(from + (target - from) * e);
    if (k >= 1) clearInterval(M.raf);
  }, 30);
}
function duckDown() {
  if (!BIDA.premium) { openPremium('Music fades'); return; }
  M.ducked = true; fadeTo(BIDA.music.master * BIDA.music.duck, BIDA.music.fade);
  $$('.talk-btn').forEach(b => b.classList.add('on'));
  $$('.talk-label').forEach(l => l.textContent = 'Nagsasalita…');
}
function duckUp() {
  if (!M.ducked) return;
  M.ducked = false; fadeTo(BIDA.music.master, Math.round(BIDA.music.fade * 1.6));
  $$('.talk-btn').forEach(b => b.classList.remove('on'));
  $$('.talk-label').forEach(l => l.textContent = 'Magsasalita ako');
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
function setMaster(v) {
  BIDA.music.master = v; saveState();
  if (!M.ducked) { clearInterval(M.raf); applyVolume(v); } else applyVolume(v * BIDA.music.duck);
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
async function loadYouTube() {
  if (!BIDA.premium) { openPremium('Music player'); return; }
  const url = $('#yt-url').value; const p = parseYouTube(url);
  if (!p) { toast('Hindi valid ang YouTube link'); return; }
  BIDA.music.ytUrl = url; saveState();
  stopOtherSources('youtube');
  await ytApi();
  $('#yt-host').innerHTML = '<div id="yt-player"></div>';
  M.ytReady = false; M.kind = 'youtube';
  const vars = { playsinline: 1, rel: 0, modestbranding: 1 };
  if (p.list) { vars.listType = 'playlist'; vars.list = p.list; }
  M.yt = new YT.Player('yt-player', {
    videoId: p.id || undefined, playerVars: vars,
    events: {
      onReady: e => { M.ytReady = true; applyVolume(M.ducked ? BIDA.music.master * BIDA.music.duck : BIDA.music.master); e.target.playVideo(); },
      onStateChange: e => {
        M.playing = e.data === YT.PlayerState.PLAYING;
        try { M.title = M.yt.getVideoData().title || 'YouTube'; } catch (x) { M.title = 'YouTube'; }
        updateMini();
      }
    }
  });
  showMini('YouTube');
}

/* ---- Local files (Web Audio gain) ---- */
function loadLocal(files) {
  if (!BIDA.premium) { openPremium('Music player'); return; }
  const arr = Array.from(files).filter(f => /^audio\//.test(f.type) || /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f.name));
  if (!arr.length) return;
  stopOtherSources('local');
  M.queue.forEach(q => URL.revokeObjectURL(q.url));
  M.queue = arr.map(f => ({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f) }));
  M.kind = 'local'; playLocal(0); renderQueue();
}
function ensureAudio() {
  if (M.audio) return M.audio;
  const a = new Audio(); a.preload = 'auto'; a.crossOrigin = 'anonymous';
  a.addEventListener('ended', () => playLocal(M.qi + 1));
  a.addEventListener('play', () => { M.playing = true; updateMini(); });
  a.addEventListener('pause', () => { M.playing = false; updateMini(); });
  M.audio = a; ac();
  M.mediaSrc = AC.createMediaElementSource(a); M.mediaSrc.connect(MUSIC_BUS);
  return a;
}
function playLocal(i) {
  if (!M.queue.length) return;
  M.qi = (i + M.queue.length) % M.queue.length;
  const a = ensureAudio(); a.src = M.queue[M.qi].url; M.title = M.queue[M.qi].name;
  applyVolume(M.ducked ? BIDA.music.master * BIDA.music.duck : BIDA.music.master);
  a.play().catch(() => { }); showMini('Local files'); renderQueue();
}
function renderQueue() {
  const q = $('#local-queue'); if (!q) return;
  q.innerHTML = M.queue.map((t, i) => `<li class="${i === M.qi && M.kind === 'local' ? 'now' : ''}" onclick="playLocal(${i})">${ic(i === M.qi && M.playing ? 'pause' : 'play')}<span>${esc(t.name)}</span></li>`).join('');
}

/* ---- Spotify (Web Playback SDK on desktop · Connect control on mobile) ---- */
const SP_SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state';
function spRedirect() { return location.origin + location.pathname; }
function spToken() {
  try { const t = JSON.parse(localStorage.getItem('bidavibe_sp') || 'null'); return t && t.exp > Date.now() + 30000 ? t : null; } catch (e) { return null; }
}
async function spLogin() {
  if (!BIDA.premium) { openPremium('Spotify'); return; }
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
  if (!BIDA.premium) { openPremium('Spotify'); return; }
  const p = parseSpotify($('#sp-url').value);
  if (!p) { toast('I-paste ang Spotify playlist link'); return; }
  BIDA.music.spUrl = $('#sp-url').value; saveState();
  if (!spToken()) { spLogin(); return; }
  stopOtherSources('spotify'); M.kind = 'spotify';
  const body = p.type === 'track' ? { uris: [p.uri] } : { context_uri: p.uri };
  try {
    if (!isMobileUA) {
      await spInitSDK();
      if (!M.sp) {
        M.sp = new Spotify.Player({ name: 'Bida-Vibe', getOAuthToken: cb => cb(spToken()?.at), volume: BIDA.music.master });
        M.sp.addListener('ready', ({ device_id }) => { M.spDevice = device_id; });
        M.sp.addListener('player_state_changed', s => { if (!s) return; M.playing = !s.paused; M.title = s.track_window?.current_track?.name || 'Spotify'; updateMini(); });
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
      M.playing = true; M.title = 'Spotify'; updateMini();
    }
    showMini('Spotify');
  } catch (e) { toast('May problema sa Spotify — i-connect ulit'); }
}
let spVolT;
function spotifySetVolume(v) {
  if (M.spMode === 'sdk' && M.sp) { M.sp.setVolume(v).catch(() => { }); return; }
  // Connect API: throttle to avoid rate limits
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
function musicToggle() {
  if (M.kind === 'youtube' && M.yt) { M.playing ? M.yt.pauseVideo() : M.yt.playVideo(); }
  else if (M.kind === 'local' && M.audio) { M.audio.paused ? M.audio.play() : M.audio.pause(); }
  else if (M.kind === 'spotify') {
    if (M.spMode === 'sdk' && M.sp) M.sp.togglePlay();
    else { spApi('/me/player/' + (M.playing ? 'pause' : 'play'), { method: 'PUT' }).catch(() => { }); M.playing = !M.playing; updateMini(); }
  }
}
function musicSkip(d) {
  if (M.kind === 'youtube' && M.yt) { try { d > 0 ? M.yt.nextVideo() : M.yt.previousVideo(); } catch (e) { } }
  else if (M.kind === 'local') playLocal(M.qi + d);
  else if (M.kind === 'spotify') {
    if (M.spMode === 'sdk' && M.sp) d > 0 ? M.sp.nextTrack() : M.sp.previousTrack();
    else spApi('/me/player/' + (d > 0 ? 'next' : 'previous'), { method: 'POST' }).catch(() => { });
  }
}
function showMini(src) { $('#minibar').hidden = false; $('#app').classList.add('has-mini'); $('#mb-src').textContent = src; bindTalk($('#talk-mini')); updateMini(); }
function updateMini() {
  $('#mb-title').textContent = M.title || '—';
  $('#mb-play-ic')?.setAttribute('href', M.playing ? '#i-pause' : '#i-play');
  $$('.np-title').forEach(e => e.textContent = M.title || 'Walang tumutugtog');
  $$('.np-play use').forEach(u => u.setAttribute('href', M.playing ? '#i-pause' : '#i-play'));
  renderQueue();
}

/* ---- Auto-duck via microphone ---- */
const MIC = { stream: null, an: null, raf: 0, above: 0, below: 0 };
async function setAutoDuck(on) {
  if (on && !BIDA.premium) { openPremium('Auto-fade'); renderMusic(); return; }
  BIDA.music.autoDuck = on; saveState();
  if (!on) { cancelAnimationFrame(MIC.raf); MIC.stream?.getTracks().forEach(t => t.stop()); MIC.stream = null; return; }
  try {
    MIC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
    const x = ac(), src = x.createMediaStreamSource(MIC.stream); MIC.an = x.createAnalyser(); MIC.an.fftSize = 1024; src.connect(MIC.an);
    const buf = new Float32Array(MIC.an.fftSize); let last = performance.now();
    const loop = now => {
      MIC.an.getFloatTimeDomainData(buf);
      let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const rms = Math.sqrt(s / buf.length), lvl = clamp(rms * 8, 0, 1);
      const thr = .9 - BIDA.music.sens * .8, dt = now - last; last = now;
      $$('.vu i').forEach(v => v.style.width = Math.round(lvl * 100) + '%');
      if (lvl > thr) { MIC.above += dt; MIC.below = 0; if (MIC.above > 120 && !M.ducked) { duckDown(); MIC.auto = true; } }
      else { MIC.below += dt; MIC.above = 0; if (MIC.below > 1200 && M.ducked && MIC.auto) { duckUp(); MIC.auto = false; } }
      MIC.raf = requestAnimationFrame(loop);
    };
    MIC.raf = requestAnimationFrame(loop);
    toast('Auto-fade ON — hihina ang music pag nagsalita ka');
  } catch (e) { BIDA.music.autoDuck = false; saveState(); toast('Kailangan ng mic permission'); renderMusic(); }
}

function consoleHTML(compact) {
  const m = BIDA.music;
  return `<div class="card console">
    ${compact ? '' : `<h3>Talk fader</h3><p class="muted">Pindutin para humina ang music habang nagsasalita ka — babalik ito pag binitawan mo.</p>`}
    <div class="transport" style="margin:${compact ? '0 0 12px' : '14px 0'}">
      <button class="icon-btn" onclick="musicSkip(-1)" aria-label="Previous">${ic('prev')}</button>
      <button class="icon-btn np-play" onclick="musicToggle()" aria-label="Play or pause" style="background:var(--gold)">${ic(M.playing ? 'pause' : 'play')}</button>
      <button class="icon-btn" onclick="musicSkip(1)" aria-label="Next">${ic('next')}</button>
      <b class="np-title" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px">${esc(M.title || 'Walang tumutugtog')}</b>
    </div>
    <button class="talk-btn" id="talk-${compact ? 'live' : 'main'}">${ic('mic')}<span><span class="talk-label">${M.ducked ? 'Nagsasalita…' : 'Magsasalita ako'}</span><small>${m.mode === 'hold' ? 'Pindutin nang matagal' : 'Tap para on/off'} · Space</small></span></button>
    <div class="vol-meter"><span>Vol</span><span class="bar"><i class="vol-now" style="width:${Math.round(M.current * 100)}%"></i></span><span class="vol-pct">${Math.round(M.current * 100)}%</span></div>
    <div class="slider-row"><label for="sl-master">Music volume</label><output id="o-master">${Math.round(m.master * 100)}%</output>
      <input type="range" id="sl-master" min="0" max="1" step="0.01" value="${m.master}" oninput="setMaster(+this.value);$('#o-master').textContent=Math.round(this.value*100)+'%'"></div>
    ${compact ? '' : `
    <div class="slider-row"><label for="sl-duck">Hihina hanggang</label><output id="o-duck">${Math.round(m.duck * 100)}%</output>
      <input type="range" id="sl-duck" min="0" max="0.6" step="0.01" value="${m.duck}" oninput="BIDA.music.duck=+this.value;saveState();$('#o-duck').textContent=Math.round(this.value*100)+'%';if(M.ducked)fadeTo(BIDA.music.master*BIDA.music.duck,120)"></div>
    <div class="slider-row"><label for="sl-fade">Bilis ng fade</label><output id="o-fade">${(m.fade / 1000).toFixed(1)}s</output>
      <input type="range" id="sl-fade" min="100" max="2500" step="50" value="${m.fade}" oninput="BIDA.music.fade=+this.value;saveState();$('#o-fade').textContent=(this.value/1000).toFixed(1)+'s'"></div>
    <div class="seg-ctrl" role="group" aria-label="Talk button mode">
      <button class="${m.mode === 'hold' ? 'on' : ''}" onclick="setTalkMode('hold')">Hold to talk</button>
      <button class="${m.mode === 'toggle' ? 'on' : ''}" onclick="setTalkMode('toggle')">Tap on / off</button></div>
    <label class="toggle"><input type="checkbox" ${m.autoDuck ? 'checked' : ''} onchange="setAutoDuck(this.checked)">Auto-fade gamit ang mic (beta)</label>
    <div class="vu" ${m.autoDuck ? '' : 'hidden'}><i></i></div>
    <div class="slider-row" ${m.autoDuck ? '' : 'hidden'}><label for="sl-sens">Mic sensitivity</label><output id="o-sens">${Math.round(m.sens * 100)}%</output>
      <input type="range" id="sl-sens" min="0.05" max="1" step="0.05" value="${m.sens}" oninput="BIDA.music.sens=+this.value;saveState();$('#o-sens').textContent=Math.round(this.value*100)+'%'"></div>`}
  </div>`;
}
function setTalkMode(mode) { BIDA.music.mode = mode; saveState(); renderMusic(); }

let musicBuilt = false;
function renderMusic() {
  const m = BIDA.music, panel = $('#panel-music');
  // Keep the YouTube iframe alive across re-renders
  const ytNode = $('#yt-host')?.firstElementChild;
  panel.innerHTML = `
    <div class="panel-head"><div><span class="kicker">Music <span class="badge-pro">${ic('star')}Premium</span></span><h2>Patugtugin</h2>
      <p>Ikonekta ang playlist mo. Pag magsasalita ka, pindutin ang Talk — hihina ang music, hindi titigil.</p></div></div>
    ${BIDA.premium ? '' : lockBanner('Music + Talk fader', 'Ikonekta ang YouTube, Spotify o sariling files, may quick fade pag nagsasalita.')}
    <div class="src-tabs" role="tablist">
      ${[['youtube', 'YouTube', 'May fade'], ['spotify', 'Spotify', 'Premium acct'], ['local', 'Sariling files', 'May fade'], ['link', 'Iba pa', 'Link lang']].map(([id, l, s]) =>
        `<button class="src-tab ${m.src === id ? 'on' : ''}" role="tab" aria-selected="${m.src === id}" onclick="setMusicSrc('${id}')">${l}<small>${s}</small></button>`).join('')}
    </div>
    <div class="grid-2" style="align-items:start">
      <div class="card stack" id="src-card">
        <div ${m.src === 'youtube' ? '' : 'hidden'}>
          <div class="field"><label for="yt-url">YouTube video o playlist link</label>
            <input class="input" id="yt-url" placeholder="https://www.youtube.com/playlist?list=…" value="${esc(m.ytUrl)}"></div>
          <button class="btn btn--chili btn--block" style="margin-top:12px" onclick="loadYouTube()">${ic('play')}I-load at patugtugin</button>
          <div class="yt-host" id="yt-host" style="margin-top:14px"></div>
          <p class="muted" style="margin-top:8px">Gumagana rin sa YouTube Music links (music.youtube.com).</p>
        </div>
        <div ${m.src === 'spotify' ? '' : 'hidden'}>
          ${BIDA_CONFIG.spotifyClientId ? `
          <div class="field"><label for="sp-url">Spotify playlist / album link</label>
            <input class="input" id="sp-url" placeholder="https://open.spotify.com/playlist/…" value="${esc(m.spUrl)}"></div>
          <button class="btn btn--leaf btn--block" style="margin-top:12px" onclick="spPlay()">${ic('play')}${spToken() ? 'Patugtugin' : 'Connect at patugtugin'}</button>
          <p class="note" style="margin-top:12px">Kailangan ng <b>Spotify Premium</b>. ${isMobileUA ? 'Sa phone: buksan muna ang Spotify app — ito ang kokontrolin namin, kasama ang volume fade.' : 'Sa computer: tutugtog dito mismo sa browser.'}</p>` : `
          <p class="note">Hindi pa naka-setup ang Spotify. Developer: maglagay ng <code>spotifyClientId</code> sa <code>BIDA_CONFIG</code> (bida-app.js) — gumawa ng app sa developer.spotify.com at idagdag ang URL ng page na ito bilang Redirect URI.</p>`}
        </div>
        <div ${m.src === 'local' ? '' : 'hidden'}>
          <button class="btn btn--turq btn--block" onclick="${BIDA.premium ? `$('#local-files').click()` : `openPremium('Music player')`}">${ic('upload')}Pumili ng music files</button>
          <input type="file" id="local-files" accept="audio/*" multiple hidden onchange="loadLocal(this.files);this.value=''">
          <ul class="queue" id="local-queue"></ul>
          <p class="muted" style="margin-top:8px">Mp3 o m4a na nasa phone/computer mo. Hindi ito ina-upload kahit saan.</p>
        </div>
        <div ${m.src === 'link' ? '' : 'hidden'}>
          <div class="field"><label for="ext-url">Apple Music, Deezer, SoundCloud o iba pa</label>
            <input class="input" id="ext-url" placeholder="I-paste ang link" value="${esc(m.link)}" onchange="BIDA.music.link=this.value;saveState()"></div>
          <button class="btn btn--ink btn--block" style="margin-top:12px" onclick="openExt()">Buksan sa app ${ic('arrow')}</button>
          <p class="note" style="margin-top:12px">Ang mga app na ito ay hindi nagbibigay ng volume control sa ibang website, kaya walang auto-fade dito — gamitin ang volume ng phone o speaker.</p>
        </div>
      </div>
      <div>${consoleHTML(false)}</div>
    </div>`;
  if (ytNode && M.kind === 'youtube') $('#yt-host').appendChild(ytNode);
  bindTalk($('#talk-main'));
  renderQueue();
  musicBuilt = true;
}
function setMusicSrc(id) { BIDA.music.src = id; saveState(); renderMusic(); }
function openExt() {
  const u = ($('#ext-url').value || '').trim(); if (!/^https?:\/\//.test(u)) { toast('I-paste muna ang link'); return; }
  BIDA.music.link = u; saveState(); window.open(u, '_blank', 'noopener');
}

/* ============================================================
   PREMIUM
   ============================================================ */
function lockBanner(feature, text) {
  return `<div class="lock-banner">${ic('lock')}<div><b>${esc(feature)} ay Premium</b><span>${esc(text)}</span></div>
    <button class="btn btn--gold btn--sm" onclick="openPremium('${esc(feature)}')">I-unlock</button></div>`;
}
function openPremium(feature) {
  openSheet(`
    <div class="sheet-head"><h3>Bida-Vibe Premium</h3><button class="icon-btn" onclick="closeSheet()" aria-label="Close">${ic('x')}</button></div>
    <div class="pro-hero">
      <span class="kicker" style="color:var(--ink)">${esc(feature || 'Premium')}</span>
      <h4>Gawing mas buhay ang party.</h4>
      <ul class="pro-list">
        <li>${ic('star')}Buong Sound Lab — 19 built-in sounds + upload at record ng sarili mo</li>
        <li>${ic('star')}YouTube, Spotify at sariling music files</li>
        <li>${ic('star')}Talk fader: quick fade pag nagsasalita, fade-in pagkatapos</li>
        <li>${ic('star')}Auto-fade gamit ang mic</li>
      </ul>
      ${BIDA_CONFIG.priceLabel ? `<p style="margin-top:14px;font:800 22px/1 var(--f2)">${esc(BIDA_CONFIG.priceLabel)}</p>` : ''}
    </div>
    <div class="sheet-actions">
      <button class="btn btn--magenta btn--lg" onclick="goPay()">${BIDA_CONFIG.paymentUrl ? 'Mag-upgrade' : 'Malapit nang mabili'}</button>
    </div>
    <div class="field" style="margin-top:20px"><label for="pro-code">May unlock code?</label>
      <div style="display:flex;gap:8px"><input class="input" id="pro-code" placeholder="CODE" autocapitalize="characters">
      <button class="btn btn--ink" onclick="redeem()">Gamitin</button></div></div>
    <p class="muted" style="margin-top:12px">Libre pa rin ang event setup, program, host scripts at lahat ng laro.</p>`);
}
function goPay() {
  if (BIDA_CONFIG.paymentUrl) window.open(BIDA_CONFIG.paymentUrl, '_blank', 'noopener');
  else toast('Hindi pa bukas ang payments — salamat sa pasensya!');
}
function redeem() {
  const c = ($('#pro-code').value || '').trim().toUpperCase();
  if (BIDA_CONFIG.unlockCodes.includes(c)) {
    BIDA.premium = true; saveState(); closeSheet(); toast('Premium unlocked! Party na!');
    if (RENDER[BIDA.tab]) RENDER[BIDA.tab]();
  } else toast('Hindi tama ang code');
}

/* ============================================================
   LIVE HOST MODE
   ============================================================ */
const LIVE = { timerStart: 0, running: false, elapsed: 0, iv: 0 };
function openLive() {
  if (!BIDA.program.length) { toast('Wala pang program'); return; }
  BIDA.liveIdx = clamp(BIDA.liveIdx || 0, 0, BIDA.program.length - 1);
  $('#live').hidden = false; document.body.style.overflow = 'hidden';
  bindTalk($('#talk-fab'));
  requestAnimationFrame(renderAllBunting);
  renderLive(); clearInterval(LIVE.iv); LIVE.iv = setInterval(tickLive, 500); tickLive();
  try { navigator.wakeLock?.request('screen').then(l => LIVE.lock = l).catch(() => { }); } catch (e) { }
}
function closeLive() {
  $('#live').hidden = true; document.body.style.overflow = ''; clearInterval(LIVE.iv);
  LIVE.lock?.release?.(); LIVE.lock = null;
}
function renderLive() {
  const i = BIDA.liveIdx, s = BIDA.program[i], k = BIDA_KINDS[s.kind] || BIDA_KINDS.opening, times = segTimes();
  const next = BIDA.program[i + 1], g = s.game && gameById(s.game);
  $('#live-count').textContent = `${i + 1} / ${BIDA.program.length}`;
  $('#live-now').className = 'live-now ks-' + k.color;
  $('#live-now').innerHTML = `<div class="ln-kind">${esc(k.label)} · ${fmtTime(times[i])}</div><h2>${esc(s.title)}</h2>
    <div class="ln-meta"><span class="ln-timer" id="ln-timer">${s.min}:00</span><span class="pill">${s.min} min</span>
      ${g ? `<button class="pill" onclick="openGame('${g.id}')">${ic('games')}How to play</button>` : ''}</div>
    ${next ? `<div class="ln-next">Susunod: ${esc(next.title)} · ${fmtTime(times[i + 1])}</div>` : '<div class="ln-next">Huling segment na!</div>'}`;
  const txt = scriptFor(s, i);
  $('#live-script').innerHTML = esc(txt) + (g ? `<div class="ls-game"><b>Kailangan:</b> ${esc(g.materials.join(' · '))}</div>` : '');
  $('#live-music').innerHTML = consoleHTML(true);
  bindTalk($('#talk-live'));
  $('#live-pads').innerHTML = `<div class="sec-title" style="margin-top:0">${ic('sound')}Sound pads</div><div class="pads">${padsHTML(BIDA.premium ? 12 : 9)}</div>`;
  LIVE.running = false; LIVE.elapsed = 0; updateTimerBtn();
}
function liveStep(d) {
  const n = clamp(BIDA.liveIdx + d, 0, BIDA.program.length - 1);
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
  const now = new Date();
  $('#live-clock').textContent = now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
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
   KEYBOARD
   ============================================================ */
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (e.key === 'Escape') { if (!$('#sheet-wrap').hidden) closeSheet(); else if (!$('#live').hidden) closeLive(); return; }
  const live = !$('#live').hidden, sheetOpen = !$('#sheet-wrap').hidden;
  if (sheetOpen) return;
  if (e.code === 'Space' && (live || BIDA.tab === 'music') && !e.repeat && !e.target.closest('button')) {
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
  M.current = BIDA.music.master;
  await spHandleRedirect();
  await loadCustom();
  const startTab = new URLSearchParams(location.search).get('tab');
  if (BIDA.seenLanding || startTab) enterApp(startTab || BIDA.tab);
  else { $('#landing').hidden = false; requestAnimationFrame(renderAllBunting); }
  if (BIDA.music.autoDuck) { BIDA.music.autoDuck = false; saveState(); } // mic needs a fresh user gesture
});

/* ---------- exports for inline handlers ---------- */
Object.assign(window, {
  BIDA_CONFIG, $, enterApp, showLanding, goTab, setEv, pickEventType,
  moveSeg, resetProgram, editSeg, saveSeg, deleteSeg,
  toggleTone, editScript, regenScripts, copyScript,
  setGameFilter, openGame, playSteps, checkMat, addGameToProgram,
  playSound, uploadSounds, delSound, toggleRecord,
  loadYouTube, loadLocal, playLocal, spPlay, spLogin, musicToggle, musicSkip, setMaster, fadeTo, duckDown, duckUp,
  setAutoDuck, setTalkMode, setMusicSrc, openExt,
  openPremium, goPay, redeem, openLive, closeLive, liveStep, liveTimerToggle,
  openSheet, closeSheet, saveState
});
Object.defineProperty(window, 'BIDA', { get: () => BIDA });
Object.defineProperty(window, 'M', { get: () => M });
})();
