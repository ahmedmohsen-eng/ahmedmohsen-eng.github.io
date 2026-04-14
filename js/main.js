// js/main.js — Central controller
// Theme · Cursor · Progress · Reveal · Filter · Nav · Palette · CF · Scroll-top
document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. THEME TOGGLE ──────────────────────────────────── */
  const root    = document.documentElement;
  const themeBt = document.getElementById('themeToggle');
  if (themeBt) {
    const applyTheme = (isLight) => {
      if (isLight) {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
      themeBt.textContent = isLight ? '☀️' : '🌙';
      themeBt.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (_) {}
    };

    // Set initial icon based on current class (set by inline script)
    applyTheme(root.classList.contains('light'));

    themeBt.addEventListener('click', () => {
      applyTheme(!root.classList.contains('light'));
    });
  }

  /* ── 2. CURSOR GLOW (mouse-only devices) ─────────────── */
  const cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(hover: hover)').matches) {
    let rx = -9999, ry = -9999;
    const lerp = (a, b, t) => a + (b - a) * t;
    let cx = -9999, cy = -9999;
    window.addEventListener('mousemove', e => {
      rx = e.clientX;
      ry = e.clientY;
    }, { passive: true });
    const trackCursor = () => {
      cx = lerp(cx, rx, 0.12);
      cy = lerp(cy, ry, 0.12);
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
      requestAnimationFrame(trackCursor);
    };
    requestAnimationFrame(trackCursor);
  } else if (cursor) {
    cursor.style.display = 'none';
  }

  /* ── 3. SCROLL PROGRESS BAR ───────────────────────────── */
  const bar = document.getElementById('progress');
  if (bar) {
    const updateBar = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      bar.style.width = max > 0 ? (doc.scrollTop / max) * 100 + '%' : '0%';
    };
    window.addEventListener('scroll', updateBar, { passive: true });
    updateBar();
  }

  /* ── 4. INTERSECTION OBSERVER — REVEAL ───────────────── */
  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('active');
        observer.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(
    '.card, .skill-card, .project-card, .project-body, .section h2, .profile-frame'
  ).forEach(el => {
    el.classList.add('reveal');
    obs.observe(el);
  });

  /* ── 6. NAV ACTIVE LINK ───────────────────────────────── */
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const secObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.4, rootMargin: '0px 0px -60% 0px' });

  sections.forEach(s => secObs.observe(s));

  /* ── 7. COMMAND PALETTE (Ctrl/Cmd+K) ─────────────────── */
  const palette  = document.getElementById('palette');
  const palInput = document.getElementById('paletteInput');

  if (palette && palInput) {
    const openPalette = () => {
      palette.classList.remove('hidden');
      palette.removeAttribute('aria-hidden');
      palInput.value = '';
      palInput.focus();
    };
    const closePalette = () => {
      palette.classList.add('hidden');
      palette.setAttribute('aria-hidden', 'true');
    };

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        palette.classList.contains('hidden') ? openPalette() : closePalette();
      }
      if (e.key === 'Escape') closePalette();
    });

    palette.addEventListener('click', e => {
      if (e.target === palette) closePalette();
    });

    document.querySelectorAll('#paletteList li').forEach(item => {
      item.addEventListener('click', () => {
        const dest = item.dataset.go;
        if (dest.startsWith('#')) {
          const el = document.querySelector(dest);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.open(dest, '_blank', 'noopener,noreferrer');
        }
        closePalette();
      });
    });

    palInput.addEventListener('input', () => {
      const q = palInput.value.toLowerCase();
      document.querySelectorAll('#paletteList li').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ── 9. SCROLL TO TOP ─────────────────────────────────── */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
