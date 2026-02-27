import { loadCF } from './codeforces.js';

document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.getElementById('cursor');
    const themeBtn = document.getElementById('themeToggle');
    const progress = document.getElementById('progress');

    // 1. Smooth Cursor
    document.addEventListener('mousemove', e => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
    });

    // 2. Theme Toggle
    themeBtn.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        themeBtn.textContent = isLight ? '☀️' : '🌙';
    });

    // 3. Scroll Progress
    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progress.style.width = (winScroll / height) * 100 + "%";
    });

    // 4. Reactive Project Filter
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projects = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            projects.forEach(card => {
                const match = filter === 'all' || card.dataset.category === filter;
                card.style.display = match ? 'block' : 'none';
            });
        });
    });

    // 5. Command Palette (Ctrl+K)
    const palette = document.getElementById('palette');
    const palInput = document.getElementById('paletteInput');

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            palette.classList.toggle('hidden');
            if(!palette.classList.contains('hidden')) palInput.focus();
        }
        if (e.key === 'Escape') palette.classList.add('hidden');
    });

    document.querySelectorAll('#paletteList li').forEach(item => {
        item.addEventListener('click', () => {
            const go = item.dataset.go;
            if (go.startsWith('#')) document.querySelector(go).scrollIntoView();
            else window.open(go, '_blank');
            palette.classList.add('hidden');
        });
    });

    // 6. Init Codeforces
    loadCF('hackgg106');
});
