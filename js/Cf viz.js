// js/cf-viz.js — Live CF visualizations for hackgg106
// Rating history line chart + Problems by algorithm tag bar chart

const CF_HANDLE = 'hackgg106';

const THEME = {
  accent:  () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#E8A020',
  accent2: () => getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim() || '#D4701A',
  text:    () => document.documentElement.classList.contains('light') ? '#1A1814' : '#F2EDE4',
  text2:   () => document.documentElement.classList.contains('light') ? '#5A5448' : '#A09880',
  surface: () => document.documentElement.classList.contains('light') ? '#fff'    : '#1A1917',
  border:  () => document.documentElement.classList.contains('light') ? 'rgba(192,112,16,0.2)' : 'rgba(220,160,60,0.18)',
};

function ratingColor(r) {
  if (!r) return '#808080';
  if (r >= 2400) return '#ff3300';
  if (r >= 1900) return '#ff8c00';
  if (r >= 1600) return '#a500ff';
  if (r >= 1400) return '#0088ff';
  if (r >= 1200) return '#03a89e';
  return '#808080';
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

// ── Fetch with timeout ───────────────────────────────────────────────────────
async function cfFetch(path, ms = 9000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`https://codeforces.com/api/${path}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== 'OK') throw new Error(json.comment || 'CF API error');
    return json.result;
  } catch(e) {
    clearTimeout(timer);
    throw e;
  }
}

// ── Skeleton / error helpers ─────────────────────────────────────────────────
function showSkeleton(el) {
  el.innerHTML = '<div class="cf-skeleton"></div>';
}
function showError(el, msg) {
  el.innerHTML = `<p class="cf-viz-empty cf-viz-error">⚠ ${msg}</p>`;
}

// ════════════════════════════════════════════════════════════════════════════
// RATING HISTORY CHART
// ════════════════════════════════════════════════════════════════════════════
function renderRatingChart(contests, wrap) {
  if (!contests || !contests.length) {
    wrap.innerHTML = `<p class="cf-viz-empty">No rated contests yet — chart appears after first contest.</p>`;
    return;
  }

  const W    = Math.max(wrap.clientWidth || 400, 300);
  const H    = 200;
  const P    = { top: 20, right: 20, bottom: 36, left: 48 };
  const cW   = W - P.left - P.right;
  const cH   = H - P.top  - P.bottom;

  const pts  = contests.map(c => ({
    ts:    c.ratingUpdateTimeSeconds,
    r:     c.newRating,
    delta: c.newRating - c.oldRating,
    name:  c.contestName,
  }));

  const minR = Math.min(...pts.map(p => p.r)) - 60;
  const maxR = Math.max(...pts.map(p => p.r)) + 80;
  const minT = pts[0].ts;
  const maxT = pts[pts.length - 1].ts;
  const tSpan = maxT - minT || 1;

  const xp = ts => P.left + ((ts - minT) / tSpan) * cW;
  const yp = r  => P.top  + cH - ((r - minR) / (maxR - minR)) * cH;

  // Grid lines at CF rating thresholds
  const thresholds = [800, 1000, 1200, 1400, 1600, 1900].filter(t => t > minR && t < maxR);
  const gridSVG = thresholds.map(t => {
    const y = yp(t);
    return `<line x1="${P.left}" y1="${y}" x2="${P.left + cW}" y2="${y}"
              stroke="${ratingColor(t)}" stroke-width="0.5" stroke-dasharray="3,5" opacity="0.3"/>
            <text x="${P.left - 4}" y="${y + 3.5}" text-anchor="end"
              font-size="8" font-family="JetBrains Mono,monospace"
              fill="${ratingColor(t)}" opacity="0.6">${t}</text>`;
  }).join('');

  // Area + line paths
  const lineD = pts.map((p,i) => `${i===0?'M':'L'} ${xp(p.ts)},${yp(p.r)}`).join(' ');
  const areaD = lineD +
    ` L ${xp(pts[pts.length-1].ts)},${P.top+cH}` +
    ` L ${xp(pts[0].ts)},${P.top+cH} Z`;

  // Dots with tooltips
  const dotsSVG = pts.map((p, i) => {
    const x = xp(p.ts); const y = yp(p.r);
    const dStr = p.delta >= 0 ? `+${p.delta}` : `${p.delta}`;
    const dCol = p.delta >= 0 ? '#22c55e' : '#ef4444';
    // Tooltip box — flip left if near right edge
    const tipW = 162; const tipH = 48;
    const tx = x + tipW > W - 8 ? x - tipW - 4 : x + 6;
    const ty = Math.max(P.top, y - tipH - 4);
    return `
      <g class="cfr-dot" data-idx="${i}">
        <circle cx="${x}" cy="${y}" r="4.5" fill="${ratingColor(p.r)}"
          stroke="${THEME.surface()}" stroke-width="1.5"/>
        <circle cx="${x}" cy="${y}" r="13" fill="transparent" style="cursor:pointer"/>
        <g class="cfr-tip" style="display:none;pointer-events:none">
          <rect x="${tx}" y="${ty}" width="${tipW}" height="${tipH}" rx="7"
            fill="${THEME.surface()}" stroke="${THEME.border()}" stroke-width="1"/>
          <text x="${tx+9}" y="${ty+14}" font-size="8.5"
            font-family="JetBrains Mono,monospace" fill="${THEME.text2()}">${fmtDate(p.ts)}</text>
          <text x="${tx+9}" y="${ty+27}" font-size="10" font-weight="700"
            font-family="JetBrains Mono,monospace" fill="${ratingColor(p.r)}">${p.r}
            <tspan fill="${dCol}" font-size="9">${dStr}</tspan>
          </text>
          <text x="${tx+9}" y="${ty+40}" font-size="7.5"
            font-family="JetBrains Mono,monospace" fill="${THEME.text2()}">${p.name.slice(0,30)}${p.name.length>30?'…':''}</text>
        </g>
      </g>`;
  }).join('');

  // X-axis labels
  const step  = Math.max(1, Math.floor(pts.length / 5));
  const xLbls = pts.filter((_, i) => i % step === 0 || i === pts.length-1).map(p =>
    `<text x="${xp(p.ts)}" y="${H - 4}" text-anchor="middle"
       font-size="8" font-family="JetBrains Mono,monospace" fill="${THEME.text2()}">${fmtDate(p.ts)}</text>`
  ).join('');

  // Last rating label
  const last  = pts[pts.length - 1];
  const gradId = `rg_${Date.now()}`;

  wrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}"
         style="overflow:visible;display:block" class="cfr-svg">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${THEME.accent()}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${THEME.accent()}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridSVG}
      <path d="${areaD}" fill="url(#${gradId})"/>
      <path d="${lineD}" fill="none" stroke="${THEME.accent()}" stroke-width="2.2"
        stroke-linejoin="round" stroke-linecap="round"/>
      ${dotsSVG}
      ${xLbls}
      <text x="${xp(last.ts) + 6}" y="${yp(last.r) - 6}"
        font-size="11" font-weight="700" font-family="JetBrains Mono,monospace"
        fill="${ratingColor(last.r)}">${last.r}</text>
    </svg>`;

  // Hover interactions
  wrap.querySelectorAll('.cfr-dot').forEach(dot => {
    const tip = dot.querySelector('.cfr-tip');
    dot.addEventListener('mouseenter', () => tip && (tip.style.display = ''));
    dot.addEventListener('mouseleave', () => tip && (tip.style.display = 'none'));
  });
}

// ════════════════════════════════════════════════════════════════════════════
// TAG BAR CHART
// ════════════════════════════════════════════════════════════════════════════
const SKIP = new Set(['*special problem', 'interactive', '2-sat']);
const TAG_PALETTE = {
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
const DEFAULT_COL = '#A09880';

function renderTagChart(subs, wrap) {
  // Deduplicate by problem id, count tags
  const seen = new Map();
  for (const s of subs) {
    if (s.verdict !== 'OK') continue;
    const id = `${s.problem.contestId}_${s.problem.index}`;
    if (!seen.has(id)) seen.set(id, s.problem.tags || []);
  }
  const total = seen.size;

  const tagCount = {};
  for (const [, tags] of seen) {
    for (const t of tags) {
      if (!SKIP.has(t)) tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }

  if (!Object.keys(tagCount).length) {
    wrap.innerHTML = `<p class="cf-viz-empty">No tagged problems found.</p>`;
    return;
  }

  const sorted = Object.entries(tagCount).sort((a,b) => b[1]-a[1]).slice(0, 12);
  const maxCnt = sorted[0][1];

  const rows = sorted.map(([tag, cnt], i) => {
    const pct = (cnt / maxCnt * 100).toFixed(1);
    const col = TAG_PALETTE[tag] || DEFAULT_COL;
    return `
      <div class="cf-tag-row" style="animation-delay:${i*55}ms">
        <div class="cf-tag-label" title="${tag}">${tag}</div>
        <div class="cf-tag-bar-wrap">
          <div class="cf-tag-bar"
               style="width:${pct}%;background:${col};transition:width 0.9s cubic-bezier(0.16,1,0.3,1) ${i*55}ms">
          </div>
        </div>
        <div class="cf-tag-count" style="color:${col}">${cnt}</div>
      </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="cf-tag-meta">
      <span class="cf-tag-total">
        <span style="color:${THEME.accent()};font-weight:700">${total}</span>
        &nbsp;unique problems solved
      </span>
      <span class="cf-tag-note">top ${sorted.length} tags</span>
    </div>
    <div class="cf-tag-list">${rows}</div>`;
}

// ════════════════════════════════════════════════════════════════════════════
// INIT — fetch both in parallel, render
// ════════════════════════════════════════════════════════════════════════════
async function initCFViz() {
  const rWrap = document.getElementById('cf-rating-chart');
  const tWrap = document.getElementById('cf-tag-chart');
  if (!rWrap && !tWrap) return;

  if (rWrap) showSkeleton(rWrap);
  if (tWrap) showSkeleton(tWrap);

  const [rRes, sRes] = await Promise.allSettled([
    cfFetch(`user.rating?handle=${CF_HANDLE}`),
    cfFetch(`user.status?handle=${CF_HANDLE}&from=1&count=10000`, 12000),
  ]);

  if (rWrap) {
    if (rRes.status === 'fulfilled') renderRatingChart(rRes.value, rWrap);
    else showError(rWrap, `Rating unavailable (${rRes.reason?.message || 'CF offline'})`);
  }
  if (tWrap) {
    if (sRes.status === 'fulfilled') renderTagChart(sRes.value, tWrap);
    else showError(tWrap, `Tags unavailable (${sRes.reason?.message || 'CF offline'})`);
  }
}

// Wait for DOM — works whether script is in head or body
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCFViz);
} else {
  initCFViz();
}
