/* Bida-Vibe — videoke avatars (shared by the app and the guest page sing.html).
   Each avatar is a small flat SVG face. VK_AVATARS[i].svg(size) returns markup. */
(function () {
  const INK = '#1E1A16';
  const SK = ['#F0C49C', '#E8B48A', '#C98B5F', '#A86F48'];
  const list = [
    { id: 'lola',    name: 'Lola',    skin: 0, hair: '#E8E4DC', style: 'bun',   acc: 'glasses', bg: '#FDE7AE' },
    { id: 'lolo',    name: 'Lolo',    skin: 2, hair: '#D9D4CC', style: 'bald',  acc: 'mustache', bg: '#C9EEEC' },
    { id: 'tita',    name: 'Tita',    skin: 1, hair: '#3B2416', style: 'curly', acc: 'earrings', bg: '#FBD3E2' },
    { id: 'tito',    name: 'Tito',    skin: 2, hair: '#1E1A16', style: 'short', acc: 'mustache', bg: '#D3EDD5' },
    { id: 'ate',     name: 'Ate',     skin: 1, hair: '#1E1A16', style: 'long',  acc: 'bow',      bg: '#F9D0C7' },
    { id: 'kuya',    name: 'Kuya',    skin: 3, hair: '#1E1A16', style: 'cap',   acc: '',         bg: '#FDE7AE' },
    { id: 'bunso',   name: 'Bunso',   skin: 0, hair: '#5A3A22', style: 'pigtails', acc: '',      bg: '#C9EEEC' },
    { id: 'baby',    name: 'Baby',    skin: 1, hair: '#5A3A22', style: 'tuft',  acc: 'blush',    bg: '#FBD3E2' },
    { id: 'rakista', name: 'Rakista', skin: 2, hair: '#E2367A', style: 'spiky', acc: 'shades',   bg: '#1E1A16' },
    { id: 'diva',    name: 'Diva',    skin: 0, hair: '#F6B21B', style: 'long',  acc: 'crown',    bg: '#E2367A' },
    { id: 'dj',      name: 'DJ',      skin: 3, hair: '#1E1A16', style: 'short', acc: 'headphones', bg: '#0FA3A3' },
    { id: 'boss',    name: 'Boss',    skin: 1, hair: '#2A2A2A', style: 'short', acc: 'glasses', bg: '#E4452B' }
  ];
  function hair(a) {
    const h = a.hair;
    switch (a.style) {
      case 'bun': return `<circle cx="50" cy="18" r="11" fill="${h}" stroke="${INK}" stroke-width="3"/><path d="M24 44q2-24 26-24t26 24q-10-12-26-12t-26 12z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case 'bald': return `<path d="M26 46q-4-8 2-12M74 46q4-8-2-12" fill="none" stroke="${h}" stroke-width="6" stroke-linecap="round"/>`;
      case 'curly': return [18, 30, 44, 58, 72, 82].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 26 : 32}" r="11" fill="${h}" stroke="${INK}" stroke-width="3"/>`).join('') + `<circle cx="20" cy="50" r="9" fill="${h}" stroke="${INK}" stroke-width="3"/><circle cx="80" cy="50" r="9" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case 'short': return `<path d="M23 46q0-26 27-26t27 26q-6-14-27-14t-27 14z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case 'long': return `<path d="M20 78q-6-56 30-58t30 58q-6-6-8-30q-8-12-22-12t-22 12q-2 24-8 30z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case 'cap': return `<path d="M22 42q2-22 28-22t28 22z" fill="#E4452B" stroke="${INK}" stroke-width="3"/><path d="M50 40h34q4 0 2 4h-36z" fill="#E4452B" stroke="${INK}" stroke-width="3"/>`;
      case 'pigtails': return `<circle cx="16" cy="40" r="10" fill="${h}" stroke="${INK}" stroke-width="3"/><circle cx="84" cy="40" r="10" fill="${h}" stroke="${INK}" stroke-width="3"/><path d="M24 44q2-24 26-24t26 24q-10-10-26-10t-26 10z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case 'tuft': return `<path d="M46 22q4-10 10-4q-6 0-4 8" fill="${h}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
      case 'spiky': return `<path d="M22 46l4-18 8 8 6-16 8 12 6-14 6 14 8-10 4 16 6 8q-14-10-28-10t-28 10z" fill="${h}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
      default: return '';
    }
  }
  function acc(a) {
    switch (a.acc) {
      case 'glasses': return `<circle cx="38" cy="54" r="8" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="62" cy="54" r="8" fill="none" stroke="${INK}" stroke-width="3"/><path d="M46 54h8" stroke="${INK}" stroke-width="3"/>`;
      case 'shades': return `<rect x="28" y="48" width="18" height="11" rx="4" fill="${INK}"/><rect x="54" y="48" width="18" height="11" rx="4" fill="${INK}"/><path d="M46 52h8" stroke="${INK}" stroke-width="3"/>`;
      case 'mustache': return `<path d="M38 70q6-6 12 0q6-6 12 0q-6 4-12 0q-6 4-12 0z" fill="${a.hair === '#1E1A16' ? INK : '#8a8479'}" stroke="${INK}" stroke-width="2"/>`;
      case 'earrings': return `<circle cx="24" cy="66" r="4" fill="#F6B21B" stroke="${INK}" stroke-width="2"/><circle cx="76" cy="66" r="4" fill="#F6B21B" stroke="${INK}" stroke-width="2"/>`;
      case 'bow': return `<path d="M58 26l12-8v16zM58 26l-12-8v16z" fill="#E2367A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
      case 'blush': return `<circle cx="34" cy="66" r="5" fill="#F4A0B5"/><circle cx="66" cy="66" r="5" fill="#F4A0B5"/>`;
      case 'crown': return `<path d="M32 22l6-14 8 10 4-12 4 12 8-10 6 14z" fill="#F6B21B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
      case 'headphones': return `<path d="M20 56q0-36 30-36t30 36" fill="none" stroke="${INK}" stroke-width="5"/><rect x="14" y="50" width="12" height="20" rx="5" fill="#E2367A" stroke="${INK}" stroke-width="3"/><rect x="74" y="50" width="12" height="20" rx="5" fill="#E2367A" stroke="${INK}" stroke-width="3"/>`;
      default: return '';
    }
  }
  function svg(a, size) {
    const eyes = a.acc === 'shades' ? '' : `<circle cx="39" cy="54" r="3.5" fill="${INK}"/><circle cx="61" cy="54" r="3.5" fill="${INK}"/>`;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="${a.bg}" stroke="${INK}" stroke-width="3"/>
      ${a.style === 'long' ? hair(a) : ''}
      <circle cx="50" cy="56" r="27" fill="${SK[a.skin]}" stroke="${INK}" stroke-width="3"/>
      ${a.style !== 'long' ? hair(a) : ''}
      ${eyes}<path d="M41 68q9 8 18 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      ${acc(a)}</svg>`;
  }
  window.VK_AVATARS = list.map(a => ({ id: a.id, name: a.name, svg: size => svg(a, size || 48) }));
  window.vkAvatar = (id, size) => (window.VK_AVATARS.find(a => a.id === id) || window.VK_AVATARS[0]).svg(size);
  // A stable default avatar for a name (used when the host reserves for someone)
  window.vkAvatarFor = name => { let h = 0; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return window.VK_AVATARS[h % window.VK_AVATARS.length].id; };

  /* ---- Singer photo: taken with the camera only (no file upload), tiny JPEG kept as a data URL ---- */
  const PH_MAX = 16000;
  window.vkPhotoOk = ph => typeof ph === 'string' && ph.length <= PH_MAX && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(ph);
  // Photo if there is a valid one, otherwise the cartoon avatar
  window.vkFace = (it, size) => it && window.vkPhotoOk(it.ph)
    ? `<img class="vk-ph" src="${it.ph}" width="${size}" height="${size}" alt="">`
    : window.vkAvatar(it && it.av, size);
  /* ---- Mouths: picked on the camera screen, then they open and close on the TV stickman ----
     Drawn in a 60×36 box. Parts with class "jaw" move; "fix" parts (like a mustache) stay put.
     The camera guide puts the real mouth at 50% across / 72% down, so the mouth lands on it. */
  const L = '#1E1A16';
  window.VK_MOUTHS = [
    { id: 'lips', name: 'Lips', svg: `<g class="jaw"><path d="M4 18Q16 4 30 10Q44 4 56 18Q44 34 30 32Q16 34 4 18Z" fill="#D7263D" stroke="${L}" stroke-width="2.5"/><path d="M12 18Q30 12 48 18Q30 28 12 18Z" fill="#3A0D12"/></g>` },
    { id: 'ngiti', name: 'Ngiti', svg: `<g class="jaw"><path d="M4 8H56Q54 34 30 34Q6 34 4 8Z" fill="#3A0D12" stroke="${L}" stroke-width="2.5"/><rect x="10" y="8" width="40" height="7" fill="#fff"/><ellipse cx="30" cy="27" rx="12" ry="5" fill="#E4452B"/></g>` },
    { id: 'o', name: 'O', svg: `<g class="jaw"><ellipse cx="30" cy="18" rx="15" ry="15" fill="#F4A0B5" stroke="${L}" stroke-width="2.5"/><ellipse cx="30" cy="18" rx="9" ry="10" fill="#3A0D12"/></g>` },
    { id: 'ngipin', name: 'Ngipin', svg: `<g class="jaw"><path d="M2 10Q30 2 58 10Q52 34 30 34Q8 34 2 10Z" fill="#fff" stroke="${L}" stroke-width="2.5"/><path d="M4 19H56M17 7V33M30 5V34M43 7V33" stroke="${L}" stroke-width="2"/></g>` },
    { id: 'bigote', name: 'Bigote', svg: `<g class="jaw"><path d="M10 20Q30 15 50 20Q45 34 30 34Q15 34 10 20Z" fill="#3A0D12" stroke="${L}" stroke-width="2.5"/></g><path class="fix" d="M2 14Q14 1 30 10Q46 1 58 14Q48 19 30 14Q12 19 2 14Z" fill="#3B2416" stroke="${L}" stroke-width="2"/>` }
  ];
  window.vkMouthOk = id => window.VK_MOUTHS.some(m => m.id === id);
  const mouthSvg = id => (window.VK_MOUTHS.find(m => m.id === id) || window.VK_MOUTHS[0]).svg;
  // Talking mouth laid over a face (photo or cartoon)
  window.vkMouth = id => `<span class="vk-mouth" aria-hidden="true"><svg viewBox="0 0 60 36" overflow="visible">${mouthSvg(id)}</svg></span>`;

  // Opens the front camera, lets them line up their face with the guide (and the mouth style they
  // pick), and gives back a 160×160 JPEG (about 8 KB) plus the mouth style: onPhoto(photo, mouth)
  window.vkCamera = function (onPhoto) {
    let mo = (() => { try { const m = localStorage.getItem('bv_mouth'); return window.vkMouthOk(m) ? m : 'lips'; } catch (e) { return 'lips'; } })();
    const wrap = document.createElement('div');
    wrap.className = 'cam-wrap';
    wrap.innerHTML = `<div class="cam" role="dialog" aria-modal="true" aria-label="Kunan ng picture">
      <div class="cam-view"><video playsinline muted autoplay></video><img alt="" hidden>
        <svg class="cam-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="50" cy="46" rx="29" ry="37" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 2.5"/>
        </svg>
        <span class="cam-mouth" aria-hidden="true"><svg viewBox="0 0 60 36" overflow="visible">${mouthSvg(mo)}</svg></span>
        <span class="cam-tip">Ilagay ang mukha sa bilog at ang bibig mo sa bibig na nasa screen</span>
        <p class="cam-msg">Binubuksan ang camera…</p></div>
      <div class="cam-mouths" role="radiogroup" aria-label="Itsura ng bibig">${window.VK_MOUTHS.map(m => `<button type="button" role="radio" data-mo="${m.id}" aria-checked="${m.id === mo}" class="${m.id === mo ? 'on' : ''}"><svg viewBox="0 0 60 36" overflow="visible">${m.svg}</svg><small>${m.name}</small></button>`).join('')}</div>
      <div class="cam-btns"><button type="button" class="btn btn--ghost" data-a="no">Kanselahin</button><button type="button" class="btn btn--chili" data-a="snap" disabled>Kunan</button></div></div>`;
    document.body.appendChild(wrap);
    const video = wrap.querySelector('video'), img = wrap.querySelector('img'), msg = wrap.querySelector('.cam-msg'), btns = wrap.querySelector('.cam-btns');
    const guide = wrap.querySelector('.cam-guide'), tip = wrap.querySelector('.cam-tip'), mouth = wrap.querySelector('.cam-mouth');
    let stream = null, shot = '';
    const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
    const close = () => { stop(); wrap.remove(); };
    const live = () => {
      shot = ''; img.hidden = true; video.hidden = false; guide.style.display = ''; tip.hidden = false; mouth.classList.remove('talk');
      btns.innerHTML = '<button type="button" class="btn btn--ghost" data-a="no">Kanselahin</button><button type="button" class="btn btn--chili" data-a="snap">Kunan</button>';
    };
    wrap.addEventListener('click', e => {
      const m = e.target.closest('[data-mo]');
      if (m) {                      // pick a mouth style
        mo = m.dataset.mo; try { localStorage.setItem('bv_mouth', mo); } catch (x) { }
        mouth.querySelector('svg').innerHTML = mouthSvg(mo);
        wrap.querySelectorAll('[data-mo]').forEach(b => { b.classList.toggle('on', b === m); b.setAttribute('aria-checked', b === m); });
        return;
      }
      const a = e.target.closest('[data-a]'); if (!a) { if (e.target === wrap) close(); return; }
      if (a.dataset.a === 'no') close();
      else if (a.dataset.a === 'snap') {
        const w = video.videoWidth, h = video.videoHeight; if (!w || !h) return;
        const side = Math.min(w, h), c = document.createElement('canvas'); c.width = c.height = 160;
        const x = c.getContext('2d'); x.translate(160, 0); x.scale(-1, 1);       // mirror, like the preview
        x.drawImage(video, (w - side) / 2, (h - side) / 2, side, side, 0, 0, 160, 160);
        let q = .75; shot = c.toDataURL('image/jpeg', q);
        while (shot.length > PH_MAX && q > .3) { q -= .1; shot = c.toDataURL('image/jpeg', q); }
        if (!window.vkPhotoOk(shot)) { msg.hidden = false; msg.textContent = 'Hindi nakuha ang picture. Ulitin.'; return; }
        img.src = shot; img.hidden = false; video.hidden = true; guide.style.display = 'none'; tip.hidden = true;
        mouth.classList.add('talk');             // preview: the picked mouth talking on the photo
        btns.innerHTML = '<button type="button" class="btn btn--ghost" data-a="again">Ulitin</button><button type="button" class="btn btn--chili" data-a="use">Gamitin</button>';
      } else if (a.dataset.a === 'again') live();
      else if (a.dataset.a === 'use') { const p = shot; close(); onPhoto(p, mo); }
    });
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = 'Walang camera sa browser na ito. Pumili na lang ng avatar.'; return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false })
      .then(s => { if (!wrap.isConnected) { s.getTracks().forEach(t => t.stop()); return; } stream = s; video.srcObject = s; msg.hidden = true; live(); })
      .catch(e => { msg.textContent = e && e.name === 'NotAllowedError' ? 'Hindi pinayagan ang camera. Payagan sa settings ng browser, o pumili na lang ng avatar.' : 'Hindi mabuksan ang camera. Pumili na lang ng avatar.'; });
  };
})();
