// js/cf-viz.js — CF visualizations for hackgg106
// Plain unauthenticated fetch (same approach as codeforces.js which works)

const CF_HANDLE = 'hackgg106';

const light     = () => document.documentElement.classList.contains('light');
const tAccent   = () => light() ? '#C07010' : '#E8A020';
const tText2    = () => light() ? '#5A5448' : '#A09880';
const tSurface  = () => light() ? '#ffffff' : '#1A1917';
const tBorder   = () => light() ? 'rgba(192,112,16,0.2)' : 'rgba(220,160,60,0.18)';

function ratingColor(r) {
  if (!r || r < 1200) return '#808080';
  if (r < 1400) return '#03a89e';
  if (r < 1600) return '#0088ff';
  if (r < 1900) return '#a500ff';
  if (r < 2400) return '#ff8c00';
  return '#ff3300';
}
function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

// Same fetchWithTimeout pattern as codeforces.js
async function cfGet(path, ms = 10000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch('https://codeforces.com/api/' + path, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.status !== 'OK') throw new Error(json.comment || 'CF error');
    return json.result;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function skeleton(el) { el.innerHTML = '<div class="cf-skeleton"></div>'; }
function errMsg(el, msg) {
  el.innerHTML = '<p class="cf-viz-empty cf-viz-error">⚠ ' + msg + '</p>';
}

// ── RATING CHART ─────────────────────────────────────────────────────────────
function renderRating(contests, wrap) {
  if (!contests || !contests.length) {
    wrap.innerHTML = '<p class="cf-viz-empty">No rated contests yet.</p>';
    return;
  }

  const W  = Math.max(wrap.getBoundingClientRect().width || wrap.offsetWidth || wrap.parentElement?.offsetWidth || 400, 260);
  const H  = 200;
  const P  = { top: 20, right: 24, bottom: 36, left: 48 };
  const cW = W - P.left - P.right;
  const cH = H - P.top  - P.bottom;

  const pts = contests.map(c => ({
    ts: c.ratingUpdateTimeSeconds,
    r:  c.newRating,
    d:  c.newRating - c.oldRating,
    n:  c.contestName,
  }));

  const minR  = Math.min(...pts.map(p => p.r)) - 60;
  const maxR  = Math.max(...pts.map(p => p.r)) + 80;
  const minT  = pts[0].ts;
  const span  = (pts[pts.length-1].ts - minT) || 1;

  const xp = t => P.left + ((t - minT) / span) * cW;
  const yp = r => P.top  + cH - ((r - minR) / (maxR - minR)) * cH;

  // Grid
  const grid = [800,1000,1200,1400,1600,1900].filter(t => t > minR && t < maxR).map(t => {
    const y = yp(t);
    return `<line x1="${P.left}" y1="${y}" x2="${P.left+cW}" y2="${y}"
              stroke="${ratingColor(t)}" stroke-width="0.6" stroke-dasharray="3,5" opacity="0.3"/>
            <text x="${P.left-4}" y="${y+3.5}" text-anchor="end" font-size="8"
              font-family="JetBrains Mono,monospace" fill="${ratingColor(t)}" opacity="0.65">${t}</text>`;
  }).join('');

  const lineD = pts.map((p,i) => `${i?'L':'M'} ${xp(p.ts).toFixed(1)},${yp(p.r).toFixed(1)}`).join(' ');
  const last  = pts[pts.length-1];
  const areaD = lineD + ` L ${xp(last.ts).toFixed(1)},${P.top+cH} L ${xp(pts[0].ts).toFixed(1)},${P.top+cH} Z`;

  const dots = pts.map(p => {
    const x = xp(p.ts), y = yp(p.r);
    const ds = (p.d >= 0 ? '+' : '') + p.d;
    const dc = p.d >= 0 ? '#22c55e' : '#ef4444';
    const tw = 164, th = 50;
    const tx = x + tw > W - 4 ? x - tw - 6 : x + 6;
    const ty = Math.max(P.top+2, y - th - 4);
    const nm = p.n.length > 30 ? p.n.slice(0,30)+'…' : p.n;
    return `<g class="cfr-dot">
      <circle cx="${x}" cy="${y}" r="4.5" fill="${ratingColor(p.r)}"
        stroke="${tSurface()}" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="13" fill="transparent" style="cursor:pointer"/>
      <g class="cfr-tip" style="display:none;pointer-events:none">
        <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="7"
          fill="${tSurface()}" stroke="${tBorder()}" stroke-width="1"/>
        <text x="${tx+9}" y="${ty+14}" font-size="8.5"
          font-family="JetBrains Mono,monospace" fill="${tText2()}">${fmtDate(p.ts)}</text>
        <text x="${tx+9}" y="${ty+28}" font-size="10.5" font-weight="700"
          font-family="JetBrains Mono,monospace" fill="${ratingColor(p.r)}">${p.r}
          <tspan fill="${dc}" font-size="9">(${ds})</tspan></text>
        <text x="${tx+9}" y="${ty+41}" font-size="7.5"
          font-family="JetBrains Mono,monospace" fill="${tText2()}">${nm}</text>
      </g>
    </g>`;
  }).join('');

  const step  = Math.max(1, Math.floor(pts.length / 5));
  const xlbls = pts.filter((_,i) => i%step===0 || i===pts.length-1)
    .map(p => `<text x="${xp(p.ts).toFixed(1)}" y="${H-4}" text-anchor="middle"
      font-size="8" font-family="JetBrains Mono,monospace" fill="${tText2()}">${fmtDate(p.ts)}</text>`).join('');

  const lx = xp(last.ts), ly = yp(last.r);
  const gid = 'g' + (Math.random()*1e6|0);

  wrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible;display:block">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="${tAccent()}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${tAccent()}" stop-opacity="0.01"/>
        </linearGradient>
      </defs>
      ${grid}
      <path d="${areaD}" fill="url(#${gid})"/>
      <path d="${lineD}" fill="none" stroke="${tAccent()}"
        stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${xlbls}
      <text x="${lx+52 > W-4 ? lx-52 : lx+6}" y="${ly-7}" font-size="11" font-weight="700"
        font-family="JetBrains Mono,monospace" fill="${ratingColor(last.r)}">${last.r}</text>
    </svg>`;

  wrap.querySelectorAll('.cfr-dot').forEach(dot => {
    const tip = dot.querySelector('.cfr-tip');
    dot.addEventListener('mouseenter', () => tip && (tip.style.display = ''));
    dot.addEventListener('mouseleave', () => tip && (tip.style.display = 'none'));
  });
}

// ── TAG CHART ────────────────────────────────────────────────────────────────
const SKIP = new Set(['*special problem','interactive','2-sat']);
const TCOL = {
  'implementation':'#E8A020','math':'#D4701A','greedy':'#22c55e',
  'dp':'#3b82f6','graphs':'#a855f7','data structures':'#06b6d4',
  'brute force':'#f59e0b','constructive algorithms':'#10b981',
  'sortings':'#8b5cf6','binary search':'#ec4899',
  'number theory':'#14b8a6','strings':'#f97316',
  'dfs and similar':'#6366f1','trees':'#84cc16',
  'two pointers':'#eab308','bitmasks':'#e11d48',
};

function renderTags(subs, wrap) {
  const seen = new Map();
  for (const s of subs) {
    if (s.verdict !== 'OK') continue;
    const id = s.problem.contestId + '_' + s.problem.index;
    if (!seen.has(id)) seen.set(id, s.problem.tags || []);
  }
  const total = seen.size;
  const cnt = {};
  for (const [,tags] of seen)
    for (const t of tags)
      if (!SKIP.has(t)) cnt[t] = (cnt[t]||0) + 1;

  if (!Object.keys(cnt).length) {
    wrap.innerHTML = '<p class="cf-viz-empty">No tagged problems found.</p>';
    return;
  }

  const sorted = Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,12);
  const mx = sorted[0][1];

  wrap.innerHTML = `
    <div class="cf-tag-meta">
      <span class="cf-tag-total">
        <span style="color:${tAccent()};font-weight:700">${total}</span>&nbsp;unique problems
      </span>
      <span class="cf-tag-note">top ${sorted.length} tags</span>
    </div>
    <div class="cf-tag-list">
      ${sorted.map(([tag,n],i) => {
        const pct = (n/mx*100).toFixed(1);
        const col = TCOL[tag] || '#A09880';
        return `<div class="cf-tag-row" style="animation-delay:${i*50}ms">
          <div class="cf-tag-label" title="${tag}">${tag}</div>
          <div class="cf-tag-bar-wrap">
            <div class="cf-tag-bar" data-pct="${pct}" style="background:${col};width:0"></div>
          </div>
          <div class="cf-tag-count" style="color:${col}">${n}</div>
        </div>`;
      }).join('')}
    </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    wrap.querySelectorAll('.cf-tag-bar').forEach((b,i) => {
      b.style.transition = `width 0.85s cubic-bezier(0.16,1,0.3,1) ${i*50}ms`;
      b.style.width = b.dataset.pct + '%';
    });
  }));
}

// ── INIT ─────────────────────────────────────────────────────────────────────
async function initCFViz() {
  const rEl = document.getElementById('cf-rating-chart');
  const tEl = document.getElementById('cf-tag-chart');
  if (!rEl && !tEl) return;

  if (rEl) skeleton(rEl);
  if (tEl) skeleton(tEl);

  const [rRes, sRes] = await Promise.allSettled([
    rEl ? cfGet('user.rating?handle=' + CF_HANDLE) : Promise.resolve(null),
    tEl ? cfGet('user.status?handle=' + CF_HANDLE + '&from=1&count=10000', 14000) : Promise.resolve(null),
  ]);

  if (rEl) {
    if (rRes.status === 'fulfilled' && rRes.value) renderRating(rRes.value, rEl);
    else errMsg(rEl, 'Rating unavailable (' + (rRes.reason?.message || 'offline') + ')');
  }
  if (tEl) {
    if (sRes.status === 'fulfilled' && sRes.value) renderTags(sRes.value, tEl);
    else errMsg(tEl, 'Tags unavailable (' + (sRes.reason?.message || 'offline') + ')');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCFViz);
} else {
  initCFViz();
}
