// js/codeforces.js — Live Codeforces stats for hackgg106
// Fetches: rating, rank, problems solved count
// Shows server state: online / offline / maintenance / slow

const HANDLE = 'hackgg106';

async function fetchWithTimeout(url, ms = 6000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function set(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function setStatusDot(state) {
  const dot = document.getElementById('cf-status-dot');
  const stateEl = document.getElementById('cf-state');
  if (!dot) return;

  dot.className = 'cf-status-dot';
  if (state === 'online') {
    dot.classList.add('dot-online');
    dot.title = 'CF online';
    if (stateEl) stateEl.textContent = '';
  } else if (state === 'offline') {
    dot.classList.add('dot-offline');
    dot.title = 'CF offline';
    if (stateEl) stateEl.textContent = 'offline';
  } else if (state === 'slow') {
    dot.classList.add('dot-slow');
    dot.title = 'CF slow';
    if (stateEl) stateEl.textContent = 'slow';
  } else {
    dot.classList.add('dot-offline');
    dot.title = 'CF unreachable';
    if (stateEl) stateEl.textContent = 'unreachable';
  }
}

function colorRating(el, r) {
  if (!el || !r) return;
  el.style.color =
    r >= 2400 ? '#ff3300' :
    r >= 1900 ? '#ff8c00' :
    r >= 1600 ? '#a500ff' :
    r >= 1400 ? '#0088ff' :
    r >= 1200 ? '#03a89e' :
               '#808080';
}

async function loadCF() {
  try {
    // Fetch user info
    const userRes = await fetchWithTimeout(
      `https://codeforces.com/api/user.info?handles=${HANDLE}`
    );
    if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`);
    const userData = await userRes.json();

    if (userData.status !== 'OK' || !userData.result?.[0]) {
      throw new Error('Bad user data');
    }

    const u = userData.result[0];
    const rating = u.rating ?? null;
    const rank = u.rank ?? 'newbie';

    const ratingEl = document.getElementById('cf-rating');
    set('cf-rating', rating ?? '—');
    set('cf-rank', rank.toUpperCase());
    colorRating(ratingEl, rating);

    // Fetch solved count via user.status (last 10000 submissions, count unique ACs)
    try {
      const subRes = await fetchWithTimeout(
        `https://codeforces.com/api/user.status?handle=${HANDLE}&from=1&count=10000`,
        8000
      );
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.status === 'OK') {
          const solvedSet = new Set();
          for (const s of subData.result) {
            if (s.verdict === 'OK' && s.problem) {
              solvedSet.add(`${s.problem.contestId}_${s.problem.index}`);
            }
          }
          set('cf-solved', solvedSet.size.toString());
        }
      }
    } catch (_) {
      // Solved count optional — don't fail main display
      set('cf-solved', '250+');
    }

    setStatusDot('online');

  } catch (err) {
    // Determine failure reason
    const msg = err.message || '';
    const isAbort = msg.includes('abort') || msg.includes('signal');
    const isHTTP = /HTTP \d/.test(msg);

    if (isAbort) {
      setStatusDot('slow');
    } else if (isHTTP) {
      setStatusDot('offline');
    } else {
      setStatusDot('offline');
    }

    set('cf-rating', '—');
    set('cf-rank', '—');
    set('cf-solved', '250+');
    console.warn('[CF]', err.message);
  }
}

// Run on load
document.addEventListener('DOMContentLoaded', loadCF);
