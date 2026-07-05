// Hidden nav particle effect — shared across all pages
(function() {
  const link = document.querySelector('.nav-hidden a');
  if (!link) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  let particles = [], active = false;
  let mx = 0, my = 0;
  const P = { maxParticles: 22, outSpeed: 1.0, tangSpeed: 12.0, gravity: 0.30, friction: 0.96, life: 0.70, decay: 0.013, size: 1.2 };
  function spawn() {
    const angle = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 8;
    const out = (1.5 + Math.random() * P.outSpeed);
    const tang = (Math.random() - 0.5) * P.tangSpeed * (Math.random() > 0.5 ? 1 : -1);
    return { x: mx + Math.cos(angle) * r, y: my + Math.sin(angle) * r, vx: Math.cos(angle) * out + Math.cos(angle + Math.PI / 2) * tang, vy: Math.sin(angle) * out + Math.sin(angle + Math.PI / 2) * tang, life: P.life * (0.8 + Math.random() * 0.4), decay: P.decay * (0.8 + Math.random() * 0.5), size: P.size * (0.6 + Math.random() * 0.8) };
  }
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (active && particles.length < P.maxParticles) { particles.push(spawn()); }
    for (const p of particles) {
      const dx = mx - p.x, dy = my - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      p.vx += (dx / dist) * P.gravity; p.vy += (dy / dist) * P.gravity;
      p.vx *= P.friction; p.vy *= P.friction;
      p.x += p.vx; p.y += p.vy;
      p.life -= active ? p.decay : p.decay * 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(51,51,51,' + Math.max(0, p.life) + ')'; ctx.fill();
    }
    particles = particles.filter(p => p.life > 0);
    requestAnimationFrame(loop);
  }
  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  link.addEventListener('mouseenter', () => active = true);
  link.addEventListener('mouseleave', () => active = false);
  loop();
})();
