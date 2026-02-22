// js/main.js
// Entry point: handles theme toggle, intersection reveals, filters, animated diagrams, palette, and CF load.

import { loadCF } from './codeforces.js';

document.addEventListener('DOMContentLoaded', () => {
  /* THEME TOGGLE */
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');

  function updateThemeIcon() {
    if (root.classList.contains('light')) themeBtn.textContent = '🌞';
    else themeBtn.textContent = '🌙';
  }
  updateThemeIcon();

  themeBtn?.addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
    updateThemeIcon();
  });

  /* INTERSECTION OBSERVER: reveal animations for .reveal if used */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('active');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.card, .project-card, .profile, .badge, .lead').forEach(el => observer.observe(el));

  /* FILTERS */
  document.querySelectorAll('.filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      // update pressed states
      document.querySelectorAll('.filter-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');

      document.querySelectorAll('.project-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? 'block' : 'none';
      });
    });
  });

  /* ANIMATED ARCH DIAGRAMS */
  document.querySelectorAll('[data-animate]').forEach(diagram => {
    const nodes = Array.from(diagram.querySelectorAll('.node'));
    if (!nodes.length) return;
    let i = 0;
    // start immediately, but keep reference so we can stop if necessary
    const interval = setInterval(() => {
      nodes.forEach(n => n.classList.remove('active'));
      nodes[i].classList.add('active');
      i = (i + 1) % nodes.length;
    }, 1100);
    // store interval on element in case you want to clear later
    diagram._interval = interval;
  });

  /* COMMAND PALETTE */
  const palette = document.getElementById('palette');
  const paletteInput = document.getElementById('paletteInput');
  const paletteList = document.getElementById('paletteList');

  function showPalette(show = true) {
    if (!palette) return;
    palette.classList.toggle('hidden', !show);
    palette.setAttribute('aria-hidden', (!show).toString());
    if (show) {
      setTimeout(() => paletteInput?.focus(), 40);
      paletteInput.value = '';
    }
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      showPalette(true);
    }
    if (e.key === 'Escape') showPalette(false);
  });

  // clicking list items
  paletteList?.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.go;
      showPalette(false);
      if (!target) return;
      if (target.startsWith('#')) document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
      else window.open(target, '_blank');
    });
  });

  // simple input fuzzy match (filter list)
  paletteInput?.addEventListener('input', () => {
    const q = paletteInput.value.trim().toLowerCase();
    const items = Array.from(paletteList.querySelectorAll('li'));
    items.forEach(li => {
      const text = li.textContent.toLowerCase();
      li.style.display = text.includes(q) ? '' : 'none';
    });
  });

  /* LOAD CODEFORCES DATA (robust) */
  loadCF('hackgg106');
});
