(() => {
  const $ = s => document.querySelector(s);
  const book = $('#book');
  if (!book) return;
  const mobile = matchMedia('(max-width: 700px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = [
    ['table-matieres', [2], 'Tabla de contenidos'],
    ['sommaire', [3,4], 'Índice detallado'],
    ['unite-1', [5,6,7,8,9,10,11], 'Unidad 1'],
    ['examen-a', [87,88,89,90,91], 'Examen A'],
    ['autoevaluation', [91], 'Autoevaluación']
  ];
  const pages = groups.flatMap(([key, numbers, title]) => numbers.map(n => ({src:`/assets/manual-a2/${key}-${n}.webp`, title, n})));
  const left = $('#left-page'), right = $('#right-page'), leaf = $('#leaf');
  let current = 0, busy = false, opened = false, autoTimer, gesture;
  const end = () => mobile.matches ? pages.length - 1 : pages.length;
  const intro = '<div class="book-inside"><img src="/pathway-mark.svg" alt="Pathway"><small>Manuel de français · A2</small><h2>Le français,<br>page après page.</h2><p>Extraits du manuel original.<br>64 unités · 4 segments</p><small>Pathway Language Solutions</small></div>';
  const outro = '<div class="book-inside"><small>La suite commence avec vous</small><h2>Un nouveau chapitre.</h2><p>Découvrez votre point de départ avec un professeur Pathway.</p><a href="/test-placement.html">Evaluar mi nivel →</a></div>';
  function markup(i) {
    if (i < 0) return intro;
    if (i >= pages.length) return outro;
    const p = pages[i];
    return `<img class="page-art${[9,10,14,15].includes(i)?' cropped':''}" src="${p.src}" alt="${p.title} · página ${p.n} del manual A2" draggable="false">`;
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
    const index = current >= 15 ? 15 : current >= 10 ? 10 : current >= 3 ? 3 : current >= 1 ? 1 : 0;
    $('#chapter').value = String(index);
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
      const animation=leaf.animate([
        {transform:'rotateY(0deg)',filter:'brightness(1)'},
        {transform:`rotateY(${forward?-85:85}deg)`,filter:'brightness(.88)',offset:.5},
        {transform:`rotateY(${forward?-180:180}deg)`,filter:'brightness(1)'}
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
  mobile.addEventListener('change',()=>{ if(busy){setTimeout(()=>{current=Math.min(mobile.matches?current:Math.ceil(current/2)*2,end());render();},1200);return;}current=Math.min(mobile.matches?current:Math.ceil(current/2)*2,end());render(); });
  render();
  autoTimer=setTimeout(open,reduced.matches?0:850);
})();
