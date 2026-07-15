// ---------------------------------------------------------------------------
// Interiores de los edificios (estilo "casa de muñecas": sin techo y con la
// pared sur baja para que la cámara vea el interior). El NPC vive aquí.
// ---------------------------------------------------------------------------

import * as THREE from "three";
import { canvasTexture, makeTextSprite, makeVillager } from "./assets.js";

const ROOM_W = 17; // ancho (x)
const ROOM_D = 13; // fondo (z)
const WALL_H = 4;

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

function box(w, h, d, material, x, y, z, parent) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function collider(colliders, x, z, hx, hz) {
  colliders.boxes.push({ minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz });
}

// Cartel/panel plano colgado en una pared
function wallPanel(parent, texture, w, h, x, y, z, rotY = 0) {
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshLambertMaterial({ map: texture })
  );
  panel.position.set(x, y, z);
  panel.rotation.y = rotY;
  parent.add(panel);
  return panel;
}

function textPanelTexture(lines, { bg = "#3b3f46", fg = "#f5f0dc", accent = null } = {}) {
  return canvasTexture(512, 384, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent || "rgba(255,255,255,0.35)";
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    lines.forEach((line, i) => {
      ctx.font = i === 0 ? "bold 52px Quicksand, sans-serif" : "38px Quicksand, sans-serif";
      ctx.fillText(line, w / 2, 90 + i * 62);
    });
  });
}

function makeShelf(parent, colliders, x, z, rotY = 0, width = 3) {
  const group = new THREE.Group();
  const wood = lambert(0x6d4c33);
  box(width, 3, 0.4, wood, 0, 1.5, 0, group);
  // Libros: bloques de colores en tres baldas
  const palette = [0xc0392b, 0x2980b9, 0xd9a23a, 0x27ae60, 0x8e44ad, 0xe67e22];
  for (let shelf = 0; shelf < 3; shelf++) {
    let bx = -width / 2 + 0.3;
    while (bx < width / 2 - 0.3) {
      const bw = 0.16 + Math.random() * 0.14;
      const bh = 0.5 + Math.random() * 0.16;
      const book = box(
        bw, bh, 0.3,
        lambert(palette[Math.floor(Math.random() * palette.length)]),
        bx, 0.62 + shelf * 0.95 + bh / 2, 0.06,
        group
      );
      book.castShadow = false;
      bx += bw + 0.05;
    }
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  parent.add(group);
  const hx = rotY === 0 ? width / 2 : 0.4;
  const hz = rotY === 0 ? 0.4 : width / 2;
  collider(colliders, x, z, hx + 0.15, hz + 0.15);
}

function makeCounter(parent, colliders, x, z, w = 5) {
  const wood = lambert(0x8a5a3b);
  box(w, 1.05, 1.1, wood, x, 0.525, z, parent);
  box(w + 0.3, 0.12, 1.3, lambert(0xa9744b), x, 1.11, z, parent);
  collider(colliders, x, z, w / 2 + 0.2, 0.75);
}

function makeTableRound(parent, colliders, x, z) {
  const wood = lambert(0x7a5230);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 12), wood);
  top.position.set(x, 0.82, z);
  parent.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.82, 8), wood);
  leg.position.set(x, 0.41, z);
  parent.add(leg);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + x + z;
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.5, 8), lambert(0x9c6b43));
    stool.position.set(x + Math.cos(angle) * 1.4, 0.25, z + Math.sin(angle) * 1.4);
    parent.add(stool);
  }
  collider(colliders, x, z, 1.0, 1.0);
}

function makeDeskWithScreen(parent, colliders, x, z, screenText, rotY = 0) {
  const group = new THREE.Group();
  box(2.4, 0.1, 1.2, lambert(0x5d4a3a), 0, 0.78, 0, group);
  box(0.12, 0.78, 1.0, lambert(0x4a3a2d), -1.05, 0.39, 0, group);
  box(0.12, 0.78, 1.0, lambert(0x4a3a2d), 1.05, 0.39, 0, group);
  const screenTexture = canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#5bffa0";
    ctx.font = "bold 40px monospace";
    ctx.textAlign = "center";
    ctx.fillText(screenText, w / 2, h / 2 - 8);
    ctx.font = "26px monospace";
    ctx.fillText("▮", w / 2 + 8, h / 2 + 34);
  });
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.95, 0.08),
    [
      lambert(0x22262b), lambert(0x22262b), lambert(0x22262b), lambert(0x22262b),
      new THREE.MeshBasicMaterial({ map: screenTexture }),
      lambert(0x22262b),
    ]
  );
  screen.position.set(0, 1.4, -0.3);
  group.add(screen);
  const stand = box(0.16, 0.34, 0.16, lambert(0x22262b), 0, 0.95, -0.3, group);
  stand.castShadow = false;
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  parent.add(group);
  const hx = rotY === 0 ? 1.35 : 0.75;
  const hz = rotY === 0 ? 0.75 : 1.35;
  collider(colliders, x, z, hx, hz);
}

function makePlant(parent, colliders, x, z) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.45, 8), lambert(0xb35f3d));
  pot.position.set(x, 0.22, z);
  parent.add(pot);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), lambert(0x3e8f4e));
  leaves.position.set(x, 0.9, z);
  parent.add(leaves);
  collider(colliders, x, z, 0.35, 0.35);
}

function makeBedCamilla(parent, colliders, x, z, blanket = 0x9fd0e8) {
  box(1.3, 0.5, 2.6, lambert(0xe8e8e8), x, 0.45, z, parent);
  box(1.3, 0.16, 1.7, lambert(blanket), x, 0.76, z + 0.4, parent);
  box(1.0, 0.18, 0.55, lambert(0xffffff), x, 0.78, z - 0.85, parent);
  collider(colliders, x, z, 0.8, 1.45);
}

function makeCrates(parent, colliders, x, z, count = 3, color = 0xb08a5a) {
  const positions = [
    [0, 0.4, 0], [0.85, 0.4, 0.2], [0.3, 1.15, 0.1], [-0.6, 0.4, 0.5],
  ];
  for (let i = 0; i < count; i++) {
    const [dx, dy, dz] = positions[i % positions.length];
    box(0.8, 0.8, 0.8, lambert(color), x + dx, dy, z + dz, parent);
  }
  collider(colliders, x, z, 1.1, 0.9);
}

// ---------------------------------------------------------------------------
// Decoración específica de cada lugar
// ---------------------------------------------------------------------------

const DECORATORS = {
  casa(group, colliders) {
    // Sofá
    box(2.6, 0.55, 1.1, lambert(0x4a6d8c), -5.5, 0.45, -2, group);
    box(2.6, 0.9, 0.35, lambert(0x3d5a73), -5.5, 0.85, -2.55, group);
    collider(colliders, -5.5, -2.2, 1.5, 0.9);
    // Gato durmiendo en el sofá 🐈
    const cat = new THREE.Group();
    box(0.55, 0.28, 0.32, lambert(0x2f2f2f), 0, 0.14, 0, cat);
    box(0.26, 0.24, 0.24, lambert(0x2f2f2f), 0.33, 0.2, 0, cat);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), lambert(0x2f2f2f));
    ear.position.set(0.38, 0.36, 0.07);
    cat.add(ear);
    const ear2 = ear.clone();
    ear2.position.z = -0.07;
    cat.add(ear2);
    cat.position.set(-5.2, 0.72, -2);
    group.add(cat);
    // Escritorio con portátil y estantería
    makeDeskWithScreen(group, colliders, 5.6, -4.2, "hola.js", 0);
    makeShelf(group, colliders, -3, -6.1, 0, 3.5);
    makePlant(group, colliders, 7.4, 4.6);
    // Alfombra
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), lambert(0xc26d51));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.02, 0);
    group.add(rug);
    return { floor: 0xba9268, wall: 0xe8dbc0, npcPos: [-2.5, -3.5] };
  },

  hospital(group, colliders) {
    makeCounter(group, colliders, 1.5, -3.6, 5);
    makeBedCamilla(group, colliders, -5.8, -3.5);
    makeBedCamilla(group, colliders, -5.8, 1.5);
    // Panel de rayos X en la pared norte
    const rx = canvasTexture(512, 384, (ctx, w, h) => {
      ctx.fillStyle = "#0d1420";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#cfe4ff";
      ctx.lineWidth = 6;
      // Costillas estilizadas
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(w / 2, 90 + i * 42, 130 - i * 6, 26, 0, 0.15 * Math.PI, 0.85 * Math.PI, false);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(w / 2, 40);
      ctx.lineTo(w / 2, h - 60);
      ctx.stroke();
      ctx.fillStyle = "#8fb8e8";
      ctx.font = "bold 34px monospace";
      ctx.textAlign = "center";
      ctx.fillText("RX · TÓRAX PA", w / 2, h - 20);
    });
    wallPanel(group, rx, 3.4, 2.6, 3.8, 2.2, -ROOM_D / 2 + 0.08);
    // Cruz médica
    const crossTexture = textPanelTexture(["", "✚", ""], { bg: "#f4f6f5", fg: "#d9534f" });
    wallPanel(group, crossTexture, 1.6, 1.6, -ROOM_W / 2 + 0.08, 2.4, 0, Math.PI / 2);
    makePlant(group, colliders, 7.4, 4.6);
    return { floor: 0xd8e2e6, wall: 0xeef4f2, npcPos: [1.5, -4.9] };
  },

  universidad(group, colliders) {
    // Pizarra
    const board = textPanelTexture(
      ["PLAN DE ESTUDIOS", "Enfermería · UdL", "Imagen Dx · Torrevicens", "Ing. Informática · UOC"],
      { bg: "#2e4a3a", fg: "#eef4e2", accent: "#a9744b" }
    );
    wallPanel(group, board, 6, 3, -2, 2.1, -ROOM_D / 2 + 0.08);
    // Pupitres
    for (const [x, z] of [[-4, 0.5], [-1, 0.5], [2, 0.5], [-4, 3.2], [-1, 3.2], [2, 3.2]]) {
      box(1.5, 0.08, 0.9, lambert(0xa9744b), x, 0.75, z, group);
      box(0.1, 0.75, 0.8, lambert(0x6d4c33), x - 0.6, 0.37, z, group);
      box(0.1, 0.75, 0.8, lambert(0x6d4c33), x + 0.6, 0.37, z, group);
      collider(colliders, x, z, 0.85, 0.55);
    }
    makeShelf(group, colliders, 6.5, -4, Math.PI / 2, 3);
    makePlant(group, colliders, -7.4, 4.8);
    return { floor: 0xc7a877, wall: 0xe3d3b0, npcPos: [-2, -4.4] };
  },

  biblioteca(group, colliders) {
    makeShelf(group, colliders, -4.5, -6.1, 0, 4);
    makeShelf(group, colliders, 1, -6.1, 0, 4);
    makeShelf(group, colliders, -8, -2, Math.PI / 2, 3.5);
    makeShelf(group, colliders, 8, -2, Math.PI / 2, 3.5);
    makeTableRound(group, colliders, 3.5, 2);
    // Libro abierto sobre la mesa
    box(0.7, 0.06, 0.5, lambert(0xf5efdc), 3.5, 0.9, 2, group);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(3, 20), lambert(0x8c5a42));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-1, 0.02, 0.5);
    group.add(rug);
    makePlant(group, colliders, 7.4, 4.8);
    return { floor: 0x9c7047, wall: 0xd9c39a, npcPos: [-1.8, -4.2] };
  },

  taller(group, colliders) {
    makeDeskWithScreen(group, colliders, -3.5, -4.6, "<villa-pau/>");
    makeDeskWithScreen(group, colliders, 1.5, -4.6, "npm run dev");
    // Rack de servidores con lucecitas
    const rackTexture = canvasTexture(128, 256, (ctx, w, h) => {
      ctx.fillStyle = "#1a1e24";
      ctx.fillRect(0, 0, w, h);
      for (let y = 14; y < h - 10; y += 26) {
        ctx.fillStyle = "#252b33";
        ctx.fillRect(8, y, w - 16, 18);
        ctx.fillStyle = Math.random() > 0.4 ? "#5bffa0" : "#ffb454";
        ctx.beginPath();
        ctx.arc(w - 22, y + 9, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4aa3d8";
        ctx.beginPath();
        ctx.arc(w - 38, y + 9, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.8, 1),
      [
        lambert(0x1a1e24), lambert(0x1a1e24), lambert(0x1a1e24), lambert(0x1a1e24),
        new THREE.MeshBasicMaterial({ map: rackTexture }),
        lambert(0x1a1e24),
      ]
    );
    rack.position.set(7.2, 1.4, -3.5);
    group.add(rack);
    collider(colliders, 7.2, -3.5, 0.95, 0.75);
    // Póster de código
    const poster = textPanelTexture(
      ["while (alive) {", "  learn();", "  build();", "}"],
      { bg: "#12161c", fg: "#5bffa0", accent: "#2c3540" }
    );
    wallPanel(group, poster, 3, 2.4, -8, 2.2, 1, Math.PI / 2);
    makeCrates(group, colliders, -6.5, 4.5, 3, 0x7d8a99);
    return { floor: 0x8b939c, wall: 0xb9c4cc, npcPos: [-1, -3.6] };
  },

  cafe(group, colliders) {
    makeCounter(group, colliders, -2, -4, 6);
    // Cafetera
    box(0.7, 0.9, 0.6, lambert(0x3a3f45), -4, 1.62, -4, group);
    // Menú en la pared
    const menu = textPanelTexture(
      ["MENÚ DEL DÍA", "☕ Café — 1 idioma", "🍰 Kuchen — auf Deutsch", "🫖 Tea — in English"],
      { bg: "#4f3222", fg: "#f7ecd4", accent: "#d9b23a" }
    );
    wallPanel(group, menu, 4.4, 3.2, -2, 2.2, -ROOM_D / 2 + 0.08);
    makeTableRound(group, colliders, 4.5, 0.5);
    makeTableRound(group, colliders, -5, 3);
    makeTableRound(group, colliders, 2, 4);
    makePlant(group, colliders, 7.6, -5);
    return { floor: 0x9c6b43, wall: 0xc98d6b, npcPos: [-2, -5.2] };
  },

  correos(group, colliders) {
    makeCounter(group, colliders, 0, -3.8, 6);
    // Casilleros
    const lockers = canvasTexture(512, 320, (ctx, w, h) => {
      ctx.fillStyle = "#8a6d3b";
      ctx.fillRect(0, 0, w, h);
      for (let y = 10; y < h - 10; y += 62) {
        for (let x = 10; x < w - 10; x += 82) {
          ctx.fillStyle = "#6e5326";
          ctx.fillRect(x, y, 72, 52);
          ctx.fillStyle = "#d9b23a";
          ctx.fillRect(x + 54, y + 22, 10, 8);
        }
      }
    });
    wallPanel(group, lockers, 6, 3.2, 0, 2.2, -ROOM_D / 2 + 0.08);
    // Buzón rojo
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.5, 12), lambert(0xc0392b));
    post.position.set(6.2, 0.75, 3.8);
    group.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0xa93226));
    cap.position.set(6.2, 1.5, 3.8);
    group.add(cap);
    collider(colliders, 6.2, 3.8, 0.6, 0.6);
    makeCrates(group, colliders, -6, -4.5, 4);
    makeCrates(group, colliders, -6.5, 3.5, 2);
    return { floor: 0xc2a36b, wall: 0xe6cf96, npcPos: [0, -5] };
  },
};

// ---------------------------------------------------------------------------
// Construcción del interior completo de un lugar
// ---------------------------------------------------------------------------

export function buildInterior(place) {
  const group = new THREE.Group();
  const colliders = { boxes: [], circles: [] };

  const deco = DECORATORS[place.interior](group, colliders);

  // Suelo
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    lambert(deco.floor)
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Paredes: norte, este y oeste completas; sur baja (para ver el interior)
  const wallMat = lambert(deco.wall);
  const walls = [
    { w: ROOM_W + 0.6, h: WALL_H, d: 0.5, x: 0, z: -ROOM_D / 2 - 0.25 }, // norte
    { w: 0.5, h: WALL_H, d: ROOM_D + 0.6, x: -ROOM_W / 2 - 0.25, z: 0 }, // oeste
    { w: 0.5, h: WALL_H, d: ROOM_D + 0.6, x: ROOM_W / 2 + 0.25, z: 0 }, // este
    // Pared sur baja, con hueco central para la "puerta"
    { w: ROOM_W / 2 - 1.3, h: 0.9, d: 0.5, x: -ROOM_W / 4 - 0.65, z: ROOM_D / 2 + 0.25 },
    { w: ROOM_W / 2 - 1.3, h: 0.9, d: 0.5, x: ROOM_W / 4 + 0.65, z: ROOM_D / 2 + 0.25 },
  ];
  for (const spec of walls) {
    const wall = box(spec.w, spec.h, spec.d, wallMat, spec.x, spec.h / 2, spec.z, group);
    wall.castShadow = false;
    collider(colliders, spec.x, spec.z, spec.w / 2, spec.d / 2);
  }

  // Felpudo en la salida
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), lambert(0x9c2b2b));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0, 0.03, ROOM_D / 2 - 0.7);
  group.add(mat);

  // NPC
  const npc = makeVillager(place.npc.palette);
  const [nx, nz] = deco.npcPos;
  npc.position.set(nx, 0, nz);
  group.add(npc);

  const label = makeTextSprite(`${place.npc.name}`, { worldHeight: 0.55 });
  label.position.set(nx, 2.35, nz);
  group.add(label);

  const roleLabel = makeTextSprite(place.npc.role, {
    worldHeight: 0.4,
    bg: "rgba(217, 178, 58, 0.9)",
    color: "#1d1710",
  });
  roleLabel.position.set(nx, 2.85, nz);
  group.add(roleLabel);

  // Iluminación cálida propia del interior
  const lamp = new THREE.PointLight(0xffd9a0, 60, 40, 1.6);
  lamp.position.set(0, 4.2, 0);
  group.add(lamp);
  const fill = new THREE.PointLight(0xbfd8ff, 18, 30, 1.8);
  fill.position.set(0, 3.5, ROOM_D / 2 - 1);
  group.add(fill);

  group.visible = false;

  return {
    group,
    colliders,
    npc,
    labels: [label, roleLabel],
    npcPos: new THREE.Vector3(nx, 0, nz),
    spawn: new THREE.Vector3(0, 0, ROOM_D / 2 - 2),
    exit: new THREE.Vector3(0, 0, ROOM_D / 2 - 0.8),
    bounds: { w: ROOM_W, d: ROOM_D },
  };
}
