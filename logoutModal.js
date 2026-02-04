document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("modalLogout");

  // Cancelar
  const btnCancel = document.getElementById("btnCancelLogout");
  if (btnCancel && modal) {
    btnCancel.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  // Confirmar cerrar sesión
  const btnConfirm = document.getElementById("btnConfirmLogout");
  if (btnConfirm && modal) {
    btnConfirm.addEventListener("click", async (event) => {

      const btn = event.currentTarget;
      btn.disabled = true;

      modal.classList.add("hidden");

      try {
        if (typeof exportBackup === "function") {
          exportBackup();              // respaldo local
          await sendBackupToServer();  // envío remoto
        }
      } catch (e) {
        console.warn("⚠️ Error enviando respaldo:", e);
      }

      forceEndSession();               // SIEMPRE cerrar
    });
  }
});
