// ---------------------------------------------------------------------------
// Villa Pau — currículum jugable en 3D.
// Motor: Three.js. Sin dependencias adicionales ni modelos externos.
// ---------------------------------------------------------------------------

import * as THREE from "three";
import { PLACES } from "./data.js";
import { makeVillager, animateVillager } from "./assets.js";
import { buildVillage, windowMat, WORLD_BOUNDS } from "./world.js";
import { buildInterior } from "./interiors.js";
import * as ui from "./ui.js";

// --------------------------------------------------------------------------
// Comprobación de WebGL
// --------------------------------------------------------------------------

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

if (!webglAvailable()) {
  document.getElementById("intro").classList.add("hidden");
  document.getElementById("webgl-error").hidden = false;
  throw new Error("WebGL no disponible");
}

// --------------------------------------------------------------------------
// Renderer, escena y cámara
// --------------------------------------------------------------------------

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 260);

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

// --------------------------------------------------------------------------
// Mundo, jugador e interiores
// --------------------------------------------------------------------------

const village = buildVillage();
scene.add(village.group);

const player = makeVillager({ shirt: 0x2f7d6d, pants: 0x33415c, skin: 0xf0c39b, hair: 0x3a2a1c });
player.position.set(0, 0, 15);
scene.add(player);

const interiors = new Map();
function getInterior(place) {
  if (!interiors.has(place.id)) {
    const interior = buildInterior(place);
    scene.add(interior.group);
    interiors.set(place.id, interior);
  }
  return interiors.get(place.id);
}

// --------------------------------------------------------------------------
// Estado del juego
// --------------------------------------------------------------------------

const state = {
  started: false,
  mode: "exterior", // "exterior" | "interior"
  place: null, // lugar actual cuando mode === "interior"
  night: localStorage.getItem("villapau.night") === "1",
  transitioning: false,
  target: null, // interactuable más cercano { type, ... }
};

const visited = new Set(JSON.parse(localStorage.getItem("villapau.visited") || "[]"));
const saveVisited = () =>
  localStorage.setItem("villapau.visited", JSON.stringify([...visited]));

for (const door of village.doors) {
  door.marker.userData.setVisited(visited.has(door.place.id));
}

// --------------------------------------------------------------------------
// Ambiente día / noche
// --------------------------------------------------------------------------

const DAY = {
  sky: new THREE.Color(0x8ec9e8),
  fog: new THREE.Color(0x9fd3ec),
  sun: 2.6,
  sunColor: new THREE.Color(0xfff3dd),
  hemi: 0.9,
  ambient: 0.35,
};
const NIGHT = {
  sky: new THREE.Color(0x0c1231),
  fog: new THREE.Color(0x101638),
  sun: 0.22,
  sunColor: new THREE.Color(0x8fa3ff),
  hemi: 0.18,
  ambient: 0.16,
};

const env = { t: state.night ? 1 : 0 };
const skyColor = new THREE.Color();
const fogColor = new THREE.Color();
scene.fog = new THREE.Fog(0x9fd3ec, 55, 150);

function applyEnvironment(dt) {
  const target = state.night ? 1 : 0;
  env.t = THREE.MathUtils.damp(env.t, target, 3, dt);
  const t = env.t;

  skyColor.lerpColors(DAY.sky, NIGHT.sky, t);
  fogColor.lerpColors(DAY.fog, NIGHT.fog, t);
  if (state.mode === "exterior") {
    scene.background = skyColor;
    scene.fog.color = fogColor;
  }
  village.sun.intensity = THREE.MathUtils.lerp(DAY.sun, NIGHT.sun, t);
  village.sun.color.lerpColors(DAY.sunColor, NIGHT.sunColor, t);
  village.hemi.intensity = THREE.MathUtils.lerp(DAY.hemi, NIGHT.hemi, t);
  ambient.intensity =
    state.mode === "interior"
      ? 0.35
      : THREE.MathUtils.lerp(DAY.ambient, NIGHT.ambient, t);
  village.stars.opacity = t;
  windowMat.emissiveIntensity = t * 0.9;
  for (const lamp of village.lamps) {
    lamp.light.intensity = t * 26;
    lamp.bulbMat.emissiveIntensity = t * 1.4;
  }
}

// --------------------------------------------------------------------------
// Entrada: teclado + joystick táctil
// --------------------------------------------------------------------------

const keys = new Set();
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if ((k === "e" || k === " " || k === "enter") && !ui.isDialogOpen()) {
    interact();
    if (k === " ") e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());

function moveInput() {
  let x = 0;
  let z = 0;
  if (keys.has("w") || keys.has("arrowup")) z -= 1;
  if (keys.has("s") || keys.has("arrowdown")) z += 1;
  if (keys.has("a") || keys.has("arrowleft")) x -= 1;
  if (keys.has("d") || keys.has("arrowright")) x += 1;
  const joy = ui.getJoystick();
  x += joy.x;
  z += joy.z;
  const len = Math.hypot(x, z);
  if (len > 1) {
    x /= len;
    z /= len;
  }
  return { x, z };
}

// --------------------------------------------------------------------------
// Colisiones (círculo del jugador contra cajas y círculos)
// --------------------------------------------------------------------------

const PLAYER_RADIUS = 0.5;

function resolveCollisions(pos, colliders) {
  for (const b of colliders.boxes) {
    const cx = THREE.MathUtils.clamp(pos.x, b.minX, b.maxX);
    const cz = THREE.MathUtils.clamp(pos.z, b.minZ, b.maxZ);
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < PLAYER_RADIUS * PLAYER_RADIUS) {
      if (d2 < 1e-9) {
        // Dentro de la caja: empuja por el eje de menor penetración
        const pushX = Math.min(pos.x - b.minX, b.maxX - pos.x);
        const pushZ = Math.min(pos.z - b.minZ, b.maxZ - pos.z);
        if (pushX < pushZ) {
          pos.x = pos.x - b.minX < b.maxX - pos.x ? b.minX - PLAYER_RADIUS : b.maxX + PLAYER_RADIUS;
        } else {
          pos.z = pos.z - b.minZ < b.maxZ - pos.z ? b.minZ - PLAYER_RADIUS : b.maxZ + PLAYER_RADIUS;
        }
      } else {
        const d = Math.sqrt(d2);
        const push = (PLAYER_RADIUS - d) / d;
        pos.x += dx * push;
        pos.z += dz * push;
      }
    }
  }
  for (const c of colliders.circles) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const r = PLAYER_RADIUS + c.r;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r && d2 > 1e-9) {
      const d = Math.sqrt(d2);
      pos.x += (dx / d) * (r - d);
      pos.z += (dz / d) * (r - d);
    }
  }
}

// --------------------------------------------------------------------------
// Interacción: puertas, NPCs y salidas
// --------------------------------------------------------------------------

const INTERACT_RANGE = 2.7;

function findTarget() {
  if (!state.started || state.transitioning || ui.isDialogOpen()) return null;
  const p = player.position;

  if (state.mode === "exterior") {
    let best = null;
    let bestDist = INTERACT_RANGE;
    for (const door of village.doors) {
      const dist = p.distanceTo(door.position);
      if (dist < bestDist) {
        bestDist = dist;
        best = { type: "door", door };
      }
    }
    return best;
  }

  const interior = getInterior(state.place);
  if (p.distanceTo(interior.npcPos) < INTERACT_RANGE) {
    return { type: "npc", interior };
  }
  if (p.distanceTo(interior.exit) < 1.6) {
    return { type: "exit" };
  }
  return null;
}

function interact() {
  const target = state.target;
  if (!target || state.transitioning) return;
  if (target.type === "door") enterPlace(target.door.place);
  else if (target.type === "exit") exitPlace();
  else if (target.type === "npc") talkTo(state.place, target.interior);
}

async function enterPlace(place) {
  state.transitioning = true;
  await ui.fade(true);

  village.group.visible = false;
  const interior = getInterior(place);
  interior.group.visible = true;

  state.mode = "interior";
  state.place = place;
  scene.background = new THREE.Color(0x14100e);
  scene.fog = null;

  player.position.copy(interior.spawn);
  player.rotation.y = Math.PI; // mirando al interior (-z)
  snapCamera();

  await ui.fade(false);
  state.transitioning = false;
}

async function exitPlace() {
  state.transitioning = true;
  await ui.fade(true);

  getInterior(state.place).group.visible = false;
  village.group.visible = true;

  const door = village.doors.find((d) => d.place.id === state.place.id);
  const away = new THREE.Vector3()
    .subVectors(door.position, new THREE.Vector3(state.place.position[0], 0, state.place.position[1]))
    .normalize();
  player.position.copy(door.position).addScaledVector(away, 0.8);
  player.rotation.y = Math.atan2(away.x, away.z);

  state.mode = "exterior";
  state.place = null;
  scene.fog = new THREE.Fog(fogColor.getHex(), 55, 150);
  snapCamera();

  await ui.fade(false);
  state.transitioning = false;
}

function talkTo(place, interior) {
  // El NPC se gira hacia el jugador
  interior.npc.lookAt(player.position.x, 0, player.position.z);
  player.lookAt(interior.npcPos.x, 0, interior.npcPos.z);

  if (!visited.has(place.id)) {
    visited.add(place.id);
    saveVisited();
    const door = village.doors.find((d) => d.place.id === place.id);
    door.marker.userData.setVisited(true);
    updateProgress();
    if (visited.size === PLACES.length) {
      setTimeout(
        () => ui.toast("🎉 ¡Has visitado todos los lugares de Villa Pau! Ya conoces a Pau mejor que nadie."),
        800
      );
    }
  }

  ui.openDialog(place.npc);
}

function updateProgress() {
  ui.setProgress(visited.size, PLACES.length);
}

// --------------------------------------------------------------------------
// Cámara en tercera persona
// --------------------------------------------------------------------------

const camOffset = new THREE.Vector3();
const camTargetPos = new THREE.Vector3();
const camLook = new THREE.Vector3();

function cameraOffsetFor() {
  // En diálogo: plano cercano "sobre el hombro" para ver bien al NPC
  if (ui.isDialogOpen()) return camOffset.set(2.4, 4.2, 5.2);
  if (state.mode === "interior") return camOffset.set(0, 6.8, 7.6);
  return camOffset.set(0, 10.5, 12);
}

function updateCamera(dt, snap = false) {
  cameraOffsetFor();
  camTargetPos.copy(player.position).add(camOffset);
  if (snap) {
    camera.position.copy(camTargetPos);
  } else {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, camTargetPos.x, 4, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, camTargetPos.y, 4, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camTargetPos.z, 4, dt);
  }
  camLook.copy(player.position);
  camLook.y += 1.4;
  camera.lookAt(camLook);
}

function snapCamera() {
  updateCamera(0, true);
}

// --------------------------------------------------------------------------
// Bucle principal
// --------------------------------------------------------------------------

const clock = new THREE.Clock();
const SPEED = 6.2;
let walkIntensity = 0;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  // Movimiento
  let moving = false;
  if (state.started && !ui.isDialogOpen() && !state.transitioning) {
    const input = moveInput();
    const len = Math.hypot(input.x, input.z);
    if (len > 0.08) {
      moving = true;
      player.position.x += input.x * SPEED * dt;
      player.position.z += input.z * SPEED * dt;
      const targetAngle = Math.atan2(input.x, input.z);
      let delta = targetAngle - player.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      player.rotation.y += delta * Math.min(1, dt * 14);
    }

    if (state.mode === "exterior") {
      resolveCollisions(player.position, village.colliders);
      player.position.x = THREE.MathUtils.clamp(player.position.x, -WORLD_BOUNDS, WORLD_BOUNDS);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -WORLD_BOUNDS, WORLD_BOUNDS);
    } else {
      const interior = getInterior(state.place);
      resolveCollisions(player.position, interior.colliders);
    }
  }

  walkIntensity = THREE.MathUtils.damp(walkIntensity, moving ? 1 : 0, 10, dt);
  animateVillager(player, time, walkIntensity);

  // Animaciones del mundo
  if (state.mode === "exterior") {
    const water = village.fountain;
    water.water.rotation.y = time * 0.4;
    water.water.position.y = 0.66 + Math.sin(time * 2.2) * 0.03;
    water.top.scale.setScalar(1 + Math.sin(time * 3) * 0.12);
    for (const cloud of village.clouds) {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 80) cloud.position.x = -80;
    }
    for (const door of village.doors) {
      door.marker.position.y = door.baseY + Math.sin(time * 2.6) * 0.18;
    }
  } else {
    const interior = getInterior(state.place);
    animateVillager(interior.npc, time + 3, 0);
    // Las etiquetas flotantes estorban en el primer plano del diálogo
    const showLabels = !ui.isDialogOpen();
    for (const label of interior.labels) label.visible = showLabels;
  }

  applyEnvironment(dt);
  updateCamera(dt);

  // Interacción disponible
  const target = findTarget();
  state.target = target;
  if (target) {
    if (target.type === "door") ui.showPrompt(target.door.prompt);
    else if (target.type === "npc") ui.showPrompt(`Hablar con ${state.place.npc.name}`);
    else ui.showPrompt("Salir a la plaza");
  } else {
    ui.hidePrompt();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// --------------------------------------------------------------------------
// Arranque
// --------------------------------------------------------------------------

ui.initUI({
  onStart: () => {
    state.started = true;
  },
  onInteract: interact,
  onToggleNight: () => {
    state.night = !state.night;
    localStorage.setItem("villapau.night", state.night ? "1" : "0");
    ui.setNightButton(state.night);
  },
  onDialogClose: () => {},
});

ui.setNightButton(state.night);
updateProgress();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

snapCamera();
tick();

// Gancho de depuración (accesible desde la consola del navegador)
window.__villa = {
  state,
  env,
  village,
  player,
  scene,
  camera,
  renderer,
  applyEnvironment,
  snapCamera,
};
