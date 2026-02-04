/* =========================
   APP STATE WATCHER
   ========================= */

function enforceAppState() {
  if (!hasActiveData()) {
    showWelcome();
    if (typeof updateQuickLogout === "function") updateQuickLogout();
    return;
  }
  showApp();
  if (typeof updateQuickLogout === "function") updateQuickLogout();
}

function hasActiveData() {
  const activeFile = sessionStorage.getItem("activeFile");
  if (activeFile !== "true") return false;

  const user   = getData("usuario");
  const ventas = getData("ventas");
  const compras = getData("compras");

  const userOk =
    user &&
    typeof user === "object" &&
    !Array.isArray(user) &&
    (String(user.razonSocial || user.rut || "").trim().length > 0);

  return (
    userOk &&
    Array.isArray(ventas) &&
    Array.isArray(compras)
  );
}

setInterval(enforceAppState, 3000);

function resetWelcomeFileInput() {
  const input = document.getElementById("fileInputWelcome");
  if (input) input.value = "";
}

function updateQuickLogout() {
  const btn = document.querySelector(".quick-logout");
  if (!btn) return;

  const activo = sessionStorage.getItem("activeFile") === "true";
  btn.classList.toggle("hidden", !activo);
}
