// js/codeforces.js
// ES module exporting loadCF(handle)
export async function loadCF(handle = 'hackgg106') {
  const ratingEl = document.getElementById('cf-rating');
  const rankEl = document.getElementById('cf-rank');

  async function fetchWithTimeout(url, timeout = 4000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  try {
    const res = await fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${handle}`, 4000);
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    if (data && data.status === 'OK' && Array.isArray(data.result) && data.result[0]) {
      const u = data.result[0];
      rankEl.textContent = (u.rank || 'active').toString().toUpperCase();
      ratingEl.textContent = u.rating ? u.rating.toString() : '---';
    } else {
      rankEl.textContent = 'ACTIVE';
      ratingEl.textContent = '---';
    }
  } catch (e) {
    // fallback UI
    if (rankEl) rankEl.textContent = 'ACTIVE';
    if (ratingEl) ratingEl.textContent = '---';
    // keep console message for debugging during development
    console.warn('CF fetch failed:', e);
  }
}
