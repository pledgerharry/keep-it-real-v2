import { entries } from './data.js';

const GRADIENTS = [
  { css: 'linear-gradient(135deg, #FF7300 0%, #FFD100 100%)', textLight: false, dateColor: '#FFD100', name: 'Golden Radiance', stops: ['#FF7300', '#FFD100'] },
  { css: 'linear-gradient(135deg, #00C900 0%, #FFD100 100%)', textLight: false, dateColor: '#FFD100', name: 'Vivid Contrast', stops: ['#00C900', '#FFD100'] },
  { css: 'linear-gradient(135deg, #0075FF 0%, #9A4CFF 100%)', textLight: true, dateColor: '#0075FF', name: 'Cool Depth', stops: ['#0075FF', '#9A4CFF'] },
  { css: 'linear-gradient(135deg, #FFD100 0%, #FF7300 50%, #9A4CFF 100%)', textLight: false, dateColor: '#FFD100', name: 'Sunset Glow', stops: ['#FFD100', '#FF7300', '#9A4CFF'] },
  { css: 'linear-gradient(135deg, #00C900 0%, #0075FF 100%)', textLight: true, dateColor: '#00C900', name: 'Electric Energy', stops: ['#00C900', '#0075FF'] },
  { css: 'linear-gradient(135deg, #FFD100 0%, #9A4CFF 100%)', textLight: false, dateColor: '#FFD100', name: 'Golden Hour', stops: ['#FFD100', '#9A4CFF'] },
];

// ─── CORE HELPERS ─────────────────────────────────────────────────────────────

function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDayOfYear(date = new Date()) {
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
}

function getEntryForDay(dayOfYear, year) {
  const seed = year * 1000 + dayOfYear;
  const shuffled = seededShuffle(entries, seed);
  return shuffled[dayOfYear % shuffled.length];
}

function getGradientForDay(dayOfYear) {
  return GRADIENTS[dayOfYear % GRADIENTS.length];
}

function getTodayData() {
  const day = getDayOfYear();
  const year = new Date().getFullYear();
  return { entry: getEntryForDay(day, year), gradient: getGradientForDay(day), day };
}

function formatDate(date = new Date()) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return { day: days[date.getDay()], date: `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}` };
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function applyGradient(gradient) {
  document.documentElement.style.setProperty('--day-gradient', gradient.css);
  document.documentElement.style.setProperty('--date-color', gradient.dateColor);
  document.getElementById('image-panel').style.setProperty('--day-gradient', gradient.css);
  document.getElementById('content-panel').style.background = gradient.css;
  document.body.classList.toggle('text-light', gradient.textLight);
}

function loadImage(entry) {
  const imgEl = document.getElementById('artist-img');
  const fallback = document.getElementById('img-fallback');
  const setInitials = () => {
    fallback.textContent = entry.artist.replace(/[^a-zA-Z\s]/g,'').trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase() || 'KIR';
  };
  if (!entry.image) { setInitials(); return; }
  imgEl.onload = () => imgEl.classList.add('loaded');
  imgEl.onerror = () => { setInitials(); imgEl.style.display = 'none'; };
  imgEl.src = entry.image;
  imgEl.alt = entry.artist;
}

// ─── STREAK ──────────────────────────────────────────────────────────────────

function updateStreak() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  let data = { count: 0, lastVisit: null };
  try { data = JSON.parse(localStorage.getItem('kir_streak') || '{}'); } catch {}
  if (data.lastVisit === today) return data.count || 1;
  const newCount = data.lastVisit === yesterday ? (data.count || 0) + 1 : 1;
  localStorage.setItem('kir_streak', JSON.stringify({ count: newCount, lastVisit: today }));
  return newCount;
}

// ─── JOURNAL ─────────────────────────────────────────────────────────────────

function journalKey(date = new Date()) {
  return `kir_journal_${dateKey(date)}`;
}

function loadJournal() {
  const input = document.getElementById('journal-input');
  const count = document.getElementById('journal-count');
  if (!input) return;
  const saved = localStorage.getItem(journalKey()) || '';
  input.value = saved;
  count.textContent = `${saved.length} / 500`;
}

function initJournal() {
  const input = document.getElementById('journal-input');
  const saved = document.getElementById('journal-saved');
  const count = document.getElementById('journal-count');
  if (!input) return;

  let saveTimer;

  input.addEventListener('input', () => {
    const val = input.value;
    count.textContent = `${val.length} / 500`;
    saved.textContent = '';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(journalKey(), val);
      saved.textContent = 'Saved';
      setTimeout(() => { saved.textContent = ''; }, 2000);
    }, 600);
  });

  loadJournal();
}

// ─── ARCHIVE DRAWER ───────────────────────────────────────────────────────────

function buildArchiveList() {
  const list = document.getElementById('archive-list');
  if (!list) return;

  const today = new Date();
  const todayDoy = getDayOfYear(today);
  const year = today.getFullYear();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Build entries from day 1 to yesterday, most recent first
  const fragment = document.createDocumentFragment();

  for (let doy = todayDoy - 1; doy >= 1; doy--) {
    const d = new Date(year, 0, doy);
    const entry = getEntryForDay(doy, year);
    const gradient = getGradientForDay(doy);
    const key = dateKey(d);
    const hasNote = !!localStorage.getItem(`kir_journal_${key}`);

    const item = document.createElement('div');
    item.className = 'archive-item';
    item.dataset.doy = doy;

    // Colour swatch from gradient start stop
    const swatchColor = gradient.stops[0];

    item.innerHTML = `
      <div class="archive-swatch" style="background:${swatchColor}"></div>
      <div class="archive-info">
        <div class="archive-date">${d.getDate()} ${months[d.getMonth()]}</div>
        <div class="archive-lyric">"${entry.lyric.length > 55 ? entry.lyric.slice(0,55)+'…' : entry.lyric}"</div>
        <div class="archive-artist">${entry.artist} / ${entry.song}</div>
      </div>
      ${hasNote ? '<div class="archive-note-dot" title="You wrote a note"></div>' : ''}
    `;

    item.addEventListener('click', () => openArchiveEntry(doy, year, d));
    fragment.appendChild(item);
  }

  if (todayDoy <= 1) {
    const empty = document.createElement('p');
    empty.className = 'archive-empty';
    empty.textContent = 'No past entries yet. Check back tomorrow.';
    fragment.appendChild(empty);
  }

  list.appendChild(fragment);
}

function openArchiveEntry(doy, year, date) {
  const entry = getEntryForDay(doy, year);
  const gradient = getGradientForDay(doy);
  const { day, date: dateStr } = formatDate(date);
  const key = dateKey(date);
  const savedNote = localStorage.getItem(`kir_journal_${key}`) || '';

  // Build a read-only lightbox
  const old = document.getElementById('archive-entry-modal');
  if (old) old.remove();

  const tc = gradient.textLight ? '#fff' : '#000';
  const mc = gradient.textLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const modal = document.createElement('div');
  modal.id = 'archive-entry-modal';
  modal.className = 'archive-entry-modal';
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="archive-entry-card" style="background:${gradient.css}; color:${tc};">
      <button class="ae-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="${tc}" stroke-width="2.5" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="ae-date" style="color:${mc}">${day}, ${dateStr}</div>
      <div class="ae-lyric">"${entry.lyric}"</div>
      <div class="ae-attr" style="color:${tc}">${entry.artist} <span style="color:${mc}">/ ${entry.song}</span></div>
      <hr class="ae-rule" style="border-color:${gradient.textLight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}"/>
      <div class="ae-label" style="color:${mc}">Reflection</div>
      <div class="ae-body">${entry.reflection}</div>
      <div class="ae-label" style="color:${mc}; margin-top:16px">Today's Action</div>
      <div class="ae-body">${entry.action}</div>
      ${savedNote ? `
        <hr class="ae-rule" style="border-color:${gradient.textLight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}; margin-top:16px"/>
        <div class="ae-label" style="color:${mc}">Your note</div>
        <div class="ae-body ae-note">${savedNote}</div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('open'));

  const close = () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 280);
  };
  modal.querySelector('.ae-close').onclick = close;
  modal.querySelector('.modal-backdrop').onclick = close;
}

function initArchive() {
  const btn = document.getElementById('archive-btn');
  const drawer = document.getElementById('archive-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeBtn = document.getElementById('drawer-close');
  if (!btn || !drawer) return;

  let built = false;

  const open = () => {
    if (!built) { buildArchiveList(); built = true; }
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('drawer-open');
  };
  const close = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('drawer-open');
  };

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// ─── REMINDER MODAL ───────────────────────────────────────────────────────────

function initReminder() {
  const btn = document.getElementById('reminder-btn');
  const modal = document.getElementById('reminder-modal');
  const closeBtn = document.getElementById('reminder-close');
  const submitBtn = document.getElementById('reminder-submit');
  const emailInput = document.getElementById('reminder-email');
  const successEl = document.getElementById('reminder-success');
  const formEl = document.getElementById('reminder-form');
  if (!btn || !modal) return;

  const open = () => {
    modal.classList.add('open');
    setTimeout(() => emailInput?.focus(), 300);
  };
  const close = () => modal.classList.remove('open');

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.querySelector('.reminder-backdrop').addEventListener('click', close);

  // Check if already signed up
  if (localStorage.getItem('kir_reminder_email')) {
    btn.classList.add('active');
  }

  submitBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add('input-error');
      emailInput.placeholder = 'Please enter a valid email';
      setTimeout(() => emailInput.classList.remove('input-error'), 1500);
      return;
    }

    // Store locally + open mailto as low-fi backend
    localStorage.setItem('kir_reminder_email', email);
    btn.classList.add('active');

    // In production this would POST to your email service.
    // For now, we open a mailto so you can capture it manually,
    // or wire up a Mailchimp / ConvertKit API endpoint here.
    const subject = encodeURIComponent('Keep It Real — daily reminder signup');
    const body = encodeURIComponent(`New signup: ${email}`);
    window.open(`mailto:hello@keepitreal.app?subject=${subject}&body=${body}`, '_blank');

    formEl.style.display = 'none';
    successEl.style.display = 'flex';
  });

  emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// ─── CANVAS CARD ─────────────────────────────────────────────────────────────

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function roundRect(ctx, x, y, w, h, r = 14) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function applyGrain(ctx, W, H, intensity = 20) {
  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * intensity;
    d[i] = Math.min(255, Math.max(0, d[i]+n));
    d[i+1] = Math.min(255, Math.max(0, d[i+1]+n));
    d[i+2] = Math.min(255, Math.max(0, d[i+2]+n));
  }
  ctx.putImageData(imgData, 0, 0);
}

function drawCardBase(ctx, W, H, gradient) {
  const stops = gradient.stops;
  const grd = ctx.createLinearGradient(0, 0, W, H);
  stops.forEach((c, i) => grd.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  applyGrain(ctx, W, H, 20);
}

function drawCardContent(ctx, W, H, entry, gradient, dateStr, opts = {}) {
  const { isStory = false } = opts;
  const tc = gradient.textLight ? '#fff' : '#000';
  const mc = gradient.textLight ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const ac = gradient.textLight ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  const ruleColor = gradient.textLight ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)';
  const PAD = isStory ? 90 : 80;
  const INNER = W - PAD * 2;
  let y = PAD;

  // ── Header ──
  ctx.save();
  ctx.fillStyle = tc;
  const ss = 18, sx = PAD + ss, sy = y + ss + 2;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? ss : ss * 0.42;
    const px = sx + r * Math.cos(angle), py = sy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.font = '500 26px "DM Mono", monospace';
  ctx.fillText('KEEP IT REAL', PAD + ss * 2 + 14, sy + 10);
  ctx.fillStyle = mc;
  ctx.font = '400 21px "DM Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - PAD, sy + 10);
  ctx.restore();

  // ── Rule ──
  y = PAD + 58;
  ctx.save();
  ctx.strokeStyle = ruleColor; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  ctx.restore();

  // ── Lyric ──
  y += 48;
  ctx.save();
  ctx.fillStyle = tc;
  let lfs = isStory ? 96 : 86, llines;
  while (lfs > 34) {
    ctx.font = `${lfs}px "Bebas Neue", cursive`;
    llines = wrapText(ctx, `"${entry.lyric}"`, INNER);
    if (llines.length <= (isStory ? 5 : 4)) break;
    lfs -= 5;
  }
  ctx.font = `${lfs}px "Bebas Neue", cursive`;
  const llh = lfs * 1.08;
  llines.forEach((ln, i) => ctx.fillText(ln, PAD, y + i * llh));
  y += llines.length * llh + 28;
  ctx.restore();

  // ── Artist / song ──
  ctx.save();
  ctx.fillStyle = tc;
  ctx.font = '500 24px "DM Mono", monospace';
  ctx.fillText(entry.artist.toUpperCase(), PAD, y);
  y += 32;
  ctx.fillStyle = mc;
  ctx.font = '400 20px "DM Mono", monospace';
  ctx.fillText(`/ ${entry.song}`, PAD, y);
  y += 48;
  ctx.restore();

  // ── Rule ──
  ctx.save();
  ctx.strokeStyle = ruleColor; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 38;
  ctx.restore();

  // ── Reflection ──
  ctx.save();
  ctx.fillStyle = mc;
  ctx.font = '500 16px "DM Mono", monospace';
  ctx.fillText('REFLECTION', PAD, y);
  y += 30;
  ctx.fillStyle = tc;
  let rfs = isStory ? 30 : 26, rlines;
  const maxReflY = H - PAD - (isStory ? 260 : 180);
  while (rfs > 16) {
    ctx.font = `300 ${rfs}px "DM Sans", sans-serif`;
    rlines = wrapText(ctx, entry.reflection, INNER);
    if (y + rlines.length * rfs * 1.5 < maxReflY) break;
    rfs -= 2;
  }
  ctx.font = `300 ${rfs}px "DM Sans", sans-serif`;
  const rlh = rfs * 1.5;
  rlines.forEach((ln, i) => ctx.fillText(ln, PAD, y + i * rlh));
  y += rlines.length * rlh + 24;
  ctx.restore();

  // ── Action box ──
  const boxH = H - PAD - y - 48;
  if (boxH >= 80) {
    ctx.save();
    ctx.fillStyle = ac;
    roundRect(ctx, PAD, y, INNER, Math.min(boxH, isStory ? 200 : 150));
    ctx.fill();
    ctx.fillStyle = mc;
    ctx.font = '500 15px "DM Mono", monospace';
    ctx.fillText("TODAY'S ACTION", PAD + 24, y + 28);
    ctx.fillStyle = tc;
    ctx.font = `400 ${isStory ? 24 : 21}px "DM Sans", sans-serif`;
    const alines = wrapText(ctx, entry.action, INNER - 48);
    alines.slice(0, isStory ? 4 : 3).forEach((ln, i) => ctx.fillText(ln, PAD + 24, y + 56 + i * (isStory ? 32 : 28)));
    ctx.restore();
  }

  // ── Footer ──
  ctx.save();
  ctx.fillStyle = mc;
  ctx.font = '400 17px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('keepitreal.app', W / 2, H - PAD + 18);
  ctx.restore();
}

async function generateSquareCard(entry, gradient, dateStr) {
  const W = 1080, H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawCardBase(ctx, W, H, gradient);
  drawCardContent(ctx, W, H, entry, gradient, dateStr, { isStory: false });
  return canvas;
}

async function generateStoryCard(entry, gradient, dateStr) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawCardBase(ctx, W, H, gradient);
  drawCardContent(ctx, W, H, entry, gradient, dateStr, { isStory: true });
  return canvas;
}

// ─── SHARE MODAL ─────────────────────────────────────────────────────────────

let squareCanvas = null;
let storyCanvas = null;
let activeFormat = 'square'; // 'square' | 'story'
let shareEntry = null;
let shareGradient = null;
let shareDateStr = null;

function buildShareModal() {
  const m = document.createElement('div');
  m.id = 'share-modal';
  m.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card">
      <button class="modal-close" id="modal-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="format-toggle">
        <button class="format-btn active" id="fmt-square" data-fmt="square">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          Post
        </button>
        <button class="format-btn" id="fmt-story" data-fmt="story">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="14"><rect x="4" y="2" width="16" height="20" rx="2"/></svg>
          Story
        </button>
      </div>
      <div class="modal-preview-wrap" id="modal-preview-wrap">
        <canvas id="card-canvas"></canvas>
        <div class="modal-spinner" id="modal-spinner"><div class="spinner-ring"></div></div>
      </div>
      <div class="modal-actions">
        <button class="modal-btn primary" id="btn-download">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Save image
        </button>
        <button class="modal-btn" id="btn-share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
        <button class="modal-btn" id="btn-copy-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copy text
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  return m;
}

function getActiveCanvas() {
  return activeFormat === 'story' ? storyCanvas : squareCanvas;
}

function showCanvas(canvas) {
  if (!canvas) return;
  const cv = document.getElementById('card-canvas');
  const wrap = document.getElementById('modal-preview-wrap');
  cv.width = canvas.width; cv.height = canvas.height;
  cv.getContext('2d').drawImage(canvas, 0, 0);
  // Adjust preview aspect ratio
  wrap.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
  document.getElementById('modal-spinner').style.display = 'none';
  cv.style.opacity = '1';
}

async function openShareModal(entry, gradient, dateStr) {
  shareEntry = entry; shareGradient = gradient; shareDateStr = dateStr;
  squareCanvas = null; storyCanvas = null; activeFormat = 'square';

  const old = document.getElementById('share-modal');
  if (old) old.remove();
  const modal = buildShareModal();
  requestAnimationFrame(() => modal.classList.add('open'));

  document.getElementById('modal-close').onclick = closeShareModal;
  modal.querySelector('.modal-backdrop').onclick = closeShareModal;

  // Generate square immediately; story lazily
  squareCanvas = await generateSquareCard(entry, gradient, dateStr);
  showCanvas(squareCanvas);

  // Format toggle
  document.getElementById('fmt-square').addEventListener('click', async () => {
    if (activeFormat === 'square') return;
    activeFormat = 'square';
    document.getElementById('fmt-square').classList.add('active');
    document.getElementById('fmt-story').classList.remove('active');
    showCanvas(squareCanvas);
  });

  document.getElementById('fmt-story').addEventListener('click', async () => {
    if (activeFormat === 'story') return;
    activeFormat = 'story';
    document.getElementById('fmt-story').classList.add('active');
    document.getElementById('fmt-square').classList.remove('active');
    // Generate story card on first request
    if (!storyCanvas) {
      document.getElementById('modal-spinner').style.display = 'flex';
      document.getElementById('card-canvas').style.opacity = '0';
      storyCanvas = await generateStoryCard(entry, gradient, dateStr);
    }
    showCanvas(storyCanvas);
  });

  // Download
  document.getElementById('btn-download').onclick = () => {
    const cv = getActiveCanvas();
    if (!cv) return;
    const a = document.createElement('a');
    a.download = `keep-it-real-${activeFormat}-${new Date().toISOString().slice(0,10)}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
    const btn = document.getElementById('btn-download');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><polyline points="20 6 9 17 4 12"/></svg> Saved!`;
    setTimeout(() => { btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Save image`; }, 2500);
  };

  // Native share
  document.getElementById('btn-share').onclick = () => {
    const cv = getActiveCanvas();
    if (!cv) return;
    cv.toBlob(async (blob) => {
      const file = new File([blob], 'keep-it-real.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'Keep It Real', text: `"${entry.lyric}" — ${entry.artist}` }); }
        catch (e) { if (e.name !== 'AbortError') document.getElementById('btn-download').click(); }
      } else {
        document.getElementById('btn-download').click();
      }
    });
  };

  // Copy text
  document.getElementById('btn-copy-text').onclick = async () => {
    const text = `"${entry.lyric}"\n— ${entry.artist}, ${entry.song}\n\nReflection: ${entry.reflection}\n\nToday's action: ${entry.action}\n\nkeepitreal.app`;
    await navigator.clipboard.writeText(text).catch(() => {});
    const btn = document.getElementById('btn-copy-text');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    setTimeout(() => { btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy text`; }, 2500);
  };
}

function closeShareModal() {
  const m = document.getElementById('share-modal');
  if (!m) return;
  m.classList.remove('open');
  setTimeout(() => m.remove(), 280);
}

// ─── INIT ────────────────────────────────────────────────────────────────────

function init() {
  const { entry, gradient } = getTodayData();
  const { day, date } = formatDate();

  applyGradient(gradient);
  document.getElementById('day-name').textContent = day;
  document.getElementById('date-text').textContent = date;
  document.getElementById('lyric').textContent = `"${entry.lyric}"`;
  document.getElementById('artist-name').textContent = entry.artist;
  document.getElementById('song-title').textContent = entry.song;
  document.getElementById('reflection').textContent = entry.reflection;
  document.getElementById('action-step').textContent = entry.action;
  document.getElementById('spotify-btn').href = `https://open.spotify.com/search/${encodeURIComponent(entry.spotifySearch)}`;
  document.getElementById('youtube-btn').href = `https://www.youtube.com/results?search_query=${encodeURIComponent(entry.artist+' '+entry.song)}`;
  document.getElementById('apple-btn').href = `https://music.apple.com/search?term=${encodeURIComponent(entry.artist+' '+entry.song)}`;

  loadImage(entry);

  // Streak
  const streak = updateStreak();
  const sb = document.getElementById('streak-badge');
  if (sb && streak >= 2) { sb.textContent = `${streak} day streak 🔥`; sb.style.display = 'inline-flex'; }

  // Journal
  initJournal();

  // Archive
  initArchive();

  // Reminder
  initReminder();

  // Share
  document.getElementById('share-btn')?.addEventListener('click', () => {
    openShareModal(entry, gradient, `${day}, ${date}`);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeShareModal();
      // close archive entry modal too
      const aeModal = document.getElementById('archive-entry-modal');
      if (aeModal) { aeModal.classList.remove('open'); setTimeout(() => aeModal.remove(), 280); }
    }
  });

  requestAnimationFrame(() => document.body.classList.add('ready'));
}

document.addEventListener('DOMContentLoaded', init);
