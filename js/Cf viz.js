// js/cf-viz.js — Live CF visualizations for hackgg106
// Rating history line chart + Problems by algorithm tag bar chart

const CF_HANDLE = 'hackgg106';

function isLight() { return document.documentElement.classList.contains('light'); }
function themeAccent()  { return isLight() ? '#C07010' : '#E8A020'; }
function themeAccent2() { return isLight() ? '#A84808' : '#D4701A'; }
function themeText()    { return isLight() ? '#1A1814' : '#F2EDE4'; }
function themeText2()   { return isLight() ? '#5A5448' : '#A09880'; }
function themeSurface() { return isLight() ? '#ffffff' : '#1A1917'; }
function themeBorder()  { return isLight() ? 'rgba(192,112,16,0.2)' : 'rgba(220,160,60,0.18)'; }

function ratingColor(r) {
  if (!r || r < 1200) return '#808080';
  if (r < 1400) return '#03a89e';
  if (r < 1600) return '#0088ff';
  if (r < 1900) return '#a500ff';
  if (r < 2100) return '#ff8c00';
  if (r < 2400) return '#ff8c00';
  return '#ff3300';
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

// ── Fetch ────────────────────────────────────────────────────────────────────
async function cfFetch(path, ms = 10000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch('https://codeforces.com/api/' + path, {
      signal: ctrl.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.status !== 'OK') throw new Error(json.comment || 'API error');
    return json.result;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function showSkeleton(el) {
  el.innerHTML = '<div class="cf-skeleton"></div>';
}
function showError(el, msg) {
  el.innerHTML = '<p class="cf-viz-empty cf-viz-error">⚠ ' + msg + '</p>';
  console.error('[cf-viz]', msg);
}

// ════════════════════════════════════════════════════════════════════════════
// RATING HISTORY CHART
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

  // threshold grid lines
  const thresholds = [800,1000,1200,1400,1600,1900,2100].filter(t => t > minR && t < maxR);
  const gridSVG = thresholds.map(t => {
    const y = yp(t);
    return '<line x1="' + P.left + '" y1="' + y + '" x2="' + (P.left+cW) + '" y2="' + y + '" stroke="' + ratingColor(t) + '" stroke-width="0.6" stroke-dasharray="3,5" opacity="0.3"/>'
         + '<text x="' + (P.left-4) + '" y="' + (y+3.5) + '" text-anchor="end" font-size="8" font-family="JetBrains Mono,monospace" fill="' + ratingColor(t) + '" opacity="0.65">' + t + '</text>';
  }).join('');

  // paths
  const lineD = pts.map((p,i) => (i===0?'M ':'L ') + xp(p.ts).toFixed(1) + ',' + yp(p.r).toFixed(1)).join(' ');
  const last  = pts[pts.length-1];
  const areaD = lineD + ' L ' + xp(last.ts).toFixed(1) + ',' + (P.top+cH) + ' L ' + xp(pts[0].ts).toFixed(1) + ',' + (P.top+cH) + ' Z';

  // dots
  const dotsSVG = pts.map((p, i) => {
    const x = xp(p.ts); const y = yp(p.r);
    const dStr = (p.delta >= 0 ? '+' : '') + p.delta;
    const dCol = p.delta >= 0 ? '#22c55e' : '#ef4444';
    const tipW = 164; const tipH = 50;
    const tx = (x + tipW > W - 4) ? x - tipW - 6 : x + 6;
    const ty = Math.max(P.top + 2, y - tipH - 4);
    const shortName = p.name.length > 30 ? p.name.slice(0,30) + '…' : p.name;
    return '<g class="cfr-dot">'
         +   '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="' + ratingColor(p.r) + '" stroke="' + themeSurface() + '" stroke-width="1.5"/>'
         +   '<circle cx="' + x + '" cy="' + y + '" r="13" fill="transparent" style="cursor:pointer"/>'
         +   '<g class="cfr-tip" style="display:none;pointer-events:none">'
         +     '<rect x="' + tx + '" y="' + ty + '" width="' + tipW + '" height="' + tipH + '" rx="7" fill="' + themeSurface() + '" stroke="' + themeBorder() + '" stroke-width="1"/>'
         +     '<text x="' + (tx+9) + '" y="' + (ty+14) + '" font-size="8.5" font-family="JetBrains Mono,monospace" fill="' + themeText2() + '">' + fmtDate(p.ts) + '</text>'
         +     '<text x="' + (tx+9) + '" y="' + (ty+28) + '" font-size="10.5" font-weight="700" font-family="JetBrains Mono,monospace" fill="' + ratingColor(p.r) + '">' + p.r + ' <tspan fill="' + dCol + '" font-size="9">(' + dStr + ')</tspan></text>'
         +     '<text x="' + (tx+9) + '" y="' + (ty+41) + '" font-size="7.5" font-family="JetBrains Mono,monospace" fill="' + themeText2() + '">' + shortName + '</text>'
         +   '</g>'
         + '</g>';
  }).join('');

  // x-axis labels
  const step  = Math.max(1, Math.floor(pts.length / 5));
  const xLbls = pts
    .filter((_, i) => i % step === 0 || i === pts.length - 1)
    .map(p => '<text x="' + xp(p.ts).toFixed(1) + '" y="' + (H-4) + '" text-anchor="middle" font-size="8" font-family="JetBrains Mono,monospace" fill="' + themeText2() + '">' + fmtDate(p.ts) + '</text>')
    .join('');

  // current rating label
  const lx = xp(last.ts); const ly = yp(last.r);
  const labX = lx + 50 > W ? lx - 50 : lx + 6;

  const gradId = 'cfgrad_' + Math.random().toString(36).slice(2,7);

  wrap.innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="overflow:visible;display:block">'
    + '<defs>'
    +   '<linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">'
    +     '<stop offset="0%" stop-color="' + themeAccent() + '" stop-opacity="0.28"/>'
    +     '<stop offset="100%" stop-color="' + themeAccent() + '" stop-opacity="0.01"/>'
    +   '</linearGradient>'
    + '</defs>'
    + gridSVG
    + '<path d="' + areaD + '" fill="url(#' + gradId + ')"/>'
    + '<path d="' + lineD + '" fill="none" stroke="' + themeAccent() + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'
    + dotsSVG
    + xLbls
    + '<text x="' + labX + '" y="' + (ly - 7) + '" font-size="11" font-weight="700" font-family="JetBrains Mono,monospace" fill="' + ratingColor(last.r) + '">' + last.r + '</text>'
    + '</svg>';

  // Hover
  wrap.querySelectorAll('.cfr-dot').forEach(dot => {
    const tip = dot.querySelector('.cfr-tip');
    dot.addEventListener('mouseenter', () => { if (tip) tip.style.display = ''; });
    dot.addEventListener('mouseleave', () => { if (tip) tip.style.display = 'none'; });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// TAG BAR CHART
// ════════════════════════════════════════════════════════════════════════════
const SKIP_TAGS = new Set(['*special problem', 'interactive', '2-sat']);
const TAG_PALETTE = {
  'implementation':           '#E8A020',
  'math':                     '#D4701A',
  'greedy':                   '#22c55e',
  'dp':                       '#3b82f6',
  'graphs':                   '#a855f7',
  'data structures':          '#06b6d4',
  'brute force':              '#f59e0b',
  'constructive algorithms':  '#10b981',
  'sortings':                 '#8b5cf6',
  'binary search':            '#ec4899',
  'number theory':            '#14b8a6',
  'strings':                  '#f97316',
  'dfs and similar':          '#6366f1',
  'trees':                    '#84cc16',
  'two pointers':             '#eab308',
  'bitmasks':                 '#e11d48',
};

function renderTagChart(subs, wrap) {
  const seen = new Map();
  for (const s of subs) {
    if (s.verdict !== 'OK') continue;
    const id = s.problem.contestId + '_' + s.problem.index;
    if (!seen.has(id)) seen.set(id, s.problem.tags || []);
  }
  const total = seen.size;

  const tagCount = {};
  for (const [, tags] of seen) {
    for (const t of tags) {
      if (!SKIP_TAGS.has(t)) tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }

  if (!Object.keys(tagCount).length) {
    wrap.innerHTML = '<p class="cf-viz-empty">No tagged problems found.</p>';
    return;
  }

  const sorted = Object.entries(tagCount).sort((a,b) => b[1]-a[1]).slice(0, 12);
  const maxCnt = sorted[0][1];
  const accent = themeAccent();

  let html = '<div class="cf-tag-meta">'
    + '<span class="cf-tag-total"><span style="color:' + accent + ';font-weight:700">' + total + '</span>&nbsp;unique problems solved</span>'
    + '<span class="cf-tag-note">top ' + sorted.length + ' tags</span>'
    + '</div><div class="cf-tag-list">';

  sorted.forEach(([tag, cnt], i) => {
    const pct  = (cnt / maxCnt * 100).toFixed(1);
    const col  = TAG_PALETTE[tag] || '#A09880';
    html += '<div class="cf-tag-row" style="animation-delay:' + (i*50) + 'ms">'
          +   '<div class="cf-tag-label" title="' + tag + '">' + tag + '</div>'
          +   '<div class="cf-tag-bar-wrap">'
          +     '<div class="cf-tag-bar" data-w="' + pct + '" style="background:' + col + '"></div>'
          +   '</div>'
          +   '<div class="cf-tag-count" style="color:' + col + '">' + cnt + '</div>'
          + '</div>';
  });
  html += '</div>';
  wrap.innerHTML = html;

  // Animate bars after DOM paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrap.querySelectorAll('.cf-tag-bar').forEach(bar => {
        bar.style.transition = 'width 0.9s cubic-bezier(0.16,1,0.3,1)';
        bar.style.width = bar.dataset.w + '%';
      });
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════════════════
async function initCFViz() {
  const rWrap = document.getElementById('cf-rating-chart');
  const tWrap = document.getElementById('cf-tag-chart');

  console.log('[cf-viz] init — rWrap:', !!rWrap, 'tWrap:', !!tWrap);
  if (!rWrap && !tWrap) return;

  if (rWrap) showSkeleton(rWrap);
  if (tWrap) showSkeleton(tWrap);

  const [rRes, sRes] = await Promise.allSettled([
    rWrap ? cfFetch('user.rating?handle=' + CF_HANDLE) : Promise.reject(new Error('no container')),
    tWrap ? cfFetch('user.status?handle=' + CF_HANDLE + '&from=1&count=10000', 12000) : Promise.reject(new Error('no container')),
  ]);

  console.log('[cf-viz] rating:', rRes.status, rRes.reason?.message || '');
  console.log('[cf-viz] status:', sRes.status, sRes.reason?.message || '');

  if (rWrap) {
    if (rRes.status === 'fulfilled') renderRatingChart(rRes.value, rWrap);
    else showError(rWrap, 'Rating chart unavailable — ' + (rRes.reason?.message || 'CF offline'));
  }
  if (tWrap) {
    if (sRes.status === 'fulfilled') renderTagChart(sRes.value, tWrap);
    else showError(tWrap, 'Tag chart unavailable — ' + (sRes.reason?.message || 'CF offline'));
  }
}

// Safe init — works whether DOM is ready or not
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCFViz);
} else {
  initCFViz();
}
