// ===== Helpers =====
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// ===== Year =====
$("#year").textContent = new Date().getFullYear();

// ===== Mobile menu =====
const hamburger = $("#hamburger");
const mobileMenu = $("#mobileMenu");

hamburger?.addEventListener("click", () => {
  const expanded = hamburger.getAttribute("aria-expanded") === "true";
  hamburger.setAttribute("aria-expanded", String(!expanded));
  mobileMenu.hidden = expanded;
});

// Close menu on click
$$(".mobile-menu a").forEach(a => {
  a.addEventListener("click", () => {
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
  });
});

// ===== Button glow follow mouse (primary buttons) =====
$$(".btn--primary").forEach(btn => {
  btn.addEventListener("pointermove", (e) => {
    const r = btn.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    btn.style.setProperty("--mx", mx + "%");
    btn.style.setProperty("--my", my + "%");
  });
});

// ===== Reveal on scroll =====
const revealEls = $$(".reveal");
revealEls.forEach(el => {
  const d = el.dataset.delay ? `${el.dataset.delay}ms` : "0ms";
  el.style.setProperty("--d", d);
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach(el => io.observe(el));

// ===== Tilt card effect =====
const tilt = $("#tiltCard");
if(tilt){
  tilt.addEventListener("pointermove", (e) => {
    const r = tilt.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top) / r.height;  // 0..1
    const rx = (py - 0.5) * -10; // rotateX
    const ry = (px - 0.5) * 12;  // rotateY
    tilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    // shine follow
    const shine = tilt.querySelector(".card__shine");
    if(shine){
      shine.style.transform = `translate3d(${(px - 0.5) * 40}px, ${(py - 0.5) * 30}px, 40px)`;
    }
  });

  tilt.addEventListener("pointerleave", () => {
    tilt.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0px)";
    const shine = tilt.querySelector(".card__shine");
    if(shine) shine.style.transform = "translate3d(0,0,40px)";
  });
}

// ===== Copy Zalo phone =====
const copyBtn = document.getElementById("copyZalo");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const phone = copyBtn.dataset.phone || "0907657980";
    try {
      await navigator.clipboard.writeText(phone);
      const old = copyBtn.textContent;
      copyBtn.textContent = "Đã copy: " + phone;
      setTimeout(() => (copyBtn.textContent = old), 1200);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = phone;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      const old = copyBtn.textContent;
      copyBtn.textContent = "Đã copy: " + phone;
      setTimeout(() => (copyBtn.textContent = old), 1200);
    }
  });
}

// ===== Particles (Canvas) =====
const canvas = $("#particles");
const ctx = canvas.getContext("2d", { alpha: true });

let W = 0, H = 0, DPR = 1;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize, { passive: true });
resize();

const rand = (a,b)=> a + Math.random()*(b-a);

const colors = [
  "rgba(124,58,237,.55)",
  "rgba(6,182,212,.45)",
  "rgba(34,197,94,.35)",
  "rgba(255,255,255,.25)"
];

let mouse = { x: W/2, y: H/2, active:false };
window.addEventListener("pointermove", (e) => {
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
}, { passive:true });
window.addEventListener("pointerleave", () => mouse.active = false, { passive:true });

const COUNT = Math.floor(clamp((W*H)/25000, 30, 90));
const particles = Array.from({length: COUNT}).map(() => ({
  x: rand(0, W),
  y: rand(0, H),
  r: rand(1.2, 3.2),
  vx: rand(-0.35, 0.35),
  vy: rand(-0.25, 0.25),
  c: colors[Math.floor(Math.random()*colors.length)]
}));

function step(){
  ctx.clearRect(0,0,W,H);

  // soft vignette
  const g = ctx.createRadialGradient(W*0.5, H*0.4, 50, W*0.5, H*0.4, Math.max(W,H)*0.8);
  g.addColorStop(0, "rgba(255,255,255,.03)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // update
  for (const p of particles){
    p.x += p.vx;
    p.y += p.vy;

    // mouse attraction (subtle repel)
    if(mouse.active){
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.hypot(dx,dy);
      if(dist < 160){
        p.x -= dx * 0.002;
        p.y -= dy * 0.002;
      }
    }

    if(p.x < -20) p.x = W + 20;
    if(p.x > W + 20) p.x = -20;
    if(p.y < -20) p.y = H + 20;
    if(p.y > H + 20) p.y = -20;

    // draw
    ctx.beginPath();
    ctx.fillStyle = p.c;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  }

  // links
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.hypot(dx,dy);
      if(d < 120){
        ctx.strokeStyle = `rgba(255,255,255,${(1 - d/120) * 0.10})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(step);
}
step();
