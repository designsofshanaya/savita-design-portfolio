"use strict";
document.documentElement.classList.add("js");
const $ = (selector) => document.querySelector(selector);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
document
  .querySelectorAll("[data-year]")
  .forEach((el) => (el.textContent = new Date().getFullYear()));

// Progressive enhancement: navigation and all project pages work without JavaScript.
const menu = $(".menu-toggle");
const nav = $("#site-navigation");
function closeMenu(restoreFocus = false) {
  if (!menu || !nav) return;
  const wasOpen = menu.getAttribute("aria-expanded") === "true";
  menu.setAttribute("aria-expanded", "false");
  menu.textContent = "Menu";
  nav.classList.remove("open");
  if (wasOpen && restoreFocus) menu.focus();
}
if (menu && nav) {
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? "Close" : "Menu";
    nav.classList.toggle("open", open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu(true);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-inner")) closeMenu();
  });
  matchMedia("(min-width: 701px)").addEventListener("change", (e) => {
    if (e.matches) closeMenu();
  });
}
const filters = $(".filters");
if (filters) {
  filters.hidden = false;
  const projects = [...document.querySelectorAll("[data-project]")];
  const status = $("#project-status");
  const choose = (category) => {
    filters
      .querySelectorAll("button")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === category),
        ),
      );
    projects.forEach(
      (project) =>
        (project.hidden =
          category !== "All" && project.dataset.category !== category),
    );
    const count = projects.filter((project) => !project.hidden).length;
    status.textContent = `${count} ${count === 1 ? "project" : "projects"} shown${category === "All" ? "" : ` in ${category}`}.`;
  };
  filters.addEventListener("click", (e) => {
    const button = e.target.closest("[data-filter]");
    if (button) choose(button.dataset.filter);
  });
  choose("All");
}

// One signature interaction, explicitly enabled and always removable.
const video = $("#character-video");
const poster = $("#character-poster");
const motionButton = $("#motion-toggle");
if (video && poster && motionButton) {
  let enabled = !reducedMotion.matches,
    loaded = false,
    requestedDirection = "right",
    direction = "right";
  let requestedStrength = 0,
    strength = 0,
    seeking = false,
    frame = 0,
    lastTick = 0;
  const gazeTime = (side, amount) =>
    side === "left"
      ? 2.5 - amount * 1.25
      : side === "right"
        ? 2.5 + amount * 1.25
        : side === "up"
          ? 5 + amount * 1.05
          : 7.5 + amount * 1.05;
  function draw(now) {
    frame = 0;
    if (!enabled || reducedMotion.matches || document.hidden || video.hidden)
      return;
    const dt = Math.min((now - (lastTick || now - 16)) / 1000, 0.05);
    lastTick = now;
    const changingDirection = direction !== requestedDirection;
    const goal = changingDirection ? 0 : requestedStrength;
    strength += (goal - strength) * (1 - Math.exp(-12 * dt));
    if (changingDirection && strength < 0.025) {
      strength = 0;
      direction = requestedDirection;
    }
    if (Math.abs(strength - goal) < 0.002) strength = goal;
    const time = Math.max(
      0,
      Math.min(video.duration - 0.045, gazeTime(direction, strength)),
    );
    if (
      !seeking &&
      video.readyState >= 2 &&
      Number.isFinite(time) &&
      Math.abs(video.currentTime - time) > 0.016
    ) {
      seeking = true;
      video.currentTime = time;
    }
    if (
      direction !== requestedDirection ||
      Math.abs(strength - requestedStrength) > 0.001 ||
      seeking
    )
      frame = requestAnimationFrame(draw);
    else lastTick = 0;
  }
  function wake() {
    if (enabled && loaded && !frame && !video.hidden)
      frame = requestAnimationFrame(draw);
  }
  function sync() {
    if (reducedMotion.matches) enabled = false;
    motionButton.disabled = reducedMotion.matches;
    motionButton.setAttribute("aria-pressed", String(enabled));
    motionButton.textContent = reducedMotion.matches
      ? "Reduced motion enabled"
      : enabled
        ? "Disable character motion"
        : "Enable character motion";
    video.hidden = !enabled || !loaded;
    poster.hidden = enabled && loaded;
    if (!enabled) {
      video.pause();
      cancelAnimationFrame(frame);
      frame = 0;
      lastTick = 0;
    } else wake();
  }
  video.addEventListener("loadeddata", () => {
    loaded = true;
    video.pause();
    sync();
  });
  video.addEventListener("seeked", () => {
    seeking = false;
    wake();
  });
  video.addEventListener("error", () => {
    enabled = false;
    loaded = false;
    sync();
    motionButton.disabled = true;
    motionButton.textContent = "Character motion unavailable";
  });
  motionButton.addEventListener("click", () => {
    enabled = !enabled;
    if (enabled && !video.getAttribute("src")) {
      video.src = "gaze-four-directions.mp4";
      video.preload = "auto";
      video.load();
    }
    sync();
  });
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!enabled || reducedMotion.matches || e.pointerType === "touch")
        return;
      const bounds = video.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      const x = Math.max(-1, Math.min(1, (e.clientX / innerWidth) * 2 - 1));
      const y = Math.max(-1, Math.min(1, (e.clientY / innerHeight) * 2 - 1));
      const horizontal = Math.abs(x),
        vertical = Math.abs(y);
      const wasHorizontal =
        requestedDirection === "left" || requestedDirection === "right";
      const useHorizontal = wasHorizontal
        ? horizontal >= vertical - 0.14
        : horizontal > vertical + 0.14;
      requestedDirection = useHorizontal
        ? x < 0
          ? "left"
          : "right"
        : y < 0
          ? "up"
          : "down";
      requestedStrength = Math.max(
        0,
        (Math.max(horizontal, vertical) - 0.14) / 0.86,
      );
      wake();
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => {
    requestedStrength = 0;
    wake();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      video.pause();
      cancelAnimationFrame(frame);
      frame = 0;
    } else wake();
  });
  if (enabled) { video.src = "gaze-four-directions.mp4"; video.preload = "auto"; video.load(); }
  reducedMotion.addEventListener("change", sync);
  sync();
}
// Quiet, locally composed audio; music only starts after an explicit click.
(() => {
  const play = $("#lofi-toggle");
  if (!play) return;
  let audio,
    musicBus,
    musicTimer,
    nextBeat = 0,
    beat = 0;
  let musicPlaying = false;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) {
    play.hidden = true;
    return;
  }
  function readyAudio() {
    if (!audio) {
      audio = new AudioEngine();
      musicBus = audio.createGain();
      musicBus.gain.value = 0;
      musicBus.connect(audio.destination);
    }
    if (audio.state === "suspended") audio.resume().catch(() => {});
  }
  function tone(frequency, time, length, level, output, type = "sine") {
    const oscillator = audio.createOscillator(),
      envelope = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + length);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(time);
    oscillator.stop(time + length + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  // Original four-chord instrumental: soft electric-piano tones, bass and brushed rhythm.
  const chords = [
    [146.83, 174.61, 220, 261.63],
    [130.81, 164.81, 196, 246.94],
    [87.31, 110, 130.81, 164.81],
    [98, 123.47, 146.83, 185],
  ];
  const melody = [3, 2, 1, 0, 1, 2, 3, 1];
  const step = 60 / 64 / 2;
  function scheduleBeat(time, index) {
    const chord = chords[Math.floor(index / 8) % chords.length];
    if (index % 8 === 0) {
      chord.forEach((note, i) => {
        tone(note * 2, time + i * 0.06, 3.8, 0.07, musicBus);
        tone(note, time + i * 0.06, 2.8, 0.025, musicBus);
      });
      tone(chord[0] / 2, time, 2.6, 0.09, musicBus);
    }
    if (index % 4 === 0)
      tone(
        chord[melody[Math.floor(index / 4) % melody.length]] * 2,
        time + 0.12,
        1.8,
        0.025,
        musicBus,
      );
    if (index % 8 === 6) {
      const noise = audio.createBuffer(
        1,
        Math.floor(audio.sampleRate * 0.09),
        audio.sampleRate,
      );
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++)
        samples[i] =
          (Math.random() * 2 - 1) * Math.exp(-i / (samples.length / 5));
      const source = audio.createBufferSource(),
        filter = audio.createBiquadFilter(),
        gain = audio.createGain();
      source.buffer = noise;
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.value = 0.012;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(musicBus);
      source.start(time);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
  }
  function stopMusic() {
    musicPlaying = false;
    clearInterval(musicTimer);
    if (audio) {
      musicBus.gain.cancelScheduledValues(audio.currentTime);
      musicBus.gain.setTargetAtTime(0, audio.currentTime, 0.09);
    }
    play.setAttribute("aria-pressed", "false");
    play.setAttribute("aria-label", "Play lo-fi music");
    play.querySelector(".audio-label").textContent = "Play lo-fi";
  }
  play.onclick = () => {
    if (musicPlaying) {
      stopMusic();
      return;
    }
    readyAudio();
    musicPlaying = true;
    beat = 0;
    nextBeat = audio.currentTime + 0.08;
    musicBus.gain.cancelScheduledValues(audio.currentTime);
    musicBus.gain.setTargetAtTime(0.38, audio.currentTime, 0.6);
    const schedule = () => {
      while (nextBeat < audio.currentTime + 0.16) {
        scheduleBeat(nextBeat, beat++);
        nextBeat += step;
      }
    };
    schedule();
    musicTimer = setInterval(schedule, 70);
    play.setAttribute("aria-pressed", "true");
    play.setAttribute("aria-label", "Pause lo-fi music");
    play.querySelector(".audio-label").textContent = "Pause lo-fi";
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && musicPlaying) stopMusic();
  });
})();

// User-played project films pause when the page is no longer visible.
document.addEventListener("visibilitychange", () => {
  if (document.hidden)
    document
      .querySelectorAll(".video-stage video")
      .forEach((video) => video.pause());
});


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
