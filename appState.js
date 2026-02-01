/* =========================
   APP STATE WATCHER
   ========================= */

function enforceAppState() {
  if (!hasActiveData()) {
    showWelcome();
    return;
  }
  showApp();
}

function hasActiveData() {
  const activeFile = sessionStorage.getItem("activeFile");
  if (activeFile !== "true") return false;

  const user = getData("usuario");
  const ventas = getData("ventas");
  const gastos = getData("gastos");

  return (
    user &&
    Array.isArray(ventas) &&
    Array.isArray(gastos)
  );
}

setInterval(enforceAppState, 3000);

function resetWelcomeFileInput() {
  const input = document.getElementById("fileInputWelcome");
  if (input) {
    input.value = "";
  }
}
