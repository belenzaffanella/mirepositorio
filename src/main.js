const { events, modes } = window.EntreFechasData;

const app = document.querySelector('#app');
const state = { screen: 'home', playKind: null, mode: null, session: null };
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const fmt = n => new Intl.NumberFormat('es-AR').format(n);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function home() {
  closeLightbox(); destroyMap(); state.screen = 'home'; state.playKind = null; state.session = null;
  app.innerHTML = `<section class="home"><div class="home-copy"><p class="eyebrow"><span class="live-dot"></span> HISTORIA, EN PRIMERA PERSONA</p><h1>El pasado<br>está <em>en todas</em><br>partes.</h1><p class="lede">Una foto. Un lugar. Un año.<br>¿Cuánto recordás de la historia reciente?</p><a class="start-link" href="#modes">ELEGÍ TU RECORRIDO <span>↘</span></a><div class="home-meta"><span>05 RONDAS</span><i></i><span>${events.length} MOMENTOS HISTÓRICOS</span></div></div><div class="home-art"><div class="art-image"><div class="placeholder-art"><span class="frame-corner top-left"></span><span class="frame-corner top-right"></span><span class="frame-corner bottom-left"></span><span class="frame-corner bottom-right"></span><svg viewBox="0 0 640 760" role="img" aria-label="Ilustración abstracta de un archivo fotográfico"><defs><linearGradient id="paper" x2=".85" y2="1"><stop stop-color="#e4ddcf"/><stop offset="1" stop-color="#b5b0a3"/></linearGradient><linearGradient id="shade" x2="0" y2="1"><stop stop-color="#2c3e3f" stop-opacity="0"/><stop offset="1" stop-color="#182727" stop-opacity=".8"/></linearGradient></defs><rect width="640" height="760" fill="url(#paper)"/><path d="M0 450 180 235 290 365 385 265 640 525v235H0Z" fill="#70807a"/><path d="M0 570 220 350 375 505 488 365 640 548v212H0Z" fill="#405856"/><path d="M95 760V460l134-92 133 92v300M220 382v378M364 478h200v282" fill="#b49b79"/><path d="M117 508h45v80h-45zm99-8h54v91h-54zm-99 121h45v89h-45zm99 0h54v89h-54zm199-98h53v83h-53zm0 122h53v88h-53z" fill="#d9c6a6" opacity=".77"/><rect width="640" height="760" fill="url(#shade)"/></svg><div class="image-caption"><span>ARCHIVO DEL TIEMPO · Nº 001</span><b>UN MUNDO EN TRANSFORMACIÓN</b></div></div></div><div class="art-index"><span>1980 — 2026</span><span>01 / ${String(events.length).padStart(2,'0')}</span></div><div class="vertical-note">UN ATLAS DE LA MEMORIA RECIENTE</div></div></section><section class="modes-section" id="modes"><div class="section-heading"><div><p class="eyebrow">UN VIAJE, CINCO PARADAS</p><h2>Elegí tu recorrido.</h2></div><p>Ubicá el acontecimiento en el mapa<br>y acercate al año correcto.</p></div><div class="play-type" aria-label="Elegí cómo jugar"><button class="play-type-btn" data-play-kind="solo"><span>SOLO</span><small>Un recorrido personal</small><b>↗</b></button><button class="play-type-btn" data-play-kind="local"><span>CON AMIGOS</span><small>Turnos en el mismo dispositivo</small><b>↗</b></button></div><div id="player-setup"></div><div id="modeNotice" class="mode-notice" role="status" aria-live="polite"></div><div class="mode-grid is-locked" aria-label="Modos de juego">${modes.map((m,i)=>`<button class="mode-card" data-mode="${escapeHtml(m.id)}" disabled><span class="mode-num">0${i+1}</span><span class="mode-icon">${['◌','↗','⌖','◎','◍','♫','⌘','✳'][i]}</span><span class="mode-title">${escapeHtml(m.title)}</span><span class="mode-years">${escapeHtml(m.years)}</span><span class="mode-description">${escapeHtml(m.description)}</span><span class="mode-arrow">↗</span></button>`).join('')}</div><p class="mode-footnote">Cada partida usa cinco acontecimientos diferentes. Los modos con menos de cinco todavía necesitan contenido.</p></section>`;
  app.querySelector('.start-link').addEventListener('click', () => { state.playKind = null; app.querySelector('#modes').scrollIntoView({behavior:'smooth'}); });
  app.querySelectorAll('[data-play-kind]').forEach(btn => btn.addEventListener('click', () => choosePlayKind(btn.dataset.playKind)));
  app.querySelector('.mode-grid').addEventListener('click', event => {
    const card = event.target.closest('[data-mode]');
    if (!card || card.disabled) return;
    const mode = modes.find(m => m.id === card.dataset.mode);
    if (state.playKind === 'local') {
      const names = [...app.querySelectorAll('.player-name-input')].map((input, i) => input.value.trim() || `Jugador ${i+1}`);
      startMode(mode, names);
    } else startMode(mode, ['Vos']);
  });
}

function choosePlayKind(kind) {
  state.playKind = kind;
  app.querySelectorAll('[data-play-kind]').forEach(b => b.classList.toggle('is-selected', b.dataset.playKind === kind));
  const setup = app.querySelector('#player-setup');
  if (kind === 'local') {
    setup.innerHTML = `<div class="player-setup"><div><p class="eyebrow">ANTES DE EMPEZAR</p><h3>¿Quiénes juegan?</h3><p>De 2 a 5 personas, en turnos y en este dispositivo.</p></div><label class="player-count-label">JUGADORES <select id="playerCount">${[2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join('')}</select></label><div id="playerNames" class="player-names"></div></div>`;
    const count = setup.querySelector('#playerCount'); count.addEventListener('change', renderPlayerInputs); renderPlayerInputs();
  } else setup.innerHTML = '';
  app.querySelector('.mode-grid').classList.remove('is-locked');
  app.querySelectorAll('[data-mode]').forEach(b => { b.disabled = false; });
}

function renderPlayerInputs() {
  const count = Number(app.querySelector('#playerCount').value), wrap = app.querySelector('#playerNames');
  const existing = [...wrap.querySelectorAll('input')].map(i => i.value);
  wrap.innerHTML = Array.from({length:count}, (_,i)=>`<label>JUGADOR 0${i+1}<input class="player-name-input" maxlength="18" placeholder="${i===0?'Bel':`Jugador ${i+1}`}" value="${escapeHtml(existing[i]||'')}"></label>`).join('');
}

const RECENT_EVENTS_KEY = 'entre-fechas.recent-events.v1';
function shuffle(items) {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
function recentEventsByMode() {
  try { const recent=JSON.parse(sessionStorage.getItem(RECENT_EVENTS_KEY)||'{}'); return recent&&typeof recent==='object'&&!Array.isArray(recent)?recent:{}; }
  catch { return {}; }
}
function rememberRecentEvent(modeId,eventId) {
  const recent=recentEventsByMode(), ids=(Array.isArray(recent[modeId])?recent[modeId]:[]).filter(id=>id!==eventId);
  ids.push(eventId); recent[modeId]=ids.slice(-5);
  try { sessionStorage.setItem(RECENT_EVENTS_KEY,JSON.stringify(recent)); } catch { /* Session storage can be unavailable in private contexts. */ }
}
function createDeck(mode) {
  const pool=events.filter(mode.filter);
  if(pool.length<5)return {deck:null,available:pool.length};
  const savedRecent=recentEventsByMode()[mode.id], recent=new Set(Array.isArray(savedRecent)?savedRecent:[]);
  const unused=pool.filter(event=>!recent.has(event.id));
  // Consume every fresh event first. If fewer than five remain, fill only the
  // unavoidable slots with recently seen events instead of reshuffling the pool.
  const candidates=unused.length>=5?unused:[...unused,...shuffle(pool.filter(event=>recent.has(event.id))).slice(0,5-unused.length)];
  const buckets=new Map();
  for(const event of shuffle(candidates)){
    const level=event.difficulty||'media';
    if(!buckets.has(level))buckets.set(level,[]);
    buckets.get(level).push(event);
  }
  const levels=shuffle([...buckets.keys()]),deck=[];
  while(deck.length<5){
    let added=false;
    for(const level of levels){const next=buckets.get(level).pop();if(next){deck.push(next);added=true;if(deck.length===5)break;}}
    if(!added)break;
  }
  return {deck,available:pool.length};
}
function startMode(mode,names) {
  const {deck,available}=createDeck(mode);
  if(!deck||deck.length!==5){
    const notice=app.querySelector('#modeNotice');
    notice.textContent=`${mode.title} todavía necesita más contenido: hay ${available} acontecimiento${available===1?'':'s'} disponible${available===1?'':'s'} y se requieren 5 distintos. No repetimos preguntas automáticamente.`;
    notice.classList.add('is-visible'); notice.scrollIntoView({block:'nearest',behavior:'smooth'});
    return;
  }
  beginGame(mode,names,deck);
}

// Session operations are transport-agnostic. A future online adapter can submit
// the same player/round answer payloads without changing scoring or game rules.
function beginGame(mode, names, deck) {
  closeLightbox(); destroyMap(); state.mode = mode;
  state.session = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, kind: state.playKind, modeId: mode.id, rounds: deck, roundIndex: 0, playerIndex: 0,
    players: names.map((name,i) => ({ id:`player-${i+1}`, name, total:0, roundScores:[] })), submissions: [] };
  if (state.session.kind === 'local') handoff(true); else question();
  window.scrollTo({top:0, behavior:'smooth'});
}

function submitAnswer(session, {playerId, roundIndex, eventId, guess, year}) {
  const roundEvent = session.rounds[roundIndex];
  if (!roundEvent || roundEvent.id !== eventId) throw new Error('La pregunta ya no coincide con la ronda activa.');
  const result = scoreAnswer(roundEvent, {playerId, roundIndex, guess, year});
  session.submissions.push(result);
  const player = session.players.find(p => p.id === playerId);
  player.total += result.total; player.roundScores.push(result.total);
  return result;
}

// Pure scoring operation: an online transport can call the same rule after a
// server receives a player's answer, while local sessions store its result here.
function scoreAnswer(roundEvent, {playerId, roundIndex, guess, year}) {
  const distance = distanceKm(guess, {latitude:roundEvent.latitude, longitude:roundEvent.longitude});
  const yearDiff = Math.abs(Number(year) - roundEvent.year);
  const geo = Math.round(500 * Math.exp(-distance / 1600));
  const time = Math.round(500 * Math.exp(-yearDiff / 8));
  return { playerId, roundIndex, event:roundEvent, pin:{...guess}, year:Number(year), distance, yearDiff, geo, time, total:geo+time };
}

function distanceKm(a,b) {
  const rad = d => d * Math.PI / 180, deltaLat = rad(b.latitude-a.latitude);
  const deltaLonRaw = rad(b.longitude-a.longitude), deltaLon = Math.atan2(Math.sin(deltaLonRaw), Math.cos(deltaLonRaw));
  const hav = Math.sin(deltaLat/2)**2 + Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(deltaLon/2)**2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1-hav));
}

let liveMap = null;
function destroyMap() { if (liveMap) { liveMap.remove(); liveMap = null; } }
function mapMarkup(id) { return `<div id="${id}" class="leaflet-map" role="application" aria-label="Mapa interactivo del mundo"></div>`; }
function addWorldMapBase(map) {
  if (!window.NATURAL_EARTH_COUNTRIES) return false;
  L.geoJSON(window.NATURAL_EARTH_COUNTRIES, {
    interactive:false,
    style:{color:'#91a49c',weight:.65,opacity:.9,fillColor:'#f4f2ed',fillOpacity:1},
  }).addTo(map);
  map.attributionControl?.addAttribution('Límites: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth</a> (dominio público)');
  return true;
}
function initQuestionMap() {
  const node = app.querySelector('#questionMap');
  if (!node) return;
  if (!window.L) { node.innerHTML = '<p class="map-error">No se pudo cargar Leaflet. Revisá tu conexión y recargá la página.</p>'; return; }
  liveMap = L.map(node, { worldCopyJump:true, minZoom:0, maxZoom:18, zoomControl:true, attributionControl:true }).fitWorld();
  if (!addWorldMapBase(liveMap)) { node.innerHTML = '<p class="map-error">No se pudo cargar el mapa mundial incluido en el proyecto.</p>'; return; }
  liveMap.on('click', e => {
    state.pin = {latitude:e.latlng.lat, longitude:e.latlng.lng};
    if (state.guessMarker) state.guessMarker.remove();
    state.guessMarker = L.circleMarker(e.latlng, {radius:8,color:'#fff8ea',weight:2,fillColor:'#c45135',fillOpacity:1}).addTo(liveMap).bindTooltip('TU RESPUESTA').openTooltip();
    app.querySelector('#mapSelection').innerHTML = `<span class="selection-dot"></span><span>${state.pin.latitude.toFixed(4)}°, ${state.pin.longitude.toFixed(4)}°</span>`;
    app.querySelector('#confirm').disabled = false;
  });
  state.guessMarker = null;
  requestAnimationFrame(() => liveMap?.invalidateSize());
}
function addMapLayers(map, result) {
  if (!window.L) return;
  const guess = [result.pin.latitude, result.pin.longitude], actual = [result.event.latitude, result.event.longitude];
  const guessLon = guess[1], adjustedLon = guessLon + ((((actual[1]-guessLon)+540)%360)-180);
  L.polyline([guess,[actual[0],adjustedLon]], {color:'#c45135',weight:2,dashArray:'6 6',opacity:.85}).addTo(map);
  L.circleMarker(guess,{radius:7,color:'#fff8ea',weight:2,fillColor:'#c45135',fillOpacity:1}).addTo(map).bindTooltip('TU RESPUESTA',{permanent:true,direction:'top',offset:[0,-8]});
  L.circleMarker(actual,{radius:8,color:'#fff8ea',weight:2,fillColor:'#365b4a',fillOpacity:1}).addTo(map).bindTooltip('LUGAR REAL',{permanent:true,direction:'top',offset:[0,-8]});
  const bounds = L.latLngBounds(guess,[actual[0],adjustedLon]);
  map.fitBounds(bounds, {padding:[35,35], maxZoom:7});
}

function photoMarkup(event,roundIndex) {
  const hasImage = Boolean(event.image), placeholder = '<div class="photo-sky"></div><div class="photo-ridge"></div><div class="photo-grid"></div>';
  const image = hasImage ? `${placeholder}<img class="event-photo${event.id==='mtv-launch-1981'?' event-logo':''}" src="${escapeHtml(event.image)}" alt="Fotografía histórica">` : placeholder;
  const stateLabel = hasImage ? 'FOTOGRAFÍA' : 'IMAGEN PENDIENTE';
  return `<div class="photo-panel"><button type="button" class="photo-placeholder${hasImage?' has-image':' no-image'}" aria-label="${hasImage?'Ampliar fotografía':'Imagen pendiente'}" title="${hasImage?'Ampliar fotografía':'Imagen pendiente'}">${image}<div class="photo-cross" aria-hidden="true">✳</div><span class="photo-label"><span>ARCHIVO HISTÓRICO</span><span class="photo-state">${stateLabel}</span></span><span class="photo-expand-cue" aria-hidden="true">⤢ AMPLIAR</span></button><div class="photo-meta"><span class="photo-attribution"><i class="live-dot"></i>IMAGEN HISTÓRICA</span><span>${String(roundIndex+1).padStart(2,'0')} / 05</span></div></div>`;
}

let lightbox = null, lightboxOpener = null, previousBodyOverflow = '';
function openLightbox(event,opener) {
  if(!event.image||lightbox||!opener.querySelector('.event-photo')||opener.querySelector('.event-photo').style.display==='none')return;
  lightboxOpener=opener;
  const dialog=document.createElement('div'); dialog.className='lightbox'; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true'); dialog.setAttribute('aria-label','Fotografía ampliada');
  dialog.innerHTML=`<button type="button" class="lightbox-close" aria-label="Cerrar imagen ampliada"><span aria-hidden="true">×</span></button><figure class="lightbox-figure"><div class="lightbox-image-stage"><img class="lightbox-image${event.id==='mtv-launch-1981'?' event-logo':''}" src="${escapeHtml(event.image)}" alt="Fotografía histórica" draggable="false"></div><div class="lightbox-zoom" role="group" aria-label="Controles de zoom"><button type="button" data-zoom="out" aria-label="Reducir imagen">−</button><output aria-live="polite">100%</output><button type="button" data-zoom="in" aria-label="Ampliar imagen">+</button><button type="button" data-zoom="fit" aria-label="Ajustar imagen a la pantalla">AJUSTAR</button></div><figcaption>Fotografía del acontecimiento</figcaption></figure>`;
  lightbox=dialog; previousBodyOverflow=document.body.style.overflow; document.body.style.overflow='hidden'; document.body.append(dialog);
  dialog.querySelector('.lightbox-close').addEventListener('click',closeLightbox);
  dialog.addEventListener('click',e=>{
    if(e.target.closest('.lightbox-zoom,.lightbox-close,figcaption a'))return;
    const stage=e.target.closest('.lightbox-image-stage');
    if(e.target.closest('.lightbox-image'))return;
    if(stage){const rect=dialog.querySelector('.lightbox-image').getBoundingClientRect();if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom)return;}
    closeLightbox();
  });
  initLightboxZoom(dialog);
  document.addEventListener('keydown',onLightboxKeydown);
  dialog.querySelector('.lightbox-close').focus();
}
function initLightboxZoom(dialog) {
  const stage=dialog.querySelector('.lightbox-image-stage'), image=dialog.querySelector('.lightbox-image'), readout=dialog.querySelector('.lightbox-zoom output');
  const pointers=new Map(); let scale=1,x=0,y=0,gesture=null;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function render(){
    const limitX=Math.max(0,(image.offsetWidth*scale-stage.clientWidth)/2),limitY=Math.max(0,(image.offsetHeight*scale-stage.clientHeight)/2);
    x=clamp(x,-limitX,limitX); y=clamp(y,-limitY,limitY);
    image.style.transform=`translate(${x}px, ${y}px) scale(${scale})`; readout.value=`${Math.round(scale*100)}%`; readout.textContent=readout.value;
  }
  function zoom(next,point){
    const updated=clamp(next,1,4), ratio=updated/scale;
    if(point){x=point.x-(point.x-x)*ratio;y=point.y-(point.y-y)*ratio;}
    scale=updated;if(scale===1){x=0;y=0;}render();
  }
  const center=()=>({x:0,y:0});
  dialog.querySelector('[data-zoom="in"]').addEventListener('click',()=>zoom(scale+.25,center()));
  dialog.querySelector('[data-zoom="out"]').addEventListener('click',()=>zoom(scale-.25,center()));
  dialog.querySelector('[data-zoom="fit"]').addEventListener('click',()=>{scale=1;x=0;y=0;render();});
  stage.addEventListener('wheel',e=>{e.preventDefault();const r=stage.getBoundingClientRect();zoom(scale+(e.deltaY<0?.2:-.2),{x:e.clientX-r.left-stage.clientWidth/2,y:e.clientY-r.top-stage.clientHeight/2});},{passive:false});
  const point=e=>{const r=stage.getBoundingClientRect();return{x:e.clientX-r.left-stage.clientWidth/2,y:e.clientY-r.top-stage.clientHeight/2};};
  const gap=()=>{const p=[...pointers.values()];return p.length<2?0:Math.hypot(p[0].clientX-p[1].clientX,p[0].clientY-p[1].clientY);};
  const midpoint=()=>{const p=[...pointers.values()],r=stage.getBoundingClientRect();return{x:(p[0].clientX+p[1].clientX)/2-r.left-stage.clientWidth/2,y:(p[0].clientY+p[1].clientY)/2-r.top-stage.clientHeight/2};};
  stage.addEventListener('pointerdown',e=>{e.preventDefault();stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,e);if(pointers.size===2)gesture={distance:gap(),scale,x,y,mid:midpoint()};else gesture={point:point(e),x,y};});
  stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,e);
    if(pointers.size>=2){if(!gesture||!gesture.distance)gesture={distance:gap(),scale,x,y,mid:midpoint()};const mid=midpoint(),next=clamp(gesture.scale*(gap()/gesture.distance),1,4);x=mid.x-(gesture.mid.x-gesture.x)*(next/gesture.scale);y=mid.y-(gesture.mid.y-gesture.y)*(next/gesture.scale);scale=next;render();}
    else if(scale>1&&gesture){const p=point(e);x=gesture.x+p.x-gesture.point.x;y=gesture.y+p.y-gesture.point.y;render();}
  });
  const end=e=>{pointers.delete(e.pointerId);gesture=null;if(pointers.size===1){const [id,p]=pointers.entries().next().value;gesture={point:point(p),x,y};}};
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
  window.addEventListener('resize',render);dialog.addEventListener('lightboxclose',()=>window.removeEventListener('resize',render),{once:true});render();
}
function onLightboxKeydown(event) {
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeLightbox();return;}
  if(event.key==='Tab'&&lightbox){
    const focusable=[...lightbox.querySelectorAll('button:not(:disabled),a[href]')];
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
}
function closeLightbox() {
  if(!lightbox)return;
  const dialog=lightbox, opener=lightboxOpener; lightbox=null; lightboxOpener=null;
  document.removeEventListener('keydown',onLightboxKeydown); dialog.dispatchEvent(new Event('lightboxclose')); dialog.remove(); document.body.style.overflow=previousBodyOverflow;
  if(opener?.isConnected)opener.focus({preventScroll:true});
}

function question() {
  closeLightbox(); destroyMap(); state.screen='question'; state.pin=null; state.year=2000; state.guessMarker=null;
  const session=state.session, event=session.rounds[session.roundIndex], player=session.players[session.playerIndex], local=session.kind==='local';
  rememberRecentEvent(session.modeId,event.id);
  app.innerHTML = `<section class="game"><div class="game-top"><button class="back-link" id="quit">← <span>SALIR</span></button><div class="game-mode">${escapeHtml(state.mode.title.toUpperCase())}</div><div class="round-count">RONDA <b>0${session.roundIndex+1}</b> <span>/ 05</span></div></div><div class="progress-track"><div class="progress-fill" style="width:${(session.roundIndex+1)*20}%"></div></div><div class="question-head"><div><p class="eyebrow">${local?`TUR DE ${escapeHtml(player.name.toUpperCase())} · `:''}MOMENTO ${String(session.roundIndex+1).padStart(2,'0')} <span class="sep">/</span> CINCO</p><h1>¿Dónde y cuándo?</h1></div><p>Marcá en el mapa y acercate al año.<br>La precisión suma.</p></div><div class="question-layout">${photoMarkup(event,session.roundIndex)}<div class="answer-panel"><div class="answer-step"><div class="step-title"><span class="step-num">01</span><div><h2>Ubicación</h2><p>¿En qué lugar ocurrió?</p></div></div><div class="map-frame">${mapMarkup('questionMap')}<div class="map-hint">HACÉ CLICK O TOCÁ EL MAPA</div></div><div class="map-selection" id="mapSelection"><span class="selection-dot"></span><span>Elegí un punto en el mapa</span></div></div><div class="answer-step year-step"><div class="step-title"><span class="step-num">02</span><div><h2>El año</h2><p>¿Cuándo ocurrió?</p></div></div><div class="year-selector"><button class="year-arrow" id="yearDown" aria-label="Restar un año">−</button><label class="year-value" for="yearRange"><output id="yearValue">2000</output><span>AÑO</span></label><button class="year-arrow" id="yearUp" aria-label="Sumar un año">+</button></div><input id="yearRange" class="year-range" type="range" min="1980" max="2026" value="2000" aria-label="Seleccionar año entre 1980 y 2026"><div class="range-labels"><span>1980</span><span>2026</span></div></div><button class="confirm-btn" id="confirm" disabled>CONFIRMAR RESPUESTA <span>↗</span></button></div></div></section>`;
  const photoButton=app.querySelector('.photo-placeholder');
  photoButton?.addEventListener('click',()=>openLightbox(event,photoButton));
  photoButton?.querySelector('.event-photo')?.addEventListener('error',()=>{
    photoButton.querySelector('.event-photo').style.display='none';
    photoButton.classList.remove('has-image');photoButton.classList.add('image-error');
    photoButton.querySelector('.photo-state').textContent='ERROR DE CARGA · PLACEHOLDER';
    photoButton.setAttribute('aria-label','No se pudo cargar la fotografía');
    photoButton.title='No se pudo cargar la imagen';
    photoButton.closest('.photo-panel').querySelector('.photo-attribution').innerHTML='<i class="live-dot"></i>La URL de imagen no respondió';
  },{once:true});
  initQuestionMap();
  const range=app.querySelector('#yearRange'), output=app.querySelector('#yearValue');
  range.addEventListener('input',()=>{state.year=Number(range.value);output.value=state.year;});
  const changeYear=d=>{state.year=clamp(state.year+d,1980,2026);range.value=state.year;output.value=state.year;};
  app.querySelector('#yearDown').addEventListener('click',()=>changeYear(-1)); app.querySelector('#yearUp').addEventListener('click',()=>changeYear(1));
  app.querySelector('#confirm').addEventListener('click',()=>{
    if (!state.pin) return;
    const result=submitAnswer(session,{playerId:player.id,roundIndex:session.roundIndex,eventId:event.id,guess:state.pin,year:state.year});
    answerScreen(result);
  });
  app.querySelector('#quit').addEventListener('click',home);
}

function initRevealMap(result) {
  const node=app.querySelector('#revealMap'); if(!node||!window.L){if(node)node.innerHTML='<p class="map-error">Mapa no disponible sin conexión.</p>';return;}
  liveMap=L.map(node,{worldCopyJump:true,minZoom:2,maxZoom:18,zoomControl:true}).setView([result.event.latitude,result.event.longitude],3);
  if (!addWorldMapBase(liveMap)) { node.innerHTML='<p class="map-error">No se pudo cargar el mapa mundial incluido en el proyecto.</p>'; return; }
  addMapLayers(liveMap,result); requestAnimationFrame(()=>liveMap?.invalidateSize());
}

function answerScreen(r) {
  closeLightbox(); destroyMap(); state.screen='answer'; const session=state.session, local=session.kind==='local', player=session.players.find(p=>p.id===r.playerId);
  const finalRound=session.roundIndex===4, finalPlayer=session.playerIndex===session.players.length-1;
  const buttonLabel=local ? (finalPlayer?'VER RESULTADO DE LA RONDA':`PASAR A ${escapeHtml(session.players[session.playerIndex+1].name.toUpperCase())}`) : (finalRound?'VER RESULTADO FINAL':'SIGUIENTE RONDA');
  app.innerHTML=`<section class="reveal"><div class="game-top"><button class="back-link" id="quit">← <span>INICIO</span></button><div class="game-mode">${escapeHtml(state.mode.title.toUpperCase())} <i>·</i> ${local?'TURNO COMPLETADO':'RESPUESTA'}</div><div class="round-count">RONDA <b>0${session.roundIndex+1}</b> <span>/ 05</span></div></div><div class="progress-track"><div class="progress-fill" style="width:${(session.roundIndex+1)*20}%"></div></div><div class="reveal-heading"><p class="eyebrow"><span class="live-dot"></span> ${local?`PUNTOS DE ${escapeHtml(player.name.toUpperCase())}`:(finalRound?'RECORRIDO COMPLETO':'RESPUESTA REVELADA')}</p><h1>${escapeHtml(r.event.title)}</h1><p class="reveal-location">${escapeHtml(r.event.city)}, ${escapeHtml(r.event.country)} <span>·</span> ${r.event.year}</p></div><div class="reveal-grid"><div class="reveal-left"><div class="reveal-map">${mapMarkup('revealMap')}<span class="map-legend"><i class="guess-key"></i> TU RESPUESTA <i class="real-key"></i> LUGAR REAL</span></div><p class="description">${escapeHtml(r.event.description)}</p><a class="source-link" href="${escapeHtml(r.event.source)}" target="_blank" rel="noreferrer">FUENTE HISTÓRICA ↗</a></div><div class="score-card"><div class="score-top"><span>${local?'PUNTOS DE ESTE TURNO':'PUNTOS DE ESTA RONDA'}</span><span>✳</span></div><div class="round-score">${fmt(r.total)}<small> / 1.000</small></div><div class="score-divider"></div><div class="score-detail"><span>PRECISIÓN GEOGRÁFICA <small>${fmt(Math.round(r.distance))} km de distancia</small></span><b>${r.geo}<small> / 500</small></b></div><div class="score-meter"><i style="width:${r.geo/5}%"></i></div><div class="score-detail"><span>PRECISIÓN DEL AÑO <small>${r.yearDiff===0?'¡Exacto!':`${r.yearDiff} ${r.yearDiff===1?'año':'años'} de diferencia`}</small></span><b>${r.time}<small> / 500</small></b></div><div class="score-meter"><i style="width:${r.time/5}%"></i></div><div class="answer-compare"><span>VOS ELEGISTE <b>${r.year}</b></span><span>AÑO CORRECTO <b>${r.event.year}</b></span></div><button class="next-btn" id="next">${buttonLabel} <span>↗</span></button></div></div><p class="reveal-footer">${session.roundIndex+1} DE 5 RONDAS <span>·</span> ${local?`${escapeHtml(player.name)} · ${fmt(player.total)} PUNTOS`:`${fmt(player.total)} PUNTOS ACUMULADOS`}</p></section>`;
  initRevealMap(r);
  app.querySelector('#next').addEventListener('click',()=>{
    if (local) {
      if (!finalPlayer) { session.playerIndex++; handoff(false); }
      else roundLeaderboard();
    } else if(finalRound) finalScreen(); else { session.roundIndex++; question(); window.scrollTo({top:0,behavior:'smooth'}); }
  });
  app.querySelector('#quit').addEventListener('click',home);
}

function handoff(first) {
  closeLightbox(); destroyMap(); state.screen='handoff'; const player=state.session.players[state.session.playerIndex];
  app.innerHTML=`<section class="handoff-screen"><p class="eyebrow"><span class="live-dot"></span> ${first?'PREPARADOS, LISTOS':'TURNO SIGUIENTE'} · RONDA ${state.session.roundIndex+1} / 5</p><div class="handoff-card"><span class="handoff-number">0${state.session.playerIndex+1}</span><h1>Pasá el dispositivo<br>a <em>${escapeHtml(player.name)}.</em></h1><p>La respuesta anterior queda atrás. Cuando estés listo, empezá tu turno.</p><button class="next-btn" id="ready">COMENZAR MI TURNO <span>↗</span></button></div><button class="text-btn" id="quit">VOLVER AL INICIO</button></section>`;
  app.querySelector('#ready').addEventListener('click',question); app.querySelector('#quit').addEventListener('click',home);
}

function sortedPlayers(scores) { return [...state.session.players].map(p=>({player:p,score:scores[p.id]||0})).sort((a,b)=>b.score-a.score); }
function leaderboardMarkup(ranking, round) {
  const firstScore=ranking[0]?.score, leaders=ranking.filter(item=>item.score===firstScore).length;
  return `<ol class="leaderboard">${ranking.map((item,i)=>`<li><span class="rank-place">${i>0&&item.score===ranking[i-1].score?'=':`${i+1}.`}</span><span class="rank-player">${escapeHtml(item.player.name)}${item.score===firstScore?`<small>✳ ${leaders>1?'LÍDER COMPARTIDO':'LÍDER DE LA RONDA'}</small>`:''}</span><b>${fmt(item.score)} <small>puntos</small></b></li>`).join('')}</ol>`;
}
function roundLeaderboard() {
  destroyMap(); state.screen='round-ranking'; const session=state.session;
  const scores=Object.fromEntries(session.submissions.filter(s=>s.roundIndex===session.roundIndex).map(s=>[s.playerId,s.total]));
  const ranking=sortedPlayers(scores), last=session.roundIndex===4;
  app.innerHTML=`<section class="ranking-screen"><p class="eyebrow"><span class="live-dot"></span> RONDA ${session.roundIndex+1} / 5 · RESULTADO DE LA RONDA</p><div class="ranking-heading"><h1>${last?'Cinco rondas.':'Así va la ronda.'}</h1><p>${escapeHtml(session.rounds[session.roundIndex].title)}</p></div>${leaderboardMarkup(ranking,true)}<button class="next-btn ranking-next" id="rankingNext">${last?'VER RESULTADO FINAL':'EMPEZAR RONDA '+(session.roundIndex+2)} <span>↗</span></button><button class="text-btn" id="quit">VOLVER AL INICIO</button></section>`;
  app.querySelector('#rankingNext').addEventListener('click',()=>{if(last)finalScreen();else{session.roundIndex++;session.playerIndex=0;handoff(true);}}); app.querySelector('#quit').addEventListener('click',home);
}

function finalScreen() {
  destroyMap(); state.screen='final'; const s=state.session, ranking=sortedPlayers(Object.fromEntries(s.players.map(p=>[p.id,p.total]))), winningScore=ranking[0].score, winners=ranking.filter(item=>item.score===winningScore);
  if(s.kind==='local') {
    const winnerNames=winners.map(item=>item.player.name).join(' · '), isTie=winners.length>1;
    app.innerHTML=`<section class="final-screen local-final"><div class="final-top"><p class="eyebrow"><span class="live-dot"></span> RESULTADO FINAL · ${escapeHtml(state.mode.title.toUpperCase())}</p><div class="final-stamp">✳</div></div><div class="final-body"><p class="eyebrow">CINCO MOMENTOS, UN VIAJE</p><h1>${isTie?'La historia<br>se comparte.':'La historia<br>tiene <em>ganador.</em>'}</h1><div class="winner-callout"><span>🏆</span><div><small>${isTie?'EMPATE':'GANADOR/A'}</small><b>${escapeHtml(winnerNames)}</b></div><strong>${fmt(winningScore)}<small> puntos</small></strong></div><ol class="leaderboard final-leaderboard">${ranking.map((item,i)=>`<li><span class="rank-place">${item.score===winningScore?'🏆':`${i+1}.`}</span><span class="rank-player">${escapeHtml(item.player.name)}<small>${item.player.roundScores.map((score,j)=>`R${j+1} ${fmt(score)}`).join(' · ')}</small></span><b>${fmt(item.player.total)} <small>puntos</small></b></li>`).join('')}</ol><div class="final-actions"><button class="next-btn" id="again">JUGAR DE NUEVO <span>↗</span></button><button class="text-btn" id="home">ELEGIR OTRO RECORRIDO</button></div></div><div class="final-side"><div class="final-side-visual"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit-dot"></div><span>1980</span><span>2026</span></div><p>La historia no es<br>tan lejana como parece.</p></div></section>`;
  } else {
    const player=s.players[0], total=player.total;
    app.innerHTML=`<section class="final-screen"><div class="final-top"><p class="eyebrow"><span class="live-dot"></span> RECORRIDO COMPLETO · ${escapeHtml(state.mode.title.toUpperCase())}</p><div class="final-stamp">✳</div></div><div class="final-body"><p class="eyebrow">CINCO MOMENTOS, UN VIAJE</p><h1>Tu lugar<br>en la <em>historia.</em></h1><p class="final-score">${fmt(total)}<small> / 5.000 puntos</small></p><p class="final-grade">${total>=4000?'Una memoria extraordinaria.':total>=2500?'Tenés muy buen ojo para la historia.':'Cada respuesta es una historia por descubrir.'}</p><div class="round-results">${s.rounds.map((event,i)=>`<div class="result-row"><span class="result-index">0${i+1}</span><span class="result-name">${escapeHtml(event.title)}<small>${escapeHtml(event.city)}, ${escapeHtml(event.country)} · ${event.year}</small></span><span class="result-points">${fmt(player.roundScores[i])} <small>/ 1.000</small></span></div>`).join('')}</div><div class="final-actions"><button class="next-btn" id="again">JUGAR DE NUEVO <span>↗</span></button><button class="text-btn" id="home">ELEGIR OTRO RECORRIDO</button></div></div><div class="final-side"><div class="final-side-visual"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit-dot"></div><span>1980</span><span>2026</span></div><p>La historia no es<br>tan lejana como parece.</p></div></section>`;
  }
  app.querySelector('#again').addEventListener('click',()=>state.session.kind==='local'?startMode(state.mode,s.players.map(p=>p.name)):startMode(state.mode,['Vos']));
  app.querySelector('#home').addEventListener('click',()=>{home();document.querySelector('#modes').scrollIntoView({behavior:'smooth'});});
}

home();
