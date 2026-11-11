(function(){
  var body=document.body, root=document.documentElement, head=document.getElementById('head');
  var INTRO_MS=6000, timer;
  function finish(){root.classList.add('done');try{sessionStorage.setItem('am_intro','1')}catch(e){}}
  function skip(){clearTimeout(timer);root.classList.add('skip');finish()}
  function play(){                   // restart the CSS intro from the beginning
    root.classList.add('skip'); void root.offsetWidth;
    root.classList.remove('skip','done');
    clearTimeout(timer);timer=setTimeout(finish,INTRO_MS);
  }
  document.getElementById('skip').onclick=skip;
  document.getElementById('replay').onclick=function(){window.scrollTo({top:0});play()};
  if(!root.classList.contains('skip'))timer=setTimeout(finish,INTRO_MS);

  // Scrolling past the hero during the intro skips straight to the final frame
  window.addEventListener('scroll',function(){
    if(!root.classList.contains('skip')&&!root.classList.contains('done')&&scrollY>window.innerHeight*.25)skip();
    head.classList.toggle('solid',scrollY>60);
    document.getElementById('callbar').classList.toggle('show',scrollY>window.innerHeight*.8);
  },{passive:true});

  // Mobile menu
  var nav=document.getElementById('nav'),mb=document.getElementById('menuBtn');
  var scrim=document.getElementById('scrim');
  function setMenu(o){nav.classList.toggle('open',o);scrim.classList.toggle('open',o);mb.setAttribute('aria-expanded',o)}
  mb.onclick=function(){setMenu(!nav.classList.contains('open'))};
  scrim.onclick=function(){setMenu(false)};
  nav.addEventListener('click',function(e){if(e.target.tagName==='A')setMenu(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});

  // Fleet filters (filtering itself is done in CSS; this adds the count, dots and animation)
  var cars=document.querySelectorAll('.car'),radios=document.querySelectorAll('.filters input');
  var NAMES={all:'cars',corvette:'Corvettes',exotic:'exotics',suv:'luxury SUVs',everyday:'everyday cars'};
  function current(){var r=document.querySelector('.filters input:checked');return r?r.value:'all'}
  function applyFilter(anim){
    var f=current();
    // fallback for older browsers without :has()
    cars.forEach(function(c){c.classList.toggle('hide',f!=='all'&&c.dataset.c!==f)});
    var n=visible().length;
    document.getElementById('fleetCount').innerHTML='Showing <b>'+n+'</b> '+(n===1?NAMES[f].replace(/s$/,''):NAMES[f]);
    grid.scrollLeft=0; buildDots();
    if(anim){grid.classList.remove('refresh');void grid.offsetWidth;grid.classList.add('refresh')}
  }
  radios.forEach(function(r){r.addEventListener('change',function(){
    applyFilter(true);
    var top=document.getElementById('fleet').getBoundingClientRect().top;
    if(top<-200||top>window.innerHeight*.5)document.querySelector('#fleet .head-split').scrollIntoView({behavior:'smooth'});
  })});

  // Swipe dots for the phone carousel
  var grid=document.getElementById('fleetGrid'),dots=document.getElementById('dots');
  function visible(){return [].filter.call(cars,function(c){return getComputedStyle(c).display!=='none'})}
  function buildDots(){dots.innerHTML='';visible().forEach(function(_,i){dots.appendChild(document.createElement('i'))});markDot()}
  function markDot(){
    var v=visible(),w=v.length?v[0].offsetWidth+12:1,i=Math.round(grid.scrollLeft/w);
    [].forEach.call(dots.children,function(d,k){d.classList.toggle('on',k===Math.min(i,v.length-1))});
  }
  grid.addEventListener('scroll',markDot,{passive:true});
  applyFilter(false);

  // Reveal on scroll
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  }else{document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in')})}

  // Highlight the matching protection plan
  document.querySelectorAll('.plan-link').forEach(function(a){a.addEventListener('click',function(e){
    e.preventDefault();
    var p=document.getElementById('plan-'+a.dataset.plan);
    document.querySelectorAll('.plan').forEach(function(x){x.classList.remove('focus')});
    p.classList.add('focus');
    document.getElementById('protection').scrollIntoView({behavior:'smooth'});
    var row=p.parentNode; if(row.scrollWidth>row.clientWidth){setTimeout(function(){row.scrollTo({left:p.offsetLeft-16,behavior:'smooth'})},450)}
    setTimeout(function(){p.classList.remove('focus')},3500);
  })});

  /* ================= Call / Text window ================= */
  var cm=document.getElementById('cm'),cmLast=null;
  function cmOpen(mode){
    cm.dataset.mode=mode; cmLast=document.activeElement;
    body.classList.add('cm-open'); cm.setAttribute('aria-hidden','false');
    if(typeof setMenu==='function')setMenu(false);
    setTimeout(function(){document.getElementById('cmCopyNum').focus({preventScroll:true})},60);
  }
  function cmClose(){
    cm.classList.remove('req');body.classList.remove('cm-open'); cm.setAttribute('aria-hidden','true');
    if(cmLast&&cmLast.focus)cmLast.focus({preventScroll:true});
  }
  // Phones: Call / Text open the phone or Messages app right away.
  // Computers (which can't place calls): show the window with the number instead.
  var isPhone=/iPhone|iPod|Android.*Mobile|Windows Phone|Mobi/i.test(navigator.userAgent)||
    (window.matchMedia&&matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<=600);
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href^="tel:"],a[href^="sms:"]');
    if(!a||a.hasAttribute('data-direct')||isPhone)return;
    e.preventDefault(); cmOpen(a.getAttribute('href').indexOf('sms:')===0?'sms':'tel');
  });
  document.getElementById('cmClose').onclick=cmClose;
  document.getElementById('cmScrim').onclick=cmClose;
  document.getElementById('cmSwap').onclick=function(){cm.dataset.mode=cm.dataset.mode==='tel'?'sms':'tel'};
  document.addEventListener('keydown',function(e){
    if(!body.classList.contains('cm-open'))return;
    if(e.key==='Escape'){e.preventDefault();cmClose();}
    if(e.key==='Tab'){
      var f=[].filter.call(cm.querySelectorAll('button,a[href],textarea'),function(x){return x.offsetParent!==null});
      var a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    }
  });
  function copy(text,btn){
    function done(){var l=btn.querySelector('span'),o=l.textContent;btn.classList.add('ok');l.textContent='Copied!';
      setTimeout(function(){btn.classList.remove('ok');l.textContent=o},1800)}
    function fallback(){var t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;opacity:0';
      cm.appendChild(t);t.select();try{document.execCommand('copy')}catch(err){}cm.removeChild(t);done()}
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(done,fallback);else fallback();
  }
  document.getElementById('cmCopyNum').onclick=function(){copy('(480) 467-3485',this)};
  document.getElementById('cmCopyMsg').onclick=function(){copy(document.getElementById('cmText').value.trim(),this)};
  // Keep the "Text from this device" link in sync with the message they wrote
  var cmText=document.getElementById('cmText'),cmSms=document.getElementById('cmSmsDirect');
  function syncSms(){cmSms.href='sms:+14804673485?&body='+encodeURIComponent(cmText.value.trim())}
  cmText.addEventListener('input',syncSms); syncSms();

  /* ================= Car photo viewer ================= */
  var gv=document.getElementById('gv'),gvImg=document.getElementById('gvImg'),gvCar=null,gvView='exterior',gvI=0,gvLast=null,gvSets={};
  function list(v){return (v||'').split('|').map(function(x){return x.trim()}).filter(Boolean)}
  function gvRender(){
    var set=gvSets[gvView],n=set.length;
    gv.classList.toggle('empty',!n);
    [].forEach.call(gv.querySelectorAll('.gv-tabs button'),function(b){b.setAttribute('aria-selected',b.dataset.view===gvView)});
    document.getElementById('gvPrev').hidden=document.getElementById('gvNext').hidden=n<2;
    document.getElementById('gvCount').textContent=n>1?(gvI+1)+' / '+n:'';
    var th=document.getElementById('gvThumbs');th.innerHTML='';
    if(n>1)set.forEach(function(src,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Photo '+(i+1));
      b.setAttribute('aria-current',i===gvI);var im=document.createElement('img');im.src=src;im.alt='';b.appendChild(im);
      b.onclick=function(){gvI=i;gvRender()};th.appendChild(b)});
    if(n){gvImg.classList.add('fade');var src=set[gvI];
      setTimeout(function(){gvImg.src=src;gvImg.alt=document.getElementById('gvTitle').textContent+' '+gvView+' photo '+(gvI+1);gvImg.classList.remove('fade')},n>1?120:0)}
  }
  function gvOpen(card){
    gvCar=card;gvLast=document.activeElement;
    gvSets={exterior:list(card.dataset.exterior),interior:list(card.dataset.interior)};
    if(!gvSets.exterior.length)gvSets.exterior=[card.querySelector('figure img').getAttribute('src')];
    document.getElementById('gvNExt').textContent=gvSets.exterior.length>1?' '+gvSets.exterior.length:'';
    document.getElementById('gvNInt').textContent=gvSets.interior.length?' '+gvSets.interior.length:'';
    document.getElementById('gvTag').textContent=card.querySelector('.tag').textContent;
    document.getElementById('gvTitle').textContent=card.querySelector('h3').textContent;
    document.getElementById('gvDesc').textContent=card.querySelector('.car-body p').textContent;
    document.getElementById('gvPlan').innerHTML=card.querySelector('.plan-link').innerHTML;
    document.getElementById('gvRate').innerHTML=card.querySelector('.rate').innerHTML;
    gvView='exterior';gvI=0;gvImg.removeAttribute('src');gvRender();
    body.classList.add('gv-open');gv.setAttribute('aria-hidden','false');
    setTimeout(function(){document.getElementById('gvClose').focus({preventScroll:true})},60);
  }
  function gvClose(){body.classList.remove('gv-open');gv.setAttribute('aria-hidden','true');if(gvLast&&gvLast.focus)gvLast.focus({preventScroll:true})}
  function gvStep(d){var n=gvSets[gvView].length;if(n<2)return;gvI=(gvI+d+n)%n;gvRender()}
  document.getElementById('fleetGrid').addEventListener('click',function(e){
    if(e.target.closest('a,label'))return;              // links and category labels keep their own job
    var hit=e.target.closest('.car-view,.car figure,.car h3'); if(!hit)return;
    gvOpen(hit.closest('.car'));
  });
  document.getElementById('gvClose').onclick=gvClose;
  document.getElementById('gvScrim').onclick=gvClose;
  document.getElementById('gvPrev').onclick=function(){gvStep(-1)};
  document.getElementById('gvNext').onclick=function(){gvStep(1)};
  [].forEach.call(gv.querySelectorAll('.gv-tabs button'),function(b){b.onclick=function(){gvView=b.dataset.view;gvI=0;gvRender()}});
  document.getElementById('gvPlan').onclick=function(e){e.preventDefault();gvClose();var l=gvCar&&gvCar.querySelector('.plan-link');if(l)setTimeout(function(){l.click()},250)};
  var gvX0=null;
  document.getElementById('gvStage').addEventListener('touchstart',function(e){gvX0=e.touches[0].clientX},{passive:true});
  document.getElementById('gvStage').addEventListener('touchend',function(e){if(gvX0===null)return;var dx=e.changedTouches[0].clientX-gvX0;if(Math.abs(dx)>40)gvStep(dx<0?1:-1);gvX0=null},{passive:true});
  document.addEventListener('keydown',function(e){
    if(!body.classList.contains('gv-open')||e.defaultPrevented||body.classList.contains('cm-open'))return;
    if(e.key==='Escape')gvClose();
    if(e.key==='ArrowRight')gvStep(1);
    if(e.key==='ArrowLeft')gvStep(-1);
    if(e.key==='Tab'){var f=[].filter.call(gv.querySelectorAll('button,a[href]'),function(x){return x.offsetParent!==null&&!x.hidden});
      var a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
  });

  /* ================= Pick your dates ================= */
  var bkForm=document.getElementById('bookForm'),bkCar=document.getElementById('bkCar'),bkFrom=document.getElementById('bkFrom'),
      bkTo=document.getElementById('bkTo'),bkFromT=document.getElementById('bkFromT'),bkToT=document.getElementById('bkToT'),bkAddr=document.getElementById('bkAddr');
  function isoDay(d){var z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10)}
  function when(d,t){return new Date(d+'T'+t)}
  function pretty(d,t){var x=when(d,t);return x.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' at '+x.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
  function days(){var ms=when(bkTo.value,bkToT.value)-when(bkFrom.value,bkFromT.value);return Math.ceil(ms/864e5)}
  function bkSummary(){
    bkTo.min=bkFrom.value||bkFrom.min;
    var el=document.getElementById('bkSum');
    if(bkFrom.value&&bkTo.value&&days()>0){var d=days();el.innerHTML='<b>'+d+(d===1?' day':' days')+'</b> · '+pretty(bkFrom.value,bkFromT.value)+' → '+pretty(bkTo.value,bkToT.value)}
    else el.textContent='Choose your dates to see the rental length.';
  }
  bkFrom.min=isoDay(new Date());
  bkFrom.addEventListener('change',function(){
    if(bkFrom.value&&(!bkTo.value||bkTo.value<=bkFrom.value)){var d=new Date(bkFrom.value+'T12:00');d.setDate(d.getDate()+1);bkTo.value=isoDay(d)}
    bkFrom.closest('.bf').classList.remove('bad');bkTo.closest('.bf').classList.remove('bad');bkSummary();
  });
  [bkTo,bkFromT,bkToT].forEach(function(x){x.addEventListener('change',function(){bkTo.closest('.bf').classList.remove('bad');bkSummary()})});
  bkAddr.addEventListener('input',function(){bkAddr.closest('.bf').classList.remove('bad')});
  function bkValidate(){
    var bad=[];
    if(!bkFrom.value||bkFrom.value<bkFrom.min)bad.push(bkFrom);
    if(!bkTo.value||(bkFrom.value&&days()<=0))bad.push(bkTo);
    var deliver=document.getElementById('bkDeliver').checked;
    if(deliver&&!bkAddr.value.trim())bad.push(bkAddr);
    [bkFrom,bkTo,bkAddr].forEach(function(x){x.closest('.bf').classList.toggle('bad',bad.indexOf(x)>-1)});
    if(bad.length)bad[0].focus();
    return !bad.length;
  }
  function bkMessage(){
    var car=bkCar.value||'a car (not sure which yet, could you help me choose?)', d=days();
    var deliver=document.getElementById('bkDeliver').checked;
    return "Hi America's Motors! I'd like to rent "+(bkCar.value?'the '+car:car)+'.\n'+
      'Pickup: '+pretty(bkFrom.value,bkFromT.value)+'\n'+
      'Return: '+pretty(bkTo.value,bkToT.value)+' ('+d+(d===1?' day':' days')+')\n'+
      (deliver?'Delivery to: '+bkAddr.value.trim():'Pickup at your lounge')+'\n'+
      'Is it available?';
  }
  bkForm.addEventListener('submit',function(e){
    e.preventDefault();
    if(!bkValidate())return;
    var msg=bkMessage();
    if(isPhone){                       // open Messages with everything filled in
      var a=document.createElement('a');a.href='sms:+14804673485?&body='+encodeURIComponent(msg);a.setAttribute('data-direct','');
      document.body.appendChild(a);a.click();a.remove();
    }else{                             // computer: show the message to copy
      document.getElementById('cmText').value=msg;syncSms();cmOpen('sms');cm.classList.add('req');
    }
  });
  function pickCar(name){
    if(name)[].some.call(bkCar.options,function(o){if(o.value===name){bkCar.value=name;return true}});
    var card=document.querySelector('.book-card');
    document.getElementById('book').scrollIntoView({behavior:'smooth'});
    card.classList.remove('flash');void card.offsetWidth;card.classList.add('flash');
    setTimeout(function(){bkFrom.focus({preventScroll:true})},600);
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('[data-pick]');if(!a)return;
    e.preventDefault();pickCar(a.getAttribute('data-pick'));
  });
  document.getElementById('gvPick').onclick=function(e){e.preventDefault();var n=document.getElementById('gvTitle').textContent;gvClose();setTimeout(function(){pickCar(n)},200)};
  bkSummary();

  document.getElementById('yr').textContent=new Date().getFullYear();
  window.__amReady=true;
})();
