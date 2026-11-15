/* Seminar 9 · Northway Home board meeting — application
   Data: Firebase Firestore (when config.js has a firebase config) or this browser only (test mode). */
const { TEAMS, NAV, STATUS, DECISIONS } = window.CONTENT;
const CFG = window.SEMINAR_CONFIG || {};
const TK = ['A', 'B', 'C', 'D', 'E'];
const PHASES = [[0, 5, 'Introduction'], [5, 18, 'Read your text'], [18, 23, 'Check questions'], [23, 38, 'Choose your facts'], [38, 58, 'Build your screen'], [58, 60, 'Submit']];
const app = document.getElementById('app');

/* ---------------- components (Material 3 names) ---------------- */
const COMP = [
  ['Navigation', [['topappbar', 'Top app bar', 360, 64], ['navbar', 'Navigation bar', 360, 72], ['tabs', 'Tabs', 360, 48], ['search', 'Search', 328, 56]]],
  ['Containment', [['card', 'Card', 328, 104], ['list', 'List', 328, 168], ['dialog', 'Dialog', 300, 190], ['bottomsheet', 'Bottom sheet', 360, 200], ['carousel', 'Carousel', 328, 130], ['divider', 'Divider', 328, 8]]],
  ['Actions', [['button', 'Common button', 160, 40], ['efab', 'Extended FAB', 180, 56], ['iconbutton', 'Icon button', 40, 40], ['segmented', 'Segmented button', 300, 40]]],
  ['Communication', [['badge', 'Badge', 40, 40], ['progress', 'Progress indicator', 300, 16], ['snackbar', 'Snackbar', 328, 48], ['tooltip', 'Tooltip', 150, 32]]],
  ['Selection', [['checkbox', 'Checkbox', 220, 32], ['chips', 'Chips', 328, 32], ['datepicker', 'Date picker', 300, 280], ['radio', 'Radio button', 220, 32], ['slider', 'Slider', 280, 32], ['switch', 'Switch', 220, 32]]],
  ['Text inputs', [['textfield', 'Text input', 328, 56]]]
];
const CDEF = {}; COMP.forEach(g => g[1].forEach(c => CDEF[c[0]] = { name: c[1], w: c[2], h: c[3] }));

/* facts: ids, display order (fixed shuffle) */
const FACT = {};
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
TK.forEach((k, ti) => {
  TEAMS[k].facts.forEach((f, i) => { f.id = k + (i + 1); f.team = k; FACT[f.id] = f; });
  // fixed shuffle that spreads the relevant facts through the list (never two relevant facts next to each other, none first)
  const r = rng(1042 + ti * 97); const ids = TEAMS[k].facts.map(f => f.id);
  const good = ids.filter(id => ['key', 'case'].includes(FACT[id].kind)), rest = ids.filter(id => !good.includes(id));
  const sh = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let slots; do { slots = sh([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]).slice(0, good.length).sort((x, y) => x - y); }
  while (slots.some((v, i) => i && v - slots[i - 1] < 2) || slots[slots.length - 1] - slots[0] < 8);
  const g = sh(good), o = sh(rest); const seq = [];
  for (let i = 0; i < ids.length; i++) seq.push(slots.includes(i) ? g.shift() : o.shift());
  TEAMS[k].seq = seq;
});
const factNo = id => TEAMS[FACT[id].team].seq.indexOf(id) + 1;

/* ---------------- state ---------------- */
let S = { teams: {}, board: {} };
const TD = () => ({ qset: null, solved: {}, tries: {}, override: false, picked: [], because: {}, wf: null, lockedAt: null, agenda: { order: [], opening: '', publishedAt: null } });
const BD = () => ({ clock: null, extension: 0, failedAt: null, meeting: null, stage: 'present', spot: null, connections: [], answers: { 1: '', 2: '' } });
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
function merge(a, b) { const o = { ...a }; for (const k in b) o[k] = isObj(b[k]) && isObj(a[k]) ? merge(a[k], b[k]) : b[k]; return o; }
const T = k => merge(TD(), S.teams[k] || {});
const B = () => merge(BD(), S.board || {});

/* ---------------- storage backends ---------------- */
let SESSION = null, MODE = 'test';
const Local = {
  init(code) {
    this.key = 'nw9:' + code; this.mem = null;
    try { this.bc = new BroadcastChannel(this.key); this.bc.onmessage = () => this.pull(); } catch (e) { }
    addEventListener('storage', e => { if (e.key === this.key) this.pull(); });
    this.pull();
  },
  read() { try { return JSON.parse(localStorage.getItem(this.key)) || { teams: {}, board: {} }; } catch (e) { return this.mem || { teams: {}, board: {} }; } },
  pull() { const d = this.read(); S = { teams: d.teams || {}, board: d.board || {} }; changed(); },
  write(fn) {
    const d = this.read(); d.teams = d.teams || {}; d.board = d.board || {}; fn(d); this.mem = d;
    try { localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) { }
    try { this.bc && this.bc.postMessage(1); } catch (e) { }
    S = { teams: d.teams, board: d.board }; changed();
  },
  setTeam(k, p) { this.write(d => { d.teams[k] = merge(d.teams[k] || {}, p); }); },
  setBoard(p) { this.write(d => { d.board = merge(d.board || {}, p); }); },
  reset() { this.write(d => { d.teams = {}; d.board = {}; }); }
};
const Cloud = {
  async init(code, cfg) {
    const V = '10.12.2';
    const appMod = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
    this.fs = fs; this.code = code;
    this.db = fs.getFirestore(appMod.initializeApp(cfg));
    fs.onSnapshot(fs.collection(this.db, 'sessions', code, 'teams'), snap => {
      const t = {}; snap.forEach(d => t[d.id] = d.data()); S.teams = t; changed();
    }, cloudError);
    fs.onSnapshot(fs.doc(this.db, 'sessions', code, 'meta', 'board'), d => { S.board = d.data() || {}; changed(); }, cloudError);
  },
  setTeam(k, p) {
    S.teams[k] = merge(S.teams[k] || {}, p); changed();
    this.fs.setDoc(this.fs.doc(this.db, 'sessions', this.code, 'teams', k), p, { merge: true }).catch(cloudError);
  },
  setBoard(p) {
    S.board = merge(S.board || {}, p); changed();
    this.fs.setDoc(this.fs.doc(this.db, 'sessions', this.code, 'meta', 'board'), p, { merge: true }).catch(cloudError);
  },
  async reset() {
    for (const k of TK) await this.fs.setDoc(this.fs.doc(this.db, 'sessions', this.code, 'teams', k), {});
    await this.fs.setDoc(this.fs.doc(this.db, 'sessions', this.code, 'meta', 'board'), {});
  }
};
let DB = Local;
function cloudError(e) { console.error(e); toast('Connection problem: ' + (e.code || e.message || e), 6000); }
// Replace whole fields (arrays/maps) where merging would keep stale keys
const setTeam = (k, p) => DB.setTeam(k, p);
const setBoard = p => DB.setBoard(p);

/* ---------------- helpers ---------------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const col = k => `var(--${k})`;
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9.]/g, '').replace(/\.$/, '');
const fmt = ts => ts ? new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const snap = v => Math.round(v / 8) * 8;
function toast(m, ms = 2800) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), ms); }
function answerOk(q, v) { const n = norm(v); if (!n) return false; return q.a.some(a => a.startsWith('=') ? n === norm(a.slice(1)) : n.includes(norm(a))); }

const unlocked = k => { const t = T(k); return t.override || (t.qset && t.qset.every(i => t.solved[i])); };
function buildItems(k) {
  const t = T(k), wf = t.wf || [];
  const items = t.picked.map(id => {
    const f = FACT[id]; const ok = wf.some(e => e.fact === id && f.comp.includes(e.type));
    return { id, ok, label: f.screen, comp: f.comp[0] };
  });
  const txt = wf.map(e => (e.text || '')).join(' ').toLowerCase();
  const rules = [
    { ok: wf.some(e => e.type === 'topappbar' && /northway/i.test(e.text || '')), label: 'Top app bar named “Northway · …”' },
    { ok: wf.some(e => e.type === 'navbar'), label: 'Navigation bar: Stock · Delivery · Customers · People · Dashboard' },
    { ok: /nw-?1042/.test(txt), label: 'Order #NW-1042 shown on your screen' }
  ];
  return { items, rules };
}
function submitChecks(k) {
  const t = T(k), n = t.picked.length, { items, rules } = buildItems(k);
  return [
    [n >= 3 && n <= 4, `3–4 facts chosen (${n})`],
    [n > 0 && t.picked.every(id => (t.because[id] || '').trim().length >= 10), 'Every fact has a “This matters because…” sentence'],
    [n > 0 && items.every(i => i.ok), 'Every chosen fact is on your screen as its component'],
    [rules.every(r => r.ok), 'Northway system rules followed']
  ];
}
function missingOf(k) {
  const t = T(k); if (t.lockedAt) return '';
  if (!unlocked(k)) return 'check questions';
  if (t.picked.length < 3) return 'facts';
  const c = submitChecks(k); if (!c[2][0] || !c[3][0]) return 'screen';
  return 'not submitted';
}
function parts() {
  const p = TK.map(k => ({ k, label: 'Team ' + k, part: TEAMS[k].short, ok: !!T(k).lockedAt, miss: missingOf(k) }));
  const ag = T('E').agenda; p.push({ k: 'agenda', label: 'Agenda', part: 'the agenda (Team E)', ok: !!ag.publishedAt, miss: 'not published' });
  return p;
}
const allReady = () => parts().every(p => p.ok);
const deadline = () => { const b = B(); return b.clock ? b.clock + (60 + (b.extension || 0)) * 60000 : null; };
function boardState() {
  const b = B(); if (b.meeting) return 'meeting';
  if (b.failedAt) return 'failed';
  if (allReady()) return 'ready';
  const d = deadline(); if (d && Date.now() > d) return 'failed';
  return 'waiting';
}
function teamStatus(k) {
  const t = T(k);
  if (t.lockedAt) return ['Submitted ✓', 'ok'];
  if (!unlocked(k)) { const n = (t.qset || []).filter(i => t.solved[i]).length; return [t.qset ? `Check questions ${n}/4` : 'Reading', '']; }
  if ((t.wf || []).length > 2) return ['Building screen', 'warn'];
  return [`Choosing facts (${t.picked.length})`, 'warn'];
}

/* ---------------- value chain ---------------- */
function vcHTML({ size = '', hi = [], fill = null, bad = [] } = {}) {
  const box = k => `<div class="vc-box ${hi.includes(k) ? 'hi' : ''} ${bad.includes(k) ? 'bad' : ''}" style="color:${col(k)}"><div class="nm">${k} · ${esc(TEAMS[k].short)}</div>${fill ? `<div class="fill">${fill(k)}</div>` : ''}</div>`;
  return `<div class="vc ${size}"><div class="vc-side">Support activities</div><div class="vc-arrow">
    <div class="vc-support">${box('E')}${box('D')}</div><div class="vc-side" style="margin:0">Primary activities</div>
    <div class="vc-primary">${box('A')}<div class="vc-box na"><div class="nm">Operations</div>${size ? '' : '<div class="fill">not used — Northway does not manufacture</div>'}</div>${box('C')}${box('B')}</div></div>
    <div class="vc-industry"><span>Suppliers’ suppliers</span><span>Suppliers</span><span class="firm">Northway Home</span><span>Distributors</span><span>Customers</span></div></div>`;
}

/* ---------------- wireframe rendering ---------------- */
const txt = (e, d) => esc(e.text || d);
function comp(e) {
  const ln = w => `<div class="ln" style="width:${w}%"></div>`;
  switch (e.type) {
    case 'topappbar': return `<div class="k k-bar"><span>☰</span><b style="flex:1">${txt(e, 'Title')}</b><span>⋮</span></div>`;
    case 'navbar': {
      const it = (e.text || '').split(',').filter(Boolean);
      if (!it.length) return `<div class="k k-bar nav">${'<div class="ni"><div class=ic></div><div class=ln style="width:30px"></div></div>'.repeat(4)}</div>`;
      return `<div class="k k-bar nav">${it.map(x => { const on = x.trim().startsWith('*'); return `<div class="ni ${on ? 'on' : ''}"><div class=ic></div>${esc(x.trim().replace('*', ''))}</div>`; }).join('')}</div>`;
    }
    case 'tabs': return `<div class="k" style="border-bottom:1px solid #ccc;justify-content:space-around">${(e.text || 'Tab 1,Tab 2,Tab 3').split(',').map((s, i) => `<span style="padding:12px 4px;${i ? '' : 'border-bottom:3px solid #555;font-weight:600'}">${esc(s.trim())}</span>`).join('')}</div>`;
    case 'search': return `<div class="k k-pill" style="background:#ececf1;justify-content:flex-start;padding:0 16px">🔍 <span style="color:#666">${txt(e, 'Search')}</span></div>`;
    case 'card': return `<div class="k k-card"><b>${txt(e, 'Card title')}</b>${ln(90)}${ln(70)}${ln(50)}</div>`;
    case 'list': return `<div class="k" style="flex-direction:column;align-items:stretch;gap:0">${[0, 1, 2].map(i => `<div style="display:flex;gap:10px;align-items:center;padding:10px 4px;border-bottom:1px solid #e3e3e3"><div class=ic></div><div style="flex:1;display:flex;flex-direction:column;gap:5px">${i ? ln(60) : `<span>${txt(e, 'List item')}</span>`}${ln(85)}</div></div>`).join('')}</div>`;
    case 'dialog': return `<div class="k k-card" style="background:#fff;box-shadow:0 4px 14px #0003;border-radius:22px;padding:18px"><b>${txt(e, 'Dialog title')}</b>${ln(95)}${ln(80)}<div style="margin-top:auto;align-self:flex-end;display:flex;gap:16px;font-weight:600">Cancel <span>OK</span></div></div>`;
    case 'bottomsheet': return `<div class="k k-card" style="border-radius:22px 22px 0 0;background:#f1f1f4;align-items:stretch"><div style="align-self:center;width:36px;height:4px;background:#999;border-radius:2px"></div><b>${txt(e, 'Bottom sheet')}</b>${ln(90)}${ln(75)}</div>`;
    case 'carousel': return `<div class="k" style="gap:8px">${[60, 30, 10].map(w => `<div style="flex:${w};height:100%;background:#d9dae0;border-radius:14px"></div>`).join('')}</div>`;
    case 'divider': return `<div class="k"><div style="height:1px;background:#999;width:100%"></div></div>`;
    case 'button': return `<div class="k k-pill k-fill">${txt(e, 'Button')}</div>`;
    case 'efab': return `<div class="k" style="background:#d6d8e4;border-radius:16px;justify-content:center;font-weight:600">＋ ${txt(e, 'Action')}</div>`;
    case 'iconbutton': return `<div class="k k-pill" style="background:#e3e3ea;justify-content:center">★</div>`;
    case 'segmented': return `<div class="k k-pill k-out" style="gap:0;padding:0">${(e.text || 'Option 1,Option 2').split(',').map((s, i) => `<span style="flex:1;text-align:center;padding:9px 0;${i ? 'border-left:1.5px solid #888' : 'background:#dfe0e8'}">${esc(s.trim())}</span>`).join('')}</div>`;
    case 'badge': return `<div class="k" style="justify-content:center;position:relative"><div class=ic style="width:26px;height:26px"></div><span style="position:absolute;top:2px;right:2px;background:#b3261e;color:#fff;border-radius:9px;font-size:10px;padding:0 5px;white-space:nowrap">${txt(e, '3')}</span></div>`;
    case 'progress': return `<div class="k" style="flex-direction:column;align-items:stretch;gap:3px;justify-content:center">${e.text ? `<span style="font-size:11px">${esc(e.text)}</span>` : ''}<div style="height:4px;background:#ddd;border-radius:2px;overflow:hidden"><div style="height:100%;width:60%;background:#555"></div></div></div>`;
    case 'snackbar': return `<div class="k" style="background:#313033;color:#fff;border-radius:6px;padding:0 14px;justify-content:space-between"><span>${txt(e, 'Message')}</span></div>`;
    case 'tooltip': return `<div class="k" style="background:#313033;color:#fff;border-radius:5px;padding:0 10px;font-size:12px;justify-content:center">${txt(e, 'Tooltip')}</div>`;
    case 'checkbox': return `<div class="k"><div class=sq></div>${txt(e, 'Checkbox option')}</div>`;
    case 'radio': return `<div class="k"><div class=rd></div>${txt(e, 'Radio option')}</div>`;
    case 'switch': return `<div class="k" style="justify-content:space-between"><span>${txt(e, 'Setting')}</span><div class=sw></div></div>`;
    case 'slider': return `<div class="k" style="position:relative"><div style="height:4px;background:#999;width:100%;border-radius:2px"></div><div style="position:absolute;left:55%;width:16px;height:16px;border-radius:50%;background:#555"></div></div>`;
    case 'chips': return `<div class="k" style="gap:6px;flex-wrap:nowrap">${(e.text || 'Chip,Chip').split(',').map(s => `<span style="border:1.5px solid #888;border-radius:8px;padding:4px 10px;white-space:nowrap">${esc(s.trim())}</span>`).join('')}</div>`;
    case 'datepicker': return `<div class="k k-card" style="background:#fff;border-radius:16px;align-items:stretch"><b>${txt(e, 'Select date')}</b><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:6px">${Array.from({ length: 35 }, (_, i) => `<span style="text-align:center;font-size:11px;${i === 17 ? 'background:#555;color:#fff;border-radius:50%' : ''}">${i < 31 ? i + 1 : ''}</span>`).join('')}</div></div>`;
    case 'textfield': return `<div class="k k-out" style="border-radius:4px;padding:0 14px;position:relative"><span style="position:absolute;top:-9px;left:10px;background:#fff;padding:0 4px;font-size:11px;color:#666">${txt(e, 'Label')}</span><span style="color:#999">Input text</span></div>`;
  }
  return '';
}
function phoneHTML(k, { edit = false, labels = true, scale = 1, sel = null } = {}) {
  const t = T(k), wf = t.wf || [];
  const els = wf.map(e => {
    const f = e.fact && t.picked.includes(e.fact);
    return `<div class="el ${sel === e.id ? 'sel' : ''}" data-el="${e.id}" style="left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px">${comp(e)}${labels ? `<span class="lbl ${f ? 'f' : ''} ${e.y < 16 ? 'in' : ''}">${esc(CDEF[e.type].name)}${f ? ' · fact ' + factNo(e.fact) : ''}</span>` : ''}${edit && sel === e.id ? '<span class="rh" data-rh></span>' : ''}</div>`;
  }).join('');
  return `<div class="phone-out" style="width:${360 * scale + 4}px;height:${640 * scale + 4}px"><div class="phone ${edit ? 'edit' : 'view'}" ${edit ? 'id="phone"' : ''} style="transform:scale(${scale})">${els}${!wf.length ? '<div class="empty">No screen yet</div>' : ''}</div></div>`;
}
function frame(k) {
  const nav = TK.map(x => (x === k ? '*' : '') + NAV[x]).join(',');
  return [{ id: 'f1', type: 'topappbar', text: 'Northway · ' + TEAMS[k].screenTitle, x: 0, y: 0, w: 360, h: 64, fact: '' },
  { id: 'f2', type: 'navbar', text: nav, x: 0, y: 568, w: 360, h: 72, fact: '' }];
}

/* ---------------- clock ---------------- */
function phaseNow() { const b = B(); if (!b.clock) return null; const m = (Date.now() - b.clock) / 60000; for (const p of PHASES) if (m < p[1]) return p[2]; return null; }
function countHTML(big = false) {
  const d = deadline(); const st = boardState();
  if (st === 'meeting') return `<span class="count ok">Board meeting in progress</span>`;
  if (!d) return `<span class="count">Clock not started</span>`;
  const left = (d - Date.now()) / 1000; const cls = left <= 0 ? 'bad' : left < 300 ? 'bad' : left < 600 ? 'warn' : '';
  return `<span class="count ${cls} ${big ? 'big' : ''}" data-count>${left > 0 ? `Submit in <b>${mmss(left)}</b>` : '<b>Time’s up</b>'}${B().extension ? ' · extension' : ''}</span>`;
}
function readyBar(big = false) {
  const p = parts(); const n = p.filter(x => x.ok).length;
  return `<div class="ready ${big ? 'big' : ''}"><div class="ready-h"><b>Board meeting readiness</b><span>${n} of 6 parts ready</span>${countHTML(big)}</div>
   <div class="ready-parts">${p.map(x => `<span class="rp ${x.ok ? 'ok' : 'no'}" ${x.k !== 'agenda' ? `style="--c:${col(x.k)}"` : ''}>${esc(x.label)} ${x.ok ? '✓' : `<i>— ${esc(x.miss)}</i>`}</span>`).join('')}</div></div>`;
}

/* ---------------- routing & rendering ---------------- */
let ui = { tab: {}, sel: null, answers: {}, labels: true, pinOk: localStorage.getItem('nw9tutor') === '1', lastState: null, conn: { from: 'B', to: 'C', what: '' } };
function route() { const h = location.hash.replace('#', ''); if (h.startsWith('team/')) return { v: 'team', k: h.slice(5) }; if (h === 'board') return { v: 'board' }; if (h === 'observer') return { v: 'observer' }; return { v: 'home' }; }
addEventListener('hashchange', () => { ui.sel = null; render(true); });
let pending = false;
function changed() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; render(); }); }
function inputFocused() { const a = document.activeElement; return a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && app.contains(a); }
let deferred = false;
document.addEventListener('focusout', () => setTimeout(() => { if (deferred && !inputFocused()) { deferred = false; render(); } }, 50));
function render(force = false) {
  if (!force && inputFocused()) { deferred = true; return; }
  if (!SESSION) { app.innerHTML = joinView(); return; }
  const r = route();
  const tl = `<span class="menu"><a href="#">Teams</a><a href="#board">Class screen</a><a href="#observer">Observer</a><a href="#" data-bar="leave">Change session</a></span>`;
  document.getElementById('bar').innerHTML = `<span><b>Northway Home</b> · Seminar 9</span>${tl}<span>Session <b>${esc(SESSION)}</b>${MODE === 'test' ? ' · <span class="testtag">TEST MODE — this browser only</span>' : ''}</span>`;
  if (r.v === 'team' && TEAMS[r.k]) { app.innerHTML = teamView(r.k); bindPhone(r.k); }
  else if (r.v === 'board') app.innerHTML = boardView();
  else if (r.v === 'observer') app.innerHTML = ui.pinOk ? observerView() : pinView();
  else app.innerHTML = homeView();
}

/* ---------------- join / home ---------------- */
function joinView() {
  return `<div class="wrap narrow"><h1>Northway Home · board meeting</h1><p class="muted">Seminar 9 · Enterprise systems and the value chain</p>
   <div class="panel"><h2>Enter the session code</h2><p class="muted">Your tutor shows it on the class screen.</p>
   <div class="row"><input id="code" class="inp" placeholder="e.g. NW9" maxlength="16" autocomplete="off"><button class="btn pri" data-act="join">Join</button></div></div></div>`;
}
function homeView() {
  return `<div class="wrap"><h1>Choose your department</h1><p class="muted">Each department designs one screen of Northway’s new system. At the board meeting the five screens must work as one.</p>
   ${vcHTML({ size: 'big', fill: k => `<a class="btn sm" href="#team/${k}">Join Team ${k} →</a>` })}
</div>`;
}

/* ---------------- team view ---------------- */
function teamView(k) {
  const Tm = TEAMS[k], t = T(k), un = unlocked(k);
  let tab = ui.tab[k] || 'brief';
  const tabs = [['brief', '1 · Brief'], ['check', '2 · Check questions'], ['facts', '3 · Facts' + (un ? '' : ' 🔒')], ['build', '4 · Build your screen' + (un ? '' : ' 🔒')], ['submit', '5 · Submit' + (un ? '' : ' 🔒')]];
  if (k === 'E') tabs.push(['agenda', '★ Agenda']);
  let body;
  if (tab === 'brief') body = briefTab(k);
  else if (tab === 'check') body = checkTab(k);
  else if (tab === 'agenda') body = agendaTab();
  else if (!un) body = `<div class="banner lock">🔒 This step opens when all four check questions are answered correctly.</div>`;
  else if (tab === 'facts') body = factsTab(k);
  else if (tab === 'build') body = buildTab(k);
  else body = submitTab(k);
  const ph = phaseNow();
  return `<div class="wrap">
   <div class="thead"><div><div class="teamchip" style="color:${col(k)}"><span class="dot" style="background:${col(k)}"></span>Team ${k} · ${esc(Tm.vc)}</div><h1>${esc(Tm.name)}</h1></div>
    <div class="phase">${ph ? `Suggested now: <b>${esc(ph)}</b>` : ''}</div></div>
   ${readyBar()}
   ${t.lockedAt ? `<div class="banner ok">✓ Submitted at ${fmt(t.lockedAt)}. Your screen is ready for the board meeting.</div>` : ''}
   <div class="tabs">${tabs.map(([id, l]) => `<button class="${tab === id ? 'on' : ''}" data-act="tab" data-k="${k}" data-tab="${id}">${l}</button>`).join('')}</div>
   ${body}</div>`;
}
function briefTab(k) {
  const Tm = TEAMS[k];
  return `<div class="grid2"><div class="panel">
    <h2>Your role</h2><p>${esc(Tm.role)}</p>
    <h2 style="margin-top:14px">Your screen</h2><p>${esc(Tm.screen)}</p>
    <h2 style="margin-top:14px">Four steps — submit by minute 60</h2>
    <ol class="steps"><li><b>Read</b> your printed pack: ${esc(Tm.read)}.</li>
     <li><b>Check questions</b> — get all four right to unlock your facts.</li>
     <li><b>Choose 3–4 facts</b> out of 15. Ask: <i>${esc(Tm.test)}</i></li>
     <li><b>Build your screen</b> — add the Material 3 component named under each chosen fact. Then submit.</li></ol>
    ${k === 'E' ? `<div class="banner warn">You also <b>chair the board meeting</b>. Build the agenda in the ★ Agenda tab before minute 60.</div>` : ''}
    <p><button class="btn pri" data-act="tab" data-k="${k}" data-tab="check">We have read the text → check questions</button></p></div>
   <div><div class="panel"><h3>Where you sit in the value chain</h3>${vcHTML({ size: 'mini', hi: [k] })}</div>
    ${rulesBox(k)}</div></div>`;
}
function rulesBox(k) {
  return `<div class="panel rules"><h3>Northway system rules <span class="muted small">— the same for every team</span></h3>
   <ul><li>Your screen starts with the <b>Northway frame</b>: Top app bar and Navigation bar (${TK.map(x => x === k ? `<b>${NAV[x]}</b>` : NAV[x]).join(' · ')}). Keep it.</li>
   <li>Show order <b>#NW-1042</b> — Jane Smith, Velvet cushion. On your screen: ${esc(TEAMS[k].order)}</li>
   <li>Status words: ${STATUS.join(' · ')}.</li></ul></div>`;
}
function ensureQset(k) {
  const t = T(k); if (t.qset) return t.qset;
  const qs = TEAMS[k].qs; const core = [], team = [];
  qs.forEach((q, i) => (q.pool === 'core' ? core : team).push(i));
  const pick = (a, n) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).slice(0, n).map(x => x[1]);
  const qset = [...pick(core, 1), ...pick(team, 3)];
  setTeam(k, { qset }); return qset;
}
function checkTab(k) {
  const t = T(k); const qset = ensureQset(k); const all = unlocked(k);
  return `${all ? `<div class="banner ok">✓ ${t.override && !qset.every(i => t.solved[i]) ? 'Your tutor unlocked your facts.' : 'All four correct — your facts are unlocked.'} <button class="btn sm" data-act="tab" data-k="${k}" data-tab="facts">Go to facts →</button></div>`
      : `<p class="muted">Answer with a word or number from your <b>printed text</b>. Try as many times as you need.</p>`}
   ${qset.map((qi, n) => {
    const q = TEAMS[k].qs[qi]; const s = t.solved[qi]; const tries = t.tries[qi] || 0;
    return `<div class="q ${s ? 'solved' : ''}"><div class="where">${esc(q.where)}</div><p><b>${n + 1}.</b> ${esc(q.q)}</p>
     ${s ? '<span class="tag ok">✓ Correct</span>' : `<div class="row"><input class="inp" data-ans="${k}-${qi}" value="${esc(ui.answers[k + '-' + qi] || '')}" placeholder="Your answer" autocomplete="off"><button class="btn pri" data-act="check" data-k="${k}" data-q="${qi}">Check</button>${tries ? `<span class="tag bad">Not yet — ${tries} ${tries > 1 ? 'tries' : 'try'}</span>` : ''}</div>${tries >= 3 ? `<div class="hint">Hint: ${esc(q.hint)}</div>` : ''}`}</div>`;
  }).join('')}`;
}
function factsTab(k) {
  const Tm = TEAMS[k], t = T(k), locked = !!t.lockedAt, n = t.picked.length;
  return `<div class="panel explain"><h3>How facts become your screen</h3>
    <p>Each fact tells you something your screen could do. Under it, <b>“On your screen”</b> names the <b>Material 3 component</b> it would become.
    Choose a fact only if that component helps the person using your screen: <i>${esc(Tm.test)}</i>
    Leave facts that add nothing — and the one that contradicts your reading.</p>
    <p class="small">What each component looks like: <a href="https://m3.material.io/components" target="_blank" rel="noopener">m3.material.io/components</a></p></div>
   <div class="banner ${n >= 3 && n <= 4 ? 'ok' : 'warn'}"><b>${n} of 3–4 chosen.</b></div>
   <div class="facts">${Tm.seq.map((id, i) => {
    const f = FACT[id]; const on = t.picked.includes(id); const [name, ...rest] = f.screen.split(' — ');
    return `<button class="fact ${on ? 'on' : ''}" data-act="pick" data-k="${k}" data-id="${id}" ${locked ? 'disabled' : ''}><span class="n">${i + 1}</span><span><span class="ft">${esc(f.text)}</span><span class="os">On your screen: <b>${esc(name)}</b> — ${esc(rest.join(' — '))}</span></span></button>`;
  }).join('')}</div>
   ${n ? `<h2 style="margin-top:20px">Why these facts matter</h2>${t.picked.map(id => `<div class="because"><b>Fact ${factNo(id)}.</b> ${esc(FACT[id].text)}<textarea data-bc="${k}|${id}" placeholder="This matters because…" ${locked ? 'disabled' : ''}>${esc(t.because[id] || '')}</textarea></div>`).join('')}
     <p><button class="btn pri" data-act="tab" data-k="${k}" data-tab="build">Build your screen →</button></p>` : ''}`;
}
function buildTab(k) {
  const Tm = TEAMS[k], t = T(k), locked = !!t.lockedAt;
  if (!t.wf || !t.wf.length) { setTeam(k, { wf: frame(k) }); }
  const wf = T(k).wf || []; const sel = wf.find(e => e.id === ui.sel); const { items, rules } = buildItems(k);
  return `<p><b>Build:</b> ${esc(Tm.screen)}</p>
   <div class="wfb">
    <div class="pal">${locked ? '<p class="small muted">Submitted — editing is closed.</p>' : COMP.map(([g, cs]) => `<div class="grp">${g}</div>${cs.map(c => `<button data-act="add" data-k="${k}" data-type="${c[0]}">${c[1]}</button>`).join('')}`).join('')}</div>
    <div>${phoneHTML(k, { edit: !locked, labels: ui.labels, sel: ui.sel })}<label class="small row" style="margin-top:8px;gap:6px"><input type="checkbox" data-act="labels" ${ui.labels ? 'checked' : ''}> Show Material 3 names</label></div>
    <div class="ins">
     <div class="panel"><h3>Build list — from your facts</h3>
      ${items.length ? `<ul class="reqs">${items.map(i => `<li class="${i.ok ? 'ok' : ''}"><span><b>Fact ${factNo(i.id)}</b> · ${esc(i.label)}</span>${i.ok || locked ? '' : `<button class="btn sm" data-act="addfor" data-k="${k}" data-id="${i.id}">Add ${esc(CDEF[i.comp].name)}</button>`}</li>`).join('')}</ul>` : '<p class="small muted">Choose your facts first (step 3).</p>'}
      <h3 style="margin-top:12px">System rules</h3><ul class="reqs">${rules.map(r => `<li class="${r.ok ? 'ok' : ''}"><span>${esc(r.label)}</span></li>`).join('')}</ul>
      <p class="small muted" style="margin-top:6px">#NW-1042 here: ${esc(Tm.order)}</p></div>
     ${sel && !locked ? `<div class="panel ins"><h3>${esc(CDEF[sel.type].name)}</h3>
      <label>Text on the component<input class="inp" data-prop="text" value="${esc(sel.text || '')}" placeholder="${/tabs|chips|segmented|navbar/.test(sel.type) ? 'Comma-separated, e.g. Home,Pick-up point' : 'Short text'}"></label>
      <label>Which fact does it show?<select class="inp" data-prop="fact"><option value="">— none —</option>${t.picked.map(id => `<option value="${id}" ${sel.fact === id ? 'selected' : ''}>Fact ${factNo(id)}: ${esc(FACT[id].text.slice(0, 55))}…</option>`).join('')}</select></label>
      <div class="row"><button class="btn sm" data-act="dup" data-k="${k}">Duplicate</button><button class="btn sm danger" data-act="del" data-k="${k}">Delete</button></div>
      <p class="small muted">Drag to move · drag the blue corner to resize · arrow keys nudge</p></div>` : `<p class="small muted">Click a component on the phone to change its text or link it to a fact.</p>`}
    </div></div>`;
}
function submitTab(k) {
  const t = T(k), c = submitChecks(k), ok = c.every(x => x[0]);
  const others = TK.filter(x => x !== k && T(x).lockedAt).length;
  return `${!t.lockedAt && others >= 2 ? `<div class="banner bad">Your team is blocking the board meeting — ${others} other team${others > 1 ? 's have' : ' has'} already submitted.</div>` : ''}
   <div class="grid2"><div class="panel"><h2>Ready to submit?</h2><ul class="reqs">${c.map(([o, l]) => `<li class="${o ? 'ok' : ''}"><span>${esc(l)}</span></li>`).join('')}</ul>
    <p style="margin-top:14px">${t.lockedAt ? `<span class="tag ok">Submitted at ${fmt(t.lockedAt)}</span>` : `<button class="btn pri" data-act="lock" data-k="${k}" ${ok ? '' : 'disabled'}>Submit to the board</button>`}</p>
    <p class="small muted">After submitting, nothing can be changed.</p></div>
   <div class="panel"><h2>At the board meeting you present</h2>
    <p><b>Speaker 1 — your screen (1 minute)</b></p><ol class="steps"><li>Who uses this screen and what they do with it.</li><li>Point to each component: its Material 3 name and the fact it comes from.</li><li>One thing your screen <b>needs from</b> another screen, and one thing it <b>sends to</b> one.</li></ol>
    <p><b>Speaker 2 — the original question</b><br>${k === 'D' || k === 'C' ? `<b>${DECISIONS[2].t}:</b> ${esc(DECISIONS[2].d)}` : `<b>${DECISIONS[1].t}</b> ${esc(DECISIONS[1].d)}`} One or two sentences, backed by one of your facts.</p></div></div>`;
}
function agendaTab() {
  const a = T('E').agenda; const pub = !!a.publishedAt; const missing = TK.filter(k => !a.order.includes(k));
  const can = !missing.length && (a.opening || '').trim().length >= 10;
  return `<div class="grid2"><div class="panel"><h2>Board meeting agenda</h2>
   <p class="muted small">You chair the meeting (25 minutes): each team presents its screen (about 1 minute), then the board connects the screens into one system, then answers the two original questions.</p>
   <h3>1. Order of presentations</h3>
   ${a.order.map((k, i) => `<div class="slot"><span class="num">${i + 1}</span><span class="dot" style="background:${col(k)}"></span><span style="flex:1"><b>Team ${k}</b> · ${esc(TEAMS[k].name)}</span>${pub ? '' : `<button class="btn sm" data-act="ag-mv" data-i="${i}" data-d="-1">↑</button><button class="btn sm" data-act="ag-mv" data-i="${i}" data-d="1">↓</button><button class="btn sm danger" data-act="ag-rm" data-i="${i}">✕</button>`}</div>`).join('') || '<p class="muted small">No teams yet.</p>'}
   ${pub ? '' : `<div class="row">${missing.map(k => `<button class="btn sm" data-act="ag-add" data-k="${k}">+ Team ${k}</button>`).join('')}</div>`}
   <h3 style="margin-top:14px">2. Your opening statement (2–3 sentences)</h3>
   <textarea class="inp" data-ag="opening" rows="4" ${pub ? 'disabled' : ''} placeholder="Why are we meeting, and what must we decide today?">${esc(a.opening)}</textarea>
   <p style="margin-top:12px">${pub ? `<span class="tag ok">Published at ${fmt(a.publishedAt)}</span> <button class="btn sm" data-act="ag-unpub">Edit again</button>` : `<button class="btn pri" data-act="ag-pub" ${can ? '' : 'disabled'}>Publish the agenda</button>`}</p>
   ${!pub && !can ? `<p class="small muted">${missing.length ? `Every team needs a slot (missing: ${missing.join(', ')}). ` : ''}${(a.opening || '').trim().length < 10 ? 'Write the opening statement.' : ''}</p>` : ''}</div>
   <div class="panel"><h3>Chair’s running order</h3><ol class="steps"><li>Open with your statement.</li><li>Call each team in agenda order — 1 minute each. Present your dashboard last.</li><li><b>Connect the system:</b> ask each team what it needs and sends; record every connection on the class screen. Every screen must connect to another, and your dashboard must receive data from all four teams. Follow order #NW-1042 through all five screens.</li><li><b>The two questions:</b> ask the teams, then type the board’s answers.</li><li>Close by reading the answers aloud.</li></ol></div></div>`;
}

/* ---------------- class screen ---------------- */
function boardView() {
  const st = boardState(); const b = B();
  if (st !== 'meeting') {
    const p = parts(); const badTeams = p.filter(x => !x.ok && x.k !== 'agenda').map(x => x.k);
    let head = '';
    if (st === 'failed') {
      const miss = p.filter(x => !x.ok).map(x => x.k === 'agenda' ? 'the agenda' : `${TEAMS[x.k].short} (Team ${x.k})`);
      head = `<div class="fail"><h1>Board meeting cancelled — the project failed.</h1><p>Northway’s new system cannot work without: <b>${esc(miss.join(', '))}</b>.</p></div>`;
    } else if (st === 'ready') head = `<div class="readyok"><h1>All departments ready.</h1><p>The chair can start the board meeting.</p><button class="btn pri big" data-act="start">Start board meeting</button></div>`;
    return `<div class="wrap screen"><div class="sbar"><h1>Northway Home · board meeting</h1>${countHTML(true)}</div>${head}${readyBar(true)}
     ${vcHTML({ size: 'big', bad: st === 'failed' ? badTeams : [], fill: k => { const [s, c] = teamStatus(k); const m = missingOf(k); return `<span class="tag ${c}">${s}</span>${m && m !== 'not submitted' ? `<div class="small missing">missing: ${esc(m)}</div>` : ''}`; } })}
     ${st === 'waiting' ? `<p class="center muted" style="margin-top:16px">The board meeting can start only when all six parts are ready.${b.clock ? '' : ' (Clock not started.)'}</p>` : ''}</div>`;
  }
  const stages = [['present', '1 · Presentations'], ['connect', '2 · Connect the system'], ['questions', '3 · The two questions'], ['summary', 'Summary']];
  let body = '';
  if (b.stage === 'present') body = presentStage();
  else if (b.stage === 'connect') body = connectStage();
  else if (b.stage === 'questions') body = questionsStage();
  else body = summaryStage();
  return `<div class="wrap screen wide"><div class="sbar"><div class="tabs flat">${stages.map(([id, l]) => `<button class="${b.stage === id ? 'on' : ''}" data-act="stage" data-s="${id}">${l}</button>`).join('')}</div>${b.meeting.forced ? '<span class="tag warn">Started by the tutor — not all parts were ready</span>' : ''}</div>${body}</div>`;
}
const agendaOrder = () => { const a = T('E').agenda; return a.publishedAt && a.order.length === 5 ? a.order : TK; };
function presentStage() {
  const ord = agendaOrder(); const b = B(); const k = ord.includes(b.spot) ? b.spot : ord[0]; const i = ord.indexOf(k); const t = T(k); const a = T('E').agenda;
  return `${a.opening ? `<div class="panel" style="margin-bottom:12px"><b>Chair’s opening:</b> ${esc(a.opening)}</div>` : ''}
   <div class="row" style="margin-bottom:12px">${ord.map((x, j) => `<button class="btn sm ${x === k ? 'pri' : ''}" data-act="spot" data-k="${x}">${j + 1}. Team ${x}</button>`).join('')}</div>
   <div class="sbar"><div><div class="teamchip" style="color:${col(k)}"><span class="dot" style="background:${col(k)}"></span>Team ${k} · ${esc(TEAMS[k].vc)}</div><h1>${esc(TEAMS[k].name)}</h1></div>
    <div class="row"><button class="btn" data-act="spotnav" data-d="-1" ${i <= 0 ? 'disabled' : ''}>← Previous</button><button class="btn pri" data-act="spotnav" data-d="1" ${i >= ord.length - 1 ? 'disabled' : ''}>Next team →</button></div></div>
   ${t.lockedAt ? '' : '<div class="banner warn">This team did not submit — showing its draft.</div>'}
   <div class="spot"><div>${t.picked.map(id => `<div class="sfact" style="border-left-color:${col(k)}"><b>Fact ${factNo(id)}.</b> ${esc(FACT[id].text)}<div class="os">→ ${esc(FACT[id].screen.split(' — ')[0])}</div>${t.because[id] ? `<div class="bc">${esc(t.because[id])}</div>` : ''}</div>`).join('') || '<p class="muted">No facts chosen.</p>'}</div>
    <div><p class="small muted" style="margin:0 0 6px">${esc(TEAMS[k].screen)}</p>${phoneHTML(k, { scale: .9 })}</div></div>`;
}
function connChecks() {
  const c = B().connections || [];
  const linked = k => c.some(x => x.from === k || x.to === k);
  const feeds = ['A', 'B', 'C', 'D'].map(k => [k, c.some(x => x.from === k && x.to === 'E')]);
  const order = TK.map(k => [k, /nw-?1042/i.test((T(k).wf || []).map(e => e.text || '').join(' '))]);
  return { every: TK.map(k => [k, linked(k)]), feeds, order };
}
function mapSVG() {
  const c = B().connections || []; const css = k => getComputedStyle(document.documentElement).getPropertyValue('--' + k).trim();
  const N = { A: [130, 60], B: [570, 60], C: [570, 300], D: [130, 300], E: [350, 180] }; const hw = 78, hh = 22;
  const edge = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1]; const s = Math.min(dx ? hw / Math.abs(dx) : 1e9, dy ? hh / Math.abs(dy) : 1e9); return [p[0] + dx * s, p[1] + dy * s]; };
  const groups = {}; c.forEach((x, i) => { const key = [x.from, x.to].sort().join(''); (groups[key] = groups[key] || []).push(i); });
  const lines = c.map((x, i) => {
    const p = N[x.from], q = N[x.to]; if (!p || !q || x.from === x.to) return '';
    const key = [x.from, x.to].sort().join(''); const g = groups[key]; const idx = g.indexOf(i);
    const [ax, ay] = N[key[0]], [bx, by] = N[key[1]]; const L = Math.hypot(bx - ax, by - ay); const nx = -(by - ay) / L, ny = (bx - ax) / L;
    const off = (idx - (g.length - 1) / 2) * 26;
    const s = edge(p, q), e = edge(q, p);
    const x1 = s[0] + nx * off, y1 = s[1] + ny * off, x2 = e[0] + nx * off, y2 = e[1] + ny * off;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${css(x.from)}" stroke-width="2.5" marker-end="url(#ar-${x.from})"/>` +
      `<text x="${mx}" y="${my + 4}" font-size="12" text-anchor="middle" fill="#1D2230" paint-order="stroke" stroke="#fff" stroke-width="5">${esc((x.what || '').slice(0, 34))}</text>`;
  }).join('');
  const nodes = Object.entries(N).map(([k, [x, y]]) => `<rect x="${x - hw}" y="${y - hh}" width="${hw * 2}" height="${hh * 2}" rx="10" fill="#fff" stroke="${css(k)}" stroke-width="2.5"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="${css(k)}">${k} · ${esc(NAV[k])}</text>`).join('');
  const markers = TK.map(k => `<marker id="ar-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${css(k)}"/></marker>`).join('');
  return `<svg viewBox="0 0 700 360" class="map"><defs>${markers}</defs>${lines}${nodes}</svg>`;
}
function checksHTML() {
  const ch = connChecks(); const m = (arr) => arr.map(([k, ok]) => `<span class="tag ${ok ? 'ok' : ''}">${k} ${ok ? '✓' : '—'}</span>`).join(' ');
  return `<div class="checks"><div><b>Every screen connected</b><br>${m(ch.every)}</div><div><b>Dashboard receives data from</b><br>${m(ch.feeds)}</div><div><b>#NW-1042 on every screen</b><br>${m(ch.order)}</div></div>`;
}
function connectStage() {
  const c = B().connections || []; const f = ui.conn;
  return `<h1>Connect the system</h1><p class="muted">Follow order #NW-1042 through the five screens. For each link: which screen sends what to which screen?</p>
   <div class="fivescreens">${['A', 'B', 'C', 'D', 'E'].map(k => `<div><div class="teamchip small" style="color:${col(k)}">${k} · ${esc(NAV[k])}</div>${phoneHTML(k, { scale: .4, labels: false })}</div>`).join('')}</div>
   <div class="grid2" style="margin-top:14px"><div class="panel">
    <div class="row"><select class="inp" data-cf="from">${TK.map(k => `<option ${f.from === k ? 'selected' : ''}>${k}</option>`).join('')}</select> sends
     <input class="inp" data-cf="what" style="flex:1;min-width:180px" placeholder="what? e.g. chosen pick-up point" value="${esc(f.what)}"> to
     <select class="inp" data-cf="to">${TK.map(k => `<option ${f.to === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
     <button class="btn pri" data-act="conn-add">Add</button></div>
    <ul class="conns">${c.map((x, i) => `<li><span class="dot" style="background:${col(x.from)}"></span><b>${x.from}</b> → <span class="dot" style="background:${col(x.to)}"></span><b>${x.to}</b>: ${esc(x.what)} <button class="btn sm danger" data-act="conn-rm" data-i="${i}">✕</button></li>`).join('') || '<li class="muted">No connections yet.</li>'}</ul>
    ${checksHTML()}</div>
   <div class="panel">${mapSVG()}</div></div>`;
}
function questionsStage() {
  const a = B().answers || {};
  return `<h1>The two original questions</h1>${[1, 2].map(n => `<div class="panel" style="margin-bottom:14px"><h2>${n}. ${esc(DECISIONS[n].t)}</h2><p class="muted">${esc(DECISIONS[n].d)}</p><textarea class="inp big" data-answer="${n}" rows="4" placeholder="The board decides…">${esc(a[n] || '')}</textarea></div>`).join('')}`;
}
function summaryStage() {
  const a = B().answers || {};
  return `<h1>What the board decided</h1><div class="grid2"><div class="panel">${mapSVG()}${checksHTML()}</div>
   <div>${[1, 2].map(n => `<div class="panel" style="margin-bottom:14px"><h2>${n}. ${esc(DECISIONS[n].t)}</h2><p style="font-size:18px">${esc(a[n] || '—')}</p></div>`).join('')}</div></div>`;
}

/* ---------------- observer ---------------- */
function pinView() {
  return `<div class="wrap narrow"><div class="panel"><h2>Observer view</h2><p class="muted">Tutor only — enter the PIN.</p><div class="row"><input id="pin" class="inp" type="password" autocomplete="off"><button class="btn pri" data-act="pin">Open</button></div></div></div>`;
}
const KIND = { key: ['key', 'ok'], case: ['true case fact', 'ok'], false: ['contradicts reading', 'bad'], mis: ['misleading', 'bad'], dis: ['irrelevant', 'warn'] };
function observerView() {
  const b = B(); const st = boardState();
  return `<div class="wrap"><div class="thead"><div><h1>Observer view</h1><p class="muted" style="margin:0">Only you see this page. Session <b>${esc(SESSION)}</b>${MODE === 'test' ? ' · test mode' : ''}.</p></div>${countHTML()}</div>
   <div class="panel" style="margin-bottom:14px"><div class="row">
    <b class="small">Clock</b>${b.clock ? `<span class="small">started ${fmt(b.clock)}</span><button class="btn sm" data-act="clock-stop">Stop</button>` : `<button class="btn sm pri" data-act="clock-start">Start the 60-minute clock</button>`}
    <span class="sep"></span><b class="small">Deadline</b><button class="btn sm" data-act="extend" ${b.extension ? 'disabled' : ''}>+5 minutes (once)</button>
    <button class="btn sm" data-act="force" ${st === 'meeting' ? 'disabled' : ''}>Start meeting anyway</button>
    <span class="tag ${st === 'failed' ? 'bad' : st === 'meeting' || st === 'ready' ? 'ok' : ''}">State: ${st}</span>
    <span class="sep"></span><a class="btn sm" href="#board" target="_blank">Open class screen ↗</a></div>
    ${st === 'meeting' ? `<div class="row" style="margin-top:8px"><b class="small">Class screen</b>${['present', 'connect', 'questions', 'summary'].map(s => `<button class="btn sm ${b.stage === s ? 'pri' : ''}" data-act="stage" data-s="${s}">${s}</button>`).join('')}${TK.map(k => `<button class="btn sm" data-act="spot" data-k="${k}">Spotlight ${k}</button>`).join('')}</div>` : ''}
    <div class="row" style="margin-top:8px"><b class="small">Session</b><button class="btn sm danger" data-act="reset">Reset session</button>${MODE === 'test' ? '<button class="btn sm" data-act="demo">Fill with sample work (test mode)</button>' : ''}</div></div>
   ${readyBar()}
   <table><thead><tr><th>Team</th><th>Status</th><th>Check questions</th><th>Facts chosen</th><th>Screen</th><th>Submitted</th></tr></thead><tbody>
   ${TK.map(k => {
    const t = T(k); const [s, c] = teamStatus(k); const { items, rules } = buildItems(k);
    return `<tr><td><span class="teamchip" style="color:${col(k)}"><span class="dot" style="background:${col(k)}"></span>${k}</span><div class="small muted">${esc(TEAMS[k].short)}</div></td>
     <td><span class="tag ${c}">${s}</span></td>
     <td>${(t.qset || []).map((qi, n) => `<div class="small nowrap">Q${n + 1} ${t.solved[qi] ? '<span class="tag ok">✓</span>' : '<span class="tag">—</span>'}${t.tries[qi] ? ` <span class="muted">${t.tries[qi]}× wrong</span>` : ''}</div>`).join('') || '<span class="small muted">not started</span>'}
      ${unlocked(k) ? (t.override ? '<span class="tag warn">unlocked by you</span>' : '') : `<button class="btn sm" data-act="override" data-k="${k}">Unlock facts</button>`}</td>
     <td>${t.picked.length ? `<ul class="flist">${t.picked.map(id => { const f = FACT[id]; const [l, cc] = KIND[f.kind]; return `<li class="small">${esc(f.text.slice(0, 60))}… <span class="tag ${cc}">${l}</span></li>`; }).join('')}</ul>` : '<span class="small muted">—</span>'}</td>
     <td class="small">${(t.wf || []).length} components<br>facts on screen: ${items.filter(i => i.ok).length}/${items.length}<br>rules: ${rules.filter(r => r.ok).length}/3</td>
     <td class="small">${t.lockedAt ? fmt(t.lockedAt) : '—'}</td></tr>`;
  }).join('')}</tbody></table>
   <div class="grid2" style="margin-top:14px"><div class="panel"><h3>Agenda (Team E)</h3>${T('E').agenda.publishedAt ? `<p class="small"><span class="tag ok">Published ${fmt(T('E').agenda.publishedAt)}</span> · ${T('E').agenda.order.join(' → ')}</p><p class="small"><i>${esc(T('E').agenda.opening)}</i></p>` : `<p class="small muted">Not published. ${T('E').agenda.order.length}/5 teams on it.</p>`}</div>
    <div class="panel"><h3>The system (board meeting)</h3>${checksHTML()}<p class="small">${(b.connections || []).length} connections recorded.</p></div></div>
   <details class="panel" style="margin-top:14px"><summary><b>Answer key</b></summary>${TK.map(k => `<h3 style="margin-top:12px;color:${col(k)}">Team ${k}</h3>
    <ul class="small">${TEAMS[k].qs.map(q => `<li>[${q.pool}] ${esc(q.q)} → <b>${esc(q.a[0].replace('=', ''))}</b> <span class="muted">(${esc(q.where)})</span></li>`).join('')}</ul>
    <ul class="small">${TEAMS[k].facts.filter(f => ['key', 'case'].includes(f.kind)).map(f => `<li>Fact ${factNo(f.id)}: ${esc(f.text)} → <b>${esc(f.screen.split(' — ')[0])}</b></li>`).join('')}</ul>`).join('')}</details></div>`;
}

/* ---------------- events ---------------- */
const curTeam = () => { const r = route(); return r.v === 'team' ? r.k : null; };
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, k = b.dataset.k; const t = k ? T(k) : null;
  if (b.tagName === 'A' && a !== 'leave') return;
  switch (a) {
    case 'join': { const v = (document.getElementById('code').value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, ''); if (v) startSession(v); return; }
    case 'leave': e.preventDefault(); localStorage.removeItem('nw9:last'); location.href = location.pathname; return;
    case 'pin': if (document.getElementById('pin').value === String(CFG.tutorPin || '')) { ui.pinOk = true; localStorage.setItem('nw9tutor', '1'); render(true); } else toast('Wrong PIN'); return;
    case 'tab': ui.tab[k] = b.dataset.tab; ui.sel = null; render(true); scrollTo(0, 0); return;
    case 'check': {
      const qi = +b.dataset.q; const inp = app.querySelector(`[data-ans="${k}-${qi}"]`); ui.answers[k + '-' + qi] = inp.value;
      if (!norm(inp.value)) return;
      if (answerOk(TEAMS[k].qs[qi], inp.value)) setTeam(k, { solved: { [qi]: true } }); else { setTeam(k, { tries: { [qi]: (t.tries[qi] || 0) + 1 } }); toast('Not yet — check the paragraph again.'); }
      render(true); return;
    }
    case 'pick': {
      const id = b.dataset.id; let picked = [...t.picked];
      if (picked.includes(id)) picked = picked.filter(x => x !== id);
      else { if (picked.length >= 4) { toast('You can choose up to 4 facts. Remove one first.'); return; } picked.push(id); }
      const p = { picked }; if (t.wf) p.wf = t.wf.map(el => !el.fact || picked.includes(el.fact) ? el : { ...el, fact: '' });
      setTeam(k, p); render(true); return;
    }
    case 'add': case 'addfor': {
      const type = a === 'add' ? b.dataset.type : FACT[b.dataset.id].comp[0]; const d = CDEF[type];
      const wf = [...(t.wf || frame(k))];
      const bottom = wf.filter(el => el.type !== 'navbar').reduce((m, el) => Math.max(m, el.y + el.h), 0);
      const el = { id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type, x: Math.max(0, snap((360 - d.w) / 2)), y: Math.min(568 - d.h, bottom + 8), w: d.w, h: d.h, text: '', fact: a === 'addfor' ? b.dataset.id : '' };
      if (type === 'navbar') el.y = 640 - d.h;
      if (el.y < 0) el.y = 0;
      wf.push(el); ui.sel = el.id; setTeam(k, { wf }); render(true); return;
    }
    case 'del': { const wf = (t.wf || []).filter(x => x.id !== ui.sel); ui.sel = null; setTeam(k, { wf }); render(true); return; }
    case 'dup': { const s = (t.wf || []).find(x => x.id === ui.sel); if (!s) return; const c = { ...s, id: 'e' + Date.now().toString(36), y: Math.min(640 - s.h, s.y + s.h + 8) }; ui.sel = c.id; setTeam(k, { wf: [...t.wf, c] }); render(true); return; }
    case 'lock': if (submitChecks(k).every(x => x[0])) { setTeam(k, { lockedAt: Date.now() }); ui.sel = null; toast('Submitted. Thank you!'); } render(true); return;
    case 'ag-add': { const ag = T('E').agenda; setTeam('E', { agenda: { order: [...ag.order, k] } }); render(true); return; }
    case 'ag-rm': { const o = [...T('E').agenda.order]; o.splice(+b.dataset.i, 1); setTeam('E', { agenda: { order: o } }); render(true); return; }
    case 'ag-mv': { const o = [...T('E').agenda.order]; const i = +b.dataset.i, j = i + +b.dataset.d; if (j < 0 || j >= o.length) return;[o[i], o[j]] = [o[j], o[i]]; setTeam('E', { agenda: { order: o } }); render(true); return; }
    case 'ag-pub': setTeam('E', { agenda: { publishedAt: Date.now() } }); render(true); return;
    case 'ag-unpub': setTeam('E', { agenda: { publishedAt: null } }); render(true); return;
    case 'start': if (boardState() === 'ready') setBoard({ meeting: { startedAt: Date.now(), forced: false }, stage: 'present', spot: agendaOrder()[0] }); render(true); return;
    case 'force': setBoard({ meeting: { startedAt: Date.now(), forced: true }, stage: 'present', spot: agendaOrder()[0] }); render(true); return;
    case 'stage': setBoard({ stage: b.dataset.s }); render(true); return;
    case 'spot': setBoard({ spot: k, stage: 'present' }); render(true); return;
    case 'spotnav': { const o = agendaOrder(); const cur = o.includes(B().spot) ? B().spot : o[0]; const n = o[o.indexOf(cur) + +b.dataset.d]; if (n) setBoard({ spot: n }); render(true); return; }
    case 'conn-add': { const f = ui.conn; if (!f.what.trim() || f.from === f.to) { toast(f.from === f.to ? 'Choose two different screens.' : 'Say what is sent.'); return; } setBoard({ connections: [...(B().connections || []), { from: f.from, to: f.to, what: f.what.trim() }] }); ui.conn.what = ''; render(true); return; }
    case 'conn-rm': { const c = [...(B().connections || [])]; c.splice(+b.dataset.i, 1); setBoard({ connections: c }); render(true); return; }
    case 'override': setTeam(k, { override: true }); render(true); return;
    case 'clock-start': setBoard({ clock: Date.now(), failedAt: null, extension: 0 }); render(true); return;
    case 'clock-stop': setBoard({ clock: null, failedAt: null }); render(true); return;
    case 'extend': if (!B().extension) { setBoard({ extension: 5, failedAt: null }); toast('Extension granted: +5 minutes'); } render(true); return;
    case 'reset': if (resetArm()) { DB.reset(); ui.answers = {}; toast('Session reset'); } return;
    case 'demo': demo(); return;
  }
});
let armed = 0; function resetArm() { if (Date.now() - armed < 4000) return true; armed = Date.now(); toast('Click “Reset session” again within 4 seconds to clear all work in this session.'); return false; }
let saveT = {}; const later = (key, fn) => { clearTimeout(saveT[key]); saveT[key] = setTimeout(fn, 600); };
app.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.bc) { const [k, id] = el.dataset.bc.split('|'); later(el.dataset.bc, () => setTeam(k, { because: { [id]: el.value } })); return; }
  if (el.dataset.ans) { ui.answers[el.dataset.ans] = el.value; return; }
  if (el.dataset.ag) { later('ag', () => setTeam('E', { agenda: { opening: el.value } })); const p = app.querySelector('[data-act="ag-pub"]'); if (p) p.disabled = !(TK.every(k => T('E').agenda.order.includes(k)) && el.value.trim().length >= 10); return; }
  if (el.dataset.answer) { later('ans' + el.dataset.answer, () => setBoard({ answers: { [el.dataset.answer]: el.value } })); return; }
  if (el.dataset.cf === 'what') { ui.conn.what = el.value; return; }
});
app.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.act === 'labels') { ui.labels = el.checked; render(true); return; }
  if (el.dataset.cf) { ui.conn[el.dataset.cf] = el.value; return; }
  if (el.dataset.prop) { const k = curTeam(); const t = T(k); const wf = (t.wf || []).map(x => x.id === ui.sel ? { ...x, [el.dataset.prop]: el.value } : x); setTeam(k, { wf }); setTimeout(() => render(true), 0); return; }
});
app.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset.ans) { const [k, q] = e.target.dataset.ans.split('-'); app.querySelector(`[data-act="check"][data-k="${k}"][data-q="${q}"]`)?.click(); return; }
  if (e.key === 'Enter' && e.target.id === 'code') { app.querySelector('[data-act="join"]').click(); return; }
  if (e.key === 'Enter' && e.target.id === 'pin') { app.querySelector('[data-act="pin"]').click(); return; }
  const k = curTeam(); if (!k || !ui.sel || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const t = T(k); if (t.lockedAt) return; const s = (t.wf || []).find(x => x.id === ui.sel); if (!s) return;
  const mv = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[e.key];
  if (mv) { e.preventDefault(); setTeam(k, { wf: t.wf.map(x => x.id === s.id ? { ...x, x: clamp(x.x + mv[0], 0, 360 - x.w), y: clamp(x.y + mv[1], 0, 640 - x.h) } : x) }); render(true); }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); app.querySelector('[data-act="del"]')?.click(); }
});
function bindPhone(k) {
  const ph = document.getElementById('phone'); if (!ph) return;
  ph.addEventListener('pointerdown', e => {
    const node = e.target.closest('[data-el]'); const t = T(k);
    if (!node) { if (ui.sel) { ui.sel = null; render(true); } return; }
    const el = { ...(t.wf || []).find(x => x.id === node.dataset.el) }; if (!el.id) return;
    const resize = !!e.target.closest('[data-rh]');
    if (ui.sel !== el.id) { ui.sel = el.id; render(true); return; }
    e.preventDefault(); const sx = e.clientX, sy = e.clientY, o = { ...el };
    const move = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (resize) { el.w = clamp(snap(o.w + dx), 24, 360 - el.x); el.h = clamp(snap(o.h + dy), 8, 640 - el.y); }
      else { el.x = clamp(snap(o.x + dx), 0, 360 - el.w); el.y = clamp(snap(o.y + dy), 0, 640 - el.h); }
      Object.assign(node.style, { left: el.x + 'px', top: el.y + 'px', width: el.w + 'px', height: el.h + 'px' });
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); setTeam(k, { wf: T(k).wf.map(x => x.id === el.id ? el : x) }); render(true); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  });
}

document.getElementById('bar').addEventListener('click', e => {
  const a = e.target.closest('[data-bar]'); if (!a) return; e.preventDefault();
  if (a.dataset.bar === 'leave') { localStorage.removeItem('nw9:last'); location.href = location.pathname; }
});

/* ---------------- ticking: countdown + failure detection ---------------- */
setInterval(() => {
  document.querySelectorAll('[data-count]').forEach(n => { const d = deadline(); if (!d) return; const left = (d - Date.now()) / 1000; n.innerHTML = left > 0 ? `Submit in <b>${mmss(left)}</b>` : '<b>Time’s up</b>'; n.classList.toggle('bad', left < 300); n.classList.toggle('warn', left >= 300 && left < 600); });
  if (!SESSION) return;
  const st = boardState(); const r = route();
  if (st === 'failed' && !B().failedAt && (r.v === 'board' || (r.v === 'observer' && ui.pinOk))) setBoard({ failedAt: Date.now() });
  if (st !== ui.lastState) { ui.lastState = st; render(); }
}, 1000);

/* ---------------- sample data (test mode only) ---------------- */
function demo() {
  const W = {
    A: [['card', 'Velvet cushion #NW-1042 · Aisle 14 · Bay 3', 16, 72, 'A3'], ['search', 'Scan or search item', 16, 184, 'A4'], ['chips', 'Collect in 2h,Home delivery', 16, 256, 'A1'], ['list', 'Suggested reorders (live sales)', 16, 304, 'A2']],
    B: [['card', '#NW-1042 · Velvet cushion · Failed', 16, 72, ''], ['segmented', 'Home delivery,Pick-up point', 30, 184, 'B1'], ['list', 'Spar, Bold Street · 0.3 mi', 16, 240, 'B2'], ['switch', 'Text me when it arrives', 16, 416, 'B3']],
    C: [['tabs', 'Orders,Deliveries,Messages', 0, 64, 'C4'], ['card', 'Jane Smith · #NW-1042 · Failed', 16, 120, ''], ['badge', 'At risk', 296, 128, 'C1'], ['list', 'Order · call · email · delivery', 16, 232, 'C2'], ['chips', 'AI reply drafted,Needs a person', 16, 408, 'C3']],
    D: [['card', 'AI drafted 42 replies — review 3 flagged', 16, 72, 'D1'], ['dialog', 'Your decision: styling advice for #NW-1042', 30, 184, 'D4'], ['progress', 'Styling skills', 30, 384, 'D3'], ['button', 'Ask my mentor', 100, 416, 'D2']],
    E: [['card', 'Failed today: 18% incl. #NW-1042', 16, 72, ''], ['card', 'ERP fit: 40% of processes change', 16, 184, 'E1'], ['progress', 'Lock-in: 7 years', 30, 296, 'E4'], ['card', 'Styling requests — no adviser yet', 16, 328, 'E3']]
  };
  TK.forEach(k => {
    const qset = ensureQset(k); const solved = {}; qset.forEach(i => solved[i] = true);
    const wf = [...frame(k), ...W[k].map((r, i) => { const d = CDEF[r[0]]; return { id: k + 'd' + i, type: r[0], text: r[1], x: r[2], y: r[3], w: d.w, h: d.h, fact: r[4] }; })];
    const picked = [...new Set(W[k].map(r => r[4]).filter(Boolean))]; const because = {}; picked.forEach(id => because[id] = 'This matters because another team’s screen depends on it.');
    setTeam(k, { qset, solved, picked, because, wf, lockedAt: Date.now() });
  });
  setTeam('E', { agenda: { order: ['A', 'B', 'C', 'D', 'E'], opening: 'We are here to turn five screens into one Northway system, and then decide two questions.', publishedAt: Date.now() } });
  toast('Sample work added for all five teams.');
}

/* ---------------- start ---------------- */
async function startSession(code) {
  SESSION = code; localStorage.setItem('nw9:last', code);
  const u = new URL(location.href); u.searchParams.set('s', code); history.replaceState(null, '', u);
  if (CFG.firebase) {
    try { MODE = 'cloud'; DB = Cloud; await Cloud.init(code, CFG.firebase); }
    catch (e) { console.error(e); MODE = 'test'; DB = Local; Local.init(code); toast('Could not reach the database — running in test mode.', 6000); }
  } else { MODE = 'test'; DB = Local; Local.init(code); }
  render(true);
}
(function boot() {
  const s = new URL(location.href).searchParams.get('s') || localStorage.getItem('nw9:last');
  if (s) startSession(s.toUpperCase()); else render(true);
})();
