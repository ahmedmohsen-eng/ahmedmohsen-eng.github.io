// js/main.js — Central controller
// Theme · Cursor · Progress · Reveal · Skill Bars · Nav · Scroll-top
document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. THEME TOGGLE ──────────────────────────────────── */
  const root    = document.documentElement;
  const themeBt = document.getElementById('themeToggle');
  if (themeBt) {
    const applyTheme = (isLight) => {
      if (isLight) root.classList.add('light');
      else root.classList.remove('light');
      themeBt.textContent = isLight ? '☀️' : '🌙';
      themeBt.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (_) {}
    };
    applyTheme(root.classList.contains('light'));
    themeBt.addEventListener('click', () => applyTheme(!root.classList.contains('light')));
  }

  /* ── 2. CURSOR GLOW ───────────────────────────────────── */
  const cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(hover: hover)').matches) {
    let rx = -9999, ry = -9999, cx = -9999, cy = -9999;
    const lerp = (a, b, t) => a + (b - a) * t;
    window.addEventListener('mousemove', e => { rx = e.clientX; ry = e.clientY; }, { passive: true });
    const track = () => {
      cx = lerp(cx, rx, 0.12);
      cy = lerp(cy, ry, 0.12);
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
      requestAnimationFrame(track);
    };
    requestAnimationFrame(track);
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
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(
    '.card, .skill-card, .project-card, .section h2, .profile-frame, .exp-card, .cert-card, .award-card, .skill-bar-group'
  ).forEach(el => {
    el.classList.add('reveal');
    obs.observe(el);
  });

  /* ── 5. SKILL BARS ────────────────────────────────────── */
  const barObs = new IntersectionObserver((entries, observer) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.querySelectorAll('.skill-bar-fill').forEach(fill => {
          fill.style.width = (fill.dataset.w || 0) + '%';
        });
        observer.unobserve(en.target);
      }
    });
  }, { threshold: 0.2 });

  const skillBarsSection = document.querySelector('.skill-bars');
  if (skillBarsSection) barObs.observe(skillBarsSection);

  /* ── 6. NAV ACTIVE LINK ───────────────────────────────── */
  const sections = document.querySelectorAll('section[id], header[id], footer[id]');
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
  }, { threshold: 0.35, rootMargin: '0px 0px -60% 0px' });

  sections.forEach(s => secObs.observe(s));

  /* ── 7. NAV SOLID ON SCROLL ───────────────────────────── */
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ── 8. SCROLL TO TOP ─────────────────────────────────── */
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
