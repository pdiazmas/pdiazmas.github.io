// ---------------------------------------------------------------------------
// Construcción del exterior: el pueblo, sus edificios, la plaza y el paisaje.
// ---------------------------------------------------------------------------

import * as THREE from "three";
import { PLACES, WELCOME_SIGN } from "./data.js";
import {
  canvasTexture,
  makeTextSprite,
  makeMarkerSprite,
  makeTree,
  makeLamp,
  makeFountain,
  makeSignpost,
  makeCloud,
} from "./assets.js";

export const WORLD_BOUNDS = 54;

const FACING_ROT = { S: 0, W: -Math.PI / 2, N: Math.PI, E: Math.PI / 2 };

// Material de ventanas compartido: de noche todas "se encienden" a la vez.
export const windowMat = new THREE.MeshLambertMaterial({
  color: 0x7fb8d8,
  emissive: 0xffd98a,
  emissiveIntensity: 0,
});

function makeBuilding(place) {
  const { w, d, h, roofH } = place.size;
  const group = new THREE.Group();

  const wallMat = new THREE.MeshLambertMaterial({ color: place.colors.wall });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  walls.position.y = h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Tejado piramidal (cono de 4 lados escalado al rectángulo de la planta)
  const roofGeo = new THREE.ConeGeometry(1, 1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(
    roofGeo,
    new THREE.MeshLambertMaterial({ color: place.colors.roof, flatShading: true })
  );
  roof.scale.set((w * 1.18) / Math.SQRT2, roofH, (d * 1.18) / Math.SQRT2);
  roof.position.y = h + roofH / 2 - 0.02;
  roof.castShadow = true;
  group.add(roof);

  if (place.chimney) {
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.6, 0.7),
      new THREE.MeshLambertMaterial({ color: 0x8d6e63 })
    );
    chimney.position.set(w * 0.28, h + roofH * 0.7, -d * 0.15);
    chimney.castShadow = true;
    group.add(chimney);
  }

  // Fachada frontal en +z local: puerta, escalón, cartel y ventanas
  const front = d / 2;
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 2.6, 0.18),
    new THREE.MeshLambertMaterial({ color: place.colors.door })
  );
  door.position.set(0, 1.3, front + 0.06);
  group.add(door);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xd9b23a })
  );
  knob.position.set(0.55, 1.25, front + 0.18);
  group.add(knob);

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.18, 1),
    new THREE.MeshLambertMaterial({ color: 0xb0a494 })
  );
  step.position.set(0, 0.09, front + 0.55);
  step.receiveShadow = true;
  group.add(step);

  // Cartel con el nombre sobre la puerta
  const signTexture = canvasTexture(512, 128, (ctx, cw, ch) => {
    ctx.fillStyle = "#2c2620";
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#d9b23a";
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, cw - 12, ch - 12);
    ctx.fillStyle = "#f7ecd4";
    ctx.font = "bold 58px Quicksand, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(place.sign, cw / 2, ch / 2 + 4);
  });
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshLambertMaterial({ map: signTexture })
  );
  sign.position.set(0, 3.15, front + 0.1);
  group.add(sign);

  // Ventanas a ambos lados de la puerta y en las fachadas laterales
  const winGeo = new THREE.BoxGeometry(1.1, 1.2, 0.12);
  const frameMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const addWindow = (x, y, z, rotY = 0) => {
    const win = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.4, 0.1), frameMat);
    const glass = new THREE.Mesh(winGeo, windowMat);
    glass.position.z = 0.04;
    win.add(frame, glass);
    win.position.set(x, y, z);
    win.rotation.y = rotY;
    group.add(win);
  };
  addWindow(-w * 0.28, 1.8, front + 0.05);
  addWindow(w * 0.28, 1.8, front + 0.05);
  addWindow(-w / 2 - 0.05, 1.8, 0, -Math.PI / 2);
  addWindow(w / 2 + 0.05, 1.8, 0, Math.PI / 2);

  // Emblema del hospital: cruz sobre el cartel
  if (place.emblem === "cross") {
    const crossMat = new THREE.MeshLambertMaterial({ color: 0xd9534f });
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.15), crossMat);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 0.15), crossMat);
    barV.position.set(0, h - 0.6, front + 0.1);
    barH.position.set(0, h - 0.6, front + 0.1);
    group.add(barV, barH);
  }

  group.position.set(place.position[0], 0, place.position[1]);
  group.rotation.y = FACING_ROT[place.facing];
  return group;
}

// AABB del edificio en coordenadas de mundo (las rotaciones son múltiplos de 90º)
function buildingCollider(place) {
  const { w, d } = place.size;
  const swap = place.facing === "E" || place.facing === "W";
  const hx = (swap ? d : w) / 2 + 0.35;
  const hz = (swap ? w : d) / 2 + 0.35;
  const [x, z] = place.position;
  return { minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz };
}

// Posición de la puerta en coordenadas de mundo
function doorWorldPos(place) {
  const dir = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[place.facing];
  const { d } = place.size;
  const dist = d / 2 + 1.4;
  return new THREE.Vector3(
    place.position[0] + dir[0] * dist,
    0,
    place.position[1] + dir[1] * dist
  );
}

function makePath(from, to, width = 2.4) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length + width),
    new THREE.MeshLambertMaterial({ color: 0xc9b28a })
  );
  path.rotation.x = -Math.PI / 2;
  path.rotation.z = -Math.atan2(dx, dz);
  path.position.set((from.x + to.x) / 2, 0.02, (from.z + to.z) / 2);
  path.receiveShadow = true;
  return path;
}

export function buildVillage() {
  const group = new THREE.Group();
  const colliders = { boxes: [], circles: [] };
  const doors = [];
  const lamps = [];
  const clouds = [];

  // Suelo
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshLambertMaterial({ color: 0x69a95c })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Plaza central
  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(11, 36),
    new THREE.MeshLambertMaterial({ color: 0xd6c39a })
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.015;
  plaza.receiveShadow = true;
  group.add(plaza);

  // Fuente
  const fountain = makeFountain();
  group.add(fountain);
  colliders.circles.push({ x: 0, z: 0, r: 3.5 });

  // Edificios, caminos, puertas y marcadores
  const center = new THREE.Vector3(0, 0, 0);
  for (const place of PLACES) {
    const building = makeBuilding(place);
    group.add(building);
    colliders.boxes.push(buildingCollider(place));

    const doorPos = doorWorldPos(place);
    group.add(makePath(center, doorPos));

    const marker = makeMarkerSprite();
    marker.position.set(doorPos.x, 4.4, doorPos.z);
    group.add(marker);

    doors.push({
      place,
      position: doorPos,
      marker,
      baseY: 4.4,
      prompt: `Entrar en ${place.name}`,
    });
  }

  // Cartel de bienvenida junto al punto de aparición
  const welcome = makeSignpost(WELCOME_SIGN);
  welcome.position.set(3.6, 0, 13.5);
  welcome.rotation.y = -0.3; // cara del cartel hacia la cámara y el punto de aparición
  group.add(welcome);
  colliders.circles.push({ x: 3.6, z: 13.5, r: 0.5 });

  // Farolas alrededor de la plaza
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(angle) * 11.8;
    const z = Math.sin(angle) * 11.8;
    const lamp = makeLamp();
    lamp.position.set(x, 0, z);
    group.add(lamp);
    lamps.push(lamp.userData.lamp);
    colliders.circles.push({ x, z, r: 0.35 });
  }

  // Árboles repartidos por el pueblo (posiciones fijas, lejos de los caminos)
  const treeSpots = [
    [-10, -14], [10, -15], [-14, 10], [13, 11], [-30, -12], [30, -14],
    [-36, 14], [36, 12], [-8, 30], [8, 31], [-32, 32], [33, 33],
    [-42, -30], [40, -32], [-44, 2], [44, 14], [0, -32], [-10, 44],
    [12, 44], [-24, 44], [28, 44], [46, -8], [-46, -18], [6, -26],
  ];
  treeSpots.forEach(([x, z], i) => {
    const tree = makeTree(i);
    tree.position.set(x, 0, z);
    tree.rotation.y = (i * 2.39996) % (Math.PI * 2);
    const s = 0.85 + ((i * 7) % 10) / 22;
    tree.scale.setScalar(s);
    group.add(tree);
    colliders.circles.push({ x, z, r: 0.5 * s });
  });

  // Montañas de fondo
  const mountainMat = new THREE.MeshLambertMaterial({ color: 0x6f8f7a, flatShading: true });
  const snowMat = new THREE.MeshLambertMaterial({ color: 0xf1f3f4, flatShading: true });
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const r = 72 + (i % 3) * 8;
    const height = 18 + ((i * 13) % 5) * 5;
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(13 + (i % 4) * 3, height, 5), mountainMat);
    mountain.position.set(Math.cos(angle) * r, height / 2 - 1, Math.sin(angle) * r);
    mountain.rotation.y = i * 1.3;
    group.add(mountain);
    if (height > 26) {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(4.5, 8, 5), snowMat);
      peak.position.set(mountain.position.x, height - 5, mountain.position.z);
      peak.rotation.y = i * 1.3;
      group.add(peak);
    }
  }

  // Nubes
  for (let i = 0; i < 7; i++) {
    const cloud = makeCloud();
    cloud.position.set(-60 + i * 20, 24 + (i % 3) * 4, -50 + ((i * 37) % 100));
    cloud.userData.speed = 0.6 + (i % 3) * 0.35;
    group.add(cloud);
    clouds.push(cloud);
  }

  // Estrellas (solo visibles de noche)
  const starCount = 400;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.42;
    const r = 95;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) + 2;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.9,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  group.add(stars);

  // Luces exteriores (dentro del grupo: se apagan al entrar en un interior)
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(28, 42, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0005;
  group.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x7a9a5e, 0.9);
  group.add(hemi);

  return {
    group,
    colliders,
    doors,
    lamps,
    clouds,
    stars: starMat,
    fountain: fountain.userData.water,
    sun,
    hemi,
  };
}

export { makeTextSprite };
