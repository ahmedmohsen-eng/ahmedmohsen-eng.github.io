// js/codeforces.js - fetch CF user info
export async function loadCF(handle = 'hackgg106') {
  const ratingEl = document.getElementById('cf-rating');
  const rankEl = document.getElementById('cf-rank');

  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
    const data = await res.json();

    const u = data.result[0];
    rankEl.textContent = (u.rank || 'active').toUpperCase();
    ratingEl.textContent = u.rating || '---';
  } catch (e) {
    if (rankEl) rankEl.textContent = 'ACTIVE';
    if (ratingEl) ratingEl.textContent = '---';
    console.warn('CF fetch failed:', e);
  }
}
