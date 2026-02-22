// js/main.js

import { loadCF } from './codeforces.js';

document.addEventListener('DOMContentLoaded', () => {

  /* THEME */
  const root=document.documentElement;
  const themeBtn=document.getElementById('themeToggle');

  function updateIcon(){
    themeBtn.textContent=root.classList.contains('light')?'🌞':'🌙';
  }
  updateIcon();

  themeBtn?.addEventListener('click',()=>{
    root.classList.toggle('light');
    localStorage.setItem('theme',root.classList.contains('light')?'light':'dark');
    updateIcon();
  });

  /* REVEAL ON SCROLL */
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add('active');
    });
  },{threshold:.12});

  document.querySelectorAll('.card,.project-card,.profile,.badge,.lead')
  .forEach(el=>{
    el.classList.add('reveal');
    observer.observe(el);
  });

  /* FILTER PROJECTS — FIXED */
  const cards=[...document.querySelectorAll('.project-card')];

  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{

      const filter=btn.dataset.filter;

      document.querySelectorAll('.filter-btn')
      .forEach(b=>b.setAttribute('aria-pressed','false'));

      btn.setAttribute('aria-pressed','true');

      cards.forEach(card=>{
        const match=(filter==='all'||card.dataset.category===filter);

        if(match){
          card.style.display='block';
          requestAnimationFrame(()=>{
            card.style.opacity='1';
            card.style.transform='scale(1)';
          });
        }else{
          card.style.opacity='0';
          card.style.transform='scale(.96)';
          setTimeout(()=>card.style.display='none',180);
        }
      });

    });
  });

  /* ARCH DIAGRAM ANIMATION */
  document.querySelectorAll('[data-animate]').forEach(diagram=>{
    const nodes=[...diagram.querySelectorAll('.node')];
    if(!nodes.length)return;
    let i=0;

    setInterval(()=>{
      nodes.forEach(n=>n.classList.remove('active'));
      nodes[i].classList.add('active');
      i=(i+1)%nodes.length;
    },1100);
  });

  /* COMMAND PALETTE */
  const palette=document.getElementById('palette');
  const input=document.getElementById('paletteInput');

  function show(v){
    palette.classList.toggle('hidden',!v);
    if(v)setTimeout(()=>input.focus(),40);
  }

  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
      e.preventDefault();
      show(true);
    }
    if(e.key==='Escape')show(false);
  });

  /* LOAD CF */
  loadCF('hackgg106');

});
