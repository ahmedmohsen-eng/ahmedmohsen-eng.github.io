import { loadCF } from './codeforces.js';

document.addEventListener('DOMContentLoaded',()=>{

/* THEME */
const root=document.documentElement;
const btn=document.getElementById('themeToggle');

function icon(){
  btn.textContent=root.classList.contains('light')?'🌞':'🌙';
}
icon();

btn.onclick=()=>{
  root.classList.toggle('light');
  localStorage.setItem('theme',root.classList.contains('light')?'light':'dark');
  icon();
};

/* SCROLL REVEAL (stagger system) */

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.15});

document.querySelectorAll('.card,.project-card,.profile,.badge,.lead')
.forEach((el,i)=>{
  el.classList.add('reveal');
  el.classList.add(`reveal-delay-${(i%4)+1}`);
  observer.observe(el);
});


/* FILTER ENGINE — pro version */

const cards=[...document.querySelectorAll('.project-card')];

document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{

    const filter=btn.dataset.filter;

    document.querySelectorAll('.filter-btn')
    .forEach(b=>b.setAttribute('aria-pressed','false'));

    btn.setAttribute('aria-pressed','true');

    cards.forEach(card=>{
      const show=(filter==='all'||card.dataset.category===filter);

      if(show){
        card.style.display='block';
        requestAnimationFrame(()=>{
          card.style.opacity='1';
          card.style.transform='scale(1)';
        });
      }else{
        card.style.opacity='0';
        card.style.transform='scale(.92)';
        setTimeout(()=>card.style.display='none',250);
      }
    });

  });
});


/* DIAGRAM LOOP */

document.querySelectorAll('[data-animate]').forEach(diagram=>{
  const nodes=[...diagram.querySelectorAll('.node')];
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
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){
    e.preventDefault();
    show(true);
  }
  if(e.key==='Escape')show(false);
});


/* LOAD CF */
loadCF('hackgg106');

});
