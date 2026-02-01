/* =========================
   NAVIGATION
   ========================= */

function showWelcome() {
  document.getElementById("screen-welcome")?.classList.add("active");
  document.getElementById("screen-app")?.classList.remove("active");

  resetWelcomeFileInput();
}

function showApp() {
  document.getElementById("screen-welcome")?.classList.remove("active");
  document.getElementById("screen-app")?.classList.add("active");
}

function resetWelcomeFileInput() {
  const input = document.getElementById("fileInputWelcome");
  if (input) {
    input.value = "";
  }
}
