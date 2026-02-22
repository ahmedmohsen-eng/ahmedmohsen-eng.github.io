import { loadCF } from './codeforces.js';

document.addEventListener('DOMContentLoaded',()=>{

/* THEME */

const root=document.documentElement;
const btn=document.getElementById('themeToggle');

btn.onclick=()=>{
root.classList.toggle('light');
localStorage.setItem('theme',root.classList.contains('light')?'light':'dark');
};


/* CURSOR GLOW */

const cursor=document.getElementById('cursor');

window.addEventListener('mousemove',e=>{
cursor.style.left=e.clientX+"px";
cursor.style.top=e.clientY+"px";
});


/* SCROLL PROGRESS */

const bar=document.getElementById('progress');

window.addEventListener('scroll',()=>{
const h=document.documentElement;
const sc=h.scrollTop/(h.scrollHeight-h.clientHeight)*100;
bar.style.width=sc+"%";
});


/* REVEAL ANIMATION */

const obs=new IntersectionObserver(entries=>{
entries.forEach(e=>{
if(e.isIntersecting){
e.target.classList.add('active');
obs.unobserve(e.target);
}
});
},{threshold:.15});

document.querySelectorAll('.card,.section h2,.profile')
.forEach(el=>{
el.classList.add('reveal');
obs.observe(el);
});


/* NAV ACTIVE LINK */

const sections=document.querySelectorAll('.section-track');
const navLinks=document.querySelectorAll('.nav-links a');

const secObs=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
const id=entry.target.id;
navLinks.forEach(a=>{
a.classList.toggle('active',a.getAttribute('href')==="#"+id);
});
}
});
},{threshold:.55});

sections.forEach(s=>secObs.observe(s));


/* CODEFORCES */

loadCF('hackgg106');

});
