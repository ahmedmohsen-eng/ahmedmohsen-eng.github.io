export async function loadCF(handle = 'hackgg106') {
    const ratingEl = document.getElementById('cf-rating');
    const rankEl = document.getElementById('cf-rank');

    try {
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        const data = await res.json();

        if (data.status === "OK") {
            const u = data.result[0];
            if (rankEl) rankEl.textContent = (u.rank || 'active').toUpperCase();
            if (ratingEl) {
                ratingEl.textContent = u.rating || '---';
                ratingEl.style.color = u.rating >= 1200 ? '#38bdf8' : '#94a3b8';
            }
        }
    } catch (e) {
        if (rankEl) rankEl.textContent = 'ACTIVE';
        if (ratingEl) ratingEl.textContent = '---';
        console.warn('Codeforces fetch failed:', e);
    }
}
