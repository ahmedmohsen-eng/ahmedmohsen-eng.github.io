// js/cf-viz.js — Authenticated CF API visualizations for hackgg106
// Uses CF API key + secret with SHA-512 via browser SubtleCrypto

const CF_HANDLE = 'hackgg106';
const CF_KEY    = 'd9b07398491643f76e6a8b5acbbb23db14e37c66';
const CF_SECRET = 'b359e14c2c691b61391f28b607d0934a5e10cc4e';

// ── Theme helpers ────────────────────────────────────────────────────────────
const light     = () => document.documentElement.classList.contains('light');
const tAccent   = () => light() ? '#C07010' : '#E8A020';
const tAccent2  = () => light() ? '#A84808' : '#D4701A';
const tText     = () => light() ? '#1A1814' : '#F2EDE4';
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

// ── SHA-512 via SubtleCrypto ─────────────────────────────────────────────────
async function sha512hex(str) {
  const buf  = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── Authenticated CF fetch ───────────────────────────────────────────────────
async function cfFetch(method, extraParams = {}, ms = 12000) {
  const rand   = Math.random().toString(36).slice(2, 8).padEnd(6, '0').slice(0, 6);
  const ts     = String(Math.floor(Date.now() / 1000));
  const params = { apiKey: CF_KEY, time: ts, ...extraParams };

  // Sort params alphabetically
  const sorted = Object.keys(params).sort()
    .map(k => `${k}=${params[k]}`).join('&');

  const hashInput = `${rand}/${method}?${sorted}#${CF_SECRET}`;
  const hexSig    = await sha512hex(hashInput);
  const apiSig    = rand + hexSig;

  const url  = `https://codeforces.com/api/${method}?${sorted}&apiSig=${apiSig}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.status !== 'OK') throw new Error(json.comment || 'CF API error');
    return json.result;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ── UI helpers ───────────────────────────────────────────────────────────────
function showSkeleton(el) { el.innerHTML = '<div class="cf-skeleton"></div>'; }
function showError(el, msg) {
  el.innerHTML = `<p class="cf-viz-empty cf-viz-error">⚠ ${msg}</p>`;
  console.error('[cf-viz]', msg);
}

// ════════════════════════════════════════════════════════════════════════════
// 1. RATING HISTORY CHART
// ════════════════════════════════════════════════════════════════════════════
function renderRatingChart(contests, wrap) {
  if (!contests || !contests.length) {
    wrap.innerHTML = '<p class="cf-viz-empty">No rated contests yet.</p>';
    return;
  }

  const W  = Math.max(wrap.getBoundingClientRect().width || wrap.clientWidth || 400, 280);
  const H  = 200;
  const P  = { top: 20, right: 24, bottom: 36, left: 50 };
  const cW = W - P.left - P.right;
  const cH = H - P.top  - P.bottom;

  const pts = contests.map(c => ({
    ts:    c.ratingUpdateTimeSeconds,
    r:     c.newRating,
    delta: c.newRating - c.oldRating,
    name:  c.contestName,
  }));

  const minR  = Math.min(...pts.map(p => p.r)) - 60;
  const maxR  = Math.max(...pts.map(p => p.r)) + 80;
  const minT  = pts[0].ts;
  const maxT  = pts[pts.length - 1].ts;
  const tSpan = maxT - minT || 1;

  const xp = ts => P.left + ((ts - minT) / tSpan) * cW;
  const yp = r  => P.top  + cH - ((r - minR) / (maxR - minR)) * cH;

  const thresholds = [800,1000,1200,1400,1600,1900].filter(t => t > minR && t < maxR);
  const gridSVG = thresholds.map(t => {
    const y = yp(t);
    return `<line x1="${P.left}" y1="${y}" x2="${P.left+cW}" y2="${y}"
              stroke="${ratingColor(t)}" stroke-width="0.6"
              stroke-dasharray="3,5" opacity="0.3"/>
            <text x="${P.left-4}" y="${y+3.5}" text-anchor="end"
              font-size="8" font-family="JetBrains Mono,monospace"
              fill="${ratingColor(t)}" opacity="0.65">${t}</text>`;
  }).join('');

  const lineD = pts.map((p,i) => `${i===0?'M':'L'} ${xp(p.ts).toFixed(1)},${yp(p.r).toFixed(1)}`).join(' ');
  const last  = pts[pts.length-1];
  const areaD = lineD
    + ` L ${xp(last.ts).toFixed(1)},${P.top+cH}`
    + ` L ${xp(pts[0].ts).toFixed(1)},${P.top+cH} Z`;

  const dotsSVG = pts.map(p => {
    const x = xp(p.ts), y = yp(p.r);
    const dStr = (p.delta >= 0 ? '+' : '') + p.delta;
    const dCol = p.delta >= 0 ? '#22c55e' : '#ef4444';
    const tipW = 164, tipH = 50;
    const tx   = x + tipW > W - 4 ? x - tipW - 6 : x + 6;
    const ty   = Math.max(P.top+2, y - tipH - 4);
    const name = p.name.length > 30 ? p.name.slice(0,30)+'…' : p.name;
    return `<g class="cfr-dot">
      <circle cx="${x}" cy="${y}" r="4.5" fill="${ratingColor(p.r)}"
        stroke="${tSurface()}" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="13" fill="transparent" style="cursor:pointer"/>
      <g class="cfr-tip" style="display:none;pointer-events:none">
        <rect x="${tx}" y="${ty}" width="${tipW}" height="${tipH}" rx="7"
          fill="${tSurface()}" stroke="${tBorder()}" stroke-width="1"/>
        <text x="${tx+9}" y="${ty+14}" font-size="8.5"
          font-family="JetBrains Mono,monospace" fill="${tText2()}">${fmtDate(p.ts)}</text>
        <text x="${tx+9}" y="${ty+28}" font-size="10.5" font-weight="700"
          font-family="JetBrains Mono,monospace" fill="${ratingColor(p.r)}">${p.r}
          <tspan fill="${dCol}" font-size="9">(${dStr})</tspan></text>
        <text x="${tx+9}" y="${ty+41}" font-size="7.5"
          font-family="JetBrains Mono,monospace" fill="${tText2()}">${name}</text>
      </g>
    </g>`;
  }).join('');

  const step  = Math.max(1, Math.floor(pts.length / 5));
  const xLbls = pts
    .filter((_,i) => i % step === 0 || i === pts.length-1)
    .map(p => `<text x="${xp(p.ts).toFixed(1)}" y="${H-4}" text-anchor="middle"
      font-size="8" font-family="JetBrains Mono,monospace"
      fill="${tText2()}">${fmtDate(p.ts)}</text>`).join('');

  const lx    = xp(last.ts), ly = yp(last.r);
  const labX  = lx + 50 > W ? lx - 52 : lx + 6;
  const gradId = 'cfg' + Math.random().toString(36).slice(2,7);

  wrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible;display:block">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="${tAccent()}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${tAccent()}" stop-opacity="0.01"/>
        </linearGradient>
      </defs>
      ${gridSVG}
      <path d="${areaD}" fill="url(#${gradId})"/>
      <path d="${lineD}" fill="none" stroke="${tAccent()}"
        stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dotsSVG}
      ${xLbls}
      <text x="${labX}" y="${ly-7}" font-size="11" font-weight="700"
        font-family="JetBrains Mono,monospace"
        fill="${ratingColor(last.r)}">${last.r}</text>
    </svg>`;

  wrap.querySelectorAll('.cfr-dot').forEach(dot => {
    const tip = dot.querySelector('.cfr-tip');
    dot.addEventListener('mouseenter', () => tip && (tip.style.display = ''));
    dot.addEventListener('mouseleave', () => tip && (tip.style.display = 'none'));
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 2. TAG BAR CHART
// ════════════════════════════════════════════════════════════════════════════
const SKIP_TAGS = new Set(['*special problem','interactive','2-sat']);
const TAG_COLORS = {
  'implementation':          '#E8A020',
  'math':                    '#D4701A',
  'greedy':                  '#22c55e',
  'dp':                      '#3b82f6',
  'graphs':                  '#a855f7',
  'data structures':         '#06b6d4',
  'brute force':             '#f59e0b',
  'constructive algorithms': '#10b981',
  'sortings':                '#8b5cf6',
  'binary search':           '#ec4899',
  'number theory':           '#14b8a6',
  'strings':                 '#f97316',
  'dfs and similar':         '#6366f1',
  'trees':                   '#84cc16',
  'two pointers':            '#eab308',
  'bitmasks':                '#e11d48',
};

function renderTagChart(subs, wrap) {
  const seen = new Map();
  for (const s of subs) {
    if (s.verdict !== 'OK') continue;
    const id = `${s.problem.contestId}_${s.problem.index}`;
    if (!seen.has(id)) seen.set(id, s.problem.tags || []);
  }
  const total = seen.size;
  const tagCount = {};
  for (const [,tags] of seen) {
    for (const t of tags) {
      if (!SKIP_TAGS.has(t)) tagCount[t] = (tagCount[t]||0) + 1;
    }
  }
  if (!Object.keys(tagCount).length) {
    wrap.innerHTML = '<p class="cf-viz-empty">No tagged problems found.</p>';
    return;
  }
  const sorted = Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,12);
  const maxCnt = sorted[0][1];

  wrap.innerHTML = `
    <div class="cf-tag-meta">
      <span class="cf-tag-total">
        <span style="color:${tAccent()};font-weight:700">${total}</span>
        &nbsp;unique problems solved
      </span>
      <span class="cf-tag-note">top ${sorted.length} tags</span>
    </div>
    <div class="cf-tag-list">
      ${sorted.map(([tag,cnt],i) => {
        const pct = (cnt/maxCnt*100).toFixed(1);
        const col = TAG_COLORS[tag] || '#A09880';
        return `<div class="cf-tag-row" style="animation-delay:${i*50}ms">
          <div class="cf-tag-label" title="${tag}">${tag}</div>
          <div class="cf-tag-bar-wrap">
            <div class="cf-tag-bar" data-pct="${pct}" style="background:${col};width:0"></div>
          </div>
          <div class="cf-tag-count" style="color:${col}">${cnt}</div>
        </div>`;
      }).join('')}
    </div>`;

  // Animate bars after two paint frames
  requestAnimationFrame(() => requestAnimationFrame(() => {
    wrap.querySelectorAll('.cf-tag-bar').forEach((bar, i) => {
      bar.style.transition = `width 0.85s cubic-bezier(0.16,1,0.3,1) ${i*50}ms`;
      bar.style.width = bar.dataset.pct + '%';
    });
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// 3. INIT
// ════════════════════════════════════════════════════════════════════════════
async function initCFViz() {
  const rWrap = document.getElementById('cf-rating-chart');
  const tWrap = document.getElementById('cf-tag-chart');
  if (!rWrap && !tWrap) return;

  if (rWrap) showSkeleton(rWrap);
  if (tWrap) showSkeleton(tWrap);

  const [rRes, sRes] = await Promise.allSettled([
    rWrap ? cfFetch('user.rating', { handle: CF_HANDLE }) : Promise.resolve(null),
    tWrap ? cfFetch('user.status', { handle: CF_HANDLE, from: '1', count: '10000' }, 15000) : Promise.resolve(null),
  ]);

  if (rWrap) {
    if (rRes.status === 'fulfilled' && rRes.value) renderRatingChart(rRes.value, rWrap);
    else showError(rWrap, 'Rating unavailable — ' + (rRes.reason?.message || 'CF offline'));
  }
  if (tWrap) {
    if (sRes.status === 'fulfilled' && sRes.value) renderTagChart(sRes.value, tWrap);
    else showError(tWrap, 'Tags unavailable — ' + (sRes.reason?.message || 'CF offline'));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCFViz);
} else {
  initCFViz();
}
