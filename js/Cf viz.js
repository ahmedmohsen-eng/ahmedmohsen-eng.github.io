// js/cf-viz.js — Live CF visualizations for hackgg106
// Renders: (1) Rating history line chart  (2) Problems by tag bar chart
// Both fetch live from Codeforces API, degrade gracefully if offline

const HANDLE = 'hackgg106';

// ── Colour palette (matches amber portfolio theme) ──────────────────────────
const C = {
  accent:   '#E8A020',
  accent2:  '#D4701A',
  green:    '#22c55e',
  red:      '#ef4444',
  text:     '#F2EDE4',
  text2:    '#A09880',
  border:   'rgba(220,160,60,0.18)',
  surface:  'rgba(28,26,22,0.85)',
  gridLine: 'rgba(220,160,60,0.08)',
};

// Light mode overrides (read from CSS variable at render time)
function isLight() { return document.documentElement.classList.contains('light'); }
function col(dark, light) { return isLight() ? light : dark; }

// ── Utility ─────────────────────────────────────────────────────────────────
async function cfFetch(endpoint, ms = 8000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`https://codeforces.com/api/${endpoint}`, { signal: ctrl.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(data.comment || 'CF API error');
    return data.result;
  } catch (e) { clearTimeout(id); throw e; }
}

function fmtDate(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

// ── Rating colour (CF standard) ─────────────────────────────────────────────
function ratingColor(r) {
  if (r >= 2400) return '#ff3300';
  if (r >= 1900) return '#ff8c00';
  if (r >= 1600) return '#a500ff';
  if (r >= 1400) return '#0088ff';
  if (r >= 1200) return '#03a89e';
  return '#808080';
}

// ── SVG helper ───────────────────────────────────────────────────────────────
function svg(tag, attrs, children = '') {
  const a = Object.entries(attrs).map(([k,v]) => `${k}="${v}"`).join(' ');
  return `<${tag} ${a}>${children}</${tag}>`;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. RATING HISTORY CHART
// ════════════════════════════════════════════════════════════════════════════
function buildRatingChart(contests, container) {
  if (!contests.length) {
    container.innerHTML = `<p class="cf-viz-empty">No rated contests yet — chart will appear after first contest.</p>`;
    return;
  }

  const W = container.clientWidth || 680;
  const H = 220;
  const PAD = { top: 24, right: 24, bottom: 40, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Build data points — start from rating 0 before first contest for baseline
  const points = contests.map(c => ({ ts: c.ratingUpdateTimeSeconds, rating: c.newRating, name: c.contestName, delta: c.newRating - c.oldRating }));

  const minR = Math.min(...points.map(p => p.rating)) - 50;
  const maxR = Math.max(...points.map(p => p.rating)) + 80;
  const minT = points[0].ts;
  const maxT = points[points.length - 1].ts;
  const tRange = maxT - minT || 1;

  const xOf = ts  => PAD.left + ((ts - minT) / tRange) * chartW;
  const yOf = r   => PAD.top  + chartH - ((r - minR) / (maxR - minR)) * chartH;

  // Grid lines (rating levels)
  const levels = [800, 1200, 1400, 1600, 1900, 2100, 2400].filter(l => l >= minR && l <= maxR);
  const gridLines = levels.map(l => {
    const y = yOf(l);
    return `
      ${svg('line', { x1: PAD.left, y1: y, x2: PAD.left + chartW, y2: y, stroke: ratingColor(l), 'stroke-width': '0.5', 'stroke-dasharray': '3,4', opacity: '0.35' })}
      ${svg('text', { x: PAD.left - 6, y: y + 4, 'text-anchor': 'end', fill: ratingColor(l), 'font-size': '9', 'font-family': 'JetBrains Mono,monospace', opacity: '0.7' }, l)}
    `;
  }).join('');

  // Area fill path
  const linePts = points.map(p => `${xOf(p.ts)},${yOf(p.rating)}`).join(' ');
  const areaPath = `M ${xOf(points[0].ts)},${yOf(points[0].rating)} ` +
    points.slice(1).map(p => `L ${xOf(p.ts)},${yOf(p.rating)}`).join(' ') +
    ` L ${xOf(points[points.length-1].ts)},${PAD.top+chartH} L ${xOf(points[0].ts)},${PAD.top+chartH} Z`;

  // Line path
  const linePath = `M ${points.map(p => `${xOf(p.ts)},${yOf(p.rating)}`).join(' L ')}`;

  // Dots + tooltips
  const dots = points.map((p, i) => {
    const x = xOf(p.ts); const y = yOf(p.rating);
    const deltaStr = p.delta >= 0 ? `+${p.delta}` : `${p.delta}`;
    const tipW = 160; const tipX = Math.min(x - tipW/2, W - tipW - 8);
    return `
      <g class="cf-dot-group" tabindex="0" role="img" aria-label="${p.name}: rating ${p.rating} (${deltaStr})">
        <circle cx="${x}" cy="${y}" r="5" fill="${ratingColor(p.rating)}" stroke="${col('#0D0C0A','#F7F5F0')}" stroke-width="2"/>
        <circle cx="${x}" cy="${y}" r="12" fill="transparent" class="cf-dot-hit"/>
        <g class="cf-tooltip" style="display:none">
          <rect x="${tipX}" y="${y-52}" width="${tipW}" height="44" rx="7" fill="${col('#1A1917','#fff')}" stroke="${C.border}" stroke-width="1"/>
          <text x="${tipX+8}" y="${y-34}" fill="${col(C.accent,'#C07010')}" font-size="9" font-family="JetBrains Mono,monospace">${fmtDate(p.ts)}</text>
          <text x="${tipX+8}" y="${y-20}" fill="${col(C.text,'#1A1814')}" font-size="10" font-weight="600" font-family="JetBrains Mono,monospace">${p.rating} <tspan fill="${p.delta>=0?C.green:C.red}">(${deltaStr})</tspan></text>
          <text x="${tipX+8}" y="${y-10}" fill="${col(C.text2,'#5A5448')}" font-size="8" font-family="JetBrains Mono,monospace">${p.name.slice(0,28)}${p.name.length>28?'…':''}</text>
        </g>
      </g>`;
  }).join('');

  // X axis labels (show up to 6 evenly spaced)
  const step = Math.max(1, Math.ceil(points.length / 5));
  const xLabels = points.filter((_, i) => i % step === 0 || i === points.length-1).map(p => {
    const x = xOf(p.ts);
    return svg('text', { x, y: H - 6, 'text-anchor': 'middle', fill: col(C.text2,'#5A5448'), 'font-size': '9', 'font-family': 'JetBrains Mono,monospace' }, fmtDate(p.ts));
  }).join('');

  // Current rating label
  const last = points[points.length-1];
  const lastX = xOf(last.ts); const lastY = yOf(last.rating);

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="cf-rating-svg" style="overflow:visible">
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#rg)"/>
      <path d="${linePath}" fill="none" stroke="${C.accent}" stroke-width="2" stroke-linejoin="round" filter="url(#glow)"/>
      ${dots}
      ${xLabels}
      <text x="${lastX+8}" y="${lastY-8}" fill="${ratingColor(last.rating)}" font-size="11" font-weight="700" font-family="JetBrains Mono,monospace">${last.rating}</text>
    </svg>`;

  // Hover interactions
  container.querySelectorAll('.cf-dot-group').forEach(g => {
    const tip = g.querySelector('.cf-tooltip');
    g.addEventListener('mouseenter', () => { if(tip) tip.style.display = ''; });
    g.addEventListener('mouseleave', () => { if(tip) tip.style.display = 'none'; });
    g.addEventListener('focus',      () => { if(tip) tip.style.display = ''; });
    g.addEventListener('blur',       () => { if(tip) tip.style.display = 'none'; });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 2. PROBLEMS BY TAG CHART
// ════════════════════════════════════════════════════════════════════════════

// Tags to skip (meta-tags, not algorithm categories)
const SKIP_TAGS = new Set(['*special problem','interactive','2-sat']);

// Colour per tag family
const TAG_COLORS = {
  'implementation': '#E8A020',
  'math':           '#D4701A',
  'greedy':         '#22c55e',
  'dp':             '#3b82f6',
  'graphs':         '#a855f7',
  'data structures':'#06b6d4',
  'brute force':    '#f59e0b',
  'constructive algorithms':'#10b981',
  'sortings':       '#8b5cf6',
  'binary search':  '#ec4899',
  'number theory':  '#14b8a6',
  'strings':        '#f97316',
  'dfs and similar':'#6366f1',
  'trees':          '#84cc16',
  'two pointers':   '#eab308',
  'bitmasks':       '#e11d48',
};
const DEFAULT_COLOR = '#A09880';

function tagColor(tag) { return TAG_COLORS[tag] || DEFAULT_COLOR; }

function buildTagChart(submissions, container) {
  // Count unique AC problems per tag
  const solved = new Map(); // problemId → Set of tags
  for (const s of submissions) {
    if (s.verdict !== 'OK') continue;
    const id = `${s.problem.contestId}_${s.problem.index}`;
    if (!solved.has(id)) solved.set(id, s.problem.tags || []);
  }

  const tagCount = {};
  for (const [, tags] of solved) {
    for (const tag of tags) {
      if (SKIP_TAGS.has(tag)) continue;
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    }
  }

  if (!Object.keys(tagCount).length) {
    container.innerHTML = `<p class="cf-viz-empty">No solved problems with tags found.</p>`;
    return;
  }

  // Sort by count, take top 12
  const sorted = Object.entries(tagCount)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 12);

  const total = solved.size;
  const maxCount = sorted[0][1];

  const bars = sorted.map(([tag, count], i) => {
    const pct = (count / maxCount) * 100;
    const color = tagColor(tag);
    const delay = i * 60;
    return `
      <div class="cf-tag-row" style="animation-delay:${delay}ms">
        <div class="cf-tag-label" title="${tag}">${tag}</div>
        <div class="cf-tag-bar-wrap">
          <div class="cf-tag-bar" style="--pct:${pct}%;--color:${color};animation-delay:${delay}ms"></div>
        </div>
        <div class="cf-tag-count" style="color:${color}">${count}</div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="cf-tag-meta">
      <span class="cf-tag-total"><span style="color:${C.accent};font-weight:700">${total}</span> unique problems solved</span>
      <span class="cf-tag-note">Top ${sorted.length} tags</span>
    </div>
    <div class="cf-tag-list">${bars}</div>`;
}

// ════════════════════════════════════════════════════════════════════════════
// 3. ORCHESTRATOR — fetch data, render both charts, handle errors
// ════════════════════════════════════════════════════════════════════════════
async function initCFViz() {
  const ratingEl = document.getElementById('cf-rating-chart');
  const tagEl    = document.getElementById('cf-tag-chart');
  if (!ratingEl && !tagEl) return;

  // Show skeletons
  [ratingEl, tagEl].forEach(el => { if (el) el.innerHTML = '<div class="cf-skeleton"></div>'; });

  try {
    // Fetch both in parallel
    const [ratingData, subData] = await Promise.allSettled([
      cfFetch(`user.rating?handle=${HANDLE}`),
      cfFetch(`user.status?handle=${HANDLE}&from=1&count=10000`, 10000),
    ]);

    if (ratingEl) {
      if (ratingData.status === 'fulfilled') {
        buildRatingChart(ratingData.value, ratingEl);
      } else {
        ratingEl.innerHTML = `<p class="cf-viz-empty cf-viz-error">Rating chart unavailable — CF ${ratingData.reason?.message || 'offline'}</p>`;
      }
    }

    if (tagEl) {
      if (subData.status === 'fulfilled') {
        buildTagChart(subData.value, tagEl);
      } else {
        tagEl.innerHTML = `<p class="cf-viz-empty cf-viz-error">Tag chart unavailable — CF ${subData.reason?.message || 'offline'}</p>`;
      }
    }
  } catch (err) {
    [ratingEl, tagEl].forEach(el => {
      if (el) el.innerHTML = `<p class="cf-viz-empty cf-viz-error">CF data unavailable</p>`;
    });
  }
}

document.addEventListener('DOMContentLoaded', initCFViz);
