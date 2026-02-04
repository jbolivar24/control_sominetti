/* =========================
   SESSION
   ========================= */

const SESSION_DURATION = 1 * 60 * 1000; // 1 min (pruebas)
const WARNING_BEFORE   = 30 * 1000;     // aviso 30s antes

let sessionTimer = null;
let warningTimer = null;

function isSessionActive() {
  return sessionStorage.getItem("activeFile") === "true";
}

/*function startSessionTimer() {
  if (!isSessionActive()) return;

  clearTimeout(sessionTimer);
  clearTimeout(warningTimer);

  const warnIn = Math.max(0, SESSION_DURATION - WARNING_BEFORE);

  warningTimer = setTimeout(showSessionWarning, warnIn);
  sessionTimer = setTimeout(safeLogout, SESSION_DURATION);

  sessionStorage.setItem("sessionToken", Date.now().toString());
}*/

function showSessionWarning() {
  if (!isSessionActive()) return;
  document.getElementById("modalSession")?.classList.remove("hidden");
}

function extendSession() {
  document.getElementById("modalSession")?.classList.add("hidden");
  //startSessionTimer();
}

function forceEndSession() {
  clearTimeout(sessionTimer);
  clearTimeout(warningTimer);

  document.getElementById("modalSession")?.classList.add("hidden");

  sessionStorage.removeItem("sessionToken");
  sessionStorage.removeItem("activeFile");

  // 🔒 ocultar quick logout inmediatamente
  if (typeof updateQuickLogout === "function") updateQuickLogout();

  resetWelcomeFileInput?.();

  // ✅ Si estamos en index, mostramos bienvenida
  if (document.getElementById("screen-welcome")) {
    showWelcome();
  } else {
    // ✅ Si estamos en otra página, redirigimos al inicio
    window.location.href = "index.html";
  }
}

/* =========================
   ACTIVIDAD = RESET TIMER
   ========================= */
["click", "mousemove", "keydown", "touchstart"].forEach(evt => {
  document.addEventListener(evt, () => {
    if (isSessionActive()) {
      //startSessionTimer();
    }
  });
});

/* =========================
   CIERRE Y GUARDADO
   ========================= */
function safeLogout() {
  forceEndSession();
}

window.safeLogout = safeLogout;
window.forceEndSession = forceEndSession;
window.extendSession = extendSession;
