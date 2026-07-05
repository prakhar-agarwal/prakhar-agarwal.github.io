// Design space search — three-act story:
// 1. Frustrated wandering (chaos)
// 2. Hints of structure (some dots find wells, others still lost)
// 3. Convergence (gear emerges, dots settle, stillness)
// Then dissolve and repeat.
(function () {
  var container = document.getElementById('rastrigin-container');
  if (!container) return;

  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.margin = '1.5em 0';
  canvas.style.width = '100%';
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W, H, dpr;
  var N = 160;
  var dots = [];
  var targets = [];
  var trails = [];
  var frame = 0;
  var totalFrames = 720; // ~12s at 60fps
  var rafId = null;
  var holdTimer = null;

  // Gear profile
  function gearShape(cx, cy, inner, outer, teeth, nPts) {
    var pts = [];
    for (var i = 0; i < nPts; i++) {
      var a = (i / nPts) * Math.PI * 2;
      var blend = 0.5 + 0.5 * Math.tanh(Math.sin(a * teeth) * 2.5);
      var r = inner + blend * (outer - inner);
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = container.offsetWidth || 400;
    H = Math.min(W * 0.55, 300);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var scale = Math.min(W, H) * 0.35;
    targets = gearShape(W / 2, H / 2, scale * 0.6, scale, 10, N);
  }

  // Cancel any pending animation/timer
  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  }

  function scatter() {
    stop();
    dots = [];
    frame = 0;
    trails = [];
    var cx = W * (0.2 + Math.random() * 0.6);
    var cy = H * (0.2 + Math.random() * 0.6);
    for (var i = 0; i < N; i++) {
      dots.push({
        x: cx + (Math.random() - 0.5) * 120,
        y: cy + (Math.random() - 0.5) * 120,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
    rafId = requestAnimationFrame(loop);
  }

  // Dissolve from current positions — kick dots outward, restart the cycle
  function dissolve() {
    stop();
    frame = 0;
    trails = [];
    for (var i = 0; i < dots.length; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1.5 + Math.random() * 2.5;
      dots[i].vx = Math.cos(angle) * speed;
      dots[i].vy = Math.sin(angle) * speed;
    }
    rafId = requestAnimationFrame(loop);
  }

  function step() {
    frame++;
    var t = Math.min(1, frame / totalFrames);

    // Pull: zero until t=0.3, then smoothstep ramp
    var pullT = Math.max(0, (t - 0.3) / 0.7);
    pullT = pullT * pullT * (3 - 2 * pullT);
    var pull = pullT * 0.1;

    // Noise: strong early, dies off in act 3
    var noiseT = Math.max(0, (t - 0.3) / 0.7);
    var noise = 3.5 * (1 - noiseT * noiseT);

    // Damping: loose early, heavy late
    var damping = 0.92 - pullT * 0.42;

    for (var i = 0; i < N; i++) {
      var d = dots[i];
      var tgt = targets[i];
      var px = d.x, py = d.y;

      var dx = (tgt.x - d.x) * pull;
      var dy = (tgt.y - d.y) * pull;

      var nx = (Math.random() - 0.5) * noise;
      var ny = (Math.random() - 0.5) * noise;

      // Proximity drag — subtle lingering near hidden structure
      var dd = Math.sqrt((tgt.x - d.x) * (tgt.x - d.x) + (tgt.y - d.y) * (tgt.y - d.y));
      var proxDrag = dd < 30 ? 0.92 : 1.0;

      d.vx = d.vx * damping * proxDrag + dx + nx;
      d.vy = d.vy * damping * proxDrag + dy + ny;
      d.x += d.vx;
      d.y += d.vy;

      if (d.x < 8) { d.x = 8; d.vx *= -0.3; }
      if (d.x > W - 8) { d.x = W - 8; d.vx *= -0.3; }
      if (d.y < 8) { d.y = 8; d.vy *= -0.3; }
      if (d.y > H - 8) { d.y = H - 8; d.vy *= -0.3; }

      var spd = Math.abs(d.x - px) + Math.abs(d.y - py);
      if (spd > 0.8 && trails.length < 2000) {
        trails.push({ x0: px, y0: py, x1: d.x, y1: d.y, life: 1.0 });
      }
    }

    var trailFade = t > 0.8 ? 0.03 : 0.012;
    for (var j = trails.length - 1; j >= 0; j--) {
      trails[j].life -= trailFade;
      if (trails[j].life <= 0) trails.splice(j, 1);
    }
  }

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var t = Math.min(1, frame / totalFrames);

    // Trails — batched by opacity
    ctx.lineWidth = 0.5;
    var buckets = [[], [], [], [], []];
    for (var j = 0; j < trails.length; j++) {
      var bi = Math.min(4, Math.floor(trails[j].life * 5));
      buckets[bi].push(trails[j]);
    }
    for (var b = 0; b < 5; b++) {
      if (buckets[b].length === 0) continue;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,0,0,' + ((b + 0.5) / 5 * 0.10) + ')';
      for (var k = 0; k < buckets[b].length; k++) {
        ctx.moveTo(buckets[b][k].x0, buckets[b][k].y0);
        ctx.lineTo(buckets[b][k].x1, buckets[b][k].y1);
      }
      ctx.stroke();
    }

    // Dots
    var maxD = Math.max(W, H) * 0.4;
    for (var i = 0; i < N; i++) {
      var d = dots[i];
      var dd = dist(d, targets[i]);
      var nearness = 1 - Math.min(1, dd / maxD);
      var settled = nearness * t * t;

      var alpha = 0.25 + settled * 0.75;
      var r = 2.0 + settled * 0.6;

      if (t < 0.3) {
        alpha = 0.35;
        r = 2.0;
      }

      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
      ctx.fill();
    }
  }

  function loop() {
    rafId = null;
    step();
    draw();

    // Hold after convergence — do not auto-restart, wait for reset click
    if (frame > totalFrames + 60) {
      return;
    }

    rafId = requestAnimationFrame(loop);
  }

  // Reset button
  var resetBtn = document.createElement('div');
  resetBtn.textContent = 'reset';
  resetBtn.style.cssText = 'font-family:monospace;font-size:10px;color:#ccc;cursor:pointer;user-select:none;text-align:right;';
  resetBtn.addEventListener('mouseenter', function () { resetBtn.style.color = '#999'; });
  resetBtn.addEventListener('mouseleave', function () { resetBtn.style.color = '#ccc'; });
  resetBtn.addEventListener('click', dissolve);
  container.appendChild(resetBtn);

  function initIfVisible() {
    if (container.offsetWidth > 0) {
      resize();
      scatter();
    }
  }

  initIfVisible();
  window.addEventListener('resize', function () { resize(); });
  window.addEventListener('hashchange', initIfVisible);
})();
