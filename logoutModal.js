document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("modalLogout");
  if (!modal) return;

  document.getElementById("btnCancelLogout")
    ?.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

  document.getElementById("btnConfirmLogout")
  ?.addEventListener("click", () => {

    modal.classList.add("hidden");

    // 🔐 DESCARGA EN CLICK REAL
    if (typeof exportBackup === "function") {
      exportBackup();
    }

    // cerrar sesión inmediatamente
    forceEndSession();
  });
});
