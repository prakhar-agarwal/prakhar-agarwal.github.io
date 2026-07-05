import * as THREE from 'three';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';
import { quizQuestions } from './quiz-data.js';

const uiContainer = document.getElementById('ml-container');
const bgContainer = document.getElementById('ascii-bg');
if (!bgContainer) throw new Error('Missing background container');

const architectures = ['dnn', 'cnn', 'transformer'];
const urlArch = new URLSearchParams(window.location.search).get('arch');
const currentArch = (urlArch && architectures.includes(urlArch)) ? urlArch : architectures[Math.floor(Math.random() * architectures.length)];
const currentQuiz = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];

let camera, scene, renderer, effect;
const aiGroup = new THREE.Group();

function createNode(radius) {
  const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4 });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 12), material);
}

function createEdge(start, end, radius = 1) {
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
  const length = start.distanceTo(end);
  const edgeGeo = new THREE.CylinderGeometry(radius, radius, length, 8);
  const edge = new THREE.Mesh(edgeGeo, edgeMaterial);

  edge.position.copy(start).lerp(end, 0.5);
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(up.dot(direction)) < 0.999) {
    const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
    const angle = Math.acos(up.dot(direction));
    edge.quaternion.setFromAxisAngle(axis, angle);
  }
  return edge;
}

function buildDNN() {
  const layers = [4, 6, 6, 3];
  const layerSpacing = 35;
  const nodeSpacing = 15;
  const nodes = [];
  const startX = -((layers.length - 1) * layerSpacing) / 2;

  for (let i = 0; i < layers.length; i++) {
    const layerNodes = [];
    const numNodes = layers[i];
    const startY = -((numNodes - 1) * nodeSpacing) / 2;
    const x = startX + i * layerSpacing;

    for (let j = 0; j < numNodes; j++) {
      const y = startY + j * nodeSpacing;
      const z = (Math.random() - 0.5) * 10;
      const node = createNode(4);
      node.position.set(x, y, z);
      aiGroup.add(node);
      layerNodes.push(node);
    }
    nodes.push(layerNodes);
  }

  for (let i = 0; i < nodes.length - 1; i++) {
    for (const n1 of nodes[i]) {
      for (const n2 of nodes[i + 1]) {
        aiGroup.add(createEdge(n1.position, n2.position, 0.5));
      }
    }
  }
}

function buildCNN() {
  const f1Nodes = [];
  for (let x = -2; x <= 2; x++) {
    for (let y = -2; y <= 2; y++) {
      const node = createNode(2.5);
      node.position.set(-40, y * 8, x * 8);
      aiGroup.add(node);
      f1Nodes.push(node);
    }
  }

  const f2Nodes = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      const node = createNode(3);
      node.position.set(0, y * 10, x * 10);
      aiGroup.add(node);
      f2Nodes.push(node);
    }
  }

  const f3Nodes = [];
  for (let y = -1.5; y <= 1.5; y++) {
    const node = createNode(4);
    node.position.set(40, y * 12, 0);
    aiGroup.add(node);
    f3Nodes.push(node);
  }

  for (const n2 of f2Nodes) {
    const connections = [...f1Nodes].sort(() => 0.5 - Math.random()).slice(0, 5);
    for (const n1 of connections) {
      aiGroup.add(createEdge(n1.position, n2.position, 0.4));
    }
    for (const n3 of f3Nodes) {
      aiGroup.add(createEdge(n2.position, n3.position, 0.6));
    }
  }
}

function buildTransformer() {
  const numTokens = 12;
  const radius = 45;
  const nodes = [];

  for (let i = 0; i < numTokens; i++) {
    const angle = (i / numTokens) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const node = createNode(5);
    node.position.set(x, y, 0);
    aiGroup.add(node);
    nodes.push(node);
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const weight = Math.random();
      if (weight > 0.4) {
        const thickness = (weight - 0.4) * 2;
        const midPoint = new THREE.Vector3().addVectors(nodes[i].position, nodes[j].position).multiplyScalar(0.5);
        const dist = nodes[i].position.distanceTo(nodes[j].position);
        midPoint.z = (Math.random() - 0.5) * (dist * 0.4);
        aiGroup.add(createEdge(nodes[i].position, midPoint, thickness));
        aiGroup.add(createEdge(midPoint, nodes[j].position, thickness));
      }
    }
  }
}

function initVisuals() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
  camera.position.z = 150;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const pointLight1 = new THREE.PointLight(0xffffff, 3, 0, 0);
  pointLight1.position.set(500, 500, 500);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(0xffffff, 1, 0, 0);
  pointLight2.position.set(-500, -500, -500);
  scene.add(pointLight2);

  switch (currentArch) {
    case 'dnn': buildDNN(); break;
    case 'cnn': buildCNN(); break;
    case 'transformer': buildTransformer(); break;
  }

  aiGroup.rotation.x = (Math.random() - 0.5) * 0.5;
  aiGroup.rotation.y = (Math.random() - 0.5) * 0.5;
  scene.add(aiGroup);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  effect = new AsciiEffect(renderer, ' .:-+*=%@#', { invert: true });
  effect.setSize(width, height);
  effect.domElement.style.color = 'var(--text-color)';
  effect.domElement.style.backgroundColor = 'transparent';
  effect.domElement.style.fontFamily = 'monospace';
  // Use larger font size for the massive background
  effect.domElement.style.fontSize = '12px';
  effect.domElement.style.lineHeight = '12px';

  bgContainer.appendChild(effect.domElement);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    effect.setSize(window.innerWidth, window.innerHeight);
  });
}

function buildQuizUI() {
  uiContainer.innerHTML = '';
  
  const qLabel = document.createElement('div');
  qLabel.innerHTML = currentQuiz.q;
  qLabel.style.cssText = 'color:var(--text-color); font-weight:600; line-height:1.6; font-size:15px; margin-bottom: 24px;';
  uiContainer.appendChild(qLabel);

  const options = [
    { text: currentQuiz.c, isCorrect: true },
    { text: currentQuiz.p, isCorrect: false }
  ];
  options.sort(() => Math.random() - 0.5);

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex; flex-direction:column; gap:16px; width:100%;';

  const feedbackArea = document.createElement('div');
  feedbackArea.style.cssText = 'margin-top:24px; color:var(--meta-text); line-height:1.6; font-size: 14.5px;';

  let answered = false;

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerHTML = opt.text;
    // Add backdrop-filter for glassmorphism over the ASCII background
    btn.style.cssText = 'background:rgba(128,128,128,0.05); backdrop-filter:blur(4px); border:1px solid var(--link-border); border-radius:8px; color:var(--text-color); font-family:inherit; font-size:14px; text-align:left; cursor:pointer; padding:16px; transition:all 0.2s ease; line-height:1.5; white-space:normal;';
    
    btn.addEventListener('mouseenter', () => { 
      if(!answered) { 
        btn.style.borderColor = 'var(--text-color)';
        btn.style.transform = 'translateY(-1px)';
        btn.style.background = 'rgba(128,128,128,0.1)';
      } 
    });
    btn.addEventListener('mouseleave', () => { 
      if(!answered) { 
        btn.style.borderColor = 'var(--link-border)';
        btn.style.transform = 'translateY(0)';
        btn.style.background = 'rgba(128,128,128,0.05)';
      } 
    });
    
    btn.addEventListener('click', () => {
      if(answered) return;
      answered = true;
      
      Array.from(btnContainer.children).forEach(b => {
        b.style.opacity = '0.5';
        b.style.borderColor = 'var(--link-border)';
      });
      
      btn.style.opacity = '1';
      
      if(opt.isCorrect) {
        btn.style.borderColor = '#10b981';
        btn.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        feedbackArea.innerHTML = '<span style="color:#10b981; font-weight:600;">Correct.</span><br><br>' + currentQuiz.e + '<br><br><a href="/" style="color:var(--text-color); font-weight:600; text-decoration:none; border-bottom:1px solid currentColor; padding-bottom:2px;">Next Question &rarr;</a>';
        const spin = setInterval(() => { aiGroup.rotation.y += 0.05; }, 16);
        setTimeout(() => clearInterval(spin), 1000);
      } else {
        btn.style.borderColor = '#ef4444';
        btn.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        feedbackArea.innerHTML = '<span style="color:#ef4444; font-weight:600;">Not quite.</span><br><br>' + currentQuiz.e + '<br><br><a href="/" style="color:var(--text-color); font-weight:600; text-decoration:none; border-bottom:1px solid currentColor; padding-bottom:2px;">Next Question &rarr;</a>';
      }
    });
    btnContainer.appendChild(btn);
  });

  uiContainer.appendChild(btnContainer);
  uiContainer.appendChild(feedbackArea);
}

function animate() {
  requestAnimationFrame(animate);
  aiGroup.rotation.y += 0.002;
  aiGroup.rotation.x += 0.001;
  effect.render(scene, camera);
}

initVisuals();
if (uiContainer) {
  buildQuizUI();
}
animate();
