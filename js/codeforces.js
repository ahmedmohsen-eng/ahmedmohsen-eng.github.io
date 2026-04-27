// js/codeforces.js — Live CF stats for hackgg106
// Shows: rating always, rank only if pupil (1200+) or above

const HANDLE = 'hackgg106';
const SHOW_RANK = ['pupil','specialist','expert','candidate master',
                   'master','international master','grandmaster',
                   'international grandmaster','legendary grandmaster'];

async function fetchWithTimeout(url, ms = 6000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id); return res;
  } catch (err) { clearTimeout(id); throw err; }
}

function setEl(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

function setDot(state) {
  const dot = document.getElementById('cf-status-dot');
  const lbl = document.getElementById('cf-state');
  if (!dot) return;
  dot.className = 'cf-status-dot';
  const map = { online:['dot-online',''], offline:['dot-offline','offline'], slow:['dot-slow','slow'] };
  const [cls, txt] = map[state] || ['dot-offline','unreachable'];
  dot.classList.add(cls); dot.title = txt || 'CF online';
  if (lbl) lbl.textContent = txt;
}

function colorRating(el, r) {
  if (!el || r == null) return;
  el.style.color = r>=2400?'#ff3300':r>=1900?'#ff8c00':r>=1600?'#a500ff':r>=1400?'#0088ff':r>=1200?'#03a89e':'#808080';
}

async function loadCF() {
  try {
    const res = await fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${HANDLE}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OK' || !data.result?.[0]) throw new Error('Bad data');

    const u = data.result[0];
    const rating = u.rating ?? null;
    const rank = (u.rank ?? '').toLowerCase();

    const ratingEl = document.getElementById('cf-rating');
    setEl('cf-rating', rating != null ? String(rating) : '—');
    colorRating(ratingEl, rating);

    const rankRow = document.getElementById('cf-rank-row');
    if (rankRow) {
      if (SHOW_RANK.includes(rank)) {
        setEl('cf-rank', rank.toUpperCase());
        rankRow.style.display = '';
      } else {
        rankRow.style.display = 'none';
      }
    }
    setDot('online');
  } catch (err) {
    setDot(err.message?.includes('abort') ? 'slow' : 'offline');
    setEl('cf-rating', '—');
    const rankRow = document.getElementById('cf-rank-row');
    if (rankRow) rankRow.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', loadCF);
