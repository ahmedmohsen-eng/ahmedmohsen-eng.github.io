import { loadCF } from './codeforces.js';

try {

document.addEventListener('DOMContentLoaded', () => {

  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');

  function updateThemeIcon(){
    themeBtn.textContent = root.classList.contains('light') ? '🌞' : '🌙';
  }
  updateThemeIcon();

  themeBtn?.addEventListener('click',()=>{
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light')?'light':'dark');
    updateThemeIcon();
  });

  /* REVEAL ANIMATION */
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add('active');
    });
  },{threshold:.12});

  document.querySelectorAll('.card,.project-card,.profile,.badge,.lead')
    .forEach(el=>observer.observe(el));

  /* FILTERS */
  document.querySelectorAll('.filters .filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const filter=btn.dataset.filter;

      document.querySelectorAll('.filter-btn')
        .forEach(b=>b.setAttribute('aria-pressed','false'));

      btn.setAttribute('aria-pressed','true');

      document.querySelectorAll('.project-card').forEach(card=>{
        card.style.display=(filter==='all'||card.dataset.category===filter)
          ?'block':'none';
      });
    });
  });

  /* ANIMATED DIAGRAMS (visibility aware) */
  function startAnim(el){
    const nodes=[...el.querySelectorAll('.node')];
    let i=0;
    return setInterval(()=>{
      nodes.forEach(n=>n.classList.remove('active'));
      nodes[i].classList.add('active');
      i=(i+1)%nodes.length;
    },1100);
  }

  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const el=entry.target;

      if(entry.isIntersecting){
        if(!el._interval)
          el._interval=startAnim(el);
      } else{
        clearInterval(el._interval);
        el._interval=null;
      }
    });
  });

  document.querySelectorAll('[data-animate]')
    .forEach(el=>io.observe(el));

  /* COMMAND PALETTE */
  const palette=document.getElementById('palette');
  const input=document.getElementById('paletteInput');
  const list=document.getElementById('paletteList');

  function show(show=true){
    palette.classList.toggle('hidden',!show);
    palette.setAttribute('aria-hidden',(!show).toString());
    if(show){
      setTimeout(()=>input?.focus(),40);
      input.value='';
    }
  }

  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
      e.preventDefault();
      show(true);
    }
    if(e.key==='Escape') show(false);
  });

  list?.querySelectorAll('li').forEach(item=>{
    item.addEventListener('click',()=>{
      const t=item.dataset.go;
      show(false);
      if(!t)return;
      if(t.startsWith('#'))
        document.querySelector(t)?.scrollIntoView({behavior:'smooth'});
      else window.open(t,'_blank');
    });
  });

  /* ENTER TO SELECT */
  input?.addEventListener('keydown',e=>{
    if(e.key==="Enter"){
      const first=list.querySelector('li:not([style*="display: none"])');
      first?.click();
    }
  });

  /* FILTER TEXT */
  input?.addEventListener('input',()=>{
    const q=input.value.toLowerCase();
    list.querySelectorAll('li').forEach(li=>{
      li.style.display=li.textContent.toLowerCase().includes(q)?'':'none';
    });
  });

  /* LOAD CF */
  loadCF('hackgg106');

});

} catch(err){
  console.error("App crashed:",err);
}
