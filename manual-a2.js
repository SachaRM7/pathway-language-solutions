(() => {
  const $ = s => document.querySelector(s);
  const book = $('#book');
  if (!book) return;
  const shell = $('#manual');
  const fullscreenButton = $('#fullscreen-open');
  const mobile = matchMedia('(max-width: 700px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pages = window.PathwayManualPages;
  if (!Array.isArray(pages) || !pages.length) return;
  const left = $('#left-page'), right = $('#right-page'), leaf = $('#leaf');
  let current = 0, busy = false, opened = false, autoTimer, gesture;
  const end = () => mobile.matches ? pages.length - 1 : pages.length;
  const intro = '<div class="book-inside"><img src="/pathway-mark.svg" alt="Pathway"><small>Manuel de français · A2</small><h2>Le français,<br>page après page.</h2><p>Extraits du manuel original.<br>64 unités · 4 segments</p><small>Pathway Language Solutions</small></div>';
  const outro = '<div class="book-inside"><small>La suite commence avec vous</small><h2>Un nouveau chapitre.</h2><p>Découvrez votre point de départ avec un professeur Pathway.</p><a href="/test-placement.html">Evaluar mi nivel →</a></div>';
  function markup(i) {
    if (i < 0) return intro;
    if (i >= pages.length) return outro;
    const p = pages[i];
    return `<img class="page-art" src="${p.src}" alt="${p.title} · página ${p.n} del manual A2" draggable="false">`;
  }
  function sync() {
    $('#previous').disabled = $('#edge-prev').disabled = busy || !opened || current === 0;
    $('#next').disabled = $('#edge-next').disabled = busy || !opened || current >= end();
    $('#zoom-open').disabled = busy || !opened;
    $('#chapter').disabled = busy;
    const p = pages[Math.min(current, pages.length-1)];
    const prev = !mobile.matches && current > 0 ? pages[current-1] : null;
    $('#page-label').textContent = opened ? `${p.title} · ${prev && prev.n !== p.n ? `p. ${prev.n} / ${p.n}` : `p. ${p.n}`}` : 'Manuel de français · A2';
    $('#progress').style.width = opened ? `${Math.min((current+1)/pages.length,1)*100}%` : '0%';
    const chapterStart = pages.findIndex(page => page.key === p.key);
    $('#chapter').value = String(chapterStart);
  }
  function render() { left.innerHTML = markup(current-1); right.innerHTML = markup(current); sync(); }
  async function prepare(indices) {
    await Promise.all(indices.filter(i=>pages[i]).map(async i => { const img = new Image(); img.src=pages[i].src; try { await img.decode(); } catch {} }));
  }
  async function open() {
    clearTimeout(autoTimer);
    if (opened || busy) return;
    busy=true; sync();
    await prepare([current-1,current]);
    book.classList.remove('is-closed');
    requestAnimationFrame(() => book.classList.add('is-open'));
    opened=true;
    await new Promise(resolve=>setTimeout(resolve,reduced.matches?0:1150));
    busy=false; sync();
    $('#cover').tabIndex=-1; $('#cover').hidden=true;
    prepare([current+1,current+2]);
  }
  async function turn(target) {
    clearTimeout(autoTimer);
    if (busy) return;
    if (!opened) await open();
    if (mobile.matches) target=Math.max(0,Math.min(target,end()));
    else target=Math.max(0,Math.min(Math.ceil(target/2)*2,end()));
    if (target===current) return;
    busy=true; sync();
    await prepare([target-1,target]);
    const forward=target>current;
    leaf.className=`turning-leaf ${forward?'forward':'backward'}`;
    leaf.querySelector('.leaf-front').innerHTML=markup(mobile.matches?current:forward?current:current-1);
    leaf.querySelector('.leaf-back').innerHTML=markup(mobile.matches?target:forward?target-1:target);
    if (mobile.matches || forward) right.innerHTML=markup(target);
    else left.innerHTML=markup(target-1);
    if (!reduced.matches) {
      // Filters flatten the 3D faces, making the front appear mirrored on the back.
      // Keep shading on the face pseudo-elements and animate only the rotation.
      const animation=leaf.animate([
        {transform:'rotateY(0deg)'},
        {transform:`rotateY(${forward?-85:85}deg)`,offset:.5},
        {transform:`rotateY(${forward?-180:180}deg)`}
      ],{duration:820,easing:'cubic-bezier(.25,.65,.3,1)',fill:'forwards'});
      try {await animation.finished;} catch {}
      animation.cancel();
    }
    current=target;leaf.className='turning-leaf';busy=false;render();
    prepare([current+1,current+2]);
  }
  const step=direction=>turn(current+direction*(mobile.matches?1:2));
  $('#previous').onclick=$('#edge-prev').onclick=()=>step(-1);
  $('#next').onclick=$('#edge-next').onclick=()=>step(1);
  $('#cover').onclick=open;
  $('#chapter').onchange=e=>turn(Number(e.target.value));
  $('#close-book').onclick=()=>{ if(busy) return; clearTimeout(autoTimer);opened=false;$('#cover').hidden=false;book.classList.remove('is-open');book.classList.add('is-closed');$('#cover').tabIndex=0;sync(); };
  book.addEventListener('keydown',e=>{
    if (e.target.closest('a,select')) return;
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}
  });
  book.addEventListener('pointerdown',e=>{if(e.isPrimary) gesture={x:e.clientX,y:e.clientY};});
  book.addEventListener('pointerup',e=>{
    if(!gesture)return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;
    if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.4){ e.preventDefault();step(dx<0?1:-1); }
  });
  book.addEventListener('pointercancel',()=>gesture=null);
  const dialog=$('#page-zoom');
  $('#zoom-open').onclick=()=>{
    $('#zoom-content').innerHTML=(mobile.matches?'':markup(current-1))+markup(current);
    $('#zoom-label').textContent=$('#page-label').textContent;
    dialog.showModal();
  };
  $('#zoom-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  const nativeFullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const setReaderFullscreen=active=>{
    shell.classList.toggle('is-reader-fullscreen',active);
    document.documentElement.classList.toggle('manual-fullscreen-active',active);
    document.body.classList.toggle('manual-fullscreen-active',active);
    fullscreenButton.setAttribute('aria-pressed',String(active));
    fullscreenButton.setAttribute('aria-label',active?'Salir de la pantalla completa':'Abrir el manual en pantalla completa');
    $('#fullscreen-label').textContent=active?'Salir':'Pantalla completa';
    $('#fullscreen-icon').textContent=active?'×':'↗';
    if(active) shell.scrollTop=0;
  };
  fullscreenButton.onclick=async()=>{
    const active=shell.classList.contains('is-reader-fullscreen');
    if(active){
      try {
        if(nativeFullscreenElement()&&document.exitFullscreen) await document.exitFullscreen();
        else if(nativeFullscreenElement()&&document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch {}
      setReaderFullscreen(false);
      return;
    }
    setReaderFullscreen(true);
    try {
      if(shell.requestFullscreen) await shell.requestFullscreen();
      else if(shell.webkitRequestFullscreen) shell.webkitRequestFullscreen();
    } catch {
      // Keep the fixed overlay when element fullscreen is unavailable,
      // notably on some iOS Safari versions.
    }
  };
  const syncNativeFullscreen=()=>{
    if(nativeFullscreenElement()===shell) setReaderFullscreen(true);
    else if(nativeFullscreenElement()==null&&shell.classList.contains('is-reader-fullscreen')) setReaderFullscreen(false);
  };
  document.addEventListener('fullscreenchange',syncNativeFullscreen);
  document.addEventListener('webkitfullscreenchange',syncNativeFullscreen);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&shell.classList.contains('is-reader-fullscreen')&&!nativeFullscreenElement()&&!dialog.open) setReaderFullscreen(false);
  });
  mobile.addEventListener('change',()=>{ if(busy){setTimeout(()=>{current=Math.min(mobile.matches?current:Math.ceil(current/2)*2,end());render();},1200);return;}current=Math.min(mobile.matches?current:Math.ceil(current/2)*2,end());render(); });
  render();
  // Count the reading time only once the actual cover image is visible.
  $('#cover img').decode().catch(() => {}).then(() => {
    if (!opened && !busy) autoTimer=setTimeout(open,4000);
  });
})();
