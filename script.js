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
    const response = await fetch('content.json'); if (!response.ok) throw new Error('Could not load project content.');
    content = await response.json();
    try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (saved?.projects?.length === content.projects.length) { content.linkedin = saved.linkedin || ''; content.projects.forEach((p, i) => { if (typeof saved.projects[i].title === 'string') p.title = saved.projects[i].title; }); } } catch {}
    renderFilters(); renderProjects(); renderContact();
  } catch (error) { $('#projects').textContent = 'Projects could not load. Please refresh the page.'; $('#personalize').disabled = true; console.error(error); }
})();
