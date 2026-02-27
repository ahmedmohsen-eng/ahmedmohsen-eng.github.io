// js/codeforces.js
// Fetches Codeforces user info robustly with timeout + safe DOM updates

export async function loadCF(handle = 'hackgg106') {
  const ratingEl = document.getElementById('cf-rating');
  const rankEl   = document.getElementById('cf-rank');

  function set(el, txt) {
    if (el) el.textContent = txt;
  }

  async function fetchWithTimeout(url, ms = 5000) {
    const ctrl = new AbortController();
    const id   = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  try {
    const res  = await fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${handle}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status === 'OK' && data.result?.[0]) {
      const u = data.result[0];
      set(rankEl, (u.rank || 'newbie').toUpperCase());
      set(ratingEl, u.rating ?? '—');

      // Colour the rating by tier
      if (ratingEl && u.rating) {
        const r = u.rating;
        ratingEl.style.color =
          r >= 2400 ? '#ff3300' :
          r >= 1900 ? '#ff8c00' :
          r >= 1600 ? '#a500ff' :
          r >= 1400 ? '#0088ff' :
          r >= 1200 ? '#03a89e' :
                      '#808080';
      }
    } else {
      throw new Error('Unexpected API shape');
    }
  } catch (e) {
    set(rankEl, 'ACTIVE');
    set(ratingEl, '—');
    console.warn('[CF]', e.message);
  }
}
