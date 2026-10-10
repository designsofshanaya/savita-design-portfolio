const $ = (s) => document.querySelector(s);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let content, selectedProject, mediaIndex = 0;
const storageKey = 'savita-cat-portfolio-v1';
const gallery = $('#gallery'), editor = $('#editor');
$('#year').textContent = new Date().getFullYear();

function openDialog(dialog) { dialog.showModal(); document.body.classList.add('dialog-open'); }
function closeDialog(dialog) { dialog.close(); }
for (const dialog of [gallery, editor]) {
  dialog.addEventListener('close', () => {
    if (!gallery.open && !editor.open) document.body.classList.remove('dialog-open');
    dialog.querySelectorAll('video').forEach(video => video.pause());
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog(dialog);
  });
}
$('#close-gallery').onclick = () => closeDialog(gallery);
$('#close-editor').onclick = () => closeDialog(editor);
const menu = $('.menu-button');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open menu'); $('#navigation').classList.remove('open'); }
menu.onclick = () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  $('#navigation').classList.toggle('open', open);
};
$('#navigation').querySelectorAll('a').forEach(a => a.onclick = closeMenu);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

function makeAppScreen(screen) {
  const view = document.createElement('div'); view.className = 'app-screen';
  view.setAttribute('role', 'img'); view.setAttribute('aria-label', screen.alt);
  view.style.aspectRatio = `${screen.width} / ${screen.height}`;
  const image = document.createElement('img'); image.src = screen.src; image.alt = ''; image.setAttribute('aria-hidden', 'true');
  image.style.setProperty('width', `${screen.sourceWidth / screen.width * 100}%`, 'important');
  image.style.setProperty('height', `${screen.sourceHeight / screen.height * 100}%`, 'important');
  image.style.left = `${-screen.x / screen.width * 100}%`;
  image.style.top = `${-screen.y / screen.height * 100}%`;
  view.append(image); return view;
}
function renderProjects(category = 'All') {
  const container = $('#projects'); container.replaceChildren();
  const projects = content.projects;
  projects.forEach(project => {
    const isApp = project.category === 'Interaction';
    let screenIndex = 0;
    const showGallery = () => { selectedProject = project; mediaIndex = screenIndex; renderGallery(); openDialog(gallery); };
    const button = document.createElement(isApp ? 'article' : 'button'); button.className = 'project'; button.dataset.category = project.category;
    button.setAttribute('aria-label', `View ${project.title}`);
    const frame = document.createElement('div'); frame.className = 'project-image';
    if (project.category === 'Graphics') {
      frame.classList.add('poster-set');
      const labels = ['The Lord of the Rings — gold type and a ring of script', 'Inception — title extended into a road', 'Inception — repeated type forming a perspective tunnel'];
      project.images.forEach((src, i) => {
        const piece = document.createElement('div'); piece.className = 'poster-piece';
        const image = document.createElement('img'); image.src = src; image.alt = labels[i]; image.loading = 'lazy';
        const label = document.createElement('span'); label.className = 'poster-label'; label.textContent = labels[i];
        piece.append(image, label); frame.append(piece);
      });
    } else if (project.category === 'Interaction') {
      frame.classList.add('phone-set');
      const phone = document.createElement('button'); phone.type = 'button'; phone.className = 'phone-preview';
      phone.onclick = showGallery;
      const steps = document.createElement('div'); steps.className = 'phone-steps';
      const previous = document.createElement('button'); previous.type = 'button'; previous.textContent = '←'; previous.setAttribute('aria-label', 'Previous app screen');
      const next = document.createElement('button'); next.type = 'button'; next.textContent = '→'; next.setAttribute('aria-label', 'Next app screen');
      const status = document.createElement('span'); status.className = 'phone-step-label'; status.setAttribute('aria-live', 'polite');
      const explanation = document.createElement('p'); explanation.className = 'phone-explanation';
      const updateScreen = () => {
        const screen = project.screens[screenIndex];
        phone.replaceChildren(makeAppScreen(screen)); phone.setAttribute('aria-label', `Enlarge ${screen.label} app screen`);
        status.textContent = `${screenIndex + 1} / ${project.screens.length} · ${screen.label}`;
        explanation.textContent = screen.explanation;
        previous.disabled = screenIndex === 0; next.disabled = screenIndex === project.screens.length - 1;
      };
      previous.onclick = () => { if (screenIndex > 0) { screenIndex--; updateScreen(); } };
      next.onclick = () => { if (screenIndex < project.screens.length - 1) { screenIndex++; updateScreen(); } };
      steps.append(previous, status, next); frame.append(phone, steps, explanation); updateScreen();
    } else {
      const image = document.createElement('img'); image.src = project.image; image.alt = project.title; image.loading = 'lazy'; image.decoding = 'async'; frame.append(image);
    }
    if (project.video) {
      const preview = document.createElement('video'); preview.className = 'project-preview';
      preview.muted = true; preview.loop = true; preview.playsInline = true; preview.preload = 'none'; preview.poster = project.image;
      preview.setAttribute('aria-hidden', 'true');
      const showPreview = () => { if (reducedMotion.matches) return; if (!preview.src) preview.src = project.video; preview.play().catch(() => {}); };
      const stopPreview = () => { preview.pause(); };
      button.addEventListener('pointerenter', showPreview); button.addEventListener('pointerleave', stopPreview);
      button.addEventListener('focus', showPreview); button.addEventListener('blur', stopPreview);
      button.addEventListener('click', stopPreview);
      frame.append(preview);
    }
    const caption = document.createElement('div'); caption.className = 'project-caption';
    const text = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = project.title;
    const categoryLabel = document.createElement('p'); categoryLabel.textContent = project.category;
    const arrow = document.createElement('span'); arrow.className = 'project-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true');
    const action = document.createElement(isApp ? 'button' : 'span'); action.className = 'project-action';
    if (isApp) { action.type = 'button'; action.onclick = showGallery; } action.textContent = project.category === 'Graphics' ? 'View all three posters ↗' : project.category === 'Interaction' ? 'View app ↗' : 'Watch the film ↗';
    text.append(title, categoryLabel, action); caption.append(text, arrow); button.append(frame, caption);
    if (!isApp) button.onclick = showGallery;
    const note = document.createElement('p'); note.className = 'project-context';
    note.textContent = project.summary || project.description;
    text.append(note);
    container.append(button);
    observeScrollReveal(button, projects.indexOf(project) % 2 * 90);
  });
  $('#project-status').textContent = `${projects.length} projects shown. All work remains visible.`;
}
function renderFilters() {
  const filters = $('.filters'); filters.replaceChildren();
  ['All', ...new Set(content.projects.map(p => p.category))].forEach(category => {
    const button = document.createElement('button'); button.textContent = category; button.setAttribute('aria-pressed', String(category === 'All'));
    button.onclick = () => {
      filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      const target = category === 'All' ? $('#work') : [...document.querySelectorAll('.project')].find(p => p.dataset.category === category);
      target?.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block:'center'});
      $('#project-status').textContent = `Jumped to ${category}. All four projects remain visible.`;
    };
    filters.append(button);
  });
}
function validLink(url, linkedInOnly = false) {
  try { const u = new URL(url); return u.protocol === 'https:' && (!linkedInOnly || u.hostname === 'linkedin.com' || u.hostname === 'www.linkedin.com'); } catch { return false; }
}
function renderContact() {
  const link = $('#linkedin'), available = validLink(content.linkedin, true);
  link.hidden = !available; $('#contact-pending').hidden = false;
  if (available) link.href = content.linkedin; else link.removeAttribute('href');
}
function projectMedia() {
  if (selectedProject.screens?.length) return selectedProject.screens;
  if (selectedProject.video) return [{ type:'video', src:selectedProject.video }];
  return (selectedProject.images?.length ? selectedProject.images : [selectedProject.image]).map(src => ({ type:'image', src }));
}
function renderGallery() {
  gallery.dataset.category = selectedProject.category;
  $('#gallery-title').textContent = selectedProject.title;
  $('#gallery-category').textContent = selectedProject.category;
  $('#gallery-description').textContent = selectedProject.description;
  const study = $('#gallery-study');
  study.hidden = !selectedProject.caseStudy;
  if (selectedProject.caseStudy) study.href = selectedProject.caseStudy; else study.removeAttribute('href');
  const link = $('#gallery-live'); link.hidden = !validLink(selectedProject.url);
  if (!link.hidden) link.href = selectedProject.url; else link.removeAttribute('href');
  const media = projectMedia(), item = media[mediaIndex], container = $('#gallery-media');
  container.querySelectorAll('video').forEach(v => v.pause()); container.replaceChildren();
  const element = item.type === 'screen' ? makeAppScreen(item) : document.createElement(item.type === 'video' ? 'video' : 'img');
  if (item.type !== 'screen') element.src = item.src;
  if (item.type === 'video') { element.controls = true; element.playsInline = true; element.preload = 'metadata'; element.poster = selectedProject.image; }
  else if (item.type !== 'screen') element.alt = selectedProject.imageDescriptions?.[mediaIndex] || `${selectedProject.title}, image ${mediaIndex + 1}`;
  if (item.type === 'screen') { const phone = document.createElement('div'); phone.className = 'phone-preview gallery-phone'; phone.append(element); container.append(phone); } else container.append(element);
  $('#gallery-counter').textContent = item.type === 'screen' ? `${mediaIndex + 1} / ${media.length} — ${item.label}` : item.type === 'video' ? 'Film · Play to explore' : `${mediaIndex + 1} / ${media.length}${selectedProject.imageDescriptions ? ' — ' + selectedProject.imageDescriptions[mediaIndex] : ''}`;
  $('#previous').disabled = $('#next').disabled = media.length < 2;
}
function moveGallery(delta) { const length = projectMedia().length; mediaIndex = (mediaIndex + delta + length) % length; renderGallery(); }
$('#previous').onclick = () => moveGallery(-1);
$('#next').onclick = () => moveGallery(1);
gallery.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') moveGallery(-1); if (e.key === 'ArrowRight') moveGallery(1); });

$('#personalize').onclick = () => {
  $('#linkedin-input').value = content.linkedin || ''; $('#save-status').textContent = '';
  const projects = $('#edit-projects'); projects.replaceChildren();
  content.projects.forEach((p, i) => {
    const label = document.createElement('label'); label.textContent = `Project ${i + 1}`;
    const input = document.createElement('input'); input.value = p.title; input.dataset.project = String(i); input.required = true; input.maxLength = 100;
    label.append(input); projects.append(label);
  });
  openDialog(editor);
};
$('#settings').onsubmit = event => {
  event.preventDefault(); const url = $('#linkedin-input').value.trim();
  if (url && !validLink(url, true)) { $('#save-status').textContent = 'Enter an HTTPS LinkedIn profile URL.'; return; }
  content.linkedin = url;
  $('#edit-projects').querySelectorAll('input').forEach(input => { content.projects[Number(input.dataset.project)].title = input.value.trim() || 'Untitled project'; });
  try { localStorage.setItem(storageKey, JSON.stringify(content)); $('#save-status').textContent = 'Saved in this browser.'; }
  catch { $('#save-status').textContent = 'Browser storage is unavailable. Changes cannot be saved in this browser.'; }
  renderFilters(); renderProjects(); renderContact();
};


// Continuous two-dimensional eye tracking on the original illustration.
(() => {
  const video = $('#character-video');
  const ns = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs) => {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  };
  const artwork = node('svg', {viewBox:'0 0 720 1280', preserveAspectRatio:'xMaxYMid meet', class:'cursor-characters', role:'img', 'aria-label':'A girl and three cats whose eyes follow your cursor in every direction'});
  const background = node('image', {href:'gaze-poster.jpg', width:720, height:1280});
  const defs = node('defs', {}); artwork.append(background, defs);
  const specs = [
    {x:310,y:247,rx:23,ry:17,angle:10,fill:'#e6c77e',iris:'#201711',r:8,travel:7},
    {x:405,y:239,rx:24,ry:17,angle:-12,fill:'#e6c77e',iris:'#201711',r:8,travel:7},
    {x:325,y:553,rx:32,ry:22,angle:0,fill:'#fff4df',iris:'#76503a',r:17,travel:9,human:true},
    {x:465,y:546,rx:32,ry:22,angle:0,fill:'#fff4df',iris:'#76503a',r:17,travel:9,human:true},
    {x:112,y:672,rx:23,ry:17,angle:9,fill:'#ebc66f',iris:'#15130f',r:8,travel:7},
    {x:207,y:652,rx:24,ry:17,angle:-13,fill:'#ebc66f',iris:'#15130f',r:8,travel:7},
    {x:507,y:790,rx:16,ry:16,angle:13,fill:'#e7d28d',iris:'#221b13',r:7,travel:5},
    {x:591,y:815,rx:22,ry:16,angle:16,fill:'#e7d28d',iris:'#221b13',r:8,travel:6}
  ];
  const eyes = specs.map((eye, i) => {
    const shape = {cx:eye.x,cy:eye.y,rx:eye.rx,ry:eye.ry,transform:`rotate(${eye.angle} ${eye.x} ${eye.y})`};
    const clip = node('clipPath', {id:`cursor-eye-${i}`}); clip.append(node('ellipse', shape)); defs.append(clip);
    const group = node('g', {'clip-path':`url(#cursor-eye-${i})`});
    group.append(node('ellipse', {...shape, fill:eye.fill}));
    const iris = node('g', {class:'tracking-iris'});
    iris.append(node('ellipse', {cx:eye.x,cy:eye.y,rx:eye.r,ry:eye.human ? eye.r : eye.r*1.45,fill:eye.iris}));
    if (eye.human) iris.append(node('circle', {cx:eye.x,cy:eye.y-1,r:9,fill:'#211711'}));
    iris.append(node('circle', {cx:eye.x-3,cy:eye.y-6,r:eye.human ? 4 : 2.8,fill:'#fff9e9'}));
    group.append(iris); artwork.append(group);
    return {...eye, iris, xOffset:0, yOffset:0, targetX:0, targetY:0};
  });
  video.pause(); video.hidden = true; video.parentElement.append(artwork);
  const mobile = matchMedia('(max-width:700px)');
  const align = () => artwork.setAttribute('preserveAspectRatio', mobile.matches ? 'xMidYMax meet' : 'xMaxYMid meet');
  align(); mobile.addEventListener('change', align);
  let frame = 0, last = 0;
  function tick(now) {
    frame = 0;
    const blend = 1 - Math.exp(-18 * Math.min((now - (last || now - 16))/1000, .05));
    last = now; let moving = false;
    for (const eye of eyes) {
      eye.xOffset += (eye.targetX-eye.xOffset)*blend;
      eye.yOffset += (eye.targetY-eye.yOffset)*blend;
      eye.iris.setAttribute('transform', `translate(${eye.xOffset.toFixed(3)} ${eye.yOffset.toFixed(3)})`);
      if (Math.abs(eye.targetX-eye.xOffset)+Math.abs(eye.targetY-eye.yOffset) > .02) moving = true;
    }
    if (moving) frame = requestAnimationFrame(tick); else last = 0;
  }
  const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
  window.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType === 'touch' || document.hidden) return;
    const matrix = artwork.getScreenCTM(); if (!matrix) return;
    const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    for (const eye of eyes) {
      const dx = point.x-eye.x, dy = point.y-eye.y;
      const distance = Math.hypot(dx,dy);
      const amount = eye.travel * Math.tanh(distance/180);
      eye.targetX = distance ? dx/distance*amount : 0;
      eye.targetY = distance ? dy/distance*amount*.7 : 0;
    }
    wake();
  });
  const reset = () => { eyes.forEach(eye => {eye.targetX=0; eye.targetY=0;}); wake(); };
  document.documentElement.addEventListener('pointerleave', reset);
  reducedMotion.addEventListener('change', reset);
})();

const line = $('#typewriter'), lineText = line?.textContent;
if (line && !reducedMotion.matches) {
  line.textContent = ''; line.classList.add('typing');
  let count = 0;
  const start = setTimeout(() => {
    const timer = setInterval(() => {
      if (reducedMotion.matches) count = lineText.length;
      line.textContent = lineText.slice(0, ++count);
      if (count >= lineText.length) { clearInterval(timer); line.classList.remove('typing'); }
    }, 38);
  }, 600);
}

(async () => {
  try {
    const response = await fetch('content.json', { cache: 'no-store' }); if (!response.ok) throw new Error('Could not load project content.');
    content = await response.json();
    try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (saved?.revision === content.revision && saved?.projects?.length === content.projects.length) { content.linkedin = saved.linkedin || ''; content.projects.forEach((p, i) => { if (typeof saved.projects[i].title === 'string') p.title = saved.projects[i].title; }); } } catch {}
    renderFilters(); renderProjects(); renderContact();
  } catch (error) { $('#projects').textContent = 'Projects could not load. Please refresh the page.'; $('#personalize').disabled = true; console.error(error); }
})();

// Quiet, locally composed audio; music only starts after an explicit click.
(() => {
  const play = $('#lofi-toggle');
  if (!play) return;
  let audio, clickBus, musicBus, musicTimer, nextBeat = 0, beat = 0;
  let musicPlaying = false;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) { $('.audio-controls').hidden = true; return; }
  function readyAudio() {
    if (!audio) {
      audio = new AudioEngine();
      clickBus = audio.createGain(); clickBus.gain.value = .045; clickBus.connect(audio.destination);
      musicBus = audio.createGain(); musicBus.gain.value = 0; musicBus.connect(audio.destination);
    }
    if (audio.state === 'suspended') audio.resume().catch(() => {});
  }
  function tone(frequency, time, length, level, output, type = 'sine') {
    const oscillator = audio.createOscillator(), envelope = audio.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + length);
    oscillator.connect(envelope); envelope.connect(output);
    oscillator.start(time); oscillator.stop(time + length + .03);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
  function tap() {
    readyAudio(); tone(320, audio.currentTime, .055, .28, clickBus, 'triangle');
    tone(190, audio.currentTime + .006, .04, .10, clickBus);
  }
  // Original four-chord instrumental: soft electric-piano tones, bass and brushed rhythm.
  const chords = [[146.83,174.61,220,261.63],[130.81,164.81,196,246.94],[87.31,110,130.81,164.81],[98,123.47,146.83,185]];
  const melody = [3,2,1,0,1,2,3,1];
  const step = 60 / 64 / 2;
  function scheduleBeat(time, index) {
    const chord = chords[Math.floor(index / 8) % chords.length];
    if (index % 8 === 0) {
      chord.forEach((note, i) => {
        tone(note * 2, time + i * .06, 3.8, .07, musicBus);
        tone(note, time + i * .06, 2.8, .025, musicBus);
      });
      tone(chord[0] / 2, time, 2.6, .09, musicBus);
    }
    if (index % 4 === 0) tone(chord[melody[Math.floor(index / 4) % melody.length]] * 2, time + .12, 1.8, .025, musicBus);
    if (index % 8 === 6) {
      const noise = audio.createBuffer(1, Math.floor(audio.sampleRate * .09), audio.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples.length / 5));
      const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
      source.buffer = noise; filter.type = 'lowpass'; filter.frequency.value = 900; gain.gain.value = .012;
      source.connect(filter); filter.connect(gain); gain.connect(musicBus); source.start(time);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    }
  }
  function stopMusic() {
    musicPlaying = false; clearInterval(musicTimer);
    if (audio) { musicBus.gain.cancelScheduledValues(audio.currentTime); musicBus.gain.setTargetAtTime(0, audio.currentTime, .09); }
    play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-label', 'Play lo-fi music');
    play.querySelector('.audio-label').textContent = 'Play lo-fi';
  }
  play.onclick = () => {
    if (musicPlaying) { stopMusic(); return; }
    readyAudio(); musicPlaying = true; beat = 0; nextBeat = audio.currentTime + .08;
    musicBus.gain.cancelScheduledValues(audio.currentTime); musicBus.gain.setTargetAtTime(.38, audio.currentTime, .6);
    const schedule = () => { while (nextBeat < audio.currentTime + .16) { scheduleBeat(nextBeat, beat++); nextBeat += step; } };
    schedule(); musicTimer = setInterval(schedule, 70);
    play.setAttribute('aria-pressed', 'true'); play.setAttribute('aria-label', 'Pause lo-fi music');
    play.querySelector('.audio-label').textContent = 'Pause lo-fi';
  };
  document.addEventListener('click', event => {
    if (event.target.closest('button, a, summary')) tap();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && musicPlaying) stopMusic(); });
})();

// Small, bounded notes: drag with a pointer or move with keyboard arrows.
document.querySelectorAll('.desk-note').forEach(note => {
  let offsetX = 0, offsetY = 0, drag;
  const place = (x, y) => {
    const limit = Math.max(50, Math.min(innerWidth * .18, 140));
    offsetX = Math.max(-24, Math.min(limit, x)); offsetY = Math.max(-140, Math.min(35, y));
    note.style.setProperty('--note-x', `${offsetX}px`); note.style.setProperty('--note-y', `${offsetY}px`);
  };
  note.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { id:event.pointerId, x:event.clientX, y:event.clientY, startX:offsetX, startY:offsetY };
    note.setPointerCapture(event.pointerId);
  });
  note.addEventListener('pointermove', event => { if (drag?.id === event.pointerId) place(drag.startX + event.clientX - drag.x, drag.startY + event.clientY - drag.y); });
  const finish = () => { drag = null; };
  note.addEventListener('pointerup', finish); note.addEventListener('pointercancel', finish); note.addEventListener('lostpointercapture', finish);
  note.addEventListener('keydown', event => {
    const directions = { ArrowLeft:[-12,0], ArrowRight:[12,0], ArrowUp:[0,-12], ArrowDown:[0,12] };
    if (directions[event.key]) { event.preventDefault(); place(offsetX + directions[event.key][0], offsetY + directions[event.key][1]); }
  });
});


// Reveal content once as it enters the viewport; keep keyboard access immediate.
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .08, rootMargin: '0px 0px -35px 0px' });
function observeScrollReveal(element, delay = 0) {
  element.classList.add('scroll-reveal');
  element.style.setProperty('--reveal-delay', `${delay}ms`);
  if (reducedMotion.matches) element.classList.add('is-revealed');
  else revealObserver.observe(element);
}
document.querySelectorAll('.work-heading, .filters, .research-story, .about-intro, .toolkit, .contact-layout, .studio-ticker').forEach((element, index) => observeScrollReveal(element, index % 2 * 90));
document.addEventListener('focusin', event => {
  const element = event.target.closest('.scroll-reveal');
  if (element) { element.classList.add('is-revealed'); revealObserver.unobserve(element); }
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) document.querySelectorAll('.scroll-reveal').forEach(element => {
    element.classList.add('is-revealed'); revealObserver.unobserve(element);
  });
});

const resumeViewer = document.getElementById('resume-viewer');
document.getElementById('open-resume').addEventListener('click', () => resumeViewer.showModal());
document.getElementById('close-resume').addEventListener('click', () => resumeViewer.close());

const resumeKitten = document.querySelector('.resume-kitten');
if (resumeKitten) {
  const kittenVisibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !reducedMotion.matches) resumeKitten.play().catch(() => {});
      else resumeKitten.pause();
    }
  }, { threshold: .2 });
  kittenVisibility.observe(resumeKitten);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) resumeKitten.pause(); });
}

// A soft cursor spotlight reveals the studio grid, inspired by the reference.
(() => {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const layer = document.createElement('div');
  layer.className = 'cursor-grid';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  let targetX=0, targetY=0, x=0, y=0, frame=0, initialized=false;
  const enabled = () => finePointer.matches && !reducedMotion.matches;
  function draw() {
    frame=0;
    x += (targetX-x)*.22;
    y += (targetY-y)*.22;
    layer.style.setProperty('--cursor-x', `${x}px`);
    layer.style.setProperty('--cursor-y', `${y}px`);
    if (Math.abs(targetX-x)+Math.abs(targetY-y)>.4) frame=requestAnimationFrame(draw);
  }
  function hide() {
    layer.classList.remove('is-visible');
    if(frame)cancelAnimationFrame(frame);
    frame=0; initialized=false;
  }
  window.addEventListener('pointermove', event => {
    if (!enabled() || event.pointerType==='touch' || document.querySelector('dialog[open]')) {hide();return;}
    targetX=event.clientX;targetY=event.clientY;
    if(!initialized){x=targetX;y=targetY;initialized=true;}
    layer.classList.add('is-visible');
    if(!frame)frame=requestAnimationFrame(draw);
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',hide);
  window.addEventListener('blur',hide);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
  reducedMotion.addEventListener('change',hide);
  finePointer.addEventListener('change',hide);
})();

// Fine gold dust briefly sparkles in the wake of a moving pointer.
(() => {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const canvas=document.createElement('canvas');
  canvas.className='cursor-glitter'; canvas.setAttribute('aria-hidden','true');
  document.body.append(canvas);
  const ctx=canvas.getContext('2d'); if(!ctx)return;
  let particles=[],frame=0,lastTime=0,lastPoint=null;
  const enabled=()=>fine.matches&&!reducedMotion.matches;
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function clear(){
    if(frame)cancelAnimationFrame(frame);
    particles=[];frame=lastTime=0;lastPoint=null;
    ctx.clearRect(0,0,innerWidth,innerHeight);
  }
  function draw(now){
    frame=0;
    const dt=Math.min((now-(lastTime||now-16))/1000,.05);lastTime=now;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    particles=particles.filter(p=>{p.life-=dt;return p.life>0;});
    for(const p of particles){
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=12*dt;
      const fade=p.life/p.max;
      const alpha=fade*.95*(.8+.2*Math.sin(p.life*24+p.phase));
      ctx.fillStyle=`rgba(174,117,20,${alpha})`;
      ctx.beginPath();ctx.arc(p.x,p.y,p.size*fade,0,Math.PI*2);ctx.fill();
      if(p.star){
        const size=p.size*3*fade;
        ctx.strokeStyle=`rgba(207,143,29,${alpha})`;ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(p.x-size,p.y);ctx.lineTo(p.x+size,p.y);
        ctx.moveTo(p.x,p.y-size);ctx.lineTo(p.x,p.y+size);ctx.stroke();
      }
    }
    if(particles.length)frame=requestAnimationFrame(draw);else lastTime=0;
  }
  window.addEventListener('pointermove',e=>{
    if(!enabled()||e.pointerType==='touch'||document.querySelector('dialog[open]')){clear();return;}
    const point={x:e.clientX,y:e.clientY};
    const previous=lastPoint||point;lastPoint=point;
    const distance=Math.hypot(point.x-previous.x,point.y-previous.y);
    if(distance<2)return;
    const count=Math.min(24,Math.ceil(distance/4));
    for(let i=0;i<count;i++){
      const t=(i+1)/count,life=.6+Math.random()*.65;
      particles.push({x:previous.x+(point.x-previous.x)*t+(Math.random()-.5)*18,
        y:previous.y+(point.y-previous.y)*t+(Math.random()-.5)*18,
        vx:(Math.random()-.5)*22,vy:(Math.random()-.5)*22,
        life,max:life,size:1.1+Math.random()*1.8,phase:Math.random()*6,star:Math.random()<.24});
    }
    if(particles.length>240)particles.splice(0,particles.length-240);
    if(!frame)frame=requestAnimationFrame(draw);
  },{passive:true});
  window.addEventListener('resize',()=>{clear();resize();},{passive:true});
  document.documentElement.addEventListener('pointerleave',clear);
  window.addEventListener('blur',clear);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  reducedMotion.addEventListener('change',clear);fine.addEventListener('change',clear);
  resize();
})();
