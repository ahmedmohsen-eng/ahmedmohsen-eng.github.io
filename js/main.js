import { loadCF } from './codeforces.js';

document.addEventListener('DOMContentLoaded', () => {

  /* THEME */
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');

  if(btn){
    btn.onclick = () => {
      root.classList.toggle('light');
      localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
    };
  }

  /* CURSOR GLOW */
  const cursor = document.getElementById('cursor');
  if(cursor){
    window.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
  }

  /* SCROLL PROGRESS */
  const bar = document.getElementById('progress');
  if(bar){
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const sc = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = sc + "%";
    });
  }

  /* REVEAL */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('active');
        obs.unobserve(e.target);
      }
    });
  }, {threshold: 0.15});

  document.querySelectorAll('.card,.project-card,.section h2,.profile')
    .forEach(el => {
      el.classList.add('reveal');
      obs.observe(el);
    });

  /* NAV ACTIVE LINK */
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-links a');

  const secObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === "#" + id);
        });
      }
    });
  }, {threshold: 0.4});

  sections.forEach(s => secObs.observe(s));

  /* FILTER BUTTONS */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter; // "backend", "embedded", "ai", or "all"

      projectCards.forEach(card => {
        if(filter === 'all' || card.dataset.category === filter){
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* CODEFORCES */
  loadCF('hackgg106');

});
