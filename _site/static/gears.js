// Gears + Elastic Chain Text — Canvas 2D, zero dependencies
// Arrow keys shift between rear gears (cassette), each gear = different text
// Text auto-fits: spacing calculated from path length and character width
//
// TODO: Add faint background gears + chains extending off-canvas to suggest a
// larger machine. Additional gear pairs with their own text chains, drawn at
// low opacity, partially visible at the edges of the canvas.
(() => {
  const canvas = document.getElementById('gears-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // --- Font & measurement ---
  const FONT_SIZE = 13;
  const FONT = `${FONT_SIZE}px monospace`;
  const SPRING_K = 0.15;
  const DAMPING = 0.85;
  const CHAIN_MARGIN = 6;
  const LINE_W = 1.2;

  // Measure a monospace char width once
  ctx.font = FONT;
  const CHAR_W = ctx.measureText('M').width;

  // Spacing bounds (in pixels between char centers)
  const MIN_SPACING_PX = CHAR_W * 0.95;  // tight but no overlap
  const MAX_SPACING_PX = CHAR_W * 1.8;   // comfortable but no big gaps

  // --- Text fitting ---
  // Given a path length, returns { min, max } character count
  function getCharBounds(pathLen) {
    const max = Math.floor(pathLen / MIN_SPACING_PX);
    const min = Math.ceil(pathLen / MAX_SPACING_PX);
    return { min, max };
  }

  // Given path length and char count, returns REST_SPACING as fraction of path
  function computeSpacing(pathLen, numChars) {
    return 1.0 / numChars;
  }

  // --- Cassette config ---
  // Text per gear will be selected/truncated to fit bounds
  const gearTexts = [
    { r: 38, texts: [
      "Investigate \u2022 Simulate \u2022 Fabricate \u2022 Calibrate \u2022 Educate \u2022 Replicate \u2022 ",
    ]},
    { r: 56, texts: [
      "Autonomous climate & health R&D \u2022 Computational design & education \u2022 Green steel & hydrogen \u2022 AI & human learning \u2022 ",
    ]},
    { r: 70, texts: [
      "Algae bioreactor \u2022 Ghost net recovery \u2022 Medical device AM \u2022 Salmon robotics \u2022 Solar vehicles \u2022 Anti-heatstroke clothing \u2022 ",
    ]},
  ];

  // Build cassette: for each gear, pick the best-fitting text
  let cassette = [];
  let currentGearIdx = 0;
  let targetGearIdx = 0;

  // Front chainring (fixed)
  const front = { x: 0, y: 0, r: 70, angle: 0, speed: 0.008 };
  const rear = { x: 0, y: 0, r: 38, angle: 0, speed: 0 }; // must match gearTexts[0].r

  // Shift animation
  let shiftT = 0;
  let shiftFrom = 38;
  let shiftTo = 38;
  const SHIFT_DURATION = 0.7;
  let shiftBasePathLen = 0; // snapshot at shift start
  const burstAmount = 1.0;  // max burst

  // --- State ---
  let chars = [];
  let restSpacing = 0.02;
  let pathSegments = [];
  let totalPathLength = 0;
  let masterT = 0;
  let time = 0;
  let dpr = 1;
  let canvasW = 0, canvasH = 0;

  // --- Compute path length for a given rear radius (without side effects) ---
  function computePathLength(rearR) {
    const r1 = front.r + CHAIN_MARGIN;
    const r2 = rearR + CHAIN_MARGIN;
    const dx = rear.x - front.x;
    const dy = rear.y - front.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= Math.abs(r1 - r2)) return 0;

    const alpha = Math.asin((r1 - r2) / dist);
    const base = Math.atan2(dy, dx);

    const topF = base - Math.PI / 2 + alpha;
    const botF = base + Math.PI / 2 - alpha;
    const topR = topF;
    const botR = botF;

    // Top line
    const TF = { x: front.x + r1 * Math.cos(topF), y: front.y + r1 * Math.sin(topF) };
    const TR = { x: rear.x + r2 * Math.cos(topR), y: rear.y + r2 * Math.sin(topR) };
    const BF = { x: front.x + r1 * Math.cos(botF), y: front.y + r1 * Math.sin(botF) };
    const BR = { x: rear.x + r2 * Math.cos(botR), y: rear.y + r2 * Math.sin(botR) };

    const topLen = Math.hypot(TF.x - TR.x, TF.y - TR.y);
    const botLen = Math.hypot(BR.x - BF.x, BR.y - BF.y);

    let arcFSweep = botF - topF;
    while (arcFSweep > 0) arcFSweep -= Math.PI * 2;
    const frontArc = r1 * Math.abs(arcFSweep);

    let arcRSweep = topR - botR;
    while (arcRSweep > 0) arcRSweep -= Math.PI * 2;
    const rearArc = r2 * Math.abs(arcRSweep);

    return topLen + frontArc + botLen + rearArc;
  }

  // --- Select best text for each gear ---
  function buildCassette() {
    cassette = gearTexts.map(gear => {
      const pathLen = computePathLength(gear.r);
      const bounds = getCharBounds(pathLen);

      // Try each candidate text, pick the one that fits best
      let bestText = null;
      let bestScore = Infinity;

      for (const t of gear.texts) {
        const len = t.length;
        if (len >= bounds.min && len <= bounds.max) {
          // Score: how centered is it in the valid range? Lower = better
          const mid = (bounds.min + bounds.max) / 2;
          const score = Math.abs(len - mid);
          if (score < bestScore) {
            bestScore = score;
            bestText = t;
          }
        }
      }

      // Fallback: pick closest to bounds
      if (!bestText) {
        let closest = gear.texts[0];
        let closestDist = Infinity;
        for (const t of gear.texts) {
          const d = t.length < bounds.min
            ? bounds.min - t.length
            : t.length - bounds.max;
          if (d < closestDist) {
            closestDist = d;
            closest = t;
          }
        }
        bestText = closest;
      }

      return { r: gear.r, text: bestText, bounds, pathLen: Math.round(pathLen) };
    });

    // Log bounds for debugging
    console.table(cassette.map(g => ({
      r: g.r,
      pathLen: g.pathLen,
      minChars: g.bounds.min,
      maxChars: g.bounds.max,
      text: g.text,
      textLen: g.text.length,
      fits: g.text.length >= g.bounds.min && g.text.length <= g.bounds.max ? 'yes' : 'NO',
    })));
  }

  // --- Resize ---
  function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvasW = rect.width;
    canvasH = Math.min(420, window.innerHeight * 0.55);
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutGears();
    buildCassette();
    buildPath();
  }

  function layoutGears() {
    // On wide screens, bias left to align with text; on mobile, center
    const cx = canvasW > 500 ? canvasW * 0.32 : canvasW / 2;
    const cy = canvasH * 0.42;
    const dist = Math.min(canvasW * 0.42, 200); // center-to-center distance
    // Center the pair, then nudge right only if rear gear would clip left edge
    rear.x = cx - dist / 2;
    front.x = cx + dist / 2;
    const maxRearR = Math.max(...gearTexts.map(g => g.r)) + CHAIN_MARGIN;
    const minLeft = maxRearR + 4; // 4px padding
    if (rear.x < minLeft) {
      const nudge = minLeft - rear.x;
      rear.x += nudge;
      front.x += nudge;
    }
    rear.y = cy;
    front.y = cy;
    rear.speed = front.speed * (front.r / rear.r);
  }

  // --- Chain path ---
  function buildPath() {
    const r1 = front.r + CHAIN_MARGIN;
    const r2 = rear.r + CHAIN_MARGIN;
    const dx = rear.x - front.x;
    const dy = rear.y - front.y;
    const dist = Math.hypot(dx, dy);
    const base = Math.atan2(dy, dx);
    const alpha = Math.asin((r1 - r2) / dist);

    const topF = base - Math.PI / 2 + alpha;
    const topR = topF;
    const botF = base + Math.PI / 2 - alpha;
    const botR = botF;

    const TF = { x: front.x + r1 * Math.cos(topF), y: front.y + r1 * Math.sin(topF) };
    const TR = { x: rear.x + r2 * Math.cos(topR), y: rear.y + r2 * Math.sin(topR) };
    const BF = { x: front.x + r1 * Math.cos(botF), y: front.y + r1 * Math.sin(botF) };
    const BR = { x: rear.x + r2 * Math.cos(botR), y: rear.y + r2 * Math.sin(botR) };

    // CW winding: top line left→right (readable), bottom right→left (upside-down)
    pathSegments = [];

    // Seg 0: top tangent line front→rear (left→right, text right-side-up)
    pathSegments.push({
      type: 'line', x0: TF.x, y0: TF.y, x1: TR.x, y1: TR.y,
      length: Math.hypot(TR.x - TF.x, TR.y - TF.y)
    });

    // Seg 1: rear arc top→bottom (CW, positive sweep)
    let arcRSweep = botR - topR;
    while (arcRSweep < 0) arcRSweep += Math.PI * 2;
    pathSegments.push({
      type: 'arc', cx: rear.x, cy: rear.y, r: r2,
      startAngle: topR, sweep: arcRSweep,
      length: r2 * arcRSweep
    });

    // Seg 2: bottom tangent line rear→front (right→left, text upside-down)
    pathSegments.push({
      type: 'line', x0: BR.x, y0: BR.y, x1: BF.x, y1: BF.y,
      length: Math.hypot(BF.x - BR.x, BF.y - BR.y)
    });

    // Seg 3: front arc bottom→top (CW, positive sweep)
    let arcFSweep = topF - botF;
    while (arcFSweep < 0) arcFSweep += Math.PI * 2;
    pathSegments.push({
      type: 'arc', cx: front.x, cy: front.y, r: r1,
      startAngle: botF, sweep: arcFSweep,
      length: r1 * arcFSweep
    });

    totalPathLength = pathSegments.reduce((s, seg) => s + seg.length, 0);
    initChars();
  }

  function initChars() {
    const gear = cassette[currentGearIdx];
    if (!gear) return;
    const text = gear.text;
    if (chars.length > 0 && chars._text === text) return;

    // Compute spacing so text fills path exactly once
    restSpacing = computeSpacing(totalPathLength, text.length);

    chars = [];
    chars._text = text;
    for (let i = 0; i < text.length; i++) {
      // Place each char exactly at its target position — pinned to the chain
      const t = ((masterT + i * restSpacing) % 1 + 1) % 1;
      chars.push({ char: text[i], currentT: t, velocity: 0 });
    }
  }

  function switchGear(idx) {
    if (idx < 0 || idx >= cassette.length || idx === targetGearIdx) return;
    targetGearIdx = idx;
    shiftFrom = rear.r;
    shiftTo = cassette[idx].r;
    shiftT = SHIFT_DURATION;
    shiftBasePathLen = totalPathLength; // freeze reference speed
    textSwapped = false;
  }

  // --- Parametric path lookup ---
  function getPositionAt(t) {
    t = ((t % 1) + 1) % 1;
    let d = t * totalPathLength;
    for (const seg of pathSegments) {
      if (d <= seg.length + 0.001) {
        if (seg.type === 'line') {
          const frac = seg.length > 0 ? d / seg.length : 0;
          return {
            x: seg.x0 + (seg.x1 - seg.x0) * frac,
            y: seg.y0 + (seg.y1 - seg.y0) * frac,
            angle: Math.atan2(seg.y1 - seg.y0, seg.x1 - seg.x0)
          };
        } else {
          const frac = seg.length > 0 ? d / seg.length : 0;
          const a = seg.startAngle + seg.sweep * frac;
          const tangentDir = seg.sweep > 0 ? 1 : -1;
          return {
            x: seg.cx + seg.r * Math.cos(a),
            y: seg.cy + seg.r * Math.sin(a),
            angle: a + (Math.PI / 2) * tangentDir
          };
        }
      }
      d -= seg.length;
    }
    return { x: 0, y: 0, angle: 0 };
  }

  // --- Drawing ---
  function drawCircle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = LINE_W;
    ctx.stroke();
  }

  function drawAxle(x, y) {
    const s = 3;
    ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
    ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Shift arrows on the rear gear axle
  function drawShiftArrows(x, y) {
    const arrowH = 6;   // arrow head height
    const arrowW = 5;   // arrow head half-width
    const gap = 9;      // distance from center to arrow tip

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Up arrow (can shift up = to larger gear = higher index)
    if (currentGearIdx < cassette.length - 1) {
      const tipY = y - gap;
      ctx.beginPath();
      ctx.moveTo(x - arrowW, tipY + arrowH);
      ctx.lineTo(x, tipY);
      ctx.lineTo(x + arrowW, tipY + arrowH);
      ctx.stroke();
    }

    // Down arrow (can shift down = to smaller gear = lower index)
    if (currentGearIdx > 0) {
      const tipY = y + gap;
      ctx.beginPath();
      ctx.moveTo(x - arrowW, tipY - arrowH);
      ctx.lineTo(x, tipY);
      ctx.lineTo(x + arrowW, tipY - arrowH);
      ctx.stroke();
    }
  }


  // --- Physics ---
  let textSwapped = false;

  function updateChain(dt) {
    if (shiftT > 0) {
      shiftT -= dt;
      const progress = 1 - shiftT / SHIFT_DURATION; // 0→1

      // Swap text at midpoint (peak burst speed) — hardest moment to read
      if (!textSwapped && progress >= 0.5) {
        textSwapped = true;
        currentGearIdx = targetGearIdx;
        chars._text = null; // force reinit at next buildPath
      }

      if (shiftT <= 0) {
        shiftT = 0;
        rear.r = cassette[currentGearIdx].r;
      } else {
        const ease = progress * progress * (3 - 2 * progress);
        rear.r = shiftFrom + (shiftTo - shiftFrom) * ease;
      }
      rear.speed = front.speed * (front.r / rear.r);
      layoutGears();
      buildPath();
    }

    const wobble = 1 + 0.06 * Math.sin(time * 2.5);
    const angularAdvance = front.speed * wobble;
    front.angle += angularAdvance;
    rear.angle += angularAdvance * (front.r / rear.r);

    const chainR = front.r + CHAIN_MARGIN;

    // During a shift, use frozen path length + apply a consistent burst
    let effectivePathLen = totalPathLength;
    let burstMultiplier = 1;
    if (shiftT > 0) {
      effectivePathLen = shiftBasePathLen; // freeze denominator → no organic speed change
      const progress = 1 - shiftT / SHIFT_DURATION; // 0→1
      // Smooth bell: zero derivative at start and end (no jerk)
      // Map progress to [0,1,0] via smoothstep up then smoothstep down
      const half = progress < 0.5 ? progress * 2 : (1 - progress) * 2; // triangle 0→1→0
      const burst = half * half * (3 - 2 * half); // smoothstep eases both ends
      burstMultiplier = 1 + burstAmount * 60 * burst;
    }

    masterT -= (angularAdvance * chainR * burstMultiplier) / effectivePathLen;
    masterT = ((masterT % 1) + 1) % 1;
    time += dt;

    for (let i = 0; i < chars.length; i++) {
      const targetT = (masterT + i * restSpacing) % 1;

      if (shiftT > 0) {
        // During shift: pin directly to target, no springs — full burst speed visible
        chars[i].currentT = targetT;
        chars[i].velocity = 0;
      } else {
        // Normal: spring physics for elastic wobble feel
        let diff = chars[i].currentT - targetT;
        if (diff > 0.5) diff -= 1;
        if (diff < -0.5) diff += 1;

        const force = -SPRING_K * diff - DAMPING * chars[i].velocity;
        chars[i].velocity += force * dt * 60;
        chars[i].currentT += chars[i].velocity * dt * 60;
        chars[i].currentT = ((chars[i].currentT % 1) + 1) % 1;
      }
    }
  }

  // --- Render ---
  function render() {
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Front chainring
    drawCircle(front.x, front.y, front.r);
    drawAxle(front.x, front.y);

    // Rear gear
    drawCircle(rear.x, rear.y, rear.r);
    drawAxle(rear.x, rear.y);
    drawShiftArrows(rear.x, rear.y);

    // Ghost cassette rings — only hide when active gear radius overlaps
    for (let i = 0; i < cassette.length; i++) {
      if (Math.abs(rear.r - cassette[i].r) < 2) continue; // hidden when overlapping
      ctx.beginPath();
      ctx.arc(rear.x, rear.y, cassette[i].r, 0, Math.PI * 2);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Chain text
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (c.char === ' ') continue;
      const pos = getPositionAt(c.currentT);
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(pos.angle);
      ctx.fillStyle = '#333';
      ctx.fillText(c.char, 0, 0);
      ctx.restore();
    }

  }

  // --- Loop ---
  let lastTime = 0;
  function loop(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = timestamp;
    updateChain(dt);
    render();
    requestAnimationFrame(loop);
  }

  // --- Input ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      switchGear(targetGearIdx + 1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      switchGear(targetGearIdx - 1);
    }
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      switchGear(targetGearIdx - 1);
    } else {
      switchGear(targetGearIdx + 1);
    }
  });

  // Touch swipe: vertical swipe to shift gears
  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 30) {
      if (dy > 0) {
        switchGear(targetGearIdx + 1);  // swipe up = shift up (larger gear)
      } else {
        switchGear(targetGearIdx - 1);  // swipe down = shift down (smaller gear)
      }
    }
  }, { passive: true });

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(loop);
})();
