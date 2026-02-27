import { loadCF } from './codeforces.js';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    
    // Theme Logic
    document.getElementById('themeToggle').addEventListener('click', () => {
        root.classList.toggle('light');
        localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
    });

    // Filtering Logic (Fixed syntax/Reactive issues)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projects = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            // Update UI
            filterBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
            btn.setAttribute('aria-pressed', 'true');

            projects.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => card.style.opacity = '1', 10);
                } else {
                    card.style.opacity = '0';
                    setTimeout(() => card.style.display = 'none', 300);
                }
            });
        });
    });

    // Smooth Scroll Progress
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.getElementById("progress").style.width = scrolled + "%";
    });

    // Custom Cursor (Desktop only)
    if (window.innerWidth > 768) {
        window.addEventListener('mousemove', e => {
            const cursor = document.getElementById('cursor');
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
    }

    loadCF('hackgg106');
});
