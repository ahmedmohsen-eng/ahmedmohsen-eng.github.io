document.addEventListener('DOMContentLoaded', () => {
  // Theme
  const root=document.documentElement, tb=document.getElementById('themeToggle');
  if(tb){
    const apply=l=>{l?root.classList.add('light'):root.classList.remove('light');tb.textContent=l?'☀️':'🌙';tb.setAttribute('aria-label',l?'Switch to dark mode':'Switch to light mode');try{localStorage.setItem('theme',l?'light':'dark');}catch(_){}};
    apply(root.classList.contains('light'));
    tb.addEventListener('click',()=>apply(!root.classList.contains('light')));
  }
  // Cursor
  const cur=document.getElementById('cursor');
  if(cur&&window.matchMedia('(hover:hover)').matches){
    let rx=-9999,ry=-9999,cx=-9999,cy=-9999;
    const lerp=(a,b,t)=>a+(b-a)*t;
    window.addEventListener('mousemove',e=>{rx=e.clientX;ry=e.clientY;},{passive:true});
    const tr=()=>{cx=lerp(cx,rx,0.12);cy=lerp(cy,ry,0.12);cur.style.left=cx+'px';cur.style.top=cy+'px';requestAnimationFrame(tr);};
    requestAnimationFrame(tr);
  } else if(cur) cur.style.display='none';
  // Progress bar
  const bar=document.getElementById('progress');
  if(bar){const u=()=>{const d=document.documentElement,m=d.scrollHeight-d.clientHeight;bar.style.width=m>0?(d.scrollTop/m)*100+'%':'0%';};window.addEventListener('scroll',u,{passive:true});u();}
  // Reveal
  const ro=new IntersectionObserver((es,obs)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('active');obs.unobserve(e.target);}});},{threshold:0.1,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.card,.skill-card,.project-card,.section h2,.profile-frame,.exp-card,.cert-card,.award-card,.cf-viz-card').forEach(el=>{el.classList.add('reveal');ro.observe(el);});
  // Skill bars
  const allBars=document.querySelectorAll('.skill-bar-group');
  const bo=new IntersectionObserver((es,obs)=>{es.forEach(e=>{if(e.isIntersecting){const f=e.target.querySelector('.skill-bar-fill');if(f){const i=Array.from(allBars).indexOf(e.target);setTimeout(()=>{f.style.width=(f.dataset.w||0)+'%';},i*120);}e.target.classList.add('active');obs.unobserve(e.target);}});},{threshold:0.15});
  allBars.forEach(g=>bo.observe(g));
  // Nav active
  const nl=document.querySelectorAll('.nav-links a');
  const so=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const id=e.target.id;nl.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));}});},{threshold:0.35,rootMargin:'0px 0px -60% 0px'});
  document.querySelectorAll('section[id],header[id],footer[id]').forEach(s=>so.observe(s));
  // Scroll top
  const st=document.getElementById('scrollTop');
  if(st){window.addEventListener('scroll',()=>st.classList.toggle('visible',window.scrollY>400),{passive:true});st.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));}
});
