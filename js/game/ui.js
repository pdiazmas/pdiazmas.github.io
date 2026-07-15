// ---------------------------------------------------------------------------
// Interfaz 2D sobre el canvas: intro, HUD, aviso de interacción, sistema de
// diálogo con máquina de escribir y controles táctiles (joystick virtual).
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);

let els = {};
let callbacks = {};
let dialogOpen = false;
let typeTimer = null;
let joyVector = { x: 0, z: 0 };
let currentNpc = null;

export function initUI(cb) {
  callbacks = cb;
  els = {
    intro: $("intro"),
    hud: $("hud"),
    progress: $("progress"),
    prompt: $("prompt"),
    dialog: $("dialog"),
    dialogName: $("dialog-name"),
    dialogRole: $("dialog-role"),
    dialogText: $("dialog-text"),
    dialogOptions: $("dialog-options"),
    fade: $("fade"),
    toast: $("toast"),
    touch: $("touch-controls"),
    joyBase: $("joy-base"),
    joyThumb: $("joy-thumb"),
    btnAction: $("btn-action"),
  };

  $("btn-start").addEventListener("click", () => {
    els.intro.classList.add("hidden");
    els.hud.hidden = false;
    callbacks.onStart?.();
  });

  $("btn-night").addEventListener("click", () => callbacks.onToggleNight?.());
  $("btn-help").addEventListener("click", () => {
    els.intro.classList.remove("hidden");
    $("btn-start").textContent = "▶ Seguir explorando";
  });

  els.prompt.addEventListener("click", () => callbacks.onInteract?.());

  // Controles táctiles
  if (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) {
    els.touch.hidden = false;
    setupJoystick();
    els.btnAction.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      callbacks.onInteract?.();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialogOpen) closeDialog();
  });
}

export function setNightButton(night) {
  $("btn-night").textContent = night ? "☀️" : "🌙";
  $("btn-night").title = night ? "Cambiar a día" : "Cambiar a noche";
}

// --------------------------------------------------------------------------
// Joystick virtual
// --------------------------------------------------------------------------

function setupJoystick() {
  const base = els.joyBase;
  const thumb = els.joyThumb;
  const RADIUS = 44;
  let pointerId = null;

  const reset = () => {
    pointerId = null;
    joyVector = { x: 0, z: 0 };
    thumb.style.transform = "translate(0px, 0px)";
  };

  base.addEventListener("pointerdown", (e) => {
    pointerId = e.pointerId;
    base.setPointerCapture(e.pointerId);
    move(e);
  });
  base.addEventListener("pointermove", (e) => {
    if (e.pointerId === pointerId) move(e);
  });
  base.addEventListener("pointerup", reset);
  base.addEventListener("pointercancel", reset);

  function move(e) {
    const rect = base.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    joyVector = { x: dx / RADIUS, z: dy / RADIUS };
  }
}

export function getJoystick() {
  return joyVector;
}

// --------------------------------------------------------------------------
// Aviso de interacción ("Pulsa E para...")
// --------------------------------------------------------------------------

export function showPrompt(text) {
  if (dialogOpen) return hidePrompt();
  els.prompt.innerHTML = `<span class="key">E</span> ${text}`;
  els.prompt.hidden = false;
}

export function hidePrompt() {
  els.prompt.hidden = true;
}

// --------------------------------------------------------------------------
// Sistema de diálogo
// --------------------------------------------------------------------------

export function isDialogOpen() {
  return dialogOpen;
}

export function openDialog(npc) {
  currentNpc = npc;
  dialogOpen = true;
  hidePrompt();
  els.dialog.hidden = false;
  els.dialogName.textContent = npc.name;
  els.dialogRole.textContent = npc.role;
  npc._answered = npc._answered || new Set();
  typeText(npc.greeting, () => showQuestions());
}

function typeText(text, onDone) {
  clearInterval(typeTimer);
  els.dialogOptions.innerHTML = "";
  els.dialogText.textContent = "";
  let i = 0;
  const finish = () => {
    clearInterval(typeTimer);
    els.dialogText.textContent = text;
    els.dialogText.onclick = null;
    onDone?.();
  };
  els.dialogText.onclick = finish;
  typeTimer = setInterval(() => {
    i += 2;
    els.dialogText.textContent = text.slice(0, i);
    if (i >= text.length) finish();
  }, 18);
}

function showQuestions() {
  const npc = currentNpc;
  els.dialogOptions.innerHTML = "";

  npc.questions.forEach((question) => {
    const btn = document.createElement("button");
    btn.className = "dialog-option" + (npc._answered.has(question.q) ? " asked" : "");
    btn.innerHTML = `<span class="q-icon">${npc._answered.has(question.q) ? "✓" : "❯"}</span> ${question.q}`;
    btn.addEventListener("click", () => {
      npc._answered.add(question.q);
      typeText(question.a, () => {
        if (question.links) renderLinks(question.links);
        addBackButton();
      });
    });
    els.dialogOptions.appendChild(btn);
  });

  const bye = document.createElement("button");
  bye.className = "dialog-option bye";
  bye.innerHTML = `<span class="q-icon">👋</span> Hasta luego`;
  bye.addEventListener("click", () => {
    typeText(npc.bye, () => setTimeout(closeDialog, 1200));
  });
  els.dialogOptions.appendChild(bye);
}

function renderLinks(links) {
  const row = document.createElement("div");
  row.className = "dialog-links";
  for (const link of links) {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "dialog-link";
    a.textContent = `${link.icon} ${link.label}`;
    row.appendChild(a);
  }
  els.dialogOptions.appendChild(row);
}

function addBackButton() {
  const back = document.createElement("button");
  back.className = "dialog-option back";
  back.innerHTML = `<span class="q-icon">↩</span> Preguntar otra cosa`;
  back.addEventListener("click", showQuestions);
  els.dialogOptions.appendChild(back);
}

export function closeDialog() {
  clearInterval(typeTimer);
  dialogOpen = false;
  els.dialog.hidden = true;
  currentNpc = null;
  callbacks.onDialogClose?.();
}

// --------------------------------------------------------------------------
// Progreso, toast y fundidos
// --------------------------------------------------------------------------

export function setProgress(visited, total) {
  els.progress.textContent = `🏠 ${visited}/${total} lugares`;
}

let toastTimer = null;
export function toast(text, ms = 4200) {
  els.toast.textContent = text;
  els.toast.hidden = false;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("show");
    setTimeout(() => (els.toast.hidden = true), 400);
  }, ms);
}

export function fade(toBlack) {
  return new Promise((resolve) => {
    els.fade.classList.toggle("active", toBlack);
    setTimeout(resolve, 380);
  });
}
