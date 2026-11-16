/* Seminar 9 · Northway Home board meeting — application
   Data: Firebase Firestore (when config.js has a firebase config) or this browser only (test mode). */
const APP_VERSION = 'S9-1116-1045';
if (!window.CONTENT || window.CONTENT.VERSION !== APP_VERSION || !window.CONTENT.TEAMS.F) {
  document.getElementById('app').innerHTML = `<div class="wrap narrow"><div class="panel" style="border:2px solid #A8322A"><h2>The site files are out of step</h2>
    <p>This page needs <b>index.html</b>, <b>app.js</b> and <b>content.js</b> from the same update (version <b>${APP_VERSION}</b>), but content.js is version <b>${(window.CONTENT && window.CONTENT.VERSION) || 'unknown (older)'}</b>.</p>
    <p>Upload all three files together to the <b>seminar9</b> folder, wait 1–2 minutes and reload with Ctrl+Shift+R.</p></div></div>`;
  throw new Error('Version mismatch: app ' + APP_VERSION + ' / content ' + (window.CONTENT && window.CONTENT.VERSION));
}
const { TEAMS, NAV, STATUS, DECISIONS } = window.CONTENT;
const CFG = window.SEMINAR_CONFIG || {};
const TK = ['A', 'B', 'C', 'D', 'E', 'F'];
const STUDENTS = ['A', 'B', 'C', 'D', 'E'];
const drawOf = k => TEAMS[k].draw || [1, 3];
const pickOf = k => TEAMS[k].pick || [4, 4];
const nq = k => drawOf(k)[0] + drawOf(k)[1];
const pickTxt = k => { const [a, b] = pickOf(k); return a === b ? String(a) : `${a}–${b}`; };
const PHASES = [[0, 13, 'Read your text'], [13, 18, 'Check questions'], [18, 33, 'Choose your facts'], [33, 58, 'Build your wireframe screen'], [58, 60, 'Submit']];
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
  const L = ids.length, cand = Array.from({ length: L }, (_, i) => i), span = Math.min(5, L - 2);
  let slots; do { slots = sh(cand).slice(0, good.length).sort((x, y) => x - y); }
  while (slots.some((v, i) => i && v - slots[i - 1] < 2) || slots[slots.length - 1] - slots[0] < span);
  const g = sh(good), o = sh(rest); const seq = [];
  for (let i = 0; i < ids.length; i++) seq.push(slots.includes(i) ? g.shift() : o.shift());
  TEAMS[k].seq = seq;
});
function endFix() { const f = ui.fixK; if (!f) return; if (JSON.stringify([T(f).wf, T(f).picked]) !== ui.fixSnap) setTeam(f, { corrected: Date.now() }); ui.fixK = null; ui.sel = null; }
function newEl(wf, type, text, fact) {
  const d = CDEF[type]; const others = wf.filter(el => el.type !== 'navbar'); const bottom = others.reduce((m, el) => Math.max(m, el.y + el.h), 0);
  let y = null; for (let yy = 72; yy + d.h <= 560; yy += 8) if (!others.some(o => yy < o.y + o.h + 8 && yy + d.h + 8 > o.y)) { y = yy; break; }
  if (y === null) y = Math.max(0, Math.min(568 - d.h, bottom + 8));
  const el = { id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type, x: Math.max(0, snap((360 - d.w) / 2)), y, w: d.w, h: d.h, text, fact };
  if (type === 'navbar') el.y = 640 - d.h; return el;
}
const usedBy = (k, cls = '') => `<div class="usedby ${cls}" style="--c:${col(k)}"><b>Used by:</b> ${esc(TEAMS[k].user[0])} — ${esc(TEAMS[k].user[1])}</div>`;
const factNo = id => TEAMS[FACT[id].team].seq.indexOf(id) + 1;

/* ---------------- state ---------------- */
let S = { teams: {}, board: {} };
const TD = () => ({ qset: null, solved: {}, tries: {}, override: false, picked: [], because: {}, wf: null, lockedAt: null, agenda: { order: [], opening: '', publishedAt: null } });
const BD = () => ({ clock: null, extension: 0, failedAt: null, meeting: null, stage: 'present', spot: null, showRef: false, connections: [], answers: { 1: '', 2: '' } });
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
    { ok: wf.some(e => e.type === 'navbar'), label: 'Navigation bar: ' + TK.map(x => NAV[x]).join(' · ') },
    { ok: /nw-?1042/.test(txt), label: 'Order #NW-1042 shown on your wireframe screen' }
  ];
  return { items, rules };
}
function submitChecks(k) {
  const t = T(k), n = t.picked.length, { items, rules } = buildItems(k);
  return [
    [n >= pickOf(k)[0] && n <= pickOf(k)[1], `${pickTxt(k)} facts chosen (${n})`],
    [n > 0 && t.picked.every(id => (t.because[id] || '').trim().length >= 10), 'Every fact has a “This matters because…” sentence'],
    [n > 0 && items.every(i => i.ok), 'Every chosen fact is on your wireframe screen as its component'],
    [rules.every(r => r.ok), 'Northway system rules followed']
  ];
}
function missingOf(k) {
  const t = T(k); if (t.lockedAt) return '';
  if (!unlocked(k)) return 'check questions';
  if (t.picked.length < pickOf(k)[0]) return 'facts';
  const c = submitChecks(k); if (!c[2][0] || !c[3][0]) return 'wireframe screen';
  return 'not submitted';
}
function parts() {
  const p = TK.map(k => ({ k, label: 'Team ' + k, part: TEAMS[k].short, ok: !!T(k).lockedAt, miss: missingOf(k) }));
  const ag = T('F').agenda; p.push({ k: 'agenda', label: 'Agenda', part: 'the agenda', ok: !!ag.publishedAt, miss: 'not published' });
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
  if (!unlocked(k)) { const n = (t.qset || []).filter(i => t.solved[i]).length; return [t.qset ? `Check questions ${n}/${nq(k)}` : 'Reading', '']; }
  if ((t.wf || []).length > 2) return ['Building wireframe screen', 'warn'];
  return [`Choosing facts (${t.picked.length})`, 'warn'];
}

/* ---------------- value chain ---------------- */
function vcHTML({ size = '', hi = [], fill = null, bad = [] } = {}) {
  const box = k => `<div class="vc-box ${hi.includes(k) ? 'hi' : ''} ${bad.includes(k) ? 'bad' : ''}" style="color:${col(k)}"><div class="nm">${k} · ${esc(TEAMS[k].short)}</div>${fill ? `<div class="fill">${fill(k)}</div>` : ''}</div>`;
  return `<div class="vc ${size}"><div class="vc-side">Support activities</div><div class="vc-arrow">
    <div class="vc-support">${box('F')}${box('D')}${box('E')}</div><div class="vc-side" style="margin:0">Primary activities</div>
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
  return `<div class="phone-out" style="width:${360 * scale + 4}px;height:${640 * scale + 4}px"><div class="phone ${edit ? 'edit' : 'view'}" ${edit ? 'id="phone"' : ''} style="transform:scale(${scale})">${els}${!wf.length ? '<div class="empty">No wireframe screen yet</div>' : ''}</div></div>`;
}
const refEls = k => [...frame(k), ...(TEAMS[k].ref || []).map((r, i) => { const d = CDEF[r[0]]; return { id: k + 'r' + i, type: r[0], text: r[1], x: r[2], y: r[3], w: d.w, h: d.h, fact: r[4] }; })];
function refPhoneHTML(k, scale = 1) {
  const els = refEls(k).map(e => `<div class="el" style="left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px">${comp(e)}<span class="lbl ${e.fact ? 'f' : ''} ${e.y < 16 ? 'in' : ''}">${esc(CDEF[e.type].name)}${e.fact ? ' · fact ' + factNo(e.fact) : ''}</span></div>`).join('');
  return `<div class="phone-out" style="width:${360 * scale + 4}px;height:${640 * scale + 4}px"><div class="phone view ref" style="transform:scale(${scale})">${els}</div></div>`;
}
function fixHTML(k) {
  const t = T(k), wf = t.wf || [], sel = wf.find(e => e.id === ui.sel);
  const facts = [...TEAMS[k].facts].sort((a, b) => factNo(a.id) - factNo(b.id));
  const onScreen = id => wf.some(e => e.fact === id);
  return `<div class="banner fixbar"><span><b>Correcting Team ${k}’s wireframe screen.</b> Every change is saved and shown on this screen. Choose the right facts, add their components, remove wrong ones, then move on.</span><button class="btn pri" data-act="fix-done">Done correcting</button></div>
   <div class="fixgrid">
    <div class="panel"><h3>Team ${k}’s facts</h3><p class="small muted">✓ = chosen by the team (or by you). Click to choose or unchoose.</p>
     ${facts.map(f => { const p = t.picked.includes(f.id); return `<div class="ffix ${p ? 'on' : ''}"><button class="fchk" data-act="fix-pick" data-k="${k}" data-id="${f.id}" aria-label="Choose fact ${factNo(f.id)}">${p ? '✓' : ''}</button><div><b>${factNo(f.id)}.</b> ${esc(f.text)}<div class="small muted">→ ${esc(f.screen.split(' — ')[0])}</div>${p && !onScreen(f.id) ? `<button class="btn sm" data-act="fix-add" data-k="${k}" data-id="${f.id}">Add ${esc(f.screen.split(' — ')[0])}</button>` : ''}</div></div>`; }).join('')}</div>
    <div><p class="small muted cap">Team ${k}’s wireframe screen — drag to move</p>${phoneHTML(k, { edit: true, labels: true, sel: ui.sel, scale: .85 })}
     <div class="row" style="margin-top:8px"><select class="inp" id="fixtype">${COMP.map(([g, cs]) => `<optgroup label="${esc(g)}">${cs.map(c => `<option value="${c[0]}">${esc(c[1])}</option>`).join('')}</optgroup>`).join('')}</select><button class="btn sm" data-act="fix-addtype" data-k="${k}">Add component</button></div>
     ${sel && !/topappbar|navbar/.test(sel.type) ? `<div class="panel ins" style="margin-top:8px"><h3>${esc(CDEF[sel.type].name)}</h3>
      <label>Text on the component<input class="inp" data-prop="text" value="${esc(sel.text || '')}"></label>
      <label>Which fact does it show?<select class="inp" data-prop="fact"><option value="">— none —</option>${t.picked.map(id => `<option value="${id}" ${sel.fact === id ? 'selected' : ''}>Fact ${factNo(id)}: ${esc(FACT[id].text.slice(0, 50))}…</option>`).join('')}</select></label>
      <div class="row"><button class="btn sm danger" data-act="fix-rm" data-k="${k}" data-el="${sel.id}">Delete component</button></div></div>` : '<p class="small muted" style="margin-top:8px">Click a component to change its text or fact.</p>'}</div>
    <div><p class="small muted cap">Reference wireframe screen</p>${refPhoneHTML(k, .6)}${compareHTML(k, true)}</div>
   </div>`;
}
function compareHTML(k, fix = false) {
  const t = T(k), wf = t.wf || [];
  const shown = new Set(wf.filter(e => e.fact && FACT[e.fact] && FACT[e.fact].comp.includes(e.type)).map(e => e.fact));
  const keys = TEAMS[k].facts.filter(f => f.kind === 'key');
  const missing = keys.filter(f => !shown.has(f.id));
  const KL = { false: 'a wrong lesson from the case', mis: 'a misleading fact', dis: 'an irrelevant fact' };
  const extra = wf.filter(e => e.fact && FACT[e.fact] && FACT[e.fact].kind !== 'key');
  const noOrder = !/nw-?1042/i.test(wf.map(e => e.text || '').join(' '));
  const items = [
    ...missing.map(f => `<li class="miss">Missing: <b>${esc(f.screen.split(' — ')[0])}</b> — ${esc(f.screen.split(' — ').slice(1).join(' — '))}${fix ? ` <button class="btn sm pri" data-act="fix-add" data-k="${k}" data-id="${f.id}">Add it</button>` : ''}</li>`),
    ...extra.map(e => `<li class="diff">Different: <b>${esc(CDEF[e.type].name)}</b> comes from ${KL[FACT[e.fact].kind]} (fact ${factNo(e.fact)})${fix ? ` <button class="btn sm danger" data-act="fix-rm" data-k="${k}" data-el="${e.id}">Remove it</button>` : ''}</li>`),
    ...(noOrder ? [`<li class="miss">Missing: order <b>#NW-1042</b> on the screen${fix ? ' — select a component and type it into its text' : ''}</li>`] : [])];
  return `<div class="cmp"><h3>Compared with the reference</h3>${items.length ? `<ul>${items.join('')}</ul>` : '<p class="okline">✓ Every reference component is there.</p>'}</div>`;
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
  return `<div class="ready ${big ? 'big' : ''}"><div class="ready-h"><b>Board meeting readiness</b><span>${n} of ${p.length} parts ready</span>${countHTML(big)}</div>
   <div class="ready-parts">${p.map(x => `<span class="rp ${x.ok ? 'ok' : 'no'}" ${x.k !== 'agenda' ? `style="--c:${col(x.k)}"` : ''}>${esc(x.label)} ${x.ok ? '✓' : `<i>— ${esc(x.miss)}</i>`}</span>`).join('')}</div></div>`;
}

/* ---------------- routing & rendering ---------------- */
let ui = { tab: {}, sel: null, answers: {}, labels: true, pinOk: localStorage.getItem('nw9tutor') === '1', lastState: null, csel: null, cto: null, cedit: null, clabel: '', fixK: null, fixSnap: '' };
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
  document.getElementById('bar').innerHTML = `<span><b>Northway Home</b> · Seminar 9</span>${tl}<span>Session <b>${esc(SESSION)}</b>${MODE === 'test' ? ' · <span class="testtag">TEST MODE — this browser only</span>' : ''} · <span style="opacity:.6">${APP_VERSION}</span></span>`;
  if (r.v === 'team' && TEAMS[r.k]) { app.innerHTML = teamView(r.k); bindPhone(r.k); }
  else if (r.v === 'board') { app.innerHTML = boardView(); if (ui.fixK && ui.pinOk) bindPhone(ui.fixK); }
  else if (r.v === 'observer') app.innerHTML = ui.pinOk ? observerView() : pinView();
  else app.innerHTML = homeView();
  requestAnimationFrame(drawConnMap);
}

/* ---------------- join / home ---------------- */
function joinView() {
  return `<div class="wrap narrow"><h1>Northway Home · board meeting</h1><p class="muted">Seminar 9 · Enterprise systems and the value chain</p>
   <div class="panel"><h2>Enter the session code</h2><p class="muted">Your tutor shows it on the class screen.</p>
   <div class="row"><input id="code" class="inp" placeholder="e.g. NW9" maxlength="16" autocomplete="off"><button class="btn pri" data-act="join">Join</button></div></div></div>`;
}
function homeView() {
  return `<div class="wrap"><h1>Choose your department</h1><p class="muted">Each department designs one wireframe screen of Northway’s new system. At the board meeting the six wireframe screens (five teams + Management) must work as one.</p>
   ${vcHTML({ size: 'big', fill: k => k === 'F' ? `<a class="btn sm" href="#team/F">Tutor’s demo team →</a>` : `<a class="btn sm" href="#team/${k}">Join Team ${k} →</a>` })}
</div>`;
}

/* ---------------- team view ---------------- */
function teamView(k) {
  const Tm = TEAMS[k], t = T(k), un = unlocked(k);
  let tab = ui.tab[k] || 'brief';
  const tabs = [['brief', '1 · Brief'], ['check', '2 · Check questions'], ['facts', '3 · Facts' + (un ? '' : ' 🔒')], ['build', '4 · Build your wireframe screen' + (un ? '' : ' 🔒')], ['submit', '5 · Submit' + (un ? '' : ' 🔒')]];
  if (k === 'F') tabs.push(['agenda', '★ Agenda']);
  let body;
  if (tab === 'brief') body = briefTab(k);
  else if (tab === 'check') body = checkTab(k);
  else if (tab === 'agenda') body = agendaTab();
  else if (!un) body = `<div class="banner lock">🔒 This step opens when all check questions are answered correctly.</div>`;
  else if (tab === 'facts') body = factsTab(k);
  else if (tab === 'build') body = buildTab(k);
  else body = submitTab(k);
  const ph = phaseNow();
  return `<div class="wrap">
   <div class="thead"><div><div class="teamchip" style="color:${col(k)}"><span class="dot" style="background:${col(k)}"></span>Team ${k} · ${esc(Tm.vc)}</div><h1>${esc(Tm.name)}</h1>${usedBy(k)}</div>
    <div class="phase">${ph ? `Suggested now: <b>${esc(ph)}</b>` : ''}</div></div>
   ${readyBar()}
   ${t.lockedAt ? `<div class="banner ok">✓ Submitted at ${fmt(t.lockedAt)}. Your wireframe screen is ready for the board meeting.</div>` : ''}
   <div class="tabs">${tabs.map(([id, l]) => `<button class="${tab === id ? 'on' : ''}" data-act="tab" data-k="${k}" data-tab="${id}">${l}</button>`).join('')}</div>
   ${body}</div>`;
}
function briefTab(k) {
  const Tm = TEAMS[k];
  return `<div class="grid2"><div class="panel">
    <div class="banner warn" style="margin-bottom:10px"><b>Northway</b> is the company you design for. The case you read (${k === 'D' ? 'Alibaba/Cainiao and the HBR article' : 'Alibaba/Cainiao'}) is only an <b>example</b> of how others solved similar problems: read it, answer the check questions, and keep it in mind for ideas.</div>
    <h2>Your role</h2><p>${esc(Tm.role)}</p>
    <h2 style="margin-top:14px">Your wireframe screen</h2><p>${esc(Tm.screen)}</p><p class="small muted">One wireframe screen = a single phone screen of <b>Northway’s new integrated ERP system</b>, drawn in this system’s wireframe tool (step 4). Every screen is used by Northway staff.</p>
    <h2 style="margin-top:14px">Four steps — submit within 60 minutes</h2>
    <ol class="steps"><li><b>Read</b> your printed pack: ${esc(Tm.read)}.</li>
     <li><b>Check questions</b> — get all ${nq(k)} right to unlock your facts.</li>
     <li><b>Choose ${pickTxt(k)} facts</b> out of ${Tm.facts.length}. Ask: <i>${esc(Tm.test)}</i></li>
     <li><b>Build your wireframe screen</b> — add the Material 3 component named under each chosen fact. Then submit.</li></ol>
    ${k === 'F' ? `<div class="banner warn"><b>Demo team.</b> Your tutor shows every step with this team, builds the agenda (★ Agenda tab) and chairs the board meeting as Management.</div>` : ''}
    <p><button class="btn pri" data-act="tab" data-k="${k}" data-tab="check">We have read the text → check questions</button></p></div>
   <div><div class="panel"><h3>Where you sit in the value chain</h3>${vcHTML({ size: 'mini', hi: [k] })}</div>
    ${rulesBox(k)}</div></div>`;
}
function rulesBox(k) {
  return `<div class="panel rules"><h3>Northway system rules <span class="muted small">— the same for every team</span></h3>
   <ul><li>Your wireframe screen starts with the <b>Northway frame</b>: Top app bar and Navigation bar (${TK.map(x => x === k ? `<b>${NAV[x]}</b>` : NAV[x]).join(' · ')}). Keep it.</li>
   <li>Show order <b>#NW-1042</b> — Jane Smith, Velvet cushion. On your wireframe screen: ${esc(TEAMS[k].order)}</li>
   <li>Status words: ${STATUS.join(' · ')}.</li></ul></div>`;
}
function ensureQset(k) {
  const t = T(k); if (t.qset) return t.qset;
  const qs = TEAMS[k].qs; const core = [], team = [];
  qs.forEach((q, i) => (q.pool === 'core' ? core : team).push(i));
  const pick = (a, n) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).slice(0, n).map(x => x[1]);
  const [nc, nt] = drawOf(k); const qset = [...pick(core, nc), ...pick(team, nt)];
  setTeam(k, { qset }); return qset;
}
function checkTab(k) {
  const t = T(k); const qset = ensureQset(k); const all = unlocked(k);
  return `${all ? `<div class="banner ok">✓ ${t.override && !qset.every(i => t.solved[i]) ? 'Your tutor unlocked your facts.' : 'All correct — your facts are unlocked.'} <button class="btn sm" data-act="tab" data-k="${k}" data-tab="facts">Go to facts →</button></div>`
      : `<p class="muted">Answer with a word or number from your <b>printed text</b>. Try as many times as you need.</p>`}
   ${qset.map((qi, n) => {
    const q = TEAMS[k].qs[qi]; const s = t.solved[qi]; const tries = t.tries[qi] || 0;
    return `<div class="q ${s ? 'solved' : ''}"><div class="where">${esc(q.where)}</div><p><b>${n + 1}.</b> ${esc(q.q)}</p>
     ${s ? '<span class="tag ok">✓ Correct</span>' : `<div class="row"><input class="inp" data-ans="${k}-${qi}" value="${esc(ui.answers[k + '-' + qi] || '')}" placeholder="Your answer" autocomplete="off"><button class="btn pri" data-act="check" data-k="${k}" data-q="${qi}">Check</button>${tries ? `<span class="tag bad">Not yet — ${tries} ${tries > 1 ? 'tries' : 'try'}</span>` : ''}</div>${tries >= 3 ? `<div class="hint">Hint: ${esc(q.hint)}</div>` : ''}`}</div>`;
  }).join('')}`;
}
function factsTab(k) {
  const Tm = TEAMS[k], t = T(k), locked = !!t.lockedAt, n = t.picked.length;
  return `<div class="panel explain"><h3>What the facts are for</h3>
    <p>Northway is replacing its separate systems with <b>one integrated ERP system</b> that all departments share: one company, one database. Each department designs the wireframe screen its own staff will use, and the facts below describe <b>how Northway works today</b> in your area. By choosing the right facts and turning each one into a component, your team decides what the new system must do for your department. At the board meeting your screen must connect with the other five, so that one order, <b>#NW-1042</b>, can be followed from the warehouse to the customer.</p>
    <p>Your task: translate the right facts into the wireframe screen your department (${esc(Tm.short.toLowerCase())}) will use — the screen of the <b>${esc(Tm.user[0].toLowerCase())}</b>, who ${esc(Tm.user[1])}.</p>
    <p>Every fact comes with a <b>wireframe instruction</b>: the Material 3 component to add and exactly what it must show. Choose the ${pickTxt(k)} facts whose component helps the person using your screen: <i>${esc(Tm.test)}</i>
    Leave facts that add nothing — and the one that draws a <b>wrong lesson from the case</b>.</p>
    <p class="small">Keep the case you read in mind: it shows how another company solved similar problems. It is an example, not your company.</p>
    <p class="small">What each component looks like: <a href="https://m3.material.io/components" target="_blank" rel="noopener">m3.material.io/components</a></p></div>
   <div class="banner ${n >= pickOf(k)[0] && n <= pickOf(k)[1] ? 'ok' : 'warn'}"><b>${n} of ${pickTxt(k)} chosen.</b></div>
   <div class="facts">${Tm.seq.map((id, i) => {
    const f = FACT[id]; const on = t.picked.includes(id); const [name, ...rest] = f.screen.split(' — ');
    return `<button class="fact ${on ? 'on' : ''}" data-act="pick" data-k="${k}" data-id="${id}" ${locked ? 'disabled' : ''}><span class="n">${i + 1}</span><span><span class="ft">${esc(f.text)}</span><span class="os">Wireframe instruction: <b>${esc(name)}</b> — ${esc(rest.join(' — '))}</span></span></button>`;
  }).join('')}</div>
   ${n ? `<h2 style="margin-top:20px">Why these facts matter</h2>${t.picked.map(id => `<div class="because"><b>Fact ${factNo(id)}.</b> ${esc(FACT[id].text)}<textarea data-bc="${k}|${id}" placeholder="This matters because…" ${locked ? 'disabled' : ''}>${esc(t.because[id] || '')}</textarea></div>`).join('')}
     <p><button class="btn pri" data-act="tab" data-k="${k}" data-tab="build">Build your wireframe screen →</button></p>` : ''}`;
}
function buildTab(k) {
  const Tm = TEAMS[k], t = T(k), locked = !!t.lockedAt;
  if (!t.wf || !t.wf.length) { setTeam(k, { wf: frame(k) }); }
  const wf = T(k).wf || []; const sel = wf.find(e => e.id === ui.sel); const { items, rules } = buildItems(k);
  return `<p><b>Build:</b> ${esc(Tm.screen)} The person using it: <b>${esc(Tm.user[0].toLowerCase())}</b>.</p>
   <div class="wfb">
    <div class="pal">${locked ? '<p class="small muted">Submitted — editing is closed.</p>' : COMP.map(([g, cs]) => `<div class="grp">${g}</div>${cs.map(c => `<button data-act="add" data-k="${k}" data-type="${c[0]}">${c[1]}</button>`).join('')}`).join('')}</div>
    <div>${phoneHTML(k, { edit: !locked, labels: ui.labels, sel: ui.sel })}<label class="small row" style="margin-top:8px;gap:6px"><input type="checkbox" data-act="labels" ${ui.labels ? 'checked' : ''}> Show Material 3 names</label></div>
    <div class="ins">
     <div class="panel"><h3>Build list — one component per chosen fact</h3>
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
  const others = STUDENTS.filter(x => x !== k && T(x).lockedAt).length;
  return `${!t.lockedAt && others >= 2 ? `<div class="banner bad">Your team is blocking the board meeting — ${others} other team${others > 1 ? 's have' : ' has'} already submitted.</div>` : ''}
   <div class="grid2"><div class="panel"><h2>Ready to submit?</h2><ul class="reqs">${c.map(([o, l]) => `<li class="${o ? 'ok' : ''}"><span>${esc(l)}</span></li>`).join('')}</ul>
    <p style="margin-top:14px">${t.lockedAt ? `<span class="tag ok">Submitted at ${fmt(t.lockedAt)}</span>` : `<button class="btn pri" data-act="lock" data-k="${k}" ${ok ? '' : 'disabled'}>Submit to the board</button>`}</p>
    <p class="small muted">After submitting, nothing can be changed.</p></div>
   <div class="panel"><h2>At the board meeting you present</h2>
    <p><b>Speaker 1 — your wireframe screen (1 minute)</b></p><ol class="steps"><li>Who uses this wireframe screen and what they do with it.</li><li>Point to each component: its Material 3 name and the fact it comes from.</li><li>One thing your wireframe screen <b>needs from</b> another wireframe screen, and one thing it <b>sends to</b> one.</li></ol>
    ${k === 'F' ? `<p><b>Chair (your tutor)</b><br>Presents the dashboard last, connects the system with the board and asks the two original questions.</p>` : `<p><b>Speaker 2 — the original question</b><br>${k === 'D' || k === 'C' ? `<b>${DECISIONS[2].t}:</b> ${esc(DECISIONS[2].d)}` : `<b>${DECISIONS[1].t}</b> ${esc(DECISIONS[1].d)}`} One or two sentences, backed by one of your facts.</p>`}</div></div>`;
}
function agendaTab() {
  const a = T('F').agenda; const pub = !!a.publishedAt; const missing = TK.filter(k => !a.order.includes(k));
  const can = !missing.length && (a.opening || '').trim().length >= 10;
  return `<div class="grid2"><div class="panel"><h2>Board meeting agenda</h2>
   <p class="muted small">You chair the meeting (20 minutes): each team presents its wireframe screen (about 1 minute), then the board connects the wireframe screens into one system, then answers the two original questions. Build this agenda during the demo, so students see it.</p>
   <h3>1. Order of presentations</h3>
   ${a.order.map((k, i) => `<div class="slot"><span class="num">${i + 1}</span><span class="dot" style="background:${col(k)}"></span><span style="flex:1"><b>Team ${k}</b> · ${esc(TEAMS[k].name)}</span>${pub ? '' : `<button class="btn sm" data-act="ag-mv" data-i="${i}" data-d="-1">↑</button><button class="btn sm" data-act="ag-mv" data-i="${i}" data-d="1">↓</button><button class="btn sm danger" data-act="ag-rm" data-i="${i}">✕</button>`}</div>`).join('') || '<p class="muted small">No teams yet.</p>'}
   ${pub ? '' : `<div class="row">${missing.map(k => `<button class="btn sm" data-act="ag-add" data-k="${k}">+ Team ${k}</button>`).join('')}</div>`}
   <h3 style="margin-top:14px">2. Your opening statement (2–3 sentences)</h3>
   <textarea class="inp" data-ag="opening" rows="4" ${pub ? 'disabled' : ''} placeholder="Why are we meeting, and what must we decide today?">${esc(a.opening)}</textarea>
   <p style="margin-top:12px">${pub ? `<span class="tag ok">Published at ${fmt(a.publishedAt)}</span> <button class="btn sm" data-act="ag-unpub">Edit again</button>` : `<button class="btn pri" data-act="ag-pub" ${can ? '' : 'disabled'}>Publish the agenda</button>`}</p>
   ${!pub && !can ? `<p class="small muted">${missing.length ? `Every team needs a slot (missing: ${missing.join(', ')}). ` : ''}${(a.opening || '').trim().length < 10 ? 'Write the opening statement.' : ''}</p>` : ''}</div>
   <div class="panel"><h3>Chair’s running order</h3><ol class="steps"><li>Open with your statement.</li><li>Call each team in agenda order — 1 minute each. Present the Management dashboard last.</li><li><b>Connect the system:</b> ask the class which part of one wireframe screen passes what to another. On the class screen, click the component on one wireframe screen, then the component it connects to, and type the class’s label. Every department must be connected, and order #NW-1042 must be followed from A to D. Status reaches your dashboard automatically.</li><li><b>The two questions:</b> ask the teams, then type the board’s answers.</li><li>Close with your feedback: what worked as one system, and what was missing.</li></ol></div></div>`;
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
    return `<div class="wrap screen"><div class="sbar"><h1>Northway Home · board meeting</h1>${countHTML(true)}</div><div class="intro">Northway Home is a UK online homeware retailer with 400 staff, one warehouse and three courier firms, but its systems don’t talk to each other: 18% of first deliveries fail and customers are leaving. Today each of six departments designs one wireframe screen of Northway’s new integrated ERP system, and after 60 minutes the board meets to check that the six screens work as one system and to answer two questions: should Northway fit the software or redesign itself, and what happens to junior employees?</div>${head}${readyBar(true)}
     ${vcHTML({ size: 'big', bad: st === 'failed' ? badTeams : [], fill: k => { const [s, c] = teamStatus(k); const m = missingOf(k); return `<span class="tag ${c}">${s}</span>${m && m !== 'not submitted' ? `<div class="small missing">missing: ${esc(m)}</div>` : ''}`; } })}
     ${st === 'waiting' ? `<p class="center muted" style="margin-top:16px">The board meeting can start only when all ${parts().length} parts are ready.${b.clock ? '' : ' (Clock not started.)'}</p>` : ''}</div>`;
  }
  const stages = [['present', '1 · Presentations'], ['connect', '2 · Connect the system'], ['questions', '3 · The two questions'], ['summary', 'Summary']];
  let body = '';
  if (b.stage === 'present') body = presentStage();
  else if (b.stage === 'connect') body = connectStage();
  else if (b.stage === 'questions') body = questionsStage();
  else body = summaryStage();
  return `<div class="wrap screen wide"><div class="sbar"><div class="tabs flat">${stages.map(([id, l]) => `<button class="${b.stage === id ? 'on' : ''}" data-act="stage" data-s="${id}">${l}</button>`).join('')}</div>${b.meeting.forced ? '<span class="tag warn">Started by the tutor — not all parts were ready</span>' : ''}</div>${body}</div>`;
}
const agendaOrder = () => { const a = T('F').agenda; return a.publishedAt && a.order.length === TK.length ? a.order : TK; };
function presentStage() {
  const ord = agendaOrder(); const b = B(); const k = ord.includes(b.spot) ? b.spot : ord[0]; const i = ord.indexOf(k); const t = T(k); const a = T('F').agenda;
  return `${a.opening ? `<div class="panel" style="margin-bottom:12px"><b>Chair’s opening:</b> ${esc(a.opening)}</div>` : ''}
   <div class="row" style="margin-bottom:12px">${ord.map((x, j) => `<button class="btn sm ${x === k ? 'pri' : ''}" data-act="spot" data-k="${x}">${j + 1}. Team ${x}</button>`).join('')}</div>
   <div class="sbar"><div><div class="teamchip" style="color:${col(k)}"><span class="dot" style="background:${col(k)}"></span>Team ${k} · ${esc(TEAMS[k].vc)}</div><h1>${esc(TEAMS[k].name)}</h1>${usedBy(k, 'big')}</div>
    <div class="row"><button class="btn" data-act="spotnav" data-d="-1" ${i <= 0 ? 'disabled' : ''}>← Previous</button><button class="btn pri" data-act="spotnav" data-d="1" ${i >= ord.length - 1 ? 'disabled' : ''}>Next team →</button></div></div>
   ${t.lockedAt ? '' : '<div class="banner warn">This team did not submit — showing its draft.</div>'}
   ${ui.pinOk && ui.fixK === k ? fixHTML(k) : `<div class="row" style="justify-content:flex-end;margin-bottom:8px">${t.corrected ? '<span class="tag warn">Corrected by the chair</span>' : ''}${ui.pinOk ? `<button class="btn sm" data-act="fix-start" data-k="${k}">✎ Correct this wireframe</button>` : ''}<button class="btn sm ${b.showRef ? 'pri' : ''}" data-act="ref-toggle">${b.showRef ? 'Hide reference wireframe' : 'Show reference wireframe'}</button></div>
   <div class="spot ${b.showRef ? 'withref' : ''}"><div>${t.picked.map(id => `<div class="sfact" style="border-left-color:${col(k)}"><b>Fact ${factNo(id)}.</b> ${esc(FACT[id].text)}<div class="os">→ ${esc(FACT[id].screen.split(' — ')[0])}</div>${t.because[id] ? `<div class="bc">${esc(t.because[id])}</div>` : ''}</div>`).join('') || '<p class="muted">No facts chosen.</p>'}
     ${b.showRef ? compareHTML(k) : ''}</div>
    <div><p class="small muted cap">Team ${k}’s wireframe screen</p>${phoneHTML(k, { scale: b.showRef ? .78 : .9 })}</div>
    ${b.showRef ? `<div><p class="small muted cap">Reference wireframe screen</p>${refPhoneHTML(k, .78)}</div>` : ''}</div>`}`;
}
const MAPPOS = { A: [0, 0], B: [1, 0], C: [2, 0], E: [0, 1], F: [1, 1], D: [2, 1] };
const mapEls = k => (T(k).wf || []).filter(e => e.type !== 'topappbar' && e.type !== 'navbar').sort((a, b) => a.y - b.y || a.x - b.x);
const elTxt = e => { const s = (e.text || '').replace(/\*/g, '').split(',').map(x => x.trim()).filter(Boolean).join(' · '); return s.length > 46 ? s.slice(0, 44) + '…' : s; };
const elName = (k, id) => { const e = (T(k).wf || []).find(x => x.id === id); return e ? `${CDEF[e.type].name}${elTxt(e) ? ' “' + elTxt(e) + '”' : ''}` : 'wireframe screen'; };
function connChecks() {
  const c = B().connections || [];
  const linked = k => c.some(x => x.from === k || x.to === k);
  const feeds = STUDENTS.map(k => [k, !!T(k).lockedAt || c.some(x => x.from === k && x.to === 'F')]);
  const order = TK.map(k => [k, /nw-?1042/i.test((T(k).wf || []).map(e => e.text || '').join(' '))]);
  const prev = { A: null }, q = ['A'];
  while (q.length) { const n = q.shift(); c.filter(x => x.from === n && !(x.to in prev)).forEach(x => { prev[x.to] = n; q.push(x.to); }); }
  let path = null; if ('D' in prev) { path = []; for (let n = 'D'; n; n = prev[n]) path.unshift(n); }
  return { every: STUDENTS.map(k => [k, linked(k)]), feeds, order, path };
}
function checksHTML() {
  const ch = connChecks(); const m = (arr) => arr.map(([k, ok]) => `<span class="tag ${ok ? 'ok' : ''}">${k} ${ok ? '✓' : '—'}</span>`).join(' ');
  return `<div class="checks"><div><b>Every department connected</b><br>${m(ch.every)}</div>
   <div><b>#NW-1042 followed from A to D</b><br>${ch.path ? `<span class="tag ok">${ch.path.join(' → ')} ✓</span>` : '<span class="tag">not yet —</span>'}</div>
   <div><b>Status reaches the dashboard (F)</b><br>${m(ch.feeds)}</div>
   <div><b>#NW-1042 on every wireframe screen</b><br>${m(ch.order)}</div></div>`;
}
function connMapHTML(edit) {
  const c = B().connections || []; const used = new Set(); c.forEach(x => { used.add(x.from + ':' + x.fromEl); used.add(x.to + ':' + x.toEl); });
  const s = ui.csel, t = ui.cto;
  const boxes = Object.entries(MAPPOS).map(([k, [cx, ry]]) => {
    const els = mapEls(k);
    return `<div class="mbox" data-mk="${k}" style="grid-column:${cx + 1};grid-row:${ry + 1};--c:${col(k)}"><div class="mh">${k} · ${esc(TEAMS[k].screenTitle)}</div><div class="mu">Used by: ${esc(TEAMS[k].user[0])}</div>
     ${els.map(e => { const id = k + ':' + e.id; const on = (s && s.k === k && s.id === e.id) || (t && t.k === k && t.id === e.id);
       return `<div class="mc ${used.has(id) ? 'on' : ''} ${on ? 'sel' : ''}" data-mc="${id}" ${edit ? `data-act="cpick" data-k="${k}" data-el="${e.id}" role="button" tabindex="0"` : ''}><i>${esc(CDEF[e.type].name)}</i>${esc(elTxt(e)) || '<span class="muted">(no text)</span>'}</div>`; }).join('') || '<p class="small muted">No wireframe screen yet</p>'}</div>`;
  }).join('');
  const pills = c.map((x, i) => `<button class="mpill ${ui.cedit === i ? 'sel' : ''}" data-pi="${i}" ${edit ? `data-act="cedit" data-i="${i}" title="Click to edit or delete"` : 'tabindex="-1"'} style="--c:${col(x.from)}">${esc(x.what)}</button>`).join('');
  return `<div class="cmap ${edit ? 'edit' : ''}" id="cmap"><svg class="cov"></svg><div class="cgrid">${boxes}</div>${pills}</div>
   <div class="row small muted" style="margin-top:6px;gap:16px"><span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" stroke="#555" stroke-width="2.5"/></svg> connection agreed by the board</span><span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" stroke="#999" stroke-width="1.5" stroke-dasharray="5 4"/></svg> status sent to the Project dashboard (automatic once a team submits)</span></div>`;
}
function drawConnMap() {
  const m = document.getElementById('cmap'); if (!m) return;
  const svg = m.querySelector('.cov'); const R = m.getBoundingClientRect(); if (!R.width) return;
  svg.setAttribute('width', R.width); svg.setAttribute('height', R.height); svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
  const rel = el => { const a = el.getBoundingClientRect(); return { x: a.left - R.left, y: a.top - R.top, w: a.width, h: a.height }; };
  const boxOf = k => { const b = m.querySelector(`[data-mk="${k}"]`); return b && rel(b); };
  const anc = (k, id, o) => {
    const p = boxOf(k); if (!p) return null; const ce = id && m.querySelector(`[data-mc="${k}:${id}"]`); const c = ce ? rel(ce) : p;
    const [ac, ar] = MAPPOS[k], [oc, or] = MAPPOS[o];
    if (ar === or && ac !== oc) return oc > ac ? [p.x + p.w, c.y + c.h / 2, 1, 0] : [p.x, c.y + c.h / 2, -1, 0];
    return or > ar ? [c.x + c.w / 2, p.y + p.h, 0, 1] : [c.x + c.w / 2, p.y, 0, -1];
  };
  const clip = (p, q) => { const cx = p.x + p.w / 2, cy = p.y + p.h / 2, dx = q.x + q.w / 2 - cx, dy = q.y + q.h / 2 - cy; const s = Math.min(dx ? p.w / 2 / Math.abs(dx) : 1e9, dy ? p.h / 2 / Math.abs(dy) : 1e9); return [cx + dx * s, cy + dy * s]; };
  let h = `<defs>${TK.map(k => `<marker id="cm-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:${col(k)}"/></marker>`).join('')}<marker id="cm-st" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#999"/></marker></defs>`;
  const F = boxOf('F');
  if (F) STUDENTS.forEach(k => { if (!T(k).lockedAt) return; const p = boxOf(k); if (!p) return; const a = clip(p, F), b = clip(F, p);
    h += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#999" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#cm-st)"/>`; });
  const placed = [];
  (B().connections || []).forEach((x, i) => {
    const s = anc(x.from, x.fromEl, x.to), t = anc(x.to, x.toEl, x.from); if (!s || !t || x.from === x.to) return;
    const o = Math.max(40, Math.min(90, Math.hypot(t[0] - s[0], t[1] - s[1]) / 3));
    const p1 = [s[0] + s[2] * o, s[1] + s[3] * o], p2 = [t[0] + t[2] * o, t[1] + t[3] * o];
    h += `<path d="M${s[0]} ${s[1]} C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${t[0]} ${t[1]}" fill="none" style="stroke:${col(x.from)}" stroke-width="${ui.cedit === i ? 4.5 : 2.5}" marker-end="url(#cm-${x.from})"/>`;
    let mx = (s[0] + 3 * p1[0] + 3 * p2[0] + t[0]) / 8, my = (s[1] + 3 * p1[1] + 3 * p2[1] + t[1]) / 8;
    for (let n = 0; n < 6 && placed.some(([px, py]) => Math.abs(px - mx) < 120 && Math.abs(py - my) < 24); n++) my += 26;
    placed.push([mx, my]);
    const pill = m.querySelector(`[data-pi="${i}"]`); if (pill) { pill.style.left = mx + 'px'; pill.style.top = my + 'px'; }
  });
  svg.innerHTML = h;
}
addEventListener('resize', () => drawConnMap());
function connFormHTML() {
  const c = B().connections || [];
  if (ui.cedit != null && c[ui.cedit]) { const x = c[ui.cedit];
    return `<div class="cform"><span><b>${x.from}</b> ${esc(elName(x.from, x.fromEl))} → <b>${x.to}</b> ${esc(elName(x.to, x.toEl))}</span>
     <input class="inp" data-cl style="flex:1;min-width:220px" value="${esc(ui.clabel)}"><button class="btn pri" data-act="csave">Save label</button><button class="btn danger" data-act="cdel">Delete arrow</button><button class="btn" data-act="ccancel">Cancel</button></div>`; }
  if (ui.csel && ui.cto) return `<div class="cform"><span><b>${ui.csel.k}</b> ${esc(elName(ui.csel.k, ui.csel.id))} → <b>${ui.cto.k}</b> ${esc(elName(ui.cto.k, ui.cto.id))}</span>
     <input class="inp" data-cl style="flex:1;min-width:220px" placeholder="What passes between them? e.g. failed delivery status" value="${esc(ui.clabel)}"><button class="btn pri" data-act="cadd">Add arrow</button><button class="btn" data-act="ccancel">Cancel</button></div>`;
  if (ui.csel) return `<div class="cform"><span><b>From ${ui.csel.k}:</b> ${esc(elName(ui.csel.k, ui.csel.id))}. Now click the component it connects to on another wireframe screen.</span><button class="btn" data-act="ccancel">Cancel</button></div>`;
  return `<div class="cform muted">Click a component on one wireframe screen, then the component it connects to on another. Type what passes between them. Click a label to edit or delete it.</div>`;
}
function connectStage() {
  return `<h1>Connect the system</h1><p class="muted">Follow order #NW-1042 through the six wireframe screens. For each link: which part of one wireframe screen passes what to which part of another?</p>
   ${connMapHTML(true)}${connFormHTML()}<div class="panel" style="margin-top:12px">${checksHTML()}</div>`;
}
function questionsStage() {
  const a = B().answers || {};
  return `<h1>The two original questions</h1>${[1, 2].map(n => `<div class="panel" style="margin-bottom:14px"><h2>${n}. ${esc(DECISIONS[n].t)}</h2><p class="muted">${esc(DECISIONS[n].d)}</p><textarea class="inp big" data-answer="${n}" rows="4" placeholder="The board decides…">${esc(a[n] || '')}</textarea></div>`).join('')}`;
}
function summaryStage() {
  const a = B().answers || {};
  return `<h1>What the board decided</h1><div class="grid2" style="margin-bottom:14px">${[1, 2].map(n => `<div class="panel"><h2>${n}. ${esc(DECISIONS[n].t)}</h2><p style="font-size:18px">${esc(a[n] || '—')}</p></div>`).join('')}</div>
   <h2>The system</h2>${connMapHTML(false)}<div class="panel" style="margin-top:12px">${checksHTML()}</div>`;
}

/* ---------------- observer ---------------- */
function pinView() {
  return `<div class="wrap narrow"><div class="panel"><h2>Observer view</h2><p class="muted">Tutor only — enter the PIN.</p><div class="row"><input id="pin" class="inp" type="password" autocomplete="off"><button class="btn pri" data-act="pin">Open</button></div></div></div>`;
}
const KIND = { key: ['relevant', 'ok'], case: ['relevant', 'ok'], false: ['wrong lesson from the case', 'bad'], mis: ['misleading', 'bad'], dis: ['irrelevant', 'warn'] };
function observerView() {
  const b = B(); const st = boardState();
  return `<div class="wrap"><div class="thead"><div><h1>Observer view</h1><p class="muted" style="margin:0">Only you see this page. Session <b>${esc(SESSION)}</b>${MODE === 'test' ? ' · test mode' : ''}.</p></div>${countHTML()}</div>
   <div class="panel" style="margin-bottom:14px"><div class="row">
    <b class="small">Clock</b>${b.clock ? `<span class="small">started ${fmt(b.clock)}</span><button class="btn sm" data-act="clock-stop">Stop</button>` : `<button class="btn sm pri" data-act="clock-start">Start the 60-minute clock</button>`}
    <span class="sep"></span><b class="small">Deadline</b><button class="btn sm" data-act="extend" ${b.extension ? 'disabled' : ''}>+5 minutes (once)</button>
    <button class="btn sm" data-act="force" ${st === 'meeting' ? 'disabled' : ''}>Start meeting anyway</button>
    <span class="tag ${st === 'failed' ? 'bad' : st === 'meeting' || st === 'ready' ? 'ok' : ''}">State: ${st}</span>
    <span class="sep"></span><a class="btn sm" href="#board" target="_blank">Open class screen ↗</a></div>
    ${st === 'meeting' ? `<div class="row" style="margin-top:8px"><b class="small">Class screen</b>${['present', 'connect', 'questions', 'summary'].map(s => `<button class="btn sm ${b.stage === s ? 'pri' : ''}" data-act="stage" data-s="${s}">${s}</button>`).join('')}${TK.map(k => `<button class="btn sm" data-act="spot" data-k="${k}">Spotlight ${k}</button>`).join('')}<button class="btn sm ${b.showRef ? 'pri' : ''}" data-act="ref-toggle">${b.showRef ? 'Hide' : 'Show'} reference wireframe</button></div>` : ''}
    <div class="row" style="margin-top:8px"><b class="small">Session</b><button class="btn sm danger" data-act="reset">Reset session</button></div>
    <div class="row" style="margin-top:8px"><b class="small">Preview</b><button class="btn sm" data-act="solve">Solve everything and open the board meeting</button>
     <span class="small muted">Fills every team’s check questions, facts and wireframe screen with the reference answers, publishes the agenda, adds sample connections and starts the meeting. Use a separate session code, not the one your class is using.</span></div></div>
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
   <div class="grid2" style="margin-top:14px"><div class="panel"><h3>Agenda (you, Team F)</h3>${T('F').agenda.publishedAt ? `<p class="small"><span class="tag ok">Published ${fmt(T('F').agenda.publishedAt)}</span> · ${T('F').agenda.order.join(' → ')}</p><p class="small"><i>${esc(T('F').agenda.opening)}</i></p>` : `<p class="small muted">Not published. ${T('F').agenda.order.length}/${TK.length} teams on it.</p>`}</div>
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
      else { if (picked.length >= pickOf(k)[1]) { toast(`You can choose up to ${pickOf(k)[1]} facts. Remove one first.`); return; } picked.push(id); }
      const p = { picked }; if (t.wf) p.wf = t.wf.map(el => !el.fact || picked.includes(el.fact) ? el : { ...el, fact: '' });
      setTeam(k, p); render(true); return;
    }
    case 'add': case 'addfor': {
      const type = a === 'add' ? b.dataset.type : FACT[b.dataset.id].comp[0];
      const wf = [...(t.wf || frame(k))]; const el = newEl(wf, type, '', a === 'addfor' ? b.dataset.id : '');
      wf.push(el); ui.sel = el.id; setTeam(k, { wf }); render(true); return;
    }
    case 'fix-start': ui.fixK = k; ui.sel = null; ui.fixSnap = JSON.stringify([t.wf, t.picked]); render(true); return;
    case 'fix-done': endFix(); render(true); return;
    case 'fix-pick': { const id = b.dataset.id; let picked = [...t.picked]; const wf = t.wf || [];
      if (picked.includes(id)) { picked = picked.filter(x => x !== id); setTeam(k, { picked, wf: wf.map(el => el.fact === id ? { ...el, fact: '' } : el) }); }
      else setTeam(k, { picked: [...picked, id] });
      render(true); return; }
    case 'fix-add': { const id = b.dataset.id; const r = (TEAMS[k].ref || []).find(x => x[4] === id);
      const wf = [...(t.wf || frame(k))]; const el = newEl(wf, r ? r[0] : FACT[id].comp[0], r ? r[1] : '', id);
      wf.push(el); ui.sel = el.id; setTeam(k, { wf, picked: t.picked.includes(id) ? t.picked : [...t.picked, id] }); render(true); return; }
    case 'fix-addtype': { const type = document.getElementById('fixtype').value; const wf = [...(t.wf || frame(k))]; const el = newEl(wf, type, '', ''); wf.push(el); ui.sel = el.id; setTeam(k, { wf }); render(true); return; }
    case 'fix-rm': { const id = b.dataset.el; const gone = (t.wf || []).find(x => x.id === id); const wf = (t.wf || []).filter(x => x.id !== id); const p = { wf };
      if (gone && gone.fact && !wf.some(x => x.fact === gone.fact) && FACT[gone.fact].kind !== 'key') p.picked = t.picked.filter(x => x !== gone.fact);
      if (ui.sel === id) ui.sel = null; setTeam(k, p); render(true); return; }
    case 'del': { const wf = (t.wf || []).filter(x => x.id !== ui.sel); ui.sel = null; setTeam(k, { wf }); render(true); return; }
    case 'dup': { const s = (t.wf || []).find(x => x.id === ui.sel); if (!s) return; const c = { ...s, id: 'e' + Date.now().toString(36), y: Math.min(640 - s.h, s.y + s.h + 8) }; ui.sel = c.id; setTeam(k, { wf: [...t.wf, c] }); render(true); return; }
    case 'lock': if (submitChecks(k).every(x => x[0])) { setTeam(k, { lockedAt: Date.now() }); ui.sel = null; toast('Submitted. Thank you!'); } render(true); return;
    case 'ag-add': { const ag = T('F').agenda; setTeam('F', { agenda: { order: [...ag.order, k] } }); render(true); return; }
    case 'ag-rm': { const o = [...T('F').agenda.order]; o.splice(+b.dataset.i, 1); setTeam('F', { agenda: { order: o } }); render(true); return; }
    case 'ag-mv': { const o = [...T('F').agenda.order]; const i = +b.dataset.i, j = i + +b.dataset.d; if (j < 0 || j >= o.length) return;[o[i], o[j]] = [o[j], o[i]]; setTeam('F', { agenda: { order: o } }); render(true); return; }
    case 'ag-pub': setTeam('F', { agenda: { publishedAt: Date.now() } }); render(true); return;
    case 'ag-unpub': setTeam('F', { agenda: { publishedAt: null } }); render(true); return;
    case 'start': if (boardState() === 'ready') setBoard({ meeting: { startedAt: Date.now(), forced: false }, stage: 'present', spot: agendaOrder()[0] }); render(true); return;
    case 'force': setBoard({ meeting: { startedAt: Date.now(), forced: true }, stage: 'present', spot: agendaOrder()[0] }); render(true); return;
    case 'stage': endFix(); setBoard({ stage: b.dataset.s }); render(true); return;
    case 'ref-toggle': setBoard({ showRef: !B().showRef }); render(true); return;
    case 'spot': endFix(); setBoard({ spot: k, stage: 'present' }); render(true); return;
    case 'spotnav': { endFix(); const o = agendaOrder(); const cur = o.includes(B().spot) ? B().spot : o[0]; const n = o[o.indexOf(cur) + +b.dataset.d]; if (n) setBoard({ spot: n }); render(true); return; }
    case 'cpick': { const id = b.dataset.el; ui.cedit = null;
      if (!ui.csel || ui.csel.k === k || ui.cto) { ui.csel = { k, id }; ui.cto = null; ui.clabel = ''; }
      else ui.cto = { k, id };
      render(true); if (ui.cto) app.querySelector('[data-cl]')?.focus(); return; }
    case 'cadd': { const w = ui.clabel.trim(); if (!w) { toast('Type what passes between them first.'); app.querySelector('[data-cl]')?.focus(); return; }
      setBoard({ connections: [...(B().connections || []), { from: ui.csel.k, fromEl: ui.csel.id, to: ui.cto.k, toEl: ui.cto.id, what: w }] });
      ui.csel = ui.cto = null; ui.clabel = ''; render(true); return; }
    case 'cedit': { const i = +b.dataset.i; ui.csel = ui.cto = null; ui.cedit = ui.cedit === i ? null : i; ui.clabel = ui.cedit == null ? '' : (B().connections || [])[i].what; render(true); if (ui.cedit != null) app.querySelector('[data-cl]')?.focus(); return; }
    case 'csave': { const w = ui.clabel.trim(); if (!w) { toast('The label cannot be empty — delete the arrow instead.'); return; } const c = [...(B().connections || [])]; c[ui.cedit] = { ...c[ui.cedit], what: w }; setBoard({ connections: c }); ui.cedit = null; ui.clabel = ''; render(true); return; }
    case 'cdel': { const c = [...(B().connections || [])]; c.splice(ui.cedit, 1); setBoard({ connections: c }); ui.cedit = null; ui.clabel = ''; render(true); return; }
    case 'ccancel': ui.csel = ui.cto = ui.cedit = null; ui.clabel = ''; render(true); return;
    case 'override': setTeam(k, { override: true }); render(true); return;
    case 'clock-start': setBoard({ clock: Date.now(), failedAt: null, extension: 0 }); render(true); return;
    case 'clock-stop': setBoard({ clock: null, failedAt: null }); render(true); return;
    case 'extend': if (!B().extension) { setBoard({ extension: 5, failedAt: null }); toast('Extension granted: +5 minutes'); } render(true); return;
    case 'reset': if (resetArm()) { DB.reset(); ui.answers = {}; toast('Session reset'); } return;
    case 'demo': demo(); return;
    case 'solve': if (solveArm()) { demo(true); setBoard({ meeting: { startedAt: Date.now(), forced: false }, stage: 'present', spot: 'A', showRef: false }); location.hash = 'board'; } return;
  }
});
let solveArmed = 0; function solveArm() {
  const used = STUDENTS.some(k => { const t = T(k); return t.picked.length || (t.wf || []).length > 2 || t.lockedAt; });
  if (!used || Date.now() - solveArmed < 4000) return true;
  solveArmed = Date.now(); toast('Students have already worked in this session — click again within 4 seconds to overwrite their work.', 5000); return false;
}
let armed = 0; function resetArm() { if (Date.now() - armed < 4000) return true; armed = Date.now(); toast('Click “Reset session” again within 4 seconds to clear all work in this session.'); return false; }
let saveT = {}; const later = (key, fn) => { clearTimeout(saveT[key]); saveT[key] = setTimeout(fn, 600); };
app.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.bc) { const [k, id] = el.dataset.bc.split('|'); later(el.dataset.bc, () => setTeam(k, { because: { [id]: el.value } })); return; }
  if (el.dataset.ans) { ui.answers[el.dataset.ans] = el.value; return; }
  if (el.dataset.ag) { later('ag', () => setTeam('F', { agenda: { opening: el.value } })); const p = app.querySelector('[data-act="ag-pub"]'); if (p) p.disabled = !(TK.every(k => T('F').agenda.order.includes(k)) && el.value.trim().length >= 10); return; }
  if (el.dataset.answer) { later('ans' + el.dataset.answer, () => setBoard({ answers: { [el.dataset.answer]: el.value } })); return; }
  if ('cl' in el.dataset) { ui.clabel = el.value; return; }
});
app.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.act === 'labels') { ui.labels = el.checked; render(true); return; }
  if (el.dataset.prop) { const k = curTeam() || (route().v === 'board' && ui.fixK); if (!k) return; const t = T(k); const wf = (t.wf || []).map(x => x.id === ui.sel ? { ...x, [el.dataset.prop]: el.value } : x); setTeam(k, { wf }); setTimeout(() => render(true), 0); return; }
});
app.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset.ans) { const [k, q] = e.target.dataset.ans.split('-'); app.querySelector(`[data-act="check"][data-k="${k}"][data-q="${q}"]`)?.click(); return; }
  if (e.key === 'Enter' && e.target.id === 'code') { app.querySelector('[data-act="join"]').click(); return; }
  if ('cl' in e.target.dataset && (e.key === 'Enter' || e.key === 'Escape')) { app.querySelector(e.key === 'Escape' ? '[data-act="ccancel"]' : '[data-act="cadd"],[data-act="csave"]')?.click(); return; }
  if (e.key === 'Escape' && (ui.csel || ui.cedit != null)) { app.querySelector('[data-act="ccancel"]')?.click(); return; }
  if (e.key === 'Enter' && e.target.dataset.act === 'cpick') { e.target.click(); return; }
  if (e.key === 'Enter' && e.target.id === 'pin') { app.querySelector('[data-act="pin"]').click(); return; }
  const fx = route().v === 'board' && ui.fixK; const k = curTeam() || fx; if (!k || !ui.sel || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const t = T(k); if (t.lockedAt && !fx) return; const s = (t.wf || []).find(x => x.id === ui.sel); if (!s) return;
  const mv = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[e.key];
  if (mv) { e.preventDefault(); setTeam(k, { wf: t.wf.map(x => x.id === s.id ? { ...x, x: clamp(x.x + mv[0], 0, 360 - x.w), y: clamp(x.y + mv[1], 0, 640 - x.h) } : x) }); render(true); }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); app.querySelector(fx ? `[data-act="fix-rm"][data-el="${ui.sel}"]` : '[data-act="del"]')?.click(); }
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
function demo(full = false) {
  const W = {}; TK.forEach(k => W[k] = TEAMS[k].ref);
  TK.forEach(k => {
    const qset = ensureQset(k); const solved = {}; qset.forEach(i => solved[i] = true);
    const wf = [...frame(k), ...W[k].map((r, i) => { const d = CDEF[r[0]]; return { id: k + 'd' + i, type: r[0], text: r[1], x: r[2], y: r[3], w: d.w, h: d.h, fact: r[4] }; })];
    const picked = [...new Set(W[k].map(r => r[4]).filter(Boolean))]; const because = {}; picked.forEach(id => because[id] = 'This matters because another team’s wireframe screen depends on it.');
    setTeam(k, { qset, solved, picked, because, wf, lockedAt: Date.now() });
  });
  setTeam('F', { agenda: { order: ['A', 'B', 'C', 'D', 'E', 'F'], opening: 'We are here to turn six wireframe screens into one Northway system, and then decide two questions.', publishedAt: Date.now() } });
  if (full) setBoard({ connections: [
    { from: 'A', fromEl: 'Ad0', to: 'B', toEl: 'Bd0', what: 'packed, ready to ship' },
    { from: 'E', fromEl: 'Ed3', to: 'B', toEl: 'Bd4', what: 'courier tracking events' },
    { from: 'B', fromEl: 'Bd0', to: 'C', toEl: 'Cd1', what: 'failed delivery status' },
    { from: 'C', fromEl: 'Cd4', to: 'D', toEl: 'Dd1', what: 'query that needs a person' },
    { from: 'A', fromEl: 'Ad3', to: 'E', toEl: 'Ed3', what: 'reorder sent to supplier' }] });
  toast(full ? 'Everything solved — opening the board meeting.' : 'Sample work added for all six teams.');
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
