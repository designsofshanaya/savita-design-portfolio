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

function renderProjects(category = 'All') {
  const container = $('#projects'); container.replaceChildren();
  const projects = content.projects.filter(p => category === 'All' || p.category === category);
  projects.forEach(project => {
    const button = document.createElement('button'); button.className = 'project';
    button.setAttribute('aria-label', `View ${project.title}`);
    const frame = document.createElement('div'); frame.className = 'project-image';
    const image = document.createElement('img'); image.src = project.image; image.alt = project.title; image.loading = 'lazy'; image.decoding = 'async';
    frame.append(image);
    const caption = document.createElement('div'); caption.className = 'project-caption';
    const text = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = project.title;
    const categoryLabel = document.createElement('p'); categoryLabel.textContent = project.category;
    const arrow = document.createElement('span'); arrow.className = 'project-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true');
    text.append(title, categoryLabel); caption.append(text, arrow); button.append(frame, caption);
    button.onclick = () => { selectedProject = project; mediaIndex = 0; renderGallery(); openDialog(gallery); };
    const note = document.createElement('p'); note.className = 'project-context';
    const contexts = { Graphics: 'Playing with type, colour & Adobe Photoshop.', Interaction: 'An app idea that grew out of design research.' };
    note.textContent = contexts[project.category] || (project.video?.includes('dear-zindagi') ? 'Finding stories through photography & videography.' : 'Turning imagination into motion with AI tools.');
    text.append(note);
    container.append(button);
  });
  $('#project-status').textContent = `${projects.length} projects shown${category === 'All' ? '' : ` in ${category}`}.`;
}
function renderFilters() {
  const filters = $('.filters'); filters.replaceChildren();
  ['All', ...new Set(content.projects.map(p => p.category))].forEach(category => {
    const button = document.createElement('button'); button.textContent = category; button.setAttribute('aria-pressed', String(category === 'All'));
    button.onclick = () => {
      filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      renderProjects(category);
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
  if (selectedProject.video) return [{ type:'video', src:selectedProject.video }];
  return (selectedProject.images?.length ? selectedProject.images : [selectedProject.image]).map(src => ({ type:'image', src }));
}
function renderGallery() {
  $('#gallery-title').textContent = selectedProject.title;
  $('#gallery-category').textContent = selectedProject.category;
  $('#gallery-description').textContent = selectedProject.description;
  const link = $('#gallery-live'); link.hidden = !validLink(selectedProject.url);
  if (!link.hidden) link.href = selectedProject.url; else link.removeAttribute('href');
  const media = projectMedia(), item = media[mediaIndex], container = $('#gallery-media');
  container.querySelectorAll('video').forEach(v => v.pause()); container.replaceChildren();
  const element = document.createElement(item.type === 'video' ? 'video' : 'img'); element.src = item.src;
  if (item.type === 'video') { element.controls = true; element.playsInline = true; element.preload = 'metadata'; element.poster = selectedProject.image; }
  else element.alt = `${selectedProject.title}, image ${mediaIndex + 1}`;
  container.append(element);
  $('#gallery-counter').textContent = item.type === 'video' ? 'Film · Play to explore' : `${mediaIndex + 1} / ${media.length}`;
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
  catch { $('#save-status').textContent = 'Browser storage is unavailable. Export content to keep your changes.'; }
  renderFilters(); renderProjects(); renderContact();
};
$('#export').onclick = () => {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'content.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const video = $('#character-video');
let requestedDirection = 'right', direction = 'right';
let requestedStrength = 0, strength = 0, seeking = false, frame = 0, lastTick = 0;
const gazeTime = (side, amount) => side === 'left' ? 2.5 - amount * 1.25
  : side === 'right' ? 2.5 + amount * 1.25
  : side === 'up' ? 5 + amount * 1.05 : 7.5 + amount * 1.05;
function animateGaze(now) {
  frame = 0;
  const dt = Math.min((now - (lastTick || now - 16)) / 1000, .05);
  lastTick = now;
  const changingDirection = direction !== requestedDirection;
  const goal = changingDirection ? 0 : requestedStrength;
  strength += (goal - strength) * (1 - Math.exp(-12 * dt));
  if (changingDirection && strength < .025) { strength = 0; direction = requestedDirection; }
  if (Math.abs(strength - goal) < .002) strength = goal;
  const time = Math.max(0, Math.min(video.duration - .045, gazeTime(direction, strength)));
  if (!seeking && video.readyState >= 2 && Number.isFinite(time) && Math.abs(video.currentTime - time) > .016) {
    seeking = true; video.currentTime = time;
  }
  if (direction !== requestedDirection || Math.abs(strength - requestedStrength) > .001 || seeking) frame = requestAnimationFrame(animateGaze);
  else lastTick = 0;
}
function wakeGaze() { if (!frame) frame = requestAnimationFrame(animateGaze); }
video.addEventListener('seeked', () => { seeking = false; wakeGaze(); });
video.addEventListener('loadeddata', () => { video.pause(); wakeGaze(); });
window.addEventListener('pointermove', event => {
  if (reducedMotion.matches || event.pointerType === 'touch') return;
  const x = Math.max(-1, Math.min(1, event.clientX / innerWidth * 2 - 1));
  const y = Math.max(-1, Math.min(1, event.clientY / innerHeight * 2 - 1));
  const horizontal = Math.abs(x), vertical = Math.abs(y);
  // Keep the current axis near diagonals so tiny pointer changes do not flip poses.
  const wasHorizontal = requestedDirection === 'left' || requestedDirection === 'right';
  const useHorizontal = wasHorizontal ? horizontal >= vertical - .14 : horizontal > vertical + .14;
  requestedDirection = useHorizontal ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
  requestedStrength = Math.max(0, (Math.max(horizontal, vertical) - .14) / .86);
  wakeGaze();
});
function resetGaze() { requestedStrength = 0; wakeGaze(); }
document.documentElement.addEventListener('pointerleave', resetGaze);
reducedMotion.addEventListener('change', resetGaze);

const line = $('#typewriter'), lineText = line.textContent;
if (!reducedMotion.matches) {
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
    readyAudio(); tone(740, audio.currentTime, .075, .45, clickBus);
    tone(1110, audio.currentTime + .008, .045, .15, clickBus);
  }
  // Original four-chord instrumental: soft electric-piano tones, bass and brushed rhythm.
  const chords = [[130.81,164.81,196,246.94],[110,130.81,164.81,196],[87.31,110,130.81,164.81],[98,123.47,146.83,174.61]];
  const melody = [0,2,3,2,0,1,2,1];
  const step = 60 / 76 / 2;
  function scheduleBeat(time, index) {
    const chord = chords[Math.floor(index / 8) % chords.length];
    if (index % 8 === 0) {
      chord.forEach((note, i) => {
        tone(note * 2, time + i * .028, 2.7, .10, musicBus);
        tone(note * 4, time + i * .028, 1.2, .018, musicBus);
      });
      tone(chord[0] / 2, time, 1.4, .20, musicBus);
    }
    if (index % 2 === 0) tone(chord[melody[Math.floor(index / 2) % melody.length]] * 4, time + .025, .72, .045, musicBus);
    if (index % 4 === 0) tone(65.4, time, .13, .14, musicBus);
    if (index % 4 === 2) {
      const noise = audio.createBuffer(1, Math.floor(audio.sampleRate * .09), audio.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples.length / 5));
      const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
      source.buffer = noise; filter.type = 'lowpass'; filter.frequency.value = 1600; gain.gain.value = .035;
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
    musicBus.gain.cancelScheduledValues(audio.currentTime); musicBus.gain.setTargetAtTime(.55, audio.currentTime, .25);
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

// Soft colour tides sit behind the content and follow the pointer with inertia.
(() => {
  const themes = [
    ['.work', '#ffc09f', '#bba4f0'],
    ['.about', '#c9adf0', '#f5a0c4'],
    ['.contact', '#b5dfa1', '#ffda84']
  ];
  const layers = themes.map(([selector, left, right]) => {
    const section = $(selector), canvas = document.createElement('canvas');
    canvas.className = 'color-wave'; canvas.setAttribute('aria-hidden', 'true');
    section.prepend(canvas);
    return { section, canvas, context: canvas.getContext('2d'), left, right, width: 0, height: 0, visible: true };
  });
  let x = 0, y = 0, targetX = 0, targetY = 0, animation = 0, previousTime = 0;
  function paint(layer) {
    const { context: ctx, width: w, height: h, left, right } = layer;
    if (!ctx || !w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const middle = w * (.5 + x * .23), phase = x * 2.7 + y * 2.1;
    const wash = ctx.createLinearGradient(middle - w * .55, 0, middle + w * .55, h);
    wash.addColorStop(0, left); wash.addColorStop(1, right);
    ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
    for (let band = 0; band < 3; band++) {
      const start = middle + (band - 1.5) * w * .26;
      ctx.fillStyle = (band % 2 ? left : right) + 'a6'; ctx.beginPath();
      for (let row = -20; row <= h + 20; row += 8) {
        const edge = start + Math.sin(row / Math.max(h, 1) * Math.PI * 2 + phase + band * .85) * w * .18 + Math.cos(row / Math.max(h, 1) * Math.PI * 3 - phase) * w * .045;
        if (row === -20) ctx.moveTo(edge, row); else ctx.lineTo(edge, row);
      }
      for (let row = h + 20; row >= -20; row -= 8) {
        const edge = start + w * .29 + Math.sin(row / Math.max(h, 1) * Math.PI * 2 + phase + band * .85 + .4) * w * .18;
        ctx.lineTo(edge, row);
      }
      ctx.closePath(); ctx.fill();
    }
    // The paper dots bend along the same tide as the colour ribbons.
    ctx.fillStyle = '#6439cf38';
    for (let row = -24; row < h + 24; row += 24) {
      for (let column = -24; column < w + 24; column += 24) {
        const dotX = column + x * 22 + Math.sin(row / h * Math.PI * 2 + phase) * 12;
        const dotY = row + y * 16 + Math.sin(column / w * Math.PI * 2 + phase) * 8;
        ctx.beginPath(); ctx.arc(dotX, dotY, 1, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  const sizes = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const layer = layers.find(item => item.section === entry.target);
      layer.width = Math.round(entry.contentRect.width); layer.height = Math.round(entry.contentRect.height);
      // Use the complete border box, including section padding.
      layer.width = layer.section.clientWidth; layer.height = layer.section.clientHeight;
      const density = Math.min(devicePixelRatio || 1, 1.25);
      layer.canvas.width = Math.round(layer.width * density); layer.canvas.height = Math.round(layer.height * density);
      layer.context?.setTransform(density, 0, 0, density, 0, 0); paint(layer);
    });
  });
  const visibility = new IntersectionObserver(entries => entries.forEach(entry => {
    const layer = layers.find(item => item.section === entry.target); layer.visible = entry.isIntersecting;
    if (layer.visible) paint(layer);
  }));
  layers.forEach(layer => { sizes.observe(layer.section); visibility.observe(layer.section); });
  function drift(time) {
    const smoothing = 1 - Math.exp(-Math.min(time - (previousTime || time - 16), 40) / 160);
    previousTime = time; x += (targetX - x) * smoothing; y += (targetY - y) * smoothing;
    document.documentElement.style.setProperty('--wave-dots-x', `${x * 22}px`);
    document.documentElement.style.setProperty('--wave-dots-y', `${y * 16}px`);
    layers.forEach(layer => { if (layer.visible) paint(layer); });
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .001) animation = requestAnimationFrame(drift);
    else { animation = 0; previousTime = 0; }
  }
  function start() { if (!animation) animation = requestAnimationFrame(drift); }
  window.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType === 'touch') return;
    targetX = event.clientX / innerWidth * 2 - 1; targetY = event.clientY / innerHeight * 2 - 1; start();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { targetX = targetY = 0; start(); });
  reducedMotion.addEventListener('change', () => { targetX = targetY = 0; start(); });
})();
