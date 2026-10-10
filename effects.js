// Enhance the normal anchor journey without delaying navigation or replacing scrolling.
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const link = document.querySelector('.hero-actions a[href="#work"]');
  const work = document.getElementById('work');
  const hero = document.getElementById('home');
  if (!link || !work || !hero) return;
  let pending = false, expiry, arrival;
  const reset = () => {
    pending = false;
    clearTimeout(expiry); clearTimeout(arrival);
    link.classList.remove('is-launching'); work.classList.remove('is-arriving');
  };
  const arrive = () => {
    if (!pending || motion.matches) return;
    pending = false;
    work.classList.remove('is-arriving');
    requestAnimationFrame(() => work.classList.add('is-arriving'));
    arrival = setTimeout(reset, 750);
  };
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) arrive();
  }, { threshold:0, rootMargin:'0px 0px -30% 0px' });
  observer.observe(work.querySelector('.work-heading'));
  link.addEventListener('click', event => {
    if (motion.matches || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    reset(); pending = true; link.classList.add('is-launching');
    const bounds = work.querySelector('.work-heading').getBoundingClientRect();
    if (bounds.top >= 0 && bounds.top < innerHeight*.7) arrive();
    expiry = setTimeout(reset, 2500);
  });
  motion.addEventListener('change', reset);
  new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('effects-paused', !entry.isIntersecting || document.hidden);
  }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    const bounds = hero.getBoundingClientRect();
    document.body.classList.toggle('effects-paused', document.hidden || bounds.bottom <= 0);
    if (document.hidden) reset();
  });
})();
