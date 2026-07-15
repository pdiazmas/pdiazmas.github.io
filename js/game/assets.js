// ---------------------------------------------------------------------------
// Fábricas de mallas low-poly y utilidades de texturas por canvas.
// Todo el arte del juego se genera por código: no hay modelos externos.
// ---------------------------------------------------------------------------

import * as THREE from "three";

export function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Etiqueta flotante (nombre de NPC, marcador, etc.)
export function makeTextSprite(text, opts = {}) {
  const {
    fontSize = 46,
    color = "#ffffff",
    bg = "rgba(16, 20, 35, 0.82)",
    worldHeight = 0.62,
    padX = 26,
    padY = 14,
  } = opts;
  const font = `600 ${fontSize}px Quicksand, 'Segoe UI', sans-serif`;

  const measure = document.createElement("canvas").getContext("2d");
  measure.font = font;
  const textW = Math.ceil(measure.measureText(text).width);
  const w = textW + padX * 2;
  const h = fontSize + padY * 2;

  const texture = canvasTexture(w, h, (ctx) => {
    ctx.font = font;
    ctx.fillStyle = bg;
    roundRect(ctx, 1, 1, w - 2, h - 2, h / 2 - 1);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 2);
  });

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  sprite.scale.set(worldHeight * (w / h), worldHeight, 1);
  return sprite;
}

// Marcador circular sobre las puertas: "!" pendiente / "✓" visitado.
export function makeMarkerSprite() {
  const draw = (symbol, bgColor) =>
    canvasTexture(128, 128, (ctx) => {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(64, 64, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 76px Quicksand, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(symbol, 64, 70);
    });

  const pending = draw("!", "#f2a71b");
  const done = draw("✓", "#41a05c");
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: pending, transparent: true, depthWrite: false })
  );
  sprite.scale.set(1.1, 1.1, 1);
  sprite.userData.setVisited = (visited) => {
    sprite.material.map = visited ? done : pending;
    sprite.material.needsUpdate = true;
  };
  return sprite;
}

// ---------------------------------------------------------------------------
// Personajes
// ---------------------------------------------------------------------------

export function makeVillager(palette = {}) {
  const {
    shirt = 0x3f6fb5,
    pants = 0x2e3a4d,
    skin = 0xf0c39b,
    hair = 0x4a3223,
  } = palette;

  const mat = (color) => new THREE.MeshLambertMaterial({ color });
  const group = new THREE.Group();

  const addMesh = (geo, material, x, y, z, parent = group) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // Piernas (pivotan en la cadera para caminar)
  const legGeo = new THREE.BoxGeometry(0.22, 0.55, 0.26);
  const makeLeg = (x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.55, 0);
    addMesh(legGeo, mat(pants), 0, -0.275, 0, pivot);
    group.add(pivot);
    return pivot;
  };
  const leftLeg = makeLeg(-0.16);
  const rightLeg = makeLeg(0.16);

  // Cuerpo
  const body = addMesh(new THREE.BoxGeometry(0.62, 0.62, 0.36), mat(shirt), 0, 0.86, 0);

  // Brazos (pivotan en el hombro)
  const armGeo = new THREE.BoxGeometry(0.16, 0.52, 0.2);
  const makeArm = (x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.1, 0);
    addMesh(armGeo, mat(shirt), 0, -0.26, 0, pivot);
    group.add(pivot);
    return pivot;
  };
  const leftArm = makeArm(-0.39);
  const rightArm = makeArm(0.39);

  // Cabeza + pelo + ojos
  const head = addMesh(new THREE.BoxGeometry(0.48, 0.46, 0.44), mat(skin), 0, 1.42, 0);
  addMesh(new THREE.BoxGeometry(0.52, 0.16, 0.48), mat(hair), 0, 1.6, -0.02);
  addMesh(new THREE.BoxGeometry(0.52, 0.3, 0.1), mat(hair), 0, 1.46, -0.2);
  const eyeGeo = new THREE.BoxGeometry(0.06, 0.08, 0.02);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1c1c1c });
  addMesh(eyeGeo, eyeMat, -0.11, 1.44, 0.225);
  addMesh(eyeGeo, eyeMat, 0.11, 1.44, 0.225);

  group.userData.anim = { leftLeg, rightLeg, leftArm, rightArm, body, head };
  return group;
}

// Anima brazos y piernas: `walk` es la intensidad de la zancada (0 = parado).
export function animateVillager(villager, time, walk) {
  const { leftLeg, rightLeg, leftArm, rightArm, body } = villager.userData.anim;
  const swing = Math.sin(time * 9) * 0.7 * walk;
  leftLeg.rotation.x = swing;
  rightLeg.rotation.x = -swing;
  leftArm.rotation.x = -swing * 0.8;
  rightArm.rotation.x = swing * 0.8;
  body.position.y = 0.86 + Math.abs(Math.sin(time * 9)) * 0.05 * walk;
  if (walk < 0.05) {
    // Respiración sutil en reposo
    body.position.y = 0.86 + Math.sin(time * 2) * 0.012;
  }
}

// ---------------------------------------------------------------------------
// Decoración exterior
// ---------------------------------------------------------------------------

export function makeTree(variant = 0) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 1.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2f })
  );
  trunk.position.y = 0.6;
  trunk.castShadow = true;
  group.add(trunk);

  const green = [0x3e7c47, 0x4c8f50, 0x35703f][variant % 3];
  const foliageMat = new THREE.MeshLambertMaterial({ color: green });
  if (variant % 2 === 0) {
    // Pino: conos apilados
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.15 - i * 0.28, 1.1, 7), foliageMat);
      cone.position.y = 1.35 + i * 0.72;
      cone.castShadow = true;
      group.add(cone);
    }
  } else {
    // Árbol redondo
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 0), foliageMat);
    blob.position.y = 2.0;
    blob.castShadow = true;
    group.add(blob);
  }
  return group;
}

export function makeLamp() {
  const group = new THREE.Group();
  const metal = new THREE.MeshLambertMaterial({ color: 0x2f3640 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3, 6), metal);
  pole.position.y = 1.5;
  pole.castShadow = true;
  group.add(pole);

  const bulbMat = new THREE.MeshLambertMaterial({
    color: 0xfff2c4,
    emissive: 0xffca6b,
    emissiveIntensity: 0,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), bulbMat);
  bulb.position.y = 3.05;
  group.add(bulb);

  const light = new THREE.PointLight(0xffca6b, 0, 13, 1.8);
  light.position.y = 3.05;
  group.add(light);

  group.userData.lamp = { light, bulbMat };
  return group;
}

export function makeFountain() {
  const group = new THREE.Group();
  const stone = new THREE.MeshLambertMaterial({ color: 0x9aa5ad });

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.1, 0.7, 18), stone);
  rim.position.y = 0.35;
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);

  const waterMat = new THREE.MeshLambertMaterial({
    color: 0x4aa3d8,
    transparent: true,
    opacity: 0.85,
  });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.15, 18), waterMat);
  water.position.y = 0.66;
  group.add(water);

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.5, 10), stone);
  pillar.position.y = 1.2;
  pillar.castShadow = true;
  group.add(pillar);

  const top = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), waterMat.clone());
  top.position.y = 2.1;
  group.add(top);

  group.userData.water = { water, top };
  return group;
}

export function makeSignpost(text) {
  const group = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), wood);
  post.position.y = 1.1;
  post.castShadow = true;
  group.add(post);

  const lines = text.split("\n");
  const texture = canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = "#8a6440";
    roundRect(ctx, 4, 4, w - 8, h - 8, 22);
    ctx.fill();
    ctx.strokeStyle = "#5f4227";
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = "#fdf3dc";
    ctx.textAlign = "center";
    lines.forEach((line, i) => {
      ctx.font = i === 0 ? "bold 44px Quicksand, sans-serif" : "30px Quicksand, sans-serif";
      ctx.fillText(line, w / 2, 64 + i * 48);
    });
  });
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.65, 0.12),
    [
      wood, wood, wood, wood,
      new THREE.MeshLambertMaterial({ map: texture }),
      wood,
    ]
  );
  board.position.y = 2.0;
  board.castShadow = true;
  group.add(board);
  return group;
}

export function makeCloud() {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const blobs = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blobs; i++) {
    const s = 1.4 + Math.random() * 1.6;
    const blob = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), mat);
    blob.position.set(i * 1.9 - blobs, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.5);
    blob.scale.y = 0.55;
    group.add(blob);
  }
  return group;
}
